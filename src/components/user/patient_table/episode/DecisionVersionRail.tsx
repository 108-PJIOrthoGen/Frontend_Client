import React from 'react';
import { Badge, Empty, Select, Space, Tag, Typography } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, LockOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { IRunClinicalDecision } from '@/types/backend';
import './DecisionVersionRail.css';

const { Text } = Typography;

interface DecisionVersionRailProps {
  runs: IRunClinicalDecision[];
  selectedRunId?: string;
  onRunChange: (runId: string) => void;
  children: React.ReactNode;
}

const decisionLabel = (status?: string): string => {
  if (status === 'SIGNED') return 'Đã ký';
  if (status === 'DRAFT') return 'Bản nháp';
  return 'Chưa có';
};

const decisionColor = (status?: string): string => {
  if (status === 'SIGNED') return '#22c55e';
  if (status === 'DRAFT') return '#f59e0b';
  return '#94a3b8';
};

const runLabel = (item: IRunClinicalDecision): string => (
  `Phiên bản #${item.run.runNo ?? item.run.id ?? '?'}`
);

const actorLabel = (name?: string, email?: string): string => name || email || '—';

const DecisionLine: React.FC<{
  label: string;
  status?: string;
  actorName?: string;
  actorEmail?: string;
}> = ({ label, status, actorName, actorEmail }) => (
  <div className="decision-version-card__line">
    <span>{label}</span>
    <Space size={5}>
      <Badge color={decisionColor(status)} />
      <span>{decisionLabel(status)}</span>
    </Space>
    {status ? <span>{actorLabel(actorName, actorEmail)}</span> : null}
  </div>
);

export const DecisionVersionRail: React.FC<DecisionVersionRailProps> = ({
  runs,
  selectedRunId,
  onRunChange,
  children,
}) => {
  if (!runs.length) {
    return <Empty description="Bệnh án chưa có phiên bản gợi ý AI." />;
  }

  const options = runs.map((item) => ({
    value: String(item.run.id),
    label: `${runLabel(item)} · BS ${decisionLabel(item.doctorDecision?.status)} · DS ${decisionLabel(item.pharmacistDecision?.status)}`,
  }));

  return (
    <div className="decision-workspace">
      <aside className="decision-version-rail" aria-label="Danh sách phiên bản AI">
        <Text strong style={{ fontSize: 15 }}>Phiên bản AI</Text>
        <div className="decision-version-list">
          {runs.map((item) => {
            const runId = String(item.run.id);
            const selected = runId === selectedRunId;
            return (
              <button
                key={runId}
                type="button"
                className={`decision-version-card${selected ? ' is-selected' : ''}`}
                onClick={() => onRunChange(runId)}
                aria-pressed={selected}
              >
                <div className="decision-version-card__header">
                  <strong>{runLabel(item)}</strong>
                  {item.finalSelection ? (
                    <Tag color="green" icon={<CheckCircleOutlined />} style={{ marginInlineEnd: 0 }}>Cuối cùng</Tag>
                  ) : selected ? (
                    <Tag color="blue" style={{ marginInlineEnd: 0 }}>Đang xem</Tag>
                  ) : null}
                </div>
                <div className="decision-version-card__time">
                  <ClockCircleOutlined />{' '}
                  {item.run.createdAt ? dayjs(item.run.createdAt).format('DD/MM/YYYY HH:mm') : '—'}
                </div>
                <DecisionLine
                  label="Bác sĩ"
                  status={item.doctorDecision?.status}
                  actorName={item.doctorDecision?.author?.fullName}
                  actorEmail={item.doctorDecision?.author?.email}
                />
                <DecisionLine
                  label="Dược sĩ"
                  status={item.pharmacistDecision?.status}
                  actorName={item.pharmacistDecision?.author?.fullName}
                  actorEmail={item.pharmacistDecision?.author?.email}
                />
                {!item.canEditDoctor && !item.canEditPharmacist
                  && (item.doctorDecision || item.pharmacistDecision) ? (
                  <div className="decision-version-card__line">
                    <span><LockOutlined /> Chỉ xem</span>
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      </aside>

      <section className="decision-workspace__content">
        <div className="decision-version-mobile">
          <Text strong>Phiên bản AI</Text>
          <Select
            value={selectedRunId}
            options={options}
            onChange={onRunChange}
            style={{ width: '100%', marginTop: 6 }}
          />
        </div>
        {children}
      </section>
    </div>
  );
};

export default DecisionVersionRail;
