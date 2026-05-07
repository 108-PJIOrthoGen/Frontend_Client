import React, { useState, useEffect } from 'react';
import { Button, Tag, message, Empty, Alert } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '@/redux/hook';
import { callCreatePendingLabTasksFromCompleteness } from '@/apis/api';
import { fetchMyPendingCount, fetchMyPendingTasks } from '@/redux/slice/pendingLabTaskSlice';
import type { IDataCompleteness, IMissingItem } from '@/types/backend';

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

const importanceColor = (imp?: string) => {
  if (imp === 'CRITICAL') return 'red';
  if (imp === 'HIGH') return 'orange';
  return 'blue';
};

const importanceLabel = (imp?: string) => {
  if (imp === 'CRITICAL') return 'Rất quan trọng';
  if (imp === 'HIGH') return 'Quan trọng';
  return 'Trung bình';
};

const categoryIcon = (cat?: string) => {
  if (cat === 'ICM_MAJOR') return 'emergency';
  if (cat === 'ICM_MINOR') return 'science';
  return 'medical_information';
};

const categoryLabel = (cat?: string) => {
  if (cat === 'ICM_MAJOR') return 'ICM Major';
  if (cat === 'ICM_MINOR') return 'ICM Minor';
  return 'Lâm sàng';
};

const SAVED_REMINDER_KEY_PREFIX = 'pji_savedPendingLabReminder';

