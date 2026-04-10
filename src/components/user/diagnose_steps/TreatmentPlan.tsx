import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Drawer, Spin, Modal, Result, message, Select } from 'antd';
import { SendOutlined } from '@ant-design/icons';

import SurgerySection from '../rag_diagnose/rag_surgery/SurgerySection';
import LocalAntibioticTreatment from '../rag_diagnose/rag_antibiolocal/LocalAntibioticTreatment';
import { SystemicAntibioticTreatment } from '../rag_diagnose/rag_antibiolocal/SystemicAntibioticTreatment';
import type { SystemicAntibioticTreatmentHandle } from '../rag_diagnose/rag_antibiolocal/SystemicAntibioticTreatment';
import type { LocalAntibioticTreatmentHandle } from '../rag_diagnose/rag_antibiolocal/LocalAntibioticTreatment';
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

const parseItemJson = (item: { itemJson?: Record<string, any> } | undefined) => {
    if (!item?.itemJson) return null;
    const raw = typeof item.itemJson === 'string' ? JSON.parse(item.itemJson) : item.itemJson;
    return snakeToCamel(raw);
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

export const Step5TreatmentPlan: React.FC<Step5Props> = ({ onPrev }) => {
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewNote, setReviewNote] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const dispatch = useDispatch();
    const currentCase = useSelector((state: RootState) => state.patient.currentCase);
    const episodeId = currentCase?.episode?.id;

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
            const currentSystemic = systemicRef.current?.getData() ?? null;
            const currentLocal = localRef.current?.getData() ?? null;

            const hasModification =
                (currentSystemic && JSON.stringify(currentSystemic) !== JSON.stringify(systemicPlan)) ||
                (currentLocal && JSON.stringify(currentLocal) !== JSON.stringify(localPlan));
            const reviewStatus = rejectionReason ? 'REJECTED' : hasModification ? 'MODIFIED' : 'ACCEPTED';

            const modificationJson: Record<string, any> = {};
            if (currentSystemic) modificationJson.systemicAntibiotic = currentSystemic;
            if (currentLocal) modificationJson.localAntibiotic = currentLocal;
            if (surgeryPlan) modificationJson.surgery = surgeryPlan;

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
        localStorage.clear();
        dispatch(clearCurrentCase());
        for (let i = 0; i < 2; i++) {
            onPrev();
        }
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
        <div className="flex flex-col h-full relative">
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 flex-shrink-0">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-400">psychology</span>
                        Gợi ý Phác đồ Phẫu thuật & Kháng sinh
                    </h1>
                </div>
                <div className="flex items-center gap-3 z-10">
                    <Button
                        size="small"
                        type="primary"
                        onClick={openReviewModal}
                        loading={isSaving}
                        className="bg-green-700 hover:!bg-green-400 border-none flex items-center gap-1.5"
                    >
                        Xác nhận <span className="material-symbols-outlined text-[14px]">save</span>
                    </Button>
                    <button onClick={onPrev} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors bg-slate-800 border border-slate-600 hover:border-slate-500 rounded-lg">Quay lại</button>
                </div>
            </header>

            {/* Dark Theme Container */}
            <div className="flex-1 overflow-hidden p-6 flex gap-6 text-slate-200">

                {/* Left Panel: Treatment Plan Draft */}
                <div className="flex-1 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden shadow-2xl">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {surgeryPlan && <SurgerySection surgeryPlan={surgeryPlan} />}
                        {systemicPlan && (
                            <SystemicAntibioticTreatment ref={systemicRef} guidelinePlan={systemicPlan} />
                        )}
                        {localPlan && <LocalAntibioticTreatment ref={localRef} localPlan={localPlan} />}
                        {!surgeryPlan && !systemicPlan && !localPlan && (
                            <Result status="info" title="Không có dữ liệu phác đồ điều trị cho ca bệnh này." />
                        )}
                    </div>
                </div>

                {/* Right Panel: Evidence */}
                <div className="w-96 flex flex-col gap-4 h-full">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl flex flex-col overflow-hidden shadow-2xl">
                        <div className="bg-slate-50 rounded-xl border border-slate-200 flex flex-col">
                            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-purple-600">smart_toy</span>
                                    <h3 className="font-bold text-slate-900 text-sm">Co so bang chung (RAG)</h3>
                                </div>
                                <span className="text-[10px] font-bold uppercase bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Tạo bởi AI</span>
                            </div>
                            <div className="p-4 flex-1 space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto">
                                {citations.length > 0 ? (
                                    citations.map((citation, idx) => (
                                        <article key={citation.sourceUri || idx} className="rounded-lg border border-slate-200 bg-white p-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-[10px] uppercase font-semibold tracking-wide px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">
                                                    {citation.sourceType}
                                                </span>
                                                <span className="text-[10px] text-slate-500">Relevance {citation.relevanceScore.toFixed(2)}</span>
                                            </div>
                                            <p className="text-xs font-semibold text-slate-900 mt-2 leading-relaxed">{citation.sourceTitle}</p>
                                            <p className="text-xs text-slate-600 mt-1 italic">"{citation.snippet}"</p>
                                            <p className="text-xs text-slate-700 mt-2"><span className="font-semibold">Cited for:</span> {citation.citedFor}</p>
                                            <a
                                                href={citation.sourceUri}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex mt-2 text-xs text-blue-600 hover:underline"
                                            >
                                                Xem tai lieu
                                            </a>
                                        </article>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-500 text-center py-4">Không có citation</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Chat Button */}
            <button
                onClick={() => setIsChatOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 z-40"
                title="Hỏi AI"
            >
                <span className="material-symbols-outlined text-[24px]">forum</span>
            </button>

            {/* Chat Drawer */}
            <Drawer
                title={
                    <div className="flex items-center justify-between w-full pr-6">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-blue-500">forum</span>
                            <span className="font-semibold text-slate-800 hidden sm:block">Trợ lý AI</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select
                                value={currentSessionId}
                                onChange={(val) => setCurrentSessionId(val)}
                                className="w-52"
                                size="small"
                                loading={isFetchingSessions}
                                placeholder="Chọn phiên chat"
                                options={sessions.map(s => ({ value: String(s.id), label: s.title || `Session #${s.id}` }))}
                            />
                            <Button size="small" type="dashed" onClick={handleCreateNewSession} icon={<span className="material-symbols-outlined text-[14px]">add</span>} loading={isFetchingSessions}>
                                Mới
                            </Button>
                        </div>
                    </div>
                }
                onClose={() => setIsChatOpen(false)}
                open={isChatOpen}
                width={500}
                bodyStyle={{ padding: '0px', display: 'flex', flexDirection: 'column', height: '100%' }}
                headerStyle={{ borderBottom: '1px solid #e5e7eb', padding: '12px 16px' }}
            >
                <div className="flex flex-col h-full bg-slate-50">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
                        {isFetchingMessages ? (
                            <div className="flex items-center justify-center p-8">
                                <Spin tip="Đang tải lịch sử chat..." />
                            </div>
                        ) : messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                            >
                                <span className={`text-xs font-semibold flex items-center gap-1 ${msg.role === 'user' ? 'text-blue-600' : 'text-emerald-600'}`}>
                                    {msg.role === 'user' ? (
                                        <>Bạn</>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                                            AI Assistant
                                        </>
                                    )}
                                </span>
                                <div className={`p-3 rounded-lg max-w-[90%] ${msg.role === 'user'
                                    ? 'bg-blue-500 text-white rounded-tr-none'
                                    : 'bg-slate-100 text-slate-900 rounded-tl-none border border-slate-200'
                                    }`}>
                                    <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</p>
                                    <span className={`text-[10px] mt-1 block ${msg.role === 'user' ? 'text-blue-100' : 'text-slate-500'}`}>
                                        {msg.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {isChatLoading && (
                            <div className="flex items-center gap-2 text-slate-600">
                                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                                <span>AI đang suy nghĩ...</span>
                                <Spin size="small" />
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 border-t border-slate-200 bg-white flex-shrink-0">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Nhập câu hỏi..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onPressEnter={() => handleSendMessage(inputValue)}
                                disabled={isChatLoading}
                                className="flex-1"
                                allowClear
                            />
                            <Button
                                type="primary"
                                icon={<SendOutlined />}
                                onClick={() => handleSendMessage(inputValue)}
                                loading={isChatLoading}
                                disabled={!inputValue.trim() || isChatLoading}
                                className="bg-blue-500 hover:bg-blue-600"
                            />
                        </div>
                    </div>
                </div>
            </Drawer>

            {/* Review Modal */}
            <Modal
                title="Xác nhận phác đồ điều trị"
                open={isReviewModalOpen}
                onCancel={() => setIsReviewModalOpen(false)}
                onOk={handleConfirmTreatment}
                okText="Lưu"
                cancelText="Hủy"
                confirmLoading={isSaving}
                destroyOnClose
            >
                <div className="space-y-4 py-2">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Ghi chú của bác sĩ
                        </label>
                        <Input.TextArea
                            rows={3}
                            placeholder="Nhập ghi chú về phác đồ điều trị..."
                            value={reviewNote}
                            onChange={(e) => setReviewNote(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Lý do từ chối (nếu có)
                        </label>
                        <Input.TextArea
                            rows={3}
                            placeholder="Nhập lý do từ chối nếu không đồng ý với phác đồ..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
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
                width={500}
                centered
            >
                <Result
                    status="success"
                    title="Xác nhận phác đồ điều trị thành công!"
                    subTitle="Dữ liệu điều trị của bạn đã được lưu thành công. Hãy tiếp tục bước tiếp theo."
                    extra={
                        <Button type="primary" onClick={() => backToHomepage()}>
                            Đóng
                        </Button>
                    }
                />
            </Modal>
        </div>
    );
};
