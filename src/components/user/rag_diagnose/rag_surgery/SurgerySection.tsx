import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Input } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { SurgeryPlanData, SurgeryStageData } from '@/types/treatmentType';

export interface SurgerySectionHandle {
  getData: () => SurgeryPlanData;
}

interface SurgerySectionProps {
  surgeryPlan: SurgeryPlanData;
  readOnly?: boolean;
}

const ScalpelIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 2L8 14M8 14L4 18C3 19 3 21 5 21C6.5 21 7.5 20 8 19L14 13M8 14L14 8" />
    <circle cx="19" cy="5" r="1" fill="currentColor" />
  </svg>
);

const SurgerySection = forwardRef<SurgerySectionHandle, SurgerySectionProps>(({
  surgeryPlan,
  readOnly = false,
}, ref) => {
  const [stages, setStages] = useState<SurgeryStageData[]>(() => surgeryPlan.stages ?? []);
  const [editingStageId, setEditingStageId] = useState<number | null>(null);
  const [risksAndComplications, setRisksAndComplications] = useState<string[]>(
    () => surgeryPlan.risksAndComplications ?? []
  );
  const [strategyRationale, setStrategyRationale] = useState(surgeryPlan.strategyRationale ?? '');
  const [priorityNote, setPriorityNote] = useState(surgeryPlan.priorityNote ?? '');
  const [estimatedTotalTreatmentTime, setEstimatedTotalTreatmentTime] = useState(
    surgeryPlan.estimatedTotalTreatmentTime ?? ''
  );
  const [notes, setNotes] = useState(surgeryPlan.notes ?? '');
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [newRisk, setNewRisk] = useState('');

  useImperativeHandle(ref, () => ({
    getData: () => ({
      ...surgeryPlan,
      stages,
      risksAndComplications,
      strategyRationale,
      priorityNote,
      estimatedTotalTreatmentTime,
      notes,
    }),
  }), [surgeryPlan, stages, risksAndComplications, strategyRationale, priorityNote, estimatedTotalTreatmentTime, notes]);

  // --- Stage handlers ---
  const toggleEditStage = useCallback((stageOrder: number) => {
    if (readOnly) return;
    setEditingStageId(prev => (prev === stageOrder ? null : stageOrder));
  }, [readOnly]);

  const handleStageFieldChange = useCallback(
    (stageOrder: number, field: keyof Pick<SurgeryStageData, 'stageName'>, value: string) => {
      if (readOnly) return;
      setStages(prev =>
        prev.map(s => (s.stageOrder === stageOrder ? { ...s, [field]: value } : s))
      );
    },
    [readOnly]
  );

  const handleStageDurationChange = useCallback((stageOrder: number, value: string) => {
    if (readOnly) return;
    const num = parseInt(value, 10);
    setStages(prev =>
      prev.map(s =>
        s.stageOrder === stageOrder
          ? { ...s, estimatedDurationMinutes: isNaN(num) ? 0 : num }
          : s
        )
    );
  }, [readOnly]);

  const handleDeleteStage = useCallback((stageOrder: number) => {
    if (readOnly) return;
    setStages(prev => {
      const filtered = prev.filter(s => s.stageOrder !== stageOrder);
      return filtered.map((s, idx) => ({ ...s, stageOrder: idx + 1 }));
    });
    setEditingStageId(null);
  }, [readOnly]);

  const handleAddStage = useCallback(() => {
    if (readOnly) return;
    setStages(prev => {
      const nextOrder = prev.length + 1;
      const newStage: SurgeryStageData = {
        stageOrder: nextOrder,
        stageName: '',
        estimatedDurationMinutes: 0,
      };
      return [...prev, newStage];
    });
  }, [readOnly]);

  // --- Risk handlers ---
  const handleDeleteRisk = useCallback((index: number) => {
    if (readOnly) return;
    setRisksAndComplications(prev => prev.filter((_, i) => i !== index));
  }, [readOnly]);

  const handleAddRisk = useCallback(() => {
    if (readOnly) return;
    if (!newRisk.trim()) return;
    setRisksAndComplications(prev => [...prev, newRisk.trim()]);
    setNewRisk('');
  }, [newRisk, readOnly]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div style={{
        padding: '12px 14px',
        background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(37,99,235,0.35)',
          }}>
            <ScalpelIcon />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', letterSpacing: '0.04em' }}>
              PHÁC ĐỒ PHẪU THUẬT
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', letterSpacing: '0.03em' }}>
              {surgeryPlan.surgeryStrategyType?.replaceAll('_', ' ') || '—'}
            </div>
          </div>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
          Ưu tiên {surgeryPlan.priorityLevel || '—'}
        </span>
      </div>

      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Indication & Rationale */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 group/info">
          <div className="flex items-center justify-between">
            <p className="text-[12px] uppercase tracking-wide text-slate-700 font-semibold">
              Chỉ định và lý do
            </p>
            {!readOnly && (
              <button
                title={isEditingInfo ? 'Đóng chỉnh sửa' : 'Chỉnh sửa thông tin'}
                onClick={() => setIsEditingInfo(prev => !prev)}
                className={`p-1 rounded-md transition-colors opacity-0 group-hover/info:opacity-100 ${
                  isEditingInfo
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-slate-400 hover:text-yellow-600 hover:bg-yellow-50'
                }`}
              >
                <EditOutlined className="text-sm" />
              </button>
            )}
          </div>
          {isEditingInfo ? (
            <div className="space-y-2 mt-2">
              <Input.TextArea
                size="small"
                placeholder="Chỉ định và lý do"
                value={strategyRationale}
                onChange={e => setStrategyRationale(e.target.value)}
                autoSize={{ minRows: 2, maxRows: 5 }}
              />
              <Input
                size="small"
                placeholder="Ghi chú ưu tiên"
                value={priorityNote}
                onChange={e => setPriorityNote(e.target.value)}
              />
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-700 mt-1 leading-relaxed">{strategyRationale}</p>
              <p className="text-xs text-amber-900 mt-2 bg-amber-50 border border-amber-300 rounded-md px-2 py-1">
                {priorityNote}
              </p>
            </>
          )}
        </div>

        {/* Stages */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
          <div className="space-y-3">
            {stages.map((stage) => {
              const isStageEditing = editingStageId === stage.stageOrder;

              return (
                <div
                  key={stage.stageOrder}
                  className="rounded-lg border border-slate-200 bg-white p-3 group/stage"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Giai đoạn {stage.stageOrder}
                    </span>

                    {isStageEditing ? (
                      <Input
                        size="small"
                        placeholder="Tên giai đoạn"
                        value={stage.stageName}
                        onChange={e => handleStageFieldChange(stage.stageOrder, 'stageName', e.target.value)}
                        className="flex-1 text-sm font-semibold"
                      />
                    ) : (
                      <h4 className="text-sm font-semibold text-slate-900">
                        {stage.stageName || 'Tên giai đoạn'}
                      </h4>
                    )}

                    {isStageEditing ? (
                      <Input
                        size="small"
                        placeholder="Thời gian (phút)"
                        value={stage.estimatedDurationMinutes || ''}
                        onChange={e => handleStageDurationChange(stage.stageOrder, e.target.value)}
                        className="w-24 text-xs"
                        suffix="phút"
                      />
                    ) : (
                      <span className="ml-auto text-xs text-slate-600">
                        ~{stage.estimatedDurationMinutes} phút
                      </span>
                    )}

                    {/* Edit & Delete stage buttons */}
                    {!readOnly && (
                      <div className="flex gap-1 ml-2 opacity-0 group-hover/stage:opacity-100 transition-opacity">
                        <button
                          title={isStageEditing ? 'Đóng chỉnh sửa' : 'Chỉnh sửa giai đoạn'}
                          onClick={() => toggleEditStage(stage.stageOrder)}
                          className={`p-1 rounded-md transition-colors ${
                            isStageEditing
                              ? 'text-blue-600 bg-blue-50'
                              : 'text-slate-400 hover:text-yellow-600 hover:bg-yellow-50'
                          }`}
                        >
                          <EditOutlined className="text-sm" />
                        </button>
                        <button
                          title="Xóa giai đoạn"
                          onClick={() => handleDeleteStage(stage.stageOrder)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <DeleteOutlined className="text-sm" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add stage button */}
            {!readOnly && <div className="mt-4">
              <button
                type="button"
                onClick={handleAddStage}
                className="w-full border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl py-3 flex items-center justify-center text-sm font-medium text-slate-500 hover:text-blue-600 bg-slate-50/40 transition-colors"
              >
                <PlusOutlined className="mr-2" />
                Thêm giai đoạn phẫu thuật
              </button>
            </div>}
          </div>
        </div>

        {/* Estimated total treatment time */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 group/time">
          <span className="text-xs text-slate-600">Tổng thời gian điều trị ước tính:</span>
          {isEditingInfo ? (
            <Input
              size="small"
              value={estimatedTotalTreatmentTime}
              onChange={e => setEstimatedTotalTreatmentTime(e.target.value)}
              className="flex-1 text-xs"
            />
          ) : (
            <span className="text-xs font-semibold text-slate-900">{estimatedTotalTreatmentTime}</span>
          )}
        </div>

        {/* Risks and Complications */}
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-[11px] uppercase font-semibold tracking-wide text-red-700">
            Nguy cơ cần theo dõi
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {risksAndComplications.map((risk, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-1 rounded-full bg-white border border-red-200 text-red-700 flex items-center gap-1 group/risk"
              >
                {risk}
                {!readOnly && (
                  <button
                    title="Xóa nguy cơ"
                    onClick={() => handleDeleteRisk(idx)}
                    className="opacity-0 group-hover/risk:opacity-100 transition-opacity text-red-400 hover:text-red-600"
                  >
                    <DeleteOutlined className="text-[10px]" />
                  </button>
                )}
              </span>
            ))}
          </div>
          {/* Add risk input */}
          {!readOnly && <div className="mt-2 flex gap-2">
            <Input
              size="small"
              placeholder="Thêm nguy cơ mới..."
              value={newRisk}
              onChange={e => setNewRisk(e.target.value)}
              onPressEnter={handleAddRisk}
              className="flex-1 text-xs"
            />
            <button
              type="button"
              onClick={handleAddRisk}
              disabled={!newRisk.trim()}
              className="px-2 py-1 text-xs text-red-600 hover:bg-red-100 rounded-md transition-colors disabled:opacity-40"
            >
              <PlusOutlined />
            </button>
          </div>}

          {/* Notes */}
          {isEditingInfo ? (
            <Input.TextArea
              size="small"
              placeholder="Ghi chú"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              autoSize={{ minRows: 1, maxRows: 3 }}
              className="mt-2 text-xs"
            />
          ) : (
            notes && (
              <p className="text-xs text-red-800 mt-2 leading-relaxed">{notes}</p>
            )
          )}
        </div>
      </div>
    </div>
  );
});

export default SurgerySection;
