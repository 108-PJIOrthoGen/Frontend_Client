import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Drawer, Spin, Modal, Result, message, Select } from 'antd';
import { SendOutlined } from '@ant-design/icons';

import SurgerySection from '../rag_diagnose/rag_surgery/SurgerySection';
import type { SurgerySectionHandle } from '../rag_diagnose/rag_surgery/SurgerySection';
import LocalAntibioticTreatment from '../rag_diagnose/rag_antibiolocal/LocalAntibioticTreatment';
import { SystemicAntibioticTreatment } from '../rag_diagnose/rag_antibiolocal/SystemicAntibioticTreatment';
import type { SystemicAntibioticTreatmentHandle } from '../rag_diagnose/rag_antibiolocal/SystemicAntibioticTreatment';
import type { LocalAntibioticTreatmentHandle } from '../rag_diagnose/rag_antibiolocal/LocalAntibioticTreatment';
import ReactMarkdown from 'react-markdown';
import hardenReactMarkdown from 'harden-react-markdown';
import type {
    SurgeryPlanData,
    SystemicPlanData,
    LocalPlanData,
    CitationData,
} from '@/types/treatmentType';
import { clearCurrentCase } from '@/redux/slice/patientSlice';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { callFetchAiRecommendationRunDetail, callCreateDoctorReview, callFetchAiChatSessionsByEpisode, callCreateAiChatSession, callFetchAiChatMessages, callSendAiChatMessage } from '@/apis/api';
import type { IAiRecommendationRunDetail, IAiRagCitation, IAiChatSession, IAiChatMessage } from '@/types/backend';

interface Step5Props {
    onPrev: () => void;
    onBackToFirstStep: () => void;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const snakeToCamelKey = (str: string): string =>
    str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

const snakeToCamel = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(snakeToCamel);
    if (obj !== null && typeof obj === 'object') {
        return Object.fromEntries(
            Object.entries(obj).map(([k, v]) => [snakeToCamelKey(k), snakeToCamel(v)])
        );
    }
    return obj;
};

// Camel-case keys whose values must render as arrays. If the LLM drifts and
// emits a string (e.g. "monitoring": "Theo dõi CRP mỗi tuần"), coerce it so
// downstream `.map(...)` calls don't blow up the page. Stale items already
// persisted in localStorage / DB pass through this same path on read.
const ARRAY_FIELDS = new Set([
    'monitoring',
    'contraindications',
    'antibiotics',
    'phases',
    'stages',
    'risksAndComplications',
    'preconditions',
    'items',
    'warnings',
]);

const coerceListFields = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(coerceListFields);
    if (obj !== null && typeof obj === 'object') {
        return Object.fromEntries(
            Object.entries(obj).map(([k, v]) => {
                const recursed = coerceListFields(v);
                if (ARRAY_FIELDS.has(k) && !Array.isArray(recursed)) {
                    if (recursed === null || recursed === undefined || recursed === '') return [k, []];
                    return [k, [recursed]];
                }
                return [k, recursed];
            })
        );
    }
    return obj;
};

const parseItemJson = (item: { itemJson?: Record<string, any> } | undefined) => {
    if (!item?.itemJson) return null;
    const raw = typeof item.itemJson === 'string' ? JSON.parse(item.itemJson) : item.itemJson;
    return coerceListFields(snakeToCamel(raw));
};

const mapCitations = (citations?: IAiRagCitation[]): CitationData[] => {
    if (!citations?.length) return [];
    return citations.map(c => ({
        sourceType: c.sourceType ?? '',
        sourceTitle: c.sourceTitle ?? '',
        sourceUri: c.sourceUri ?? '',
        snippet: c.snippet ?? '',
        relevanceScore: c.relevanceScore ?? 0,
        citedFor: c.citedFor ?? '',
    }));
};

const HardenedMarkdown = hardenReactMarkdown(ReactMarkdown);

