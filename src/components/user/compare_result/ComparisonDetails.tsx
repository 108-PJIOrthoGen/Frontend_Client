import React from 'react';

const ComparisonDetails: React.FC = () => {
    return (
        <div className="bg-white border border-[#dbe3ef] rounded-[18px] shadow-[0_10px_30px_rgba(16,24,40,0.08)]">
            <div className="p-[18px_20px] border-b border-[#dbe3ef] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="m-0 text-lg font-bold">AI vs Phác đồ đã xác nhận</h2>
                <div className="text-[13px] text-[#607086]">Chi tiết so sánh</div>
            </div>
            <div className="p-[18px_20px]">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <div className="border border-[#dbe3ef] rounded-2xl p-[14px] bg-[#fafcff]">
                        <div className="text-xs text-[#607086] mb-2">Bản AI đang so sánh</div>
                        <div className="text-xl font-extrabold text-[#1b2430]">Lần 2</div>
                    </div>
                    <div className="border border-[#dbe3ef] rounded-2xl p-[14px] bg-[#fafcff]">
                        <div className="text-xs text-[#607086] mb-2">Trạng thái review</div>
                        <div className="text-xl font-extrabold text-[#b45309]">Modified</div>
                    </div>
                    <div className="border border-[#dbe3ef] rounded-2xl p-[14px] bg-[#fafcff]">
                        <div className="text-xs text-[#607086] mb-2">Mức khác biệt</div>
                        <div className="text-xl font-extrabold text-[#b45309]">Trung bình</div>
                    </div>
                    <div className="border border-[#dbe3ef] rounded-2xl p-[14px] bg-[#fafcff]">
                        <div className="text-xs text-[#607086] mb-2">Ảnh hưởng lâm sàng</div>
                        <div className="text-xl font-extrabold text-[#b91c1c]">Có</div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-[18px] mb-4 text-[#1b2430]">
                    <div className="border border-[#dbe3ef] rounded-[18px] p-4 bg-[#fcfdff]">
                        <h3 className="m-0 mb-3 text-base font-bold">AI đề xuất</h3>
                        <div className="text-[13px] font-extrabold text-[#334155] mt-[14px] mb-2 uppercase tracking-[0.03em]">Đánh giá ca bệnh</div>
                        <div className="grid gap-2">
                            <div className="border border-[#dbe3ef] rounded-[14px] p-3 bg-white">
                                <div className="font-bold mb-1.5 text-sm">Mức nghi ngờ PJI: Cao</div>
                                <div className="text-[13px] text-[#607086]">
                                    Dựa trên CRP tăng, ESR tăng, đau khớp kéo dài, cấy dịch khớp MRSA.
                                </div>
                            </div>
                        </div>
                        <div className="text-[13px] font-extrabold text-[#334155] mt-[14px] mb-2 uppercase tracking-[0.03em]">Phác đồ gợi ý</div>
                        <div className="grid gap-2">
                            <div className="border border-[#dbe3ef] rounded-[14px] p-3 bg-white border-l-4 border-l-blue-500">
                                <div className="font-bold mb-1.5 text-sm">Vancomycin 15 mg/kg q12h IV</div>
                                <div className="text-[13px] text-[#607086]">
                                    Ưu tiên bao phủ MRSA. Theo dõi chức năng thận trong quá trình dùng thuốc.
                                </div>
                            </div>
                        </div>
                        <div className="text-[13px] font-extrabold text-[#334155] mt-[14px] mb-2 uppercase tracking-[0.03em]">Cảnh báo an toàn</div>
                        <div className="grid gap-2">
                            <div className="border border-red-200 rounded-[14px] p-3 bg-red-50">
                                <div className="font-bold mb-1.5 text-sm text-red-700">Nguy cơ độc tính thận</div>
                                <div className="text-[13px] text-red-600">Creatinine tăng từ 1.1 lên 1.9 mg/dL.</div>
                            </div>
                        </div>
                    </div>

                    <div className="border border-[#dbe3ef] rounded-[18px] p-4 bg-[#fcfdff]">
                        <h3 className="m-0 mb-3 text-base font-bold">Phác đồ bác sĩ đã xác nhận</h3>
                        <div className="text-[13px] font-extrabold text-[#334155] mt-[14px] mb-2 uppercase tracking-[0.03em]">Quyết định cuối</div>
                        <div className="grid gap-2">
                            <div className="border border-[#dbe3ef] rounded-[14px] p-3 bg-white border-l-4 border-l-[#0f766e]">
                                <div className="font-bold mb-1.5 text-sm">Vancomycin 15 mg/kg q24h IV</div>
                                <div className="text-[13px] text-[#607086]">
                                    Giữ thuốc chính, điều chỉnh khoảng cách liều theo eGFR hiện tại.
                                </div>
                            </div>
                        </div>
                        <div className="text-[13px] font-extrabold text-[#334155] mt-[14px] mb-2 uppercase tracking-[0.03em]">Theo dõi / kế hoạch</div>
                        <div className="grid gap-2">
                            <div className="border border-[#dbe3ef] rounded-[14px] p-3 bg-white">
                                <div className="font-bold mb-1.5 text-sm">Theo dõi creatinine mỗi 48 giờ</div>
                                <div className="text-[13px] text-[#607086]">
                                    Hội chẩn thêm dược lâm sàng nếu creatinine tiếp tục tăng.
                                </div>
                            </div>
                        </div>
                        <div className="text-[13px] font-extrabold text-[#334155] mt-[14px] mb-2 uppercase tracking-[0.03em]">Lý do chỉnh sửa</div>
                        <div className="grid gap-2">
                            <div className="border border-[#fde2b7] rounded-[14px] p-3 bg-[#fff9ef]">
                                <div className="font-bold mb-1.5 text-sm text-[#7c4a03]">Giảm nguy cơ độc tính thận</div>
                                <div className="text-[13px] text-[#7c4a03]">
                                    Bác sĩ ưu tiên an toàn do chức năng thận đang xấu đi.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full border border-[#dbe3ef] rounded-2xl mt-1.5 overflow-hidden text-[#1b2430]">
                    <table className="w-full border-collapse text-left text-[13px]">
                        <thead>
                            <tr className="bg-[#f8fbff] text-xs text-[#475569] uppercase tracking-[0.03em] font-semibold border-b border-[#dbe3ef]">
                                <th style={{ width: '22%' }} className="p-[12px_14px]">Hạng mục</th>
                                <th className="p-[12px_14px]">AI đề xuất</th>
                                <th className="p-[12px_14px]">Phác đồ xác nhận</th>
                                <th style={{ width: '16%' }} className="p-[12px_14px]">Mức ảnh hưởng</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white [&_tr:not(:last-child)]:border-b border-[#dbe3ef]">
                            <tr>
                                <td className="p-[12px_14px] align-top">
                                    <strong>Thuốc chính</strong>
                                </td>
                                <td className="p-[12px_14px] align-top">Vancomycin</td>
                                <td className="p-[12px_14px] align-top">Vancomycin</td>
                                <td className="p-[12px_14px] align-top text-[#0f766e] font-bold">Giữ nguyên</td>
                            </tr>
                            <tr>
                                <td className="p-[12px_14px] align-top">
                                    <strong>Khoảng cách liều</strong>
                                </td>
                                <td className="p-[12px_14px] align-top font-medium line-through text-slate-400">q12h</td>
                                <td className="p-[12px_14px] align-top font-bold text-[#b45309]">q24h</td>
                                <td className="p-[12px_14px] align-top text-[#b45309] font-bold">Có thay đổi</td>
                            </tr>
                            <tr>
                                <td className="p-[12px_14px] align-top">
                                    <strong>Đường dùng</strong>
                                </td>
                                <td className="p-[12px_14px] align-top">IV</td>
                                <td className="p-[12px_14px] align-top">IV</td>
                                <td className="p-[12px_14px] align-top text-[#0f766e] font-bold">Giữ nguyên</td>
                            </tr>
                            <tr>
                                <td className="p-[12px_14px] align-top">
                                    <strong>Kế hoạch theo dõi</strong>
                                </td>
                                <td className="p-[12px_14px] align-top">Theo dõi chức năng thận</td>
                                <td className="p-[12px_14px] align-top font-medium text-[#b45309]">Creatinine mỗi 48 giờ</td>
                                <td className="p-[12px_14px] align-top text-[#b45309] font-bold">Cụ thể hơn</td>
                            </tr>
                            <tr>
                                <td className="p-[12px_14px] align-top">
                                    <strong>Lý do lâm sàng</strong>
                                </td>
                                <td className="p-[12px_14px] align-top">Bao phủ MRSA</td>
                                <td className="p-[12px_14px] align-top">Bao phủ MRSA <span className="text-[#b91c1c] font-medium">+ giảm nguy cơ độc tính thận</span></td>
                                <td className="p-[12px_14px] align-top text-[#b91c1c] font-bold bg-red-50 rounded-lg inline-block my-2">Quan trọng</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ComparisonDetails;
