import { useEffect, useRef, useState } from 'react';
import { Steps, Breadcrumb, Button, Popconfirm, Popover, Tag, Tour } from 'antd';
import type { TourProps } from 'antd';
import {
    CompassOutlined,
    HomeOutlined,
    UserOutlined,
    LogoutOutlined,
    SwapOutlined,
} from '@ant-design/icons';
import { S5AssessmentPji } from '@/components/user/diagnose_steps/assessment_pji/AssessmentPji';
import DataCompletenessStep from '@/components/user/diagnose_steps/check_completeness/DataCompletenessStep';
import { TreatmentPlan } from '../../components/user/diagnose_steps/TreatmentPlan';
import DoctorDiagnosisStep from '@/components/user/diagnose_steps/DoctorDiagnosisStep';
import { Step1PatientSelection } from '@/components/user/diagnose_steps/PatientSelection';
import { useDiagnosisWorkflow } from './hooks/useDiagnosisWorkflow';

const DIAGNOSIS_TOUR_STORAGE_KEY = 'pji_diagnosis_tour_completed';

const AiDiagnosisSuggestion = () => {
    const [tourOpen, setTourOpen] = useState(false);
    const [discoveryOpen, setDiscoveryOpen] = useState(false);
    const tourButtonRef = useRef<HTMLButtonElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const stepsRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
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

    useEffect(() => {
        if (window.localStorage.getItem(DIAGNOSIS_TOUR_STORAGE_KEY)) return;

        let hideTimer: number | undefined;
        const showDiscoveryHint = () => {
            setDiscoveryOpen(true);
            hideTimer = window.setTimeout(() => setDiscoveryOpen(false), 8000);
        };
        const initialTimer = window.setTimeout(showDiscoveryHint, 1800);
        const repeatTimer = window.setInterval(showDiscoveryHint, 60000);

        return () => {
            window.clearTimeout(initialTimer);
            window.clearInterval(repeatTimer);
            if (hideTimer) window.clearTimeout(hideTimer);
        };
    }, []);

    const startTour = () => {
        setDiscoveryOpen(false);
        setTourOpen(true);
    };

    const closeTour = () => {
        setTourOpen(false);
        window.localStorage.setItem(DIAGNOSIS_TOUR_STORAGE_KEY, 'true');
    };

    const steps = [
        {
            title: 'Chọn hồ sơ',
            content: (
                <Step1PatientSelection
                    onNext={next}
                    autoOpenSearch={autoOpenSearch}
                    onAutoSearchConsumed={consumeAutoOpenSearch}
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
            title: 'Bổ sung dữ liệu',
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

    const tourSteps: TourProps['steps'] = [
        {
            title: 'Hướng dẫn nhanh',
            description: 'Bạn luôn có thể mở lại phần hướng dẫn từ nút này.',
            target: () => tourButtonRef.current!,
        },
        {
            title: 'Ca bệnh hiện tại',
            description: 'Khu vực này cho biết hồ sơ bạn đang làm việc. Khi chưa chọn ca bệnh, hệ thống sẽ nhắc bạn bắt đầu từ bước tra cứu hoặc tạo mới.',
            target: () => document.querySelector<HTMLElement>('[data-tour="sidebar-current-case"]')!,
        },
        {
            title: 'Các nhóm chức năng',
            description: 'Sidebar tập hợp quản lý bệnh án, quy trình chẩn đoán AI, thông báo và các xét nghiệm đang chờ bổ sung.',
            target: () => document.querySelector<HTMLElement>('[data-tour="sidebar-navigation"]')!,
        },
        {
            title: 'Tài khoản của bạn',
            description: 'Mở khu vực này để vào cài đặt tài khoản hoặc đăng xuất khỏi hệ thống.',
            target: () => document.querySelector<HTMLElement>('[data-tour="sidebar-account"]')!,
        },
        {
            title: 'Thông tin quy trình',
            description: 'Theo dõi vị trí hiện tại, bệnh nhân đang chọn và các thao tác đổi hoặc thoát ca bệnh.',
            target: () => headerRef.current!,
        },
        {
            title: 'Quy trình chẩn đoán',
            description: 'Năm bước thể hiện toàn bộ tiến trình. Bạn có thể quay lại những bước đã hoàn thành.',
            target: () => stepsRef.current!,
        },
        {
            title: 'Không gian làm việc',
            description: 'Nội dung và thao tác cần thực hiện ở mỗi bước sẽ hiển thị tại đây.',
            target: () => contentRef.current!,
        },
    ];

    return (
        <div className="flex flex-col h-full bg-slate-50 relative w-full overflow-hidden">
            {/* Header Breadcrumb / Steps */}
            <div ref={headerRef} className="bg-white px-8 py-5 border-b border-slate-200 shadow-sm z-10">
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
                <div ref={stepsRef}>
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
            <div ref={contentRef} className="flex-1 overflow-y-auto relative w-full">
                {steps[currentStep].content}
            </div>

            <Popover
                open={discoveryOpen && !tourOpen}
                onOpenChange={setDiscoveryOpen}
                trigger="hover"
                placement="left"
                content={(
                    <div className="flex items-center gap-1">
                        <span>Đây là lần đầu tới sử dụng?</span>
                        <Button type="link" className="h-auto p-0 font-semibold" onClick={startTour}>
                            Khám phá nhanh
                        </Button>
                    </div>
                )}
            >
                <button
                    ref={tourButtonRef}
                    type="button"
                    aria-label="Bắt đầu hướng dẫn sử dụng"
                    onClick={startTour}
                    className="group fixed top-20 right-46 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-blue-300 bg-gradient-to-br from-blue-500 to-indigo-300 text-xl text-white shadow-lg shadow-blue-500/30 transition-transform duration-300 hover:-translate-y-1 hover:scale-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
                >
                    <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-blue-400 opacity-20" aria-hidden="true" />
                    <CompassOutlined className="transition-transform duration-300 group-hover:rotate-12" />
                </button>
            </Popover>

            <Tour open={tourOpen} onClose={closeTour} steps={tourSteps} />
        </div>
    );
};

export default AiDiagnosisSuggestion;
