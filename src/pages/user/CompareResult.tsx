import React, { useEffect, useState } from 'react';
import { message, Spin, Empty } from 'antd';
import PatientHeader from '../../components/user/compare_result/PatientHeader';
import TimelineHistory from '../../components/user/compare_result/TimelineHistory';
import ComparisonDetails from '../../components/user/compare_result/ComparisonDetails';
import {
    callFetchEpisodeById,
    callFetchAiRecommendationRuns,
    callFetchAiRecommendationRunDetail,
    callFetchDoctorReviewByRunId,
} from '@/apis/api';
import { IEpisode, IAiRecommendationRun, IAiRecommendationRunDetail, IDoctorRecommendationReview } from '@/types/backend';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

const CompareResult: React.FC = () => {
    const [episode, setEpisode] = useState<IEpisode | null>(null);
    const [runs, setRuns] = useState<IAiRecommendationRun[]>([]);
    const [selectedRunDetail, setSelectedRunDetail] = useState<IAiRecommendationRunDetail | null>(null);
    const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
    const [doctorReview, setDoctorReview] = useState<IDoctorRecommendationReview | null>(null);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);

    const currentCase = useSelector((state: RootState) => state.patient.currentCase);
    const episodeId = currentCase?.episode?.id;

    useEffect(() => {
        if (!episodeId) {
            setLoading(false);
            return;
        }
        fetchData();
    }, [episodeId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [episodeRes, runsRes] = await Promise.all([
                callFetchEpisodeById(episodeId),
                callFetchAiRecommendationRuns(episodeId, 'page=0&size=20&sort=createdAt,desc'),
            ]);

            if (episodeRes?.data) setEpisode(episodeRes.data);
            if (runsRes?.data?.result) {
                const allRuns = runsRes.data.result;
                setRuns(allRuns);
                if (allRuns.length > 0 && allRuns[0].id) {
                    handleSelectRun(allRuns[0].id);
                }
            }
        } catch {
            message.error('Không thể tải dữ liệu so sánh');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectRun = async (runId: string) => {
        setSelectedRunId(runId);
        setDetailLoading(true);
        setDoctorReview(null);
        try {
            const [detailRes, reviewRes] = await Promise.all([
                callFetchAiRecommendationRunDetail(runId),
                callFetchDoctorReviewByRunId(runId),
            ]);
            if (detailRes?.data) setSelectedRunDetail(detailRes.data);
            if (reviewRes?.data) setDoctorReview(reviewRes.data);
        } catch {
            message.error('Không thể tải chi tiết gợi ý AI');
        } finally {
            setDetailLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-[#f6f8fb]">
                <Spin size="large" tip="Đang tải dữ liệu..." />
            </div>
        );
    }

    if (!episodeId || !episode) {
        return (
            <div className="h-full flex items-center justify-center bg-[#f6f8fb]">
                <Empty description="Chưa chọn bệnh án. Vui lòng chọn bệnh nhân và bệnh án từ trang chẩn đoán." />
            </div>
        );
    }

    return (
        <div className="font-sans bg-[#f6f8fb] text-[#1b2430] h-full overflow-y-auto">
            {/* Top Bar */}
            <div className="bg-white text-black p-4 px-7 flex items-center justify-between border-b border-slate-200">
                <div>
                    <div className="text-xl font-bold">So sánh kết quả AI & Bác sĩ</div>
                    <div className="text-[13px] text-slate-500">
                        Lịch sử gợi ý AI và phác đồ đã được bác sĩ xác nhận
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-[12px] text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                        Episode #{episodeId}
                    </div>
                    <div className="text-[12px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 max-w-[320px] leading-relaxed">
                        Gợi ý tạo phác đồ không nên vượt quá 3 lần để tránh gây nhiễu quyết định.
                    </div>
                </div>
            </div>

            <div className="max-w-[1480px] mx-auto p-6">
                <PatientHeader episode={episode} />

                {runs.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-12">
                        <Empty description="Chưa có lần gợi ý AI nào cho bệnh án này." />
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-[440px_1fr] gap-[22px]">
                        <TimelineHistory
                            runs={runs}
                            selectedRunId={selectedRunId}
                            onSelectRun={handleSelectRun}
                        />
                        <div className="flex flex-col gap-[22px]">
                            <ComparisonDetails
                                runDetail={selectedRunDetail}
                                runs={runs}
                                selectedRunId={selectedRunId}
                                loading={detailLoading}
                                doctorReview={doctorReview}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompareResult;
