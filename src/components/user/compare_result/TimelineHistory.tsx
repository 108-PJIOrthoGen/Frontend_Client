import React from 'react';
import { Alert, Card, Empty, Space, Tag, Timeline, Typography } from 'antd';
import { IAiRecommendationRun, IDoctorRecommendationReview } from '@/types/backend';
import dayjs from 'dayjs';

const { Text } = Typography;

interface TimelineHistoryProps {
    runs: IAiRecommendationRun[];
    selectedRunId: string | null;
    onSelectRun: (runId: string) => void;
    /** Doctor review per run id — renders the review status on each run card. */
    reviewsByRun?: Record<string, IDoctorRecommendationReview>;
}

const REVIEW_TAGS: Record<string, { color: string; label: string }> = {
    ACCEPTED: { color: 'green', label: 'BS đồng thuận' },
    MODIFIED: { color: 'orange', label: 'BS ghi đè' },
    REJECTED: { color: 'red', label: 'BS từ chối' },
    SAVED_DRAFT: { color: 'default', label: 'Nháp' },
};

const MAX_RECOMMENDED_RUNS = 3;

const STATUS_LABELS: Record<string, { label: string; tag: string; dot: string }> = {
    SUCCESS: { label: 'Hoàn thành', tag: 'green', dot: 'blue' },
    PARTIAL: { label: 'Một phần', tag: 'cyan', dot: 'blue' },
    FAILED: { label: 'Thất bại', tag: 'red', dot: 'red' },
    TIMEOUT: { label: 'Hết thời gian', tag: 'red', dot: 'red' },
    PROCESSING: { label: 'Đang xử lý', tag: 'gold', dot: 'gold' },
    QUEUED: { label: 'Đang chờ', tag: 'gold', dot: 'gold' },
};

const TimelineHistory: React.FC<TimelineHistoryProps> = ({ runs, selectedRunId, onSelectRun, reviewsByRun }) => {
    const items = runs.map((run, index) => {
        const runNumber = runs.length - index;
        const isLatest = index === 0;
        const isSelected = run.id === selectedRunId;
        const isClickable = (run.status === 'SUCCESS' || run.status === 'PARTIAL') && !!run.id;
        const status = STATUS_LABELS[run.status ?? ''] ?? { label: run.status || 'N/A', tag: 'default', dot: 'gray' };
        const review = run.id ? reviewsByRun?.[run.id] : undefined;
        const reviewTag = review?.reviewStatus ? REVIEW_TAGS[review.reviewStatus] : undefined;

        return {
            key: run.id || String(index),
            color: status.dot,
            children: (
                <Card
                    size="small"
                    hoverable={isClickable}
                    onClick={() => isClickable && onSelectRun(run.id!)}
                    style={{
                        cursor: isClickable ? 'pointer' : 'default',
                        borderColor: isSelected ? '#60a5fa' : undefined,
                        boxShadow: isSelected ? '0 0 0 2px rgba(59,130,246,0.2)' : undefined,
                    }}
                >
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                            <Text strong>AI gợi ý lần {runNumber}</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {run.createdAt ? dayjs(run.createdAt).format('HH:mm • DD/MM/YYYY') : '—'}
                            </Text>
                        </Space>
                        <Space size={6} wrap>
                            <Tag color={status.tag}>{status.label}</Tag>
                            {isLatest && <Tag color="blue">Mới nhất</Tag>}
                            {reviewTag
                                ? <Tag color={reviewTag.color}>{reviewTag.label}</Tag>
                                : ((run.status === 'SUCCESS' || run.status === 'PARTIAL')
                                    && <Tag>Chưa có chẩn đoán BS</Tag>)}
                            {isSelected && <Tag color="geekblue">Đang xem</Tag>}
                        </Space>
                        {run.updatedAt && run.createdAt && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                Thời gian xử lý: {dayjs(run.updatedAt).diff(dayjs(run.createdAt), 'second')}s
                            </Text>
                        )}
                    </Space>
                </Card>
            ),
        };
    });

    return (
        <Card
            size="small"
            title="Lịch sử gợi ý AI"
            extra={
                <Tag color={runs.length > MAX_RECOMMENDED_RUNS ? 'orange' : 'default'}>
                    {runs.length} lần chạy
                </Tag>
            }
        >
            {runs.length === 0
                ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Bệnh án này chưa có lần gợi ý AI nào" />
                : <Timeline items={items} />}
            {runs.length >= MAX_RECOMMENDED_RUNS && (
                <Alert
                    type="warning"
                    showIcon
                    message={`Đã đạt ${MAX_RECOMMENDED_RUNS} lần gợi ý — khuyến nghị không tạo thêm để tránh gây nhiễu quyết định lâm sàng.`}
                />
            )}
        </Card>
    );
};

export default TimelineHistory;
