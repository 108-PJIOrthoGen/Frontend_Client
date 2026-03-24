import React, { useEffect, useState, useRef } from 'react';
import { Drawer, Tabs, Button, Spin, message, notification } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { MedicalExamination, EpisodeFormData, formDataToEpisodeRequest, episodeToFormData } from './S2MedicalExamination';
import { MedicalHistoryPage, demoToMedicalHistoryRequest, demoToSurgeryRequests } from './MedicalHistory';
import { ClinicalAssessmentPage } from './ClinicalAssessment';
import { Step4Antibiogram, AntibioticRow } from '../diagnose_steps/S4Antibiogram';
import {
    IEpisode,
    ILabResult,
    IClinicalRecord,
    ICultureResult,
    ISensitivityResult,
    IMedicalHistory,
    ISurgery,
} from '@/types/backend';
import {
    callCreateEpisode,
    callUpdateEpisode,
    callFetchLabResultsByEpisode,
    callFetchClinicalRecordsByEpisode,
    callFetchCultureResultsByEpisode,
    callFetchSensitivityResultsByCulture,
    callFetchMedicalHistory,
    callFetchSurgeriesByEpisode,
    callCreateMedicalHistory,
    callUpdateMedicalHistory,
    callCreateSurgery,
    callUpdateSurgery,
    callDeleteSurgery,
} from '@/apis/api';
import { useDemographics, useAppDispatch } from '@/redux/hook';
import { resetDemographics } from '@/redux/slice/patientSlice';
import { usePatient } from '@/context/PatientContext';

interface MedicalExamDetailProps {
    open: boolean;
    onClose: () => void;
    examData: IEpisode | null;
    patientId?: string;
}

