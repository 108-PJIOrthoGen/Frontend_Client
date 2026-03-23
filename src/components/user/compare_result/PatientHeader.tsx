import React from 'react';
import { IEpisode } from '@/types/backend';
import dayjs from 'dayjs';

interface PatientHeaderProps {
    episode: IEpisode;
}

const PatientHeader: React.FC<PatientHeaderProps> = ({ episode }) => {
    const patient = episode.patient;
    const initials = patient?.fullName?.charAt(0)?.toUpperCase() || 'P';

    const getStatusBadge = () => {
        switch (episode.status) {
            case 'active':
                return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500', label: 'Đang điều trị' };
            case 'completed':
                return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', label: 'Hoàn thành' };
            case 'cancelled':
                return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500', label: 'Đã hủy' };
            default:
                return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400', label: episode.status || 'N/A' };
        }
    };

    const getResultBadge = () => {
        const map: Record<string, { bg: string; text: string; border: string; label: string }> = {
            good: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Khỏi' },
            normal: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Đỡ, giảm nhẹ' },
            bad: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Không thay đổi' },
            worse: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Nặng hơn' },
        };
        return episode.result ? map[episode.result] : null;
    };

    const statusBadge = getStatusBadge();
    const resultBadge = getResultBadge();

    return (
        <div className="bg-white border border-[#dbe3ef] rounded-2xl shadow-sm mb-6 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-500 w-full"></div>
            <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
                {/* Patient Info */}
                <div className="lg:col-span-3 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg border border-blue-200">
                            {initials}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                    {patient?.patientCode || '—'}
                                </span>
                                {patient?.gender && (
                                    <>
                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                        <span className="text-xs font-semibold text-slate-500">
                                            {patient.gender === 'MALE' ? 'Nam' : 'Nữ'}
                                            {patient.dateOfBirth && `, ${dayjs().diff(dayjs(patient.dateOfBirth), 'year')} tuổi`}
                                        </span>
                                    </>
                                )}
                            </div>
                            <h1 className="m-0 text-xl font-bold leading-tight">{patient?.fullName || 'Bệnh nhân'}</h1>
                        </div>
                    </div>

                    {/* Badges */}
                    <div className="flex gap-2 flex-wrap mt-1">
                        {episode.department && (
                            <div className="bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-md text-[13px] font-medium flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[14px]">local_hospital</span>
                                {episode.department}
                            </div>
                        )}
                        {episode.admissionDate && (
                            <div className="bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-md text-[13px] font-medium flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[14px]">event</span>
                                Nhập viện: {dayjs(episode.admissionDate).format('DD/MM/YYYY')}
                            </div>
                        )}
                        {episode.treatmentDays != null && (
                            <div className="bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-md text-[13px] font-medium flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[14px]">schedule</span>
                                {episode.treatmentDays} ngày điều trị
                            </div>
                        )}
                        <div className={`${statusBadge.bg} ${statusBadge.text} border ${statusBadge.border} px-2.5 py-1 rounded-md text-[13px] font-medium flex items-center gap-1.5`}>
                            <span className={`w-2 h-2 rounded-full ${statusBadge.dot}`}></span>
                            {statusBadge.label}
                        </div>
                        {resultBadge && (
                            <div className={`${resultBadge.bg} ${resultBadge.text} border ${resultBadge.border} px-2.5 py-1 rounded-md text-[13px] font-medium flex items-center gap-1.5`}>
                                KQ: {resultBadge.label}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right side - Episode info */}
                <div className="lg:col-span-1 lg:border-l lg:border-slate-100 lg:pl-6 h-full flex flex-col justify-center gap-3">
                    <div className="flex items-start gap-3 w-full">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined">medical_information</span>
                        </div>
                        <div>
                            <div className="text-xs text-slate-500 mb-0.5 font-medium">Bệnh án</div>
                            <div className="text-sm font-bold text-slate-900">#{episode.id}</div>
                        </div>
                    </div>
                    {episode.reason && (
                        <div className="text-xs text-slate-500 leading-relaxed">
                            <span className="font-medium">Lý do:</span> {episode.reason}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PatientHeader;
