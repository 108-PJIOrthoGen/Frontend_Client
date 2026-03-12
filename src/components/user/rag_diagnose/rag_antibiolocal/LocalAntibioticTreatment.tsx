import { BandageIcon, DropletsIcon, SprayIcon } from '@/components/icons';
import React, { useState } from 'react'
import MedCard from './MedCard';
import { PlusCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { Modal, Form, Input, Select, Button } from 'antd';

export const FORM_META = {
    ointment: { label: "Thuốc mỡ", color: "emerald", bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", icon: "💚" },
    solution: { label: "Dung dịch rửa", color: "cyan", bg: "bg-cyan-50", border: "border-cyan-200", badge: "bg-cyan-100 text-cyan-700", dot: "bg-cyan-500", icon: "💧" },
    powder: { label: "Bột rắc", color: "amber", bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500", icon: "🟡" },
    cream: { label: "Kem bôi", color: "rose", bg: "bg-rose-50", border: "border-rose-200", badge: "bg-rose-100 text-rose-700", dot: "bg-rose-500", icon: "🩷" },
    gel: { label: "Gel", color: "violet", bg: "bg-violet-50", border: "border-violet-200", badge: "bg-violet-100 text-violet-700", dot: "bg-violet-500", icon: "💜" },
};

// Mapping dạng bào chế phù hợp cho mỗi vùng điều trị theo tiêu chuẩn lâm sàn
const FORM_AVAILABLE_BY_ZONE = {
    INTRA_ARTICULAR: ['ointment', 'solution'],
    BONE: ['powder'],
    IMPLANT: ['cream', 'gel'],
};

// ánh xạ icon cho từng vùng điều trị kháng sinh tại chỗ
const ZoneIcon = ({ code }) => {
    // INTRA_ARTICULAR: khoang khớp - dùng icon bandage (vết thương)
    if (code === "INTRA_ARTICULAR") return <BandageIcon />;
    // BONE: mô xương / khoang phẫu thuật - dùng icon drops (chất lỏng/tiêm)
    if (code === "BONE") return <DropletsIcon />;
    // IMPLANT: cement/spacer - dùng icon spray (phun/rắc)
    if (code === "IMPLANT") return <SprayIcon />;
    return <BandageIcon />;
};

// Màu sắc cho từng vùng điều trị theo tiêu chuẩn chuyên môn
const ZONE_COLORS = {
    // Khoang khớp - màu hồng (vùng nhạy cảm cao)
    INTRA_ARTICULAR: { ring: "ring-rose-400", dot: "bg-rose-500", header: "bg-rose-500", light: "bg-rose-50 border-rose-200", label: "text-rose-700" },
    // Mô xương - màu tím (vùng sâu, phẫu thuật)
    BONE: { ring: "ring-violet-400", dot: "bg-violet-600", header: "bg-violet-600", light: "bg-violet-50 border-violet-200", label: "text-violet-700" },
    // Implant/Cement - màu hổ phách (vật liệu ngoại lai)
    IMPLANT: { ring: "ring-amber-400", dot: "bg-amber-600", header: "bg-amber-600", light: "bg-amber-50 border-amber-200", label: "text-amber-700" },
};

const initialTreatments = [
    {
        id: 1,
        zone: "Kháng sinh trong khoang khớp (Intra-articular)",
        zoneCode: "INTRA_ARTICULAR",
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
        id: 3,
        zone: "Kháng sinh trong cement / spacer",
        zoneCode: "IMPLANT",
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
    const [treatments, setTreatments] = useState(initialTreatments);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
    const [form] = Form.useForm();

    const handleAddMedToZone = (zoneId: number) => {
        setSelectedZoneId(zoneId);
        setIsModalOpen(true);
        form.resetFields();
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();

            setTreatments(prev => {
                return prev.map(zone => {
                    if (zone.id === selectedZoneId) {
                        const newMedId = Math.max(...zone.medications.map(m => m.id)) + 1;
                        return {
                            ...zone,
                            medications: [
                                ...zone.medications,
                                {
                                    id: newMedId,
                                    name: values.name,
                                    form: values.form,
                                    dose: values.dose,
                                    frequency: values.frequency,
                                    duration: values.duration,
                                    technique: [
                                        { code: "apply", label: values.technique }
                                    ],
                                    caution: values.caution || "",
                                    evidence: values.evidence || "C",
                                }
                            ]
                        };
                    }
                    return zone;
                });
            });

            setIsModalOpen(false);
            form.resetFields();
        } catch (error) {
            console.log('Validation failed:', error);
        }
    };

    const handleModalCancel = () => {
        setIsModalOpen(false);
        form.resetFields();
    };

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
                {Object.entries(FORM_META)
                    .filter(([key]) => Object.values(FORM_AVAILABLE_BY_ZONE).some(forms => forms.includes(key)))
                    .map(([key, val]) => (
                        <div key={key} className="flex items-center gap-1.5">
                            <span className="text-sm">{val.icon}</span>
                            <span className="text-[11px] font-medium text-slate-600">{val.label}</span>
                        </div>
                    ))}
            </div>

            {/* Content */}
            <div className="p-4 space-y-6">
                {treatments.map((zone, zi) => {
                    const zc = ZONE_COLORS[zone.zoneCode] || ZONE_COLORS.IMPLANT;
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
                            <button
                                onClick={() => handleAddMedToZone(zone.id)}
                                className={`mt-2 w-full border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl py-2.5 text-xs text-slate-400 hover:text-slate-500 font-medium flex items-center justify-center gap-2 transition-all hover:bg-slate-50`}>
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
            {/* Modal thêm thuốc */}
            <Modal
                title="Thêm thuốc kháng sinh tại chỗ"
                open={isModalOpen}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                width={600}
                okText="Thêm"
                cancelText="Hủy"
            >
                <Form
                    form={form}
                    layout="vertical"
                    className="mt-4"
                >
                    <Form.Item
                        label="Tên thuốc"
                        name="name"
                        rules={[{ required: true, message: 'Vui lòng nhập tên thuốc' }]}
                    >
                        <Input placeholder="VD: Vancomycin 1%" />
                    </Form.Item>

                    <Form.Item
                        label="Dạng bào chế"
                        name="form"
                        rules={[{ required: true, message: 'Vui lòng chọn dạng bào chế' }]}
                    >
                        <Select placeholder="Chọn dạng bào chế">
                            {(() => {
                                const selectedZone = treatments.find(z => z.id === selectedZoneId);
                                const availableFormTypes = selectedZone ? FORM_AVAILABLE_BY_ZONE[selectedZone.zoneCode] : [];
                                return availableFormTypes.map(formType => {
                                    const formData = FORM_META[formType];
                                    return (
                                        <Select.Option key={formType} value={formType}>
                                            {formData.icon} {formData.label}
                                        </Select.Option>
                                    );
                                });
                            })()}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Liều lượng"
                        name="dose"
                        rules={[{ required: true, message: 'Vui lòng nhập liều lượng' }]}
                    >
                        <Input placeholder="VD: 1-2g/lần" />
                    </Form.Item>

                    <Form.Item
                        label="Tần suất"
                        name="frequency"
                        rules={[{ required: true, message: 'Vui lòng nhập tần suất' }]}
                    >
                        <Input placeholder="VD: 2-3 lần/ngày" />
                    </Form.Item>

                    <Form.Item
                        label="Thời gian điều trị"
                        name="duration"
                        rules={[{ required: true, message: 'Vui lòng nhập thời gian' }]}
                    >
                        <Input placeholder="VD: 7-10 ngày" />
                    </Form.Item>

                    <Form.Item
                        label="Kỹ thuật sử dụng"
                        name="technique"
                    >
                        <Input.TextArea placeholder="VD: Bôi đều lên vùng tổn thương, băng gạc vô trùng" rows={3} />
                    </Form.Item>

                    <Form.Item
                        label="Lưu ý lâm sàn"
                        name="caution"
                    >
                        <Input.TextArea placeholder="Nhập lưu ý hoặc chống chỉ định" rows={2} />
                    </Form.Item>

                    <Form.Item
                        label="Mức bằng chứng"
                        name="evidence"
                    >
                        <Select placeholder="Chọn mức bằng chứng">
                            <Select.Option value="A">A - Bằng chứng cao</Select.Option>
                            <Select.Option value="B">B - Bằng chứng vừa</Select.Option>
                            <Select.Option value="C">C - Bằng chứng thấp</Select.Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default LocalAntibioticTreatment