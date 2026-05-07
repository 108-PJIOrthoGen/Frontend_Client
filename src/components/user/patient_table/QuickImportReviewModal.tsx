import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Table, Checkbox, Tag, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ExtractApplyCandidate } from '@/types/extractImages';

interface QuickImportReviewModalProps {
  open: boolean;
  candidates: ExtractApplyCandidate[];
  onCancel: () => void;
  onApply: (candidates: ExtractApplyCandidate[]) => void;
}

const GROUP_LABEL: Record<string, string> = {
  hematologyTests: 'Huyết học',
  biochemistryTests: 'Sinh hóa',
  fluidAnalysis: 'Dịch khớp',
  cultureResults: 'Cấy khuẩn',
  unknown: 'Chưa nhận diện',
};

export const QuickImportReviewModal: React.FC<QuickImportReviewModalProps> = ({
  open,
  candidates,
  onCancel,
  onApply,
}) => {
  const [rows, setRows] = useState<ExtractApplyCandidate[]>(candidates);

  useEffect(() => {
    setRows(candidates);
  }, [candidates]);

  const grouped = useMemo(() => {
    const acc: Record<string, ExtractApplyCandidate[]> = {};
    rows.forEach((row) => {
      const key = row.targetGroup || 'unknown';
      acc[key] = acc[key] || [];
      acc[key].push(row);
    });
    return acc;
  }, [rows]);

  const toggle = (id: string, selected: boolean) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, selected } : r)));
  };

  const columns: ColumnsType<ExtractApplyCandidate> = [
    {
      title: 'Áp dụng',
      dataIndex: 'selected',
      width: 80,
      render: (_v, row) => (
        <Checkbox
          checked={row.selected}
          disabled={!row.targetGroup}
          onChange={(e) => toggle(row.id, e.target.checked)}
        />
      ),
    },
    {
      title: 'Tên trích xuất',
      dataIndex: 'sourceName',
      render: (v: string, row) => (
        <div>
          <div className="font-medium">{v}</div>
          {row.targetLabel && <div className="text-xs text-slate-500">→ {row.targetLabel}</div>}
        </div>
      ),
    },
    {
      title: 'Giá trị trích xuất',
      dataIndex: 'extractedValue',
      width: 160,
      render: (v: string, row) => (
        <span className="font-mono">
          {v} {row.unit ? <span className="text-slate-500">{row.unit}</span> : null}
        </span>
      ),
    },
    {
      title: 'Hiện có',
      dataIndex: 'currentValue',
      width: 120,
      render: (v: string | undefined, row) =>
        v ? (
          <span className={`font-mono ${row.conflict ? 'text-orange-600' : 'text-slate-500'}`}>{v}</span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      title: 'Trạng thái',
      width: 120,
      render: (_v, row) => {
        if (!row.targetGroup) return <Tag color="default">Chưa map</Tag>;
        if (row.conflict) return <Tag color="orange">Xung đột</Tag>;
        if (row.currentValue) return <Tag color="blue">Trùng khớp</Tag>;
        return <Tag color="green">Trường rỗng</Tag>;
      },
    },
  ];

  const selectedCount = rows.filter((r) => r.selected).length;

  return (
    <Modal
      title="Xem lại kết quả trích xuất"
      open={open}
      onCancel={onCancel}
      width={960}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Bỏ qua
        </Button>,
        <Button key="apply" type="primary" disabled={selectedCount === 0} onClick={() => onApply(rows)}>
          Áp dụng vào form ({selectedCount})
        </Button>,
      ]}
    >
      <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
        {Object.entries(grouped).map(([key, list]) => (
          <div key={key}>
            <div className="font-semibold mb-2">{GROUP_LABEL[key] || key}</div>
            <Table
              size="small"
              rowKey="id"
              pagination={false}
              columns={columns}
              dataSource={list}
            />
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default QuickImportReviewModal;
