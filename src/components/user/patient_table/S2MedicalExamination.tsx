import React, { useState, useEffect } from 'react';
import { IEpisode } from '@/types/backend';
import { DatePicker } from 'antd';
import locale from 'antd/es/date-picker/locale/en_US';
import dayjs, { Dayjs } from 'dayjs';

// Helper function to safely parse dates from API
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

export const MedicalExamination: React.FC<MedicalExaminationProps> = ({ onNext, onPrev, mode = 'wizard', episodeData, onFormChange }) => {
    const [formData, setFormData] = useState<EpisodeFormData>(
        episodeData ? episodeToFormData(episodeData) : emptyFormData
    );

    useEffect(() => {
        setFormData(episodeData ? episodeToFormData(episodeData) : emptyFormData);
    }, [episodeData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const next = { ...prev, [name]: value };
            onFormChange?.(next);
            return next;
        });
    };

    const handleDateChange = (name: keyof EpisodeFormData) => (_date: Dayjs | null, dateString: string | string[]) => {
        const value = Array.isArray(dateString) ? dateString[0] : dateString;
        setFormData(prev => {
            const next = { ...prev, [name]: value };
            onFormChange?.(next);
            return next;
        });
    };

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

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-medium text-slate-700">Thời gian vào viện <span className="text-red-500">*</span></span>

                                <DatePicker locale={locale} format={"DD/MM/YYYY"} value={formData.arrivalTime ? dayjs(formData.arrivalTime, 'DD/MM/YYYY') : null} onChange={handleDateChange('arrivalTime')} placeholder='ngày/tháng/năm' />
                            </label>

                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-medium text-slate-700">Thời gian ra viện <span className="text-red-500">*</span></span>

                                <DatePicker locale={locale} format={"DD/MM/YYYY"} value={formData.dischargeTime ? dayjs(formData.dischargeTime, 'DD/MM/YYYY') : null} onChange={handleDateChange('dischargeTime')} placeholder='ngày/tháng/năm' />
                            </label>
                            <label className="flex flex-col col-span-2">
                                <span className="text-sm font-medium text-slate-700">Lý do vào viện</span>
                                <input name="reason" value={formData.reason} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 h-11 px-3 focus:ring-primary focus:border-primary border" placeholder="VD: Bị đau và hạn chế..." type="text" />
                            </label>

                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-medium text-slate-700">Khoa tiếp nhận <span className="text-red-500">*</span></span>
                                <input name="department" value={formData.department} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 h-11 px-3 focus:ring-primary focus:border-primary border" placeholder="VD: Bị đau và hạn chế..." type="text" />

                            </label>

                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-medium text-slate-700">Trực tiếp vào <span className="text-red-500">*</span></span>
                                <select name="admissionMethod" value={formData.admissionMethod} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 h-11 px-3 focus:ring-primary focus:border-primary border bg-white">
                                    <option value="" disabled>-- Vào theo hình thức --</option>
                                    <option value="CC">Cấp cứu</option>
                                    <option value="KKB">Khám bệnh</option>
                                    <option value="KDT">Khám theo yêu cầu</option>
                                </select>
                            </label>

                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-medium text-slate-700">Nơi giới thiệu</span>
                                <input name="referralSource" value={formData.referralSource} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 h-11 px-3 focus:ring-primary focus:border-primary border" placeholder="VD: Bệnh viện tuyến dưới" type="text" />
                            </label>

                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-medium text-slate-700">Tổng số ngày điều trị</span>
                                <input name="treatmentDays" value={formData.treatmentDays} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 h-11 px-3 focus:ring-primary focus:border-primary border" placeholder="VD: 12" type="number" />
                            </label>

                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-medium text-slate-700">Kết quả điều trị <span className="text-red-500">*</span></span>

                                <input name="treatmentResult" value={formData.treatmentResult} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 h-11 px-3 focus:ring-primary focus:border-primary border" placeholder="VD: Done" type="text" />
                            </label>

                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-medium text-slate-700">Trạng thái hồ sơ <span className="text-red-500">*</span></span>
                                <select name="status" value={formData.status} onChange={handleInputChange} className="w-full rounded-lg border-slate-300 h-11 px-3 focus:ring-primary focus:border-primary border bg-white">
                                    <option value="" disabled>-- Trạng thái hồ sơ --</option>
                                    <option value="normal">Đang điều trị</option>
                                    <option value="bad">Hoàn thành</option>
                                    <option value="worse">Đã hủy</option>
                                </select>
                            </label>
                        </div>
                    </section>
                </div>
            </div>

            {/* Fixed Footer with buttons */}
            {mode === 'wizard' && (
                <div className="absolute bottom-0 w-full bg-white border-t border-slate-200 p-4 px-8 flex items-center justify-between z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <button onClick={onPrev} className="px-6 py-3 font-medium text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-2 border border-slate-200 rounded-lg bg-red-100 hover:bg-red-200">
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span> Quay lại
                    </button>
                    <div className="flex gap-3">
                        <button onClick={onNext} className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20 transition-all active:scale-95">
                            Tiếp tục <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default MedicalExamination;
