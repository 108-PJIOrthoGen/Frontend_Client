import { useState, useEffect } from "react";
import { Card, Col, Row, Typography, Timeline, Spin, Tag, Empty, Divider } from "antd";
import {
    UserOutlined,
    TeamOutlined,
    MedicineBoxOutlined,
    FileTextOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    SyncOutlined,
    StopOutlined,
} from "@ant-design/icons";
import { callFetchUser, callFetchPatient, callFetchEpisodes } from "@/apis/api";
import { IEpisode } from "@/types/backend";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const { Title, Text } = Typography;

interface DashboardStats {
    totalPatients: number;
    totalUsers: number;
    totalEpisodes: number;
    activeCount: number;
    completedCount: number;
    cancelledCount: number;
}

const STAT_CARDS = [
    {
        key: "totalPatients" as keyof DashboardStats,
        label: "Tổng bệnh nhân",
        icon: <UserOutlined />,
        color: "#2563eb",
        bg: "#eff6ff",
        border: "#bfdbfe",
    },
    {
        key: "activeCount" as keyof DashboardStats,
        label: "Đang điều trị",
        icon: <SyncOutlined spin />,
        color: "#16a34a",
        bg: "#f0fdf4",
        border: "#bbf7d0",
    },
    {
        key: "totalEpisodes" as keyof DashboardStats,
        label: "Tổng đợt điều trị",
        icon: <FileTextOutlined />,
        color: "#7c3aed",
        bg: "#faf5ff",
        border: "#ddd6fe",
    },
    {
        key: "totalUsers" as keyof DashboardStats,
        label: "Nhân viên hệ thống",
        icon: <TeamOutlined />,
        color: "#d97706",
        bg: "#fffbeb",
        border: "#fde68a",
    },
];

const getStatusConfig = (status?: string) => {
    switch (status) {
        case "active":
            return { color: "blue", label: "Đang điều trị", dot: "blue", icon: <SyncOutlined /> };
        case "completed":
            return { color: "success", label: "Hoàn thành", dot: "green", icon: <CheckCircleOutlined /> };
        case "cancelled":
            return { color: "error", label: "Đã hủy", dot: "red", icon: <StopOutlined /> };
        default:
            return { color: "default", label: status || "N/A", dot: "gray", icon: <ClockCircleOutlined /> };
    }
};

