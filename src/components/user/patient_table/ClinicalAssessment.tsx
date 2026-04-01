import React, { useEffect, useState } from 'react';
import { useClinicForm } from '@/redux/hook';
import { ILabResult, IClinicalRecord, ICultureResult, IImageResult, IPatient } from '@/types/backend';
import { TestItem } from '@/types/types';
import { callUploadImage } from '@/apis/api';
import { Input } from 'antd';

interface ClinicalAssessmentProps {
  mode?: 'wizard' | 'standalone';
  labResults?: ILabResult[];
  clinicalRecord?: IClinicalRecord | null;
  cultureResults?: ICultureResult[];
  imageResults?: IImageResult[];
  patient?: IPatient | null;
}

export const ClinicalAssessmentPage: React.FC<ClinicalAssessmentProps> = ({ mode = 'wizard', labResults, clinicalRecord, cultureResults, imageResults, patient }) => {
  const { form, setForm } = useClinicForm();
  const [uploading, setUploading] = useState(false);

  // Populate clinicalRecord from API
  useEffect(() => {
    if (clinicalRecord) {
      setForm(prev => ({
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
    }
  }, [clinicalRecord]);

  // Populate lab tests from API
  useEffect(() => {
    if (labResults && labResults.length > 0) {
      const lab = labResults[0];
      setForm(prev => {
        const setVal = (tests: TestItem[], name: string, value?: number) =>
          tests.map(t => t.name.toLowerCase() === name.toLowerCase()
            ? { ...t, result: value != null ? String(value) : '' } : t);

        let hTests = [...prev.hematologyTests];
        if (lab.wbcBlood?.value != null) hTests = setVal(hTests, 'wbc', lab.wbcBlood.value);
        if (lab.neut?.value != null) hTests = setVal(hTests, '%NEUT', lab.neut.value);
        if (lab.mono?.value != null) hTests = setVal(hTests, '%MONO', lab.mono.value);
        if (lab.esr?.value != null) hTests = setVal(hTests, 'Máu lắng', lab.esr.value);
        if (lab.rbc?.value != null) hTests = setVal(hTests, 'RBC', lab.rbc.value);
        if (lab.mcv?.value != null) hTests = setVal(hTests, 'MCV', lab.mcv.value);
        if (lab.mch?.value != null) hTests = setVal(hTests, 'MCH', lab.mch.value);
        if (lab.rdw?.value != null) hTests = setVal(hTests, 'RDW-CV', lab.rdw.value);
        if (lab.ig?.value != null) hTests = setVal(hTests, 'IG%', lab.ig.value);
        if (lab.dimer?.value != null) hTests = setVal(hTests, 'D-dimer', lab.dimer.value);
        if (lab.serumIl6?.value != null) hTests = setVal(hTests, 'Serum IL-6', lab.serumIl6.value);
        if (lab.alphaDefensin?.value != null) hTests = setVal(hTests, 'Alpha Defensin', lab.alphaDefensin.value);

        let fTests = [...prev.fluidAnalysis];
        if (lab.synovialWbc?.value != null) fTests = setVal(fTests, 'Bạch cầu (Dịch)', lab.synovialWbc.value);
        if (lab.crp?.value != null) fTests = setVal(fTests, 'Định lượng CRP (Dịch)', lab.crp.value);
        if (lab.synovialPmn?.value != null) fTests = setVal(fTests, '%PMN (Dịch)', lab.synovialPmn.value);

        let bTests = [...prev.biochemistryTests];
        if (lab.biochemicalData) {
          const mapping: Record<string, string> = {
            'glucose': 'bc_4', 'ure': 'bc_5', 'creatinine': 'bc_6', 'eGFR': 'ht_20',
            'albumin': 'bc_7', 'alb': 'bc_7', 'ast': 'bc_8', 'alt': 'bc_9',
            'natri': 'bc_10', 'kali': 'bc_11', 'clo': 'bc_12', 'hba1c': 'bc_13'
          };
          Object.entries(lab.biochemicalData).forEach(([key, val]) => {
            const metricId = mapping[key] || key;
            const numVal = (val as any)?.value;
            if (numVal != null) {
              bTests = bTests.map(t => t.id === metricId ? { ...t, result: String(numVal) } : t);
            }
          });
        }

        return { ...prev, hematologyTests: hTests, fluidAnalysis: fTests, biochemistryTests: bTests };
      });
    }
  }, [labResults]);

  // Populate culture results from API
  useEffect(() => {
    if (cultureResults && cultureResults.length > 0) {
      setForm(prev => ({
        ...prev,
        cultureResults: cultureResults.map((c, idx) => ({
          ...c,
          _tempId: c.id?.toString() || Math.random().toString(36).substr(2, 9),
          sampleNumber: idx + 1,
          usedAntibioticBefore: false,
          daysOffAntibiotic: '' as '',
        })),
      }));
    }
  }, [cultureResults]);

  // Populate images from API
  useEffect(() => {
    if (imageResults && imageResults.length > 0) {
      setForm(prev => {
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
  }, [imageResults]);

  // isAcute logic
  useEffect(() => {
    if (form.surgeryDate && form.clinicalRecord.illnessOnsetDate) {
      const surgery = new Date(form.surgeryDate);
      const symptom = new Date(form.clinicalRecord.illnessOnsetDate);
      const diffTime = Math.abs(symptom.getTime() - surgery.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const isAcute = diffDays < 21;
      if (form.isAcute !== isAcute) {
        setForm(prev => ({ ...prev, isAcute }));
      }
    }
  }, [form.surgeryDate, form.clinicalRecord.illnessOnsetDate, form.isAcute, setForm]);

  const getTestStatus = (result: string, normalRange: string) => {
    if (!result || !normalRange) return null;
    const resVal = parseFloat(result);
    if (isNaN(resVal)) return null;
    if (normalRange.includes('-')) {
      const parts = normalRange.split('-').map(p => parseFloat(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        if (resVal < parts[0]) return 'L';
        if (resVal > parts[1]) return 'H';
        return null;
      }
    }
    if (normalRange.trim().startsWith('<')) {
      const max = parseFloat(normalRange.replace('<', '').trim());
      if (!isNaN(max) && resVal > max) return 'H';
    }
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
                    { key: 'fever' as const, label: 'Sốt' },
                    { key: 'sinusTract' as const, label: 'Đường rò' },
                    { key: 'erythema' as const, label: 'Tấy đỏ' },
                    { key: 'pain' as const, label: 'Đau' },
                    { key: 'swelling' as const, label: 'Sưng nề' },
                    { key: 'pmmaAllergy' as const, label: 'Dị ứng PMMA' },
                    { key: 'hematogenousSuspected' as const, label: 'Nhiễm trùng huyết' },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!form.clinicalRecord[item.key]}
                        onChange={() => setForm(prev => ({
                          ...prev,
                          clinicalRecord: {
                            ...prev.clinicalRecord,
                            [item.key]: !prev.clinicalRecord[item.key]
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
                      value={form.clinicalRecord.illnessOnsetDate ?? ''}
                      onChange={(e) => setForm(prev => ({ ...prev, clinicalRecord: { ...prev.clinicalRecord, illnessOnsetDate: e.target.value } }))}
                      className="w-full rounded-lg border-slate-300 h-11 px-3 border"
                    />
                    <span className="text-xs text-slate-500">
                      Phân loại: <span className={`font-bold ${form.isAcute ? 'text-danger' : 'text-warning'}`}>{form.isAcute ? 'CẤP TÍNH (<3 tuần)' : 'MÃN TÍNH (>3 tuần)'}</span>
                    </span>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-slate-700">BMI</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ví dụ: 25.71"
                      value={form.clinicalRecord.bmi != null ? form.clinicalRecord.bmi : ''}
                      onChange={(e) => setForm(prev => ({ ...prev, clinicalRecord: { ...prev.clinicalRecord, bmi: e.target.value ? Number(e.target.value) : undefined } }))}
                      className="w-full rounded-lg border-slate-300 h-11 px-3 border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-slate-700">Loại nhiễm trùng nghi ngờ</span>
                    <select
                      value={form.clinicalRecord.suspectedInfectionType ?? ''}
                      onChange={(e) => setForm(prev => ({ ...prev, clinicalRecord: { ...prev.clinicalRecord, suspectedInfectionType: e.target.value } }))}
                      className="w-full rounded-lg border-slate-300 h-11 px-3 focus:ring-primary focus:border-primary border"
                    >
                      <option value="UNKNOWN" disabled>Chọn tình trạng</option>
                      <option value="EARLY_POSTOPERATIVE">Nhiễm trùng hậu phẫu sớm</option>
                      <option value="DELAYED">Nhiễm trùng muộn / trì hoãn</option>
                      <option value="LATE_HEMATOGENOUS">nhiễm trùng đường máu (hơn 24 tháng)</option>
                      <option value="ACUTE_HEMATOGENOUS">nhiễm trùng cấp đường máu</option>
                      <option value="CHRONIC">nhiễm trùng mạn tính</option>
                      <option value="UNKNOWN">Chưa rõ</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-slate-700">Tình trạng mô mềm</span>
                    <input
                      type="text"
                      placeholder="Ví dụ:"
                      value={form.clinicalRecord.softTissue ?? ''}
                      onChange={(e) => setForm(prev => ({ ...prev, clinicalRecord: { ...prev.clinicalRecord, softTissue: e.target.value } }))}
                      className="w-full rounded-lg border-slate-300 h-11 px-3 border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-slate-700">Độ ổn định cấy ghép</span>
                    <select
                      value={form.clinicalRecord.implantStability ?? ''}
                      onChange={(e) => setForm(prev => ({ ...prev, clinicalRecord: { ...prev.clinicalRecord, implantStability: e.target.value } }))}
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
                      value={form.clinicalRecord.daysSinceIndexArthroplasty != null ? form.clinicalRecord.daysSinceIndexArthroplasty : ''}
                      onChange={(e) => setForm(prev => ({ ...prev, clinicalRecord: { ...prev.clinicalRecord, daysSinceIndexArthroplasty: e.target.value ? Number(e.target.value) : undefined } }))}
                      className="w-full rounded-lg border-slate-300 h-11 px-3 border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </label>
                  <label className="flex flex-col col-span-3 gap-1.5">
                    <span className="text-sm font-medium text-slate-700">Khớp nhân tạo</span>
                    <input
                      type="text"
                      placeholder="Ví du: Miêu tả về vị trí khớp, có phải mổ lại không, phương pháp cố định..."
                      value={form.clinicalRecord.prosthesisJoint ?? ''}
                      onChange={(e) => setForm(prev => ({ ...prev, clinicalRecord: { ...prev.clinicalRecord, prosthesisJoint: e.target.value } }))}
                      className="w-full rounded-lg border-slate-300 h-11 px-3 border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </label>

                  <label className="flex flex-col col-span-3 gap-1.5">
                    <span className="text-sm font-medium text-slate-700">Khám bệnh toàn thân</span>
                    <input
                      type="text"
                      placeholder="Ví dụ: Tỉnh táo, tiếp xúc tốt..."
                      value={form.clinicalRecord.notations ?? ''}
                      onChange={(e) => setForm(prev => ({ ...prev, clinicalRecord: { ...prev.clinicalRecord, notations: e.target.value } }))}
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
                        {form.hematologyTests?.map((test, index) => (
                          <tr key={test.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2 font-medium text-slate-900 border-r border-slate-200">{test.name}</td>
                            <td className="px-4 py-2 border-r border-slate-200 p-0">
                              <input
                                type="text"
                                value={test.result}
                                onChange={(e) => {
                                  const newTests = form.hematologyTests.map((t, i) =>
                                    i === index ? { ...t, result: e.target.value } : t
                                  );
                                  setForm(prev => ({ ...prev, hematologyTests: newTests }));
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
                        {form.biochemistryTests?.map((test, index) => (
                          <tr key={test.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2 font-medium text-slate-900 border-r border-slate-200">{test.name}</td>
                            <td className="px-4 py-2 border-r border-slate-200 p-0">
                              <input
                                type="text"
                                value={test.result}
                                onChange={(e) => {
                                  const newValue = e.target.value;
                                  let newTests = form.biochemistryTests.map((t, i) =>
                                    i === index ? { ...t, result: newValue } : t
                                  );
                                  // If the user is modifying Creatinine (bc_6), auto-calculate eGFR (ht_20)
                                  if (test.id === 'bc_6') {
                                    const egfrIndex = newTests.findIndex(t => t.id === 'ht_20');
                                    if (egfrIndex !== -1) {
                                      let egfrResult = '';
                                      if (newValue && !isNaN(Number(newValue))) {
                                        let age = 0;
                                        const dob = patient?.dateOfBirth;
                                        if (dob) {
                                          const dobDate = new Date(dob);
                                          const today = new Date();
                                          age = today.getFullYear() - dobDate.getFullYear();
                                          const m = today.getMonth() - dobDate.getMonth();
                                          if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
                                            age--;
                                          }
                                        }

                                        if (age > 0) {
                                          const scrUmolL = Number(newValue);
                                          const scr = scrUmolL / 88.4;
                                          const isFemale = patient?.gender === 'female';
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

                                  setForm(prev => ({ ...prev, biochemistryTests: newTests }));
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
                        {form.fluidAnalysis?.map((test, index) => {
                          if (test.name === 'Nhuộm Gram') return null;
                          return (
                            <tr key={test.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-2 font-medium text-slate-900 border-r border-slate-200">{test.name}</td>
                              <td className="px-4 py-2 border-r border-slate-200 p-0">
                                {test.name === 'Cấy khuẩn' ? (
                                  <div className="p-4 space-y-4">
                                    {form.cultureResults?.map((sample, sampleIdx) => (
                                      <div key={sample._tempId || sample.id || sampleIdx} className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm flex flex-col gap-4">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                          <span className="font-bold text-slate-800 text-sm">Mẫu {sample.sampleNumber}</span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const newSamples = form.cultureResults.filter((_, idx) => idx !== sampleIdx);
                                              const renumbered = newSamples.map((s, idx) => ({ ...s, sampleNumber: idx + 1 }));
                                              setForm(prev => ({ ...prev, cultureResults: renumbered }));
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
                                                const newSamples = [...form.cultureResults];
                                                newSamples[sampleIdx] = { ...newSamples[sampleIdx], result: e.target.value };
                                                setForm(prev => ({ ...prev, cultureResults: newSamples }));
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
                                              value={sample.name || ''}
                                              onChange={(e) => {
                                                const newSamples = [...form.cultureResults];
                                                newSamples[sampleIdx] = { ...newSamples[sampleIdx], name: e.target.value };
                                                setForm(prev => ({ ...prev, cultureResults: newSamples }));
                                              }}
                                              placeholder="Nhập tên vi khuẩn..."
                                              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                                            />
                                          </div>

                                          <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-semibold text-slate-700">Nhuộm Gram</label>
                                            <select
                                              value={sample.gramType || ''}
                                              onChange={(e) => {
                                                const newSamples = [...form.cultureResults];
                                                newSamples[sampleIdx] = { ...newSamples[sampleIdx], gramType: e.target.value };
                                                setForm(prev => ({ ...prev, cultureResults: newSamples }));
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
                                            <label className="text-xs font-semibold text-slate-700">Số ngày ủ (incubationDays)</label>
                                            <input
                                              type="number"
                                              value={sample.incubationDays != null ? sample.incubationDays : ''}
                                              onChange={(e) => {
                                                const newSamples = [...form.cultureResults];
                                                newSamples[sampleIdx] = { ...newSamples[sampleIdx], incubationDays: e.target.value === '' ? undefined : Number(e.target.value) };
                                                setForm(prev => ({ ...prev, cultureResults: newSamples }));
                                              }}
                                              placeholder="Ví dụ: 3"
                                              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                                            />
                                          </div>

                                          <div className="flex flex-col justify-center pt-5">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                              <input
                                                type="checkbox"
                                                checked={sample.antibioticed || false}
                                                onChange={(e) => {
                                                  const newSamples = [...form.cultureResults];
                                                  newSamples[sampleIdx] = { ...newSamples[sampleIdx], antibioticed: e.target.checked };
                                                  setForm(prev => ({ ...prev, cultureResults: newSamples }));
                                                }}
                                                className="w-4 h-4 accent-primary rounded border-slate-300"
                                              />
                                              <span className="text-sm font-medium text-slate-700">Đã dùng KS trước đó</span>
                                            </label>
                                          </div>

                                          {sample.antibioticed && (
                                            <div className="flex flex-col gap-1.5">
                                              <label className="text-xs font-semibold text-slate-700">Số ngày ngưng KS (daysOffAntibiotic)</label>
                                              <Input
                                                type="number"
                                                value={sample.daysOffAntibio !== undefined ? sample.daysOffAntibio : ''}
                                                onChange={(e) => {
                                                  const newSamples = [...form.cultureResults];
                                                  newSamples[sampleIdx] = { ...newSamples[sampleIdx], daysOffAntibio: Number(e.target.value) };
                                                  setForm(prev => ({ ...prev, cultureResults: newSamples }));
                                                }}
                                                placeholder="Ví dụ: 7"
                                                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                                              />
                                            </div>
                                          )}

                                          <div className={`flex flex-col gap-1.5 ${sample.antibioticed ? '' : 'md:col-span-2'}`}>
                                            <label className="text-xs font-semibold text-slate-700">Ghi chú (notes)</label>
                                            <input
                                              type="text"
                                              value={sample.notes || ''}
                                              onChange={(e) => {
                                                const newSamples = [...form.cultureResults];
                                                newSamples[sampleIdx] = { ...newSamples[sampleIdx], notes: e.target.value };
                                                setForm(prev => ({ ...prev, cultureResults: newSamples }));
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
                                          _tempId: Math.random().toString(36).substr(2, 9),
                                          sampleNumber: (form.cultureResults?.length || 0) + 1,
                                          name: '',
                                          incubationDays: undefined,
                                          result: '',
                                          notes: '',
                                          gramType: '',
                                          antibioticed: false,
                                          daysOffAntibio: 0,
                                        };
                                        setForm(prev => ({
                                          ...prev,
                                          cultureResults: [...(prev.cultureResults || []), newSample]
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
                                      const newTests = (form.fluidAnalysis || []).map((t, i) =>
                                        i === index ? { ...t, result: e.target.value } : t
                                      );
                                      setForm(prev => ({ ...prev, fluidAnalysis: newTests }));
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
                      value={form.imagingDescription}
                      onChange={(e) => setForm(prev => ({
                        ...prev,
                        imagingDescription: e.target.value
                      }))}
                    ></textarea>
                  </div>

                  {/* Image Upload */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700">Hình ảnh đính kèm</label>
                    <div className="grid grid-cols-4 gap-4">
                      {form.formImages?.map((image, index) => (
                        <div key={image.id} className="relative group">
                          <img
                            src={image.previewUrl || image.url}
                            alt={image.name}
                            className="w-full h-32 object-cover rounded-lg border border-slate-200"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                            <span className="text-white text-xs px-2 py-1 bg-black/60 rounded">{image.type}</span>
                          </div>
                          <button
                            onClick={() => {
                              setForm(prev => ({
                                ...prev,
                                formImages: prev.formImages.filter((_, i) => i !== index)
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
                                const selectedType = validTypes.includes(type) ? type : 'X-ray';

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
                                    setForm(prev => ({
                                      ...prev,
                                      formImages: [...prev.formImages, newImage]
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
