import { Steps, Breadcrumb, Button, Popconfirm, Tag } from 'antd';
import {
    HomeOutlined,
    UserOutlined,
    LogoutOutlined,
    SwapOutlined,
} from '@ant-design/icons';
import { S5AssessmentPji } from '@/components/user/diagnose_steps/assessment_pji/AssessmentPji';
import DataCompletenessStep from '@/components/user/diagnose_steps/check_completeness/DataCompletenessStep';
import DoctorDiagnosisStep from '@/components/user/diagnose_steps/doctor_diagnosis/DoctorDiagnosisStep';
import { useDiagnosisWorkflow } from './hooks/useDiagnosisWorkflow';
import { Step1PatientSelection } from '@/components/user/diagnose_steps/select_object/PatientSelection';
import { TreatmentPlan } from '@/components/user/diagnose_steps/treatment_plan/TreatmentPlan';

const AiDiagnosisSuggestion = () => {
    const {
        autoOpenSearch,
        backToFirstStep,
        changePatient,
        consumeAutoOpenSearch,
        currentCase,
        currentStep,
        exitCurrentCase,
        next,
        prev,
        selectStep,
    } = useDiagnosisWorkflow();

    const steps = [
        {
            title: 'Chọn hồ sơ',
            content: (
                <div className="min-h-full bg-white">
                    <Step1PatientSelection
                        onNext={next}
                        autoOpenSearch={autoOpenSearch}
                        onAutoSearchConsumed={consumeAutoOpenSearch}
                    />
                </div>
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
            title: 'Bổ sung dữ liệu',
            content: <DataCompletenessStep onNext={next} onPrev={prev} />,
        },
        {
            title: 'Quyết định bác sĩ',
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
            <div data-tour="diagnosis-header" className="bg-white px-8 py-5 border-b border-slate-200 shadow-sm z-10">
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
                                onClick={changePatient}
                            >
                                Đổi bệnh nhân
                            </Button>
                            <Popconfirm
                                title="Thoát ca bệnh?"
                                description="Bạn sẽ quay lại bước chọn bệnh nhân. Tiến trình chưa lưu có thể mất."
                                okText="Thoát"
                                cancelText="Ở lại"
                                onConfirm={exitCurrentCase}
                            >
                                <Button danger icon={<LogoutOutlined />}>
                                    Thoát
                                </Button>
                            </Popconfirm>
                        </div>
                    )}
                </div>
                <div data-tour="diagnosis-steps">
                    <Steps
                        current={currentStep}
                        items={items}
                        onChange={selectStep}
                        className="mt-4 custom-steps"
                        size="small"
                    />
                </div>
            </div>

            {/* Content Area */}
            <div data-tour="diagnosis-content" className="flex-1 overflow-y-auto relative w-full">
                {steps[currentStep].content}
            </div>
        </div>
    );
};

export default AiDiagnosisSuggestion;
