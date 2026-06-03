import React, { useMemo } from 'react';
import { Input, Select, Empty, Progress, Tag, Tooltip } from 'antd';
import { useAppSelector, useClinicForm } from '@/redux/hook';
import type { IPendingLabTask } from '@/types/backend';
import type { IClinicFormState, TestItem } from '@/types/types';
import CultureSamplesEditor from '../clinical_assessment/CultureSamplesEditor';
import {
  resolveBinding,
  formKeyForSection,
  isLabBindingFilled,
  isClinicalBindingFilled,
  isCultureFilled,
  type LabFieldBinding,
  type ClinicalControl,
} from './pendingFieldConfig';

const { TextArea } = Input;

interface Props {
  episodeId?: number | string;
}

const importanceColor = (imp?: string) => {
  if (imp === 'CRITICAL') return 'red';
  if (imp === 'HIGH') return 'orange';
  return 'blue';
};

const INFECTION_TYPE_OPTIONS = [
  { value: 'EARLY_POSTOPERATIVE', label: 'Sớm sau mổ (Early postoperative)' },
  { value: 'DELAYED', label: 'Muộn (Delayed)' },
  { value: 'LATE_HEMATOGENOUS', label: 'Đường máu muộn (Late hematogenous)' },
  { value: 'ACUTE_HEMATOGENOUS', label: 'Cấp đường máu (Acute hematogenous)' },
  { value: 'CHRONIC', label: 'Mạn tính (Chronic)' },
  { value: 'UNKNOWN', label: 'Chưa rõ' },
];

const IMPLANT_STABILITY_OPTIONS = [
  { value: 'STABLE', label: 'Ổn định (Stable)' },
  { value: 'POSSIBLY_LOOSE', label: 'Có thể lỏng (Possibly loose)' },
  { value: 'LOOSE', label: 'Lỏng (Loose)' },
  { value: 'UNKNOWN', label: 'Chưa rõ' },
];

/**
 * In-episode "Xét nghiệm chờ bổ sung" tab. Renders each pending field with the
 * widget its `inputType` calls for — a lab table row, a clinical select/textarea,
 * or the culture-sample form — writing straight into the shared clinic form so
 * the episode "Lưu" action persists it (and the server auto-fulfils the task).
 */
