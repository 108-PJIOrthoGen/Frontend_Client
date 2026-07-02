import { useCallback, useEffect, useState, type CSSProperties } from 'react';
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
  message,
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
import { useAppSelector } from '@/redux/hook';
import { callEvaluatePjiDiagnostic } from '@/apis/api';

interface ClinicalAssessmentProps {
  onNext?: () => void;
  onPrev?: () => void;
}

const { Paragraph, Text, Title } = Typography;

const DIAGNOSTIC_RESULT_KEY = 'pji_diagnosticResult';
const SCORE_SCALE_MAX = 12;
const NOT_INFECTED_MAX_SCORE = 3;
const INFECTED_MIN_SCORE = 6;

const pageStyles: Record<string, CSSProperties> = {
  page: {
    minHeight: '100%',
    background: '#edf0f4',
    padding: '10px 18px 32px',
    overflowY: 'auto',
  },
  shell: {
    width: '100%',
    maxWidth: 1040,
    margin: '0 auto',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    margin: 0,
    color: '#111827',
    fontSize: 22,
    lineHeight: 1.25,
    fontWeight: 800,
  },
  resultCard: {
    width: 272,
    borderColor: '#ffccc7',
    background: '#fff1f0',
    borderRadius: 8,
    boxShadow: 'none',
  },
  resultCardBody: {
    padding: '14px 20px',
  },
  resultGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    gap: 18,
    alignItems: 'center',
  },
  resultLabel: {
    display: 'block',
    color: '#6b7280',
    fontSize: 12,
    lineHeight: 1.2,
    marginBottom: 4,
  },
  scoreCard: {
    borderRadius: 8,
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
    marginBottom: 14,
  },
  scoreCardBody: {
    padding: '20px 24px',
  },
  scoreTitle: {
    margin: 0,
    fontSize: 15,
    color: '#111827',
    fontWeight: 800,
  },
  scoreRailArea: {
    position: 'relative',
    paddingTop: 30,
    marginTop: 6,
  },
  scoreRail: {
    height: 8,
    borderRadius: 999,
    background: 'linear-gradient(90deg, #9fe58c 0%, #9fe58c 25%, #ffd979 25%, #ffd979 50%, #ffb9b3 50%, #ffb9b3 100%)',
  },
  scoreLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#8b95a5',
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: 12,
    marginTop: 9,
  },
  scoreMarker: {
    position: 'absolute',
    top: 8,
    transform: 'translateX(-50%)',
    textAlign: 'center',
    color: '#111827',
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  markerLine: {
    width: 2,
    height: 16,
    background: '#1f2937',
    margin: '3px auto 0',
  },
  organismRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
    minHeight: 38,
  },
  organismLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flex: '1 1 280px',
    minWidth: 0,
  },
  organismName: {
    fontSize: 14,
    fontWeight: 800,
    color: '#111827',
  },
  organismDetail: {
    color: '#5b6472',
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: 12,
    flex: '1 1 240px',
    textAlign: 'right',
  },
  warningAlert: {
    borderColor: '#ffd666',
    background: '#fffbe6',
    borderRadius: 8,
  },
  criteriaCard: {
    height: '100%',
    borderRadius: 8,
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
  },
  criteriaHeader: {
    padding: '16px 24px',
    borderBottom: '1px solid #eef0f3',
  },
  criteriaBody: {
    padding: '16px 24px 20px',
  },
  criteriaTitle: {
    margin: 0,
    color: '#111827',
    fontSize: 16,
    fontWeight: 800,
    lineHeight: 1.2,
  },
  criteriaSubtitle: {
    display: 'block',
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 1,
  },
  note: {
    color: '#4b5563',
    fontSize: 13,
    lineHeight: 1.65,
    marginBottom: 12,
  },
  dashedDivider: {
    margin: '10px 0 14px',
    borderColor: '#d6d9de',
    borderStyle: 'dashed',
  },
  criterionItem: {
    border: '1px solid #e5e7eb',
    borderRadius: 5,
    padding: '11px 12px',
    marginBottom: 9,
    background: '#ffffff',
  },
  criterionRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  criterionText: {
    fontSize: 13,
    color: '#111827',
    lineHeight: 1.45,
  },
  detailText: {
    display: 'block',
    marginTop: 10,
    fontSize: 12,
    lineHeight: 1.55,
  },
  minorItem: {
    border: '1px solid #e5e7eb',
    borderRadius: 5,
    padding: '11px 12px',
    marginBottom: 9,
    background: '#ffffff',
  },
  minorResult: {
    display: 'block',
    color: '#4b5563',
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: 12,
    lineHeight: 1.45,
    marginTop: 8,
  },
  actionBar: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
  },
  emptyWrap: {
    minHeight: 'calc(100vh - 220px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 8,
    border: '1px solid #e5e7eb',
  },
};

const asArray = <T,>(value: T[] | undefined | null): T[] => (Array.isArray(value) ? value : []);

const toNumber = (value: unknown): number => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const formatScore = (value: number): string => (
  Number.isInteger(value) ? String(value) : value.toFixed(1)
);

