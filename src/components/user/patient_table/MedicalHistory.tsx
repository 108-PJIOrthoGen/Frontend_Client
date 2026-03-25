import React, { useEffect } from 'react';
import { useDemographics } from '@/redux/hook';
import { IMedicalHistory, ISurgery } from '@/types/backend';
import { Demographics } from '@/types/types';

interface MedicalHistoryProps {
    onNext?: () => void;
    onPrev?: () => void;
    mode?: 'wizard' | 'standalone';
    medicalHistoryData?: IMedicalHistory | null;
    surgeriesData?: ISurgery[];
}

export function mapMedicalHistoryToDemo(mh: IMedicalHistory, surgeries: ISurgery[]): Partial<Demographics> {
    return {
        medicalHistory: mh.process ?? '',
        pastMedicalHistory: mh.medicalHistory ?? '',
        antibioticHistory: mh.antibioticHistory ?? '',
        relatedCharacteristics: {
            allergy: { checked: mh.isAllergy ?? false, note: mh.allergyNote ?? '' },
            drugs: { checked: mh.isDrug ?? false, note: mh.drugNote ?? '' },
            alcohol: { checked: mh.isAlcohol ?? false, note: mh.alcoholNote ?? '' },
            smoking: { checked: mh.isSmoking ?? false, note: mh.smokingNote ?? '' },
            other: { checked: mh.isOther ?? false, note: mh.otherNote ?? '' },
        },
        surgicalHistory: surgeries.length > 0
            ? surgeries.map((s, i) => ({
                id: String(s.id ?? (i + 1)),
                surgeryDate: s.surgeryDate ?? '',
                procedure: s.surgeryType ?? '',
                notes: s.findings ?? '',
            }))
            : [{ id: '1', surgeryDate: '', procedure: '', notes: '' }],
    };
}

export function demoToMedicalHistoryRequest(d: Demographics): Omit<IMedicalHistory, 'id' | 'createdAt' | 'updatedAt'> {
    return {
        process: d.medicalHistory,
        medicalHistory: d.pastMedicalHistory,
        antibioticHistory: d.antibioticHistory,
        isAllergy: d.relatedCharacteristics.allergy.checked,
        allergyNote: d.relatedCharacteristics.allergy.note,
        isDrug: d.relatedCharacteristics.drugs.checked,
        drugNote: d.relatedCharacteristics.drugs.note,
        isAlcohol: d.relatedCharacteristics.alcohol.checked,
        alcoholNote: d.relatedCharacteristics.alcohol.note,
        isSmoking: d.relatedCharacteristics.smoking.checked,
        smokingNote: d.relatedCharacteristics.smoking.note,
        isOther: d.relatedCharacteristics.other.checked,
        otherNote: d.relatedCharacteristics.other.note,
    };
}

export function demoToSurgeryRequests(d: Demographics): Omit<ISurgery, 'id' | 'createdAt' | 'updatedAt'>[] {
    return d.surgicalHistory
        .filter(s => s.surgeryDate || s.procedure || s.notes)
        .map(s => ({
            surgeryDate: s.surgeryDate || undefined,
            surgeryType: s.procedure || undefined,
            findings: s.notes || undefined,
        }));
}

