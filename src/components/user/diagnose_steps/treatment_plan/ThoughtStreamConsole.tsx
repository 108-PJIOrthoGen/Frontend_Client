import React, { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import { Avatar, Card, Flex, Space, Spin, Tag, Timeline, Typography } from 'antd';
import {
  BulbOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  FileSearchOutlined,
  GlobalOutlined,
  LoadingOutlined,
} from '@ant-design/icons';

export interface ThoughtLog {
  at: number;
  stage: string;
  message: string;
}

const { Text, Title } = Typography;

const styles: Record<string, CSSProperties> = {
  wrap: {
    width: '100%',
    padding: '28px 16px 20px',
    background: 'linear-gradient(180deg, #ebe7d5 0%, #fff9e8 100%)',
    borderRadius: 28,
  },
  card: {
    width: '100%',
    maxWidth: 1060,
    margin: '0 auto',
    borderRadius: 42,
    border: '2px solid #d8cc9e',
    background: '#ffffff',
    boxShadow: '0 14px 36px rgba(126, 105, 36, 0.22)',
    overflow: 'hidden',
  },
  body: {
    padding: '34px 40px 20px',
  },
  scroll: {
    maxHeight: '58vh',
    overflowY: 'auto',
    paddingRight: 12,
  },
  title: {
    margin: '0 0 22px',
    color: '#6d6d6d',
    fontSize: 30,
    lineHeight: 1.22,
    fontWeight: 400,
  },
  titleMuted: {
    color: '#b8b8b8',
  },
  message: {
    display: 'block',
    color: '#6b6b6b',
    fontSize: 27,
    lineHeight: 1.25,
    whiteSpace: 'pre-wrap',
  },
  metaRow: {
    marginTop: 14,
  },
  footer: {
    paddingTop: 14,
    borderTop: '1px solid #f0ead7',
    marginTop: 18,
  },
};

const stageTagColor = (stage: string): string => {
  switch (stage) {
    case 'start': return 'gold';
    case 'done': return 'success';
    case 'error': return 'error';
    default: return 'default';
  }
};

const stageLabel = (stage: string): string => {
  switch (stage) {
    case 'start': return 'Khởi tạo';
    case 'done': return 'Hoàn tất';
    case 'error': return 'Lỗi';
    default: return stage || 'Bước xử lý';
  }
};

const formatLogTime = (ts: number): string => {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
};

const isTerminalStage = (stage: string): boolean => stage === 'done' || stage === 'error';

const stageDot = (log: ThoughtLog, isLatest: boolean) => {
  if (log.stage === 'done') {
    return <CheckCircleFilled style={{ color: '#52c41a', fontSize: 15 }} />;
  }
  if (log.stage === 'error') {
    return <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 15 }} />;
  }
  if (isLatest) {
    return <Spin indicator={<LoadingOutlined spin style={{ color: '#7a7a7a', fontSize: 16 }} />} />;
  }
  return <span style={{ display: 'block', width: 12, height: 12, borderRadius: 999, background: '#777777' }} />;
};

const shouldShowEvidenceChips = (stage: string): boolean => {
  const normalized = stage.toLowerCase();
  return normalized.includes('rag')
    || normalized.includes('search')
    || normalized.includes('retriev')
    || normalized.includes('citation')
    || normalized.includes('evidence');
};

const evidenceChips = (
  <Space size={8} wrap style={styles.metaRow}>
    <Tag icon={<GlobalOutlined />} style={{ borderRadius: 999, paddingInline: 12, fontSize: 14 }}>
      RAG
    </Tag>
    <Tag icon={<FileSearchOutlined />} style={{ borderRadius: 999, paddingInline: 12, fontSize: 14 }}>
      ICM / PJI
    </Tag>
    <Tag icon={<BulbOutlined />} style={{ borderRadius: 999, paddingInline: 12, fontSize: 14 }}>
      Hồ sơ ca bệnh
    </Tag>
  </Space>
);

const ThoughtStreamConsole: React.FC<{ logs: ThoughtLog[] }> = ({ logs }) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs.length]);

  const timelineItems = useMemo(() => {
    if (logs.length === 0) {
      return [{
        dot: <Spin indicator={<LoadingOutlined spin style={{ color: '#7a7a7a', fontSize: 16 }} />} />,
        children: (
          <Text style={styles.message}>
            Đang khởi tạo phiên tạo phác đồ...
          </Text>
        ),
      }];
    }

    return logs.map((log, idx) => {
      const isLatest = idx === logs.length - 1 && !isTerminalStage(log.stage);
      return {
        dot: stageDot(log, isLatest),
        children: (
          <div>
            <Text style={styles.message}>{log.message}</Text>
            <Space size={8} wrap style={styles.metaRow}>
              <Tag color={stageTagColor(log.stage)} style={{ borderRadius: 999 }}>
                {stageLabel(log.stage)}
              </Tag>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {formatLogTime(log.at)}
              </Text>
            </Space>
            {shouldShowEvidenceChips(log.stage) && evidenceChips}
          </div>
        ),
      };
    });
  }, [logs]);

  return (
    <div style={styles.wrap}>
      <Card variant="borderless" style={styles.card} styles={{ body: styles.body }}>
        <div ref={scrollerRef} style={styles.scroll}>
          <Title level={2} style={styles.title}>
            Đang tạo phác đồ điều trị <span style={styles.titleMuted}>PJI...</span>
          </Title>

          <Timeline
            mode="left"
            items={timelineItems}
            style={{ margin: 0 }}
          />
        </div>

        <Flex justify="space-between" align="center" gap={10} wrap style={styles.footer}>
          <Space size={10}>
            <Avatar size={28} style={{ background: '#f0f0f0', color: '#6b6b6b' }}>
              AI
            </Avatar>
            <Text type="secondary">{logs.length} bước đã ghi nhận</Text>
          </Space>
          <Text type="secondary">Có thể tạm rời trang - tiến trình vẫn tiếp tục</Text>
        </Flex>
      </Card>
    </div>
  );
};

export default ThoughtStreamConsole;
