import React, { useState, useEffect } from 'react';
import { ICultureResult, ISensitivityResult } from '@/types/backend';

export interface AntibioticRow {
    name: string;
    mic: string;
    interpretation: string;
    notes: string;
}

interface Step4Props {
    onNext?: () => void;
    onPrev?: () => void;
    mode?: 'wizard' | 'standalone';
    cultureResults?: ICultureResult[];
    sensitivityMap?: Record<string, ISensitivityResult[]>;
    onAntibioticsChange?: (rows: AntibioticRow[]) => void;
}

export const Step4Antibiogram: React.FC<Step4Props> = ({ onNext, onPrev, mode = 'wizard', cultureResults, sensitivityMap, onAntibioticsChange }) => {
    const initialAntibiotics: AntibioticRow[] = [
        { name: '', mic: '', interpretation: '', notes: '' },
    ];

    const [antibiotics, setAntibiotics] = useState<AntibioticRow[]>(initialAntibiotics);
    const [activeCulture, setActiveCulture] = useState<ICultureResult | null>(null);

    // Populate from API data
    useEffect(() => {
        if (cultureResults && cultureResults.length > 0) {
            setActiveCulture(cultureResults[0]);
            const firstCultureId = cultureResults[0].id;
            if (firstCultureId && sensitivityMap?.[firstCultureId]) {
                const rows = sensitivityMap[firstCultureId].map(s => ({
                    name: s.antibioticName ?? '',
                    mic: s.micValue ?? '',
                    interpretation: s.sensitivityCode ?? '',
                    notes: '',
                }));
                setAntibiotics(rows.length > 0 ? rows : initialAntibiotics);
            }
        } else {
            setActiveCulture(null);
            setAntibiotics(initialAntibiotics);
        }
    }, [cultureResults, sensitivityMap]);

    const getInterpretationColor = (val: string) => {
        if (val === 'R') return 'bg-red-100 text-red-700 border-red-200';
        if (val === 'S') return 'bg-green-100 text-green-700 border-green-200';
        if (val === 'I') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        return 'bg-slate-100 text-slate-700 border-slate-200';
    };

    // Notify parent of changes
    useEffect(() => {
        onAntibioticsChange?.(antibiotics);
    }, [antibiotics]);

    return (
        <div className="flex flex-col h-full bg-slate-50 relative pb-24">
            {mode === 'wizard' && (
                <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between z-10 flex-shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bảng Kháng Sinh Đồ</h1>
                        <p className="text-slate-500 text-sm mt-1">Kết quả định danh vi khuẩn và mức độ nhạy cảm tự động</p>
                    </div>
                    <div className="flex items-center gap-3 z-10">
                        <button onClick={onPrev} className="px-6 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-2 border border-slate-200 rounded-lg bg-red-300">
                            <span className="material-symbols-outlined text-[18px]">arrow_back</span> Quay lại
                        </button>
                        <div className="flex gap-3">
                            <button onClick={onNext} className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3  font-bold text-white hover:bg-cyan-400 shadow-lg shadow-blue-500/20 transition-all active:scale-95">
                                AI chẩn đoán <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                            </button>
                        </div>
                    </div>
                </header>
            )}

            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-5xl mx-auto space-y-6">
                    <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="font-bold text-slate-800 text-base">
                                    Vi khuẩn phân lập: {activeCulture?.name
                                        ? <span className="text-red-600">{activeCulture.name}</span>
                                        : <span className="text-slate-400">Chưa có dữ liệu</span>
                                    }
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Mẫu cấy: {activeCulture?.sampleType || '—'} - Ngày cấy: {activeCulture?.createdAt?.slice(0, 10) || '—'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 border border-green-200"></span>S (Susceptible)</div>
                                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200"></span>I (Intermediate)</div>
                                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-200"></span>R (Resistant)</div>
                            </div>
                        </div>

                        <div className="overflow-hidden border border-slate-200 rounded-lg">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 border-r border-slate-200">Tên kháng sinh</th>
                                        <th className="px-4 py-3 border-r border-slate-200 w-32 text-center">
                                            MIC (µg/mL)
                                        </th>
                                        <th className="px-4 py-3 border-r border-slate-200 w-32 text-center">
                                            Biện luận
                                        </th>
                                        <th className="px-4 py-3 text-center w-24">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {antibiotics.map((ab, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50">
                                            {(
                                                <>
                                                    <td className="px-4 py-2 border-r border-slate-200">
                                                        <input
                                                            className="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                            placeholder="Tên kháng sinh"
                                                            value={ab.name}
                                                            onChange={e =>
                                                                setAntibiotics(prev =>
                                                                    prev.map((item, i) =>
                                                                        i === idx
                                                                            ? { ...item, name: e.target.value }
                                                                            : item
                                                                    )
                                                                )
                                                            }
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 border-r border-slate-200 text-center">
                                                        <input
                                                            className="w-full border border-slate-300 rounded px-2 py-1 text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                            placeholder="VD: >=4"
                                                            value={ab.mic}
                                                            onChange={e =>
                                                                setAntibiotics(prev =>
                                                                    prev.map((item, i) =>
                                                                        i === idx
                                                                            ? { ...item, mic: e.target.value }
                                                                            : item
                                                                    )
                                                                )
                                                            }
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 border-r border-slate-200 text-center">
                                                        <select
                                                            className="border border-slate-300 rounded px-2 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                            value={ab.interpretation}
                                                            onChange={e =>
                                                                setAntibiotics(prev =>
                                                                    prev.map((item, i) =>
                                                                        i === idx
                                                                            ? { ...item, interpretation: e.target.value }
                                                                            : item
                                                                    )
                                                                )
                                                            }
                                                        >
                                                            <option value="">Chọn</option>
                                                            <option value="S">S</option>
                                                            <option value="I">I</option>
                                                            <option value="R">R</option>
                                                        </select>
                                                    </td>

                                                    <td className="px-4 py-2 text-center">
                                                        <button
                                                            type="button"
                                                            className="text-xs text-red-600 hover:text-red-700 underline"
                                                            onClick={() =>
                                                                setAntibiotics(prev =>
                                                                    prev.filter((_, i) => i !== idx)
                                                                )
                                                            }
                                                        >
                                                            Xóa
                                                        </button>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                    <tr
                                        className="hover:bg-slate-50/50 cursor-pointer"
                                        onClick={() =>
                                            setAntibiotics(prev => [
                                                ...prev,
                                                { name: 'Kháng sinh mới', mic: '', interpretation: '', notes: '' }
                                            ])
                                        }
                                    >
                                        <td
                                            className="px-4 py-3 text-sm font-medium text-blue-600 text-center"
                                            colSpan={5}
                                        >
                                            + Thêm kháng sinh mới
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>


        </div>
    );
};
