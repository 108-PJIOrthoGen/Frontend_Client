import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Row,
  Space,
  Tag,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CalculatorOutlined,
  CheckCircleFilled,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ExperimentOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { pageStyles } from './style';
import { usePjiAssessment } from './hooks/usePjiAssessment';
import type { RecommendationScope } from '@/types/backend';
import {
  asArray,
  conclusionLabel,
  conclusionTone,
  criterionDetailColor,
  formatEnumText,
  formatScore,
  infectionClassificationLabel,
  organismInitials,
  severityAlertType,
  toNumber,
} from './utils/assessmentPresentation';

interface ClinicalAssessmentProps {
  onNext?: () => void;
  onPrev?: () => void;
  recommendationScope?: RecommendationScope;
}

const { Paragraph, Text, Title } = Typography;

const SCORE_SCALE_MAX = 12;
const NOT_INFECTED_MAX_SCORE = 3;
const INFECTED_MIN_SCORE = 6;

export const S5AssessmentPji = ({ onNext, onPrev, recommendationScope = 'SURGERY' }: ClinicalAssessmentProps) => {
  const {
    diagnosticData,
    errorMsg,
    evaluateDiagnostic,
    isDiagnosticLoading,
    showResults,
  } = usePjiAssessment(recommendationScope);

  const scoringSystem = diagnosticData?.scoring_system;
  const majorCriteria = diagnosticData?.major_criteria;
  const minorCriteriaScoring = diagnosticData?.minor_criteria_scoring;
  const aiReasoning = diagnosticData?.ai_reasoning;
  const organism = aiReasoning?.identified_organism;
  const totalScore = toNumber(scoringSystem?.total_score ?? minorCriteriaScoring?.total_minor_score);
  const scoreScaleMax = Math.max(SCORE_SCALE_MAX, totalScore);
  const scorePercent = Math.min(100, Math.max(0, (totalScore / scoreScaleMax) * 100));
  const majorItems = asArray<Record<string, any>>(majorCriteria?.items);
  const minorItems = asArray<Record<string, any>>(minorCriteriaScoring?.items);
  const warnings = asArray<Record<string, any>>(aiReasoning?.warnings)
    .filter(warning => warning?.type !== 'DATA_COMPLETENESS');
  const interpretation = scoringSystem?.interpretation;
  const clinicianConclusion = scoringSystem?.interpretation_label ?? conclusionLabel(interpretation);
  const isInfected = interpretation === 'INFECTED';
  const tone = conclusionTone(interpretation);
  const scoreMarkerPercent = Math.min(96, Math.max(4, scorePercent));
  const primaryDiagnosis = aiReasoning?.primary_diagnosis ?? diagnosticData?.title ?? 'Đánh giá PJI theo luật hệ thống';

  if (!showResults || !diagnosticData) {
    return (
      <div style={pageStyles.page}>
        <div style={pageStyles.shell}>
          <div style={pageStyles.emptyWrap}>
            <Card style={pageStyles.emptyCard}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={(
                  <Space direction="vertical" size={6}>
                    <Title level={4} style={{ margin: 0 }}>
                      {errorMsg ? 'Lỗi tính chẩn đoán' : 'Sẵn sàng tính chẩn đoán'}
                    </Title>
                    <Text type="secondary">
                      {errorMsg || 'Dữ liệu ca bệnh sẽ được tính bằng Rule-Based Engine để đưa ra kết luận nhiễm trùng PJI, điểm số và các tiêu chí chính/phụ.'}
                    </Text>
                  </Space>
                )}
              >
                <Button
                  type="primary"
                  size="large"
                  icon={errorMsg ? <ReloadOutlined /> : <CalculatorOutlined />}
                  loading={isDiagnosticLoading}
                  onClick={evaluateDiagnostic}
                  block
                >
                  {errorMsg ? 'Thử lại' : 'Tính chẩn đoán'}
                </Button>
              </Empty>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyles.page}>
      <div style={pageStyles.actionBar}>
        <Button icon={<ArrowLeftOutlined />} onClick={onPrev}>
          Quay lại
        </Button>
        <Button type="primary" icon={<ArrowRightOutlined />} onClick={onNext}>
          Tiếp tục
        </Button>
      </div>
      <div style={pageStyles.shell}>
        <Row align="top" justify="space-between" gutter={[20, 14]} style={pageStyles.header}>
          <Col flex="auto">
            <Title level={5}>
              Kết quả theo quy tắc chẩn đoán:
            </Title>
            <Title level={2} style={pageStyles.title}>
              {primaryDiagnosis}
              {organism?.name && organism.name !== 'Chưa xác định' ? ` - ${organism.name}` : ''}
            </Title>
            {isInfected && (
              <Space size={8} wrap style={{ marginTop: 10 }}>
                <Tag color="warning">
                  Phân loại: {infectionClassificationLabel(aiReasoning?.infection_classification)}
                </Tag>
              </Space>
            )}
          </Col>

          <Col>
            <Card
              style={{ ...pageStyles.resultCard, borderColor: tone.border, background: tone.background }}
              styles={{ body: pageStyles.resultCardBody }}
            >
              <div style={pageStyles.resultGrid}>
                <div>
                  <Text style={pageStyles.resultLabel}>Kết luận hệ thống</Text>
                  <Text
                    strong
                    style={{
                      color: tone.color,
                      fontSize: 20,
                      lineHeight: 1.2,
                    }}
                  >
                    {clinicianConclusion}
                  </Text>
                </div>
                <div>
                  <Text style={pageStyles.resultLabel}>Tổng điểm</Text>
                  <Text
                    strong
                    style={{
                      color: tone.color,
                      fontSize: 20,
                      lineHeight: 1.2,
                      marginRight: 4,
                    }}
                  >
                    {formatScore(totalScore)}
                  </Text>
                  <Text type="secondary">điểm</Text>
                </div>

              </div>
            </Card>
          </Col>
        </Row>

        <Card style={pageStyles.scoreCard} styles={{ body: pageStyles.scoreCardBody }}>
          <Title level={4} style={pageStyles.scoreTitle}>Ngưỡng điểm tiêu chí phụ</Title>

          <div style={pageStyles.scoreRailArea}>
            <div style={{ ...pageStyles.scoreMarker, left: `${scoreMarkerPercent}%` }}>
              {formatScore(totalScore)} điểm
              <div style={pageStyles.markerLine} />
            </div>
            <div style={pageStyles.scoreRail} />
            <div style={pageStyles.scoreLabels}>
              <span>&le;{NOT_INFECTED_MAX_SCORE} không nhiễm</span>
              <span>4-5 chưa rõ</span>
              <span>&ge;{INFECTED_MIN_SCORE} nhiễm trùng</span>
            </div>
          </div>

          <Alert
            showIcon
            type="info"
            icon={<InfoCircleOutlined />}
            message={aiReasoning?.reasoning_summary || scoringSystem?.confidence_note}
            style={{ marginTop: 16, borderRadius: 6 }}
          />

          {organism && (
            <>
              <Divider style={{ margin: '16px 0' }} />
              <div style={pageStyles.organismRow}>
                <div style={pageStyles.organismLeft}>
                  <Avatar style={{ background: '#e0f2fe', color: '#2563eb', fontWeight: 800 }}>
                    {organismInitials(organism.name)}
                  </Avatar>
                  <Space size={8} wrap>
                    <Text style={pageStyles.organismName}>{organism.name}</Text>
                    {organism.resistance_profile && (
                      <Tag color="red">{organism.resistance_profile}</Tag>
                    )}
                    {organism.biofilm_forming && (
                      <Tag>Tạo màng sinh học</Tag>
                    )}
                  </Space>
                </div>
                <Text style={pageStyles.organismDetail}>{organism.resistance_detail}</Text>
              </div>
            </>
          )}
        </Card>

        {warnings.length > 0 && (
          <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
            {warnings.map((warning, index) => (
              <Col xs={24} md={12} key={`${warning.type ?? 'warning'}-${index}`}>
                <Alert
                  showIcon
                  type={severityAlertType(warning.severity)}
                  icon={<ExclamationCircleOutlined />}
                  message={<Text strong>{formatEnumText(warning.type)}</Text>}
                  description={warning.message}
                  style={severityAlertType(warning.severity) === 'warning' ? pageStyles.warningAlert : { borderRadius: 8 }}
                />
              </Col>
            ))}
          </Row>
        )}

        <Row gutter={[14, 14]} align="stretch">
          <Col xs={24} lg={12}>
            <Card
              style={pageStyles.criteriaCard}
              styles={{ header: pageStyles.criteriaHeader, body: pageStyles.criteriaBody }}
              title={(
                <Space size={10}>
                  <ExperimentOutlined style={{ color: '#2563eb' }} />
                  <span>
                    <Title level={4} style={pageStyles.criteriaTitle}>Tiêu chí chính</Title>
                    <Text style={pageStyles.criteriaSubtitle}>Major criteria</Text>
                  </span>
                </Space>
              )}
              extra={(
                <Tag color={majorCriteria?.major_criteria_met ? 'success' : 'default'}>
                  {majorCriteria?.major_criteria_met ? 'Đã thỏa' : 'Chưa thỏa'}
                </Tag>
              )}
            >
              <Paragraph style={pageStyles.note}>{majorCriteria?.note}</Paragraph>
              <Divider style={pageStyles.dashedDivider} />

              {majorItems.map((item, index) => (
                <div style={pageStyles.criterionItem} key={`${item.criterion ?? 'major'}-${index}`}>
                  <div style={pageStyles.criterionRow}>
                    <div>
                      <Text strong style={pageStyles.criterionText}>{item.criterion}</Text>
                      <Text style={{ ...pageStyles.detailText, color: criterionDetailColor(item.result) }}>
                        {item.result_detail}
                      </Text>
                    </div>
                    {item.result ? (
                      <CheckCircleFilled style={{ color: '#16a34a', fontSize: 16, marginTop: 2 }} />
                    ) : (
                      <CloseCircleOutlined style={{ color: '#ef4444', fontSize: 16, marginTop: 2 }} />
                    )}
                  </div>
                </div>
              ))}

              {majorCriteria?.major_criteria_conclusion && (
                <Alert
                  showIcon
                  type={majorCriteria?.major_criteria_met ? 'success' : 'info'}
                  message={majorCriteria.major_criteria_conclusion}
                  style={{ marginTop: 12, borderRadius: 6 }}
                />
              )}
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              style={pageStyles.criteriaCard}
              styles={{ header: pageStyles.criteriaHeader, body: pageStyles.criteriaBody }}
              title={(
                <Space size={10}>
                  <CalculatorOutlined style={{ color: '#16a34a' }} />
                  <span>
                    <Title level={4} style={pageStyles.criteriaTitle}>Tiêu chí phụ</Title>
                    <Text style={pageStyles.criteriaSubtitle}>Minor criteria</Text>
                  </span>
                </Space>
              )}
              extra={<Tag color="success">{formatScore(totalScore)} điểm</Tag>}
            >
              <Paragraph style={pageStyles.note}>{minorCriteriaScoring?.note}</Paragraph>
              <Divider style={pageStyles.dashedDivider} />

              {minorItems.map((item, index) => {
                const scoreAwarded = toNumber(item.score_awarded);
                return (
                  <div style={pageStyles.minorItem} key={`${item.criterion ?? 'minor'}-${index}`}>
                    <div style={pageStyles.criterionRow}>
                      <div>
                        <Text strong style={pageStyles.criterionText}>{item.criterion}</Text>
                        <Text style={pageStyles.minorResult}>
                          {item.result_detail}
                          {' '}
                          - tối đa {item.score_weight}
                        </Text>
                      </div>
                      <Tag color={scoreAwarded > 0 ? 'success' : 'default'}>+{formatScore(scoreAwarded)}</Tag>
                    </div>
                  </div>
                );
              })}

              {minorCriteriaScoring?.total_minor_score_note && (
                <Alert
                  showIcon
                  type={isInfected ? 'success' : 'info'}
                  message={minorCriteriaScoring.total_minor_score_note}
                  style={{ marginTop: 12, borderRadius: 6 }}
                />
              )}
            </Card>
          </Col>
        </Row>


      </div>
    </div>
  );
};
