import React, { useState } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Divider,
  Flex,
  List,
  Modal,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { Masonry } from 'antd';
import {
  BookOutlined,
  CaretRightOutlined,
  CloseCircleOutlined,
  DeepSeekFilled,
  GeminiFilled,
  MistralFilled,
  QwenFilled,
  ReloadOutlined,
  RightOutlined,
  SafetyCertificateFilled,
} from '@ant-design/icons';
import sachtk1 from '@/assets/papers/sachtk1.jpeg';
import sachtk2 from '@/assets/papers/sachtk2.png';
import sachtk3 from '@/assets/papers/sachtk3.jpeg';
import sachtk4 from '@/assets/papers/sachtk4.jpeg';
import './TreatmentPlanReadyScreen.css';

const { Title, Text, Paragraph } = Typography;

interface TreatmentPlanReadyScreenProps {
  onStart: () => void;
  isGenerating: boolean;
  loadError?: string | null;
}

interface PaperItem {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  tagColor: string;
  cover: string;
}

const PAPERS: PaperItem[] = [
  {
    id: 'paper-1',
    title: 'The Journal of Arthroplasty',
    subtitle: 'AAHKS American Association of Hip and Knee Surgeons',
    tag: 'Journal',
    tagColor: 'blue',
    cover: sachtk1,
  },
  {
    id: 'paper-2',
    title: 'JBJS - The Journal of Bone & Joint Surgery',
    subtitle: 'Essential Orthopaedic Knowledge',
    tag: 'Journal',
    tagColor: 'geekblue',
    cover: sachtk3,
  },
  {
    id: 'paper-3',
    title: 'Proceedings of the International Consensus Meeting on Periprosthetic Joint Infection',
    subtitle: 'Chairs: Thorsten Gehrke, MD; Javad Parvizi, MD, FRCS',
    tag: 'Consensus Meeting',
    tagColor: 'gold',
    cover: sachtk2,
  },
  {
    id: 'paper-4',
    title: 'Proceedings of the International Consensus Meeting (ICM) on Musculoskeletal Infection',
    subtitle: 'Chairs: Javad Parvizi, MD, FRCS; Thorsten Gehrke, MD',
    tag: 'Consensus Meeting',
    tagColor: 'cyan',
    cover: sachtk4,
  },
];

const EXTENDED_GUIDELINES = [
  {
    title: 'ICM 2018 / 2023 - International Consensus Meeting on PJI',
    desc: 'Đồng thuận toàn cầu về chẩn đoán và quản lý toàn diện nhiễm trùng khớp nhân tạo.',
    badge: 'Consensus Definition',
    org: 'ICM Philadelphia',
  },
  {
    title: 'IDSA Guidelines for the Management of Prosthetic Joint Infection',
    desc: 'Hướng dẫn lựa chọn kháng sinh đích, thời gian điều trị và giám sát độc tính thuốc.',
    badge: 'Clinical Practice Guideline',
    org: 'Infectious Diseases Society of America',
  },
  {
    title: 'EBJIS Consensus Definition for Periprosthetic Joint Infection (2021)',
    desc: 'Hệ thống tiêu chuẩn phân loại xác nhận, nghi ngờ hoặc loại trừ nhiễm trùng khớp.',
    badge: 'Diagnostic Standard',
    org: 'European Bone and Joint Infection Society',
  },
  {
    title: 'AAOS Clinical Practice Guideline: Diagnosis and Prevention of PJI',
    desc: 'Khuyến nghị thực hành lâm sàng của Hiệp hội Phẫu thuật Chỉnh hình Hoa Kỳ.',
    badge: 'Evidence-Based Guideline',
    org: 'American Academy of Orthopaedic Surgeons',
  },
  {
    title: 'MSIS Criteria for Periprosthetic Joint Infection',
    desc: 'Bảng điểm tiêu chuẩn vi sinh, mô bệnh học và dấu ấn viêm hoạt dịch kinh điển.',
    badge: 'MSIS Criteria',
    org: 'Musculoskeletal Infection Society',
  },
  {
    title: 'Sanford Guide to Antimicrobial Therapy (Orthopaedic Section)',
    desc: 'Cơ sở dữ liệu dược lý vi sinh và nồng độ kháng sinh xương khớp cập nhật.',
    badge: 'Antimicrobial Database',
    org: 'Antimicrobial Therapy, Inc.',
  },
];



