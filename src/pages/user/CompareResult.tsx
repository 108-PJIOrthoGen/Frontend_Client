import React from 'react';
import PatientHeader from '../../components/user/compare_result/PatientHeader';
import TimelineHistory from '../../components/user/compare_result/TimelineHistory';
import ComparisonDetails from '../../components/user/compare_result/ComparisonDetails';

const CompareResult: React.FC = () => {
    return (
        <div className="font-sans bg-[#f6f8fb] text-[#1b2430] h-full overflow-y-auto">
            <div className="bg-white text-black p-4 px-7 flex items-center justify-between">
                <div>
                    <div className="text-xl font-bold">PJI Clinical Decision Support</div>
                    <div className="text-[13px] text-slate-700">Mockup UI lịch sử gợi ý và AI vs Phác đồ đã xác nhận</div>
                </div>

                <div className="max-w-[350px] text-[11px] text-[#607086] italic text-right leading-relaxed">
                    Chú ý: Số lần gợi ý tạo phác đồ không nên vượt quá 3 lần để tránh gây nhiễu cho trong quá trình đưa ra quyết định cuối cùng của bác sĩ.
                </div>

            </div>

            <div className="max-w-[1480px] mx-auto p-6">
                <PatientHeader />

                <div className="grid lg:grid-cols-[440px_1fr] gap-[22px]">
                    <TimelineHistory />

                    <div className="flex flex-col gap-[22px]">
                        <ComparisonDetails />

                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompareResult;