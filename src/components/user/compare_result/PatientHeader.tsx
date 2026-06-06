import React from 'react';
import { Avatar, Badge, Card, Col, Row, Space, Tag, Typography } from 'antd';
import {
    CalendarOutlined,
    ClockCircleOutlined,
    MedicineBoxOutlined,
} from '@ant-design/icons';
import { IEpisode, IPatient } from '@/types/backend';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

interface PatientHeaderProps {
    episode: IEpisode;
    /** Explicit patient — episode list rows may not nest the patient object. */
    patient?: IPatient | null;
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
    active: { color: 'processing', label: 'Đang điều trị' },
    processing: { color: 'processing', label: 'Đang điều trị' },
    completed: { color: 'success', label: 'Hoàn thành' },
    cancelled: { color: 'error', label: 'Đã hủy' },
};

const RESULT_LABELS: Record<string, { color: string; label: string }> = {
    good: { color: 'green', label: 'Khỏi' },
    normal: { color: 'blue', label: 'Đỡ, giảm nhẹ' },
    bad: { color: 'orange', label: 'Không thay đổi' },
    worse: { color: 'red', label: 'Nặng hơn' },
};

const PatientHeader: React.FC<PatientHeaderProps> = ({ episode, patient: patientProp }) => {
    const patient = patientProp ?? episode.patient;
    const initials = patient?.fullName?.charAt(0)?.toUpperCase() || 'P';
    const status = STATUS_CONFIG[episode.status ?? ''] ?? { color: 'default', label: episode.status || 'N/A' };
    const result = episode.result ? RESULT_LABELS[episode.result] : null;

    return (
        <Card size="small" style={{ marginBottom: 22 }}>
            <Row gutter={[16, 16]} align="middle">
                <Col flex="auto">
                    <Space align="start" size={12}>
                        <Avatar size={48} style={{ background: '#dbeafe', color: '#1d4ed8', fontWeight: 700 }}>
                            {initials}
                        </Avatar>
                        <div>
                            <Space size={8}>
                                <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    {patient?.patientCode || '—'}
                                </Text>
                                {patient?.gender && (
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {patient.gender === 'MALE' ? 'Nam' : 'Nữ'}
                                        {patient.dateOfBirth && `, ${dayjs().diff(dayjs(patient.dateOfBirth), 'year')} tuổi`}
                                    </Text>
                                )}
                            </Space>
                            <Title level={4} style={{ margin: 0 }}>{patient?.fullName || 'Bệnh nhân'}</Title>
                            <Space size={6} wrap style={{ marginTop: 8 }}>
                                {episode.department && (
                                    <Tag icon={<MedicineBoxOutlined />}>{episode.department}</Tag>
                                )}
                                {episode.admissionDate && (
                                    <Tag icon={<CalendarOutlined />}>
                                        Nhập viện: {dayjs(episode.admissionDate).format('DD/MM/YYYY')}
                                    </Tag>
                                )}
                                {episode.treatmentDays != null && (
                                    <Tag icon={<ClockCircleOutlined />}>{episode.treatmentDays} ngày điều trị</Tag>
                                )}
                                <Badge status={status.color as any} text={status.label} />
                                {result && <Tag color={result.color}>KQ: {result.label}</Tag>}
                            </Space>
                        </div>
                    </Space>
                </Col>
                <Col>
                    <Space direction="vertical" size={2} align="end">
                        <Text type="secondary" style={{ fontSize: 12 }}>Bệnh án</Text>
                        <Text strong style={{ fontSize: 16 }}>#{episode.id}</Text>
                        {episode.reason && (
                            <Text type="secondary" style={{ fontSize: 12, maxWidth: 260 }} ellipsis={{ tooltip: episode.reason }}>
                                Lý do: {episode.reason}
                            </Text>
                        )}
                    </Space>
                </Col>
            </Row>
        </Card>
    );
};

export default PatientHeader;
