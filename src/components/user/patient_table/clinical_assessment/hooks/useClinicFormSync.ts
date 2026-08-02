import { useEffect } from 'react';
import { useClinicForm } from '@/redux/hook';
import {
  IClinicalRecord,
  ICultureResult,
  IImageResult,
  ILabResult,
} from '@/types/backend';
import { TestItem } from '@/types/types';
import { BIOCHEM_BACKEND_KEY_TO_ID } from '@/constants/canonicalLabRegistry';

interface SyncProps {
  clinicalRecord?: IClinicalRecord | null;
  labResults?: ILabResult[];
  cultureResults?: ICultureResult[];
  imageResults?: IImageResult[];
}

/**
 * Mirrors the four useEffect blocks that hydrate the clinicForm from
 * backend props.
 */
export function useClinicFormSync({
  clinicalRecord,
  labResults,
  cultureResults,
  imageResults,
}: SyncProps) {
  const { form: clinicForm, setForm } = useClinicForm();

  // Populate clinicalRecord from API, or reset when switching episodes
  useEffect(() => {
    if (clinicalRecord) {
      setForm((prev) => ({
        ...prev,
        clinicalRecord: {
          ...prev.clinicalRecord,
          onsetTiming: clinicalRecord.onsetTiming ?? '',
          bloodPressure: clinicalRecord.bloodPressure ?? '',
          heightCm: clinicalRecord.heightCm,
          weightKg: clinicalRecord.weightKg,
          bmi: clinicalRecord.bmi,
          fever: clinicalRecord.fever ?? false,
          pain: clinicalRecord.pain ?? false,
          erythema: clinicalRecord.erythema ?? false,
          swelling: clinicalRecord.swelling ?? false,
          sinusTract: clinicalRecord.sinusTract ?? false,
          hematogenousSuspected: clinicalRecord.hematogenousSuspected ?? false,
          pmmaAllergy: clinicalRecord.pmmaAllergy ?? false,
          suspectedTransmissionRoute: clinicalRecord.suspectedTransmissionRoute ?? '',
          softTissue: clinicalRecord.softTissue ?? '',
          implantStability: clinicalRecord.implantStability ?? '',
          generalExam: clinicalRecord.generalExam ?? '',
          surgicalDisease: clinicalRecord.surgicalDisease ?? '',
        },
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        clinicalRecord: {},
      }));
    }
  }, [clinicalRecord, setForm]);

  // Populate lab tests from API (JSONB arrays)
  useEffect(() => {
    if (labResults && labResults.length > 0) {
      const lab = labResults[0];
      setForm((prev) => {
        const mergeTests = (
          defaults: TestItem[],
          backendItems?: { id?: string; name: string; value?: number | null; unit: string; normalRange: string }[],
        ) => {
          if (!backendItems || backendItems.length === 0) return defaults;
          // Legacy backend rows can lack an id
          const usableItems = backendItems.filter((b) => typeof b.id === 'string' && b.id);
          //Biến mảng thành Map<id, item> để tra cứu nhanh. 
          const backendMap = new Map(usableItems.map((item) => [item.id as string, item]));
          const merged = defaults.map((d) => {
            const b = backendMap.get(d.id);
            if (b) {
              backendMap.delete(d.id);
              return {
                ...d,
                result: b.value != null ? String(b.value) : '',
                unit: b.unit || d.unit,
                normalRange: b.normalRange || d.normalRange,
              };
            }
            return d;
          });
          backendMap.forEach((b) => {
            merged.push({
              id: b.id as string,
              name: b.name,
              result: b.value != null ? String(b.value) : '',
              unit: b.unit,
              normalRange: b.normalRange,
            });
          });
          //Sau bước merge, những item còn lại trong backendMap là các test backend có nhưng không nằm trong defaults
          // (có thể là custom test bác sĩ thêm vào). Append chúng vào cuối danh sách.
          return merged;
        };

        const hTests = mergeTests(prev.hematologyTests, lab.hematologyTests as any);
        const fTests = mergeTests(prev.fluidAnalysis, lab.fluidAnalysis as any);

        let bTests = [...prev.biochemistryTests];
        if (lab.biochemicalData) {
          Object.entries(lab.biochemicalData).forEach(([key, val]) => {
            const metricId = BIOCHEM_BACKEND_KEY_TO_ID[key] || key;
            const numVal = (val as any)?.value;
            if (numVal != null) {
              bTests = bTests.map((t) => (t.id === metricId ? { ...t, result: String(numVal) } : t));
            }
          });
        }

        return { ...prev, hematologyTests: hTests, fluidAnalysis: fTests, biochemistryTests: bTests };
      });
    }
  }, [labResults, setForm]);

  // Populate culture results from API
  useEffect(() => {
    if (cultureResults && cultureResults.length > 0) {
      setForm((prev) => ({
        ...prev,
        cultureResults: cultureResults.map((c, idx) => ({
          ...c,
          _tempId: c.id?.toString() || Math.random().toString(36).substring(2, 11),
          sampleNumber: idx + 1,
          usedAntibioticBefore: false,
          daysOffAntibiotic: '' as '',
        })),
      }));
    }
  }, [cultureResults, setForm]);

  // Populate images from API
  useEffect(() => {
    if (imageResults && imageResults.length > 0) {
      setForm((prev) => {
        const newImages = imageResults
          // An ImageResult may intentionally contain findings without an
          // attached object. It should hydrate the description, not render as
          // a broken image thumbnail.
          .filter((img) => Boolean(img.url || img.bucket || img.objectKey || img.fileMetadata))
          .map((img) => {
            // Prefer the top-level `url` from the new backend response — it's a fresh
            // presigned URL valid for the configured expiry window.
            let url = img.url || '';
            let name = 'Hinh anh';
            if (!url && img.fileMetadata) {
              if (img.fileMetadata.startsWith('{')) {
                try {
                  const meta = JSON.parse(img.fileMetadata);
                  url = meta.url || meta.fileName || '';
                  name = meta.name || meta.originalName || name;
                } catch {
                  /* legacy plain-string fileMetadata */
                  url = img.fileMetadata;
                }
              } else {
                url = img.fileMetadata;
              }
            }
            return {
              id: img.id?.toString() || Math.random().toString(36).substring(2, 11),
              url,
              type: img.type || 'X-ray',
              name,
              // re-saves preserve the canonical identifier even if the
              // server-side URL has expired by then.
              bucket: img.bucket,
              objectKey: img.objectKey,
            };
          });
        return {
          ...prev,
          formImages: newImages,
          imagingDescription: imageResults[0]?.findings || prev.imagingDescription || '',
        };
      });
    }
  }, [imageResults, setForm]);

}