export const MedicalHistoryPage: React.FC<MedicalHistoryProps> = ({ onNext, onPrev, mode = 'wizard', medicalHistoryData, surgeriesData }) => {
    const { demographics, setDemographics } = useDemographics();

    // When data is loaded from API, populate demographics
    useEffect(() => {
        if (medicalHistoryData || (surgeriesData && surgeriesData.length > 0)) {
            const emptyMh: IMedicalHistory = {};
            const mapped = mapMedicalHistoryToDemo(medicalHistoryData ?? emptyMh, surgeriesData ?? []);
            setDemographics(prev => ({ ...prev, ...mapped }));
        }
    }, [medicalHistoryData, surgeriesData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setDemographics(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value
        }));
    };

    /* Risk Factors removed */

    const handleCharacteristicChange = (key: keyof typeof demographics.relatedCharacteristics, field: 'checked' | 'note', value: any) => {
        setDemographics(prev => ({
            ...prev,
            relatedCharacteristics: {
                ...prev.relatedCharacteristics,
                [key]: {
                    ...prev.relatedCharacteristics[key],
                    [field]: value
                }
            }
        }));
    };

    const handleSurgicalHistoryChange = (id: string, field: 'surgeryDate' | 'procedure' | 'notes', value: string) => {
        setDemographics(prev => ({
            ...prev,
            surgicalHistory: prev.surgicalHistory.map(row =>
                row.id === id ? { ...row, [field]: value } : row
            )
        }));
    };

    const handleRemoveRow = (index: number) => {
        setDemographics(prev => ({
            ...prev,
            surgicalHistory: prev.surgicalHistory.filter((_, i) => i !== index)
        }));
    };

    const handleInsertRow = (index: number) => {
        setDemographics(prev => {
            const newHistory = [...prev.surgicalHistory];
            newHistory.splice(index + 1, 0, { id: Date.now().toString(), surgeryDate: '', procedure: '', notes: '' });
            return {
                ...prev,
                surgicalHistory: newHistory
            };
        });
    };

    const characteristicsList = [
        { key: 'allergy', label: 'Dị ứng', code: '01', notePlaceholder: '(Dị nguyên)' },
        { key: 'drugs', label: 'Ma túy', code: '02' },
        { key: 'alcohol', label: 'Rượu bia', code: '03' },
        { key: 'smoking', label: 'Hút thuốc', code: '04' },
        { key: 'other', label: 'Khác', code: '05' },
    ];

    // Comorbidity labels removed


    return (
        <>
            {mode === 'wizard' && (
                <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between z-10 flex-shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Nhập thông tin bệnh án</h1>
                        <p className="text-slate-500 text-sm mt-1">Lưu trữ thông tin về tiền sử bệnh & điều trị </p>
                    </div>
                </header>
            )}
            <div className="flex-1 overflow-y-auto p-8 pb-32">

                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Medical History Context */}
                    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tiền sử bệnh</h1>
                                <p className="text-slate-500 text-sm mt-1">Ghi nhận tiền sử bệnh </p>
                            </div>
                        </div>
                        <div className="p-6 grid grid-cols-1 gap-6">
                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-medium text-slate-700">Quá trình bệnh lý</span>
                                <textarea
                                    name="medicalHistory"
                                    value={demographics.medicalHistory}
                                    onChange={handleInputChange}
                                    className="w-full rounded-lg border-slate-300 min-h-[120px] p-3 border focus:ring-primary focus:border-primary"
                                    placeholder="Mô tả chi tiết quá trình bệnh lý..."
                                />
                            </label>
                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-medium text-slate-700">Tiền sử bệnh</span>
                                <textarea
                                    name="pastMedicalHistory"
                                    value={demographics.pastMedicalHistory}
                                    onChange={handleInputChange}
                                    className="w-full rounded-lg border-slate-300 min-h-[120px] p-3 border focus:ring-primary focus:border-primary"
                                    placeholder="Các bệnh lý nền, dị ứng, phẫu thuật trước đây..."
                                />
                            </label>
                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-medium text-slate-700">Tiền sử điều trị kháng sinh</span>
                                <textarea
                                    name="antibioticHistory"
                                    value={demographics.antibioticHistory}
                                    onChange={handleInputChange}
                                    className="w-full rounded-lg border-slate-300 min-h-[120px] p-3 border focus:ring-primary focus:border-primary"
                                    placeholder="Các loại kháng sinh dùng trước đây..."
                                />
                            </label>

                            {/* Related Characteristics Table */}
                            <div className="flex flex-col gap-2">
                                <span className="text-sm font-medium text-slate-700">Đặc điểm liên quan bệnh:</span>
                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                                            <tr>
                                                <th className="px-3 py-2 text-center w-12 border-r border-slate-200">TT</th>
                                                <th className="px-3 py-2 border-r border-slate-200">Ký hiệu</th>
                                                <th className="px-3 py-2 w-16 text-center border-r border-slate-200">Chọn</th>
                                                <th className="px-3 py-2">Thời gian (tính theo tháng) / Ghi chú</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {characteristicsList.map((item, index) => {
                                                const config = demographics.relatedCharacteristics[item.key as keyof typeof demographics.relatedCharacteristics];
                                                return (
                                                    <tr key={item.key} className="hover:bg-slate-50/50">
                                                        <td className="px-3 py-2 text-center text-slate-500 border-r border-slate-200">{item.code}</td>
                                                        <td className="px-3 py-2 font-medium text-slate-900 border-r border-slate-200">
                                                            {item.label}
                                                        </td>
                                                        <td className="px-3 py-2 text-center border-r border-slate-200">
                                                            <input
                                                                type="checkbox"
                                                                checked={config.checked}
                                                                onChange={(e) => handleCharacteristicChange(item.key as any, 'checked', e.target.checked)}
                                                                className="w-4 h-4 rounded border-slate-300 accent-primary"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="text"
                                                                value={config.note}
                                                                onChange={(e) => handleCharacteristicChange(item.key as any, 'note', e.target.value)}
                                                                disabled={!config.checked}
                                                                className="w-full text-sm px-2 py-1 rounded border border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                                                placeholder={item.notePlaceholder || "Nhập thời gian..."}
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Risk Factors removed */}

                    {/* Surgical History Table */}
                    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-[20px]">surgical</span>
                                Tiền sử phẫu thuật
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="px-3 py-2 text-center w-16 border-r border-slate-200">Lần PT</th>
                                            <th className="px-3 py-2 w-32 border-r border-slate-200">Thời gian</th>
                                            <th className="px-3 py-2 border-r border-slate-200">Phương pháp phẫu thuật</th>
                                            <th className="px-3 py-2 border-r border-slate-200">Ghi chú</th>
                                            <th className="px-3 py-2 text-center w-24"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {demographics.surgicalHistory.map((row, index) => (
                                            <tr key={row.id} className="group hover:bg-slate-50/50">
                                                <td className="px-3 py-2 text-center text-slate-500 border-r border-slate-200 bg-slate-50">{index + 1}</td>
                                                <td className="p-0 border-r border-slate-200">
                                                    <input
                                                        type="date"
                                                        value={row.surgeryDate}
                                                        onChange={(e) => handleSurgicalHistoryChange(row.id, 'surgeryDate', e.target.value)}
                                                        className="w-full px-3 py-2 border-none focus:ring-inset focus:ring-2 focus:ring-primary outline-none bg-transparent"
                                                    />
                                                </td>
                                                <td className="p-0 border-r border-slate-200">
                                                    <input
                                                        type="text"
                                                        value={row.procedure}
                                                        onChange={(e) => handleSurgicalHistoryChange(row.id, 'procedure', e.target.value)}
                                                        className="w-full px-3 py-2 border-none focus:ring-inset focus:ring-2 focus:ring-primary outline-none bg-transparent"
                                                        placeholder="Nhập phương pháp..."
                                                    />
                                                </td>
                                                <td className="p-0 border-r border-slate-200">
                                                    <input
                                                        type="text"
                                                        value={row.notes}
                                                        onChange={(e) => handleSurgicalHistoryChange(row.id, 'notes', e.target.value)}
                                                        className="w-full px-3 py-2 border-none focus:ring-inset focus:ring-2 focus:ring-primary outline-none bg-transparent"
                                                        placeholder="Ghi chú thêm..."
                                                    />
                                                </td>
                                                <td className="px-3 py-2 flex items-center justify-center gap-1 opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleInsertRow(index)}
                                                        className="p-1 rounded hover:bg-blue-100 text-blue-600 transition-colors"
                                                        title="Chèn hàng dưới"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">add</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveRow(index)}
                                                        className="p-1 rounded hover:bg-red-100 text-red-600 transition-colors"
                                                        title="Xóa hàng"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>


                </div>

            </div>


        </>
    );
};
