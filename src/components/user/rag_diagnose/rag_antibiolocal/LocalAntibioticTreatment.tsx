import { BandageIcon, DropletsIcon, SprayIcon } from '@/components/icons';
import React from 'react'
import MedCard from './MedCard';
import { PlusCircleOutlined, WarningOutlined } from '@ant-design/icons';

export const FORM_META = {
    gel: { label: "Gel", color: "violet", bg: "bg-violet-50", border: "border-violet-200", badge: "bg-violet-100 text-violet-700", dot: "bg-violet-500", icon: "💜" },
    cream: { label: "Kem bôi", color: "rose", bg: "bg-rose-50", border: "border-rose-200", badge: "bg-rose-100 text-rose-700", dot: "bg-rose-500", icon: "🩷" },
    solution: { label: "Dung dịch rửa", color: "cyan", bg: "bg-cyan-50", border: "border-cyan-200", badge: "bg-cyan-100 text-cyan-700", dot: "bg-cyan-500", icon: "💧" },
    powder: { label: "Bột rắc", color: "amber", bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500", icon: "🟡" },
    ointment: { label: "Thuốc mỡ", color: "emerald", bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", icon: "💚" },
    patch: { label: "Miếng dán", color: "indigo", bg: "bg-indigo-50", border: "border-indigo-200", badge: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-500", icon: "🔷" },
};

const ZoneIcon = ({ code }) => {
    if (code === "WOUND") return <BandageIcon />;
    if (code === "BONE") return <DropletsIcon />;
    return <SprayIcon />;
};

const ZONE_COLORS = {
    WOUND: { ring: "ring-rose-400", dot: "bg-rose-500", header: "bg-rose-500", light: "bg-rose-50 border-rose-200", label: "text-rose-700" },
    BONE: { ring: "ring-indigo-400", dot: "bg-indigo-500", header: "bg-indigo-500", light: "bg-indigo-50 border-indigo-200", label: "text-indigo-700" },
    SKIN: { ring: "ring-amber-400", dot: "bg-amber-500", header: "bg-amber-500", light: "bg-amber-50 border-amber-200", label: "text-amber-700" },
};

const treatments = [
    {
        id: 1,
        zone: "Vết thương hở / Mô mềm nhiễm trùng",
        zoneCode: "WOUND",
        medications: [
            {
                id: 11,
                name: "Mupirocin 2%",
                form: "ointment",
                dose: "Lớp mỏng ~1mm",
                frequency: "2–3 lần/ngày",
                duration: "7–10 ngày",
                technique: [
                    { code: "clean", label: "Làm sạch bằng NaCl 0.9%" },
                    { code: "apply", label: "Bôi đều lên toàn bộ vùng tổn thương" },
                    { code: "cover", label: "Băng gạc không thấm" },
                ],
                caution: "Không dùng cho niêm mạc mũi kéo dài > 10 ngày",
                evidence: "A",
            },
            {
                id: 12,
                name: "Povidone-Iodine 10%",
                form: "solution",
                dose: "Đủ thấm bề mặt",
                frequency: "1–2 lần/ngày",
                duration: "Đến khi sạch",
                technique: [
                    { code: "irrigate", label: "Tưới rửa bằng syringe 20mL" },
                    { code: "cover", label: "Gạc tẩm dung dịch che phủ" },
                ],
                caution: "Tránh vết thương sâu, xoang kín",
                evidence: "B",
            },
        ],
    },
    {
        id: 2,
        zone: "Nhiễm trùng xương / Quanh implant",
        zoneCode: "BONE",
        medications: [
            {
                id: 21,
                name: "Vancomycin bột rắc",
                form: "powder",
                dose: "1–2g/lần (0.5–1g/cm²)",
                frequency: "Mỗi lần thay băng",
                duration: "Theo chỉ định phẫu thuật",
                technique: [
                    { code: "clean", label: "Debridement hoàn toàn trước khi áp dụng" },
                    { code: "pack", label: "Rắc trực tiếp vào hốc xương / quanh implant" },
                    { code: "cover", label: "Đóng vết thương kín sau khi rắc" },
                ],
                caution: "Chỉ dùng trong phẫu thuật, không dùng ngoại trú",
                evidence: "B",
            },
        ],
    },
    {
        id: 3,
        zone: "Nhiễm trùng da / Chân tóc",
        zoneCode: "SKIN",
        medications: [
            {
                id: 31,
                name: "Fusidic acid 2%",
                form: "cream",
                dose: "Lớp mỏng",
                frequency: "3 lần/ngày",
                duration: "5–7 ngày",
                technique: [
                    { code: "clean", label: "Lau sạch da bằng dung dịch antiseptic" },
                    { code: "apply", label: "Xoa nhẹ nhàng, không chà mạnh" },
                    { code: "cover", label: "Không băng kín nếu vùng nhỏ" },
                ],
                caution: "Tránh lạm dụng — nguy cơ kháng Staphylococcus",
                evidence: "A",
            },
            {
                id: 32,
                name: "Metronidazole 0.75%",
                form: "gel",
                dose: "Lượng vừa đủ",
                frequency: "2 lần/ngày",
                duration: "7 ngày",
                technique: [
                    { code: "clean", label: "Vệ sinh da, thấm khô" },
                    { code: "apply", label: "Bôi gel, tránh mắt và niêm mạc" },
                ],
                caution: "Hiệu quả với vi khuẩn kỵ khí & Demodex",
                evidence: "B",
            },
        ],
    },
];
const LocalAntibioticTreatment = () => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden font-sans">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-sm">
                        <DropletsIcon />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900 leading-tight">Điều trị kháng sinh tại chỗ</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Phân nhóm theo vùng & dạng bào chế</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-teal-600 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full uppercase tracking-wide">Gợi ý AI</span>
                </div>
            </div>

            {/* Legend row */}
            <div className="px-4 py-2.5 border-b border-slate-100 bg-white flex items-center gap-4 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dạng bào chế:</span>
                {Object.entries(FORM_META).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-1.5">
                        <span className="text-sm">{val.icon}</span>
                        <span className="text-[11px] font-medium text-slate-600">{val.label}</span>
                    </div>
                ))}
            </div>

            {/* Content */}
            <div className="p-4 space-y-6">
                {treatments.map((zone, zi) => {
                    const zc = ZONE_COLORS[zone.zoneCode] || ZONE_COLORS.SKIN;
                    return (
                        <div key={zone.id} className="group">
                            {/* Zone header */}
                            <div className={`flex items-center gap-3 mb-3`}>
                                <div className={`w-7 h-7 rounded-full ${zc.dot} text-white flex items-center justify-center shadow-sm ring-4 ring-white`}>
                                    <ZoneIcon code={zone.zoneCode} />
                                </div>
                                <div className={`flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent`} />
                                <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${zc.light} ${zc.label} uppercase tracking-wide`}>
                                    {zone.zone}
                                </span>
                                <div className={`flex-1 h-px bg-gradient-to-l from-slate-200 to-transparent`} />
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-semibold text-slate-500">{zone.medications.length} thuốc</span>
                                </div>
                            </div>

                            {/* Medication cards */}
                            <div className={`grid gap-3 ${zone.medications.length > 1 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
                                {zone.medications.map((med) => (
                                    <MedCard key={med.id} med={med} zoneColor={zc} />
                                ))}
                            </div>

                            {/* Add to zone */}
                            <button className={`mt-2 w-full border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl py-2.5 text-xs text-slate-400 hover:text-slate-500 font-medium flex items-center justify-center gap-2 transition-all hover:bg-slate-50`}>
                                <PlusCircleOutlined /> Thêm thuốc cho vùng này
                            </button>
                        </div>
                    );
                })}

                {/* Add new zone */}
                <button className="w-full border-2 border-dashed border-teal-200 hover:border-teal-400 rounded-xl py-3 text-sm text-teal-500 hover:text-teal-600 font-semibold flex items-center justify-center gap-2 transition-all hover:bg-teal-50/50">
                    <PlusCircleOutlined /> Thêm vùng điều trị mới
                </button>
            </div>

            {/* Footer note */}
            <div className="px-4 pb-4">
                <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                    <span className="text-slate-400 mt-0.5 shrink-0"><WarningOutlined /></span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                        <span className="font-bold text-slate-600">Lưu ý lâm sàng:</span> Kháng sinh tại chỗ cần kết hợp với làm sạch vết thương đúng kỹ thuật. Thời gian điều trị tại chỗ không thay thế kháng sinh toàn thân trong nhiễm trùng sâu hoặc nhiễm khuẩn huyết.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default LocalAntibioticTreatment