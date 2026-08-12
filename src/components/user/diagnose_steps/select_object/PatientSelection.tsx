import React, { useState, useEffect, useRef } from 'react';
import { Button, Modal, Popover, Tour } from 'antd';
import type { TourProps } from 'antd';
import { CompassOutlined, SearchOutlined, UserAddOutlined } from '@ant-design/icons';
import { PatientExamSelector } from './PatientExamSelector';
import { IPatient } from '@/types/backend';
import { useNavigate } from 'react-router-dom';

interface Step1Props {
    onNext: () => void
    // When true, open the search modal immediately on mount. Lets "Đổi bệnh nhân"
    // jump straight into patient search instead of showing the landing cards.
    autoOpenSearch?: boolean
    onAutoSearchConsumed?: () => void
}

const DIAGNOSIS_TOUR_STORAGE_KEY = 'pji_diagnosis_tour_completed';

export const Step1PatientSelection: React.FC<Step1Props> = ({ onNext, autoOpenSearch, onAutoSearchConsumed }) => {

    const navigate = useNavigate();
    const [tourOpen, setTourOpen] = useState(false);
    const [discoveryOpen, setDiscoveryOpen] = useState(false);
    const tourButtonRef = useRef<HTMLButtonElement>(null);
    const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [patients, setPatients] = useState<IPatient[]>([]);

    const handleSearchClick = () => {
        setIsSearchModalVisible(true);
    };

    // Consume the auto-open request once, then clear the flag in the parent so
    // returning to step 1 normally doesn't re-pop the modal.
    useEffect(() => {
        if (autoOpenSearch) {
            setIsSearchModalVisible(true);
            onAutoSearchConsumed?.();
        }
    }, [autoOpenSearch, onAutoSearchConsumed]);

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
            target: () => document.querySelector<HTMLElement>('[data-tour="diagnosis-header"]')!,
        },
        {
            title: 'Quy trình chẩn đoán',
            description: 'Năm bước thể hiện toàn bộ tiến trình. Bạn có thể quay lại những bước đã hoàn thành.',
            target: () => document.querySelector<HTMLElement>('[data-tour="diagnosis-steps"]')!,
        },
        {
            title: 'Không gian làm việc',
            description: 'Nội dung và thao tác cần thực hiện ở mỗi bước sẽ hiển thị tại đây.',
            target: () => document.querySelector<HTMLElement>('[data-tour="diagnosis-content"]')!,
        },
    ];


    const onClose = () => {
        setIsSearchModalVisible(false)
        setSearchValue('')
        setPatients([])
    }

    return (
        <div className="flex-1 bg-white p-8 h-full items-center">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8 justify-center items-stretch mt-12">

                {/* Block 1: Search Existing */}
                <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
                        <SearchOutlined className="text-3xl" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-3">Hồ sơ bệnh nhân đã được lưu trong lần thăm khám trước?</h3>
                    <p className="text-slate-500 text-sm mb-8 flex-1">Tra cứu nhanh hồ sơ bệnh án qua CCCD, SĐT hoặc Mã bệnh nhân (MRN).</p>
                    <Button type="primary" size="large" className="w-full h-12 bg-blue-500" onClick={handleSearchClick}>
                        Tra cứu hồ sơ
                    </Button>
                </div>

                {/* Block 2: Create New */}
                <div className="flex-1 bg-green-50/50 border border-green-200 rounded-2xl shadow-sm hover:shadow-md hover:border-green-400 transition-all p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                        <UserAddOutlined className="text-3xl" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-3">Tạo hồ sơ mới cho bệnh nhân</h3>
                    <p className="text-slate-500 text-sm mb-8 flex-1">Bệnh nhân lần đầu thăm khám hoặc chưa có thông tin trên hệ thống PJI.</p>
                    <Button type="primary" size="large" onClick={() => navigate("/table-patients")} className="w-full h-12 bg-green-500 hover:!bg-green-600 border-none">
                        Đi tới tạo hồ sơ
                    </Button>
                </div>
            </div>

            {/* Modal for Searching Patient */}
            <Modal
                width="min(1180px, calc(100vw - 32px))"
                centered
                title="Tra cứu hồ sơ bệnh nhân"
                open={isSearchModalVisible}
                onCancel={onClose}
                footer={null}
            >
                <PatientExamSelector onNext={onNext} setSearchValue={setSearchValue} searchValue={searchValue} setPatients={setPatients} patients={patients} />
            </Modal>

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
                    className="group fixed top-40 left-80 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-blue-300 bg-gradient-to-br from-blue-500 to-indigo-300 text-xl text-white shadow-lg shadow-blue-500/30 transition-transform duration-300 hover:-translate-y-1 hover:scale-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
                >
                    <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-blue-400 opacity-20" aria-hidden="true" />
                    <CompassOutlined className="transition-transform duration-300 group-hover:rotate-12" />
                </button>
            </Popover>

            <Tour open={tourOpen} onClose={closeTour} steps={tourSteps} />
        </div>
    );
};
