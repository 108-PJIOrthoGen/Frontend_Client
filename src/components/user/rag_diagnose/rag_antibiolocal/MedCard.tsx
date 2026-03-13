import React, { useState } from 'react'
import { CheckCircleOutlined, DeleteOutlined, EditOutlined, PlusCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { BrainIcon } from '@/components/icons';

const FORM_META: Record<string, { bg: string; border: string; badge: string; icon: string; label: string }> = {
    default: {
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        badge: 'bg-slate-100 text-slate-700',
        icon: '💊',
        label: 'Thuoc',
    },
};


const MedCard = ({ med, zoneColor }) => {
    const [expanded, setExpanded] = useState(false);
    const [hovered, setHovered] = useState(false);
    const meta = FORM_META[med.form] || FORM_META.default;

    const TECHNIQUE_COLORS = {
        clean: "text-cyan-600 bg-cyan-50",
        apply: "text-violet-600 bg-violet-50",
        cover: "text-slate-600 bg-slate-100",
        irrigate: "text-blue-600 bg-blue-50",
        pack: "text-amber-600 bg-amber-50",
    };

    const TechniqueStep = ({ steps }) => (
        <div className="mt-3 space-y-1.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Kỹ thuật áp dụng</p>
            {steps.map((step, i) => (
                <div key={i} className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg font-medium ${TECHNIQUE_COLORS[step.code] || "text-slate-600 bg-slate-50"}`}>
                    <span className="w-5 h-5 rounded-full bg-white/60 flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                    {step.label}
                </div>
            ))}
        </div>
    );
    return (
        <div
            className={`relative rounded-xl border transition-all duration-200 overflow-hidden ${meta.bg} ${meta.border} ${hovered ? "shadow-md" : "shadow-sm"}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Top action bar */}
            <div className={`absolute top-3 right-3 flex gap-1 transition-all duration-150 ${hovered ? "opacity-100" : "opacity-0"}`}>
                <button title="Hỏi AI" className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-white rounded-lg transition-colors flex items-center gap-1 text-[11px] font-medium">
                    <BrainIcon /> <span className="hidden sm:inline">Hỏi AI</span>
                </button>
                <button title="Thêm thuốc" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"><PlusCircleOutlined /></button>
                <button title="Chỉnh sửa" className="p-1.5 text-slate-400 hover:text-yellow-600 hover:bg-white rounded-lg transition-colors"><EditOutlined /></button>
                <button title="Xóa" className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors"><DeleteOutlined /></button>
            </div>

            <div className="p-4">
                {/* Header */}
                <div className="flex items-start gap-3 mb-3 pr-28">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 bg-white shadow-sm border ${meta.border}`}>
                        {meta.icon}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${meta.badge}`}>{meta.label}</span>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200`}>
                                <CheckCircleOutlined />
                            </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-base mt-0.5">{med.name}</h4>
                    </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                        { label: "Liều lượng", value: med.dose },
                        { label: "Tần suất", value: med.frequency },
                        { label: "Thời gian", value: med.duration },
                    ].map((item) => (
                        <div key={item.label} className="bg-white/70 rounded-lg p-2.5 border border-white">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">{item.label}</p>
                            <p className="text-xs font-bold text-slate-800 leading-tight">{item.value}</p>
                        </div>
                    ))}
                </div>

                {/* Caution */}
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-2">
                    <span className="text-amber-500 mt-0.5 shrink-0"><WarningOutlined /></span>
                    <p className="text-xs text-amber-800 leading-snug">{med.caution}</p>
                </div>

                {/* Expand technique */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full text-xs text-slate-500 hover:text-slate-700 font-medium flex items-center justify-center gap-1 mt-1 py-1 rounded-lg hover:bg-white/50 transition-colors"
                >
                    {expanded ? "▲ Ẩn kỹ thuật" : "▼ Xem kỹ thuật áp dụng"}
                </button>

                {expanded && <TechniqueStep steps={med.technique} />}
            </div>
        </div>
    );
}

export default MedCard
