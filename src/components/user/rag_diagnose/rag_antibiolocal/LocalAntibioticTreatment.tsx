import React, { useState, useCallback } from 'react';
import { Input } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { LocalPlanData, TemplateAntibiotic } from '@/components/user/diagnose_steps/treatmentTemplateData';

interface LocalAntibioticTreatmentProps {
    localPlan: LocalPlanData;
}

const LocalAntibioticTreatment: React.FC<LocalAntibioticTreatmentProps> = ({ localPlan }) => {
    const [antibiotics, setAntibiotics] = useState<TemplateAntibiotic[]>(() => localPlan.antibiotics);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const toggleEdit = useCallback((index: number) => {
        setEditingIndex(prev => (prev === index ? null : index));
    }, []);

    const handleFieldChange = useCallback(
        (index: number, field: keyof TemplateAntibiotic, value: string) => {
            setAntibiotics(prev =>
                prev.map((a, i) => (i === index ? { ...a, [field]: value } : a))
            );
        },
        []
    );

    const handleDelete = useCallback((index: number) => {
        setAntibiotics(prev => prev.filter((_, i) => i !== index));
        setEditingIndex(null);
    }, []);

    const handleAdd = useCallback(() => {
        setAntibiotics(prev => [
            ...prev,
            { antibioticName: '', dosage: '', frequency: '', route: '', role: '', notes: '' },
        ]);
    }, []);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <div>
                    <h3 className="text-base font-bold text-slate-900">Phác đồ kháng sinh tại chỗ</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{localPlan.regimenName}</p>
                </div>
                <span className="text-[10px] uppercase tracking-wide font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200 px-2 py-1 rounded-full">
                    {localPlan.durationDays} ngày
                </span>
            </div>

            <div className="p-4 space-y-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] uppercase tracking-wide font-semibold text-slate-500">Chẩn đoán/chỉ định</p>
                    <p className="text-sm text-slate-700 mt-1">{localPlan.indication}</p>
                    <p className="text-xs text-slate-600 mt-2">{localPlan.durationNote}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <p className="text-[11px] uppercase font-semibold tracking-wide text-blue-700 mb-2">Thông tin spacer</p>
                        <div className="space-y-1.5 text-xs text-blue-900">
                            <p><span className="font-semibold">Delivery:</span> {localPlan.deliveryInfo.deliveryMethod}</p>
                            <p><span className="font-semibold">Spacer:</span> {localPlan.deliveryInfo.spacerType}</p>
                            <p><span className="font-semibold">Xi măng gợi ý:</span> {localPlan.deliveryInfo.cementBrandSuggestion}</p>
                            <p><span className="font-semibold">Tỉ lệ trộn:</span> {localPlan.deliveryInfo.mixingRatio}</p>
                        </div>
                    </div>

                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <p className="text-[11px] uppercase font-semibold tracking-wide text-amber-700 mb-1">Theo dõi</p>
                        <ul className="space-y-1">
                            {localPlan.monitoring.map((item) => (
                                <li key={item} className="text-xs text-amber-800">- {item}</li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Antibiotics list */}
                <div className="space-y-2">
                    {antibiotics.map((abx, index) => {
                        const isEditing = editingIndex === index;

                        return (
                            <div key={index} className="rounded-lg border border-slate-200 p-3 bg-white group">
                                {isEditing ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] uppercase font-semibold text-slate-500">Chỉnh sửa kháng sinh</p>
                                            <div className="flex gap-1">
                                                <button
                                                    title="Đóng chỉnh sửa"
                                                    onClick={() => toggleEdit(index)}
                                                    className="p-1 text-blue-600 bg-blue-50 rounded-md transition-colors"
                                                >
                                                    <EditOutlined className="text-sm" />
                                                </button>
                                                <button
                                                    title="Xóa kháng sinh"
                                                    onClick={() => handleDelete(index)}
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
                                            onChange={e => handleFieldChange(index, 'antibioticName', e.target.value)}
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input
                                                size="small"
                                                placeholder="Đường dùng (LOCAL_CEMENT...)"
                                                value={abx.route}
                                                onChange={e => handleFieldChange(index, 'route', e.target.value)}
                                            />
                                            <Input
                                                size="small"
                                                placeholder="Vai trò (PRIMARY...)"
                                                value={abx.role}
                                                onChange={e => handleFieldChange(index, 'role', e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input
                                                size="small"
                                                placeholder="Liều lượng"
                                                value={abx.dosage}
                                                onChange={e => handleFieldChange(index, 'dosage', e.target.value)}
                                            />
                                            <Input
                                                size="small"
                                                placeholder="Tần suất"
                                                value={abx.frequency}
                                                onChange={e => handleFieldChange(index, 'frequency', e.target.value)}
                                            />
                                        </div>
                                        <Input.TextArea
                                            size="small"
                                            placeholder="Ghi chú"
                                            value={abx.notes}
                                            onChange={e => handleFieldChange(index, 'notes', e.target.value)}
                                            autoSize={{ minRows: 1, maxRows: 3 }}
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h4 className="text-md font-semibold text-slate-900">
                                                {abx.antibioticName || 'Tên kháng sinh'}
                                            </h4>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                                                {abx.route || 'Đường dùng'}
                                            </span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                                {abx.role || 'Vai trò'}
                                            </span>

                                            <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    title="Chỉnh sửa kháng sinh"
                                                    onClick={() => toggleEdit(index)}
                                                    className="p-1 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-md transition-colors"
                                                >
                                                    <EditOutlined className="text-[12px]" />
                                                </button>
                                                <button
                                                    title="Xóa kháng sinh"
                                                    onClick={() => handleDelete(index)}
                                                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                >
                                                    <DeleteOutlined className="text-[12px]" />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-md text-slate-700 mt-1">
                                            Liều: {abx.dosage || '—'} | Tần suất: {abx.frequency || '—'}
                                        </p>
                                        {abx.notes && (
                                            <p className="text-md text-cyan-500 mt-1">Note: {abx.notes}</p>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}

                    {/* Add antibiotic button */}
                    <div className="mt-6">
                        <button
                            type="button"
                            onClick={handleAdd}
                            className="w-full border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl py-3 flex items-center justify-center text-sm font-medium text-slate-500 hover:text-blue-600 bg-slate-50/40 transition-colors"
                        >
                            <PlusOutlined className="mr-2" />
                            Thêm kháng sinh mới
                        </button>
                    </div>
                </div>

                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                    <p className="text-[11px] uppercase font-semibold tracking-wide text-rose-700 mb-1">Thận trọng / chống chỉ định</p>
                    <ul className="space-y-1">
                        {localPlan.contraindications.map((item) => (
                            <li key={item} className="text-xs text-rose-800">- {item}</li>
                        ))}
                    </ul>
                    <p className="text-md text-rose-900 mt-2 leading-relaxed">{localPlan.notes}</p>
                </div>
            </div>
        </div>
    );
};

export default LocalAntibioticTreatment;
