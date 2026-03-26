import React, { useEffect } from 'react';
import { useClinicForm } from '@/redux/hook';
import { IMedicalHistory, ISurgery } from '@/types/backend';

interface MedicalHistoryProps {
    onNext?: () => void;
    onPrev?: () => void;
    mode?: 'wizard' | 'standalone';
    medicalHistoryData?: IMedicalHistory | null;
    surgeriesData?: ISurgery[];
}

export const MedicalHistoryPage: React.FC<MedicalHistoryProps> = ({ onNext, onPrev, mode = 'wizard', medicalHistoryData, surgeriesData }) => {
    const { form, setForm } = useClinicForm();

    // When data is loaded from API, populate form directly with backend types
    useEffect(() => {
        if (medicalHistoryData || (surgeriesData && surgeriesData.length > 0)) {
            const mh = medicalHistoryData ?? {};
            setForm(prev => ({
                ...prev,
                medicalHistory: {
                    ...prev.medicalHistory,
                    process: mh.process ?? '',
                    medicalHistory: mh.medicalHistory ?? '',
                    antibioticHistory: mh.antibioticHistory ?? '',
                    isAllergy: mh.isAllergy ?? false,
                    allergyNote: mh.allergyNote ?? '',
                    isDrug: mh.isDrug ?? false,
                    drugNote: mh.drugNote ?? '',
                    isAlcohol: mh.isAlcohol ?? false,
                    alcoholNote: mh.alcoholNote ?? '',
                    isSmoking: mh.isSmoking ?? false,
                    smokingNote: mh.smokingNote ?? '',
                    isOther: mh.isOther ?? false,
                    otherNote: mh.otherNote ?? '',
                },
                surgeries: surgeriesData && surgeriesData.length > 0
                    ? surgeriesData.map(s => ({
                        ...s,
                        id: s.id ?? undefined,
                        _tempId: String(s.id ?? Date.now()),
                    }))
                    : [{ _tempId: '1', surgeryDate: '', surgeryType: '', findings: '' }],
            }));
        }
    }, [medicalHistoryData, surgeriesData]);

    const handleMedicalHistoryChange = (field: keyof IMedicalHistory, value: string) => {
        setForm(prev => ({
            ...prev,
            medicalHistory: { ...prev.medicalHistory, [field]: value }
        }));
    };

    const handleCharacteristicToggle = (checkedField: keyof IMedicalHistory, noteField: keyof IMedicalHistory, checked: boolean) => {
        setForm(prev => ({
            ...prev,
            medicalHistory: { ...prev.medicalHistory, [checkedField]: checked }
        }));
    };

    const handleCharacteristicNote = (noteField: keyof IMedicalHistory, value: string) => {
        setForm(prev => ({
            ...prev,
            medicalHistory: { ...prev.medicalHistory, [noteField]: value }
        }));
    };

    const handleSurgeryChange = (index: number, field: keyof ISurgery, value: string) => {
        setForm(prev => ({
            ...prev,
            surgeries: prev.surgeries.map((s, i) =>
                i === index ? { ...s, [field]: value } : s
            )
        }));
    };

    const handleRemoveRow = (index: number) => {
        setForm(prev => ({
            ...prev,
            surgeries: prev.surgeries.filter((_, i) => i !== index)
        }));
    };

    const handleInsertRow = (index: number) => {
        setForm(prev => {
            const newSurgeries = [...prev.surgeries];
            newSurgeries.splice(index + 1, 0, { _tempId: Date.now().toString(), surgeryDate: '', surgeryType: '', findings: '' });
            return { ...prev, surgeries: newSurgeries };
        });
    };

    const characteristicsList: { checkedField: keyof IMedicalHistory; noteField: keyof IMedicalHistory; label: string; code: string; notePlaceholder?: string }[] = [
        { checkedField: 'isAllergy', noteField: 'allergyNote', label: 'Dị ứng', code: '01', notePlaceholder: '(Dị nguyên)' },
        { checkedField: 'isDrug', noteField: 'drugNote', label: 'Ma túy', code: '02' },
        { checkedField: 'isAlcohol', noteField: 'alcoholNote', label: 'Rượu bia', code: '03' },
        { checkedField: 'isSmoking', noteField: 'smokingNote', label: 'Hút thuốc', code: '04' },
        { checkedField: 'isOther', noteField: 'otherNote', label: 'Khác', code: '05' },
    ];

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
                                    value={form.medicalHistory.process ?? ''}
                                    onChange={(e) => handleMedicalHistoryChange('process', e.target.value)}
                                    className="w-full rounded-lg border-slate-300 min-h-[120px] p-3 border focus:ring-primary focus:border-primary"
                                    placeholder="Mô tả chi tiết quá trình bệnh lý..."
                                />
                            </label>
                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-medium text-slate-700">Tiền sử bệnh</span>
                                <textarea
                                    value={form.medicalHistory.medicalHistory ?? ''}
                                    onChange={(e) => handleMedicalHistoryChange('medicalHistory', e.target.value)}
                                    className="w-full rounded-lg border-slate-300 min-h-[120px] p-3 border focus:ring-primary focus:border-primary"
                                    placeholder="Các bệnh lý nền, dị ứng, phẫu thuật trước đây..."
                                />
                            </label>
                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-medium text-slate-700">Tiền sử điều trị kháng sinh</span>
                                <textarea
                                    value={form.medicalHistory.antibioticHistory ?? ''}
                                    onChange={(e) => handleMedicalHistoryChange('antibioticHistory', e.target.value)}
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
                                            {characteristicsList.map((item) => {
                                                const isChecked = !!form.medicalHistory[item.checkedField];
                                                const noteValue = (form.medicalHistory[item.noteField] as string) ?? '';
                                                return (
                                                    <tr key={item.code} className="hover:bg-slate-50/50">
                                                        <td className="px-3 py-2 text-center text-slate-500 border-r border-slate-200">{item.code}</td>
                                                        <td className="px-3 py-2 font-medium text-slate-900 border-r border-slate-200">
                                                            {item.label}
                                                        </td>
                                                        <td className="px-3 py-2 text-center border-r border-slate-200">
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={(e) => handleCharacteristicToggle(item.checkedField, item.noteField, e.target.checked)}
                                                                className="w-4 h-4 rounded border-slate-300 accent-primary"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="text"
                                                                value={noteValue}
                                                                onChange={(e) => handleCharacteristicNote(item.noteField, e.target.value)}
                                                                disabled={!isChecked}
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
                                        {form.surgeries.map((row, index) => (
                                            <tr key={row._tempId || row.id || index} className="group hover:bg-slate-50/50">
                                                <td className="px-3 py-2 text-center text-slate-500 border-r border-slate-200 bg-slate-50">{index + 1}</td>
                                                <td className="p-0 border-r border-slate-200">
                                                    <input
                                                        type="date"
                                                        value={row.surgeryDate ?? ''}
                                                        onChange={(e) => handleSurgeryChange(index, 'surgeryDate', e.target.value)}
                                                        className="w-full px-3 py-2 border-none focus:ring-inset focus:ring-2 focus:ring-primary outline-none bg-transparent"
                                                    />
                                                </td>
                                                <td className="p-0 border-r border-slate-200">
                                                    <input
                                                        type="text"
                                                        value={row.surgeryType ?? ''}
                                                        onChange={(e) => handleSurgeryChange(index, 'surgeryType', e.target.value)}
                                                        className="w-full px-3 py-2 border-none focus:ring-inset focus:ring-2 focus:ring-primary outline-none bg-transparent"
                                                        placeholder="Nhập phương pháp..."
                                                    />
                                                </td>
                                                <td className="p-0 border-r border-slate-200">
                                                    <input
                                                        type="text"
                                                        value={row.findings ?? ''}
                                                        onChange={(e) => handleSurgeryChange(index, 'findings', e.target.value)}
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
