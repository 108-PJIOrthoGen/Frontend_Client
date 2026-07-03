import React, { useState, useEffect } from 'react';
import { Button, Modal } from 'antd';
import { SearchOutlined, UserAddOutlined } from '@ant-design/icons';
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

export const Step1PatientSelection: React.FC<Step1Props> = ({ onNext, autoOpenSearch, onAutoSearchConsumed }) => {

    const navigate = useNavigate();
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
                        Tra cứu hồ sơ nhanh
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
        </div>
    );
};
