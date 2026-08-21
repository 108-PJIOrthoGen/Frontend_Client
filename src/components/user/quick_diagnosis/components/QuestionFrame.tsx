import React from 'react';
import { Button, Card, Progress, Typography } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';

const { Paragraph, Text, Title } = Typography;

export interface QuestionFrameProps {
  current: number;
  total: number;
  statusLabel: string;
  statusColor: string;
  title: string;
  description?: string;
  onBack: () => void;
  onReset: () => void;
  children: React.ReactNode;
}

export const QuestionFrame: React.FC<QuestionFrameProps> = ({
  current,
  total,
  statusLabel,
  statusColor,
  title,
  description,
  onBack,
  onReset,
  children,
}) => {
  const progress = Math.round((current / total) * 100);
  return (
    <Card className="border-slate-200 shadow-sm" styles={{ body: { padding: 0 } }}>
      <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Text strong className="shrink-0 text-slate-800">
            Câu {current} / {total}
          </Text>
          <Progress
            aria-label={`Tiến độ ${progress}%`}
            percent={progress}
            showInfo={false}
            strokeColor="#047857"
            className="!mb-0 max-w-md"
          />
          <Text type="secondary" className="hidden shrink-0 sm:inline">
            {progress}% hoàn thành
          </Text>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="text" icon={<ReloadOutlined />} onClick={onReset}>
            Đặt lại
          </Button>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <Text type="secondary" className="mr-2 text-xs">
              Trạng thái
            </Text>
            <Text strong style={{ color: statusColor }} className="text-sm">
              {statusLabel}
            </Text>
          </div>
        </div>
      </div>

      <div className="px-5 py-7 lg:px-8 lg:py-10">
        <Title level={3} className="!mb-2 !mt-0 !text-slate-900">
          {title}
        </Title>
        {description ? (
          <Paragraph type="secondary" className="!mb-6 max-w-3xl leading-6">
            {description}
          </Paragraph>
        ) : null}
        {children}
        <Button
          type="text"
          className="mt-7 !px-0 !text-slate-500"
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
        >
          Quay lại
        </Button>
      </div>
    </Card>
  );
};
