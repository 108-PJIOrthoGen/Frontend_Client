import React, { useEffect, useState, useRef } from 'react';
import { Drawer, Tabs, Button, Spin, message, notification, Badge } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { MedicalExamination, MedicalExaminationHandle, EpisodeFormData } from './MedicalExamination';
import { MedicalHistoryPage } from './MedicalHistory';
import { AntibioticRow } from './Antibiogram';
import DoctorConclusionTab from './DoctorConclusionTab';
import AntibiogramAiVersionTab from './AntibiogramAiVersionTab';
import {
    IEpisode,
    ILabResult,
    IClinicalRecord,
    ICultureResult,
    IImageResult,
    ISensitivityResult,
    IMedicalHistory,
    ISurgery,
    IPatient,
    IEpisodeFullRequest,
    IClinicalDecisionWorkspace,
    IRunClinicalDecision,
    IPermission,
} from '@/types/backend';
import {
    callFetchEpisodeFull,
    callCreateEpisodeFull,
    callUpdateEpisodeFull,
    callFetchClinicalDecisionWorkspace,
} from '@/apis/api';
import { useClinicForm, useAppDispatch, useAppSelector } from '@/redux/hook';
import { resetClinicForm } from '@/redux/features/patients/patientSlice';
import { fetchMyPendingTasks, fetchMyPendingCount } from '@/redux/slice/pendingLabTaskSlice';
import PendingLabTasksTab from '@/components/user/pending_lab_tasks/PendingLabTasksTab';
import { useEpisodeLock } from './hooks/useEpisodeLock';
import EpisodeLockBanner from './EpisodeLockBanner';
import { episodeToFormData, formDataToEpisodeRequest } from '@/utils/apiToForm';
import { ClinicalAssessmentPage } from './ClinicalAssessment';
import { BIOCHEM_ID_TO_BACKEND_KEY } from '@/constants/canonicalLabRegistry';
import {
    EPISODE_AGGREGATE_WRITE_PERMISSION,
    hasPermission,
} from '@/components/user/diagnose_steps/treatment_plan/utils/permissions';

interface MedicalExamDetailProps {
    open: boolean;
    onClose: () => void;
    examData: IEpisode | null;
    patientId?: string;
    patient?: IPatient | null;
    /** Tab key to pre-select when opened (e.g. '4' for pending-lab follow-up). */
    initialTab?: string;
}

