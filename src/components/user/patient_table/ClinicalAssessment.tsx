import React, { useEffect, useState } from 'react';
import { useDemographics, useClinical } from '@/redux/hook';
import { ILabResult, IClinicalRecord, ICultureResult, IImageResult } from '@/types/backend';
import { ClinicalAssessment } from '@/types/types';
import { callUploadImage } from '@/apis/api';

interface ClinicalAssessmentProps {
  onNext?: () => void;
  onPrev?: () => void;
  mode?: 'wizard' | 'standalone';
  labResults?: ILabResult[];
  clinicalRecord?: IClinicalRecord | null;
  cultureResults?: ICultureResult[];
  imageResults?: IImageResult[];
}

/** Map API ILabResult into the form's TestItem arrays */
export function mapLabResultToClinical(lab: ILabResult): Partial<ClinicalAssessment> {
  const setVal = (tests: ClinicalAssessment['hematologyTests'], name: string, value?: number) => {
    return tests.map(t => t.name.toLowerCase() === name.toLowerCase()
      ? { ...t, result: value != null ? String(value) : '' }
      : t
    );
  };

  return {
    hematologyTests: (prev: ClinicalAssessment['hematologyTests']) => {
      let tests = [...prev];
      if (lab.wbcBlood?.value != null) tests = setVal(tests, 'wbc', lab.wbcBlood.value);
      if (lab.neut?.value != null) tests = setVal(tests, '%NEUT', lab.neut.value);
      if (lab.mono?.value != null) tests = setVal(tests, '%MONO', lab.mono.value);
      if (lab.esr?.value != null) tests = setVal(tests, 'Máu lắng', lab.esr.value);
      if (lab.rbc?.value != null) tests = setVal(tests, 'RBC', lab.rbc.value);
      if (lab.mcv?.value != null) tests = setVal(tests, 'MCV', lab.mcv.value);
      if (lab.mch?.value != null) tests = setVal(tests, 'MCH', lab.mch.value);
      if (lab.rdw?.value != null) tests = setVal(tests, 'RDW-CV', lab.rdw.value);
      if (lab.ig?.value != null) tests = setVal(tests, 'IG%', lab.ig.value);
      return tests;
    },
    fluidAnalysis: (prev: ClinicalAssessment['fluidAnalysis']) => {
      let tests = [...prev];
      if (lab.synovialWbc?.value != null) tests = setVal(tests, 'Bạch cầu (Dịch)', lab.synovialWbc.value);
      if (lab.crp?.value != null) tests = setVal(tests, 'Định lượng CRP (Dịch)', lab.crp.value);
      if (lab.synovialPmn?.value != null) tests = setVal(tests, '%PMN (Dịch)', lab.synovialPmn.value);
      return tests;
    },
    biochemistryTests: (prev: ClinicalAssessment['biochemistryTests']) => {
      let tests = [...prev];
      if (lab.biochemicalData) {
        const mapping: Record<string, string> = {
          'glucose': 'bc_4',
          'ure': 'bc_5',
          'creatinine': 'bc_6',
          'eGFR': 'ht_20',
          'albumin': 'bc_7',
          'alb': 'bc_7',
          'ast': 'bc_8',
          'alt': 'bc_9',
          'natri': 'bc_10',
          'kali': 'bc_11',
          'clo': 'bc_12',
          'hba1c': 'bc_13'
        };
        Object.entries(lab.biochemicalData).forEach(([key, val]) => {
          const metricId = mapping[key] || key;
          const numVal = (val as any)?.value;
          if (numVal != null) {
            tests = tests.map(t => t.id === metricId ? { ...t, result: String(numVal) } : t);
          }
        });
      }
      return tests;
    },
  } as any;
}

