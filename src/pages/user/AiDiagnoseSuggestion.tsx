import React, { useState, useEffect } from 'react';
import { Steps, Button, Breadcrumb } from 'antd';
import { Step1PatientSelection } from '../../components/user/diagnose_steps/S1PatientSelection';
import { PatientIntake } from '../../components/user/diagnose_steps/S1PatientIntake';
import { MedicalHistoryPage } from '../../components/user/diagnose_steps/MedicalHistory';
import { ClinicalAssessmentPage } from '../../components/user/diagnose_steps/ClinicalAssessment';
import { Step4Antibiogram } from '../../components/user/diagnose_steps/Step4Antibiogram';
import { Step5TreatmentPlan } from '../../components/user/diagnose_steps/S5TreatmentPlan';
import { HomeOutlined } from '@ant-design/icons';
import MedicalExamination from '@/components/user/diagnose_steps/MedicalExamination';

const AiDiagnosisSuggestion = () => {
    const [currentStep, setCurrentStep] = useState(() => {
        const saved = localStorage.getItem('pji_currentStep');
        return saved ? parseInt(saved, 10) : 0;
    });
    const [isCreatingNewPatient, setIsCreatingNewPatient] = useState(() => {
        const saved = localStorage.getItem('pji_isCreatingNewPatient');
        return saved ? JSON.parse(saved) : false;
    });

    useEffect(() => {
        localStorage.setItem('pji_currentStep', currentStep.toString());
    }, [currentStep]);

    useEffect(() => {
        localStorage.setItem('pji_isCreatingNewPatient', JSON.stringify(isCreatingNewPatient));
    }, [isCreatingNewPatient]);

    const next = () => setCurrentStep(prev => prev + 1);
    const prev = () => setCurrentStep(prev => prev - 1);

    const steps = [
        {
            title: 'Tạo hồ sơ bệnh án',
            content: isCreatingNewPatient ? (
                <div className="h-full flex flex-col relative w-full">
                    <PatientIntake
                        onNext={() => { setIsCreatingNewPatient(false); next(); }}
                        onCancel={() => setIsCreatingNewPatient(false)}
                    />
                </div>
            ) : (
                <Step1PatientSelection
                    onNext={next}
                    onCreateNew={() => setIsCreatingNewPatient(true)}
                />
            ),
        },
        {
            title: 'Quản lý người bệnh',
            content: <MedicalExamination onNext={next} onPrev={prev} />,
        },
        {
            title: 'Nhập dữ liệu bệnh án',
            content: <MedicalHistoryPage onNext={next} onPrev={prev} />,
        },
        {
            title: 'Lâm sàng & cận lâm sàng',
            content: <ClinicalAssessmentPage onNext={next} onPrev={prev} />,
        },
        {
            title: 'Bảng kháng sinh đồ',
            content: <Step4Antibiogram onNext={next} onPrev={prev} />,
        },
        {
            title: 'Gợi ý phác đồ',
            content: <Step5TreatmentPlan onPrev={prev} />,
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