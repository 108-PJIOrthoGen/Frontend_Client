import React from 'react';

const TimelineHistory: React.FC = () => {
    return (
        <div className="bg-white border border-[#dbe3ef] rounded-[18px] shadow-[0_10px_30px_rgba(16,24,40,0.08)] h-fit">
            <div className="p-[18px_20px] border-b border-[#dbe3ef] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="m-0 text-lg font-bold">Lịch sử gợi ý & quyết định điều trị</h2>
                <div className="text-[13px] text-[#607086]">Timeline </div>
            </div>
            <div className="p-[18px_20px]">
                <div className="relative pl-[18px] before:absolute before:left-[7px] before:top-[8px] before:bottom-[8px] before:w-[2px] before:bg-[#d6e0ef]">
                    <div className="relative pl-[18px] mb-[18px] last:mb-0">
                        <div className="absolute left-[-1px] top-[6px] w-4 h-4 rounded-full bg-white border-4 border-blue-600 z-10"></div>
                        <div className="border border-[#dbe3ef] rounded-2xl p-[14px] bg-[#fbfdff]">
                            <div className="flex justify-between gap-2.5 items-start mb-2.5">
                                <div>
                                    <h3 className="m-0 text-[15px] font-bold">AI gợi ý lần 1</h3>
                                    <span className="text-[11px] font-bold py-1 px-2.5 rounded-full inline-block bg-[#e8f0ff] text-[#1d4ed8] mt-1">AI Recommendation</span>
                                </div>
                                <div className="text-xs text-[#607086] whitespace-nowrap">09:10 • 11/03/2026</div>
                            </div>
                            <div className="grid grid-cols-[130px_1fr] gap-2 text-[13px] my-1.5">
                                <div className="text-[#607086]">Phác đồ chính</div>
                                <div className="font-medium text-[#1b2430]">Cefazolin 2g q8h IV</div>
                            </div>
                            <div className="grid grid-cols-[130px_1fr] gap-2 text-[13px] my-1.5">
                                <div className="text-[#607086]">Mức nghi ngờ PJI</div>
                                <div className="font-medium text-[#b45309]">Cao</div>
                            </div>
                            <div className="grid grid-cols-[130px_1fr] gap-2 text-[13px] my-1.5">
                                <div className="text-[#607086]">Độ đầy đủ dữ liệu</div>
                                <div className="font-medium text-[#1b2430]">68%</div>
                            </div>
                            <div className="grid grid-cols-[130px_1fr] gap-2 text-[13px] my-1.5">
                                <div className="text-[#607086]">Tình trạng</div>
                                <div className="font-medium text-[#1b2430]">Chưa review</div>
                            </div>
                            <div className="flex gap-2 flex-wrap mt-3">
                                <div className="py-1.5 px-2.5 border border-[#dbe3ef] rounded-[10px] bg-white text-xs font-semibold cursor-pointer hover:bg-slate-50">Xem chi tiết</div>

                            </div>
                        </div>
                    </div>

                    <div className="relative pl-[18px] mb-[18px] last:mb-0">
                        <div className="absolute left-[-1px] top-[6px] w-4 h-4 rounded-full bg-white border-4 border-blue-600 z-10"></div>
                        <div className="border border-blue-200 shadow-[0_4px_12px_rgba(37,99,235,0.08)] rounded-2xl p-[14px] bg-[#f8faff]">
                            <div className="flex justify-between gap-2.5 items-start mb-2.5">
                                <div>
                                    <h3 className="m-0 text-[15px] font-bold text-blue-900">AI gợi ý lần 2</h3>
                                    <span className="text-[11px] font-bold py-1 px-2.5 rounded-full inline-block bg-blue-100 text-blue-700 mt-1">AI Recommendation (Current)</span>
                                </div>
                                <div className="text-xs text-blue-500 whitespace-nowrap font-medium">11:42 • 11/03/2026</div>
                            </div>
                            <div className="grid grid-cols-[130px_1fr] gap-2 text-[13px] my-1.5">
                                <div className="text-[#607086]">Phác đồ chính</div>
                                <div className="font-medium text-[#1b2430]">Vancomycin 15 mg/kg q24h IV</div>
                            </div>
                            <div className="grid grid-cols-[130px_1fr] gap-2 text-[13px] my-1.5">
                                <div className="text-[#607086]">Mức nghi ngờ PJI</div>
                                <div className="font-medium text-[#b45309]">Cao</div>
                            </div>
                            <div className="grid grid-cols-[130px_1fr] gap-2 text-[13px] my-1.5">
                                <div className="text-[#607086]">Điểm đáng chú ý</div>
                                <div className="font-medium text-[#1b2430]">Có kết quả cấy dịch khớp: MRSA</div>
                            </div>
                            <div className="grid grid-cols-[130px_1fr] gap-2 text-[13px] my-1.5">
                                <div className="text-[#607086]">Tình trạng</div>
                                <div className="font-medium text-[#0f766e]">Đang được review</div>
                            </div>
                            <div className="flex gap-2 flex-wrap mt-3">
                                <div className="py-1.5 px-2.5 border border-[#dbe3ef] rounded-[10px] bg-white text-xs font-semibold cursor-pointer hover:bg-slate-50">Xem chi tiết</div>

                            </div>
                        </div>
                    </div>

                    <div className="relative pl-[18px] mb-[18px] last:mb-0">
                        <div className="absolute left-[-1px] top-[6px] w-4 h-4 rounded-full bg-white border-4 border-[#b45309] z-10"></div>
                        <div className="border border-[#dbe3ef] rounded-2xl p-[14px] bg-[#fbfdff]">
                            <div className="flex justify-between gap-2.5 items-start mb-2.5">
                                <div>
                                    <h3 className="m-0 text-[15px] font-bold">Bác sĩ chỉnh sửa</h3>
                                    <span className="text-[11px] font-bold py-1 px-2.5 rounded-full inline-block bg-[#fff2e2] text-[#b45309] mt-1">Doctor Review</span>
                                </div>
                                <div className="text-xs text-[#607086] whitespace-nowrap">12:05 • 11/03/2026</div>
                            </div>
                            <div className="grid grid-cols-[130px_1fr] gap-2 text-[13px] my-1.5">
                                <div className="text-[#607086]">Hành động</div>
                                <div className="font-medium text-[#b45309]">Modified</div>
                            </div>
                            <div className="grid grid-cols-[130px_1fr] gap-2 text-[13px] my-1.5">
                                <div className="text-[#607086]">Nội dung sửa</div>
                                <div className="font-medium text-[#1b2430]">Giảm khoảng cách liều theo eGFR</div>
                            </div>
                            <div className="grid grid-cols-[130px_1fr] gap-2 text-[13px] my-1.5">
                                <div className="text-[#607086]">Lý do</div>
                                <div className="font-medium text-[#1b2430]">Chức năng thận giảm, cần hạn chế độc tính</div>
                            </div>

                        </div>
                    </div>

                    <div className="relative pl-[18px] mb-[18px] last:mb-0">
                        <div className="absolute left-[-1px] top-[6px] w-4 h-4 rounded-full bg-white border-4 border-[#0f766e] z-10"></div>
                        <div className="border border-[#dbe3ef] rounded-2xl p-[14px] bg-[#fbfdff]">
                            <div className="flex justify-between gap-2.5 items-start mb-2.5">
                                <div>
                                    <h3 className="m-0 text-[15px] font-bold">Phác đồ cuối đã xác nhận</h3>
                                    <span className="text-[11px] font-bold py-1 px-2.5 rounded-full inline-block bg-[#e7f8ef] text-[#0f766e] mt-1">Final Plan</span>
                                </div>
                                <div className="text-xs text-[#607086] whitespace-nowrap">12:15 • 11/03/2026</div>
                            </div>
                            <div className="grid grid-cols-[130px_1fr] gap-2 text-[13px] my-1.5">
                                <div className="text-[#607086]">Phác đồ hiện hành</div>
                                <div className="font-medium text-[#1b2430]">Vancomycin 15 mg/kg q24h IV</div>
                            </div>
                            <div className="grid grid-cols-[130px_1fr] gap-2 text-[13px] my-1.5">
                                <div className="text-[#607086]">Người xác nhận</div>
                                <div className="font-medium text-[#1b2430]">BS. Hương</div>
                            </div>
                            <div className="grid grid-cols-[130px_1fr] gap-2 text-[13px] my-1.5">
                                <div className="text-[#607086]">Theo dõi thêm</div>
                                <div className="font-medium text-[#1b2430]">Creatinine mỗi 48 giờ</div>
                            </div>
                            <div className="flex gap-2 flex-wrap mt-3">
                                <div className="py-1.5 px-2.5 border border-[#dbe3ef] rounded-[10px] bg-white text-xs font-semibold cursor-pointer hover:bg-slate-50">Xem bản xác nhận</div>
                                <div className="py-1.5 px-2.5 border border-[#dbe3ef] rounded-[10px] bg-white text-xs font-semibold cursor-pointer hover:bg-slate-50">In hội chẩn</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-2.5 text-[11px] text-[#607086] italic text-center border-t border-slate-100 pt-3">
                    Chú ý: Số lần gợi ý tạo phác đồ không nên vượt quá 3 lần để tránh gây nhiễu cho trong quá trình đưa ra quyết định cuối cùng của bác sĩ.
                </div>
            </div>
        </div>
    );
};

export default TimelineHistory;
