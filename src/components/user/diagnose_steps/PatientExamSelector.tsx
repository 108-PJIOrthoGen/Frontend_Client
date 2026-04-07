import React, { useEffect, useState } from 'react';
import { Button, Input, Table, message, Tag, Empty } from 'antd';
import { SearchOutlined, CheckCircleOutlined, CloseOutlined } from '@ant-design/icons';
import { callFetchPatient, callFetchEpisodesByPatient } from '@/apis/api';
import { IPatient, IEpisode } from '@/types/backend';
import dayjs from 'dayjs';
import { sfLike } from 'spring-filter-query-builder';
import { useAppDispatch } from '@/redux/hook';
import { setCurrentCase } from '@/redux/slice/patientSlice';

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

    const handleSelectExam = (exam: IEpisode) => {
        setSelectedExam(exam);
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
        // Store selection in localStorage for downstream steps
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
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CheckCircleOutlined className="text-green-500 text-xl" />
                            <span className="text-green-900 font-semibold">
                                Bệnh án đã chọn: #{selectedExam.id} — Ngày: {selectedExam.admissionDate ? dayjs(selectedExam.admissionDate).format('DD/MM/YYYY') : 'N/A'}
                            </span>
                        </div>
                        <Button type="primary" size="large" onClick={handleContinue}>
                            Chẩn đoán AI →
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
