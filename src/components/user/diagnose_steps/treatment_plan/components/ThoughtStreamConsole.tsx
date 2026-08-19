import React, { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Card, Flex, Space, Spin, Tag, Typography, Collapse } from 'antd';
import {
  BulbOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  CompassOutlined,
  DeepSeekFilled,
  ExperimentOutlined,
  GeminiFilled,
  InfoCircleOutlined,
  LoadingOutlined,
  MistralFilled,
  QwenFilled,
  RobotOutlined,
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import hardenReactMarkdown from 'harden-react-markdown';

const HardenedMarkdown = hardenReactMarkdown(ReactMarkdown);
const { Text, Title } = Typography;

export interface ThoughtLog {
  at: number;
  stage: string;
  message: string;
}

export interface ThoughtStreamConsoleProps {
  logs?: ThoughtLog[];
  stageMessage?: string;
  currentAgent?: string;
  reasoningText?: string;
  isStreaming?: boolean;
  isDone?: boolean;
  isCancelled?: boolean;
  isError?: boolean;
  errorMessage?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

const styles: Record<string, CSSProperties> = {
  wrap: {
    width: '100%',
    maxWidth: 960,
    margin: '0 auto',
    padding: '16px 16px 20px',
  },
  card: {
    width: '100%',
    borderRadius: 16,
    border: '1px solid #e2e8f0',
    background: '#ffffff',
    boxShadow: '0 10px 30px -5px rgba(15, 23, 42, 0.06), 0 4px 12px -2px rgba(15, 23, 42, 0.03)',
    overflow: 'hidden',
  },
  body: {
    padding: '24px 28px 20px',
  },
  headerRow: {
    paddingBottom: 16,
    borderBottom: '1px solid #f1f5f9',
    marginBottom: 18,
  },
  title: {
    margin: 0,
    color: '#1e293b',
    fontSize: 20,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  stageContainer: {
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: '12px 16px',
    marginBottom: 16,
    transition: 'all 0.3s ease',
  },
  stageText: {
    color: '#334155',
    fontSize: 14.5,
    fontWeight: 500,
    lineHeight: 1.5,
  },
  reasoningBox: {
    background: '#fafbfc',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: '18px 20px',
    minHeight: 160,
    maxHeight: '48vh',
    overflowY: 'auto',
    position: 'relative',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  emptyState: {
    color: '#94a3b8',
    fontSize: 14,
    fontStyle: 'italic',
    padding: '32px 16px',
    textAlign: 'center',
  },
  cursor: {
    display: 'inline-block',
    width: 7,
    height: 17,
    background: '#0ea5e9',
    marginLeft: 4,
    verticalAlign: 'text-bottom',
    animation: 'pjiBlink 1s infinite',
  },
  disclaimer: {
    marginTop: 16,
    padding: '10px 14px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    color: '#64748b',
    fontSize: 12.5,
    lineHeight: 1.5,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
  },
};

const formatSeconds = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const agentDisplayMeta = (agentName?: string) => {
  switch (agentName) {
    case 'SynthesisAgent':
      return { label: 'Agent Tổng Hợp & Phác Đồ', color: 'purple', icon: <DeepSeekFilled /> };
    case 'FactualAgent':
      return { label: 'Agent Kiểm Chứng Dữ Liệu', color: 'blue', icon: <QwenFilled /> };
    case 'EvidenceAgent':
      return { label: 'Agent Hướng Dẫn & Y Văn', color: 'cyan', icon: <GeminiFilled /> };
    case 'CompletenessAgent':
      return { label: 'Agent Đánh Giá Ca Bệnh', color: 'orange', icon: <MistralFilled /> };
    default:
      return { label: agentName || 'Agent Điều Phối', color: 'geekblue', icon: <RobotOutlined /> };
  }
};

const ThoughtStreamConsole: React.FC<ThoughtStreamConsoleProps> = ({
  logs = [],
  stageMessage,
  currentAgent = 'Agent Điều Phối',
  reasoningText = '',
  isStreaming = true,
  isDone = false,
  isCancelled = false,
  isError = false,
  errorMessage,
  collapsible = false,
  defaultCollapsed = false,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [elapsed, setElapsed] = useState<number>(0);

  // Timer counter when streaming
  useEffect(() => {
    if (!isStreaming || isDone || isCancelled || isError) return;
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isStreaming, isDone, isCancelled, isError]);

  // Auto-scroll to bottom of reasoning text
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [reasoningText, stageMessage]);

  // Derive active stage message
  const activeStage = stageMessage || (logs.length > 0 ? logs[logs.length - 1].message : 'Đang xử lý...');
  const agentMeta = agentDisplayMeta(currentAgent);

  const renderContent = () => (
    <div>
      {/* 1. VÙNG TIẾN TRÌNH (MACRO STAGE - 1 DÒNG THAY THẾ) */}
      <div style={styles.stageContainer}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
          <Space size={10} align="center">
            {!isDone && !isCancelled && !isError ? (
              <Spin indicator={<LoadingOutlined spin style={{ fontSize: 16, color: '#0284c7' }} />} />
            ) : isDone ? (
              <CheckCircleFilled style={{ fontSize: 16, color: '#10b981' }} />
            ) : isCancelled ? (
              <CloseCircleFilled style={{ fontSize: 16, color: '#94a3b8' }} />
            ) : (
              <CloseCircleFilled style={{ fontSize: 16, color: '#ef4444' }} />
            )}

            <Text style={styles.stageText}>
              {isCancelled
                ? 'Tiến trình đã được huỷ bỏ.'
                : isError
                  ? `Lỗi: ${errorMessage || activeStage}`
                  : activeStage}
            </Text>
          </Space>

          <Tag color={agentMeta.color} icon={agentMeta.icon} style={{ borderRadius: 6, margin: 0 }}>
            {agentMeta.label}
          </Tag>
        </Flex>
      </div>

      {/* 2. VÙNG SUY LUẬN LÂM SÀNG (REASONING STREAM) */}
      <div ref={scrollRef} style={styles.reasoningBox}>
        {reasoningText ? (
          <div className="ai-markdown prose prose-sm prose-slate max-w-none" style={{ color: '#334155', fontSize: '14.5px', lineHeight: 1.7 }}>
            <HardenedMarkdown>{reasoningText}</HardenedMarkdown>
            {isStreaming && !isDone && !isCancelled && !isError && <span style={styles.cursor} />}
          </div>
        ) : (
          <div style={styles.emptyState}>
            {isStreaming ? (
              <Space direction="vertical" align="center" size={12}>
                <Spin indicator={<LoadingOutlined spin style={{ fontSize: 24, color: '#94a3b8' }} />} />
                <span>Hệ thống đang đối chiếu hướng dẫn điều trị & khởi tạo suy luận lâm sàng...</span>
              </Space>
            ) : (
              <span>Chưa có dữ liệu suy luận.</span>
            )}
          </div>
        )}
      </div>

      {/* 3. MEDICAL DISCLAIMER (BẮT BUỘC THEO CONTRACT) */}
      <div style={styles.disclaimer}>
        <InfoCircleOutlined style={{ color: '#0284c7', fontSize: 15, marginTop: 2, flexShrink: 0 }} />
        <span>
          <strong>Lưu ý lâm sàng:</strong> Đây là quá trình suy luận nội bộ của mô hình AI, không phải chỉ định điều trị. Chỉ phác đồ trong phần kết quả cuối mới là khuyến nghị chính thức.
        </span>
      </div>
    </div>
  );

  if (collapsible) {
    return (
      <div style={styles.wrap}>
        <Collapse
          defaultActiveKey={defaultCollapsed ? [] : ['reasoning']}
          style={{ background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
          items={[
            {
              key: 'reasoning',
              label: (
                <Flex justify="space-between" align="center" style={{ width: '100%', paddingRight: 8 }}>
                  <Space size={8}>
                    <BulbOutlined style={{ color: '#6366f1', fontSize: 16 }} />
                    <Text strong style={{ color: '#1e293b', fontSize: 15 }}>
                      Luồng suy luận lâm sàng của AI (Chain-of-Thought)
                    </Text>
                  </Space>
                  <Tag color="purple" style={{ borderRadius: 6, margin: 0 }}>
                    AI Thinking
                  </Tag>
                </Flex>
              ),
              children: renderContent(),
            },
          ]}
        />
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <Card variant="borderless" style={styles.card} styles={{ body: styles.body }}>
        {/* Header */}
        <Flex justify="space-between" align="center" style={styles.headerRow}>
          <Title level={4} style={styles.title}>
            <BulbOutlined style={{ color: '#6366f1' }} />
            Tiến trình & Luồng suy luận AI
          </Title>

          <Space size={12}>
            {isStreaming && !isDone && !isCancelled && (
              <Tag color="processing" style={{ borderRadius: 6 }}>
                Thời gian: {formatSeconds(elapsed)}
              </Tag>
            )}
            <Tag color="cyan" style={{ borderRadius: 6 }}>
              DeepSeek Reasoning
            </Tag>
          </Space>
        </Flex>

        {/* Content */}
        {renderContent()}
      </Card>
    </div>
  );
};

export default ThoughtStreamConsole;
