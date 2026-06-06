import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Card,
    Col,
    Empty,
    Row,
    Select,
    Space,
    Spin,
    Statistic,
    Table,
    Tag,
    Typography,
    message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DiffOutlined, PercentageOutlined, WarningOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import PatientHeader from '../../components/user/compare_result/PatientHeader';
import TimelineHistory from '../../components/user/compare_result/TimelineHistory';
import ComparisonDetails from '../../components/user/compare_result/ComparisonDetails';
import {
    callFetchEpisodesByPatient,
    callFetchAiRecommendationRuns,
    callFetchAiRecommendationRunDetail,
    callFetchDoctorReviewsByEpisode,
    callFetchDoctorReviewStats,
} from '@/apis/api';
import {
    IEpisode,
    IAiRecommendationRun,
    IAiRecommendationRunDetail,
    IDoctorRecommendationReview,
    IDoctorReviewStats,
} from '@/types/backend';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

const { Title, Text } = Typography;

type OverriddenCase = NonNullable<IDoctorReviewStats['overriddenCases']>[number];

/** How many most-recent episodes we eagerly inspect for AI runs/reviews. */
const MAX_EPISODES = 10;

const reviewRunId = (review: IDoctorRecommendationReview): string | null => {
    // Backend serializes the lazy `run` association as a nested object;
    // tolerate both shapes (runId scalar or run.id).
    const anyReview = review as any;
    const id = anyReview.runId ?? anyReview.run?.id;
    return id != null ? String(id) : null;
};

/**
 * Compare-result is patient-centric: a patient has many episodes, each episode
 * has many AI runs, and each run carries (at most) one DoctorReview. The page
 * loads the whole tree up front so the doctor gets an overview instead of a
 * single — possibly empty — episode.
 */