export function mapClinicalRecordToClinical(cr: IClinicalRecord): Partial<ClinicalAssessment> {
  return {
    symptoms: {
      fever: cr.fever ?? false,
      sinusTract: cr.sinusTract ?? false,
      erythema: cr.erythema ?? false,
      pain: cr.pain ?? false,
      swelling: cr.swelling ?? false,
      hematogenousSuspected: cr.hematogenousSuspected ?? false,
      pmmaAllergy: cr.pmmaAllergy ?? false,
    },
    examination: {
      date_on_illness: cr.illnessOnsetDate ?? '',
      whole_body: '',
      vessel: '',
      temperature: '',
      blood_press: cr.bloodPressure ?? '',
      breath: '',
      bmi: cr.bmi ?? '',
      suspectedInfectionType: cr.suspectedInfectionType ?? '',
      softTissue: cr.softTissue ?? '',
      implantStability: cr.implantStability ?? '',
      prosthesisJoint: cr.prosthesisJoint ?? '',
      daysSinceIndexArthroplasty: cr.daysSinceIndexArthroplasty ?? '',
      notations: cr.notations ?? '',
      hematogenousSuspected: cr.hematogenousSuspected ?? false,
      pmmaAllergy: cr.pmmaAllergy ?? false,
    },
  };
}

