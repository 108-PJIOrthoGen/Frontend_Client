import React, { useState, useEffect } from 'react';
import { Steps, Breadcrumb } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { S5AssessmentPji } from '@/components/user/diagnose_steps/AssessmentPji';
import DataCompletenessStep from '@/components/user/diagnose_steps/DataCompletenessStep';
import { TreatmentPlan } from '../../components/user/diagnose_steps/TreatmentPlan';
import { Step1PatientSelection } from '@/components/user/diagnose_steps/PatientSelection';
import { useAppDispatch } from '@/redux/hook';
import { clearCurrentCase } from '@/redux/slice/patientSlice';

const AiDiagnosisSuggestion = () => {
    const dispatch = useAppDispatch();
    const [currentStep, setCurrentStep] = useState(() => {
        const saved = localStorage.getItem('pji_currentStep');
        return saved ? parseInt(saved, 10) : 0;
    });

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
