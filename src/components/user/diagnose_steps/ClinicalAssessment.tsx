import React, { useEffect } from 'react';
import { usePatient } from '../../../context/PatientContext';

interface ClinicalAssessmentProps {
  onNext?: () => void;
  onPrev?: () => void;
}

export const ClinicalAssessmentPage: React.FC<ClinicalAssessmentProps> = ({ onNext, onPrev }) => {
  const { demographics, setDemographics, clinical, setClinical } = usePatient();

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

  const [isAILoading, setIsAILoading] = React.useState(false);

  const handleAIPredict = () => {
    setIsAILoading(true);
    // Simulate sending data to AI and receiving response
    setTimeout(() => {
      setClinical(prev => ({
        ...prev,
        diagnosis: {
          score: 85,
          probability: 85,
          status: 'Infected',
          reasoning: [
            'Dựa trên dữ liệu cấy khuẩn và các xét nghiệm sinh hóa, mô hình AI đánh giá nguy cơ cao.',
            'Các chỉ số lâm sàng và tiền sử bệnh nhân chỉ ra khả năng nhiễm trùng khớp nhân tạo.'
          ]
        }
      }));
      setIsAILoading(false);
    }, 1500);
  };

  const getStatusColor = (status: string) => {
    if (status === 'Infected') return 'text-danger';
    if (status === 'Inconclusive') return 'text-warning';
    return 'text-success';
  };


  const getStatusTextDetailed = (status: string) => {
    if (status === 'Infected') return 'Nguy cơ cao PJI';
    if (status === 'Inconclusive') return 'Chưa xác định';
    return 'Không nhiễm trùng';
  }


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
      <header className="flex-shrink-0 bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between z-10">
        <div>
          <div className="flex items-baseline gap-3">
            <span className="text-slate-400 text-sm font-mono bg-slate-100 px-2 py-0.5 rounded">Dữ liệu xét nghiệm</span>
          </div>
          <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">

            <span className="material-symbols-outlined text-sm">accessibility_new</span> Vị trí: {demographics.implantType} ({demographics.implantNature})
          </p>
        </div>
        <div className="flex items-center gap-3 z-10">
          <button onClick={onPrev} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors bg-red-300 border border-slate-200 rounded-lg">Quay lại</button>
          <button onClick={onNext} className="flex items-center justify-center gap-2 px-5 h-10 bg-primary hover:bg-primary-dark text-white font-bold text-md rounded-lg shadow-md transition-all">
            Tiếp tục <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </header>

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
                            [item.key]: !prev.symptoms[item.key as keyof typeof clinical.symptoms]
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
                    <span className="text-sm font-medium text-slate-700">Mạch (lần/ph)</span>
                    <input
                      type="number"
                      placeholder="Ví dụ: 84"
                      value={clinical.examination?.vessel !== undefined ? clinical.examination.vessel : ''}
                      onChange={(e) => setClinical(prev => ({ ...prev, examination: { ...prev.examination, vessel: e.target.value ? Number(e.target.value) : '' } as any }))}
                      className="w-full rounded-lg border-slate-300 h-11 px-3 border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-slate-700">Nhiệt độ (°C)</span>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ví dụ: 36.8"
                      value={clinical.examination?.temperature !== undefined ? clinical.examination.temperature : ''}
                      onChange={(e) => setClinical(prev => ({ ...prev, examination: { ...prev.examination, temperature: e.target.value ? Number(e.target.value) : '' } as any }))}
                      className="w-full rounded-lg border-slate-300 h-11 px-3 border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-slate-700">Huyết áp (mmHg)</span>
                    <input
                      type="text"
                      placeholder="Ví dụ: 140/95"
                      value={clinical.examination?.blood_press || ''}
                      onChange={(e) => setClinical(prev => ({ ...prev, examination: { ...prev.examination, blood_press: e.target.value } as any }))}
                      className="w-full rounded-lg border-slate-300 h-11 px-3 border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-slate-700">Nhịp thở (lần/ph)</span>
                    <input
                      type="number"
                      placeholder="Ví dụ: 17"
                      value={clinical.examination?.breath !== undefined ? clinical.examination.breath : ''}
                      onChange={(e) => setClinical(prev => ({ ...prev, examination: { ...prev.examination, breath: e.target.value ? Number(e.target.value) : '' } as any }))}
                      className="w-full rounded-lg border-slate-300 h-11 px-3 border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </label>
                  <label className="flex flex-col col-span-3">
                    <span className="text-sm font-medium text-slate-700">Khám bệnh toàn thân</span>
                    <input
                      type="text"
                      placeholder="Ví dụ: Tỉnh táo, tiếp xúc tốt..."
                      value={clinical.examination?.whole_body || ''}
                      onChange={(e) => setClinical(prev => ({ ...prev, examination: { ...prev.examination, whole_body: e.target.value } as any }))}
                      className="w-full rounded-lg border-slate-300 h-11 px-3 border"
                    />
                  </label>
                </div>
              </section>

              {/* 1. Major Criteria REMOVED */}

              {/* 2. PJI Diagnostic Tests */}
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
                                  const newTests = [...clinical.hematologyTests];
                                  newTests[index].result = e.target.value;
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
                                  const newTests = [...clinical.biochemistryTests];
                                  newTests[index].result = e.target.value;
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
                        {clinical.fluidAnalysis?.map((test, index) => (
                          <tr key={test.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2 font-medium text-slate-900 border-r border-slate-200">{test.name}</td>
                            <td className="px-4 py-2 border-r border-slate-200 p-0">
                              {test.name === 'Nhuộm Gram' ? (
                                <div className="flex flex-wrap gap-1 p-2">
                                  {['Gram Dương', 'Gram Âm', 'Âm tính'].map((opt) => (
                                    <label key={opt} className="inline-flex items-center gap-1 cursor-pointer bg-slate-100 px-2 py-1 rounded border border-slate-200 hover:bg-white transition-colors">
                                      <input
                                        type="checkbox"
                                        checked={test.result.includes(opt)}
                                        onChange={(e) => {
                                          const current = test.result ? test.result.split(', ').filter(Boolean) : [];
                                          let newResult;
                                          if (e.target.checked) {
                                            newResult = [...current, opt].join(', ');
                                          } else {
                                            newResult = current.filter(x => x !== opt).join(', ');
                                          }
                                          const newTests = [...(clinical.fluidAnalysis || [])];
                                          newTests[index].result = newResult;
                                          setClinical(prev => ({ ...prev, fluidAnalysis: newTests }));
                                        }}
                                        className="w-3 h-3 accent-primary rounded-sm"
                                      />
                                      <span className="text-xs font-medium">{opt}</span>
                                    </label>
                                  ))}
                                </div>
                              ) : test.name === 'Cấy khuẩn' ? (
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
                                        result: '' as any
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
                                    const newTests = [...(clinical.fluidAnalysis || [])];
                                    newTests[index].result = e.target.value;
                                    setClinical(prev => ({ ...prev, fluidAnalysis: newTests }));
                                  }}
                                  className="w-full h-full px-4 py-2 border-none bg-transparent focus:ring-inset focus:ring-2 focus:ring-primary outline-none"
                                />
                              )}
                            </td>
                            <td className="px-4 py-2 border-r border-slate-200 text-slate-700">{test.normalRange}</td>
                            <td className="px-4 py-2 text-slate-500 bg-slate-50/30">{test.unit}</td>
                          </tr>
                        ))}
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

                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors aspect-square">
                        <span className="material-symbols-outlined text-slate-400 text-3xl mb-1">add_photo_alternate</span>
                        <span className="text-xs text-slate-500 font-medium">Thêm ảnh mới</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              const type = prompt('Chọn loại hình ảnh (X-quang, CT, Siêu âm):', 'X-quang');
                              if (type) {
                                const validTypes = ['X-quang', 'CT', 'Siêu âm'];
                                const selectedType = validTypes.includes(type) ? type as any : 'Other';
                                const newImage = {
                                  id: Math.random().toString(36).substr(2, 9),
                                  url: URL.createObjectURL(file), // Note: Using ObjectURL for demo
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
                              e.target.value = ''; // Reset input
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