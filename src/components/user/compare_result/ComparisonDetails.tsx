import React, { useMemo } from 'react';
import {
    Alert,
    Card,
    Col,
    Empty,
    List,
    Progress,
    Row,
    Space,
    Spin,
    Statistic,
    Table,
    Tag,
    Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    CheckCircleFilled,
    CloseCircleFilled,
    MinusOutlined,
    RobotOutlined,
    SyncOutlined,
    UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
    IAiRecommendationRun,
    IAiRecommendationRunDetail,
    IAiWarning,
    IDoctorRecommendationReview,
} from '@/types/backend';
import type { LocalPlanData, SurgeryPlanData, SystemicPlanData } from '@/types/treatmentType';
import { parseItemJson } from '../diagnose_steps/treatment_plan/utils/itemJson';
import {
    PJI_CONCLUSION_LABELS,
    aiConclusionOf,
    localAbxNames,
    systemicAbxNames,
} from '@/utils/aiDoctorCompare';

const { Text, Paragraph } = Typography;

/** Long free-text cells: wrap + collapse so the table never overflows. */
const LongText: React.FC<{ children?: React.ReactNode; secondary?: boolean }> = ({ children, secondary }) => (
    <Paragraph
        style={{ marginBottom: 0, wordBreak: 'break-word', fontSize: secondary ? 12 : undefined }}
        type={secondary ? 'secondary' : undefined}
        ellipsis={{ rows: 3, expandable: true, symbol: 'xem thêm' }}
    >
        {children}
    </Paragraph>
);

interface ComparisonDetailsProps {
    runDetail: IAiRecommendationRunDetail | null;
    runs: IAiRecommendationRun[];
    selectedRunId: string | null;
    loading: boolean;
    doctorReview?: IDoctorRecommendationReview | null;
}

const REVIEW_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    ACCEPTED: { label: 'Bác sĩ đồng thuận với AI', color: 'green' },
    MODIFIED: { label: 'Bác sĩ chỉnh sửa / ghi đè', color: 'orange' },
    REJECTED: { label: 'Bác sĩ từ chối gợi ý AI', color: 'red' },
    SAVED_DRAFT: { label: 'Bản nháp', color: 'default' },
};

interface CompareRow {
    key: string;
    criterion: string;
    ai: React.ReactNode;
    doctor: React.ReactNode;
    /** true/false → tick/cross; undefined → not comparable (—) */
    agree?: boolean;
}

const AgreeCell: React.FC<{ agree?: boolean }> = ({ agree }) => {
    if (agree === true) return <Tag icon={<CheckCircleFilled />} color="success">Đồng thuận</Tag>;
    if (agree === false) return <Tag icon={<CloseCircleFilled />} color="error">Khác biệt</Tag>;
    return <Tag icon={<MinusOutlined />}>—</Tag>;
};

