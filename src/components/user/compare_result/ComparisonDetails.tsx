import React, { useMemo } from 'react';
import { Spin, Empty, Tag } from 'antd';
import { IAiRecommendationRunDetail, IAiRecommendationRun, IAiRecommendationItem, IDoctorRecommendationReview } from '@/types/backend';
import dayjs from 'dayjs';

interface ComparisonDetailsProps {
    runDetail: IAiRecommendationRunDetail | null;
    runs: IAiRecommendationRun[];
    selectedRunId: string | null;
    loading: boolean;
    doctorReview?: IDoctorRecommendationReview | null;
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    SURGERY_PROCEDURE: { label: 'Phẫu thuật', color: 'text-rose-700', icon: 'surgical' },
    SYSTEMIC_ANTIBIOTIC: { label: 'Kháng sinh toàn thân', color: 'text-blue-700', icon: 'medication' },
    LOCAL_ANTIBIOTIC: { label: 'Kháng sinh tại chỗ', color: 'text-cyan-700', icon: 'vaccines' },
    DIAGNOSTIC_TEST: { label: 'Xét nghiệm chẩn đoán', color: 'text-indigo-700', icon: 'diagnosis' },
};

const REVIEW_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
    ACCEPTED: { label: 'Đã chấp nhận', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200' },
    MODIFIED: { label: 'Đã chỉnh sửa', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200' },
    REJECTED: { label: 'Đã từ chối', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' },
    SAVED_DRAFT: { label: 'Bản nháp', color: 'text-slate-700', bgColor: 'bg-slate-50 border-slate-200' },
};

const ComparisonDetails: React.FC<ComparisonDetailsProps> = ({ runDetail, runs, selectedRunId, loading, doctorReview }) => {

    const modificationData = useMemo(() => {
        if (!doctorReview?.modificationJson) return null;
        try {
            const raw = doctorReview.modificationJson;
            return typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch {
            return null;
        }
    }, [doctorReview]);

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




    const primaryItem = items.find(i => i.isPrimary);
    const reviewStatusConfig = doctorReview?.reviewStatus ? REVIEW_STATUS_CONFIG[doctorReview.reviewStatus] : null;

    return (
        <div className="flex flex-col gap-[22px]">
            {/* Doctor Review Status Banner */}
            {doctorReview && reviewStatusConfig && (
                <div className={`border rounded-[18px] p-4 ${reviewStatusConfig.bgColor}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-[20px]">
                                {doctorReview.reviewStatus === 'ACCEPTED' ? 'check_circle' :
                                    doctorReview.reviewStatus === 'MODIFIED' ? 'edit_note' :
                                        doctorReview.reviewStatus === 'REJECTED' ? 'cancel' : 'draft'}
                            </span>
                            <div>
                                <div className={`text-sm font-bold ${reviewStatusConfig.color}`}>
                                    {reviewStatusConfig.label}
                                </div>
                                <div className="text-xs text-slate-500">
                                    Bác sĩ: {doctorReview.createdBy ?? '—'} | {doctorReview.updatedAt ? dayjs(doctorReview.updatedAt).format('HH:mm DD/MM/YYYY') : '—'}
                                </div>
                            </div>
                        </div>
                        <Tag color={doctorReview.reviewStatus === 'ACCEPTED' ? 'green' :
                            doctorReview.reviewStatus === 'MODIFIED' ? 'orange' :
                                doctorReview.reviewStatus === 'REJECTED' ? 'red' : 'default'}>
                            {reviewStatusConfig.label}
                        </Tag>
                    </div>
                    {doctorReview.reviewNote && (
                        <div className="mt-2 text-sm text-slate-700 bg-white/60 rounded-lg px-3 py-2">
                            <span className="font-semibold">Ghi chú:</span> {doctorReview.reviewNote}
                        </div>
                    )}
                    {doctorReview.rejectionReason && (
                        <div className="mt-2 text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">
                            <span className="font-semibold">Lý do từ chối:</span> {doctorReview.rejectionReason}
                        </div>
                    )}
                </div>
            )}

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
                            <div className="text-xs text-[#607086] mb-2">Trích dẫn</div>
                            <div className="text-xl font-extrabold text-[#1b2430]">{citations.length}</div>
                        </div>
                        <div className="border border-[#dbe3ef] rounded-2xl p-[14px] bg-[#fafcff]">
                            <div className="text-xs text-[#607086] mb-2">Trạng thái review</div>
                            <div className={`text-xl font-extrabold ${doctorReview ? (reviewStatusConfig?.color ?? 'text-slate-600') : 'text-slate-400'}`}>
                                {doctorReview ? reviewStatusConfig?.label ?? '—' : 'Chưa review'}
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

                    {/* AI vs Doctor Comparison Section */}
                    {doctorReview?.reviewStatus === 'MODIFIED' && modificationData && (
                        <div className="mb-5">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-[16px] text-amber-600">compare_arrows</span>
                                <h3 className="m-0 text-sm font-bold uppercase tracking-wider text-amber-700">
                                    So sánh AI & Bác sĩ
                                </h3>
                            </div>

                            <div className="grid lg:grid-cols-2 gap-4">
                                {/* AI Original */}
                                <div className="border border-blue-200 rounded-[18px] overflow-hidden">
                                    <div className="bg-blue-50 px-4 py-2.5 border-b border-blue-200 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-blue-600 text-[16px]">smart_toy</span>
                                        <span className="text-sm font-bold text-blue-800">Gợi ý AI gốc</span>
                                    </div>
                                    <div className="p-4 space-y-3 bg-white">
                                        {items.filter(i => i.category === 'SYSTEMIC_ANTIBIOTIC' || i.category === 'LOCAL_ANTIBIOTIC').map((item) => (
                                            <div key={item.id || item.clientItemKey} className="border border-[#dbe3ef] rounded-xl p-3">
                                                <div className="text-xs font-semibold text-blue-600 uppercase mb-1">
                                                    {CATEGORY_CONFIG[item.category ?? '']?.label ?? item.category}
                                                </div>
                                                <div className="font-bold text-sm text-[#1b2430] mb-1">{item.title}</div>
                                                {item.itemJson && (
                                                    <div className="text-[13px] text-[#607086] leading-relaxed">
                                                        {renderItemDetails(item.itemJson)}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Doctor Modified */}
                                <div className="border border-amber-200 rounded-[18px] overflow-hidden">
                                    <div className="bg-amber-50 px-4 py-2.5 border-b border-amber-200 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-amber-600 text-[16px]">person</span>
                                        <span className="text-sm font-bold text-amber-800">Bác sĩ chỉnh sửa</span>
                                    </div>
                                    <div className="p-4 space-y-3 bg-white">
                                        {modificationData.systemicAntibiotic && (
                                            <div className="border border-amber-100 rounded-xl p-3">
                                                <div className="text-xs font-semibold text-amber-600 uppercase mb-1">
                                                    Kháng sinh toàn thân
                                                </div>
                                                <div className="font-bold text-sm text-[#1b2430] mb-1">
                                                    {modificationData.systemicAntibiotic.regimenName}
                                                </div>
                                                <DoctorModificationSummary data={modificationData.systemicAntibiotic} type="systemic" />
                                            </div>
                                        )}
                                        {modificationData.localAntibiotic && (
                                            <div className="border border-amber-100 rounded-xl p-3">
                                                <div className="text-xs font-semibold text-amber-600 uppercase mb-1">
                                                    Kháng sinh tại chỗ
                                                </div>
                                                <div className="font-bold text-sm text-[#1b2430] mb-1">
                                                    {modificationData.localAntibiotic.regimenName}
                                                </div>
                                                <DoctorModificationSummary data={modificationData.localAntibiotic} type="local" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Grouped items by category */}


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
                                                {citation.sourceTitle || 'Nguồn tài liệu'}
                                            </div>
                                            {citation.snippet && (
                                                <div className="text-[12px] text-[#607086] leading-relaxed line-clamp-2">
                                                    {citation.snippet}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 mt-1.5">
                                                {citation.sourceType && (
                                                    <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                                                        {citation.sourceType}
                                                    </span>
                                                )}
                                                {citation.relevanceScore != null && (
                                                    <span className="text-[10px] text-slate-400">
                                                        Độ liên quan: {Math.round(citation.relevanceScore * 100)}%
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
function renderItemDetails(json: Record<string, any> | string): React.ReactNode {
    let parsed: Record<string, any>;
    if (typeof json === 'string') {
        try {
            parsed = JSON.parse(json);
        } catch {
            return <span>{json}</span>;
        }
    } else {
        parsed = json;
    }

    if (!parsed || typeof parsed !== 'object') return null;

    const displayKeys = Object.entries(parsed).filter(
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

/** Renders a summary of the doctor's modifications */
const DoctorModificationSummary: React.FC<{ data: any; type: 'systemic' | 'local' }> = ({ data, type }) => {
    if (type === 'systemic' && data.phases) {
        return (
            <div className="space-y-2 mt-2">
                {data.phases.map((phase: any, idx: number) => (
                    <div key={idx} className="bg-amber-50/50 rounded-lg p-2 border border-amber-100">
                        <div className="text-xs font-semibold text-slate-700">
                            Giai đoạn {phase.phaseOrder}: {phase.phaseName}
                            <span className="text-amber-600 ml-2">({phase.durationWeeks} tuần)</span>
                        </div>
                        {phase.antibiotics?.map((abx: any, aIdx: number) => (
                            <div key={aIdx} className="text-xs text-slate-600 ml-2 mt-1">
                                - {abx.antibioticName} | {abx.dosage} | {abx.frequency} | {abx.route}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        );
    }

    if (type === 'local' && data.antibiotics) {
        return (
            <div className="space-y-1 mt-2">
                {data.antibiotics.map((abx: any, idx: number) => (
                    <div key={idx} className="text-xs text-slate-600 bg-amber-50/50 rounded-lg p-2 border border-amber-100">
                        - {abx.antibioticName} | {abx.dosage} | {abx.frequency} | {abx.route}
                        {abx.notes && <span className="text-amber-600 ml-1">({abx.notes})</span>}
                    </div>
                ))}
            </div>
        );
    }

    return null;
};

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
