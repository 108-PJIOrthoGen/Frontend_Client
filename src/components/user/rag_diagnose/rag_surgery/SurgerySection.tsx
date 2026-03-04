import { SurgeryStep } from '@/types/types';
import React, { useState } from 'react'
import ProtocolField from './ProtocolField';
import StepCard from './StepCard';

const PlusIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
); const ScalpelIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 2L8 14M8 14L4 18C3 19 3 21 5 21C6.5 21 7.5 20 8 19L14 13M8 14L14 8" />
        <circle cx="19" cy="5" r="1" fill="currentColor" />
    </svg>
);
const SurgerySection = () => {
    const initialSteps: SurgeryStep[] = [
        {
            id: 1, step: 1,
            name: "Tháo khớp + đặt spacer kháng sinh",
            description: "Tháo bỏ khớp nhân tạo bị nhiễm trùng, làm sạch ổ khớp triệt để, đặt spacer xi măng có chứa kháng sinh (Gentamicin + Vancomycin).",
            duration: "2–3 giờ",
            timing: "Ngay sau chẩn đoán xác định",
            surgeon: "PTV Chấn thương chỉnh hình",
            notes: "Cần cấy khuẩn mô trong mổ ≥5 mẫu. Tránh đóng da căng.",
            risk: "Cao",
            status: "Bắt buộc",
        },
        {
            id: 2, step: 2,
            name: "Thay khớp lại (Revision TKA)",
            description: "Thay thế spacer bằng khớp nhân tạo mới sau khi kiểm soát hoàn toàn nhiễm trùng. Đánh giá CRP, VS, hút dịch khớp trước mổ.",
            duration: "3–4 giờ",
            timing: "Tuần 8–12 (sau khi CRP < 10 mg/L)",
            surgeon: "PTV Chấn thương chỉnh hình",
            notes: "Dùng kháng sinh dự phòng Cefazolin 1g IV trước mổ 30'. Kiểm tra vi sinh dịch khớp âm tính.",
            risk: "Trung bình",
            status: "Bắt buộc",
        },
    ];
    const [steps, setSteps] = useState<SurgeryStep[]>(initialSteps);
    const [approach, setApproach] = useState("2 giai đoạn (Two-stage exchange)");
    const [anesthesia, setAnesthesia] = useState("Gây tê tủy sống");
    const [antibioticProtocol, setAntibioticProtocol] = useState("Cefazolin 1g IV x 3 liều");
    const [priority, setPriority] = useState<"Khẩn cấp" | "Ưu tiên" | "Thường quy">("Ưu tiên");

    const handleDelete = (id: number) => setSteps(s => s.filter(x => x.id !== id));
    const handleEdit = (id: number) => alert(`Mở form chỉnh sửa bước ID: ${id}`);
    const handleAdd = () => alert("Mở form thêm bước phẫu thuật mới");

    const priorityStyle: Record<string, { bg: string; color: string; dot: string }> = {
        "Khẩn cấp": { bg: "rgba(239,68,68,0.15)", color: "#f87171", dot: "#ef4444" },
        "Ưu tiên": { bg: "rgba(251,191,36,0.15)", color: "#fbbf24", dot: "#f59e0b" },
        "Thường quy": { bg: "rgba(34,197,94,0.15)", color: "#4ade80", dot: "#22c55e" },
    };
    const pr = priorityStyle[priority];

    return (
        <div style={{
            border: "1px solid rgba(148, 164, 250, 0.41)",
            borderRadius: "12px",
            background: "rgba(202, 185, 185, 0.5)",
            backdropFilter: "blur(8px)",
            overflow: "hidden",
            fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif",
        }}>
            {/* Section Header */}
            <div style={{
                padding: "12px 14px",
                background: "linear-gradient(135deg, rgba(246, 246, 248, 0.88), rgba(208, 213, 226, 0.6))",
                borderBottom: "1px solid rgba(100,116,139,0.2)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{
                        width: "30px", height: "30px", borderRadius: "8px",
                        background: "linear-gradient(135deg, #1e3a8a, #2563eb)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 2px 10px rgba(37,99,235,0.35)",
                    }}>
                        <ScalpelIcon />
                    </div>
                    <div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#0d0d0e", letterSpacing: "0.04em" }}>
                            PHÁC ĐỒ PHẪU THUẬT
                        </div>
                        <div style={{ fontSize: "10px", color: "#64748b", letterSpacing: "0.03em" }}>
                            {steps.length} bước · Surgical Protocol
                        </div>
                    </div>
                </div>

                {/* Priority selector */}
                <div style={{ display: "flex", gap: "4px" }}>
                    {(["Thường quy", "Ưu tiên", "Khẩn cấp"] as const).map(p => {
                        const s = priorityStyle[p];
                        const active = priority === p;
                        return (
                            <button key={p} onClick={() => setPriority(p)} style={{
                                fontSize: "10px", fontWeight: 600, padding: "3px 9px", borderRadius: "20px", cursor: "pointer",
                                background: active ? s.bg : "transparent",
                                color: active ? s.color : "#475569",
                                border: active ? `1px solid ${s.dot}40` : "1px solid rgba(100,116,139,0.2)",
                                transition: "all 0.15s",
                            }}>{p}</button>
                        );
                    })}
                </div>
            </div>

            <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>

                {/* Protocol overview */}
                <div style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px",
                }}>
                    <ProtocolField label="Phương pháp tiếp cận"
                        value={approach}
                        onChange={setApproach}
                        accent="#60a5fa"
                    />
                    <ProtocolField label="Phương pháp vô cảm"
                        value={anesthesia}
                        onChange={setAnesthesia}
                        accent="#a78bfa"
                    />
                    <ProtocolField label="Kháng sinh dự phòng"
                        value={antibioticProtocol}
                        onChange={setAntibioticProtocol}
                        accent="#34d399"
                    />
                </div>

                {/* Divider */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ flex: 1, height: "1px", background: "rgba(134, 179, 243, 0.2)" }} />
                    <span style={{ fontSize: "10px", color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                        Các bước phẫu thuật
                    </span>
                    <div style={{ flex: 1, height: "1px", background: "rgba(100,116,139,0.2)" }} />
                </div>

                {/* Steps */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {steps.map(step => (
                        <StepCard key={step.id} step={step} onEdit={handleEdit} onDelete={handleDelete} />
                    ))}
                </div>

                {/* Add button */}
                <button onClick={handleAdd} style={{
                    width: "100%", padding: "9px", borderRadius: "8px", cursor: "pointer",
                    background: "rgba(37,99,235,0.08)",
                    border: "1px dashed rgba(96,165,250,0.35)",
                    color: "#60a5fa", fontSize: "12px", fontWeight: 600,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                    transition: "all 0.2s", letterSpacing: "0.02em",
                }}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(37,99,235,0.15)";
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(96,165,250,0.6)";
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(37,99,235,0.08)";
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(96,165,250,0.35)";
                    }}
                >
                    <PlusIcon /> Thêm bước phẫu thuật
                </button>

                {/* Footer summary */}
                <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 12px", borderRadius: "8px",
                    background: "rgba(2,6,23,0.5)", border: "1px solid rgba(100,116,139,0.15)",
                }}>
                    <span style={{ fontSize: "11px", color: "#475569" }}>
                        Mức độ ưu tiên phẫu thuật:
                        <span style={{ marginLeft: "6px", color: pr.color, fontWeight: 600 }}>
                            <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: pr.dot, marginRight: "4px", verticalAlign: "middle" }} />
                            {priority}
                        </span>
                    </span>
                    <span style={{ fontSize: "11px", color: "#475569" }}>
                        Tổng thời gian ước tính: <span style={{ color: "#94a3b8", fontWeight: 600 }}>5–7 giờ</span>
                    </span>
                </div>
            </div>
        </div>
    )
}

export default SurgerySection