const AdminHome = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats>({
        totalPatients: 0,
        totalUsers: 0,
        totalEpisodes: 0,
        activeCount: 0,
        completedCount: 0,
        cancelledCount: 0,
    });
    const [recentEpisodes, setRecentEpisodes] = useState<IEpisode[]>([]);

    useEffect(() => {
        const loadDashboard = async () => {
            setLoading(true);
            try {
                const [usersRes, patientsRes, episodesRes, recentRes] = await Promise.all([
                    callFetchUser("page=0&size=1"),
                    callFetchPatient("page=0&size=1"),
                    callFetchEpisodes("page=0&size=1"),
                    callFetchEpisodes("page=0&size=10&sort=createdAt,desc"),
                ]);

                const episodes: IEpisode[] = recentRes?.data?.result ?? [];
                setRecentEpisodes(episodes);
                setStats({
                    totalPatients: patientsRes?.data?.meta?.total ?? 0,
                    totalUsers: usersRes?.data?.meta?.total ?? 0,
                    totalEpisodes: episodesRes?.data?.meta?.total ?? 0,
                    activeCount: episodes.filter((e) => e.status === "active").length,
                    completedCount: episodes.filter((e) => e.status === "completed").length,
                    cancelledCount: episodes.filter((e) => e.status === "cancelled").length,
                });
            } catch {
                // silently fail — stats stay at 0
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, []);

    return (
        <div className="layout-content" style={{ padding: "0 4px" }}>
            {/* Stat cards */}
            <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
                {STAT_CARDS.map((card) => (
                    <Col key={card.key} xs={24} sm={12} lg={6}>
                        <Card
                            bordered={false}
                            style={{
                                borderRadius: 14,
                                boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
                                border: `1px solid ${card.border}`,
                                background: "#fff",
                                height: "100%",
                            }}
                            bodyStyle={{ padding: "20px 24px" }}
                        >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div>
                                    <Text
                                        style={{ fontSize: 12, color: "#6b7280", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}
                                    >
                                        {card.label}
                                    </Text>
                                    <div style={{ marginTop: 8 }}>
                                        {loading ? (
                                            <Spin size="small" />
                                        ) : (
                                            <span style={{ fontSize: 32, fontWeight: 700, color: card.color, lineHeight: 1 }}>
                                                {stats[card.key].toLocaleString("vi-VN")}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div
                                    style={{
                                        width: 52,
                                        height: 52,
                                        borderRadius: "50%",
                                        background: card.bg,
                                        border: `1px solid ${card.border}`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 22,
                                        color: card.color,
                                        flexShrink: 0,
                                    }}
                                >
                                    {card.icon}
                                </div>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Main panels */}
            <Row gutter={[20, 20]}>
                {/* Timeline */}
                <Col xs={24} lg={15}>
                    <Card
                        bordered={false}
                        style={{ borderRadius: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.07)", height: "100%" }}
                        title={
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <ClockCircleOutlined style={{ color: "#2563eb" }} />
                                <span style={{ fontWeight: 600 }}>Đợt điều trị gần đây</span>
                            </div>
                        }
                    >
                        {loading ? (
                            <div style={{ textAlign: "center", padding: "48px 0" }}>
                                <Spin size="large" />
                            </div>
                        ) : recentEpisodes.length === 0 ? (
                            <Empty description="Chưa có đợt điều trị nào" style={{ padding: "32px 0" }} />
                        ) : (
                            <Timeline style={{ marginTop: 8 }}>
                                {recentEpisodes.map((ep, i) => {
                                    const cfg = getStatusConfig(ep.status);
                                    return (
                                        <Timeline.Item key={i} color={cfg.dot}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "flex-start",
                                                    justifyContent: "space-between",
                                                    gap: 12,
                                                    padding: "4px 0",
                                                }}
                                            >
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                                        <span style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>
                                                            {ep.patient?.fullName || `Bệnh nhân #${ep.patientId}`}
                                                        </span>
                                                        {ep.patient?.patientCode && (
                                                            <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>
                                                                {ep.patient.patientCode}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{ marginTop: 4, display: "flex", gap: 12, flexWrap: "wrap" }}>
                                                        {ep.department && (
                                                            <span style={{ fontSize: 12, color: "#6b7280" }}>
                                                                <MedicineBoxOutlined style={{ marginRight: 4 }} />
                                                                {ep.department}
                                                            </span>
                                                        )}
                                                        {ep.admissionDate && (
                                                            <span style={{ fontSize: 12, color: "#6b7280" }}>
                                                                Nhập: {dayjs(ep.admissionDate).format("DD/MM/YYYY")}
                                                            </span>
                                                        )}
                                                        {ep.dischargeDate && (
                                                            <span style={{ fontSize: 12, color: "#6b7280" }}>
                                                                Xuất: {dayjs(ep.dischargeDate).format("DD/MM/YYYY")}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {ep.reason && (
                                                        <div style={{ marginTop: 2, fontSize: 12, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                            {ep.reason}
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ flexShrink: 0 }}>
                                                    <Tag color={cfg.color} icon={cfg.icon} style={{ borderRadius: 999, fontSize: 11 }}>
                                                        {cfg.label}
                                                    </Tag>
                                                </div>
                                            </div>
                                        </Timeline.Item>
                                    );
                                })}
                            </Timeline>
                        )}
                    </Card>
                </Col>

                {/* Summary panel */}
                <Col xs={24} lg={9}>
                    <Card
                        bordered={false}
                        style={{ borderRadius: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.07)", height: "100%" }}
                        title={
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <CheckCircleOutlined style={{ color: "#16a34a" }} />
                                <span style={{ fontWeight: 600 }}>Tổng quan hệ thống</span>
                            </div>
                        }
                    >
                        <Spin spinning={loading}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                                {[
                                    {
                                        label: "Tổng bệnh nhân",
                                        sub: "Toàn hệ thống",
                                        value: stats.totalPatients,
                                        color: "#2563eb",
                                        bg: "#eff6ff",
                                        icon: <UserOutlined />,
                                    },
                                    {
                                        label: "Nhân viên",
                                        sub: "Đang hoạt động",
                                        value: stats.totalUsers,
                                        color: "#d97706",
                                        bg: "#fffbeb",
                                        icon: <TeamOutlined />,
                                    },
                                    {
                                        label: "Đang điều trị",
                                        sub: "10 đợt gần nhất",
                                        value: stats.activeCount,
                                        color: "#16a34a",
                                        bg: "#f0fdf4",
                                        icon: <SyncOutlined />,
                                    },
                                    {
                                        label: "Hoàn thành",
                                        sub: "10 đợt gần nhất",
                                        value: stats.completedCount,
                                        color: "#7c3aed",
                                        bg: "#faf5ff",
                                        icon: <CheckCircleOutlined />,
                                    },
                                    {
                                        label: "Đã hủy",
                                        sub: "10 đợt gần nhất",
                                        value: stats.cancelledCount,
                                        color: "#dc2626",
                                        bg: "#fef2f2",
                                        icon: <StopOutlined />,
                                    },
                                ].map((item, i, arr) => (
                                    <div key={item.label}>
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                padding: "14px 16px",
                                                borderRadius: 10,
                                                background: item.bg,
                                                margin: "6px 0",
                                            }}
                                        >
                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                <div
                                                    style={{
                                                        width: 36,
                                                        height: 36,
                                                        borderRadius: "50%",
                                                        background: "#fff",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        color: item.color,
                                                        fontSize: 16,
                                                        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                                                    }}
                                                >
                                                    {item.icon}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{item.label}</div>
                                                    <div style={{ fontSize: 11, color: "#9ca3af" }}>{item.sub}</div>
                                                </div>
                                            </div>
                                            <div style={{ fontSize: 22, fontWeight: 700, color: item.color }}>{item.value.toLocaleString("vi-VN")}</div>
                                        </div>
                                        {i < arr.length - 1 && <Divider style={{ margin: "0 16px" }} />}
                                    </div>
                                ))}
                            </div>
                        </Spin>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default AdminHome;
