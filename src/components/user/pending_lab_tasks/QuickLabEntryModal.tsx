import { useState } from 'react';
import { Modal, InputNumber, Input, Form, Tag, message } from 'antd';
import { callQuickEntryPendingLabTask } from '@/apis/api';
import type { IPendingLabTask } from '@/types/backend';

interface Props {
  task: IPendingLabTask | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const FIELD_META: Record<string, { label: string; unit: string; type: 'number' | 'text' }> = {
  serum_CRP: { label: 'CRP huyết thanh', unit: 'mg/L', type: 'number' },
  serum_ESR: { label: 'Tốc độ máu lắng (ESR)', unit: 'mm/h', type: 'number' },
  serum_D_Dimer: { label: 'D-Dimer', unit: 'ng/mL', type: 'number' },
  serum_IL6: { label: 'IL-6 huyết thanh', unit: 'pg/mL', type: 'number' },
  synovial_WBC: { label: 'Bạch cầu dịch khớp', unit: 'cells/µL', type: 'number' },
  synovial_PMN: { label: 'PMN% dịch khớp', unit: '%', type: 'number' },
  synovial_alpha_defensin: { label: 'Alpha-Defensin', unit: '', type: 'text' },
  synovial_LE: { label: 'Leukocyte Esterase', unit: '', type: 'text' },
  renal_function: { label: 'Creatinine', unit: 'mg/dL', type: 'number' },
  liver_function: { label: 'ALT', unit: 'U/L', type: 'number' },
};

const QuickLabEntryModal: React.FC<Props> = ({ task, open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  if (!task) return null;

  const meta = FIELD_META[task.field ?? ''] ?? {
    label: task.field ?? 'Giá trị',
    unit: '',
    type: 'number',
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      await callQuickEntryPendingLabTask(task.id!, {
        value: values.value,
        unit: meta.unit || undefined,
      });
      message.success('Đã lưu kết quả xét nghiệm');
      form.resetFields();
      onSuccess();
    } catch {
      message.error('Không thể lưu kết quả');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Nhập nhanh kết quả xét nghiệm"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="Lưu"
      cancelText="Hủy"
      destroyOnClose
    >
      <div className="mb-4">
        <p className="text-sm text-slate-500 mb-1">
          Bệnh nhân: <strong>{task.patient?.fullName ?? '—'}</strong>
        </p>
        <p className="text-sm text-slate-500">
          Bệnh án #{task.episode?.id}
          {' '}
          <Tag color={task.importance === 'CRITICAL' ? 'red'
            : task.importance === 'HIGH' ? 'orange' : 'blue'}>
            {task.importance}
          </Tag>
        </p>
      </div>

      <Form form={form} layout="vertical">
        <Form.Item
          name="value"
          label={`${meta.label}${meta.unit ? ` (${meta.unit})` : ''}`}
          rules={[{ required: true, message: 'Vui lòng nhập giá trị' }]}
        >
          {meta.type === 'number' ? (
            <InputNumber className="w-full" placeholder="Nhập giá trị" />
          ) : (
            <Input placeholder="Nhập giá trị" />
          )}
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default QuickLabEntryModal;
