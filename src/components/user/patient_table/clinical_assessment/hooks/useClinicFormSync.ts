import { useEffect } from 'react';
import { useClinicForm } from '@/redux/hook';
import {
  IClinicalRecord,
  ICultureResult,
  IImageResult,
  ILabResult,
} from '@/types/backend';
import { TestItem } from '@/types/types';

interface SyncProps {
  clinicalRecord?: IClinicalRecord | null;
  labResults?: ILabResult[];
  cultureResults?: ICultureResult[];
  imageResults?: IImageResult[];
}

/**
 * Mirrors the four useEffect blocks that hydrate the clinicForm from
 * backend props, plus the surgery/illness-onset acute-vs-chronic computation.
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
          illnessOnsetDate: clinicalRecord.illnessOnsetDate ?? '',
          bloodPressure: clinicalRecord.bloodPressure ?? '',
          bmi: clinicalRecord.bmi,
          fever: clinicalRecord.fever ?? false,
          pain: clinicalRecord.pain ?? false,
          erythema: clinicalRecord.erythema ?? false,
          swelling: clinicalRecord.swelling ?? false,
          sinusTract: clinicalRecord.sinusTract ?? false,
          hematogenousSuspected: clinicalRecord.hematogenousSuspected ?? false,
          pmmaAllergy: clinicalRecord.pmmaAllergy ?? false,
          suspectedInfectionType: clinicalRecord.suspectedInfectionType ?? '',
          softTissue: clinicalRecord.softTissue ?? '',
          implantStability: clinicalRecord.implantStability ?? '',
          prosthesisJoint: clinicalRecord.prosthesisJoint ?? '',
          daysSinceIndexArthroplasty: clinicalRecord.daysSinceIndexArthroplasty,
          notations: clinicalRecord.notations ?? '',
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
          backendItems?: { id: string; name: string; value?: number | null; unit: string; normalRange: string }[],
        ) => {
          if (!backendItems || backendItems.length === 0) return defaults;
          const backendMap = new Map(backendItems.map((item) => [item.id, item]));
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
              id: b.id,
              name: b.name,
              result: b.value != null ? String(b.value) : '',
              unit: b.unit,
              normalRange: b.normalRange,
            });
          });
          return merged;
        };

        const hTests = mergeTests(prev.hematologyTests, lab.hematologyTests as any);
        const fTests = mergeTests(prev.fluidAnalysis, lab.fluidAnalysis as any);

        let bTests = [...prev.biochemistryTests];
        if (lab.biochemicalData) {
          const mapping: Record<string, string> = {
            glucose: 'bc_4',
            ure: 'bc_5',
            creatinine: 'bc_6',
            eGFR: 'ht_20',
            albumin: 'bc_7',
            alb: 'bc_7',
            ast: 'bc_8',
            alt: 'bc_9',
            natri: 'bc_10',
            kali: 'bc_11',
            clo: 'bc_12',
            hba1c: 'bc_13',
          };
          Object.entries(lab.biochemicalData).forEach(([key, val]) => {
            const metricId = mapping[key] || key;
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
        const newImages = imageResults.map((img) => {
          let url = img.fileMetadata || '';
          let name = 'Hinh anh';
          if (img.fileMetadata && img.fileMetadata.startsWith('{')) {
            try {
              const meta = JSON.parse(img.fileMetadata);
              url = meta.url || meta.fileName || url;
              name = meta.name || meta.originalName || name;
            } catch {
              /* ignore parse error */
            }
          }
          return {
            id: img.id?.toString() || Math.random().toString(36).substring(2, 11),
            url,
            type: img.type || 'X-ray',
            name,
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

  // isAcute logic
  useEffect(() => {
    if (clinicForm.surgeryDate && clinicForm.clinicalRecord.illnessOnsetDate) {
      const surgery = new Date(clinicForm.surgeryDate);
      const symptom = new Date(clinicForm.clinicalRecord.illnessOnsetDate);
      const diffTime = Math.abs(symptom.getTime() - surgery.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const isAcute = diffDays < 21;
      if (clinicForm.isAcute !== isAcute) {
        setForm((prev) => ({ ...prev, isAcute }));
      }
    }
  }, [clinicForm.surgeryDate, clinicForm.clinicalRecord.illnessOnsetDate, clinicForm.isAcute, setForm]);
}
