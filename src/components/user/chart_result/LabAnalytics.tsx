import { usePatient } from '@/context/PatientContext';
import React from 'react';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export const LabAnalytics: React.FC = () => {
  const { labData, updateLabData } = usePatient();

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
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={labData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            />
            <ReferenceLine y={threshold} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Giới hạn', fill: '#ef4444', fontSize: 10 }} />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide">Phác đồ PJI</span>
            <span className="text-slate-400 text-sm">/</span>
            <span className="text-slate-500 text-sm font-medium">Kết quả xét nghiệm</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Phân tích chỉ số huyết thanh</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
        <div className="max-w-[1600px] mx-auto w-full space-y-8">

          {/* Data Entry Table */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">table_chart</span>
                Nhập dữ liệu lâm sàng
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/5">Chỉ số</th>
                    {labData.map(d => (
                      <th key={d.day} className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">{d.day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { label: 'Bạch cầu (WBC)', key: 'wbc', unit: '10^9/L', alert: 10 },
                    { label: 'Bạch cầu đa nhân (Neu%)', key: 'neu', unit: '%', alert: 75 },
                    { label: 'ESR', key: 'esr', unit: 'mm/hr', alert: 30 },
                    { label: 'CRP', key: 'crp', unit: 'mg/L', alert: 10 },
                  ].map((marker) => (
                    <tr key={marker.key} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{marker.label}</span>
                          <span className="text-xs text-slate-500">{marker.unit}</span>
                        </div>
                      </td>
                      {labData.map(d => {
                        const val = d[marker.key as keyof typeof d] as number;
                        const isHigh = val > marker.alert;
                        return (
                          <td key={d.day} className="px-4 py-3">
                            <div className="relative">
                              <input
                                type="number"
                                value={val || ''}
                                onChange={(e) => updateLabData(d.day, marker.key as any, parseFloat(e.target.value))}
                                className={`w-full rounded p-2 text-sm font-mono border focus:ring-1 ${isHigh ? 'bg-red-50 border-red-200 text-red-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                              />
                              {isHigh && <span className="material-symbols-outlined text-[16px] text-red-500 absolute right-3 top-1/2 -translate-y-1/2">warning</span>}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderChart('Bạch cầu (WBC)', 'wbc', 10, '#136dec', '10^9/L')}
            {renderChart('Bạch cầu đa nhân (Neu%)', 'neu', 75, '#f59e0b', '%')}
            {renderChart('ESR', 'esr', 30, '#ef4444', 'mm/hr')}
            {renderChart('C-Reactive Protein (CRP)', 'crp', 10, '#ef4444', 'mg/L')}
          </div>

        </div>
      </div>
    </div>
  );
};