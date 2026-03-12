import React, { useEffect } from 'react';
import { usePatient } from '../../../context/PatientContext';

interface PatientIntakeProps {
  onNext?: () => void;
  onCancel?: () => void;
}

export const PatientIntake: React.FC<PatientIntakeProps> = ({ onNext, onCancel }) => {
  const { demographics, setDemographics } = usePatient();

  // Logic: Calculate BMI
  const calculateBMI = (h: number, w: number) => {
    if (h > 0 && w > 0) {
      const heightInMeters = h / 100;
      return parseFloat((w / (heightInMeters * heightInMeters)).toFixed(1));
    }
    return 0;
  };

  // Logic: Calculate Acute vs Chronic
  useEffect(() => {
    if (demographics.surgeryDate && demographics.symptomDate) {
      const surgery = new Date(demographics.surgeryDate);
      const onset = new Date(demographics.symptomDate);
      const diffTime = Math.abs(onset.getTime() - surgery.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      // < 3 weeks (21 days) is Acute
      const isAcute = diffDays < 21;
      setDemographics(prev => ({ ...prev, isAcute, bmi: calculateBMI(prev.height, prev.weight) }));
    }
  }, [demographics.surgeryDate, demographics.symptomDate, demographics.height, demographics.weight, setDemographics]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setDemographics(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };


  return (
    <>


      <div className="flex-1 overflow-y-auto p-8 pb-32">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Identity Section */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Thông tin bệnh nhân / Hành chính</h3>
                  <p className="text-slate-500 text-sm mt-1">Nhập thông tin định danh bệnh nhân.</p>
                </div>
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700">Họ và tên</span>
                <input name="name" value={demographics.name} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 h-11 px-3 focus:ring-primary focus:border-primary border" placeholder="VD: Nguyễn Văn A" type="text" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700">Số căn cước công dân</span>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">#</span>
                  <input name="mrn" value={demographics.mrn} onChange={handleInputChange} className="w-full pl-8 rounded-lg border-slate-300 h-11 px-3 focus:ring-primary focus:border-primary border" placeholder="ID-123456" type="text" />
                </div>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700">Ngày sinh</span>
                <input name="dob" value={demographics.dob} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 h-11 px-3 focus:ring-primary focus:border-primary border" type="date" />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700">Giới tính</span>
                <select id="countries" className="w-full rounded-lg border-slate-300 h-11 px-3 focus:ring-primary focus:border-primary border">
                  <option selected>Chọn giới tính</option>
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700">Số điện thoại</span>
                <input name="phone" value={demographics.phone} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 h-11 px-3 focus:ring-primary focus:border-primary border" placeholder="VD: 0912345678" type="tel" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700">Quốc tịch</span>
                <input name="phone" value={demographics.phone} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 h-11 px-3 focus:ring-primary focus:border-primary border" placeholder="VD: Việt Nam" type="tel" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700">Dân tộc</span>
                <input name="phone" value={demographics.phone} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 h-11 px-3 focus:ring-primary focus:border-primary border" placeholder="VD: Kinh" type="tel" />
              </label>
              <label className="flex flex-col md:col-span-2 gap-1.5">
                <span className="text-sm font-medium text-slate-700">Địa chỉ</span>
                <input name="address" value={demographics.address} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 h-11 px-3 focus:ring-primary focus:border-primary border" placeholder="VD: Số 1, Đường ABC, Quận XYZ, TP.HCM" type="text" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700">Nghề nghiệp</span>
                <input name="phone" value={demographics.phone} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 h-11 px-3 focus:ring-primary focus:border-primary border" placeholder="VD: Công nhân" type="tel" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700">Đối tượng</span>
                <select id="countries" className="w-full rounded-lg border-slate-300 h-11 px-3 focus:ring-primary focus:border-primary border">
                  <option disabled selected>Chọn đối tượng</option>
                  <option value="BHYT">Bảo hiểm y tế</option>
                  <option value="DICHVU">Dịch vụ</option>
                  <option value="FREE">Miễn</option>
                  <option value="OTHER">Khác</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700">Số thẻ BHYT</span>
                <input name="phone" value={demographics.phone} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 h-11 px-3 focus:ring-primary focus:border-primary border" placeholder="VD: HT1234567.." type="tel" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700">BHYT giá trị đến ngày</span>
                <input name="phone" value={demographics.phone} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 h-11 px-3 focus:ring-primary focus:border-primary border" type="date" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700">Họ tên người nhà</span>
                <input name="phone" value={demographics.phone} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 h-11 px-3 focus:ring-primary focus:border-primary border" type="text" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className=" font-medium text-slate-700">Số điện thoại người nhà khi cần báo tin</span>
                <input name="phone" value={demographics.phone} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 h-11 px-3 focus:ring-primary focus:border-primary border" placeholder="VD: 09123.." type="tel" />
              </label>


            </div>
          </section>

        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 w-full bg-white border-t border-slate-200 p-4 px-8 flex items-center justify-between z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button onClick={onCancel} className="px-6 py-3 rounded-lg bg-red-100 font-medium text-slate-600 hover:text-slate-900 transition-colors">Hủy bỏ</button>
        <button onClick={onNext} className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20 transition-all active:scale-95">
          Tiếp tục
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>
    </>
  );
};