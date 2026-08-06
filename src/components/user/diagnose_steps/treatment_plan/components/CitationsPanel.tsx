import React from 'react';
import { Badge, Button, Card, Empty, Flex, List, Progress, Space, Tag, Tooltip, Typography } from 'antd';
import { ExportOutlined, FileSearchOutlined, LinkOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import type { CitationData } from '@/types/treatmentType';

interface Props {
  citations: CitationData[];
}

const { Paragraph, Text, Title } = Typography;

const getSourceColor = (sourceType?: string) => {
  const normalized = sourceType?.toLowerCase() ?? '';
  if (normalized.includes('guideline')) return 'blue';
  if (normalized.includes('study') || normalized.includes('trial')) return 'green';
  if (normalized.includes('review')) return 'purple';
  if (normalized.includes('paper') || normalized.includes('article')) return 'cyan';
  return 'default';
};

const getRelevanceColor = (score: number) => {
  if (score >= 0.8) return '#059669';
  if (score >= 0.6) return '#1677ff';
  return '#d48806';
};

const toPercent = (score?: number) => {
  const safeScore = Number.isFinite(score) ? Number(score) : 0;
  return Math.max(0, Math.min(100, Math.round(safeScore * 100)));
};

const CitationsPanel: React.FC<Props> = ({ citations }) => {
  return (
    <div style={{ flex: '1 0 420px', minWidth: 380, maxWidth: 460, height: '100%' }}>
      <Card
        title={(
          <Space size={10}>
            <FileSearchOutlined style={{ color: '#1677ff', fontSize: 18 }} />
            <span>Cơ sở bằng chứng</span>
          </Space>
        )}
        extra={<Badge count={citations.length} showZero color="#1677ff" />}
        styles={{
          body: {
            padding: 0,
            minHeight: 0,
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          },
          header: {
            minHeight: 56,
            borderBottom: '1px solid #eef2f7',
          },
        }}
        style={{
          height: '100%',
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {citations.length === 0 ? (
          <Flex flex={1} align="center" justify="center" style={{ padding: 24 }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Không tìm thấy tài liệu dẫn chứng"
            />
          </Flex>
        ) : (
          <List
            dataSource={citations}
            rowKey={(citation) =>
              citation.sourceUri || `${citation.sourceType}-${citation.sourceTitle}-${citation.citedFor}`
            }
            split
            style={{ flex: 1, overflowY: 'auto' }}
            renderItem={(citation, idx) => {
              const percent = toPercent(citation.relevanceScore);
              const relevanceColor = getRelevanceColor(citation.relevanceScore);

              return (
                <List.Item style={{ padding: 16, alignItems: 'flex-start' }}>
                  <Flex vertical gap={12} style={{ width: '100%', minWidth: 0 }}>
                    <Flex align="flex-start" justify="space-between" gap={12}>
                      <Space size={6} wrap>
                        <Tag color="geekblue">#{idx + 1}</Tag>
                        <Tag color={getSourceColor(citation.sourceType)}>
                          {citation.sourceType || 'Nguồn'}
                        </Tag>
                      </Space>
                      <Tooltip title="Mức độ liên quan của nguồn với khuyến nghị">
                        <Space size={6} style={{ flexShrink: 0 }}>
                          <SafetyCertificateOutlined style={{ color: relevanceColor }} />
                          <Text strong style={{ color: relevanceColor, fontSize: 12 }}>
                            {percent}%
                          </Text>
                        </Space>
                      </Tooltip>
                    </Flex>

                    <div>
                      <Title level={5} style={{ margin: 0, lineHeight: 1.35 }}>
                        {citation.sourceTitle || 'Nguồn tài liệu'}
                      </Title>
                      <Progress
                        percent={percent}
                        showInfo={false}
                        strokeColor={relevanceColor}
                        trailColor="#eef2f7"
                        size="small"
                        style={{ marginTop: 8 }}
                      />
                    </div>

                    {citation.snippet && (
                      <Paragraph
                        style={{
                          margin: 0,
                          padding: '10px 12px',
                          borderLeft: '3px solid #d6e4ff',
                          borderRadius: 6,
                          background: '#f8fafc',
                          color: '#475569',
                          fontSize: 13,
                        }}
                        ellipsis={{ rows: 4, expandable: true, symbol: 'Xem thêm' }}
                      >
                        {citation.snippet}
                      </Paragraph>
                    )}

                    <Flex align="flex-start" justify="space-between" gap={12}>
                      <Space size={6} align="start" style={{ minWidth: 0, flex: 1 }}>
                        <LinkOutlined style={{ color: '#64748b', marginTop: 2 }} />
                        <Text
                          type="secondary"
                          style={{
                            fontSize: 12,
                            whiteSpace: 'normal',
                            overflowWrap: 'anywhere',
                            lineHeight: 1.45,
                          }}
                        >
                          {citation.citedFor || 'Khuyến nghị điều trị'}
                        </Text>
                      </Space>
                      <Button
                        type="link"
                        size="small"
                        href={citation.sourceUri}
                        target="_blank"
                        rel="noreferrer"
                        disabled={!citation.sourceUri}
                        icon={<ExportOutlined />}
                        style={{ paddingInline: 0, flexShrink: 0 }}
                      >
                        Mở nguồn
                      </Button>
                    </Flex>
                  </Flex>
                </List.Item>
              );
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default CitationsPanel;
