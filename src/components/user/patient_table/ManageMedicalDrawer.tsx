import React, { useEffect, useState } from 'react';
import { Drawer, Table, Button, Tag, message, Space } from 'antd';
import { PlusOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { IPatient, IEpisode } from '@/types/backend';
import { callFetchEpisodesByPatient } from '@/apis/api';
import dayjs from 'dayjs';
import MedicalExamDetail from './MedicalExamDetail';

interface ManageMedicalDrawerProps {
    open: boolean;
    onClose: () => void;
    patient: IPatient | null;
}

const ManageMedicalDrawer: React.FC<ManageMedicalDrawerProps> = ({ open, onClose, patient }) => {
    const [episodes, setEpisodes] = useState<IEpisode[]>([]);
    const [loading, setLoading] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedEpisode, setSelectedEpisode] = useState<IEpisode | null>(null);

    const fetchEpisodes = async () => {
        if (!patient?.id) return;
        setLoading(true);
        try {
            const res = await callFetchEpisodesByPatient(patient.id, 'page=0&size=50&sort=createdAt,desc');
            if (res?.data?.result) {
                setEpisodes(res.data.result);
            }
        } catch {
            message.error('Không thể tải danh sách bệnh án');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open && patient?.id) {
            fetchEpisodes();
        }
        if (!open) {
            setEpisodes([]);
        }
    }, [open, patient?.id]);

    const handleOpenDetail = (episode: IEpisode | null) => {
        setSelectedEpisode(episode);
        setDetailOpen(true);
    };

    const handleCloseDetail = () => {
        setDetailOpen(false);
        setSelectedEpisode(null);
        fetchEpisodes();
    };

    const getStatusTag = (status?: string) => {
        switch (status) {
            case 'normal': return <Tag color="processing">Đang điều trị</Tag>;
            case 'bad': return <Tag color="success">Hoàn thành</Tag>;
            case 'worse': return <Tag color="error">Đã hủy</Tag>;
            default: return <Tag color="default">{status || 'N/A'}</Tag>;
        }
    };

    const columns = [
        {
            title: 'STT',
            key: 'index',
            width: 60,
            align: 'center' as const,
            render: (_: any, __: any, index: number) => index + 1,
        },
        {
            title: 'Ngày vào viện',
            dataIndex: 'admissionDate',
            key: 'admissionDate',
            render: (val: string) => val ? dayjs(val).format('DD/MM/YYYY') : '—',
        },
        {
            title: 'Khoa',
            dataIndex: 'department',
            key: 'department',
            render: (val: string) => val || '—',
        },
        {
            title: 'Kết quả điều trị',
            dataIndex: 'result',
            key: 'result',
            render: (val: string) => {
                const map: Record<string, string> = {
                    good: 'Khỏi',
                    normal: 'Đỡ, giảm nhẹ',
                    bad: 'Không thay đổi',
                    worse: 'Nặng hơn',
                    die: 'Tử vong',
                };
                return map[val] || val || '—';
            },
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (val: string) => getStatusTag(val),
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (val: string) => val ? dayjs(val).format('DD/MM/YYYY') : '—',
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 100,
            render: (_: any, record: IEpisode) => (
                <Button
                    type="link"
                    icon={<FolderOpenOutlined />}
                    onClick={() => handleOpenDetail(record)}
                >
                    Xem chi tiết
                </Button>
            ),
        },
    ];

    return (
        <>
            <Drawer
                title={
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-600">folder_shared</span>
                        <span>Quản lý bệnh án</span>
                    </div>
                }
                open={open}
                onClose={onClose}
                width="75%"
            >
                {/* Patient Summary Header */}
                {patient && (
                    <div className="bg-gradient-to-r from-blue-50 to-slate-50 rounded-xl border border-blue-100 p-5 mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-lg font-bold">
                                {patient.fullName?.charAt(0)?.toUpperCase() || 'P'}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-900">{patient.fullName}</h3>
                                <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                                    <span>Mã BN: <strong>{patient.patientCode || '—'}</strong></span>
                                    <span>Ngày sinh: <strong>{patient.dateOfBirth ? dayjs(patient.dateOfBirth).format('DD/MM/YYYY') : '—'}</strong></span>
                                    <span>SĐT: <strong>{patient.phone || '—'}</strong></span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Toolbar */}
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-base font-semibold text-slate-800">Danh sách bệnh án</h4>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => handleOpenDetail(null)}
                    >
                        Thêm mới bệnh án
                    </Button>
                </div>

                {/* Medical Exams Table */}
                <Table
                    dataSource={episodes}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    onRow={(record) => ({
                        onClick: () => handleOpenDetail(record),
                        style: { cursor: 'pointer' },
                    })}
                    locale={{ emptyText: 'Chưa có bệnh án nào' }}
                />
            </Drawer>

            {/* Nested Detail Drawer */}
            <MedicalExamDetail
                open={detailOpen}
                onClose={handleCloseDetail}
                examData={selectedEpisode}
                patientId={patient?.id}
            />
        </>
    );
};

export default ManageMedicalDrawer;