export const Step5TreatmentPlan: React.FC<Step5Props> = ({ onPrev, onBackToFirstStep }) => {
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewNote, setReviewNote] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const dispatch = useDispatch();
    const currentCase = useSelector((state: RootState) => state.patient.currentCase);
    const episodeId = currentCase?.episode?.id;

    const surgeryRef = useRef<SurgerySectionHandle>(null);
    const systemicRef = useRef<SystemicAntibioticTreatmentHandle>(null);
    const localRef = useRef<LocalAntibioticTreatmentHandle>(null);
    const runIdRef = useRef<string | null>(null);

    const [surgeryPlan, setSurgeryPlan] = useState<SurgeryPlanData | null>(null);
    const [systemicPlan, setSystemicPlan] = useState<SystemicPlanData | null>(null);
    const [localPlan, setLocalPlan] = useState<LocalPlanData | null>(null);
    const [citations, setCitations] = useState<CitationData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [sessions, setSessions] = useState<IAiChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [isFetchingSessions, setIsFetchingSessions] = useState(false);
    const [isFetchingMessages, setIsFetchingMessages] = useState(false);

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const handleCreateNewSession = async () => {
        if (!episodeId) return;
        setIsFetchingSessions(true);
        try {
            const now = new Date();
            const title = `Chat lúc ${now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${now.toLocaleDateString('vi-VN')}`;
            const res = await callCreateAiChatSession({
                episodeId: Number(episodeId),
                runId: runIdRef.current ? Number(runIdRef.current) : undefined,
                chatType: 'GENERAL',
                title: title
            });
            if (res?.data?.id) {
                const newId = String(res.data.id);
                setSessions(prev => [res.data as IAiChatSession, ...prev]);
                setCurrentSessionId(newId);
            }
        } catch (error) {
            message.error("Lỗi khi tạo phiên chat mới");
        } finally {
            setIsFetchingSessions(false);
        }
    };

    const loadSessions = async () => {
        if (!episodeId) return;
        setIsFetchingSessions(true);
        try {
            const res = await callFetchAiChatSessionsByEpisode(String(episodeId), "sort=createdAt,desc&size=50");
            const fetchedSessions = res?.data?.result ?? [];
            setSessions(fetchedSessions);
            if (fetchedSessions.length > 0 && !currentSessionId) {
                setCurrentSessionId(String(fetchedSessions[0].id));
            } else if (fetchedSessions.length === 0) {
                await handleCreateNewSession();
            }
        } catch (error) {
            message.error("Lỗi khi tải lịch sử chat");
        } finally {
            setIsFetchingSessions(false);
        }
    };

    const loadMessagesForSession = async (sessionId: string) => {
        setIsFetchingMessages(true);
        try {
            const res = await callFetchAiChatMessages(sessionId, "sort=createdAt,asc&size=500");
            const fetchedMsgs = res?.data?.result ?? [];
            const mapped: Message[] = fetchedMsgs.map((m: IAiChatMessage) => ({
                id: String(m.id),
                role: m.role as 'user' | 'assistant',
                content: m.content || '',
                timestamp: m.createdAt ? new Date(m.createdAt) : new Date(),
            }));

            if (mapped.length === 0) {
                mapped.push({
                    id: 'greeting',
                    role: 'assistant',
                    content: 'Xin chào! Tôi là trợ lý AI. Bạn có thể hỏi tôi bất kỳ điều gì về phác đồ điều trị, kháng sinh, hay phẫu thuật trên.',
                    timestamp: new Date()
                });
            }
            setMessages(mapped);
        } catch (error) {
            message.error("Lỗi khi tải tin nhắn");
        } finally {
            setIsFetchingMessages(false);
        }
    };

    useEffect(() => {
        if (isChatOpen) {
            loadSessions();
        }
    }, [isChatOpen, episodeId]);

    useEffect(() => {
        if (currentSessionId && isChatOpen) {
            loadMessagesForSession(currentSessionId);
        }
    }, [currentSessionId, isChatOpen]);

    useEffect(() => {
        const loadRunDetail = async () => {
            setIsLoading(true);
            try {
                // Try localStorage cache first, then fetch fresh
                let detail: IAiRecommendationRunDetail | null = null;
                const cachedDetail = localStorage.getItem('pji_aiRunDetail');
                const runId = localStorage.getItem('pji_aiRunId');

                if (cachedDetail) {
                    detail = JSON.parse(cachedDetail);
                } else if (runId) {
                    const res = await callFetchAiRecommendationRunDetail(runId);
                    detail = res?.data ?? null;
                }

                if (!detail?.items?.length) {
                    setLoadError('Không tìm thấy dữ liệu gợi ý. Vui lòng quay lại bước trước.');
                    return;
                }

                if (detail.run?.id) {
                    runIdRef.current = String(detail.run.id);
                }

                const items = detail.items;

                const surgeryItem = items.find(i => i.category === 'SURGERY_PROCEDURE');
                if (surgeryItem) setSurgeryPlan(parseItemJson(surgeryItem) as SurgeryPlanData);

                const systemicItem = items.find(i => i.category === 'SYSTEMIC_ANTIBIOTIC');
                if (systemicItem) setSystemicPlan(parseItemJson(systemicItem) as SystemicPlanData);

                const localItem = items.find(i => i.category === 'LOCAL_ANTIBIOTIC');
                if (localItem) setLocalPlan(parseItemJson(localItem) as LocalPlanData);

                setCitations(mapCitations(detail.citations));
            } catch (err: any) {
                setLoadError(err?.message || 'Lỗi khi tải dữ liệu phác đồ');
            } finally {
                setIsLoading(false);
            }
        };

        loadRunDetail();
    }, []);

    const openReviewModal = () => {
        if (!episodeId || !runIdRef.current) {
            message.error('Thiếu thông tin bệnh án hoặc lần gợi ý AI.');
            return;
        }
        setReviewNote('');
        setRejectionReason('');
        setIsReviewModalOpen(true);
    };

    const handleConfirmTreatment = async () => {
        setIsReviewModalOpen(false);
        setIsSaving(true);
        try {
            const currentSurgery = surgeryRef.current?.getData() ?? null;
            const currentSystemic = systemicRef.current?.getData() ?? null;
            const currentLocal = localRef.current?.getData() ?? null;

            const hasModification =
                (currentSurgery && JSON.stringify(currentSurgery) !== JSON.stringify(surgeryPlan)) ||
                (currentSystemic && JSON.stringify(currentSystemic) !== JSON.stringify(systemicPlan)) ||
                (currentLocal && JSON.stringify(currentLocal) !== JSON.stringify(localPlan));
            const reviewStatus = rejectionReason ? 'REJECTED' : hasModification ? 'MODIFIED' : 'ACCEPTED';

            const modificationJson: Record<string, any> = {};
            if (currentSurgery) modificationJson.surgery = currentSurgery;
            if (currentSystemic) modificationJson.systemicAntibiotic = currentSystemic;
            if (currentLocal) modificationJson.localAntibiotic = currentLocal;

            await callCreateDoctorReview(String(episodeId), {
                runId: Number(runIdRef.current),
                reviewStatus,
                reviewNote: reviewNote || undefined,
                modificationJson: hasModification ? modificationJson : undefined,
                rejectionReason: rejectionReason || undefined,
            });

            setIsSuccessModalOpen(true);
        } catch {
            message.error('Lỗi khi lưu xác nhận phác đồ.');
        } finally {
            setIsSaving(false);
        }
    };

    const backToHomepage = () => {
        localStorage.removeItem('pji_aiRunId');
        localStorage.removeItem('pji_aiRunDetail');
        localStorage.removeItem('pji_selectedPatientId');
        localStorage.removeItem('pji_selectedExamId');
        dispatch(clearCurrentCase());
        onBackToFirstStep();
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (text: string) => {
        if (!text.trim() || !currentSessionId) return;

        const userMsgContent = text.trim();
        setInputValue('');

        const optimisticUserMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: userMsgContent,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, optimisticUserMsg]);
        setIsChatLoading(true);

        try {
            const res = await callSendAiChatMessage(currentSessionId, {
                content: userMsgContent,
                useEpisodeContext: true,
                useRunContext: true,
                useChatHistory: true
            });

            if (res?.data) {
                const aiData = res.data;
                const aiMsg: Message = {
                    id: String(aiData.id),
                    role: 'assistant',
                    content: aiData.content || '',
                    timestamp: aiData.createdAt ? new Date(aiData.createdAt) : new Date()
                };
                setMessages(prev => [...prev, aiMsg]);
            }
        } catch (error: any) {
            message.error(error?.response?.data?.message || "Lỗi kết nối với AI");
            setMessages(prev => prev.filter(m => m.id !== optimisticUserMsg.id));
        } finally {
            setIsChatLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Spin size="large" tip="Đang tải dữ liệu phác đồ..." />
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="flex items-center justify-center h-full">
                <Result
                    status="warning"
                    title={loadError}
                    extra={
                        <Button onClick={onPrev} type="primary">
                            Quay lại
                        </Button>
                    }
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 w-full relative bg-slate-50 min-h-full">
            {/* Premium Header */}
            <header className="flex-shrink-0 bg-white/80 backdrop-blur-md border-b justify-between border-slate-200/60 px-6 py-4 flex items-center shadow-sm z-20 sticky top-0 w-full transition-all">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600"></div>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/30">
                        <span className="material-symbols-outlined text-white text-2xl">psychology</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                            Gợi ý Phác đồ Điều trị & Phẫu thuật
                        </h1>
                        <p className="text-xs text-slate-500 font-medium tracking-wide">
                            Dựa trên phân tích RAG & Hướng dẫn y khoa
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={onPrev}
                        className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-all bg-white border border-slate-300 shadow-sm rounded-xl hover:shadow hover:bg-slate-50"
                    >
                        Quay lại
                    </button>
                    <Button
                        size="large"
                        type="primary"
                        onClick={openReviewModal}
                        loading={isSaving}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-none shadow-md shadow-emerald-500/30 rounded-xl font-bold px-6 h-[42px] flex items-center gap-2 transform hover:-translate-y-0.5 transition-all"
                    >
                        Khóa Phác Đồ <span className="material-symbols-outlined text-[18px]">verified</span>
                    </Button>
                </div>
            </header>

            {/* Hybrid Container */}
            <div className="flex-1 overflow-hidden p-6 flex gap-6 text-slate-800 max-w-[1800px] mx-auto w-full">

                {/* Left Panel: Treatment Plan Draft (Light & Clean) */}
                <div className="flex-[3] bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-xl shadow-slate-200/50">
                    <div className="bg-slate-50/80 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2">
                            <span className="material-symbols-outlined text-emerald-500">receipt_long</span>
                            Chi tiết phác đồ
                        </h2>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest bg-white px-2 py-1 border border-slate-200 rounded">DRAFT MODE</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-slate-50/30">
                        {surgeryPlan && <SurgerySection ref={surgeryRef} surgeryPlan={surgeryPlan} />}
                        {systemicPlan && (
                            <SystemicAntibioticTreatment ref={systemicRef} guidelinePlan={systemicPlan} />
                        )}
                        {localPlan && <LocalAntibioticTreatment ref={localRef} localPlan={localPlan} />}
                        {!surgeryPlan && !systemicPlan && !localPlan && (
                            <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                    <span className="material-symbols-outlined text-4xl text-slate-300">hourglass_empty</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-700 mb-2">Chưa có dữ liệu phác đồ</h3>
                                <p className="text-slate-500 text-sm">Không tìm thấy gợi ý điều trị cho ca bệnh này trong hệ thống RAG.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Evidence (Glassy Dark Mode) */}
                <div className="flex-[1] min-w-[380px] max-w-[450px] flex flex-col h-full">
                    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 border border-slate-700 rounded-2xl flex flex-col overflow-hidden shadow-2xl relative h-full">
                        {/* Decorative dark bg */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[60px] pointer-events-none"></div>

                        <div className="p-5 border-b border-white/10 flex items-center justify-between relative z-10 bg-black/20 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                                    <span className="material-symbols-outlined text-[18px]">library_books</span>
                                </div>
                                <h3 className="font-bold text-indigo-50 text-sm tracking-wide">Cơ Sở Bằng Chứng</h3>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(99,102,241,0.2)]">AI RAG</span>
                        </div>

                        <div className="flex-1 p-5 space-y-4 overflow-y-auto custom-scrollbar relative z-10">
                            {citations.length > 0 ? (
                                citations.map((citation, idx) => (
                                    <article key={citation.sourceUri || idx} className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md hover:bg-white/10 transition-colors group">
                                        <div className="flex items-center justify-between gap-2 mb-3">
                                            <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300">
                                                {citation.sourceType}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[12px] text-emerald-400">radar</span>
                                                <span className="text-[10px] text-emerald-400/80 font-mono">{(citation.relevanceScore * 100).toFixed(0)}% Match</span>
                                            </div>
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-200 mb-2 leading-tight group-hover:text-white transition-colors">{citation.sourceTitle}</h4>
                                        <div className="relative">
                                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-500/50 rounded-full"></div>
                                            <p className="text-xs text-slate-400 italic pl-3 leading-relaxed mb-3">"{citation.snippet}"</p>
                                        </div>

                                        <div className="pt-3 border-t border-white/5 flex flex-col gap-2">
                                            <p className="text-[11px] text-slate-300"><span className="text-slate-500 font-semibold mr-1 uppercase text-[10px] tracking-wider">Trích dẫn cho:</span> {citation.citedFor}</p>
                                            <a
                                                href={citation.sourceUri}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 hover:underline w-max"
                                            >
                                                Xem tài liệu gốc <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                                            </a>
                                        </div>
                                    </article>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full opacity-50">
                                    <span className="material-symbols-outlined text-4xl mb-2 text-slate-500">search_off</span>
                                    <p className="text-sm text-slate-500 font-medium">Không tìm thấy tài liệu dẫn chứng</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Glowing Floating Chat Button */}
            <div className="fixed bottom-8 right-8 z-40 group">
                <div className="absolute inset-0 bg-blue-500 rounded-full blur-lg opacity-40 group-hover:opacity-70 group-hover:scale-110 transition-all duration-300"></div>
                <button
                    onClick={() => setIsChatOpen(true)}
                    className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-xl flex items-center justify-center transition-transform hover:-translate-y-1 border border-blue-400/30"
                    title="Trợ lý AI"
                >
                    <span className="material-symbols-outlined text-[28px]">smart_toy</span>
                </button>
            </div>

            {/* Premium Chat Drawer */}
            <Drawer
                title={
                    <div className="flex items-center justify-between w-full pr-8">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                <span className="material-symbols-outlined text-blue-600 text-[18px]">forum</span>
                            </div>
                            <div>
                                <span className="font-bold text-slate-800 text-sm block leading-none mb-1">Trợ lý AI Y Khoa</span>
                                <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select
                                value={currentSessionId}
                                onChange={(val) => setCurrentSessionId(val)}
                                className="w-48 chat-select-custom"
                                size="small"
                                loading={isFetchingSessions}
                                placeholder="Chọn phiên chat"
                                bordered={false}
                                options={sessions.map(s => ({ value: String(s.id), label: s.title || `Session #${s.id}` }))}
                            />
                            <Button size="small" className="bg-slate-100 border-none text-slate-600 hover:bg-blue-50 hover:text-blue-600" onClick={handleCreateNewSession} icon={<span className="material-symbols-outlined text-[14px]">add</span>} loading={isFetchingSessions}>
                                Mới
                            </Button>
                        </div>
                    </div>
                }
                onClose={() => setIsChatOpen(false)}
                open={isChatOpen}
                width={550}
                bodyStyle={{ padding: '0px', display: 'flex', flexDirection: 'column', height: '100%' }}
                headerStyle={{ borderBottom: '1px solid #e2e8f0', padding: '16px 20px', background: '#f8fafc' }}
                closeIcon={<span className="material-symbols-outlined text-slate-400 hover:text-slate-800 transition-colors">close</span>}
            >
                <div className="flex flex-col h-full bg-[#f4f7f9] relative">
                    <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm custom-scrollbar scroll-smooth">
                        {isFetchingMessages ? (
                            <div className="flex flex-col items-center justify-center p-8 h-full opacity-50">
                                <Spin />
                                <span className="mt-2 text-xs text-slate-500">Đang đồng bộ giao tiếp...</span>
                            </div>
                        ) : messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}
                            >
                                <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${msg.role === 'user' ? 'text-blue-500' : 'text-indigo-500'}`}>
                                    {msg.role === 'user' ? (
                                        <>Bác sĩ</>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[14px]">smart_toy</span>
                                            Cố Vấn AI
                                        </>
                                    )}
                                    <span className="text-slate-400 font-normal lowercase tracking-normal px-1">—</span>
                                    <span className="text-slate-400 font-normal lowercase tracking-normal">
                                        {msg.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </span>
                                <div className={`px-4 py-3 max-w-[85%] shadow-sm ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm'
                                    : 'bg-white text-slate-800 rounded-2xl rounded-tl-sm border border-slate-200/60'
                                    }`}>
                                    {msg.role === 'assistant' ? (
                                        <div className="ai-markdown prose prose-sm prose-slate max-w-none">
                                            <HardenedMarkdown>{msg.content}</HardenedMarkdown>
                                        </div>
                                    ) : (
                                        <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.content}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isChatLoading && (
                            <div className="flex items-center gap-3 text-slate-500 bg-white w-max px-4 py-2.5 rounded-2xl rounded-tl-sm border border-slate-200/60 shadow-sm animate-pulse">
                                <span className="flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </span>
                                <span className="text-xs font-semibold">AI đang phân tích...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 bg-white border-t border-slate-200 flex-shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] z-10">
                        <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 focus-within:border-blue-400 focus-within:bg-white transition-colors">
                            <Input.TextArea
                                placeholder="Nhập câu hỏi hoặc yêu cầu điều chỉnh phác đồ..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onPressEnter={(e) => {
                                    if (!e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage(inputValue);
                                    }
                                }}
                                disabled={isChatLoading}
                                className="flex-1 bg-transparent border-none shadow-none focus:ring-0 min-h-[40px] max-h-[120px] py-2 px-3 text-sm resize-none custom-scrollbar"
                                autoSize={{ minRows: 1, maxRows: 4 }}
                            />
                            <Button
                                type="primary"
                                onClick={() => handleSendMessage(inputValue)}
                                loading={isChatLoading}
                                disabled={!inputValue.trim() || isChatLoading}
                                className="bg-blue-600 hover:bg-blue-700 h-10 w-10 p-0 rounded-xl flex items-center justify-center shrink-0 border-none shadow-md shadow-blue-500/20"
                            >
                                <span className="material-symbols-outlined text-[18px]">send</span>
                            </Button>
                        </div>
                        <div className="text-center mt-2">
                            <p className="text-[10px] text-slate-400 font-medium">AI có thể mắc lỗi. Vui lòng kiểm tra lại phác đồ trước khi lưu.</p>
                        </div>
                    </div>
                </div>
            </Drawer>

            {/* Review Modal - Stylized */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-500">verified_user</span>
                        Phê duyệt Phác đồ & Lưu
                    </div>
                }
                open={isReviewModalOpen}
                onCancel={() => setIsReviewModalOpen(false)}
                onOk={handleConfirmTreatment}
                okText="Xác Nhận & Lưu"
                cancelText="Hủy bỏ"
                confirmLoading={isSaving}
                okButtonProps={{ className: 'bg-emerald-600 hover:bg-emerald-700 border-none px-6' }}
                destroyOnClose
            >
                <div className="space-y-5 py-4">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 items-start">
                        <span className="material-symbols-outlined text-blue-500 mt-0.5">info</span>
                        <p className="text-sm text-blue-800 leading-relaxed">
                            Bằng việc nhấn "Lưu", phác đồ điều trị này (bao gồm cả các điểm bạn vừa chỉnh sửa so với bản nháp của AI) sẽ được lưu vào bệnh án chính thức.
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Ghi chú bổ sung (Tùy chọn)
                        </label>
                        <Input.TextArea
                            rows={3}
                            placeholder="Ghi chú thêm về quyết định điều trị này..."
                            value={reviewNote}
                            onChange={(e) => setReviewNote(e.target.value)}
                            className="rounded-xl border-slate-300 text-sm p-3"
                        />
                    </div>
                    <div className="border-t border-slate-100 pt-5">
                        <label className="block text-sm font-semibold text-red-600 mb-2 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px]">warning</span>
                            Lý do từ chối phác đồ AI (Nếu có)
                        </label>
                        <Input.TextArea
                            rows={2}
                            placeholder="Điền vào đây nếu bạn hoàn toàn từ chối phác đồ này..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="rounded-xl border-red-200 bg-red-50 focus:bg-white text-sm p-3"
                        />
                    </div>
                </div>
            </Modal>

            {/* Success Result Modal */}
            <Modal
                title={null}
                footer={null}
                closable={true}
                open={isSuccessModalOpen}
                onCancel={() => backToHomepage()}
                width={450}
                centered
                bodyStyle={{ padding: '40px 24px' }}
            >
                <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-[40px] text-emerald-500">check_circle</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Xác nhận thành công!</h2>
                    <p className="text-slate-500 text-sm mb-8">
                        Phác đồ điều trị đã được phê duyệt và lưu vào hồ sơ bệnh nhân.
                    </p>
                    <Button
                        type="primary"
                        size="large"
                        onClick={() => backToHomepage()}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 border-none rounded-xl font-bold"
                    >
                        Trở về Trang chủ Bệnh nhân
                    </Button>
                </div>
            </Modal>
        </div>
    );
};
