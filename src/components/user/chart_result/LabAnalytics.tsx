import React from 'react';
import { Empty, Tag } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { IChartDataPoint } from '@/pages/user/ChartTesting';
import { IPatient, IEpisode } from '@/types/backend';
import dayjs from 'dayjs';

interface LabAnalyticsProps {
    chartData: IChartDataPoint[];
    patient: IPatient;
    episodes: IEpisode[];
}

export const LabAnalytics: React.FC<LabAnalyticsProps> = ({ chartData, patient, episodes }) => {

    const renderChart = (title: string, dataKey: string, threshold: number, color: string, unit: string) => (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="font-bold text-slate-900">{title}</h3>
                    <p className="text-xs text-slate-500">Ngưỡng: &gt;{threshold} {unit}</p>
                </div>
                <div className="bg-slate-100 p-1.5 rounded-lg">
                    <span className="material-symbols-outlined text-slate-500 text-[20px]">show_chart</span>
                </div>
            </div>
            {chartData.length > 0 ? (
                <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#64748b' }}
                                angle={-30}
                                textAnchor="end"
                                height={50}
                            />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                formatter={(value: number) => [value != null ? `${value} ${unit}` : 'N/A', title]}
                                labelFormatter={(label) => `Ngày: ${label}`}
                            />
                            <ReferenceLine
                                y={threshold}
                                stroke="#ef4444"
                                strokeDasharray="3 3"
                                label={{ position: 'top', value: 'Giới hạn', fill: '#ef4444', fontSize: 10 }}
                            />
                            <Line
                                type="monotone"
                                dataKey={dataKey}
                                stroke={color}
                                strokeWidth={2}
                                dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                activeDot={{ r: 6 }}
                                connectNulls
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="h-52 flex items-center justify-center">
                    <Empty description="Chưa có dữ liệu" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </div>
            )}
        </div>
    );

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4 flex-shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide">Phác đồ PJI</span>
                        <span className="text-slate-400 text-sm">/</span>
                        <span className="text-slate-500 text-sm font-medium">Biểu đồ chỉ số viêm</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Phân tích chỉ số huyết thanh</h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-[12px] text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                        BN: <span className="font-semibold">{patient.fullName}</span> — Mã: {patient.patientCode || 'N/A'}
                    </div>
                    <div className="text-[12px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                        {episodes.length} bệnh án · {chartData.length} mẫu xét nghiệm
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                <div className="max-w-[1600px] mx-auto w-full space-y-8">
                    {/* Episode summary */}
                    {episodes.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {episodes.map((ep) => (
                                <Tag key={ep.id} color="blue" className="text-xs px-2 py-0.5">
                                    Bệnh án #{ep.id} — {ep.admissionDate ? dayjs(ep.admissionDate).format('DD/MM/YYYY') : 'N/A'}
                                </Tag>
                            ))}
                        </div>
                    )}

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderChart('Bạch cầu (WBC)', 'wbc', 10, '#136dec', '10⁹/L')}
                        {renderChart('Bạch cầu đa nhân (Neu%)', 'neu', 75, '#f59e0b', '%')}
                        {renderChart('Tốc độ lắng máu (ESR)', 'esr', 30, '#ef4444', 'mm/hr')}
                        {renderChart('C-Reactive Protein (CRP)', 'crp', 10, '#8b5cf6', 'mg/L')}
                    </div>
                </div>
            </div>
        </div>
    );
};
