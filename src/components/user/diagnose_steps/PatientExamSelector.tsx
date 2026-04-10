import React, { useEffect, useState } from 'react';
import { Button, Input, Table, message, Tag, Empty, Spin, Tooltip } from 'antd';
import { SearchOutlined, CheckCircleOutlined, HistoryOutlined, PlusCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { callFetchPatient, callFetchEpisodesByPatient, callFetchAiRecommendationRuns, callFetchAiRecommendationRunDetail } from '@/apis/api';
import { IPatient, IEpisode, IAiRecommendationRun } from '@/types/backend';
import dayjs from 'dayjs';
import { sfLike } from 'spring-filter-query-builder';
import { useAppDispatch } from '@/redux/hook';
import { setCurrentCase } from '@/redux/slice/patientSlice';

const MAX_RUNS_PER_EPISODE = 5;

const getStatusTag = (status?: string) => {
    switch (status) {
        case 'SUCCESS': return <Tag color="success">Thành công</Tag>;
        case 'PARTIAL': return <Tag color="warning">Một phần</Tag>;
        case 'FAILED': return <Tag color="error">Thất bại</Tag>;
        case 'TIMEOUT': return <Tag color="error">Hết thời gian</Tag>;
        case 'PROCESSING': return <Tag color="processing">Đang xử lý</Tag>;
        case 'QUEUED': return <Tag color="default">Đang chờ</Tag>;
        default: return <Tag>{status || 'N/A'}</Tag>;
    }
};

interface PatientExamSelectorProps {
    onNext: () => void;
    searchValue: string;
    setSearchValue: (v: string) => void;
    patients: IPatient[];
    setPatients: (v: IPatient[]) => void;
}

export const PatientExamSelector: React.FC<PatientExamSelectorProps> = ({ onNext, searchValue, setSearchValue, patients, setPatients }) => {
    const dispatch = useAppDispatch();

    const [searchLoading, setSearchLoading] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<IPatient | null>(null);

    const [exams, setExams] = useState<IEpisode[]>([]);
    const [examsLoading, setExamsLoading] = useState(false);
    const [selectedExam, setSelectedExam] = useState<IEpisode | null>(null);

    const [aiRuns, setAiRuns] = useState<IAiRecommendationRun[]>([]);
    const [aiRunsLoading, setAiRunsLoading] = useState(false);
    const [loadingRunId, setLoadingRunId] = useState<string | null>(null);

    useEffect(() => {
        const fetchFilms = async () => {
            setSearchLoading(true);
            let queryString = `page=0&size=5&`;
            if (searchValue) {
                queryString += `filter=${sfLike('identityCard', searchValue)}`
                const res = await callFetchPatient(queryString);
                if (res && res.data) {
                    setPatients(res.data.result);
                }
            }
            setSearchLoading(false);
        }
        fetchFilms();
    }, [searchValue]);

    const handleChangeVal = (e: { target: { value: string; } }) => {
        setSearchValue(e.target.value)
        if (e.target.value === '') {
            setSearchValue('')
            setPatients([])
        }
    }

    const handleSelectPatient = async (patient: IPatient) => {
        setSelectedPatient(patient);
        setSelectedExam(null);
        if (!patient.id) return;

        setExamsLoading(true);
        try {
            const res = await callFetchEpisodesByPatient(patient.id, 'page=0&size=50&sort=createdAt,desc');
            if (res?.data?.result) {
                setExams(res.data.result);
            } else {
                setExams([]);
            }
        } catch {
            message.error('Không thể tải danh sách bệnh án');
        } finally {
            setExamsLoading(false);
        }
    };

    const handleSelectExam = async (exam: IEpisode) => {
        setSelectedExam(exam);
        setAiRuns([]);
        if (!exam.id) return;

        setAiRunsLoading(true);
        try {
            const res = await callFetchAiRecommendationRuns(String(exam.id), 'page=0&size=10&sort=createdAt,desc');
            if (res?.data?.result) {
                setAiRuns(res.data.result);
            }
        } catch {
            // Silently fail — runs are optional info
        } finally {
            setAiRunsLoading(false);
        }
    };

    const handleViewPreviousRun = async (run: IAiRecommendationRun) => {
        if (!run.id || !selectedPatient || !selectedExam) return;
        if (run.status !== 'SUCCESS' && run.status !== 'PARTIAL') {
            message.warning('Chỉ có thể xem kết quả của lần chạy thành công.');
            return;
        }

        setLoadingRunId(String(run.id));
        try {
            const res = await callFetchAiRecommendationRunDetail(String(run.id));
            const detail = res?.data;
            if (!detail?.items?.length) {
                message.warning('Không tìm thấy dữ liệu gợi ý cho lần chạy này.');
                return;
            }

            localStorage.setItem('pji_selectedPatientId', selectedPatient.id || '');
            localStorage.setItem('pji_selectedExamId', selectedExam.id || '');
            localStorage.setItem('pji_aiRunId', String(run.id));
            localStorage.setItem('pji_aiRunDetail', JSON.stringify(detail));
            dispatch(setCurrentCase({ patient: selectedPatient, episode: selectedExam }));
            onNext();
        } catch {
            message.error('Lỗi khi tải kết quả AI.');
        } finally {
            setLoadingRunId(null);
        }
    };

    const handleContinue = () => {
        if (!selectedPatient) {
            message.warning('Vui lòng chọn bệnh nhân');
            return;
        }
        if (!selectedExam) {
            message.warning('Vui lòng chọn bệnh án');
            return;
        }
        if (aiRuns.length >= MAX_RUNS_PER_EPISODE) {
            message.error(`Đã đạt giới hạn ${MAX_RUNS_PER_EPISODE} lần gọi AI cho bệnh án này.`);
            return;
        }
        // Clear stale AI run data — user is starting a new diagnosis
        localStorage.removeItem('pji_aiRunId');
        localStorage.removeItem('pji_aiRunDetail');
        localStorage.setItem('pji_selectedPatientId', selectedPatient.id || '');
        localStorage.setItem('pji_selectedExamId', selectedExam.id || '');
        dispatch(setCurrentCase({ patient: selectedPatient, episode: selectedExam }));
        onNext();
    };

    const patientColumns = [
        {
            title: 'Họ & Tên',
            dataIndex: 'fullName',
            key: 'fullName',
        },
        {
            title: 'Mã BN',
            dataIndex: 'patientCode',
            key: 'patientCode',
        },
        {
            title: 'Số CCCD',
            dataIndex: 'identityCard',
            key: 'identityCard',
        },
        {
            title: 'Ngày sinh',
            dataIndex: 'dateOfBirth',
            key: 'dateOfBirth',
            render: (val: string) => val ? dayjs(val).format('DD/MM/YYYY') : '—',
        },
    ];

    const examColumns = [
        {
            title: 'Ngày vào viện',
            dataIndex: 'admissionDate',
            key: 'admissionDate',
            render: (val: string) => val ? dayjs(val).format('DD/MM/YYYY HH:mm') : '—',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (val: string) => {
                switch (val) {
                    case 'normal': return <Tag color="processing">Đang điều trị</Tag>;
                    case 'bad': return <Tag color="success">Hoàn thành</Tag>;
                    default: return <Tag>{val || 'N/A'}</Tag>;
                }
            },
        }
    ];

    return (
        <div className="flex-1 bg-white p-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Search Section */}
                <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Chọn bệnh nhân & bệnh án</h2>
                    <p className="text-slate-500 text-sm mb-6">Tìm kiếm bệnh nhân, sau đó chọn bệnh án để tiến hành chẩn đoán AI</p>
                    <div className="flex gap-3">
                        <Input
                            size="large"
                            placeholder="Nhập số CCCD của bệnh nhân"
                            value={searchValue}
                            onChange={handleChangeVal}
                            prefix={<SearchOutlined className="text-slate-400" />}
                            className="flex-1"
                        />
                    </div>
                </section>

                {/* Patient Results */}
                {patients.length > 0 && (
                    <section>
                        <h3 className="text-base font-semibold text-slate-800 mb-3">
                            Kết quả tìm kiếm ({patients.length} bệnh nhân)
                        </h3>
                        <Table
                            dataSource={patients}
                            columns={patientColumns}
                            rowKey="id"
                            pagination={false}
                            size="small"
                            rowClassName={(record) =>
                                record.id === selectedPatient?.id
                                    ? 'bg-blue-50 font-semibold'
                                    : 'cursor-pointer hover:bg-slate-50'
                            }
                            onRow={(record) => ({
                                onClick: () => handleSelectPatient(record),
                                style: { cursor: 'pointer' },
                            })}
                        />
                    </section>
                )}

                {/* Selected Patient + Exam Selection */}
                {selectedPatient && (
                    <section>
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex items-center gap-3">
                            <CheckCircleOutlined className="text-blue-500 text-xl" />
                            <div>
                                <span className="font-semibold text-blue-900">Bệnh nhân đã chọn: </span>
                                <span className="text-blue-800">{selectedPatient.fullName} — Mã: {selectedPatient.patientCode || 'N/A'}</span>
                            </div>
                        </div>

                        <h3 className="text-base font-semibold text-slate-800 mb-3">Chọn bệnh án</h3>
                        {exams.length > 0 ? (
                            <Table
                                dataSource={exams}
                                columns={examColumns}
                                rowKey="id"
                                loading={examsLoading}
                                pagination={false}
                                size="small"
                                rowClassName={(record) =>
                                    record.id === selectedExam?.id
                                        ? 'bg-green-50 font-semibold'
                                        : 'cursor-pointer hover:bg-slate-50'
                                }
                                onRow={(record) => ({
                                    onClick: () => handleSelectExam(record),
                                    style: { cursor: 'pointer' },
                                })}
                            />
                        ) : (
                            <Empty description="Bệnh nhân chưa có bệnh án nào. Vui lòng tạo bệnh án từ màn hình Quản lý bệnh nhân." />
                        )}
                    </section>
                )}

                {/* Selected Exam Confirmation */}
                {selectedExam && (
                    <section className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CheckCircleOutlined className="text-green-500 text-xl" />
                                <span className="text-green-900 font-semibold">
                                    Bệnh án đã chọn: #{selectedExam.id} — Ngày: {selectedExam.admissionDate ? dayjs(selectedExam.admissionDate).format('DD/MM/YYYY') : 'N/A'}
                                </span>
                            </div>
                            <Tooltip title={aiRuns.length >= MAX_RUNS_PER_EPISODE ? `Đã đạt giới hạn ${MAX_RUNS_PER_EPISODE} lần gọi AI` : ''}>
                                <Button
                                    type="primary"
                                    size="large"
                                    onClick={handleContinue}
                                    disabled={aiRuns.length >= MAX_RUNS_PER_EPISODE}
                                    icon={<PlusCircleOutlined />}
                                >
                                    Chẩn đoán AI mới ({aiRuns.length}/{MAX_RUNS_PER_EPISODE})
                                </Button>
                            </Tooltip>
                        </div>

                        {/* Previous AI Runs */}
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
                                <HistoryOutlined className="text-blue-500" />
                                <h4 className="font-semibold text-slate-800 text-sm">
                                    Lịch sử chẩn đoán AI ({aiRuns.length} lần)
                                </h4>
                            </div>

                            {aiRunsLoading ? (
                                <div className="p-6 text-center">
                                    <Spin tip="Đang tải lịch sử..." />
                                </div>
                            ) : aiRuns.length === 0 ? (
                                <div className="p-6">
                                    <Empty
                                        description="Chưa có lần chẩn đoán AI nào cho bệnh án này"
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    />
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {aiRuns.map((run) => (
                                        <div
                                            key={run.id}
                                            className="px-4 py-3 flex items-center justify-between hover:bg-blue-50/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                                    #{run.runNo}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-slate-800">
                                                            Lần chạy #{run.runNo}
                                                        </span>
                                                        {getStatusTag(run.status)}
                                                    </div>
                                                    <span className="text-xs text-slate-500">
                                                        {run.createdAt ? dayjs(run.createdAt).format('DD/MM/YYYY HH:mm') : 'N/A'}
                                                        {run.modelName && ` · ${run.modelName}`}
                                                        {run.latencyMs && ` · ${(run.latencyMs / 1000).toFixed(1)}s`}
                                                    </span>
                                                </div>
                                            </div>
                                            <Button
                                                type="link"
                                                icon={<EyeOutlined />}
                                                loading={loadingRunId === String(run.id)}
                                                disabled={run.status !== 'SUCCESS' && run.status !== 'PARTIAL'}
                                                onClick={() => handleViewPreviousRun(run)}
                                            >
                                                Xem kết quả
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};