const toNumberId = (value?: string | number | null): number | undefined => {
  if (value == null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const getSavedReminderKey = (episodeId?: string | number, runId?: string | null): string | null => {
  if (episodeId == null || episodeId === '') return null;
  return `${SAVED_REMINDER_KEY_PREFIX}:${episodeId}:${runId || 'no-run'}`;
};

const DataCompletenessStep: React.FC<Props> = ({ onNext, onPrev }) => {
  const [completeness, setCompleteness] = useState<IDataCompleteness | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const dispatch = useAppDispatch();
  const currentCase = useAppSelector(state => state.patient.currentCase);

  useEffect(() => {
    setCompleteness(null);
    const runId = localStorage.getItem('pji_aiRunId');
    const savedKey = getSavedReminderKey(currentCase?.episode?.id, runId);
    setSaved(savedKey ? localStorage.getItem(savedKey) === 'true' : false);

    const cachedDetail = localStorage.getItem('pji_aiRunDetail');
    if (cachedDetail) {
      try {
        const detail = JSON.parse(cachedDetail);
        const dc = detail.run?.dataCompletenessJson;
        if (dc) setCompleteness(dc);
      } catch { /* ignore */ }
    }
  }, [currentCase?.episode?.id]);

  const missingItems = completeness?.missing_items ?? [];
  const isComplete = completeness?.is_complete ?? missingItems.length === 0;

  const handleSaveReminders = async () => {
    if (saved || saving) return;

    const episodeId = toNumberId(currentCase?.episode?.id);
    if (!episodeId) return;

    setSaving(true);
    try {
      const runId = localStorage.getItem('pji_aiRunId');
      const runIdNumber = toNumberId(runId);
      await callCreatePendingLabTasksFromCompleteness(
        episodeId,
        {
          patientId: toNumberId(currentCase?.patient?.id),
          runId: runIdNumber,
          missingItems: missingItems as Record<string, unknown>[],
        }
      );
      setSaved(true);
      const savedKey = getSavedReminderKey(currentCase?.episode?.id, runId);
      if (savedKey) localStorage.setItem(savedKey, 'true');
      dispatch(fetchMyPendingTasks());
      dispatch(fetchMyPendingCount());
      message.success('Đã lưu nhắc nhở xét nghiệm');
    } catch {
      message.error('Không thể lưu nhắc nhở');
    } finally {
      setSaving(false);
    }
  };

  const criticalCount = missingItems.filter(i => i.importance === 'CRITICAL').length;
  const highCount = missingItems.filter(i => i.importance === 'HIGH').length;

  return (
    <div className="flex flex-col flex-1 w-full relative bg-slate-50 min-h-full">
      {/* Header */}
      <header className="flex-shrink-0 bg-white/80 backdrop-blur-md border-b justify-between
        border-slate-200/60 px-6 py-4 flex items-center shadow-sm z-20 sticky top-0 w-full">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-amber-400 via-orange-500 to-red-500"></div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600
            flex items-center justify-center shadow-md shadow-amber-500/30">
            <span className="material-symbols-outlined text-white text-2xl">checklist</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              Kiểm tra dữ liệu đầu vào
            </h2>
            <p className="text-xs text-slate-500 font-medium tracking-wide">
              {completeness?.completeness_score ?? ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onPrev}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900
              bg-white border border-slate-300 shadow-sm rounded-xl hover:shadow hover:bg-slate-50">
            Quay lại
          </button>
          <button onClick={onNext}
            className="flex items-center gap-2 px-6 py-2.5 font-bold text-sm rounded-xl shadow-md
              bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700
              hover:to-indigo-700 text-white shadow-blue-500/40 hover:-translate-y-0.5 transition-all">
            Tiếp tục xem phác đồ
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto w-full custom-scrollbar pb-16">
        <div className="max-w-[900px] mx-auto px-4 md:px-8 pt-8 flex flex-col gap-6">

          {/* Impact Alert */}
          {completeness?.impact_note && (
            <Alert
              type={criticalCount > 0 ? 'error' : missingItems.length > 0 ? 'warning' : 'success'}
              showIcon
              message={
                isComplete
                  ? 'Dữ liệu đầy đủ'
                  : `Thiếu ${missingItems.length} chỉ số xét nghiệm`
              }
              description={completeness.impact_note}
            />
          )}

          {isComplete ? (
            <Empty
              image={<CheckCircleOutlined style={{ fontSize: 64, color: '#10b981' }} />}
              description={
                <span className="text-emerald-700 font-medium">
                  Tất cả dữ liệu cần thiết đã có. Kết quả AI có độ tin cậy cao.
                </span>
              }
            />
          ) : (
            <>
              {/* Summary badges */}
              <div className="flex items-center gap-3 flex-wrap">
                {criticalCount > 0 && (
                  <Tag color="red" className="text-sm px-3 py-1">
                    {criticalCount} rất quan trọng
                  </Tag>
                )}
                {highCount > 0 && (
                  <Tag color="orange" className="text-sm px-3 py-1">
                    {highCount} quan trọng
                  </Tag>
                )}
                {missingItems.length - criticalCount - highCount > 0 && (
                  <Tag color="blue" className="text-sm px-3 py-1">
                    {missingItems.length - criticalCount - highCount} trung bình
                  </Tag>
                )}
              </div>

              {/* Missing items list */}
              <div className="flex flex-col gap-3">
                {missingItems.map((item: IMissingItem, idx: number) => (
                  <div key={idx}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm
                      hover:shadow-md hover:-translate-y-0.5 transition-all flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0
                      ${item.importance === 'CRITICAL' ? 'bg-red-50 text-red-500'
                        : item.importance === 'HIGH' ? 'bg-orange-50 text-orange-500'
                        : 'bg-blue-50 text-blue-500'}`}>
                      <span className="material-symbols-outlined">{categoryIcon(item.category)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Tag color={importanceColor(item.importance)} className="text-xs">
                          {importanceLabel(item.importance)}
                        </Tag>
                        <Tag className="text-xs">{categoryLabel(item.category)}</Tag>
                      </div>
                      <p className="text-sm text-slate-700 font-medium">{item.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Save as reminders button */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600
                    flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined">bookmark_add</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800 mb-1">
                      Lưu nhắc nhở bổ sung xét nghiệm
                    </h4>
                    <p className="text-sm text-slate-500 mb-3">
                      Hệ thống sẽ lưu danh sách xét nghiệm thiếu vào mục "Xét nghiệm chờ bổ sung"
                      ở thanh bên. Khi có kết quả, bạn chỉ cần nhập nhanh tại đó.
                    </p>
                    <Button
                      type="primary"
                      onClick={handleSaveReminders}
                      loading={saving}
                      disabled={saved || saving}
                      icon={saved
                        ? <CheckCircleOutlined />
                        : <span className="material-symbols-outlined text-[16px]">bookmark_add</span>}
                      className={saved
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'bg-amber-500 border-amber-500 hover:bg-amber-600'}
                    >
                      {saved ? 'Đã lưu nhắc nhở' : 'Lưu nhắc nhở & tiếp tục'}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataCompletenessStep;
