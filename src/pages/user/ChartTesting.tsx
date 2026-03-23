import React, { useEffect, useState } from 'react';
import { message, Spin, Empty } from 'antd';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { callFetchEpisodesByPatient, callFetchLabResultsByEpisode } from '@/apis/api';
import { IEpisode, ILabResult } from '@/types/backend';
import { LabAnalytics } from '@/components/user/chart_result/LabAnalytics';
import dayjs from 'dayjs';

export interface IChartDataPoint {
    date: string;
    wbc: number | null;
    neu: number | null;
    esr: number | null;
    crp: number | null;
    episodeId: string;
}

const ChartTesting: React.FC = () => {
    const currentCase = useSelector((state: RootState) => state.patient.currentCase);
    const patientId = currentCase?.patient?.id;

    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState<IChartDataPoint[]>([]);
    const [episodes, setEpisodes] = useState<IEpisode[]>([]);

    useEffect(() => {
        if (!patientId) {
            setLoading(false);
            return;
        }
        fetchAllLabData();
    }, [patientId]);

    const fetchAllLabData = async () => {
        setLoading(true);
        try {
            // 1. Fetch all episodes for patient
            const episodeRes = await callFetchEpisodesByPatient(
                patientId!,
                'page=0&size=100&sort=admissionDate,asc'
            );
            const allEpisodes: IEpisode[] = episodeRes?.data?.result || [];
            setEpisodes(allEpisodes);

            // 2. For each episode, fetch lab results
            const labPromises = allEpisodes.map((ep) =>
                ep.id
                    ? callFetchLabResultsByEpisode(ep.id, 'page=0&size=100&sort=updatedAt,asc')
                    : Promise.resolve(null)
            );
            const labResults = await Promise.all(labPromises);

            // 3. Flatten and map to chart data points
            const points: IChartDataPoint[] = [];
            labResults.forEach((res, idx) => {
                const labs: ILabResult[] = res?.data?.result || [];
                const epId = allEpisodes[idx]?.id || '';
                labs.forEach((lab) => {
                    points.push({
                        date: lab.updatedAt
                            ? dayjs(lab.updatedAt).format('DD/MM/YYYY')
                            : 'N/A',
                        wbc: lab.wbcBlood?.value ?? null,
                        neu: lab.neut?.value ?? null,
                        esr: lab.esr?.value ?? null,
                        crp: lab.crp?.value ?? null,
                        episodeId: epId,
                    });
                });
            });

            // Sort by date
            points.sort((a, b) => {
                const da = dayjs(a.date, 'DD/MM/YYYY');
                const db = dayjs(b.date, 'DD/MM/YYYY');
                return da.valueOf() - db.valueOf();
            });

            setChartData(points);
        } catch {
            message.error('Không thể tải dữ liệu xét nghiệm');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-[#f6f8fb]">
                <Spin size="large" tip="Đang tải dữ liệu..." />
            </div>
        );
    }

    if (!patientId || !currentCase) {
        return (
            <div className="h-full flex items-center justify-center bg-[#f6f8fb]">
                <Empty description="Chưa chọn bệnh nhân. Vui lòng chọn bệnh nhân và bệnh án từ trang chẩn đoán." />
            </div>
        );
    }

    return (
        <LabAnalytics
            chartData={chartData}
            patient={currentCase.patient}
            episodes={episodes}
        />
    );
};

export default ChartTesting;