const ComparisonDetails: React.FC<ComparisonDetailsProps> = ({
    runDetail, runs, selectedRunId, loading, doctorReview,
}) => {
    // ---- Parse AI side ----------------------------------------------------
    const aiData = useMemo(() => {
        if (!runDetail?.run) return null;
        let assessment: Record<string, any> = {};
        try {
            const raw: any = runDetail.run.assessmentJson;
            assessment = typeof raw === 'string' ? JSON.parse(raw) : raw ?? {};
        } catch { /* ignore */ }

        const items = runDetail.items ?? [];
        const diagItem = items.find((i) => i.category === 'DIAGNOSTIC_TEST');
        const diagJson: any = diagItem ? parseItemJson(diagItem) : null;
        const aiReasoning = diagJson?.aiReasoning ?? {};

        const surgeryItem = items.find((i) => i.category === 'SURGERY_PROCEDURE');
        const systemicItem = items.find((i) => i.category === 'SYSTEMIC_ANTIBIOTIC');
        const localItem = items.find((i) => i.category === 'LOCAL_ANTIBIOTIC');

        return {
            pjiProbability: assessment?.pji_probability ?? assessment?.pjiProbability,
            overallAssessment: assessment?.overall_assessment ?? assessment?.overallAssessment,
            primaryDiagnosis: aiReasoning?.primaryDiagnosis as string | undefined,
            infectionClassification: aiReasoning?.infectionClassification as string | undefined,
            identifiedOrganism: aiReasoning?.identifiedOrganism?.name as string | undefined,
            surgery: surgeryItem ? (parseItemJson(surgeryItem) as SurgeryPlanData) : null,
            systemic: systemicItem ? (parseItemJson(systemicItem) as SystemicPlanData) : null,
            local: localItem ? (parseItemJson(localItem) as LocalPlanData) : null,
            warnings: (runDetail.run.warningsJson ?? []) as IAiWarning[],
        };
    }, [runDetail]);

    // ---- Parse doctor side --------------------------------------------------
    const doctorData = useMemo(() => {
        if (!doctorReview) return null;
        const dd = doctorReview.doctorDiagnosisJson ?? {};
        const plan = (doctorReview.modificationJson ?? {}) as Record<string, any>;
        return {
            diagnosis: dd,
            surgery: (plan.surgery ?? null) as SurgeryPlanData | null,
            systemic: (plan.systemicAntibiotic ?? null) as SystemicPlanData | null,
            local: (plan.localAntibiotic ?? null) as LocalPlanData | null,
            agreement: doctorReview.agreementJson ?? {},
        };
    }, [doctorReview]);

    if (loading) {
        return (
            <Card style={{ textAlign: 'center', padding: 48 }}>
                <Spin tip="Đang tải chi tiết gợi ý..." />
            </Card>
        );
    }

    if (!runDetail || !runDetail.run) {
        return (
            <Card>
                <Empty description="Chọn một lần gợi ý AI từ timeline để xem chi tiết so sánh." />
            </Card>
        );
    }

    const { run, citations = [] } = runDetail;
    const runIndex = runs.findIndex((r) => r.id === selectedRunId);
    const runNumber = runIndex === -1 ? runs.length : runs.length - runIndex;
    const isLatest = runIndex === 0;
    const hasPreviousRun = runIndex >= 0 && runIndex < runs.length - 1;

    const statusConfig = doctorReview?.reviewStatus
        ? REVIEW_STATUS_CONFIG[doctorReview.reviewStatus]
        : null;
    const agreementRate = doctorData?.agreement?.agreement_rate;

    // ---- Build comparison rows ---------------------------------------------
    const aiConclusion = aiConclusionOf(aiData?.pjiProbability);
    const rows: CompareRow[] = [
        {
            key: 'conclusion',
            criterion: 'Kết luận PJI',
            ai: (
                <Space direction="vertical" size={0}>
                    <Tag color={aiConclusion === 'INFECTED' ? 'red' : aiConclusion === 'NOT_INFECTED' ? 'green' : 'gold'}>
                        {PJI_CONCLUSION_LABELS[aiConclusion]}
                    </Tag>
                    {aiData?.pjiProbability && (
                        <Text type="secondary" style={{ fontSize: 12 }}>AI: {aiData.pjiProbability}</Text>
                    )}
                </Space>
            ),
            doctor: doctorData?.diagnosis?.pji_conclusion
                ? (
                    <Tag color={doctorData.diagnosis.pji_conclusion === 'INFECTED' ? 'red'
                        : doctorData.diagnosis.pji_conclusion === 'NOT_INFECTED' ? 'green' : 'gold'}>
                        {PJI_CONCLUSION_LABELS[doctorData.diagnosis.pji_conclusion] ?? doctorData.diagnosis.pji_conclusion}
                    </Tag>
                )
                : <Text type="secondary">Chưa nhập</Text>,
            agree: doctorData?.agreement?.diagnosis_conclusion,
        },
        {
            key: 'classification',
            criterion: 'Phân loại nhiễm trùng',
            ai: aiData?.infectionClassification ?? <Text type="secondary">—</Text>,
            doctor: doctorData?.diagnosis?.infection_classification ?? <Text type="secondary">Chưa nhập</Text>,
            agree: doctorData?.agreement?.infection_classification,
        },
        {
            key: 'primary',
            criterion: 'Chẩn đoán chính',
            ai: aiData?.primaryDiagnosis
                ? <LongText>{aiData.primaryDiagnosis}</LongText>
                : <Text type="secondary">—</Text>,
            doctor: doctorData?.diagnosis?.primary_diagnosis
                ? <LongText>{doctorData.diagnosis.primary_diagnosis}</LongText>
                : <Text type="secondary">Chưa nhập</Text>,
        },
        {
            key: 'organism',
            criterion: 'Vi khuẩn định danh',
            ai: aiData?.identifiedOrganism ?? <Text type="secondary">—</Text>,
            doctor: doctorData?.diagnosis?.identified_organism ?? <Text type="secondary">—</Text>,
        },
        {
            key: 'surgery',
            criterion: 'Chiến lược phẫu thuật',
            ai: aiData?.surgery
                ? (
                    <Space direction="vertical" size={0} style={{ width: '100%' }}>
                        <Text strong>{aiData.surgery.surgeryStrategyType ?? '—'}</Text>
                        {aiData.surgery.strategyRationale && (
                            <LongText secondary>{aiData.surgery.strategyRationale}</LongText>
                        )}
                    </Space>
                )
                : <Text type="secondary">—</Text>,
            doctor: doctorData?.surgery
                ? <Text strong>{doctorData.surgery.surgeryStrategyType ?? '—'}</Text>
                : <Text type="secondary">Chưa nhập</Text>,
            agree: doctorData?.agreement?.surgery_strategy,
        },
        {
            key: 'systemic',
            criterion: 'Kháng sinh toàn thân',
            ai: systemicAbxNames(aiData?.systemic).join(', ') || <Text type="secondary">—</Text>,
            doctor: doctorData
                ? (systemicAbxNames(doctorData.systemic).join(', ') || <Text type="secondary">Chưa nhập</Text>)
                : <Text type="secondary">Chưa nhập</Text>,
            agree: doctorData?.agreement?.systemic_antibiotics,
        },
        {
            key: 'local',
            criterion: 'Kháng sinh tại chỗ',
            ai: localAbxNames(aiData?.local).join(', ') || <Text type="secondary">—</Text>,
            doctor: doctorData
                ? (localAbxNames(doctorData.local).join(', ') || <Text type="secondary">Chưa nhập</Text>)
                : <Text type="secondary">Chưa nhập</Text>,
            agree: doctorData?.agreement?.local_antibiotics,
        },
        {
            key: 'reasoning',
            criterion: 'Lập luận / Ghi chú',
            ai: aiData?.overallAssessment
                ? <LongText>{aiData.overallAssessment}</LongText>
                : <Text type="secondary">—</Text>,
            doctor: (
                <Space direction="vertical" size={0} style={{ width: '100%' }}>
                    {doctorData?.diagnosis?.clinical_reasoning && (
                        <LongText>{doctorData.diagnosis.clinical_reasoning}</LongText>
                    )}
                    {doctorReview?.reviewNote && (
                        <LongText secondary>Ghi chú: {doctorReview.reviewNote}</LongText>
                    )}
                    {doctorReview?.rejectionReason && (
                        <Text type="danger" style={{ fontSize: 12, wordBreak: 'break-word' }}>
                            Lý do từ chối: {doctorReview.rejectionReason}
                        </Text>
                    )}
                    {!doctorData?.diagnosis?.clinical_reasoning && !doctorReview?.reviewNote
                        && !doctorReview?.rejectionReason && <Text type="secondary">—</Text>}
                </Space>
            ),
        },
    ];

    // tableLayout="fixed" + equal flexible widths: long AI/doctor content wraps
    // inside its cell instead of pushing the table past the viewport edge.
    const columns: ColumnsType<CompareRow> = [
        {
            title: 'Tiêu chí',
            dataIndex: 'criterion',
            width: 140,
            render: (v: string) => <Text strong>{v}</Text>,
        },
        {
            title: <Space><RobotOutlined style={{ color: '#2563eb' }} />AI gợi ý</Space>,
            dataIndex: 'ai',
            render: (v: React.ReactNode) => (
                <div style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>{v}</div>
            ),
        },
        {
            title: <Space><UserOutlined style={{ color: '#7c3aed' }} />Bác sĩ</Space>,
            dataIndex: 'doctor',
            render: (v: React.ReactNode) => (
                <div style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>{v}</div>
            ),
        },
        {
            title: 'Đồng thuận',
            dataIndex: 'agree',
            width: 108,
            align: 'center',
            render: (_: unknown, row: CompareRow) => <AgreeCell agree={row.agree} />,
        },
    ];

    return (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {/* AI warnings (allergy / drug-interaction / insufficient-data) */}
            {aiData?.warnings?.length ? (
                <div style={{ marginBottom: 16 }}>
                    {aiData.warnings.map((w, idx) => (
                        <Alert
                            key={idx}
                            type={w.severity === 'HIGH' ? 'error' : 'warning'}
                            showIcon
                            message={w.type}
                            description={w.message}
                            style={{ marginBottom: 8 }}
                        />
                    ))}
                </div>
            ) : null}

            {/* Review status + agreement overview */}
            {doctorReview && statusConfig ? (
                <Card size="small">
                    <Row gutter={16} align="middle">
                        <Col flex="auto">
                            <Space direction="vertical" size={0}>
                                <Tag color={statusConfig.color} style={{ fontSize: 13, padding: '2px 10px' }}>
                                    {statusConfig.label}
                                </Tag>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    Bác sĩ: {doctorReview.createdBy ?? '—'} ·{' '}
                                    {doctorReview.updatedAt ? dayjs(doctorReview.updatedAt).format('HH:mm DD/MM/YYYY') : '—'}
                                </Text>
                            </Space>
                        </Col>
                        {agreementRate != null && (
                            <Col>
                                <Statistic
                                    title="Mức đồng thuận với AI"
                                    value={agreementRate}
                                    suffix="%"
                                    valueStyle={{
                                        color: agreementRate >= 80 ? '#10b981' : agreementRate >= 50 ? '#f59e0b' : '#ef4444',
                                    }}
                                />
                                <Progress
                                    percent={agreementRate}
                                    size="small"
                                    showInfo={false}
                                    strokeColor={agreementRate >= 80 ? '#10b981' : agreementRate >= 50 ? '#f59e0b' : '#ef4444'}
                                />
                            </Col>
                        )}
                    </Row>
                </Card>
            ) : (
                <Alert
                    type="warning"
                    showIcon
                    message="Chưa có chẩn đoán của bác sĩ cho lần gợi ý này"
                    description='Hoàn thành bước "Chẩn đoán bác sĩ" trong luồng Chẩn đoán & đề xuất điều trị để có dữ liệu so sánh.'
                />
            )}

            {/* Criterion-by-criterion comparison table */}
            <Card
                size="small"
                title={
                    <Space>
                        Bảng so sánh AI ↔ Bác sĩ
                        <Tag color={isLatest ? 'blue' : 'default'}>
                            Lần {runNumber}{isLatest ? ' (Mới nhất)' : ''}
                        </Tag>
                    </Space>
                }
                extra={
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {run.createdAt ? dayjs(run.createdAt).format('HH:mm DD/MM/YYYY') : '—'}
                    </Text>
                }
            >
                <Table<CompareRow>
                    columns={columns}
                    dataSource={rows}
                    pagination={false}
                    size="small"
                    bordered
                    tableLayout="fixed"
                    scroll={{ x: 640 }}
                />
            </Card>

            {/* Citations */}
            {citations.length > 0 && (
                <Card size="small" title="Trích dẫn & Bằng chứng của AI">
                    <List
                        size="small"
                        dataSource={citations}
                        renderItem={(citation, idx) => (
                            <List.Item>
                                <List.Item.Meta
                                    title={<Text strong>[{idx + 1}] {citation.sourceTitle || 'Nguồn tài liệu'}</Text>}
                                    description={
                                        <Space direction="vertical" size={2}>
                                            {citation.snippet && (
                                                <Text type="secondary" style={{ fontSize: 12 }}>{citation.snippet}</Text>
                                            )}
                                            <Space size={8}>
                                                {citation.sourceType && <Tag>{citation.sourceType}</Tag>}
                                                {citation.relevanceScore != null && (
                                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                                        Độ liên quan: {Math.round((citation.relevanceScore ?? 0) * 100)}%
                                                    </Text>
                                                )}
                                            </Space>
                                        </Space>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                </Card>
            )}

            {/* Run-diff notice */}
            {hasPreviousRun && (
                <Alert
                    type="warning"
                    showIcon
                    icon={<SyncOutlined />}
                    message={`Lần ${runNumber} được tạo do dữ liệu xét nghiệm thay đổi`}
                    description="Kết quả xét nghiệm hoặc dữ liệu lâm sàng của bệnh án đã được cập nhật, AI đã chạy lại để đưa ra gợi ý phù hợp với dữ liệu mới."
                />
            )}
        </Space>
    );
};

export default ComparisonDetails;
