import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Input } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
    SystemicPlanData,
    SystemicPhaseData,
    TemplateAntibiotic,
} from '@/types/treatmentType';

export interface SystemicAntibioticTreatmentHandle {
    getData: () => SystemicPlanData;
}

interface SystemicAntibioticTreatmentProps {
    guidelinePlan: SystemicPlanData;
}

export const SystemicAntibioticTreatment = forwardRef<SystemicAntibioticTreatmentHandle, SystemicAntibioticTreatmentProps>(({
    guidelinePlan,
}, ref) => {
    const [phases, setPhases] = useState<SystemicPhaseData[]>(() => guidelinePlan.phases ?? []);
    const [editingPhaseId, setEditingPhaseId] = useState<number | null>(null);
    const [editingAbxKey, setEditingAbxKey] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
        getData: () => ({ ...guidelinePlan, phases }),
    }), [guidelinePlan, phases]);

    // --- Phase handlers ---
    const toggleEditPhase = useCallback((phaseOrder: number) => {
        setEditingPhaseId(prev => (prev === phaseOrder ? null : phaseOrder));
    }, []);

    const handlePhaseFieldChange = useCallback(
        (phaseOrder: number, field: keyof Pick<SystemicPhaseData, 'phaseName' | 'durationNote'>, value: string) => {
            setPhases(prev =>
                prev.map(p => (p.phaseOrder === phaseOrder ? { ...p, [field]: value } : p))
            );
        },
        []
    );

    const handlePhaseDurationChange = useCallback((phaseOrder: number, value: string) => {
        const num = parseInt(value, 10);
        setPhases(prev =>
            prev.map(p =>
                p.phaseOrder === phaseOrder ? { ...p, durationWeeks: isNaN(num) ? 0 : num } : p
            )
        );
    }, []);

    const handleDeletePhase = useCallback((phaseOrder: number) => {
        setPhases(prev => {
            const filtered = prev.filter(p => p.phaseOrder !== phaseOrder);
            return filtered.map((p, idx) => ({ ...p, phaseOrder: idx + 1 }));
        });
        setEditingPhaseId(null);
    }, []);

    const handleAddPhase = useCallback(() => {
        setPhases(prev => {
            const nextOrder = prev.length + 1;
            const newPhase: SystemicPhaseData = {
                phaseName: '',
                phaseOrder: nextOrder,
                durationWeeks: 0,
                durationNote: '',
                antibiotics: [
                    {
                        antibioticName: '',
                        dosage: '',
                        frequency: '',
                        route: '',
                        role: '',
                        notes: '',
                    },
                ],
            };
            return [...prev, newPhase];
        });
    }, []);

    // --- Antibiotic handlers ---
    const abxKey = (phaseOrder: number, abxIndex: number) => `${phaseOrder}-${abxIndex}`;

    const toggleEditAbx = useCallback((key: string) => {
        setEditingAbxKey(prev => (prev === key ? null : key));
    }, []);

    const handleAbxFieldChange = useCallback(
        (phaseOrder: number, abxIndex: number, field: keyof TemplateAntibiotic, value: string) => {
            setPhases(prev =>
                prev.map(p => {
                    if (p.phaseOrder !== phaseOrder) return p;
                    const updatedAbx = (p.antibiotics ?? []).map((a, i) =>
                        i === abxIndex ? { ...a, [field]: value } : a
                    );
                    return { ...p, antibiotics: updatedAbx };
                })
            );
        },
        []
    );

    const handleDeleteAbx = useCallback((phaseOrder: number, abxIndex: number) => {
        setPhases(prev =>
            prev.map(p => {
                if (p.phaseOrder !== phaseOrder) return p;
                return { ...p, antibiotics: (p.antibiotics ?? []).filter((_, i) => i !== abxIndex) };
            })
        );
        setEditingAbxKey(null);
    }, []);

    const handleAddAntibiotic = useCallback((phaseOrder: number) => {
        setPhases(prev =>
            prev.map(p => {
                if (p.phaseOrder !== phaseOrder) return p;
                const newAbx: TemplateAntibiotic = {
                    antibioticName: '',
                    dosage: '',
                    frequency: '',
                    route: '',
                    role: '',
                    notes: '',
                };
                return { ...p, antibiotics: [...(p.antibiotics ?? []), newAbx] };
            })
        );
    }, []);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Điều trị kháng sinh toàn thân</h3>
                    <p className="text-xs text-slate-500">{guidelinePlan.regimenName}</p>
                </div>
                <span className="text-[10px] uppercase tracking-wide font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-full">
                    {guidelinePlan.totalDurationWeeks} tuần
                </span>
            </div>
            <div className="p-4 relative">
                {/* Indication */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-4">
                    <p className="text-[11px] uppercase tracking-wide font-semibold text-slate-900">Chỉ định</p>
                    <p className="text-sm text-slate-900">{guidelinePlan.indication}</p>
                </div>

                {/* Phases */}
                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                    <div className="space-y-3">
                        {phases.map((phase) => {
                            const isPhaseEditing = editingPhaseId === phase.phaseOrder;

                            return (
                                <div key={phase.phaseOrder} className="rounded-lg border border-slate-200 bg-white p-3 group/phase">
                                    {/* Phase header */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-semibold px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            Giai đoạn {phase.phaseOrder}
                                        </span>

                                        {isPhaseEditing ? (
                                            <Input
                                                size="small"
                                                placeholder="Tên giai đoạn"
                                                value={phase.phaseName}
                                                onChange={e => handlePhaseFieldChange(phase.phaseOrder, 'phaseName', e.target.value)}
                                                className="flex-1 text-sm font-semibold"
                                            />
                                        ) : (
                                            <p className="text-sm font-semibold text-slate-900">{phase.phaseName || 'Tên giai đoạn'}</p>
                                        )}

                                        {isPhaseEditing ? (
                                            <Input
                                                size="small"
                                                placeholder="Số tuần"
                                                value={phase.durationWeeks || ''}
                                                onChange={e => handlePhaseDurationChange(phase.phaseOrder, e.target.value)}
                                                className="w-20 text-xs"
                                                suffix="tuần"
                                            />
                                        ) : (
                                            <span className="ml-auto text-xs text-slate-500">{phase.durationWeeks} tuần</span>
                                        )}

                                        {/* Edit & Delete phase buttons */}
                                        <div className="flex gap-1 ml-2 opacity-0 group-hover/phase:opacity-100 transition-opacity">
                                            <button
                                                title={isPhaseEditing ? 'Đóng chỉnh sửa' : 'Chỉnh sửa giai đoạn'}
                                                onClick={() => toggleEditPhase(phase.phaseOrder)}
                                                className={`p-1 rounded-md transition-colors ${isPhaseEditing
                                                    ? 'text-blue-600 bg-blue-50'
                                                    : 'text-slate-400 hover:text-yellow-600 hover:bg-yellow-50'
                                                    }`}
                                            >
                                                <EditOutlined className="text-sm" />
                                            </button>
                                            <button
                                                title="Xóa giai đoạn"
                                                onClick={() => handleDeletePhase(phase.phaseOrder)}
                                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                            >
                                                <DeleteOutlined className="text-sm" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Phase duration note */}
                                    {isPhaseEditing ? (
                                        <Input
                                            size="small"
                                            placeholder="Ghi chú thời gian"
                                            value={phase.durationNote}
                                            onChange={e => handlePhaseFieldChange(phase.phaseOrder, 'durationNote', e.target.value)}
                                            className="text-xs mb-2"
                                        />
                                    ) : (
                                        <p className="text-xs text-slate-600 mb-2">{phase.durationNote}</p>
                                    )}

                                    {/* Antibiotics list */}
                                    <div className="space-y-2">
                                        {(phase.antibiotics ?? []).map((abx, index) => {
                                            const key = abxKey(phase.phaseOrder, index);
                                            const isAbxEditing = editingAbxKey === key;

                                            return (
                                                <div key={key} className="rounded-md bg-slate-50 border border-slate-200 px-2.5 py-2 group/abx">
                                                    {isAbxEditing ? (
                                                        /* Editing mode */
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-[10px] uppercase font-semibold text-slate-500">Chỉnh sửa kháng sinh</p>
                                                                <div className="flex gap-1">
                                                                    <button
                                                                        title="Đóng chỉnh sửa"
                                                                        onClick={() => toggleEditAbx(key)}
                                                                        className="p-1 text-blue-600 bg-blue-50 rounded-md transition-colors"
                                                                    >
                                                                        <EditOutlined className="text-sm" />
                                                                    </button>
                                                                    <button
                                                                        title="Xóa kháng sinh"
                                                                        onClick={() => handleDeleteAbx(phase.phaseOrder, index)}
                                                                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                                    >
                                                                        <DeleteOutlined className="text-sm" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <Input
                                                                size="small"
                                                                placeholder="Tên kháng sinh"
                                                                value={abx.antibioticName}
                                                                onChange={e => handleAbxFieldChange(phase.phaseOrder, index, 'antibioticName', e.target.value)}
                                                            />
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <Input
                                                                    size="small"
                                                                    placeholder="Đường dùng (IV, ORAL...)"
                                                                    value={abx.route}
                                                                    onChange={e => handleAbxFieldChange(phase.phaseOrder, index, 'route', e.target.value)}
                                                                />
                                                                <Input
                                                                    size="small"
                                                                    placeholder="Vai trò (PRIMARY...)"
                                                                    value={abx.role}
                                                                    onChange={e => handleAbxFieldChange(phase.phaseOrder, index, 'role', e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <Input
                                                                    size="small"
                                                                    placeholder="Liều lượng"
                                                                    value={abx.dosage}
                                                                    onChange={e => handleAbxFieldChange(phase.phaseOrder, index, 'dosage', e.target.value)}
                                                                />
                                                                <Input
                                                                    size="small"
                                                                    placeholder="Tần suất"
                                                                    value={abx.frequency}
                                                                    onChange={e => handleAbxFieldChange(phase.phaseOrder, index, 'frequency', e.target.value)}
                                                                />
                                                            </div>
                                                            <Input.TextArea
                                                                size="small"
                                                                placeholder="Ghi chú"
                                                                value={abx.notes}
                                                                onChange={e => handleAbxFieldChange(phase.phaseOrder, index, 'notes', e.target.value)}
                                                                autoSize={{ minRows: 1, maxRows: 3 }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        /* Display mode */
                                                        <>
                                                            <div className="flex flex-wrap gap-2 items-center">
                                                                <p className="text-xs font-semibold text-slate-900">
                                                                    {abx.antibioticName || 'Tên kháng sinh'}
                                                                </p>
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">
                                                                    {abx.route || 'Đường dùng'}
                                                                </span>
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600">
                                                                    {abx.role || 'Vai trò'}
                                                                </span>

                                                                {/* Edit & Delete abx buttons */}
                                                                <div className="ml-auto flex gap-1 opacity-0 group-hover/abx:opacity-100 transition-opacity">
                                                                    <button
                                                                        title="Chỉnh sửa kháng sinh"
                                                                        onClick={() => toggleEditAbx(key)}
                                                                        className="p-1 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-md transition-colors"
                                                                    >
                                                                        <EditOutlined className="text-[12px]" />
                                                                    </button>
                                                                    <button
                                                                        title="Xóa kháng sinh"
                                                                        onClick={() => handleDeleteAbx(phase.phaseOrder, index)}
                                                                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                                    >
                                                                        <DeleteOutlined className="text-[12px]" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <p className="text-xs text-slate-700 mt-1">
                                                                Liều: {abx.dosage || '—'} | Tần suất: {abx.frequency || '—'}
                                                            </p>
                                                            {abx.notes && (
                                                                <p className="text-xs text-slate-500 mt-1">{abx.notes}</p>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Add antibiotic button */}
                                    <div className="mt-4">
                                        <button
                                            type="button"
                                            onClick={() => handleAddAntibiotic(phase.phaseOrder)}
                                            className="w-full border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl py-3 flex items-center justify-center text-sm font-medium text-slate-500 hover:text-blue-600 bg-slate-50/40 transition-colors"
                                        >
                                            <PlusOutlined className="mr-2" />
                                            Thêm kháng sinh
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Add phase button */}
                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={handleAddPhase}
                                className="w-full border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl py-3 flex items-center justify-center text-sm font-medium text-slate-500 hover:text-blue-600 bg-slate-50/40 transition-colors"
                            >
                                <PlusOutlined className="mr-2" />
                                Thêm phase điều trị mới
                            </button>
                        </div>
                    </div>
                </div>

                {/* Monitoring & Contraindications */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-4 mt-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                            <p className="text-[11px] uppercase font-semibold tracking-wide text-amber-700 mb-1">Theo dõi</p>
                            <ul className="space-y-1">
                                {(guidelinePlan.monitoring ?? []).map((item) => (
                                    <li key={item} className="text-md text-slate-800">- {item}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                            <p className="text-[11px] uppercase font-semibold tracking-wide text-rose-700 mb-1">Thận trọng / chống chỉ định</p>
                            <ul className="space-y-1">
                                {(guidelinePlan.contraindications ?? []).map((item) => (
                                    <li key={item} className="text-md text-slate-800">- {item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <p className="text-xs leading-relaxed text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <span className="font-semibold text-red-700">Lưu ý:</span> {guidelinePlan.notes}
                    </p>
                </div>
            </div>
        </div>
    );
});
