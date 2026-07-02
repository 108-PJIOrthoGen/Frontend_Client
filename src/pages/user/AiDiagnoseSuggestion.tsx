import React, { useState, useEffect } from 'react';
import { Steps, Breadcrumb, Button, Popconfirm, Tag, message } from 'antd';
import { HomeOutlined, UserOutlined, LogoutOutlined, SwapOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import { S5AssessmentPji } from '@/components/user/diagnose_steps/AssessmentPji';
import DataCompletenessStep from '@/components/user/diagnose_steps/DataCompletenessStep';
import { TreatmentPlan } from '../../components/user/diagnose_steps/TreatmentPlan';
import DoctorDiagnosisStep from '@/components/user/diagnose_steps/DoctorDiagnosisStep';
import { Step1PatientSelection } from '@/components/user/diagnose_steps/PatientSelection';
import { useAppDispatch, useAppSelector } from '@/redux/hook';
import { clearCurrentCase, setCurrentCase } from '@/redux/slice/patientSlice';
import { callFetchEpisodeById } from '@/apis/api';

// Index in `steps` array — kept here so notification click navigation lands on
// the right tab without depending on string matching.
const STEP_TREATMENT_PLAN = 2;

const AiDiagnosisSuggestion = () => {
    const dispatch = useAppDispatch();
    const location = useLocation();
    const currentCase = useAppSelector(state => state.patient.currentCase);
    const [currentStep, setCurrentStep] = useState(() => {
        // Notification deep-link wins: if the user arrived via `?runId=...`,
        // jump straight to the treatment-plan tab so the TreatmentPlan component
        // mounts and rehydrates from the URL. Otherwise fall back to whatever
        // step they were on last time.
        if (new URLSearchParams(window.location.search).get('runId')) {
            return STEP_TREATMENT_PLAN;
        }
        const saved = localStorage.getItem('pji_currentStep');
        return saved ? parseInt(saved, 10) : 0;
    });

    // If the user is already on this page and clicks another notification, the
    // component doesn't remount — we still need to react to the URL change.
    useEffect(() => {
        if (new URLSearchParams(location.search).get('runId')) {
            setCurrentStep(STEP_TREATMENT_PLAN);
        }
    }, [location.search]);

    // Notification deep-link also carries `episodeId`. If it points at a
    // different episode than the one currently loaded in Redux (or none is
    // loaded), fetch the episode so the sidebar's "Ca bệnh hiện tại" widget
    // reflects the patient the user is now looking at.
    useEffect(() => {
        const episodeIdParam = new URLSearchParams(location.search).get('episodeId');
        if (!episodeIdParam) return;
        const epId = Number(episodeIdParam);
        if (!Number.isFinite(epId)) return;
        if (currentCase?.episode?.id != null
            && Number(currentCase.episode.id) === epId) {
            // Already loaded — nothing to do.
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const res: any = await callFetchEpisodeById(String(epId));
                if (cancelled) return;
                const episode = res?.data?.data ?? res?.data;
                const patient = episode?.patient;
                if (episode && patient) {
                    dispatch(setCurrentCase({ patient, episode }));
                } else {
                    // Backend didn't include nested patient — sidebar widget
                    // stays as-is. Not fatal: the assessment tab still loads.
                    // eslint-disable-next-line no-console
                    console.warn(
                        'Notification deep-link: episode response missing nested patient',
                        episode,
                    );
                }
            } catch (err) {
                // eslint-disable-next-line no-console
                console.warn('Failed to load episode for notification deep-link', err);
            }
        })();
        return () => { cancelled = true; };
    }, [location.search, currentCase?.episode?.id, dispatch]);

    useEffect(() => {
        localStorage.setItem('pji_currentStep', currentStep.toString());
    }, [currentStep]);

    const next = () => setCurrentStep(prev => prev + 1);
    const prev = () => {
        if (currentStep <= 0) return;

        const previousStep = currentStep - 1;
        if (previousStep === 0) {
            dispatch(clearCurrentCase());
        }

        setCurrentStep(previousStep);
    };
    const backToFirstStep = () => {
        dispatch(clearCurrentCase());
        setCurrentStep(0);
    };

    // Exit the current episode: clear the selected case and return to the
    // patient-selection step. Lets doctors switch patients/cases at any point
    // without clicking "Quay lại" through every intermediate step.
    const handleExitCase = () => {
        dispatch(clearCurrentCase());
        setCurrentStep(0);
        message.success('Đã thoát ca bệnh. Bạn có thể chọn bệnh nhân khác.');
    };

    // "Đổi bệnh nhân": clear the case, return to step 1, and pop the search
    // modal straight away so the doctor can look up another patient without
    // first clicking the "Tra cứu hồ sơ nhanh" card.
    const [autoOpenSearch, setAutoOpenSearch] = useState(false);
    const handleChangePatient = () => {
        dispatch(clearCurrentCase());
        setCurrentStep(0);
        setAutoOpenSearch(true);
    };

    // Allow clicking the Steps header to jump backwards to an already-visited
    // step. Forward jumps stay gated behind each step's own "Tiếp tục" button
    // so we never land on a step whose data hasn't been produced yet.
    const handleStepClick = (target: number) => {
        if (target === currentStep) return;
        if (target === 0) {
            // Returning to step 1 means abandoning the current case selection.
            backToFirstStep();
            return;
        }
        if (target < currentStep) {
            setCurrentStep(target);
        }
    };

    const steps = [
        {
            title: 'Chọn bệnh nhân & bệnh án',
            content: (
                <Step1PatientSelection
                    onNext={next}
                    autoOpenSearch={autoOpenSearch}
                    onAutoSearchConsumed={() => setAutoOpenSearch(false)}
                />
            ),
        },
        {
            title: 'Đánh giá nguy cơ PJI',
            content: <S5AssessmentPji onNext={next} onPrev={prev} />,
        },
        {
            title: 'Gợi ý phác đồ',
            content: <TreatmentPlan onPrev={prev} onNext={next} />,
        },
        {
            title: 'Kiểm tra dữ liệu',
            content: <DataCompletenessStep onNext={next} onPrev={prev} />,
        },
        {
            title: 'Chẩn đoán bác sĩ',
            content: <DoctorDiagnosisStep onPrev={prev} onBackToFirstStep={backToFirstStep} />,
        },
    ];

    // Future steps are disabled so the clickable affordance matches the
    // backward-only navigation in handleStepClick.
    const items = steps.map((item, index) => ({
        key: item.title,
        title: item.title,
        disabled: index > currentStep,
    }));

    return (
        <div className="flex flex-col h-full bg-slate-50 relative w-full overflow-hidden">
            {/* Header Breadcrumb / Steps */}
            <div className="bg-white px-8 py-5 border-b border-slate-200 shadow-sm z-10">
                <div className="mb-2 flex items-start justify-between gap-4">
                    <Breadcrumb
                        items={[
                            {
                                href: "/",
                                title: <HomeOutlined style={{ fontSize: "15px", color: "#1890ff" }} />,
                            },
                            {
                                title: "Chẩn đoán & đề xuất điều trị"
                            }, {
                                title: <span className="text-primary">Bước {currentStep + 1}</span>
                            }
                        ]}
                    />

                    {/* Current case widget + exit control — only shown once a
                        patient/episode is selected (i.e. past step 1). */}
                    {currentCase?.patient && currentStep > 0 && (
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
                                <UserOutlined className="text-blue-500" />
                                <span className="text-sm font-semibold text-blue-900">
                                    {currentCase.patient.fullName || 'Bệnh nhân'}
                                </span>
                                {currentCase.patient.patientCode && (
                                    <Tag color="blue" className="m-0">{currentCase.patient.patientCode}</Tag>
                                )}
                                {currentCase.episode?.id != null && (
                                    <span className="text-xs text-blue-700/80">
                                        · Bệnh án #{currentCase.episode.id}
                                    </span>
                                )}
                            </div>
                            <Button
                                icon={<SwapOutlined />}
                                onClick={handleChangePatient}
                            >
                                Đổi bệnh nhân
                            </Button>
                            <Popconfirm
                                title="Thoát ca bệnh?"
                                description="Bạn sẽ quay lại bước chọn bệnh nhân. Tiến trình chưa lưu có thể mất."
                                okText="Thoát"
                                cancelText="Ở lại"
                                onConfirm={handleExitCase}
                            >
                                <Button danger icon={<LogoutOutlined />}>
                                    Thoát
                                </Button>
                            </Popconfirm>
                        </div>
                    )}
                </div>
                <Steps
                    current={currentStep}
                    items={items}
                    onChange={handleStepClick}
                    className="mt-4 custom-steps"
                    size="small"
                />
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto relative w-full">
                {steps[currentStep].content}
            </div>
        </div>
    );
};

export default AiDiagnosisSuggestion;
