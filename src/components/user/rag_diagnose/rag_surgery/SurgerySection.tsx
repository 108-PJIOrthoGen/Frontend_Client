import React, { useState } from 'react';
import { SurgeryPlanData } from '@/components/user/diagnose_steps/treatmentType';

const ScalpelIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 2L8 14M8 14L4 18C3 19 3 21 5 21C6.5 21 7.5 20 8 19L14 13M8 14L14 8" />
        <circle cx="19" cy="5" r="1" fill="currentColor" />
    </svg>
);

const StageItem = ({ stage }: { stage: SurgeryPlanData['stages'][0] }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="rounded-lg border border-slate-200 bg-white-50 overflow-hidden transition-all duration-200 shadow-sm">
            <div
                className="flex flex-wrap items-center gap-2 p-3 cursor-pointer hover:bg-cyan-200 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <span className="text-md font-bold px-2 py-1 rounded-md bg-cyan-100 text-green-700 border border-green-200">
                    Giai đoạn {stage.stageOrder}
                </span>
                <h4 className="text-md font-semibold text-slate-900">{stage.stageName}</h4>
                <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-slate-600">~{stage.estimatedDurationMinutes} phút</span>
                    <svg
                        className={`w-4 h-4 text-slate-400 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

        </div>
    );
};

interface SurgerySectionProps {
    surgeryPlan: SurgeryPlanData;
}

const SurgerySection: React.FC<SurgerySectionProps> = ({ surgeryPlan }) => {

    return (
        <div style={{
            border: "1px solid #cbd5e1",
            borderRadius: "12px",
            background: "#ffffff",
            overflow: "hidden",
            fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif",
        }}>
            <div style={{
                padding: "12px 14px",
                background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
                borderBottom: "1px solid #e2e8f0",
                display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{
                        width: "30px", height: "30px", borderRadius: "8px",
                        background: "linear-gradient(135deg, #1e3a8a, #2563eb)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 2px 10px rgba(37,99,235,0.35)",
                    }}>
                        <ScalpelIcon />
                    </div>
                    <div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", letterSpacing: "0.04em" }}>
                            PHÁC ĐỒ PHẪU THUẬT
                        </div>
                        <div style={{ fontSize: "10px", color: "#64748b", letterSpacing: "0.03em" }}>
                            {surgeryPlan.surgeryStrategyType.replaceAll('_', ' ')}
                        </div>
                    </div>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    Ưu tiên {surgeryPlan.priorityLevel}
                </span>
            </div>

            <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-[12px] uppercase tracking-wide text-slate-700 font-semibold">Chỉ định và lý do</p>
                    <p className="text-sm text-slate-700 mt-1 leading-relaxed">{surgeryPlan.strategyRationale}</p>
                    <p className="text-xs text-amber-700 mt-2 bg-yellow-200 border border-yellow-500 rounded-md px-2 py-1">{surgeryPlan.priorityNote}</p>
                </div>
                <div className="space-y-3">
                    {surgeryPlan.stages.map(stage => (
                        <StageItem key={stage.stageOrder} stage={stage} />
                    ))}
                </div>

                <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 12px", borderRadius: "8px",
                    background: "#f8fafc", border: "1px solid #e2e8f0",
                }}>
                    <span style={{ fontSize: "11px", color: "#334155" }}>
                        Tổng thời gian điều trị ước tính: <span style={{ fontWeight: 600 }}>{surgeryPlan.estimatedTotalTreatmentTime}</span>
                    </span>
                </div>

                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                    <p className="text-[11px] uppercase font-semibold tracking-wide text-red-700">Nguy cơ cần theo dõi</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                        {surgeryPlan.risksAndComplications.map((risk) => (
                            <span key={risk} className="text-xs px-2 py-1 rounded-full bg-white border border-red-200 text-red-700">{risk}</span>
                        ))}
                    </div>
                    <p className="text-xs text-red-800 mt-2 leading-relaxed">{surgeryPlan.notes}</p>
                </div>
            </div>
        </div>
    );
};

export default SurgerySection