const CompareResult: React.FC = () => {
    const [episodes, setEpisodes] = useState<IEpisode[]>([]);
    const [runsByEpisode, setRunsByEpisode] = useState<Record<string, IAiRecommendationRun[]>>({});
    const [reviewsByRun, setReviewsByRun] = useState<Record<string, IDoctorRecommendationReview>>({});
    const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);
    const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
    const [selectedRunDetail, setSelectedRunDetail] = useState<IAiRecommendationRunDetail | null>(null);
    const [stats, setStats] = useState<IDoctorReviewStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);

    const currentCase = useSelector((state: RootState) => state.patient.currentCase);
    const patient = currentCase?.patient;
    const initialEpisodeId = currentCase?.episode?.id != null ? String(currentCase.episode.id) : null;

    useEffect(() => {
        // Consensus stats are system-wide — load them regardless of selection.
        callFetchDoctorReviewStats()
            .then((res) => { if (res?.data) setStats(res.data); })
            .catch(() => { /* thống kê là phụ trợ — không chặn trang */ });
    }, []);

    useEffect(() => {
        if (!patient?.id) {
            setLoading(false);
            return;
        }
        loadPatientTree(String(patient.id));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [patient?.id]);

    const loadPatientTree = async (patientId: string) => {
        setLoading(true);
        try {
            const epRes = await callFetchEpisodesByPatient(
                patientId, `page=0&size=${MAX_EPISODES}&sort=createdAt,desc`,
            );
            const eps = epRes?.data?.result ?? [];
            setEpisodes(eps);
            if (eps.length === 0) return;

            // Fan out: runs + reviews per episode (small N — patients rarely
            // carry more than a handful of episodes).
            const [runsEntries, reviewLists] = await Promise.all([
                Promise.all(eps.map(async (ep) => {
                    try {
                        const r = await callFetchAiRecommendationRuns(
                            String(ep.id), 'page=0&size=20&sort=createdAt,desc',
                        );
                        return [String(ep.id), r?.data?.result ?? []] as const;
                    } catch {
                        return [String(ep.id), []] as const;
                    }
                })),
                Promise.all(eps.map(async (ep) => {
                    try {
                        const r = await callFetchDoctorReviewsByEpisode(String(ep.id));
                        return r?.data ?? [];
                    } catch {
                        return [];
                    }
                })),
            ]);

            const runsMap = Object.fromEntries(runsEntries);
            setRunsByEpisode(runsMap);

            const reviewMap: Record<string, IDoctorRecommendationReview> = {};
            reviewLists.flat().forEach((review) => {
                const rid = reviewRunId(review);
                if (rid) reviewMap[rid] = review;
            });
            setReviewsByRun(reviewMap);

            // Pick the episode to show first: the deep-linked one if it has
            // runs, else the episode whose latest run is the most recent, else
            // simply the deep-linked/newest episode.
            const withRuns = eps.filter((ep) => (runsMap[String(ep.id)] ?? []).length > 0);
            let target: IEpisode | undefined;
            if (initialEpisodeId && (runsMap[initialEpisodeId] ?? []).length > 0) {
                target = eps.find((ep) => String(ep.id) === initialEpisodeId);
            }
            if (!target && withRuns.length > 0) {
                target = withRuns.reduce((best, ep) => {
                    const t = (e: IEpisode) => runsMap[String(e.id)]?.[0]?.createdAt ?? '';
                    return t(ep) > t(best) ? ep : best;
                }, withRuns[0]);
            }
            if (!target) {
                target = (initialEpisodeId && eps.find((ep) => String(ep.id) === initialEpisodeId)) || eps[0];
            }
            handleSelectEpisode(String(target.id), runsMap);
        } catch {
            message.error('Không thể tải dữ liệu so sánh');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectEpisode = (episodeId: string, runsMap?: Record<string, IAiRecommendationRun[]>) => {
        setSelectedEpisodeId(episodeId);
        setSelectedRunDetail(null);
        setSelectedRunId(null);
        const runs = (runsMap ?? runsByEpisode)[episodeId] ?? [];
        const firstUsable = runs.find((r) => (r.status === 'SUCCESS' || r.status === 'PARTIAL') && r.id);
        if (firstUsable?.id) handleSelectRun(firstUsable.id);
    };

    const handleSelectRun = async (runId: string) => {
        setSelectedRunId(runId);
        setDetailLoading(true);
        try {
            const detailRes = await callFetchAiRecommendationRunDetail(runId);
            if (detailRes?.data) setSelectedRunDetail(detailRes.data);
        } catch {
            message.error('Không thể tải chi tiết gợi ý AI');
        } finally {
            setDetailLoading(false);
        }
    };

    const selectedEpisode = useMemo(
        () => episodes.find((ep) => String(ep.id) === selectedEpisodeId) ?? null,
        [episodes, selectedEpisodeId],
    );
    const selectedRuns = selectedEpisodeId ? (runsByEpisode[selectedEpisodeId] ?? []) : [];
    const doctorReview = selectedRunId ? (reviewsByRun[selectedRunId] ?? null) : null;
    const totalRunCount = useMemo(
        () => Object.values(runsByEpisode).reduce((n, rs) => n + rs.length, 0),
        [runsByEpisode],
    );

    const episodeOptions = episodes.map((ep) => {
        const runs = runsByEpisode[String(ep.id)] ?? [];
        const reviewedCount = runs.filter((r) => r.id && reviewsByRun[r.id]).length;
        return {
            value: String(ep.id),
            label: (
                <Space size={6}>
                    <Text strong>BA #{ep.id}</Text>
                    {ep.admissionDate && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {dayjs(ep.admissionDate).format('DD/MM/YYYY')}
                        </Text>
                    )}
                    <Tag color={runs.length > 0 ? 'blue' : 'default'}>{runs.length} lần AI</Tag>
                    {runs.length > 0 && (
                        <Tag color={reviewedCount === runs.length ? 'green' : reviewedCount > 0 ? 'orange' : 'default'}>
                            {reviewedCount}/{runs.length} đã review
                        </Tag>
                    )}
                </Space>
            ),
        };
    });

    const overriddenColumns: ColumnsType<OverriddenCase> = [
        {
            title: 'Bệnh nhân',
            dataIndex: 'patientName',
            render: (v: string, r) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{v ?? '—'}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>BA #{r.episodeId} · Run #{r.runId}</Text>
                </Space>
            ),
        },
        {
            title: 'Quyết định',
            dataIndex: 'reviewStatus',
            width: 120,
            render: (v: string) => (
                <Tag color={v === 'REJECTED' ? 'red' : 'orange'}>
                    {v === 'REJECTED' ? 'Từ chối AI' : 'Ghi đè AI'}
                </Tag>
            ),
        },
        {
            title: 'Đồng thuận',
            dataIndex: 'agreementRate',
            width: 110,
            align: 'center',
            render: (v: number | null) => (v != null ? `${v}%` : '—'),
        },
        {
            title: 'Thời gian',
            dataIndex: 'updatedAt',
            width: 140,
            render: (v: string) => (v ? dayjs(v).format('HH:mm DD/MM/YYYY') : '—'),
        },
    ];

    if (loading) {
        return (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f8fb' }}>
                <Spin size="large" tip="Đang tải dữ liệu..." />
            </div>
        );
    }

    if (!patient?.id) {
        return (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f8fb' }}>
                <Empty description={
                    <>
                        Chưa chọn bệnh nhân.
                        <br />
                        Mở từ trang Quản lý bệnh án (nút <DiffOutlined />) hoặc chọn ca bệnh từ trang chẩn đoán.
                    </>
                } />
            </div>
        );
    }

    return (
        <div style={{ background: '#f6f8fb', height: '100%', overflowY: 'auto' }}>
            {/* Top bar */}
            <Card size="small" style={{ borderRadius: 0 }}>
                <Row align="middle" justify="space-between">
                    <Col>
                        <Title level={4} style={{ margin: 0 }}>So sánh kết quả AI & Bác sĩ</Title>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            Toàn bộ bệnh án, lịch sử gợi ý AI và chẩn đoán cuối của bác sĩ cho bệnh nhân này
                        </Text>
                    </Col>
                    <Col>
                        <Space>
                            <Tag>{episodes.length} bệnh án</Tag>
                            <Tag color="blue">{totalRunCount} lần gợi ý AI</Tag>
                        </Space>
                    </Col>
                </Row>
            </Card>

            <div style={{ maxWidth: 1480, margin: '0 auto', padding: 24 }}>
                <PatientHeader episode={selectedEpisode ?? episodes[0] ?? {}} patient={patient} />

                {/* System-wide consensus stats */}
                {stats && (
                    <Card size="small" style={{ marginBottom: 22 }} title="Thống kê đồng thuận AI ↔ Bác sĩ (toàn hệ thống)">
                        <Row gutter={[16, 16]}>
                            <Col xs={12} md={5}>
                                <Statistic title="Tổng số review" value={stats.totalReviews ?? 0} />
                            </Col>
                            <Col xs={12} md={5}>
                                <Statistic
                                    title="Tỷ lệ đồng thuận hoàn toàn"
                                    value={stats.consensusRate ?? '—'}
                                    suffix={stats.consensusRate != null ? '%' : undefined}
                                    prefix={<PercentageOutlined />}
                                    valueStyle={{ color: '#10b981' }}
                                />
                            </Col>
                            <Col xs={12} md={5}>
                                <Statistic
                                    title="Đồng thuận trung bình theo tiêu chí"
                                    value={stats.avgAgreementRate ?? '—'}
                                    suffix={stats.avgAgreementRate != null ? '%' : undefined}
                                    valueStyle={{ color: '#2563eb' }}
                                />
                            </Col>
                            <Col xs={12} md={9}>
                                <Space size={8} wrap>
                                    <Tag color="green">Chấp nhận: {stats.accepted ?? 0}</Tag>
                                    <Tag color="orange">Chỉnh sửa: {stats.modified ?? 0}</Tag>
                                    <Tag color="red">Từ chối: {stats.rejected ?? 0}</Tag>
                                </Space>
                            </Col>
                        </Row>

                        {(stats.overriddenCases?.length ?? 0) > 0 && (
                            <>
                                <Alert
                                    style={{ margin: '12px 0' }}
                                    type="info"
                                    showIcon
                                    icon={<WarningOutlined />}
                                    message={`${stats.overriddenCases!.length} ca bác sĩ ghi đè / từ chối kết quả AI`}
                                    description="Các ca này là dữ liệu quan trọng để AI học từ quyết định cuối của bác sĩ."
                                />
                                <Table<OverriddenCase>
                                    rowKey={(r) => String(r.reviewId)}
                                    columns={overriddenColumns}
                                    dataSource={stats.overriddenCases}
                                    size="small"
                                    pagination={{ pageSize: 5, hideOnSinglePage: true }}
                                />
                            </>
                        )}
                    </Card>
                )}

                {episodes.length === 0 ? (
                    <Card>
                        <Empty description="Bệnh nhân này chưa có bệnh án nào." />
                    </Card>
                ) : totalRunCount === 0 ? (
                    <Card>
                        <Empty description={
                            <>
                                Chưa có lần gợi ý AI nào trong {episodes.length} bệnh án của bệnh nhân này.
                                <br />
                                Hãy chạy chẩn đoán AI từ trang &quot;Chẩn đoán và đề xuất điều trị&quot; trước.
                            </>
                        } />
                    </Card>
                ) : (
                    <>
                        {/* Episode selector */}
                        <Card size="small" style={{ marginBottom: 22 }}>
                            <Space wrap>
                                <Text strong>Bệnh án:</Text>
                                <Select
                                    style={{ minWidth: 420 }}
                                    value={selectedEpisodeId ?? undefined}
                                    options={episodeOptions}
                                    onChange={(v) => handleSelectEpisode(v)}
                                    placeholder="-- Chọn bệnh án --"
                                />
                                {selectedRuns.length === 0 && (
                                    <Text type="warning">Bệnh án này chưa có lần gợi ý AI nào.</Text>
                                )}
                            </Space>
                        </Card>

                        <Row gutter={[22, 22]}>
                            <Col xs={24} lg={8} xl={7}>
                                <TimelineHistory
                                    runs={selectedRuns}
                                    selectedRunId={selectedRunId}
                                    onSelectRun={handleSelectRun}
                                    reviewsByRun={reviewsByRun}
                                />
                            </Col>
                            <Col xs={24} lg={16} xl={17} style={{ minWidth: 0 }}>
                                <ComparisonDetails
                                    runDetail={selectedRunDetail}
                                    runs={selectedRuns}
                                    selectedRunId={selectedRunId}
                                    loading={detailLoading}
                                    doctorReview={doctorReview}
                                />
                            </Col>
                        </Row>
                    </>
                )}
            </div>
        </div>
    );
};

export default CompareResult;
