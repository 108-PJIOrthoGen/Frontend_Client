import React, { useEffect } from 'react';
import { IEpisode } from '@/types/backend';
import { Form, DatePicker, Input, Select, InputNumber } from 'antd';
import locale from 'antd/es/date-picker/locale/en_US';
import dayjs, { Dayjs } from 'dayjs';
import { parseDateFromApi, stringToDayjs } from '@/config/utils';

export interface EpisodeFormData {
    arrivalTime: string;
    dischargeTime: string;
    department: string;
    admissionMethod: string;
    reason: string;
    referralSource: string;
    treatmentDays: string;
    treatmentResult: string;
    status: string;
}

interface MedicalExaminationProps {
    mode?: 'wizard' | 'standalone';
    episodeData?: IEpisode | null;
    onFormChange?: (data: EpisodeFormData) => void;
}

const emptyFormData: EpisodeFormData = {
    arrivalTime: '',
    dischargeTime: '',
    department: '',
    admissionMethod: '',
    reason: '',
    referralSource: '',
    treatmentDays: '',
    treatmentResult: '',
    status: '',
};


export function episodeToFormData(ep: IEpisode): EpisodeFormData {
    return {
        arrivalTime: parseDateFromApi(ep.admissionDate),
        dischargeTime: parseDateFromApi(ep.dischargeDate),
        department: ep.department ?? '',
        admissionMethod: ep.direct ?? '',
        reason: ep.reason ?? '',
        referralSource: ep.referralSource ?? '',
        treatmentDays: ep.treatmentDays != null ? String(ep.treatmentDays) : '',
        treatmentResult: ep.result ?? '',
        status: ep.status ?? '',
    };
}

export function formDataToEpisodeRequest(form: EpisodeFormData) {
    return {
        admissionDate: form.arrivalTime || undefined,
        dischargeDate: form.dischargeTime || undefined,
        department: form.department || undefined,
        direct: form.admissionMethod || undefined,
        reason: form.reason || undefined,
        referralSource: form.referralSource || undefined,
        treatmentDays: form.treatmentDays ? Number(form.treatmentDays) : undefined,
        result: form.treatmentResult || undefined,
        status: form.status || undefined,
    };
}


