import React, { useEffect, useState, useRef } from 'react';
import { Drawer, Tabs, Button, Spin, message, notification } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { MedicalExamination, EpisodeFormData, formDataToEpisodeRequest, episodeToFormData } from './S2MedicalExamination';
import { MedicalHistoryPage, demoToMedicalHistoryRequest, demoToSurgeryRequests } from './MedicalHistory';
import { ClinicalAssessmentPage } from './ClinicalAssessment';
import { Step4Antibiogram, AntibioticRow } from './S4Antibiogram';
import {
    IEpisode,
    ILabResult,
    IClinicalRecord,
    ICultureResult,
    IImageResult,
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
    callCreateLabResult,
    callUpdateLabResult,
    callFetchImageResultsByEpisode,
    callCreateImageResult,
    callUpdateImageResult,
    callDeleteImageResult,
    callCreateClinicalRecord,
    callUpdateClinicalRecord,
    callCreateCultureResult,
    callUpdateCultureResult,
    callDeleteCultureResult,
} from '@/apis/api';
import { useDemographics, useAppDispatch, useClinical } from '@/redux/hook';
import { resetDemographics, resetClinical } from '@/redux/slice/patientSlice';

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
    const [imageResults, setImageResults] = useState<IImageResult[]>([]);
    const [sensitivityMap, setSensitivityMap] = useState<Record<string, ISensitivityResult[]>>({});
    const [medicalHistory, setMedicalHistory] = useState<IMedicalHistory | null>(null);
    const [surgeries, setSurgeries] = useState<ISurgery[]>([]);

    // Form data refs for saving
    const episodeFormRef = useRef<EpisodeFormData | null>(null);
    const antibioticsRef = useRef<AntibioticRow[]>([]);
    const { demographics } = useDemographics();
    const { clinical } = useClinical();
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
        setImageResults([]);
        setSensitivityMap({});
        setMedicalHistory(null);
        setSurgeries([]);
        dispatch(resetDemographics());
        dispatch(resetClinical());
    };

    const fetchAllData = async (episodeId: string) => {
        setLoading(true);
        try {
            const [labRes, clinicalRes, cultureRes, mhRes, surgeryRes, imageRes] = await Promise.all([
                callFetchLabResultsByEpisode(episodeId, 'page=0&size=10&sort=updatedAt,desc'),
                callFetchClinicalRecordsByEpisode(episodeId, 'page=0&size=1&sort=updatedAt,desc'),
                callFetchCultureResultsByEpisode(episodeId, 'page=0&size=50'),
                callFetchMedicalHistory(episodeId).catch(() => null),
                callFetchSurgeriesByEpisode(episodeId, 'page=0&size=50&sort=surgeryDate,asc'),
                callFetchImageResultsByEpisode(episodeId, 'page=0&size=50')
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

            const images = imageRes?.data?.result ?? [];
            setImageResults(images);

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
            // Only include rows that have at least surgeryDate AND procedure (required by backend)
            const formSurgeries = demographics.surgicalHistory.filter(s => s.surgeryDate && s.procedure);
            const dbSurgeries = surgeries;

            const formIds = new Set(formSurgeries.map(s => String(s.id)));
            const dbIds = new Set(dbSurgeries.map(s => String(s.id)));

            const toDelete = dbSurgeries.filter(s => !formIds.has(String(s.id)));
            const toUpdate = formSurgeries.filter(s => dbIds.has(String(s.id)));
            const toCreate = formSurgeries.filter(s => !dbIds.has(String(s.id)));

            const deletePromises = toDelete.map(s => callDeleteSurgery(String(s.id!)));

            const updatePromises = toUpdate.map(s => {
                const payload: Omit<ISurgery, 'id' | 'createdAt' | 'updatedAt'> = {
                    episodeId: Number(episodeId),
                    surgeryDate: s.surgeryDate,
                    surgeryType: s.procedure,
                    findings: s.notes || undefined,
                };
                return callUpdateSurgery(String(s.id), payload);
            });

            const createPromises = toCreate.map(s => {
                const payload: Omit<ISurgery, 'id' | 'createdAt' | 'updatedAt'> = {
                    episodeId: Number(episodeId),
                    surgeryDate: s.surgeryDate,
                    surgeryType: s.procedure,
                    findings: s.notes || undefined,
                };
                return callCreateSurgery(payload);
            });

            await Promise.all([...deletePromises, ...updatePromises, ...createPromises]);

            // 4. Save Lab Results
            const getLab = (name: string) => {
                const test = clinical.hematologyTests?.find(t => t.name.toLowerCase() === name.toLowerCase());
                return test && test.result ? { value: Number(test.result), unit: test.unit } : undefined;
            };
            const getFluid = (name: string) => {
                const test = clinical.fluidAnalysis?.find(t => t.name.toLowerCase() === name.toLowerCase());
                return test && test.result ? { value: Number(test.result), unit: test.unit } : undefined;
            };

            const reverseBioMapping: Record<string, string> = {
                'bc_4': 'glucose',
                'bc_5': 'ure',
                'bc_6': 'creatinine',
                'ht_20': 'eGFR',
                'bc_7': 'albumin',
                'bc_8': 'ast',
                'bc_9': 'alt',
                'bc_10': 'natri',
                'bc_11': 'kali',
                'bc_12': 'clo',
                'bc_13': 'hba1c'
            };

            const labPayload: Partial<ILabResult> = {
                episodeId: Number(episodeId),
                esr: getLab('Máu lắng'),
                wbcBlood: getLab('wbc'),
                neut: getLab('%NEUT'),
                mono: getLab('%MONO'),
                rbc: getLab('RBC'),
                mcv: getLab('MCV'),
                mch: getLab('MCH'),
                rdw: getLab('RDW-CV'),
                ig: getLab('IG%'),
                crp: getFluid('Định lượng CRP (Dịch)'),
                synovialWbc: getFluid('Bạch cầu (Dịch)'),
                synovialPmn: getFluid('%PMN (Dịch)'),
                biochemicalData: clinical.biochemistryTests?.reduce((acc, test) => {
                    if (test.result) {
                        const backendKey = reverseBioMapping[test.id] || test.id;
                        acc[backendKey] = { value: Number(test.result), unit: test.unit };
                    }
                    return acc;
                }, {} as Record<string, any>)
            };

            if (labResults.length > 0 && labResults[0].id) {
                await callUpdateLabResult(labResults[0].id, labPayload as ILabResult);
            } else {
                await callCreateLabResult(labPayload as ILabResult);
            }
            // 5. Save Clinical Record (symptoms + examination)
            const clinicalPayload: Partial<IClinicalRecord> = {
                episodeId: Number(episodeId),
                illnessOnsetDate: demographics.symptomDate || undefined,
                bloodPressure: clinical.examination?.blood_press || undefined,
                bmi: clinical.examination?.bmi ? Number(clinical.examination.bmi) : undefined,
                fever: clinical.symptoms?.fever ?? false,
                pain: clinical.symptoms?.pain ?? false,
                erythema: clinical.symptoms?.erythema ?? false,
                swelling: clinical.symptoms?.swelling ?? false,
                sinusTract: clinical.symptoms?.sinusTract ?? false,
                hematogenousSuspected: clinical.symptoms?.hematogenousSuspected ?? false,
                pmmaAllergy: clinical.symptoms?.pmmaAllergy ?? false,
                suspectedInfectionType: clinical.examination?.suspectedInfectionType || undefined,
                softTissue: clinical.examination?.softTissue || undefined,
                implantStability: clinical.examination?.implantStability || undefined,
                prosthesisJoint: clinical.examination?.prosthesisJoint || undefined,
                daysSinceIndexArthroplasty: clinical.examination?.daysSinceIndexArthroplasty
                    ? Number(clinical.examination.daysSinceIndexArthroplasty) : undefined,
                notations: clinical.examination?.notations || undefined,
            };

            if (clinicalRecord?.id) {
                await callUpdateClinicalRecord(clinicalRecord.id, clinicalPayload as IClinicalRecord);
            } else {
                await callCreateClinicalRecord(clinicalPayload as IClinicalRecord);
            }

            // 6. Save Culture Results (microbiology samples)
            const formCultures = clinical.cultureSamples || [];
            const dbCultures = cultureResults;

            const formCultureIds = new Set(formCultures.map(s => String(s.id)));
            const dbCultureIds = new Set(dbCultures.map(c => String(c.id)));

            const culturesToDelete = dbCultures.filter(c => !formCultureIds.has(String(c.id)));
            const culturesToUpdate = formCultures.filter(s => dbCultureIds.has(String(s.id)));
            const culturesToCreate = formCultures.filter(s => !dbCultureIds.has(String(s.id)));

            const deleteCulturePromises = culturesToDelete.map(c => callDeleteCultureResult(String(c.id!)));

            const updateCulturePromises = culturesToUpdate.map(s => {
                const payload: Partial<ICultureResult> = {
                    episodeId: Number(episodeId),
                    name: s.bacteriaName || undefined,
                    incubationDays: s.incubation_days ? Number(s.incubation_days) : undefined,
                    result: s.result || undefined,
                    notes: s.notes || undefined,
                };
                return callUpdateCultureResult(String(s.id), payload as ICultureResult);
            });

            const createCulturePromises = culturesToCreate.map(s => {
                const payload: Partial<ICultureResult> = {
                    episodeId: Number(episodeId),
                    name: s.bacteriaName || undefined,
                    incubationDays: s.incubation_days ? Number(s.incubation_days) : undefined,
                    result: s.result || undefined,
                    notes: s.notes || undefined,
                };
                return callCreateCultureResult(payload as ICultureResult);
            });

            await Promise.all([...deleteCulturePromises, ...updateCulturePromises, ...createCulturePromises]);
            // 5. Save Image Results
            const formImages = clinical.imaging?.images || [];
            const dbImages = imageResults;

            const formImageIds = new Set(formImages.map(img => String(img.id)));
            const dbImageIds = new Set(dbImages.map(img => String(img.id)));

            const imagesToDelete = dbImages.filter(img => !formImageIds.has(String(img.id)));
            const imagesToUpdate = formImages.filter(img => dbImageIds.has(String(img.id)));
            const imagesToCreate = formImages.filter(img => !dbImageIds.has(String(img.id)));

            const deleteImagePromises = imagesToDelete.map(img => callDeleteImageResult(String(img.id!)));

            const updateImagePromises = imagesToUpdate.map(img => {
                const payload: Partial<IImageResult> = {
                    episodeId: Number(episodeId),
                    type: img.type,
                    fileMetadata: JSON.stringify({ url: img.url, name: img.name }),
                    findings: clinical.imaging?.description || undefined,
                };
                return callUpdateImageResult(String(img.id), payload as IImageResult);
            });

            const createImagePromises = imagesToCreate.map(img => {
                const payload: Partial<IImageResult> = {
                    episodeId: Number(episodeId),
                    type: img.type,
                    fileMetadata: JSON.stringify({ url: img.url, name: img.name }),
                    findings: clinical.imaging?.description || undefined,
                    imagingDate: new Date().toISOString().split('T')[0],
                };
                return callCreateImageResult(payload as IImageResult);
            });

            await Promise.all([...deleteImagePromises, ...updateImagePromises, ...createImagePromises]);

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
                    cultureResults={cultureResults}
                    imageResults={imageResults}
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