export const TreatmentPlanReadyScreen: React.FC<TreatmentPlanReadyScreenProps> = ({
  onStart,
  isGenerating,
  loadError,
}) => {
  const [isMoreModalOpen, setIsMoreModalOpen] = useState(false);

  const masonryItems = PAPERS.map((paper, idx) => ({
    key: paper.id,
    data: paper,
    column: idx % 2,
  }));

  return (
    <div className="ready-screen-container" style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 20px 48px' }}>


      {/* Error Alert if previously failed */}
      {loadError && (
        <Alert
          message="Lỗi khởi tạo phác đồ AI"
          description={loadError}
          type="error"
          showIcon
          icon={<CloseCircleOutlined />}
          closable
          action={
            <Button size="small" danger onClick={onStart} loading={isGenerating}>
              Thử lại
            </Button>
          }
          style={{ marginBottom: 24, borderRadius: 12 }}
        />
      )}

      {/* Main Grid: Left side Papers Masonry, Right side Action & Info Card */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.45fr) minmax(320px, 1fr)',
          gap: 28,
          alignItems: 'start',
        }}
      >
        {/* Left Column: Paper & Article Masonry Showcase */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #e2e8f0',
            padding: '24px 24px 20px',
            boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.03)',
          }}
        >
          <Flex align="center" justify="space-between" style={{ marginBottom: 18 }}>
            <Space size={8} align="center">
              <BookOutlined style={{ color: '#059669', fontSize: 18 }} />
              <span
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: '#1e293b',
                  letterSpacing: '-0.01em',
                }}
              >
                Các tài liệu y văn & Hướng dẫn lâm sàng hàng đầu
              </span>
            </Space>

          </Flex>

          {/* Ant Design Masonry Grid */}
          <Masonry
            columns={{ xs: 1, sm: 2, md: 2, lg: 2 }}
            gutter={16}
            items={masonryItems}
            itemRender={({ data }: { data: PaperItem }) => (
              <div
                key={data.id}
                className="paper-card"
                style={{ marginBottom: 16 }}
              >
                <div className="paper-image-wrap">
                  <img
                    src={data.cover}
                    alt={data.title}
                  />
                </div>

                <div style={{ padding: '12px 14px 14px' }}>
                  <Flex justify="space-between" align="center" style={{ marginBottom: 6 }}>
                    <Tag color={data.tagColor} style={{ borderRadius: 4, margin: 0, fontSize: 11, fontWeight: 600 }}>
                      {data.tag}
                    </Tag>
                  </Flex>

                  <Title
                    level={5}
                    style={{
                      margin: '4px 0 4px',
                      fontSize: 14,
                      lineHeight: 1.35,
                      color: '#0f172a',
                      fontWeight: 700,
                    }}
                  >
                    {data.title}
                  </Title>

                  <Paragraph
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: '#64748b',
                      lineHeight: 1.45,
                    }}
                  >
                    {data.subtitle}
                  </Paragraph>
                </div>
              </div>
            )}
          />

          {/* "More..." link matching the mockup */}
          <Flex justify="flex-start" align="center" style={{ marginTop: 8, paddingTop: 12, borderTop: '1px dashed #e2e8f0' }}>
            <Button
              type="link"
              onClick={() => setIsMoreModalOpen(true)}
              style={{
                padding: 0,
                fontSize: 15,
                fontWeight: 700,
                color: '#059669',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              More...
              <RightOutlined style={{ fontSize: 12 }} />
            </Button>
            <Text type="secondary" style={{ marginLeft: 10, fontSize: 13 }}>
              (IDSA, EBJIS 2021, MSIS Criteria, Sanford Antimicrobial Database)
            </Text>
          </Flex>
        </div>

        {/* Right Column: Action CTA Card with Border Beam */}
        <Flex vertical gap={20} style={{ position: 'sticky', top: 24 }}>
          <Card
            style={{
              borderRadius: 20,
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              boxShadow: '0 10px 30px -4px rgba(15, 23, 42, 0.06)',
              overflow: 'hidden',
            }}
            styles={{ body: { padding: '28px 24px' } }}
          >
            <Flex vertical align="center" style={{ textAlign: 'center', width: '100%' }}>
              <Tag
                color="emerald"
                bordered={false}
                style={{
                  background: '#ecfdf5',
                  color: '#059669',
                  fontWeight: 600,
                  fontSize: 12,
                  padding: '2px 8px',
                  borderRadius: 6,
                  border: '1px solid #a7f3d0',
                }}
              >
                ✦ Multi-Agent RAG
              </Tag>
              <Avatar.Group
                size={40}
                max={{
                  count: 3,
                  style: { color: '#059669', backgroundColor: '#d1fae5', fontWeight: 600 },
                }}
              >
                <Tooltip title="DeepSeek Reasoning Engine (R1 / V3) — Phân tích suy luận logic chuyên sâu">
                  <Avatar
                    className="ai-engine-avatar"
                    style={{
                      background: 'linear-gradient(135deg, #4986e8 0%, #43b3e6 100%)',
                      cursor: 'pointer',
                    }}
                    icon={<DeepSeekFilled />}
                  />
                </Tooltip>

                <Tooltip title="Knowledge Hub — Kho tri thức y văn & kháng sinh đồ">
                  <Avatar
                    className="ai-engine-avatar"
                    style={{
                      background: 'linear-gradient(135deg, #e0ab4f 0%, #ea9b71 100%)',
                      cursor: 'pointer',
                    }}
                    icon={<MistralFilled />}
                  />
                </Tooltip>

                <Tooltip title="Google Gemini — Đối chiếu đa phương thức & tổng hợp bằng chứng">
                  <Avatar
                    className="ai-engine-avatar"
                    style={{
                      background: 'linear-gradient(135deg, #7ae664 0%, #c4c64e 100%)',
                      cursor: 'pointer',
                    }}
                    icon={<GeminiFilled />}
                  />
                </Tooltip>

                <Avatar
                  className="ai-engine-avatar"
                  style={{
                    background: 'linear-gradient(135deg, #aed1ed 0%, #4632f5 100%)',
                    cursor: 'pointer',
                  }}
                  icon={<QwenFilled />}
                />
              </Avatar.Group>

              <Title level={4} style={{ margin: '0 0 8px', color: '#0f172a', fontWeight: 800 }}>
                Sẵn sàng tạo phác đồ AI
              </Title>

              <Text style={{ color: '#64748b', fontSize: 14, lineHeight: 1.5, marginBottom: 24, display: 'block' }}>
                Nhấn bắt đầu để khởi chạy quy trình phân tích ca bệnh qua các mô hình AI.
              </Text>

              {/* Glowing Border Beam Button */}
              <div
                className={`border-beam-button-wrap ${isGenerating ? 'is-disabled' : ''}`}
                onClick={!isGenerating ? onStart : undefined}
                style={{ width: '100%', maxWidth: 320 }}
              >
                <div className="border-beam-inner">
                  {isGenerating ? (
                    <>
                      <ReloadOutlined spin style={{ fontSize: 20 }} />
                      <span>Đang khởi tạo...</span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: 19 }}>Bắt đầu</span>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.22)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1.5px solid rgba(255, 255, 255, 0.6)',
                        }}
                      >
                        <CaretRightOutlined style={{ fontSize: 16, color: '#ffffff', marginLeft: 2 }} />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <Text type="secondary" style={{ fontSize: 12, marginTop: 12, display: 'block' }}>
                Thời gian ước tính: ~3 - 4 phút • Kết quả theo thời gian thực
              </Text>
            </Flex>

            <Divider style={{ margin: '24px 0 20px', borderColor: '#f1f5f9' }} />


          </Card>
        </Flex>
      </div>

      {/* Modal showing extended references when clicking "More..." */}
      <Modal
        title={(
          <Space size={10} align="center">
            <BookOutlined style={{ color: '#059669', fontSize: 20 }} />
            <span style={{ fontWeight: 700, fontSize: 18 }}>
              Thư viện Hướng dẫn & Y văn Lâm sàng AI tham khảo
            </span>
          </Space>
        )}
        open={isMoreModalOpen}
        onCancel={() => setIsMoreModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setIsMoreModalOpen(false)}>
            Đã hiểu
          </Button>,
        ]}
        width={760}
        style={{ borderRadius: 16 }}
      >
        <Paragraph style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>
          Hệ thống tổng hợp và đánh chỉ mục từ các bộ hướng dẫn thực hành lâm sàng (Clinical Practice Guidelines) và báo cáo đồng thuận quốc tế uy tín nhất thế giới trong lĩnh vực Nhiễm trùng Khớp nhân tạo (PJI):
        </Paragraph>

        <List
          itemLayout="horizontal"
          dataSource={EXTENDED_GUIDELINES}
          renderItem={(item) => (
            <List.Item
              style={{
                padding: '14px 16px',
                borderRadius: 10,
                marginBottom: 8,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              <List.Item.Meta
                avatar={<SafetyCertificateFilled style={{ color: '#059669', fontSize: 22, marginTop: 4 }} />}
                title={(
                  <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
                    <Text strong style={{ fontSize: 14.5, color: '#0f172a' }}>
                      {item.title}
                    </Text>
                    <Tag color="geekblue" style={{ margin: 0, borderRadius: 4 }}>
                      {item.badge}
                    </Tag>
                  </Flex>
                )}
                description={(
                  <div style={{ marginTop: 4 }}>
                    <Text style={{ color: '#475569', fontSize: 13, display: 'block' }}>
                      {item.desc}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic', marginTop: 2, display: 'block' }}>
                      Nguồn: {item.org}
                    </Text>
                  </div>
                )}
              />
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
};

export default TreatmentPlanReadyScreen;
