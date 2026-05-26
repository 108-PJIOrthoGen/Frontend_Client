import React, { useState, useEffect } from 'react';
import { Steps, Breadcrumb } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import { S5AssessmentPji } from '@/components/user/diagnose_steps/AssessmentPji';
import DataCompletenessStep from '@/components/user/diagnose_steps/DataCompletenessStep';
import { TreatmentPlan } from '../../components/user/diagnose_steps/TreatmentPlan';
import { Step1PatientSelection } from '@/components/user/diagnose_steps/PatientSelection';
import { useAppDispatch, useAppSelector } from '@/redux/hook';
import { clearCurrentCase, setCurrentCase } from '@/redux/slice/patientSlice';
import { callFetchEpisodeById } from '@/apis/api';

// Index in `steps` array — kept here so notification click navigation lands on
// the right tab without depending on string matching.
const STEP_ASSESSMENT = 1;

const AiDiagnosisSuggestion = () => {
    const dispatch = useAppDispatch();
    const location = useLocation();
    const currentCase = useAppSelector(state => state.patient.currentCase);
    const [currentStep, setCurrentStep] = useState(() => {
        // Notification deep-link wins: if the user arrived via `?runId=...`,
        // jump straight to the assessment tab so the AssessmentPji component
        // mounts and rehydrates from the URL. Otherwise fall back to whatever
        // step they were on last time.
        if (new URLSearchParams(window.location.search).get('runId')) {
            return STEP_ASSESSMENT;
        }
        const saved = localStorage.getItem('pji_currentStep');
        return saved ? parseInt(saved, 10) : 0;
    });

    // If the user is already on this page and clicks another notification, the
    // component doesn't remount — we still need to react to the URL change.
    useEffect(() => {
        if (new URLSearchParams(location.search).get('runId')) {
            setCurrentStep(STEP_ASSESSMENT);
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

    const steps = [
        {
            title: 'Chọn bệnh nhân & bệnh án',
            content: <Step1PatientSelection onNext={next} />,
        },
        {
            title: 'Đánh giá nguy cơ PJI',
            content: <S5AssessmentPji onNext={next} onPrev={prev} />,
        },
        {
            title: 'Kiểm tra dữ liệu',
            content: <DataCompletenessStep onNext={next} onPrev={prev} />,
        },
        {
            title: 'Gợi ý phác đồ',
            content: <TreatmentPlan onPrev={prev} onBackToFirstStep={backToFirstStep} />,
        },
    ];

    const items = steps.map((item) => ({ key: item.title, title: item.title }));

    return (
        <div className="flex flex-col h-full bg-slate-50 relative w-full overflow-hidden">
            {/* Header Breadcrumb / Steps */}
            <div className="bg-white px-8 py-5 border-b border-slate-200 shadow-sm z-10">
                <div className="mb-2 text-slate-900 font-medium">
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
                        style={{ marginBottom: "10px" }}
                    />
                </div>
                <Steps
                    current={currentStep}
                    items={items}
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