export const MedicalExamination: React.FC<MedicalExaminationProps> = ({
    episodeData,
    onFormChange,
}) => {
    const [form] = Form.useForm<EpisodeFormData>();

    // Initialize form with episode data
    useEffect(() => {
        const data = episodeData ? episodeToFormData(episodeData) : emptyFormData;
        form.setFieldsValue(data);
    }, [episodeData, form]);

    // Handle form value changes and notify parent
    const handleValuesChange = (_changedValues: Partial<EpisodeFormData>, allValues: EpisodeFormData) => {
        onFormChange?.(allValues);
    };

    // Handle DatePicker changes (convert Dayjs to string)
    const handleDateChange = (field: keyof EpisodeFormData) => (_date: Dayjs | null, dateString: string | string[]) => {
        const value = Array.isArray(dateString) ? dateString[0] : dateString;
        form.setFieldValue(field, value);
        const allValues = form.getFieldsValue();
        onFormChange?.(allValues);
    };

    const requiredRule = { required: true, message: 'Trường này bắt buộc điền' };

    return (
        <>
            <div className="flex-1 overflow-y-auto p-8 pb-32">
                <div className="max-w-5xl mx-auto space-y-6">
                    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quản lý bệnh án</h1>
                                <p className="text-slate-500 text-sm mt-1">Thông tin tiếp nhận, khám bệnh và điều trị.</p>
                            </div>
                        </div>

                        <Form
                            form={form}
                            layout="vertical"
                            onValuesChange={handleValuesChange}
                            className="p-6"
                            initialValues={emptyFormData}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Form.Item
                                    name="arrivalTime"
                                    label={<span className="text-sm font-medium text-slate-700">Thời gian vào viện <span className="text-red-500">*</span></span>}
                                    rules={[requiredRule]}
                                    getValueFromEvent={() => form.getFieldValue('arrivalTime')}
                                    getValueProps={(val) => ({ value: stringToDayjs(val) })}
                                >
                                    <DatePicker
                                        locale={locale}
                                        format="DD/MM/YYYY"
                                        onChange={handleDateChange('arrivalTime')}
                                        placeholder="ngay/thang/nam"
                                        className="w-full h-11"
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="dischargeTime"
                                    label={<span className="text-sm font-medium text-slate-700">Thời gian ra viện <span className="text-red-500">*</span></span>}
                                    rules={[requiredRule]}
                                    getValueFromEvent={() => form.getFieldValue('dischargeTime')}
                                    getValueProps={(val) => ({ value: stringToDayjs(val) })}
                                >
                                    <DatePicker
                                        locale={locale}
                                        format="DD/MM/YYYY"
                                        onChange={handleDateChange('dischargeTime')}
                                        placeholder="dd/mm/yyyy"
                                        className="w-full h-11"
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="reason"
                                    label={<span className="text-sm font-medium text-slate-700">Lý do vào viện</span>}
                                    className="col-span-2"
                                >
                                    <Input
                                        placeholder="VD: Bi dau va han che..."
                                        className="h-11 rounded-lg"
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="department"
                                    label={<span className="text-sm font-medium text-slate-700">Khoa tiếp nhận <span className="text-red-500">*</span></span>}
                                    rules={[requiredRule]}
                                >
                                    <Input
                                        placeholder="VD: Khoa chỉnh hình"
                                        className="h-11 rounded-lg"
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="admissionMethod"
                                    label={<span className="text-sm font-medium text-slate-700">Trực tiếp vào <span className="text-red-500">*</span></span>}
                                    rules={[requiredRule]}
                                >
                                    <Select
                                        placeholder="-- Vào theo hình thức --"
                                        className="h-11 rounded-lg"
                                        options={[
                                            { value: 'CC', label: 'Cấp cứu' },
                                            { value: 'KKB', label: 'Khám bệnh' },
                                            { value: 'KDT', label: 'Khám theo yêu cầu' },
                                        ]}
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="referralSource"
                                    label={<span className="text-sm font-medium text-slate-700">Nơi giới thiệu</span>}
                                >
                                    <Input
                                        placeholder="VD: BV tuyến dưới"
                                        className="h-11 rounded-lg"
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="treatmentDays"
                                    label={<span className="text-sm font-medium text-slate-700">Tổng số ngày điều trị</span>}
                                    rules={[
                                        {
                                            pattern: /^\d*$/,
                                            message: 'Chỉ nhập số',
                                        },
                                    ]}
                                >
                                    <InputNumber
                                        placeholder="VD: 12"
                                        className="w-full h-11 rounded-lg"
                                        min={0}
                                        controls={false}
                                        stringMode
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="treatmentResult"
                                    label={<span className="text-sm font-medium text-slate-700">Kết quả điều trị <span className="text-red-500">*</span></span>}
                                    rules={[requiredRule]}
                                >
                                    <Input
                                        placeholder="VD: Done"
                                        className="h-11 rounded-lg"
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="status"
                                    label={<span className="text-sm font-medium text-slate-700">Trạng thái hồ sơ <span className="text-red-500">*</span></span>}
                                    rules={[requiredRule]}
                                >
                                    <Select
                                        placeholder="-- Trạng thái hồ sơ --"
                                        className="h-11 rounded-lg"
                                        options={[
                                            { value: 'Đang điều trị', label: 'Đang điều trị' },
                                            { value: 'Hoàn thành điều trị', label: 'Hoàn thành' },
                                            { value: 'Hồ sơ bị hoãn', label: 'Đã hủy' },
                                        ]}
                                    />
                                </Form.Item>
                            </div>
                        </Form>
                    </section>
                </div>
            </div>

        </>
    );
};

export default MedicalExamination;
