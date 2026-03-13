import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Drawer, Spin, Modal, Result } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { usePatient } from '../../../context/PatientContext';
import SurgerySection from '../rag_diagnose/rag_surgery/SurgerySection';
import LocalAntibioticTreatment from '../rag_diagnose/rag_antibiolocal/LocalAntibioticTreatment';
import { SystemicAntibioticTreatment } from '../rag_diagnose/rag_antibiolocal/SystemicAntibioticTreatment';
import {
    LOCAL_PLAN,
    RAG_CITATIONS,
    SURGERY_PLAN,
    SYSTEMIC_PLAN,
} from './treatmentTemplateData';

interface Step5Props {
    onPrev: () => void;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export const Step5TreatmentPlan: React.FC<Step5Props> = ({ onPrev }) => {
    const { setTreatment } = usePatient();

    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Xin chào! Tôi là trợ lý AI. Bạn có thể hỏi tôi bất kỳ điều gì về phác đồ điều trị, kháng sinh, hay phẫu thuật trên.',
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const handleConfirmTreatment = () => {
        // TODO: gửi dữ liệu lên backend/AI nếu cần
        setIsSuccessModalOpen(true);
    };

    const backToHomepage = () => {
        // Xóa tất cả dữ liệu bệnh nhân trong localStorage
        localStorage.clear();

        // Quay lại step 1 (gọi onPrev 4 lần từ step 5)
        for (let i = 0; i < 5; i++) {
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
        if (!text.trim()) return;

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        // Simulate AI response with delay
        setTimeout(() => {
            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: generateAIResponse(text),
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiResponse]);
            setIsLoading(false);
        }, 1000);
    };

    const generateAIResponse = (userMessage: string): string => {
        const lowerMessage = userMessage.toLowerCase();

        const responses: { [key: string]: string } = {
            'dair': 'DAIR khong phu hop cho PJI man tinh > 4 tuan va MRSA. Phuong an uu tien la two-stage revision ket hop khang sinh.',
            'khang sinh': 'Phac do 2 giai doan: 6 tuan IV Vancomycin + Rifampicin, sau do 6 tuan TMP-SMX + Rifampicin duong uong.',
            'phau thuat': 'Chi dinh two-stage revision: giai doan 1 thao implant + dat spacer khang sinh, giai doan 2 reimplantation sau 8-12 tuan neu dat tieu chuan.',
            'phac do': 'Phac do tong the gom phau thuat 2 giai doan, khang sinh toan than 12 tuan, khang sinh tai cho qua ALCS, va theo doi sat CRP/ESR/chuc nang gan than.',
        };

        for (const [key, response] of Object.entries(responses)) {
            if (lowerMessage.includes(key)) {
                return response;
            }
        }

        return 'Can doi chieu voi tinh trang lam sang, khang sinh do va cac nguy co benh nen. Neu ban muon, toi co the tom tat nhanh theo tung giai doan dieu tri.';
    };

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
                        onClick={handleConfirmTreatment}
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
                    {/* Section: Local Antibiotics */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* Section: surgery */}
                        <SurgerySection surgeryPlan={SURGERY_PLAN} />
                        <SystemicAntibioticTreatment
                            guidelinePlan={SYSTEMIC_PLAN}
                        />
                        {/**Section: Local Antibitics */}
                        <LocalAntibioticTreatment localPlan={LOCAL_PLAN} />



                    </div>
                </div>

                {/* Right Panel: Evidence */}
                <div className="w-96 flex flex-col gap-4 h-full">
                    {/* Evidence block */}
                    <div className="bg-slate-800 border border-slate-700 rounded-xl flex flex-col overflow-hidden shadow-2xl">
                        <div className="bg-slate-50 rounded-xl border border-slate-200 flex flex-col ">
                            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-purple-600">smart_toy</span>
                                    <h3 className="font-bold text-slate-900 text-sm">Co so bang chung (RAG)</h3>
                                </div>
                                <span className="text-[10px] font-bold uppercase bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Tạo bởi AI</span>
                            </div>
                            <div className="p-4 flex-1 space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto">
                                {RAG_CITATIONS.map((citation) => (
                                    <article key={citation.sourceUri} className="rounded-lg border border-slate-200 bg-white p-3">
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
                                ))}
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
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-400">forum</span>
                        <span>Hỏi AI về phác đồ</span>
                    </div>
                }
                onClose={() => setIsChatOpen(false)}
                open={isChatOpen}
                width={450}
                bodyStyle={{ padding: '0px', display: 'flex', flexDirection: 'column', height: '100%' }}
                headerStyle={{ borderBottom: '1px solid #e5e7eb' }}
            >
                <div className="flex flex-col h-full bg-white">
                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex flex-col gap-1 ${message.role === 'user' ? 'items-end' : 'items-start'}`}
                            >
                                <span className={`text-xs font-semibold flex items-center gap-1 ${message.role === 'user' ? 'text-blue-600' : 'text-emerald-600'
                                    }`}>
                                    {message.role === 'user' ? (
                                        <>Bạn</>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                                            AI Assistant
                                        </>
                                    )}
                                </span>
                                <div className={`p-3 rounded-lg max-w-[90%] ${message.role === 'user'
                                    ? 'bg-blue-500 text-white rounded-tr-none'
                                    : 'bg-slate-100 text-slate-900 rounded-tl-none border border-slate-200'
                                    }`}>
                                    <p className="whitespace-pre-wrap leading-relaxed text-sm">{message.content}</p>
                                    <span className={`text-[10px] mt-1 block ${message.role === 'user' ? 'text-blue-100' : 'text-slate-500'
                                        }`}>
                                        {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-center gap-2 text-slate-600">
                                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                                <span>AI đang suy nghĩ...</span>
                                <Spin size="small" />
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-slate-200 bg-white flex-shrink-0">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Nhập câu hỏi..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onPressEnter={() => handleSendMessage(inputValue)}
                                disabled={isLoading}
                                className="flex-1"
                                allowClear
                            />
                            <Button
                                type="primary"
                                icon={<SendOutlined />}
                                onClick={() => handleSendMessage(inputValue)}
                                loading={isLoading}
                                disabled={!inputValue.trim() || isLoading}
                                className="bg-blue-500 hover:bg-blue-600"
                            />
                        </div>
                    </div>
                </div>
            </Drawer>

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