const PendingLabTasksTab: React.FC<Props> = ({ episodeId }) => {
  const { form, setForm } = useClinicForm();
  const allTasks = useAppSelector((state) => state.pendingLabTask.tasks);

  // Only this episode's tasks; only the ones still pending need an input.
  const tasks = useMemo(() => {
    const epId = episodeId != null ? Number(episodeId) : null;
    if (epId == null) return [] as IPendingLabTask[];
    return allTasks.filter((t) => Number(t.episode?.id) === epId);
  }, [allTasks, episodeId]);

  const pendingTasks = useMemo(
    () => tasks.filter((t) => (t.status ?? 'PENDING') === 'PENDING'),
    [tasks],
  );

  // Derive each task's binding once.
  const bound = useMemo(
    () =>
      pendingTasks.map((task) => ({
        task,
        binding: resolveBinding(
          task.field,
          task.inputType,
          task.section,
          task.unit,
          task.normalRange,
        ),
      })),
    [pendingTasks],
  );

  const labItems = bound.filter((b) => b.binding.kind === 'lab');
  const clinicalItems = bound.filter((b) => b.binding.kind === 'clinical');
  const cultureItems = bound.filter((b) => b.binding.kind === 'culture');

  // Progress = how many of this episode's pending fields now have a value.
  const filledCount = useMemo(() => {
    let n = 0;
    for (const { binding } of bound) {
      if (binding.kind === 'lab' && isLabBindingFilled(form, binding)) n++;
      else if (binding.kind === 'clinical' && isClinicalBindingFilled(form, binding.control)) n++;
      else if (binding.kind === 'culture' && isCultureFilled(form)) n++;
    }
    return n;
  }, [bound, form]);

  const total = bound.length;
  const percent = total === 0 ? 100 : Math.round((filledCount / total) * 100);

  // --- form mutators -------------------------------------------------------

  const upsertLabRow = (binding: LabFieldBinding, value: string) => {
    const key = formKeyForSection(binding.section);
    setForm((prev) => {
      const rows = (prev[key] ?? []) as TestItem[];
      const idx = rows.findIndex((r) => r.id === binding.id);
      let next: TestItem[];
      if (idx >= 0) {
        next = rows.map((r, i) => (i === idx ? { ...r, result: value } : r));
      } else {
        next = [
          ...rows,
          {
            id: binding.id,
            name: binding.name,
            result: value,
            unit: binding.unit,
            normalRange: binding.normalRange,
          },
        ];
      }
      return { ...prev, [key]: next } as IClinicFormState;
    });
  };

  const labRowValue = (binding: LabFieldBinding): string => {
    const rows = (form[formKeyForSection(binding.section)] ?? []) as TestItem[];
    return rows.find((r) => r.id === binding.id)?.result ?? '';
  };

  const setClinicalRecord = (patch: Partial<IClinicFormState['clinicalRecord']>) =>
    setForm((prev) => ({ ...prev, clinicalRecord: { ...prev.clinicalRecord, ...patch } }));

  const setMedicalHistory = (patch: Partial<IClinicFormState['medicalHistory']>) =>
    setForm((prev) => ({ ...prev, medicalHistory: { ...prev.medicalHistory, ...patch } }));

  const renderClinicalControl = (control: ClinicalControl) => {
    const cr = form.clinicalRecord ?? {};
    switch (control) {
      case 'infectionType':
        return (
          <Select
            value={cr.suspectedInfectionType || undefined}
            onChange={(v) => setClinicalRecord({ suspectedInfectionType: v })}
            placeholder="-- Chọn phân loại nhiễm trùng --"
            className="w-full"
            options={INFECTION_TYPE_OPTIONS}
          />
        );
      case 'implantStability':
        return (
          <Select
            value={cr.implantStability || undefined}
            onChange={(v) => setClinicalRecord({ implantStability: v })}
            placeholder="-- Chọn độ ổn định implant --"
            className="w-full"
            options={IMPLANT_STABILITY_OPTIONS}
          />
        );
      case 'sinusTract':
        return (
          <Select
            value={cr.sinusTract === true ? 'true' : cr.sinusTract === false ? 'false' : undefined}
            onChange={(v) => setClinicalRecord({ sinusTract: v === 'true' })}
            placeholder="-- Có đường rò không? --"
            className="w-full"
            options={[
              { value: 'true', label: 'Có đường rò' },
              { value: 'false', label: 'Không có đường rò' },
            ]}
          />
        );
      case 'allergy':
        return (
          <div className="flex flex-col gap-2">
            <Select
              value={
                form.medicalHistory?.isAllergy === true
                  ? 'true'
                  : form.medicalHistory?.isAllergy === false
                    ? 'false'
                    : undefined
              }
              onChange={(v) => setMedicalHistory({ isAllergy: v === 'true' })}
              placeholder="-- Có dị ứng thuốc không? --"
              className="w-full"
              options={[
                { value: 'true', label: 'Có dị ứng' },
                { value: 'false', label: 'Không dị ứng' },
              ]}
            />
            {form.medicalHistory?.isAllergy === true && (
              <TextArea
                value={form.medicalHistory?.allergyNote ?? ''}
                onChange={(e) => setMedicalHistory({ allergyNote: e.target.value })}
                placeholder="Ghi rõ loại thuốc/dị nguyên gây dị ứng..."
                autoSize={{ minRows: 2 }}
              />
            )}
          </div>
        );
      case 'text':
      default:
        return (
          <TextArea
            value={cr.notations ?? ''}
            onChange={(e) => setClinicalRecord({ notations: e.target.value })}
            placeholder="Nhập mô tả lâm sàng / kết quả giải phẫu bệnh..."
            autoSize={{ minRows: 3 }}
          />
        );
    }
  };

  if (total === 0) {
    return (
      <div className="p-8">
        <Empty description="Không có xét nghiệm/dữ liệu nào chờ bổ sung cho bệnh án này" />
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-6 bg-slate-50/50">
      {/* Progress header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-600">checklist</span>
            Tiến độ bổ sung dữ liệu
          </h4>
          <span className="text-sm font-semibold text-slate-600">
            {filledCount}/{total} trường
          </span>
        </div>
        <Progress percent={percent} status={percent === 100 ? 'success' : 'active'} />
        <p className="text-xs text-slate-500 mt-1">
          Điền các trường bên dưới rồi bấm <strong>Lưu bệnh án</strong> để cập nhật. Khi tất cả
          trường được bổ sung, nhắc nhở của bệnh án này sẽ tự động hoàn tất.
        </p>
      </div>

      {/* Lab fields → table */}
      {labItems.length > 0 && (
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-blue-50 to-slate-50 px-6 py-3 border-b border-blue-100">
            <h4 className="text-blue-900 font-bold text-base flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">science</span>
              Chỉ số xét nghiệm cần bổ sung
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-700">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 border-r border-slate-200">Tên xét nghiệm</th>
                  <th className="px-4 py-3 border-r border-slate-200 w-40">Kết quả</th>
                  <th className="px-4 py-3 border-r border-slate-200 w-32">Chỉ số BT</th>
                  <th className="px-4 py-3 border-r border-slate-200 w-28">Đơn vị</th>
                  <th className="px-4 py-3 w-32">Mức độ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {labItems.map(({ task, binding }) => {
                  const b = binding as LabFieldBinding;
                  return (
                    <tr key={task.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2 font-medium text-slate-900 border-r border-slate-200">
                        <Tooltip title={task.message}>{b.name}</Tooltip>
                      </td>
                      <td className="px-4 py-2 border-r border-slate-200 p-0">
                        <Input
                          type="text"
                          value={labRowValue(b)}
                          onChange={(e) => upsertLabRow(b, e.target.value)}
                          placeholder="Nhập kết quả"
                          className="w-full h-full px-4 py-2 border-none bg-transparent"
                        />
                      </td>
                      <td className="px-4 py-2 border-r border-slate-200 text-slate-700">
                        {b.normalRange || '—'}
                      </td>
                      <td className="px-4 py-2 border-r border-slate-200 text-slate-500">
                        {b.unit || '—'}
                      </td>
                      <td className="px-4 py-2">
                        <Tag color={importanceColor(task.importance)}>{task.importance}</Tag>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Clinical fields → select / textarea */}
      {clinicalItems.length > 0 && (
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-violet-50 to-slate-50 px-6 py-3 border-b border-violet-100">
            <h4 className="text-violet-900 font-bold text-base flex items-center gap-2">
              <span className="material-symbols-outlined text-violet-600">clinical_notes</span>
              Đánh giá lâm sàng cần bổ sung
            </h4>
          </div>
          <div className="p-6 flex flex-col gap-5">
            {clinicalItems.map(({ task, binding }) => (
              <div key={task.id} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700">{task.message}</span>
                  <Tag color={importanceColor(task.importance)}>{task.importance}</Tag>
                </div>
                {renderClinicalControl((binding as { control: ClinicalControl }).control)}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Culture fields → culture sample form */}
      {cultureItems.length > 0 && (
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-amber-50 to-slate-50 px-6 py-3 border-b border-amber-100">
            <h4 className="text-amber-900 font-bold text-base flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600">biotech</span>
              Kết quả nuôi cấy vi khuẩn ({cultureItems[0].task.message})
            </h4>
          </div>
          <CultureSamplesEditor />
        </section>
      )}
    </div>
  );
};

export default PendingLabTasksTab;
