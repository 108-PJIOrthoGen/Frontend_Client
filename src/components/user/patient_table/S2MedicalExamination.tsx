import React, { useEffect } from 'react';
import { IEpisode } from '@/types/backend';
import { Form, DatePicker, Input, Select, InputNumber } from 'antd';
import locale from 'antd/es/date-picker/locale/en_US';
import dayjs, { Dayjs } from 'dayjs';

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
// Helper to  parse dates from API
const parseDateFromApi = (dateValue: any): string => {
    if (!dateValue) return '';

    const dateStr = String(dateValue).trim();
    // If it matches ISO format (YYYY-MM-DD), convert to DD/MM/YYYY
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        const parsed = dayjs(dateStr, 'YYYY-MM-DD');
        if (parsed.isValid()) {
            return parsed.format('DD/MM/YYYY');
        }
    }

    // If it's already in DD/MM/YYYY format, check if valid
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const parsed = dayjs(dateStr, 'DD/MM/YYYY');
        if (parsed.isValid()) {
            return dateStr;
        }
    }

    // Try to parse as ISO format first
    let date = dayjs(dateStr, 'YYYY-MM-DD');
    if (date.isValid()) {
        return date.format('DD/MM/YYYY');
    }

    // Try DD/MM/YYYY format
    date = dayjs(dateStr, 'DD/MM/YYYY');
    if (date.isValid()) {
        return dateStr;
    }

    // If nothing works, return empty
    return '';
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

interface MedicalExaminationProps {
    onNext?: () => void;
    onPrev?: () => void;
    mode?: 'wizard' | 'standalone';
    episodeData?: IEpisode | null;
    onFormChange?: (data: EpisodeFormData) => void;
}

// Convert string date DD/MM/YYYY to Dayjs for DatePicker
const stringToDayjs = (dateStr: string): Dayjs | null => {
    if (!dateStr) return null;
    const parsed = dayjs(dateStr, 'DD/MM/YYYY');
    return parsed.isValid() ? parsed : null;
};

export const MedicalExamination: React.FC<MedicalExaminationProps> = ({
    onNext,
    onPrev,
    mode = 'wizard',
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

    const requiredRule = { required: true, message: 'Truong nay la bat buoc' };

    return (
        <>
            <div className="flex-1 overflow-y-auto p-8 pb-32">
                <div className="max-w-5xl mx-auto space-y-6">
                    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quan ly benh an</h1>
                                <p className="text-slate-500 text-sm mt-1">Thong tin tiep nhan, kham benh va dieu tri.</p>
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
                                    label={<span className="text-sm font-medium text-slate-700">Thoi gian vao vien <span className="text-red-500">*</span></span>}
                                    rules={[requiredRule]}
                                    getValueFromEvent={() => form.getFieldValue('arrivalTime')}
                                >
                                    <DatePicker
                                        locale={locale}
                                        format="DD/MM/YYYY"
                                        value={stringToDayjs(form.getFieldValue('arrivalTime'))}
                                        onChange={handleDateChange('arrivalTime')}
                                        placeholder="ngay/thang/nam"
                                        className="w-full h-11"
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="dischargeTime"
                                    label={<span className="text-sm font-medium text-slate-700">Thoi gian ra vien <span className="text-red-500">*</span></span>}
                                    rules={[requiredRule]}
                                    getValueFromEvent={() => form.getFieldValue('dischargeTime')}
                                >
                                    <DatePicker
                                        locale={locale}
                                        format="DD/MM/YYYY"
                                        value={stringToDayjs(form.getFieldValue('dischargeTime'))}
                                        onChange={handleDateChange('dischargeTime')}
                                        placeholder="ngay/thang/nam"
                                        className="w-full h-11"
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="reason"
                                    label={<span className="text-sm font-medium text-slate-700">Ly do vao vien</span>}
                                    className="col-span-2"
                                >
                                    <Input
                                        placeholder="VD: Bi dau va han che..."
                                        className="h-11 rounded-lg"
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="department"
                                    label={<span className="text-sm font-medium text-slate-700">Khoa tiep nhan <span className="text-red-500">*</span></span>}
                                    rules={[requiredRule]}
                                >
                                    <Input
                                        placeholder="VD: Khoa Chinh hinh"
                                        className="h-11 rounded-lg"
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="admissionMethod"
                                    label={<span className="text-sm font-medium text-slate-700">Truc tiep vao <span className="text-red-500">*</span></span>}
                                    rules={[requiredRule]}
                                >
                                    <Select
                                        placeholder="-- Vao theo hinh thuc --"
                                        className="h-11 rounded-lg"
                                        options={[
                                            { value: 'CC', label: 'Cap cuu' },
                                            { value: 'KKB', label: 'Kham benh' },
                                            { value: 'KDT', label: 'Kham theo yeu cau' },
                                        ]}
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="referralSource"
                                    label={<span className="text-sm font-medium text-slate-700">Noi gioi thieu</span>}
                                >
                                    <Input
                                        placeholder="VD: Benh vien tuyen duoi"
                                        className="h-11 rounded-lg"
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="treatmentDays"
                                    label={<span className="text-sm font-medium text-slate-700">Tong so ngay dieu tri</span>}
                                    rules={[
                                        {
                                            pattern: /^\d*$/,
                                            message: 'Vui long nhap so',
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
                                    label={<span className="text-sm font-medium text-slate-700">Ket qua dieu tri <span className="text-red-500">*</span></span>}
                                    rules={[requiredRule]}
                                >
                                    <Input
                                        placeholder="VD: Done"
                                        className="h-11 rounded-lg"
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="status"
                                    label={<span className="text-sm font-medium text-slate-700">Trang thai ho so <span className="text-red-500">*</span></span>}
                                    rules={[requiredRule]}
                                >
                                    <Select
                                        placeholder="-- Trang thai ho so --"
                                        className="h-11 rounded-lg"
                                        options={[
                                            { value: 'normal', label: 'Dang dieu tri' },
                                            { value: 'bad', label: 'Hoan thanh' },
                                            { value: 'worse', label: 'Da huy' },
                                        ]}
                                    />
                                </Form.Item>
                            </div>
                        </Form>
                    </section>
                </div>
            </div>

            {/* Fixed Footer with buttons */}
            {mode === 'wizard' && (
                <div className="absolute bottom-0 w-full bg-white border-t border-slate-200 p-4 px-8 flex items-center justify-between z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <button
                        onClick={onPrev}
                        className="px-6 py-3 font-medium text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-2 border border-slate-200 rounded-lg bg-red-100 hover:bg-red-200"
                    >
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span> Quay lai
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={onNext}
                            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                        >
                            Tiep tuc <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default MedicalExamination;
