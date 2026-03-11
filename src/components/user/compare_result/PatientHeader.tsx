import React from 'react';

const PatientHeader: React.FC = () => {
    return (
        <div className="bg-white border text-[#1b2430] border-[#dbe3ef] rounded-2xl shadow-sm mb-6 overflow-hidden">
            {/* Minimal top banner/stripe for visual interest */}
            <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-500 w-full"></div>

            <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
                {/* Main Patient Info (Spans 3 columns on large screens) */}
                <div className="lg:col-span-3 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg border border-blue-200">
                            VA
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">BN-240311-018</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span className="text-xs font-semibold text-slate-500">Nữ, 67 tuổi</span>
                            </div>
                            <h1 className="m-0 text-xl font-bold leading-tight">Nguyễn Văn A</h1>
                        </div>
                    </div>

                    {/* Minimalist Badges */}
                    <div className="flex gap-2 flex-wrap mt-1">
                        <div className="bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-md text-[13px] font-medium flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">local_hospital</span>
                            Khoa Chấn thương chỉnh hình
                        </div>
                        <div className="bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-md text-[13px] font-medium flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">event</span>
                            Sau thay khớp háng 3 tháng
                        </div>
                        <div className="bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-md text-[13px] font-medium flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                            Nghi ngờ PJI: Cao
                        </div>
                        <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md text-[13px] font-medium flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Phác đồ: Đã xác nhận
                        </div>
                    </div>
                </div>

                {/* Right side info / action (Spans 1 column) */}
                <div className="lg:col-span-1 lg:border-l lg:border-slate-100 lg:pl-6 h-full flex flex-col justify-center gap-4">
                    <div className="flex items-start gap-3 w-full">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined">clinical_notes</span>
                        </div>
                        <div>
                            <div className="text-xs text-slate-500 mb-0.5 font-medium">Bác sĩ phụ trách</div>
                            <div className="text-sm font-bold text-slate-900">BS. Hương</div>
                        </div>
                    </div>
                    {/* Placeholder for future actions if needed, keeps the grid balanced */}
                    {/* <button className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-sm transition-colors border border-slate-200">
                        Chi tiết hồ sơ
                    </button> */}
                </div>
            </div>
        </div>
    );
};

export default PatientHeader;
