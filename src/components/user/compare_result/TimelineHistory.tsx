import React from 'react';
import { IAiRecommendationRun } from '@/types/backend';
import dayjs from 'dayjs';

interface TimelineHistoryProps {
    runs: IAiRecommendationRun[];
    selectedRunId: string | null;
    onSelectRun: (runId: string) => void;
}

const MAX_RECOMMENDED_RUNS = 3;

const TimelineHistory: React.FC<TimelineHistoryProps> = ({ runs, selectedRunId, onSelectRun }) => {

    const getRunStatusConfig = (run: IAiRecommendationRun, index: number) => {
        const isLatest = index === 0;
        const isSelected = run.id === selectedRunId;

        switch (run.status) {
            case 'SUCCESS':
            case 'PARTIAL':
                if (isLatest) return {
                    dotBorder: 'border-blue-600',
                    cardBorder: isSelected ? 'border-blue-300 shadow-[0_4px_12px_rgba(37,99,235,0.1)]' : 'border-[#dbe3ef]',
                    cardBg: isSelected ? 'bg-blue-50/50' : 'bg-[#fbfdff]',
                    badge: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Mới nhất' },
                    titleColor: isSelected ? 'text-blue-900' : 'text-[#1b2430]',
                    timeColor: isSelected ? 'text-blue-500 font-medium' : 'text-[#607086]',
                };
                return {
                    dotBorder: 'border-slate-400',
                    cardBorder: isSelected ? 'border-blue-300 shadow-[0_4px_12px_rgba(37,99,235,0.1)]' : 'border-[#dbe3ef]',
                    cardBg: isSelected ? 'bg-blue-50/50' : 'bg-[#fbfdff]',
                    badge: { bg: 'bg-slate-100', text: 'text-slate-600', label: run.status === 'PARTIAL' ? 'Một phần' : 'Hoàn thành' },
                    titleColor: 'text-[#1b2430]',
                    timeColor: 'text-[#607086]',
                };
            case 'FAILED':
            case 'TIMEOUT':
                return {
                    dotBorder: 'border-red-500',
                    cardBorder: isSelected ? 'border-red-300' : 'border-red-200',
                    cardBg: 'bg-red-50/30',
                    badge: { bg: 'bg-red-100', text: 'text-red-700', label: run.status === 'TIMEOUT' ? 'Hết thời gian' : 'Thất bại' },
                    titleColor: 'text-red-800',
                    timeColor: 'text-red-400',
                };
            case 'PROCESSING':
            case 'QUEUED':
                return {
                    dotBorder: 'border-amber-500',
                    cardBorder: 'border-amber-200',
                    cardBg: 'bg-amber-50/30',
                    badge: { bg: 'bg-amber-100', text: 'text-amber-700', label: run.status === 'QUEUED' ? 'Đang chờ' : 'Đang xử lý' },
                    titleColor: 'text-amber-800',
                    timeColor: 'text-amber-400',
                };
            default:
                return {
                    dotBorder: 'border-slate-300',
                    cardBorder: isSelected ? 'border-blue-300' : 'border-[#dbe3ef]',
                    cardBg: 'bg-[#fbfdff]',
                    badge: { bg: 'bg-slate-100', text: 'text-slate-600', label: run.status || 'N/A' },
                    titleColor: 'text-[#1b2430]',
                    timeColor: 'text-[#607086]',
                };
        }
    };

    return (
        <div className="bg-white border border-[#dbe3ef] rounded-[18px] shadow-[0_10px_30px_rgba(16,24,40,0.08)] h-fit">
            {/* Header */}
            <div className="p-[18px_20px] border-b border-[#dbe3ef] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="m-0 text-lg font-bold">Lịch sử gợi ý AI</h2>
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${runs.length > MAX_RECOMMENDED_RUNS
                        ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                        {runs.length} lần chạy
                    </span>
                </div>
            </div>

            {/* Timeline */}
            <div className="p-[18px_20px]">
                <div className="relative pl-[18px] before:absolute before:left-[7px] before:top-[8px] before:bottom-[8px] before:w-[2px] before:bg-[#d6e0ef]">
                    {runs.map((run, index) => {
                        const config = getRunStatusConfig(run, index);
                        const runNumber = runs.length - index;
                        const isSelected = run.id === selectedRunId;
                        const isClickable = (run.status === 'SUCCESS' || run.status === 'PARTIAL') && !!run.id;

                        return (
                            <div key={run.id || index} className="relative pl-[18px] mb-[18px] last:mb-0">
                                {/* Timeline dot */}
                                <div className={`absolute left-[-1px] top-[6px] w-4 h-4 rounded-full bg-white border-4 ${config.dotBorder} z-10 ${isSelected ? 'scale-125' : ''} transition-transform`}></div>

                                {/* Card */}
                                <div
                                    className={`border ${config.cardBorder} rounded-2xl p-[14px] ${config.cardBg} ${isClickable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${isSelected ? 'ring-2 ring-blue-200' : ''}`}
                                    onClick={() => isClickable && onSelectRun(run.id!)}
                                >
                                    {/* Header row */}
                                    <div className="flex justify-between gap-2.5 items-start mb-2.5">
                                        <div>
                                            <h3 className={`m-0 text-[15px] font-bold ${config.titleColor}`}>
                                                AI gợi ý lần {runNumber}
                                            </h3>
                                            <span className={`text-[11px] font-bold py-1 px-2.5 rounded-full inline-block ${config.badge.bg} ${config.badge.text} mt-1`}>
                                                {config.badge.label}
                                            </span>
                                        </div>
                                        <div className={`text-xs ${config.timeColor} whitespace-nowrap`}>
                                            {run.createdAt ? dayjs(run.createdAt).format('HH:mm • DD/MM/YYYY') : '—'}
                                        </div>
                                    </div>

                                    {/* Run info */}
                                    <div className="grid grid-cols-[130px_1fr] gap-2 text-[13px] my-1.5">
                                        <div className="text-[#607086]">Trạng thái</div>
                                        <div className={`font-medium ${run.status === 'SUCCESS' ? 'text-emerald-600'
                                            : run.status === 'PARTIAL' ? 'text-emerald-600'
                                                : run.status === 'FAILED' || run.status === 'TIMEOUT' ? 'text-red-600'
                                                    : 'text-amber-600'}`}>
                                            {run.status === 'SUCCESS' ? 'Hoàn thành'
                                                : run.status === 'PARTIAL' ? 'Một phần'
                                                    : run.status === 'FAILED' ? 'Thất bại'
                                                        : run.status === 'TIMEOUT' ? 'Hết thời gian'
                                                            : run.status === 'PROCESSING' ? 'Đang xử lý'
                                                                : run.status === 'QUEUED' ? 'Đang chờ'
                                                                    : run.status || '—'}
                                        </div>
                                    </div>

                                    {run.updatedAt && run.createdAt && (
                                        <div className="grid grid-cols-[130px_1fr] gap-2 text-[13px] my-1.5">
                                            <div className="text-[#607086]">Thời gian xử lý</div>
                                            <div className="font-medium text-[#1b2430]">
                                                {dayjs(run.updatedAt).diff(dayjs(run.createdAt), 'second')}s
                                            </div>
                                        </div>
                                    )}

                                    {/* Action buttons */}
                                    {isClickable && (
                                        <div className="flex gap-2 flex-wrap mt-3">
                                            <div className={`py-1.5 px-2.5 border rounded-[10px] text-xs font-semibold transition-colors ${isSelected
                                                ? 'border-blue-300 bg-blue-50 text-blue-700'
                                                : 'border-[#dbe3ef] bg-white hover:bg-slate-50 text-[#1b2430]'
                                                }`}>
                                                {isSelected ? 'Đang xem' : 'Xem chi tiết'}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer note */}
                {runs.length >= MAX_RECOMMENDED_RUNS && (
                    <div className="mt-3 text-[11px] text-amber-600 italic text-center border-t border-slate-100 pt-3 bg-amber-50/50 -mx-[20px] -mb-[18px] px-[20px] pb-3 rounded-b-[18px]">
                        Đã đạt {MAX_RECOMMENDED_RUNS} lần gợi ý. Khuyến nghị không tạo thêm để tránh gây nhiễu quyết định lâm sàng.
                    </div>
                )}
            </div>
        </div>
    );
};

export default TimelineHistory;