const MedicalExamDetail: React.FC<MedicalExamDetailProps> = ({ open, onClose, examData, patientId }) => {
    const [loading, setLoading] = useState(false);

    // Fetched data for tabs
    const [labResults, setLabResults] = useState<ILabResult[]>([]);
    const [clinicalRecord, setClinicalRecord] = useState<IClinicalRecord | null>(null);
    const [cultureResults, setCultureResults] = useState<ICultureResult[]>([]);
    const [sensitivityMap, setSensitivityMap] = useState<Record<string, ISensitivityResult[]>>({});
    const [medicalHistory, setMedicalHistory] = useState<IMedicalHistory | null>(null);
    const [surgeries, setSurgeries] = useState<ISurgery[]>([]);

    // Form data refs for saving
    const episodeFormRef = useRef<EpisodeFormData | null>(null);
    const antibioticsRef = useRef<AntibioticRow[]>([]);
    const { demographics } = useDemographics();
    const { resetClinical } = usePatient();
    const dispatch = useAppDispatch();

    // Initialize form ref with existing data
    useEffect(() => {
        if (open && examData) {
            episodeFormRef.current = episodeToFormData(examData);
        } else {
            episodeFormRef.current = null;
        }
    }, [open, examData]);

    // Fetch all data when opening an existing episode
    useEffect(() => {
        if (!open) return;

        if (examData?.id) {
            fetchAllData(examData.id);
        } else {
            // New episode — reset all
            resetData();
        }
    }, [open, examData?.id]);

    const resetData = () => {
        setLabResults([]);
        setClinicalRecord(null);
        setCultureResults([]);
        setSensitivityMap({});
        setMedicalHistory(null);
        setSurgeries([]);
        dispatch(resetDemographics());
        resetClinical();
    };

    const fetchAllData = async (episodeId: string) => {
        setLoading(true);
        try {
            const [labRes, clinicalRes, cultureRes, mhRes, surgeryRes] = await Promise.all([
                callFetchLabResultsByEpisode(episodeId, 'page=0&size=10&sort=updatedAt,desc'),
                callFetchClinicalRecordsByEpisode(episodeId, 'page=0&size=1&sort=updatedAt,desc'),
                callFetchCultureResultsByEpisode(episodeId, 'page=0&size=50'),
                callFetchMedicalHistory(episodeId).catch(() => null),
                callFetchSurgeriesByEpisode(episodeId, 'page=0&size=50&sort=surgeryDate,asc'),
            ]);

            const labs = labRes?.data?.result ?? [];
            setLabResults(labs);

            const records = clinicalRes?.data?.result ?? [];
            setClinicalRecord(records.length > 0 ? records[0] : null);

            const cultures = cultureRes?.data?.result ?? [];
            setCultureResults(cultures);

            // Fetch sensitivity results for each culture
            const sensMap: Record<string, ISensitivityResult[]> = {};
            await Promise.all(
                cultures.map(async (c) => {
                    if (!c.id) return;
                    try {
                        const sensRes = await callFetchSensitivityResultsByCulture(c.id, 'page=0&size=100');
                        sensMap[c.id] = sensRes?.data?.result ?? [];
                    } catch { /* ignore */ }
                })
            );
            setSensitivityMap(sensMap);

            setMedicalHistory(mhRes?.data ?? null);
            setSurgeries(surgeryRes?.data?.result ?? []);
        } catch {
            message.error('Không thể tải dữ liệu bệnh án');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            let episodeId = examData?.id;

            // 1. Save/create episode
            const episodePayload = episodeFormRef.current
                ? formDataToEpisodeRequest(episodeFormRef.current)
                : {};

            const resolvedPatientId = patientId ? Number(patientId) : examData?.patientId;

            if (episodeId) {
                const res = await callUpdateEpisode(episodeId, { ...episodePayload, patientId: resolvedPatientId ? Number(resolvedPatientId) : undefined });
                if (!res.data) {
                    notification.error({ message: 'Có lỗi xảy ra', description: res.message });
                    return;
                }
            } else {
                const res = await callCreateEpisode({
                    ...episodePayload,
                    patientId: resolvedPatientId ? Number(resolvedPatientId) : undefined,
                });
                if (res.data?.id) {
                    episodeId = res.data.id;
                } else {
                    notification.error({ message: 'Có lỗi xảy ra', description: res.message });
                    return;
                }
            }

            // 2. Save medical history
            const mhPayload = demoToMedicalHistoryRequest(demographics);
            if (medicalHistory?.id) {
                await callUpdateMedicalHistory(episodeId!, mhPayload);
            } else {
                await callCreateMedicalHistory(episodeId!, mhPayload);
            }

            // 3. Save surgeries (Sync logic)
            const formSurgeries = demographics.surgicalHistory.filter(s => s.surgeryDate || s.procedure || s.notes);
            const dbSurgeries = surgeries;

            const formIds = new Set(formSurgeries.map(s => s.id));
            const dbIds = new Set(dbSurgeries.map(s => s.id));

            const toDelete = dbSurgeries.filter(s => !formIds.has(s.id));
            const toUpdate = formSurgeries.filter(s => dbIds.has(s.id));
            const toCreate = formSurgeries.filter(s => !dbIds.has(s.id));

            const deletePromises = toDelete.map(s => callDeleteSurgery(s.id!));

            const updatePromises = toUpdate.map(s => {
                const payload: Omit<ISurgery, 'id' | 'createdAt' | 'updatedAt'> = {
                    surgeryDate: s.surgeryDate || undefined,
                    surgeryType: s.procedure || undefined,
                    findings: s.notes || undefined,
                };
                return callUpdateSurgery(s.id!, payload);
            });

            const createPromises = toCreate.map(s => {
                const payload: Omit<ISurgery, 'id' | 'createdAt' | 'updatedAt' | 'episodeId'> = {
                    surgeryDate: s.surgeryDate || undefined,
                    surgeryType: s.procedure || undefined,
                    findings: s.notes || undefined,
                };
                return callCreateSurgery({ ...payload, episodeId: Number(episodeId) });
            });

            await Promise.all([...deletePromises, ...updatePromises, ...createPromises]);


            message.success(examData?.id ? 'Cập nhật bệnh án thành công!' : 'Tạo bệnh án thành công!');
            onClose();
        } catch {
            message.error('Không thể lưu bệnh án');
        }
    };

    const tabItems = [
        {
            key: '1',
            label: 'Quản lý bệnh án',
            children: (
                <MedicalExamination
                    mode="standalone"
                    episodeData={examData}
                    onFormChange={(data) => { episodeFormRef.current = data; }}
                />
            ),
        },
        {
            key: '2',
            label: 'Tiền sử bệnh',
            children: (
                <MedicalHistoryPage
                    mode="standalone"
                    medicalHistoryData={medicalHistory}
                    surgeriesData={surgeries}
                />
            ),
        },
        {
            key: '3',
            label: 'Lâm sàng & CLS',
            children: (
                <ClinicalAssessmentPage
                    mode="standalone"
                    labResults={labResults}
                    clinicalRecord={clinicalRecord}
                />
            ),
        },
        {
            key: '4',
            label: 'Kháng sinh đồ',
            children: (
                <Step4Antibiogram
                    mode="standalone"
                    cultureResults={cultureResults}
                    sensitivityMap={sensitivityMap}
                    onAntibioticsChange={(rows) => { antibioticsRef.current = rows; }}
                />
            ),
        },
    ];

    return (
        <Drawer
            title={
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600">medical_information</span>
                    <span>Chi tiết bệnh án {examData?.id ? `#${examData.id}` : '(Mới)'}</span>
                </div>
            }
            open={open}
            onClose={onClose}
            width="85%"
            destroyOnClose
            footer={
                <div className="flex justify-end gap-3 py-2">
                    <Button onClick={onClose}>Đóng</Button>
                    <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={loading}>
                        Lưu bệnh án
                    </Button>
                </div>
            }
        >
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Spin size="large" tip="Đang tải dữ liệu bệnh án..." />
                </div>
            ) : (
                <Tabs
                    defaultActiveKey="1"
                    items={tabItems}
                    type="card"
                    className="medical-exam-tabs"
                />
            )}
        </Drawer>
    );
};

export default MedicalExamDetail;
