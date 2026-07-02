import React, { useEffect, useState } from 'react';
import { Button, Input, Table, message, Tag, Empty, Spin } from 'antd';
import { SearchOutlined, CheckCircleOutlined, HistoryOutlined, PlusCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { callFetchPatient, callFetchEpisodesByPatient, callFetchAiRecommendationRuns, callFetchAiRecommendationRunDetail } from '@/apis/api';
import { IPatient, IEpisode, IAiRecommendationRun } from '@/types/backend';
import dayjs from 'dayjs';
import { sfLike, sfOr } from 'spring-filter-query-builder';
import { useAppDispatch } from '@/redux/hook';
import { setCurrentCase } from '@/redux/slice/patientSlice';

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

const getEpisodeStatusTag = (status?: string) => {
    switch (status) {
        case 'normal': return <Tag color="processing">Đang điều trị</Tag>;
        case 'bad': return <Tag color="success">Hoàn thành</Tag>;
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
    const [aiRunsTotal, setAiRunsTotal] = useState(0);
    const [aiRunsLoading, setAiRunsLoading] = useState(false);
    const [loadingRunId, setLoadingRunId] = useState<string | null>(null);

    useEffect(() => {
        const fetchFilms = async () => {
            setSearchLoading(true);
            const term = searchValue.trim();
            if (term) {
                // doctors can look up by any identifier they have on hand.
                const filter = sfOr([
                    sfLike('patientCode', term),
                    sfLike('fullName', term, true),
                    sfLike('identityCard', term),
                ]);
                const queryString = `page=0&size=10&filter=${filter}`;
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
            setSelectedPatient(null);
            setSelectedExam(null);
            setExams([]);
            setAiRuns([]);
            setAiRunsTotal(0);
            setPatients([])
        }
    }

    const handleSelectPatient = async (patient: IPatient) => {
        setSelectedPatient(patient);
        setSelectedExam(null);
        setAiRuns([]);
        setAiRunsTotal(0);
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
        setAiRunsTotal(0);
        if (!exam.id) return;

        setAiRunsLoading(true);
        try {
            const res = await callFetchAiRecommendationRuns(String(exam.id), 'page=0&size=10&sort=createdAt,desc');
            if (res?.data?.result) {
                setAiRuns(res.data.result);
                setAiRunsTotal(res.data.meta?.total ?? res.data.result.length);
            } else {
                setAiRunsTotal(0);
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
        // Clear stale AI run data — user is starting a new diagnosis
        localStorage.removeItem('pji_aiRunId');
        localStorage.removeItem('pji_aiRunDetail');
        localStorage.removeItem('pji_diagnosticResult');
        localStorage.setItem('pji_selectedPatientId', selectedPatient.id || '');
        localStorage.setItem('pji_selectedExamId', selectedExam.id || '');
        dispatch(setCurrentCase({ patient: selectedPatient, episode: selectedExam }));
        onNext();
    };

    const patientColumns = [
        {
            title: 'Bệnh nhân',
            key: 'patient',
            render: (_: unknown, record: IPatient) => (
                <div className="min-w-0">
                    <div className="truncate font-semibold text-slate-800">{record.fullName || 'Chưa có tên'}</div>
                    <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-1 text-xs text-slate-500">
                        <span>Mã: {record.patientCode || 'N/A'}</span>
                        <span>CCCD: {record.identityCard || 'N/A'}</span>
                    </div>
                </div>
            ),
        },
        {
            title: 'Sinh',
            dataIndex: 'dateOfBirth',
            key: 'dateOfBirth',
            width: 96,
            render: (val: string) => val ? dayjs(val).format('DD/MM/YYYY') : '—',
        },
    ];

    const examColumns = [
        {
            title: 'Bệnh án',
            key: 'episode',
            render: (_: unknown, record: IEpisode) => (
                <div className="min-w-0">
                    <div className="font-semibold text-slate-800">#{record.id || 'N/A'}</div>
                    <div className="mt-0.5 truncate text-xs text-slate-500">
                        {record.reason || record.department || 'Chưa có mô tả'}
                    </div>
                </div>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 118,
            render: (val: string) => getEpisodeStatusTag(val),
        },
        {
            title: 'Ngày vào',
            dataIndex: 'admissionDate',
            key: 'admissionDate',
            width: 112,
            render: (val: string) => val ? dayjs(val).format('DD/MM/YYYY') : '—',
        }
    ];

    return (
        <div className="bg-slate-50">
            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="mt-1 text-slate-800">Chọn dữ liệu đã sẵn sàng</p>
                    </div>
                    <div className="flex flex-wrap gap-2 font-semibold">
                        <span className={`rounded-full border px-3 py-1 ${selectedPatient ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-400'}`}>
                            1. Bệnh nhân
                        </span>
                        <span className={`rounded-full border px-3 py-1 ${selectedExam ? 'border-green-200 bg-green-50 text-green-700' : 'border-slate-200 bg-white text-slate-400'}`}>
                            2. Bệnh án
                        </span>
                        <span className={`rounded-full border px-3 py-1 ${selectedExam ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-400'}`}>
                            3. Kết quả AI
                        </span>
                    </div>
                </div>

                {(selectedPatient || selectedExam) && (
                    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                        {selectedPatient && (
                            <span className="inline-flex items-center gap-2 rounded-md bg-blue-50 px-2.5 py-1 font-medium text-blue-800">
                                <CheckCircleOutlined />
                                {selectedPatient.fullName || 'Bệnh nhân'} · {selectedPatient.patientCode || 'N/A'}
                            </span>
                        )}
                        {selectedExam && (
                            <span className="inline-flex items-center gap-2 rounded-md bg-green-50 px-2.5 py-1 font-medium text-green-800">
                                <CheckCircleOutlined />
                                BA #{selectedExam.id} · {selectedExam.admissionDate ? dayjs(selectedExam.admissionDate).format('DD/MM/YYYY') : 'N/A'}
                            </span>
                        )}
                    </div>
                )}

                <div className="grid gap-4 xl:grid-cols-[0.95fr_1.2fr_0.95fr]">
                    <section className="flex min-h-[520px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
                        <div className="border-b border-slate-100 px-4 py-3">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <h3 className="font-semibold text-slate-800">Bệnh nhân</h3>
                                <Tag color={patients.length ? 'blue' : 'default'} className="m-0">{patients.length}</Tag>
                            </div>
                            <Input
                                size="large"
                                allowClear
                                placeholder="Mã BN, họ tên hoặc CCCD"
                                value={searchValue}
                                onChange={handleChangeVal}
                                prefix={<SearchOutlined className="text-slate-400" />}
                                suffix={searchLoading ? <Spin size="small" /> : null}
                            />
                        </div>

                        <div className="min-h-0 flex-1 overflow-hidden p-3">
                            {patients.length > 0 || searchLoading ? (
                                <Table
                                    dataSource={patients}
                                    columns={patientColumns}
                                    rowKey="id"
                                    loading={searchLoading}
                                    pagination={patients.length > 8 ? { pageSize: 8, size: 'small', showSizeChanger: false } : false}
                                    size="small"
                                    scroll={{ y: 340 }}
                                    rowClassName={(record) =>
                                        record.id === selectedPatient?.id
                                            ? 'cursor-pointer bg-blue-50 font-semibold'
                                            : 'cursor-pointer hover:bg-slate-50'
                                    }
                                    onRow={(record) => ({
                                        onClick: () => handleSelectPatient(record),
                                        style: { cursor: 'pointer' },
                                    })}
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center">
                                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có kết quả tìm kiếm" />
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="flex min-h-[520px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                            <h3 className="font-semibold text-slate-800">Bệnh án</h3>
                            <Tag color={exams.length ? 'green' : 'default'} className="m-0">{exams.length}</Tag>
                        </div>

                        <div className="min-h-0 flex-1 overflow-hidden p-3">
                            {!selectedPatient ? (
                                <div className="flex h-full items-center justify-center">
                                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa chọn bệnh nhân" />
                                </div>
                            ) : exams.length > 0 || examsLoading ? (
                                <Table
                                    dataSource={exams}
                                    columns={examColumns}
                                    rowKey="id"
                                    loading={examsLoading}
                                    pagination={exams.length > 8 ? { pageSize: 8, size: 'small', showSizeChanger: false } : false}
                                    size="small"
                                    scroll={{ y: 386, x: 420 }}
                                    rowClassName={(record) =>
                                        record.id === selectedExam?.id
                                            ? 'cursor-pointer bg-green-50 font-semibold'
                                            : 'cursor-pointer hover:bg-slate-50'
                                    }
                                    onRow={(record) => ({
                                        onClick: () => handleSelectExam(record),
                                        style: { cursor: 'pointer' },
                                    })}
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center">
                                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Bệnh nhân chưa có bệnh án" />
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="flex min-h-[520px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                            <div className="flex min-w-0 items-center gap-2">
                                <HistoryOutlined className="text-indigo-500" />
                                <h3 className="truncate font-semibold text-slate-800">
                                    Kết quả AI
                                    {selectedExam && (
                                        <span className="ml-1 text-xs font-medium text-slate-500">
                                            ({aiRunsTotal} lần)
                                        </span>
                                    )}
                                </h3>
                            </div>
                            <Button
                                type="primary"
                                onClick={handleContinue}
                                icon={<PlusCircleOutlined />}
                                disabled={!selectedExam}
                            >
                                Chẩn đoán mới
                            </Button>
                        </div>

                        {!selectedExam ? (
                            <div className="flex min-h-0 flex-1 items-center justify-center p-6">
                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa chọn bệnh án" />
                            </div>
                        ) : aiRunsLoading ? (
                            <div className="flex min-h-0 flex-1 items-center justify-center p-6">
                                <Spin tip="Đang tải lịch sử..." />
                            </div>
                        ) : aiRuns.length === 0 ? (
                            <div className="flex min-h-0 flex-1 items-center justify-center p-6">
                                <Empty
                                    description="Chưa có lần chẩn đoán AI nào"
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                />
                            </div>
                        ) : (
                            <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-slate-100">
                                {aiRuns.map((run) => (
                                    <div
                                        key={run.id}
                                        className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-indigo-50/50"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
                                                #{run.runNo}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-medium text-slate-800">
                                                        Lần chạy #{run.runNo}
                                                    </span>
                                                    {getStatusTag(run.status)}
                                                </div>
                                                <div className="mt-0.5 truncate text-xs text-slate-500">
                                                    {run.createdAt ? dayjs(run.createdAt).format('DD/MM/YYYY HH:mm') : 'N/A'}
                                                    {run.modelName && ` · ${run.modelName}`}
                                                    {run.latencyMs && ` · ${(run.latencyMs / 1000).toFixed(1)}s`}
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            type="link"
                                            icon={<EyeOutlined />}
                                            loading={loadingRunId === String(run.id)}
                                            disabled={run.status !== 'SUCCESS' && run.status !== 'PARTIAL'}
                                            onClick={() => handleViewPreviousRun(run)}
                                        >
                                            Xem
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};