export const ClinicalAssessmentPage: React.FC<ClinicalAssessmentProps> = ({ onNext, onPrev, mode = 'wizard', labResults, clinicalRecord, cultureResults, imageResults }) => {
  const { demographics, setDemographics } = useDemographics();
  const { clinical, setClinical } = useClinical();
  const [uploading, setUploading] = useState(false);

  // Populate form from API data
  useEffect(() => {
    if (clinicalRecord) {
      const mapped = mapClinicalRecordToClinical(clinicalRecord);
      setClinical(prev => ({
        ...prev,
        ...mapped,
        symptoms: { ...prev.symptoms, ...mapped.symptoms },
        examination: { ...prev.examination, ...mapped.examination },
      }));
      // Set symptomDate from clinical record
      if (clinicalRecord.illnessOnsetDate) {
        setDemographics(prev => ({ ...prev, symptomDate: clinicalRecord.illnessOnsetDate! }));
      }
    }
  }, [clinicalRecord]);

  useEffect(() => {
    if (labResults && labResults.length > 0) {
      const lab = labResults[0]; // Use the latest lab result
      setClinical(prev => {
        const mapped = mapLabResultToClinical(lab);
        return {
          ...prev,
          hematologyTests: typeof mapped.hematologyTests === 'function'
            ? (mapped.hematologyTests as any)(prev.hematologyTests)
            : prev.hematologyTests,
          fluidAnalysis: typeof mapped.fluidAnalysis === 'function'
            ? (mapped.fluidAnalysis as any)(prev.fluidAnalysis)
            : prev.fluidAnalysis,
          biochemistryTests: typeof mapped.biochemistryTests === 'function'
            ? (mapped.biochemistryTests as any)(prev.biochemistryTests)
            : prev.biochemistryTests,
        };
      });
    }
  }, [labResults]);

  useEffect(() => {
    if (cultureResults && cultureResults.length > 0) {
      setClinical(prev => {
        const newSamples = cultureResults.map((c, idx) => ({
          id: c.id?.toString() || Math.random().toString(36).substr(2, 9),
          sampleNumber: idx + 1,
          bacteriaName: c.name || '',
          incubation_days: c.incubationDays ?? ('' as any),
          result: (c.result as any) || '',
          notes: c.notes || '',
          used_antibiotic_before: false,
          days_off_antibiotic: '' as any,
          gram_type: c.gramType || '',
        }));
        return {
          ...prev,
          cultureSamples: newSamples
        };
      });
    }
  }, [cultureResults]);

  useEffect(() => {
    if (imageResults && imageResults.length > 0) {
      setClinical(prev => {
        const newImages = imageResults.map(img => {
          let url = img.fileMetadata || '';
          let name = 'Hình ảnh';
          if (img.fileMetadata && img.fileMetadata.startsWith('{')) {
            try {
              const meta = JSON.parse(img.fileMetadata);
              url = meta.url || meta.fileName || url;
              name = meta.name || meta.originalName || name;
            } catch { }
          }
          return {
            id: img.id?.toString() || Math.random().toString(36).substr(2, 9),
            url: url,
            type: (img.type as any) || 'X-ray',
            name: name,
          };
        });
        return {
          ...prev,
          imaging: {
            ...prev.imaging,
            images: newImages,
            description: imageResults[0]?.findings || prev.imaging?.description || ''
          }
        };
      });
    }
  }, [imageResults]);

  // Logic: ICM 2018 Scoring
  useEffect(() => {
    if (demographics.surgeryDate && demographics.symptomDate) {
      const surgery = new Date(demographics.surgeryDate);
      const symptom = new Date(demographics.symptomDate);
      const diffTime = Math.abs(symptom.getTime() - surgery.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const isAcute = diffDays < 21; // 3 weeks
      if (demographics.isAcute !== isAcute) {
        setDemographics(prev => ({ ...prev, isAcute }));
      }
    }
  }, [demographics.surgeryDate, demographics.symptomDate, demographics.isAcute, setDemographics]);


  const getTestStatus = (result: string, normalRange: string) => {
    if (!result || !normalRange) return null;
    const resVal = parseFloat(result);
    if (isNaN(resVal)) return null;

    // Handle "min - max"
    if (normalRange.includes('-')) {
      const parts = normalRange.split('-').map(p => parseFloat(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        if (resVal < parts[0]) return 'L';
        if (resVal > parts[1]) return 'H';
        return null;
      }
    }

    // Handle "< max"
    if (normalRange.trim().startsWith('<')) {
      const max = parseFloat(normalRange.replace('<', '').trim());
      if (!isNaN(max) && resVal > max) return 'H';
    }

    // Handle "> min"
    if (normalRange.trim().startsWith('>')) {
      const min = parseFloat(normalRange.replace('>', '').trim());
      if (!isNaN(min) && resVal < min) return 'L';
    }

    return null;
  };


  return (
    <>
      {mode === 'wizard' && (
        <header className="flex-shrink-0 bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-slate-800 text-md font-mono bg-slate-100 px-2 py-0.5 rounded">Dữ liệu xét nghiệm</span>
            </div>
            <button className="text-slate-900 bg-green-400 mt-1 flex items-center gap-2 rounded font-mono px-2 py-1 font-bold hover:bg-cyan-400">
              <span className="material-symbols-outlined text-md">accessibility_new</span>
              Import nhanh
            </button>
          </div>
        </header>
      )}

      <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
        <div className="max-w-7xl mx-auto h-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* LEFT COLUMN: INPUTS */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6 pb-20">

              {/* 0.1 Symptoms Checklist */}
              <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                  <h3 className="text-slate-900 font-bold text-lg flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">1</span>
                    Triệu chứng & Khám lâm sàng
                  </h3>
                </div>
                <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { key: 'fever', label: 'Sốt' },
                    { key: 'sinusTract', label: 'Đường rò' },
                    { key: 'erythema', label: 'Tấy đỏ' },
                    { key: 'pain', label: 'Đau' },
                    { key: 'swelling', label: 'Sưng nề' },
                    { key: 'pmmaAllergy', label: 'Dị ứng PMMA' },
                    { key: 'hematogenousSuspected', label: 'Nhiễm trùng huyết' },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={clinical.symptoms?.[item.key as keyof typeof clinical.symptoms] || false}
                        onChange={() => setClinical(prev => ({
                          ...prev,
                          symptoms: {
                            ...prev.symptoms,
                            [item.key]: !prev.symptoms[item.key as keyof typeof prev.symptoms]
                          }
                        }))}

                        className="w-5 h-5 rounded border-slate-300 accent-primary"
                      />
                      <span className="text-sm font-medium text-slate-700">{item.label}</span>
                    </label>
                  ))}
                </div>

              </section>

              {/* 0.2 Clinical Examination */}
              <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                  <h3 className="text-slate-900 font-bold text-lg flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">1.1</span>
                    Khám lâm sàng chi tiết
                  </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-slate-700">Ngày khởi phát triệu chứng</span>
                    <input
                      type="date"
                      value={demographics.symptomDate}
                      onChange={(e) => setDemographics(prev => ({ ...prev, symptomDate: e.target.value }))}
                      className="w-full rounded-lg border-slate-300 h-11 px-3 border"
                    />
                    <span className="text-xs text-slate-500">
                      Phân loại: <span className={`font-bold ${demographics.isAcute ? 'text-danger' : 'text-warning'}`}>{demographics.isAcute ? 'CẤP TÍNH (<3 tuần)' : 'MÃN TÍNH (>3 tuần)'}</span>
                    </span>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-slate-700">BMI</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ví dụ: 25.71"
                      value={clinical.examination?.bmi !== undefined ? clinical.examination.bmi : ''}
                      onChange={(e) => setClinical(prev => ({ ...prev, examination: { ...prev.examination, bmi: e.target.value ? Number(e.target.value) : '' } as any }))}
                      className="w-full rounded-lg border-slate-300 h-11 px-3 border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-slate-700">Loại nhiễm trùng nghi ngờ</span>
                    <input
                      type="text"
                      placeholder="Ví dụ: cấp tính sau phẫu thuật"
                      value={clinical.examination?.suspectedInfectionType || ''}
                      onChange={(e) => setClinical(prev => ({ ...prev, examination: { ...prev.examination, suspectedInfectionType: e.target.value } as any }))}
                      className="w-full rounded-lg border-slate-300 h-11 px-3 border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-slate-700">Tình trạng mô mềm</span>
                    <input
                      type="text"
                      placeholder="Ví dụ:"
                      value={clinical.examination?.softTissue || ''}
                      onChange={(e) => setClinical(prev => ({ ...prev, examination: { ...prev.examination, softTissue: e.target.value } as any }))}
                      className="w-full rounded-lg border-slate-300 h-11 px-3 border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-slate-700">Độ ổn định cấy ghép</span>
                    <select
                      value={clinical.examination?.implantStability || ''}
                      onChange={(e) => setClinical(prev => ({ ...prev, examination: { ...prev.examination, implantStability: e.target.value } as any }))}
                      className="w-full rounded-lg border-slate-300 h-11 px-3 focus:ring-primary focus:border-primary border"
                    >
                      <option value="" disabled>Chọn tình trạng</option>
                      <option value="stable">Ổn định</option>
                      <option value="loose">Lỏng lẻo</option>
                      <option value="slightly_loose">Hơi lỏng lẻo</option>
                      <option value="unknown">Chưa rõ</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-slate-700">Số ngày từ lần thay khớp đầu</span>
                    <input
                      type="number"
                      placeholder="Ví dụ: 70"
                      value={clinical.examination?.daysSinceIndexArthroplasty !== undefined ? clinical.examination.daysSinceIndexArthroplasty : ''}
                      onChange={(e) => setClinical(prev => ({ ...prev, examination: { ...prev.examination, daysSinceIndexArthroplasty: e.target.value ? Number(e.target.value) : '' } as any }))}
                      className="w-full rounded-lg border-slate-300 h-11 px-3 border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </label>
                  <label className="flex flex-col col-span-3 gap-1.5">
                    <span className="text-sm font-medium text-slate-700">Khớp nhân tạo</span>
                    <input
                      type="text"
                      placeholder="Ví du: Miêu tả về vị trí khớp, có phải mổ lại không, phương pháp cố định..."
                      value={clinical.examination?.prosthesisJoint || ''}
                      onChange={(e) => setClinical(prev => ({ ...prev, examination: { ...prev.examination, prosthesisJoint: e.target.value } as any }))}
                      className="w-full rounded-lg border-slate-300 h-11 px-3 border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </label>

                  <label className="flex flex-col col-span-3 gap-1.5">
                    <span className="text-sm font-medium text-slate-700">Khám bệnh toàn thân</span>
                    <input
                      type="text"
                      placeholder="Ví dụ: Tỉnh táo, tiếp xúc tốt..."
                      value={clinical.examination?.notations || ''}
                      onChange={(e) => setClinical(prev => ({ ...prev, examination: { ...prev.examination, notations: e.target.value } as any }))}
                      className="w-full rounded-lg border-slate-300 h-11 px-3 border"
                    />
                  </label>
                </div>
              </section>

              {/* 3. PJI Diagnostic Tests */}
              <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                  <h3 className="text-slate-900 font-bold text-lg flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">2</span>
                    Xét nghiệm chẩn đoán PJI
                  </h3>
                </div>

                {/* 2.1 Hematology Tests */}
                <div className="border-b border-slate-200">
                  <div className="bg-gradient-to-r from-blue-50 to-slate-50 px-6 py-3 border-b border-blue-100">
                    <h4 className="text-blue-900 font-bold text-base flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded bg-blue-500/10 text-blue-600 text-xs font-bold">1</span>
                      Xét nghiệm huyết học
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-700">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 border-r border-slate-200">Tên xét nghiệm</th>
                          <th className="px-4 py-3 border-r border-slate-200 w-32">Kết quả</th>
                          <th className="px-4 py-3 border-r border-slate-200 w-16 text-center">Ghi chú</th>
                          <th className="px-4 py-3 border-r border-slate-200 w-32">Chỉ số BT</th>
                          <th className="px-4 py-3">Đơn vị</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {clinical.hematologyTests?.map((test, index) => (
                          <tr key={test.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2 font-medium text-slate-900 border-r border-slate-200">{test.name}</td>
                            <td className="px-4 py-2 border-r border-slate-200 p-0">
                              <input
                                type="text"
                                value={test.result}
                                onChange={(e) => {
                                  const newTests = clinical.hematologyTests.map((t, i) =>
                                    i === index ? { ...t, result: e.target.value } : t
                                  );
                                  setClinical(prev => ({ ...prev, hematologyTests: newTests }));
                                }}
                                className="w-full h-full px-4 py-2 border-none bg-transparent focus:ring-inset focus:ring-2 focus:ring-primary outline-none"
                              />
                            </td>
                            <td className="px-4 py-2 border-r border-slate-200 text-center font-bold">
                              {(() => {
                                const status = getTestStatus(test.result, test.normalRange);
                                return status ? (
                                  <span className={status === 'H' ? 'text-red-600 font-bold' : 'text-yellow-600 font-bold'}>
                                    {status}
                                  </span>
                                ) : null;
                              })()}
                            </td>
                            <td className="px-4 py-2 border-r border-slate-200 text-slate-700">{test.normalRange}</td>
                            <td className="px-4 py-2 text-slate-500 bg-slate-50/30">{test.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2.2 Biochemistry Tests */}
                <div className="border-b border-slate-200">
                  <div className="bg-gradient-to-r from-green-50 to-slate-50 px-6 py-3 border-b border-green-100">
                    <h4 className="text-green-900 font-bold text-base flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded bg-green-500/10 text-green-600 text-xs font-bold">2</span>
                      Xét nghiệm sinh hoá
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-700">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 border-r border-slate-200">Tên xét nghiệm</th>
                          <th className="px-4 py-3 border-r border-slate-200 w-32">Kết quả</th>
                          <th className="px-4 py-3 border-r border-slate-200 w-16 text-center">Ghi chú</th>
                          <th className="px-4 py-3 border-r border-slate-200 w-32">Chỉ số BT</th>
                          <th className="px-4 py-3">Đơn vị</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {clinical.biochemistryTests?.map((test, index) => (
                          <tr key={test.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2 font-medium text-slate-900 border-r border-slate-200">{test.name}</td>
                            <td className="px-4 py-2 border-r border-slate-200 p-0">
                              <input
                                type="text"
                                value={test.result}
                                onChange={(e) => {
                                  const newValue = e.target.value;
                                  let newTests = clinical.biochemistryTests.map((t, i) =>
                                    i === index ? { ...t, result: newValue } : t
                                  );
                                  // If the user is modifying Creatinine (bc_6), auto-calculate eGFR (ht_20)
                                  if (test.id === 'bc_6') {
                                    const egfrIndex = newTests.findIndex(t => t.id === 'ht_20');
                                    if (egfrIndex !== -1) {
                                      let egfrResult = '';
                                      if (newValue && !isNaN(Number(newValue))) {
                                        let age = 0;
                                        if (demographics.dob) {
                                          const dobDate = new Date(demographics.dob);
                                          const today = new Date();
                                          age = today.getFullYear() - dobDate.getFullYear();
                                          const m = today.getMonth() - dobDate.getMonth();
                                          if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
                                            age--;
                                          }
                                        }

                                        if (age > 0) {
                                          const scrUmolL = Number(newValue);
                                          const scr = scrUmolL / 88.4; // µmol/L to mg/dL

                                          const isFemale = demographics.gender === 'female';
                                          const k = isFemale ? 0.7 : 0.9;
                                          const alpha = isFemale ? -0.241 : -0.302;

                                          const scrDivK = scr / k;
                                          const minVal = Math.min(scrDivK, 1);
                                          const maxVal = Math.max(scrDivK, 1);

                                          let egfr = 142 * Math.pow(minVal, alpha) * Math.pow(maxVal, -1.200) * Math.pow(0.9938, age);
                                          if (isFemale) egfr = egfr * 1.012;

                                          egfrResult = Math.round(egfr).toString();
                                        }
                                      }
                                      newTests = newTests.map((t, i) =>
                                        i === egfrIndex ? { ...t, result: egfrResult } : t
                                      );
                                    }
                                  }

                                  setClinical(prev => ({ ...prev, biochemistryTests: newTests }));
                                }}
                                className="w-full h-full px-4 py-2 border-none bg-transparent focus:ring-inset focus:ring-2 focus:ring-primary outline-none"
                              />
                            </td>
                            <td className="px-4 py-2 border-r border-slate-200 text-center font-bold">
                              {(() => {
                                const status = getTestStatus(test.result, test.normalRange);
                                return status ? (
                                  <span className={status === 'H' ? 'text-red-600 font-bold' : 'text-yellow-600 font-bold'}>
                                    {status}
                                  </span>
                                ) : null;
                              })()}
                            </td>
                            <td className="px-4 py-2 border-r border-slate-200 text-slate-700">{test.normalRange}</td>
                            <td className="px-4 py-2 text-slate-500 bg-slate-50/30">{test.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>


                {/* 2.3 Xét nghiệm vi sinh */}
                <div>
                  <div className="bg-gradient-to-r from-amber-50 to-slate-50 px-6 py-3 border-b border-amber-100">
                    <h4 className="text-amber-900 font-bold text-base flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded bg-amber-500/10 text-amber-600 text-xs font-bold">3</span>
                      Xét nghiệm vi sinh
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-700">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 border-r border-slate-200">Tên xét nghiệm</th>
                          <th className="px-4 py-3 border-r border-slate-200 ">Kết quả</th>
                          <th className="px-4 py-3 border-r border-slate-200 w-32">Chỉ số BT</th>
                          <th className="px-4 py-3">Đơn vị</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {clinical.fluidAnalysis?.map((test, index) => {
                          if (test.name === 'Nhuộm Gram') return null;
                          return (
                          <tr key={test.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2 font-medium text-slate-900 border-r border-slate-200">{test.name}</td>
                            <td className="px-4 py-2 border-r border-slate-200 p-0">
                              {test.name === 'Cấy khuẩn' ? (
                                <div className="p-4 space-y-4">
                                  {clinical.cultureSamples?.map((sample, sampleIdx) => (
                                    <div key={sample.id || sampleIdx} className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm flex flex-col gap-4">
                                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <span className="font-bold text-slate-800 text-sm">Mẫu {sample.sampleNumber}</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newSamples = clinical.cultureSamples.filter((_, idx) => idx !== sampleIdx);
                                            // Re-number remaining samples
                                            const renumbered = newSamples.map((s, idx) => ({ ...s, sampleNumber: idx + 1 }));
                                            setClinical(prev => ({ ...prev, cultureSamples: renumbered }));
                                          }}
                                          className="text-red-500 hover:text-red-700 text-xs font-semibold flex items-center gap-1"
                                        >
                                          <span className="material-symbols-outlined text-[16px]">delete</span>
                                          Xoá
                                        </button>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                          <label className="text-xs font-semibold text-slate-700">Kết quả</label>
                                          <select
                                            value={sample.result || ''}
                                            onChange={(e) => {
                                              const newSamples = [...clinical.cultureSamples];
                                              newSamples[sampleIdx] = { ...newSamples[sampleIdx], result: e.target.value as any };
                                              setClinical(prev => ({ ...prev, cultureSamples: newSamples }));
                                            }}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                                          >
                                            <option value="">-- Chọn kết quả --</option>
                                            <option value="POSITIVE">Dương tính (POSITIVE)</option>
                                            <option value="NEGATIVE">Âm tính (NEGATIVE)</option>
                                            <option value="CONTAMINATED">Nhiễm bẩn (CONTAMINATED)</option>
                                            <option value="PENDING">Đang chờ (PENDING)</option>
                                          </select>
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                          <label className="text-xs font-semibold text-slate-700">Tên vi khuẩn</label>
                                          <input
                                            type="text"
                                            value={sample.bacteriaName || ''}
                                            onChange={(e) => {
                                              const newSamples = [...clinical.cultureSamples];
                                              newSamples[sampleIdx] = { ...newSamples[sampleIdx], bacteriaName: e.target.value };
                                              setClinical(prev => ({ ...prev, cultureSamples: newSamples }));
                                            }}
                                            placeholder="Nhập tên vi khuẩn..."
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                                          />
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                          <label className="text-xs font-semibold text-slate-700">Nhuộm Gram</label>
                                          <select
                                            value={sample.gram_type || ''}
                                            onChange={(e) => {
                                              const newSamples = [...clinical.cultureSamples];
                                              newSamples[sampleIdx] = { ...newSamples[sampleIdx], gram_type: e.target.value };
                                              setClinical(prev => ({ ...prev, cultureSamples: newSamples }));
                                            }}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                                          >
                                            <option value="">-- Chọn loại --</option>
                                            <option value="Gram Dương">Gram Dương</option>
                                            <option value="Gram Âm">Gram Âm</option>
                                            <option value="Chưa rõ">Chưa rõ</option>
                                          </select>
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                          <label className="text-xs font-semibold text-slate-700">Số ngày ủ (incubation_days)</label>
                                          <input
                                            type="number"
                                            value={sample.incubation_days !== undefined ? sample.incubation_days : ''}
                                            onChange={(e) => {
                                              const newSamples = [...clinical.cultureSamples];
                                              newSamples[sampleIdx] = { ...newSamples[sampleIdx], incubation_days: e.target.value === '' ? '' : Number(e.target.value) };
                                              setClinical(prev => ({ ...prev, cultureSamples: newSamples }));
                                            }}
                                            placeholder="Ví dụ: 3"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                                          />
                                        </div>

                                        <div className="flex flex-col justify-center pt-5">
                                          <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                              type="checkbox"
                                              checked={sample.used_antibiotic_before || false}
                                              onChange={(e) => {
                                                const newSamples = [...clinical.cultureSamples];
                                                newSamples[sampleIdx] = { ...newSamples[sampleIdx], used_antibiotic_before: e.target.checked };
                                                setClinical(prev => ({ ...prev, cultureSamples: newSamples }));
                                              }}
                                              className="w-4 h-4 accent-primary rounded border-slate-300"
                                            />
                                            <span className="text-sm font-medium text-slate-700">Đã dùng KS trước đó</span>
                                          </label>
                                        </div>

                                        {sample.used_antibiotic_before && (
                                          <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-semibold text-slate-700">Số ngày ngưng KS (days_off_antibiotic)</label>
                                            <input
                                              type="number"
                                              value={sample.days_off_antibiotic !== undefined ? sample.days_off_antibiotic : ''}
                                              onChange={(e) => {
                                                const newSamples = [...clinical.cultureSamples];
                                                newSamples[sampleIdx] = { ...newSamples[sampleIdx], days_off_antibiotic: e.target.value === '' ? '' : Number(e.target.value) };
                                                setClinical(prev => ({ ...prev, cultureSamples: newSamples }));
                                              }}
                                              placeholder="Ví dụ: 7"
                                              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                                            />
                                          </div>
                                        )}

                                        <div className={`flex flex-col gap-1.5 ${sample.used_antibiotic_before ? '' : 'md:col-span-2'}`}>
                                          <label className="text-xs font-semibold text-slate-700">Ghi chú (notes)</label>
                                          <input
                                            type="text"
                                            value={sample.notes || ''}
                                            onChange={(e) => {
                                              const newSamples = [...clinical.cultureSamples];
                                              newSamples[sampleIdx] = { ...newSamples[sampleIdx], notes: e.target.value };
                                              setClinical(prev => ({ ...prev, cultureSamples: newSamples }));
                                            }}
                                            placeholder="Ghi chú thêm..."
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  ))}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newSample = {
                                        id: Math.random().toString(36).substr(2, 9),
                                        sampleNumber: (clinical.cultureSamples?.length || 0) + 1,
                                        bacteriaName: '',
                                        incubation_days: '' as '',
                                        used_antibiotic_before: false,
                                        days_off_antibiotic: '' as '',
                                        notes: '',
                                        result: '' as any,
                                        gram_type: ''
                                      };
                                      setClinical(prev => ({
                                        ...prev,
                                        cultureSamples: [...(prev.cultureSamples || []), newSample]
                                      }));
                                    }}
                                    className="w-full py-2 border-2 border-dashed border-primary/50 text-primary hover:bg-primary/5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors mt-2"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                    Thêm mẫu vi khuẩn mới
                                  </button>
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  value={test.result}
                                  onChange={(e) => {
                                    const newTests = (clinical.fluidAnalysis || []).map((t, i) =>
                                      i === index ? { ...t, result: e.target.value } : t
                                    );
                                    setClinical(prev => ({ ...prev, fluidAnalysis: newTests }));
                                  }}
                                  className="w-full h-full px-4 py-2 border-none bg-transparent focus:ring-inset focus:ring-2 focus:ring-primary outline-none"
                                />
                              )}
                            </td>
                            <td className="px-4 py-2 border-r border-slate-200 text-slate-700">{test.normalRange}</td>
                            <td className="px-4 py-2 text-slate-500 bg-slate-50/30">{test.unit}</td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* 4. Diagnostic Imaging */}
              <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                  <h3 className="text-slate-900 font-bold text-lg flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">4</span>
                    Chuẩn đoán hình ảnh
                  </h3>
                </div>
                <div className="p-6 flex flex-col gap-6">
                  {/* Description */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700">Mô tả hình ảnh</label>
                    <textarea
                      className="w-full rounded-lg border-slate-200 min-h-[100px] p-3 text-sm focus:ring-primary focus:border-primary"
                      placeholder="Nhập mô tả chi tiết về kết quả chẩn đoán hình ảnh..."
                      value={clinical.imaging?.description || ''}
                      onChange={(e) => setClinical(prev => ({
                        ...prev,
                        imaging: { ...prev.imaging, description: e.target.value }
                      }))}
                    ></textarea>
                  </div>

                  {/* Image Upload */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700">Hình ảnh đính kèm</label>
                    <div className="grid grid-cols-4 gap-4">
                      {clinical.imaging?.images?.map((image, index) => (
                        <div key={image.id} className="relative group">
                          <img
                            src={image.url}
                            alt={image.name}
                            className="w-full h-32 object-cover rounded-lg border border-slate-200"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                            <span className="text-white text-xs px-2 py-1 bg-black/60 rounded">{image.type}</span>
                          </div>
                          <button
                            onClick={() => {
                              setClinical(prev => ({
                                ...prev,
                                imaging: {
                                  ...prev.imaging,
                                  images: prev.imaging.images.filter((_, i) => i !== index)
                                }
                              }));
                            }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-[14px]">close</span>
                          </button>
                        </div>
                      ))}

                      <label className={`flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors aspect-square ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        <span className="material-symbols-outlined text-slate-400 text-3xl mb-1">{uploading ? 'hourglass_top' : 'add_photo_alternate'}</span>
                        <span className="text-xs text-slate-500 font-medium">{uploading ? 'Đang tải...' : 'Thêm ảnh mới'}</span>
                        <input
                          type="file"
                          accept="image/*,.dcm"
                          className="hidden"
                          disabled={uploading}
                          onChange={async (e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];

                              if (file.size > 3 * 1024 * 1024) {
                                alert('Ảnh không được vượt quá 3MB');
                                e.target.value = '';
                                return;
                              }

                              const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/dicom'];
                              if (!validImageTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.dcm')) {
                                alert('Vui lòng chọn đúng định dạng ảnh y tế (JPG, PNG, WEBP, DICOM)');
                                e.target.value = '';
                                return;
                              }

                              const type = prompt('Chọn loại hình ảnh (X-ray, CT, Ultrasound):', 'X-ray');
                              if (type) {
                                const validTypes = ['X-ray', 'CT', 'Ultrasound'];
                                const selectedType = validTypes.includes(type) ? type as 'X-ray' | 'CT' | 'Ultrasound' : 'X-ray';

                                const previewUrl = URL.createObjectURL(file);

                                setUploading(true);
                                try {
                                  const res = await callUploadImage(file, 'clinical-images');
                                  const uploadedFileName = (res as any)?.fileName || (res as any)?.data?.fileName;
                                  if (uploadedFileName) {
                                    const newImage = {
                                      id: Math.random().toString(36).substr(2, 9),
                                      url: uploadedFileName,
                                      previewUrl: previewUrl,
                                      type: selectedType,
                                      name: file.name
                                    };
                                    setClinical(prev => ({
                                      ...prev,
                                      imaging: {
                                        ...prev.imaging,
                                        images: [...prev.imaging.images, newImage]
                                      }
                                    }));
                                  }
                                } catch {
                                  alert('Không thể tải ảnh lên. Vui lòng thử lại.');
                                } finally {
                                  setUploading(false);
                                }
                              }
                              e.target.value = '';
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </section>

            </div>


          </div>
        </div>
      </div >
    </>
  );
};