const conclusionLabel = (interpretation: unknown): string => {
  switch (interpretation) {
    case 'INFECTED':
      return 'NHIỄM TRÙNG';
    case 'NOT_INFECTED':
      return 'KHÔNG NHIỄM';
    case 'INCONCLUSIVE':
      return 'CHƯA RÕ';
    default:
      return interpretation ? String(interpretation) : 'CHƯA CÓ';
  }
};

const formatEnumText = (value: unknown): string => {
  if (value === null || value === undefined || value === '') {
    return 'Chưa xác định';
  }
  return String(value)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, match => match.toUpperCase());
};

const organismInitials = (name: unknown): string => {
  const text = String(name || 'PJI').trim();
  const initials = text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();
  return initials || 'PJI';
};

const criterionDetailColor = (result: unknown): string => {
  if (result === true) return '#16a34a';
  if (result === false) return '#ef4444';
  return '#d97706';
};

const severityAlertType = (severity: unknown): 'error' | 'warning' | 'info' => {
  if (severity === 'HIGH') return 'error';
  if (severity === 'LOW') return 'info';
  return 'warning';
};

const conclusionTone = (interpretation: unknown) => {
  if (interpretation === 'INFECTED') {
    return { color: '#dc2626', border: '#ffccc7', background: '#fff1f0' };
  }
  if (interpretation === 'INCONCLUSIVE') {
    return { color: '#d97706', border: '#ffe58f', background: '#fffbe6' };
  }
  return { color: '#16a34a', border: '#b7eb8f', background: '#f6ffed' };
};

export const S5AssessmentPji = ({ onNext, onPrev }: ClinicalAssessmentProps) => {
  const [isDiagnosticLoading, setIsDiagnosticLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<Record<string, any> | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentCase = useAppSelector(state => state.patient.currentCase);
  const episodeId = currentCase?.episode?.id;

  const applyDiagnosticResult = useCallback((diagnostic: any): boolean => {
    if (!diagnostic?.itemJson) {
      return false;
    }
    setDiagnosticData({ title: diagnostic.title, ...diagnostic.itemJson });
    return true;
  }, []);

  useEffect(() => {
    const cachedDiagnostic = localStorage.getItem(DIAGNOSTIC_RESULT_KEY);
    if (cachedDiagnostic) {
      try {
        const diagnostic = JSON.parse(cachedDiagnostic);
        if (applyDiagnosticResult(diagnostic)) {
          setShowResults(true);
        }
      } catch {
        localStorage.removeItem(DIAGNOSTIC_RESULT_KEY);
      }
    }
  }, [applyDiagnosticResult]);

  const handleEvaluateDiagnostic = async () => {
    if (!episodeId) {
      message.error('Không tìm thấy bệnh án. Vui lòng quay lại chọn bệnh nhân.');
      return;
    }

    setIsDiagnosticLoading(true);
    setErrorMsg(null);
    try {
      const res = await callEvaluatePjiDiagnostic(String(episodeId));
      const diagnostic = res?.data;
      if (!applyDiagnosticResult(diagnostic)) {
        throw new Error('Không tìm thấy dữ liệu chẩn đoán hệ thống.');
      }
      localStorage.setItem(DIAGNOSTIC_RESULT_KEY, JSON.stringify(diagnostic));
      setShowResults(true);
      message.success('Đã tính chẩn đoán theo luật hệ thống.');
    } catch (err: any) {
      const msg = err?.message || 'Đã xảy ra lỗi khi tính chẩn đoán';
      setErrorMsg(msg);
      message.error(msg);
    } finally {
      setIsDiagnosticLoading(false);
    }
  };

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
  const warnings = asArray<Record<string, any>>(aiReasoning?.warnings);
  const interpretation = scoringSystem?.interpretation;
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
                      {errorMsg || 'Dữ liệu ca bệnh sẽ được tính bằng rule engine của backend, không gọi RAG/AI ở bước này.'}
                    </Text>
                  </Space>
                )}
              >
                <Button
                  type="primary"
                  size="large"
                  icon={errorMsg ? <ReloadOutlined /> : <CalculatorOutlined />}
                  loading={isDiagnosticLoading}
                  onClick={handleEvaluateDiagnostic}
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
      <div style={pageStyles.shell}>
        <Row align="top" justify="space-between" gutter={[20, 14]} style={pageStyles.header}>
          <Col flex="auto">
            <Title level={2} style={pageStyles.title}>
              {primaryDiagnosis}
              {organism?.name && organism.name !== 'Chưa xác định' ? ` - ${organism.name}` : ''}
            </Title>
            <Space size={8} wrap style={{ marginTop: 10 }}>
              <Tag color="warning">{formatEnumText(aiReasoning?.infection_classification)}</Tag>
              <Tag>Kết quả theo quy tắc chẩn đoán</Tag>
            </Space>
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
                    {conclusionLabel(interpretation)}
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
                    }}
                  >
                    {formatScore(totalScore)}
                  </Text>
                </div>
                <Text type="secondary">điểm</Text>
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

        <div style={pageStyles.actionBar}>
          <Button icon={<ArrowLeftOutlined />} onClick={onPrev}>
            Quay lại
          </Button>
          <Button type="primary" icon={<ArrowRightOutlined />} onClick={onNext}>
            Tiếp tục
          </Button>
        </div>
      </div>
    </div>
  );
};