const MedicalExamDetail: React.FC<MedicalExamDetailProps> = ({ open, onClose, examData, patientId, patient, initialTab }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('1');
    const latestFetchRequestRef = useRef(0);
    // Imperative handle to the episode form so Save can run its Antd field rules.
    const examinationRef = useRef<MedicalExaminationHandle>(null);

    // Fetched data for tabs
    const [labResults, setLabResults] = useState<ILabResult[]>([]);
    const [clinicalRecord, setClinicalRecord] = useState<IClinicalRecord | null>(null);
    const [cultureResults, setCultureResults] = useState<ICultureResult[]>([]);
    const [imageResults, setImageResults] = useState<IImageResult[]>([]);
    const [sensitivityMap, setSensitivityMap] = useState<Record<string, ISensitivityResult[]>>({});
    const [medicalHistory, setMedicalHistory] = useState<IMedicalHistory | null>(null);
    const [surgeries, setSurgeries] = useState<ISurgery[]>([]);
    const [decisionWorkspace, setDecisionWorkspace] = useState<IClinicalDecisionWorkspace>();
    const [selectedDoctorRunId, setSelectedDoctorRunId] = useState<string>();
    const [selectedPharmacistRunId, setSelectedPharmacistRunId] = useState<string>();

    // Form data refs for saving
    const episodeFormRef = useRef<EpisodeFormData | null>(null);
    const antibioticsRef = useRef<Record<string, AntibioticRow[]>>({});
    const { form } = useClinicForm();
    const dispatch = useAppDispatch();
    const currentUser = useAppSelector((state) => state.account.user);
    const permissions = currentUser.role.permissions as IPermission[] | undefined;
    const canEditEpisode = hasPermission(permissions, EPISODE_AGGREGATE_WRITE_PERMISSION);

    // Pending lab/clinical tasks for THIS episode drive the follow-up tab and
    // its label badge. The list holds PENDING + FULFILLED, so we count only the
    // still-open ones here.
    const pendingTasks = useAppSelector((state) => state.pendingLabTask.tasks);
    const episodePendingCount = examData?.id
        ? pendingTasks.filter(
            (t) => Number(t.episode?.id) === Number(examData.id) && (t.status ?? 'PENDING') === 'PENDING',
        ).length
        : 0;

    // Redis soft-lock — only locks existing episodes. New ones (no id yet)
    // are local-only until the first save, so locking would be premature.
    const lock = useEpisodeLock(examData?.id ?? null, open && !!examData?.id && canEditEpisode);
    const isReadOnly = lock.status === 'busy';
    const isLockBlocking = lock.status === 'busy' || lock.status === 'acquiring';

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
            resetData();
            fetchAllData(examData.id);
            // Load this user's pending tasks so the follow-up tab + badge render.
            dispatch(fetchMyPendingTasks() as any);
        } else {
            // New episode — reset all
            resetData();
        }
    }, [open, examData?.id]);

    // Honour a requested initial tab (e.g. deep link → pending-lab follow-up).
    useEffect(() => {
        if (open && initialTab) setActiveTab(initialTab);
    }, [open, initialTab]);

    const resetData = () => {
        setLabResults([]);
        setClinicalRecord(null);
        setCultureResults([]);
        setImageResults([]);
        setSensitivityMap({});
        setMedicalHistory(null);
        setSurgeries([]);
        setDecisionWorkspace(undefined);
        setSelectedDoctorRunId(undefined);
        setSelectedPharmacistRunId(undefined);
        dispatch(resetClinicForm());
    };

    const fetchAllData = async (episodeId: string) => {
        const requestId = ++latestFetchRequestRef.current;
        setLoading(true);
        try {
            // One transactional read of the whole aggregate — replaces the former
            // 6 + N (per-culture sensitivity) fan-out.
            const [episodeResult, workspaceResult] = await Promise.allSettled([
                callFetchEpisodeFull(episodeId),
                callFetchClinicalDecisionWorkspace(episodeId),
            ]);
            if (requestId !== latestFetchRequestRef.current) {
                return;
            }
            if (episodeResult.status === 'rejected') throw episodeResult.reason;
            const res = episodeResult.value;
            const data = res?.data;
            if (!data) {
                message.error('Không thể tải dữ liệu bệnh án');
                return;
            }
            setLabResults(data.labResults ?? []);
            setClinicalRecord(data.clinicalRecord ?? null);
            setCultureResults(data.cultureResults ?? []);
            setImageResults(data.imageResults ?? []);
            setSensitivityMap(data.sensitivityMap ?? {});
            antibioticsRef.current = Object.fromEntries(
                Object.entries(data.sensitivityMap ?? {}).map(([cultureId, sensitivities]) => [
                    cultureId,
                    sensitivities.map((sensitivity) => ({
                        id: sensitivity.id != null ? String(sensitivity.id) : undefined,
                        name: sensitivity.antibioticName ?? '',
                        mic: sensitivity.micValue ?? '',
                        interpretation: sensitivity.sensitivityCode ?? '',
                        notes: '',
                    })),
                ]),
            );
            setMedicalHistory(data.medicalHistory ?? null);
            setSurgeries(data.surgeries ?? []);
            if (workspaceResult.status === 'fulfilled' && workspaceResult.value?.data) {
                const workspace = workspaceResult.value.data;
                setDecisionWorkspace(workspace);
                const doctorRuns = workspace.runs.filter((run) => run.run.recommendationScope === 'SURGERY' || run.run.recommendationScope === 'LEGACY_COMBINED' || !run.run.recommendationScope);
                const pharmacistRuns = workspace.runs.filter((run) => run.run.recommendationScope === 'ANTIBIOTIC' || run.run.recommendationScope === 'LEGACY_COMBINED' || !run.run.recommendationScope);
                const pick = (runs: IRunClinicalDecision[]) => runs.find((run) => run.finalSelection)
                    ?? runs.find((run) => run.run.status === 'SUCCESS' || run.run.status === 'PARTIAL')
                    ?? runs[0];
                const selectedDoctor = pick(doctorRuns);
                const selectedPharmacist = pick(pharmacistRuns);
                setSelectedDoctorRunId(selectedDoctor?.run.id != null ? String(selectedDoctor.run.id) : undefined);
                setSelectedPharmacistRunId(selectedPharmacist?.run.id != null ? String(selectedPharmacist.run.id) : undefined);
            }
        } catch {
            if (requestId !== latestFetchRequestRef.current) {
                return;
            }
            message.error('Không thể tải dữ liệu bệnh án');
        } finally {
            if (requestId === latestFetchRequestRef.current) {
                setLoading(false);
            }
        }
    };

    const handleDecisionUpdated = (updatedRun: IRunClinicalDecision) => {
        const updatedRunId = String(updatedRun.run.id);
        setDecisionWorkspace((current) => {
            if (!current) return current;
            const runs = current.runs.map((run) => {
                if (String(run.run.id) === updatedRunId) return updatedRun;
                const sameScope = run.run.recommendationScope === updatedRun.run.recommendationScope;
                return updatedRun.finalSelection && sameScope ? { ...run, finalSelection: false } : run;
            });
            return {
                ...current,
                finalRunId: updatedRun.finalSelection && updatedRun.run.id != null
                    ? Number(updatedRun.run.id)
                    : current.finalRunId,
                runs,
            };
        });
        if (updatedRun.run.recommendationScope === 'ANTIBIOTIC') setSelectedPharmacistRunId(updatedRunId);
        else setSelectedDoctorRunId(updatedRunId);
    };

    const handleSave = async () => {
        if (saving) return;
        if (!canEditEpisode) {
            message.warning('Bạn không có quyền cập nhật dữ liệu bệnh án.');
            return;
        }
        if (isLockBlocking) {
            message.warning('Bệnh án đang được người khác chỉnh sửa, không thể lưu.');
            return;
        }

        // Run the episode form's Antd rules first. On failure, jump to that tab so
        // the user sees the inline field errors (red borders + messages).
        const examinationValid = await examinationRef.current?.validate();
        if (examinationValid === false) {
            setActiveTab('1');
            message.warning('Vui lòng điền đầy đủ các trường bắt buộc ở tab "Quản lý bệnh án".');
            return;
        }

        setSaving(true);
        try {
            // Surgery dates round-trip as DD-MM-YYYY (backend SurgeryRequestDTO format).
            const formatSurgeryDate = (date: unknown): string => {
                if (!date) return '';
                if (dayjs.isDayjs(date)) return date.format('DD-MM-YYYY');
                const str = String(date);
                if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str.replaceAll('/', '-');
                if (/^\d{2}-\d{2}-\d{4}$/.test(str)) return str;
                const parsed = dayjs(str);
                return parsed.isValid() ? parsed.format('DD-MM-YYYY') : '';
            };

            const toLabTestItems = (tests: typeof form.hematologyTests) =>
                tests
                    .filter(t => t.result)
                    .map(t => ({ id: t.id, name: t.name, value: t.result, unit: t.unit, normalRange: t.normalRange }));

            // Numeric DB ids drive create-vs-update server-side; UI-only temp ids
            // (random base36) map to `undefined` so the server treats them as new.
            const numericId = (id: unknown): number | undefined =>
                /^\d+$/.test(String(id)) ? Number(id) : undefined;

            const resolvedPatientId = patientId ? Number(patientId) : examData?.patientId;
            const episodePayload = episodeFormRef.current
                ? formDataToEpisodeRequest(episodeFormRef.current)
                : {};
            const imagingFindings = form.imagingDescription?.trim()
                ? form.imagingDescription
                : undefined;
            const imageItems: NonNullable<IEpisodeFullRequest['images']> = (form.formImages || []).map(img => ({
                id: numericId(img.id),
                type: img.type,
                bucket: img.bucket,
                objectKey: img.objectKey,
                // Keep fileMetadata for backward-compat with legacy display paths.
                fileMetadata: JSON.stringify({ url: img.url, name: img.name }),
                findings: imagingFindings,
            }));

            // Findings are valid clinical data even when no image is attached.
            // Reuse an existing findings-only row when possible; otherwise let the
            // aggregate endpoint create one without bucket/object metadata.
            if (imageItems.length === 0 && imagingFindings) {
                const findingsOnlyResult = imageResults.find(img =>
                    !img.bucket && !img.objectKey && !img.fileMetadata && !img.url,
                );
                imageItems.push({
                    id: numericId(findingsOnlyResult?.id),
                    findings: imagingFindings,
                });
            }

            const payload: IEpisodeFullRequest = {
                episode: {
                    ...episodePayload,
                    patientId: resolvedPatientId ? Number(resolvedPatientId) : undefined,
                },
                medicalHistory: { ...form.medicalHistory },
                clinicalRecord: { ...form.clinicalRecord },
                labResult: {
                    hematologyTests: toLabTestItems(form.hematologyTests),
                    fluidAnalysis: toLabTestItems(form.fluidAnalysis),
                    biochemicalData: form.biochemistryTests?.reduce((acc, test) => {
                        if (test.result) {
                            const backendKey = BIOCHEM_ID_TO_BACKEND_KEY[test.id] || test.id;
                            acc[backendKey] = { value: Number(test.result), unit: test.unit };
                        }
                        return acc;
                    }, {} as Record<string, any>),
                },
                surgeries: form.surgeries
                    .filter(s => s.surgeryDate && s.surgeryType)
                    .map(s => ({
                        id: numericId(s.id),
                        surgeryDate: formatSurgeryDate(s.surgeryDate),
                        surgeryType: s.surgeryType,
                        findings: s.findings || undefined,
                        positiveHistology: s.positiveHistology,
                        intraoperativePurulence: s.intraoperativePurulence,
                    })),
                images: imageItems,
                // Sensitivities nest under their culture — the server resolves
                // freshly-created culture ids internally (no client-side id remap).
                cultures: (form.cultureResults || []).map(c => {
                    const key = String(c.id || c._tempId || '');
                    const rows = (antibioticsRef.current[key] || []).filter(r => r.name.trim());
                    return {
                        id: numericId(c.id),
                        name: c.name || undefined,
                        result: c.result || undefined,
                        gramType: c.gramType || undefined,
                        incubationDays: c.incubationDays != null ? Number(c.incubationDays) : undefined,
                        antibioticed: c.antibioticed,
                        daysOffAntibio: c.daysOffAntibio !== null
                            ? Number(c.daysOffAntibio) : undefined,
                        notes: c.notes || undefined,
                        sensitivities: rows.map(r => ({
                            id: numericId(r.id),
                            antibioticName: r.name,
                            micValue: r.mic || undefined,
                            sensitivityCode: r.interpretation || undefined,
                        })),
                    };
                }),
            };

            // patientId isn't a form field, so guard it here (the episode form's
            // Antd rules already cover admissionDate and the other required fields).
            if (!payload.episode.patientId) {
                message.warning('Chưa xác định được bệnh nhân cho bệnh án này.');
                return;
            }

            // Single atomic call — episode + all children persist or roll back together.
            const res = examData?.id
                ? await callUpdateEpisodeFull(examData.id, payload)
                : await callCreateEpisodeFull(payload);

            const responseStatus = Number(res?.status);
            if (!res || responseStatus < 200 || responseStatus >= 300) {
                notification.error({ message: 'Có lỗi xảy ra', description: res?.message });
                return;
            }

            // Release the lock right after a successful save so other doctors
            // don't have to wait for the TTL. Best-effort — server-side TTL
            // covers us if this call fails.
            await lock.release();

            // Refresh pending-task state so the sidebar progress notification and
            // badge reflect any fields the save just fulfilled server-side.
            dispatch(fetchMyPendingTasks() as any);
            dispatch(fetchMyPendingCount() as any);

            message.success(examData?.id ? 'Cập nhật bệnh án thành công!' : 'Tạo bệnh án thành công!');
            onClose();
        } catch {
            message.error('Không thể lưu bệnh án');
        } finally {
            setSaving(false);
        }
    };

    const decisionRuns = decisionWorkspace?.runs ?? [];
    const doctorDecisionRuns = decisionRuns.filter((run) => run.run.recommendationScope === 'SURGERY' || run.run.recommendationScope === 'LEGACY_COMBINED' || !run.run.recommendationScope);
    const pharmacistDecisionRuns = decisionRuns.filter((run) => run.run.recommendationScope === 'ANTIBIOTIC' || run.run.recommendationScope === 'LEGACY_COMBINED' || !run.run.recommendationScope);
    const episodeLockedSurface = (children: React.ReactNode) => (
        <fieldset
            disabled={isReadOnly}
            style={isReadOnly ? { opacity: 0.65, pointerEvents: 'none', border: 0, padding: 0, margin: 0 } : { border: 0, padding: 0, margin: 0 }}
        >
            {children}
        </fieldset>
    );

    const tabItems = [
        {
            key: '1',
            label: 'Quản lý người bệnh',
            forceRender: true,
            children: episodeLockedSurface(
                <MedicalExamination
                    ref={examinationRef}
                    mode="standalone"
                    episodeData={examData}
                    onFormChange={(data) => { episodeFormRef.current = data; }}
                />
            ),
        },
        {
            key: '2',
            label: 'Tiền sử bệnh',
            forceRender: true,
            children: episodeLockedSurface(
                <MedicalHistoryPage

                    medicalHistoryData={medicalHistory}
                    surgeriesData={surgeries}
                />
            ),
        },
        {
            key: '3',
            label: 'Lâm sàng & CLS',
            forceRender: true,
            children: episodeLockedSurface(
                <ClinicalAssessmentPage

                    labResults={labResults}
                    clinicalRecord={clinicalRecord}
                    cultureResults={cultureResults}
                    imageResults={imageResults}
                    patient={patient ?? examData?.patient}
                    episodeId={examData?.id}
                />
            ),
        },
        ...(examData?.id
            ? [{
                key: '4',
                label: (
                    <span className="flex items-center gap-2">
                        Xét nghiệm chờ bổ sung
                        <Badge count={episodePendingCount} size="small" />
                    </span>
                ),
                forceRender: true,
                children: episodeLockedSurface(
                    <PendingLabTasksTab episodeId={examData?.id} />
                ),
            }]
            : []),

        {
            key: '5',
            label: 'Kháng sinh & dược lâm sàng',
            forceRender: true,
            children: (
                <AntibiogramAiVersionTab
                    episodeId={examData?.id}
                    runs={pharmacistDecisionRuns}
                    selectedRunId={selectedPharmacistRunId}
                    onRunChange={setSelectedPharmacistRunId}
                    onDecisionUpdated={handleDecisionUpdated}
                    cultureResults={form.cultureResults?.length ? form.cultureResults : cultureResults}
                    sensitivityMap={sensitivityMap}
                />
            ),
        }, {
            key: '6',
            label: 'Kết luận bác sĩ',
            forceRender: true,
            children: (
                <DoctorConclusionTab
                    episodeId={examData?.id}
                    runs={doctorDecisionRuns}
                    selectedRunId={selectedDoctorRunId}
                    onRunChange={setSelectedDoctorRunId}
                    onDecisionUpdated={handleDecisionUpdated}
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
                    <Button onClick={onClose} disabled={saving}>Đóng</Button>
                    {canEditEpisode ? (
                        <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            onClick={handleSave}
                            loading={saving}
                            disabled={loading || saving || isLockBlocking}
                        >
                            Lưu bệnh án
                        </Button>
                    ) : null}
                </div>
            }
        >
            {canEditEpisode ? (
                <EpisodeLockBanner
                    status={lock.status}
                    heldBy={lock.heldBy}
                    ttlSeconds={lock.ttlSeconds}
                    message={lock.message}
                    onRetry={lock.retry}
                />
            ) : null}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Spin size="large" tip="Đang tải dữ liệu bệnh án..." />
                </div>
            ) : (
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={tabItems}
                    type="card"
                    className="medical-exam-tabs"
                />
            )}
        </Drawer>
    );
};

export default MedicalExamDetail;
