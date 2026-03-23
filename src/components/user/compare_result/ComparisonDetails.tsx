import React from 'react';
import { Spin, Empty, Tag } from 'antd';
import { IAiRecommendationRunDetail, IAiRecommendationRun, IAiRecommendationItem } from '@/types/backend';
import dayjs from 'dayjs';

interface ComparisonDetailsProps {
    runDetail: IAiRecommendationRunDetail | null;
    runs: IAiRecommendationRun[];
    selectedRunId: string | null;
    loading: boolean;
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    assessment: { label: 'Đánh giá ca bệnh', color: 'text-indigo-700', icon: 'diagnosis' },
    antibiotic: { label: 'Phác đồ kháng sinh', color: 'text-blue-700', icon: 'medication' },
    surgery: { label: 'Phẫu thuật', color: 'text-rose-700', icon: 'surgical' },
    monitoring: { label: 'Theo dõi', color: 'text-teal-700', icon: 'monitor_heart' },
    warning: { label: 'Cảnh báo', color: 'text-red-700', icon: 'warning' },
    explanation: { label: 'Giải thích', color: 'text-slate-700', icon: 'description' },
};

const ComparisonDetails: React.FC<ComparisonDetailsProps> = ({ runDetail, runs, selectedRunId, loading }) => {

    if (loading) {
        return (
            <div className="bg-white border border-[#dbe3ef] rounded-[18px] shadow-sm p-12 flex items-center justify-center">
                <Spin tip="Đang tải chi tiết gợi ý..." />
            </div>
        );
    }

    if (!runDetail || !runDetail.run) {
        return (
            <div className="bg-white border border-[#dbe3ef] rounded-[18px] shadow-sm p-12">
                <Empty description="Chọn một lần gợi ý AI từ timeline để xem chi tiết so sánh." />
            </div>
        );
    }

    const { run, items = [], citations = [] } = runDetail;
    const runIndex = runs.findIndex(r => r.id === selectedRunId);
    const runNumber = runs.length - runIndex;
    const isLatest = runIndex === 0;

    // Group items by category
    const groupedItems = items.reduce<Record<string, IAiRecommendationItem[]>>((acc, item) => {
        const cat = item.category || 'other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {});

    // Sort items within each category by priority
    Object.values(groupedItems).forEach(group =>
        group.sort((a, b) => (a.priorityOrder ?? 999) - (b.priorityOrder ?? 999))
    );

    // Find primary item
    const primaryItem = items.find(i => i.isPrimary);

    return (
        <div className="flex flex-col gap-[22px]">
            {/* Summary Cards */}
            <div className="bg-white border border-[#dbe3ef] rounded-[18px] shadow-[0_10px_30px_rgba(16,24,40,0.08)]">
                <div className="p-[18px_20px] border-b border-[#dbe3ef] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <h2 className="m-0 text-lg font-bold">Chi tiết gợi ý AI</h2>
                        <span className={`text-[11px] font-bold py-1 px-2.5 rounded-full ${isLatest ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                            Lần {runNumber} {isLatest ? '(Mới nhất)' : ''}
                        </span>
                    </div>
                    <div className="text-[13px] text-[#607086]">
                        {run.createdAt ? dayjs(run.createdAt).format('HH:mm DD/MM/YYYY') : '—'}
                    </div>
                </div>

                <div className="p-[18px_20px]">
                    {/* Overview stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                        <div className="border border-[#dbe3ef] rounded-2xl p-[14px] bg-[#fafcff]">
                            <div className="text-xs text-[#607086] mb-2">Số hạng mục</div>
                            <div className="text-xl font-extrabold text-[#1b2430]">{items.length}</div>
                        </div>
                        <div className="border border-[#dbe3ef] rounded-2xl p-[14px] bg-[#fafcff]">
                            <div className="text-xs text-[#607086] mb-2">Danh mục</div>
                            <div className="text-xl font-extrabold text-[#1b2430]">{Object.keys(groupedItems).length}</div>
                        </div>
                        <div className="border border-[#dbe3ef] rounded-2xl p-[14px] bg-[#fafcff]">
                            <div className="text-xs text-[#607086] mb-2">Trích dẫn</div>
                            <div className="text-xl font-extrabold text-[#1b2430]">{citations.length}</div>
                        </div>
                        <div className="border border-[#dbe3ef] rounded-2xl p-[14px] bg-[#fafcff]">
                            <div className="text-xs text-[#607086] mb-2">Trạng thái</div>
                            <div className={`text-xl font-extrabold ${run.status === 'completed' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {run.status === 'completed' ? 'Hoàn thành' : run.status || '—'}
                            </div>
                        </div>
                    </div>

                    {/* Primary recommendation highlight */}
                    {primaryItem && (
                        <div className="border-2 border-blue-200 rounded-2xl p-4 bg-blue-50/40 mb-5">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-blue-600 text-[18px]">star</span>
                                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Khuyến nghị chính</span>
                            </div>
                            <div className="font-bold text-[15px] text-blue-900 mb-1">{primaryItem.title}</div>
                            {primaryItem.itemJson && (
                                <div className="text-[13px] text-blue-700/80 leading-relaxed">
                                    {renderItemDetails(primaryItem.itemJson)}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Grouped items by category */}
                    <div className="grid lg:grid-cols-2 gap-4">
                        {Object.entries(groupedItems).map(([category, categoryItems]) => {
                            const config = CATEGORY_CONFIG[category] || {
                                label: category, color: 'text-slate-700', icon: 'category'
                            };

                            return (
                                <div key={category} className="border border-[#dbe3ef] rounded-[18px] p-4 bg-[#fcfdff]">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className={`material-symbols-outlined text-[16px] ${config.color}`}>{config.icon}</span>
                                        <h3 className={`m-0 text-sm font-bold uppercase tracking-wider ${config.color}`}>
                                            {config.label}
                                        </h3>
                                        <span className="text-[11px] text-slate-400 ml-auto">{categoryItems.length} mục</span>
                                    </div>

                                    <div className="grid gap-2">
                                        {categoryItems.map((item) => (
                                            <div
                                                key={item.id || item.clientItemKey}
                                                className={`border rounded-[14px] p-3 bg-white ${item.isPrimary ? 'border-l-4 border-l-blue-500 border-blue-200' : 'border-[#dbe3ef]'}`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="font-bold mb-1 text-sm text-[#1b2430]">
                                                        {item.title}
                                                    </div>
                                                    {item.isPrimary && (
                                                        <Tag color="blue" className="text-[10px] shrink-0">Chính</Tag>
                                                    )}
                                                </div>
                                                {item.itemJson && (
                                                    <div className="text-[13px] text-[#607086] leading-relaxed">
                                                        {renderItemDetails(item.itemJson)}
                                                    </div>
                                                )}
                                                {item.priorityOrder != null && (
                                                    <div className="text-[11px] text-slate-400 mt-1.5">
                                                        Ưu tiên: {item.priorityOrder}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Citations / Evidence */}
                    {citations.length > 0 && (
                        <div className="mt-5">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-[16px] text-slate-500">menu_book</span>
                                <h3 className="m-0 text-sm font-bold uppercase tracking-wider text-slate-600">
                                    Trích dẫn & Bằng chứng
                                </h3>
                            </div>
                            <div className="grid gap-2">
                                {citations.map((citation, idx) => (
                                    <div key={idx} className="border border-[#dbe3ef] rounded-xl p-3 bg-slate-50/50 flex gap-3">
                                        <div className="text-[11px] font-bold text-slate-400 mt-0.5 shrink-0">[{idx + 1}]</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[13px] font-semibold text-[#1b2430] mb-0.5 truncate">
                                                {citation.sourceTitle || citation.source_title || 'Nguồn tài liệu'}
                                            </div>
                                            {(citation.snippet) && (
                                                <div className="text-[12px] text-[#607086] leading-relaxed line-clamp-2">
                                                    {citation.snippet}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 mt-1.5">
                                                {(citation.sourceType || citation.source_type) && (
                                                    <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                                                        {citation.sourceType || citation.source_type}
                                                    </span>
                                                )}
                                                {(citation.relevanceScore || citation.relevance_score) && (
                                                    <span className="text-[10px] text-slate-400">
                                                        Độ liên quan: {Math.round((citation.relevanceScore || citation.relevance_score) * 100)}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Run Comparison Table - show difference between this run and previous run */}
            {runIndex < runs.length - 1 && (
                <RunDiffNotice
                    currentRun={run}
                    previousRun={runs[runIndex + 1]}
                    runNumber={runNumber}
                />
            )}
        </div>
    );
};

/** Renders key-value details from an item's JSON payload */
function renderItemDetails(json: Record<string, any>): React.ReactNode {
    const displayKeys = Object.entries(json).filter(
        ([, v]) => v != null && v !== '' && typeof v !== 'object'
    );
    if (displayKeys.length === 0) return null;

    return (
        <div className="grid gap-1 mt-1">
            {displayKeys.slice(0, 5).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                    <span className="text-[#8896a8] capitalize shrink-0">{formatKey(key)}:</span>
                    <span className="text-[#1b2430]">{String(value)}</span>
                </div>
            ))}
            {displayKeys.length > 5 && (
                <span className="text-[11px] text-slate-400 italic">+{displayKeys.length - 5} thông tin khác</span>
            )}
        </div>
    );
}

/** Formats camelCase/snake_case keys to readable labels */
function formatKey(key: string): string {
    return key
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .replace(/^\w/, c => c.toUpperCase())
        .trim();
}

/** Notice showing this run was triggered by data changes */
const RunDiffNotice: React.FC<{
    currentRun: IAiRecommendationRun;
    previousRun: IAiRecommendationRun;
    runNumber: number;
}> = ({ currentRun, previousRun, runNumber }) => {
    const timeDiff = currentRun.createdAt && previousRun.createdAt
        ? dayjs(currentRun.createdAt).diff(dayjs(previousRun.createdAt), 'minute')
        : null;

    return (
        <div className="bg-white border border-amber-200 rounded-[18px] shadow-sm p-4">
            <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[18px]">sync</span>
                </div>
                <div className="flex-1">
                    <div className="text-sm font-bold text-amber-800 mb-1">
                        Lần {runNumber} được tạo do dữ liệu xét nghiệm thay đổi
                    </div>
                    <div className="text-[13px] text-amber-700/80 leading-relaxed">
                        Kết quả xét nghiệm hoặc dữ liệu lâm sàng của bệnh án đã được cập nhật, AI đã chạy lại để đưa ra gợi ý phù hợp với dữ liệu mới.
                        {timeDiff != null && (
                            <span className="text-amber-500 ml-1">
                                ({timeDiff < 60 ? `${timeDiff} phút` : `${Math.round(timeDiff / 60)} giờ`} sau lần trước)
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComparisonDetails;
