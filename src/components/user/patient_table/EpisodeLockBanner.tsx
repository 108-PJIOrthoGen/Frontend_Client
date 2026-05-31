import React from 'react';
import { Alert, Button, Space } from 'antd';
import { LockOutlined, ReloadOutlined } from '@ant-design/icons';
import type { LockStatus } from './useEpisodeLock';

interface Props {
    status: LockStatus;
    heldBy: number | null;
    ttlSeconds: number;
    message: string | null;
    onRetry?: () => void;
}

const formatCountdown = (ttlSeconds: number): string => {
    const safe = Math.max(0, ttlSeconds);
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const EpisodeLockBanner: React.FC<Props> = ({ status, heldBy, ttlSeconds, message, onRetry }) => {
    if (status === 'busy') {
        return (
            <Alert
                type="warning"
                showIcon
                icon={<LockOutlined />}
                message="Bệnh án đang được chỉnh sửa"
                description={
                    <div>
                        <div>
                            {message ?? `Bác sĩ ID ${heldBy ?? '?'} đang chỉnh sửa bệnh án này.`}
                        </div>
                        <div>
                            Khóa sẽ tự nhả sau <strong>{formatCountdown(ttlSeconds)}</strong>.
                            Bạn chỉ có thể xem, không thể lưu.
                        </div>
                    </div>
                }
                action={
                    onRetry ? (
                        <Space>
                            <Button size="small" icon={<ReloadOutlined />} onClick={onRetry}>
                                Thử lại
                            </Button>
                        </Space>
                    ) : null
                }
                className="mb-3"
            />
        );
    }

    if (status === 'error') {
        return (
            <Alert
                type="error"
                showIcon
                message="Không thể lấy khóa chỉnh sửa"
                description={message ?? 'Vui lòng thử lại.'}
                action={
                    onRetry ? (
                        <Button size="small" icon={<ReloadOutlined />} onClick={onRetry}>
                            Thử lại
                        </Button>
                    ) : null
                }
                className="mb-3"
            />
        );
    }

    if (status === 'held' && ttlSeconds > 0 && ttlSeconds <= 30) {
        return (
            <Alert
                type="info"
                showIcon
                message={`Khóa chỉnh sửa sắp hết hạn (${formatCountdown(ttlSeconds)})`}
                description="Hệ thống sẽ tự gia hạn. Nếu mất kết nối, hãy lưu sớm."
                className="mb-3"
            />
        );
    }

    return null;
};

export default EpisodeLockBanner;
