import React from 'react';
import { Drawer, Tabs, Button, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { MedicalExamination } from '../diagnose_steps/S2MedicalExamination';
import { MedicalHistoryPage } from '../diagnose_steps/MedicalHistory';
import { ClinicalAssessmentPage } from '../diagnose_steps/ClinicalAssessment';
import { Step4Antibiogram } from '../diagnose_steps/S4Antibiogram';
import { IMedicalExamFull } from '@/types/backend';

interface MedicalExamDetailProps {
    open: boolean;
    onClose: () => void;
    examData: IMedicalExamFull | null;
}

const MedicalExamDetail: React.FC<MedicalExamDetailProps> = ({ open, onClose, examData }) => {

    const handleSave = () => {
        // TODO: call API to save exam data
        message.success('Lưu bệnh án thành công!');
    };

    const tabItems = [
        {
            key: '1',
            label: 'Quản lý bệnh án',
            children: <MedicalExamination mode="standalone" />,
        },
        {
            key: '2',
            label: 'Tiền sử bệnh',
            children: <MedicalHistoryPage mode="standalone" />,
        },
        {
            key: '3',
            label: 'Lâm sàng & CLS',
            children: <ClinicalAssessmentPage mode="standalone" />,
        },
        {
            key: '4',
            label: 'Kháng sinh đồ',
            children: <Step4Antibiogram mode="standalone" />,
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
            footer={
                <div className="flex justify-end gap-3 py-2">
                    <Button onClick={onClose}>Đóng</Button>
                    <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
                        Lưu bệnh án
                    </Button>
                </div>
            }
        >
            <Tabs
                defaultActiveKey="1"
                items={tabItems}
                type="card"
                className="medical-exam-tabs"
            />
        </Drawer>
    );
};

export default MedicalExamDetail;
