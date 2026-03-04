import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Drawer, Spin } from 'antd';
import { SendOutlined, InfoCircleOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { usePatient } from '../../../context/PatientContext';
import SurgerySection from '../rag_diagnose/rag_surgery/SurgerySection';
import LocalAntibioticTreatment from '../rag_diagnose/rag_antibiolocal/LocalAntibioticTreatment';

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
            'dair': 'DAIR (Debridement, Antibiotics, Implant Retention) không phù hợp vì onset LATE > 3 tháng. Theo guideline ICM 2018, việc giữ lại khớp nhân tạo có tỉ lệ thất bại rất cao đối với nhiễm trùng mạn tính (> 30 ngày).',
            'kháng sinh': 'Phác đồ kháng sinh được chia thành 2 giai đoạn:\n- Giai đoạn 1: Daptomycin 6-8 mg/kg IV trong 2-4 tuần\n- Giai đoạn 2: Rifampin + Levofloxacin uống duy trì 12 tuần',
            'phẫu thuật': 'Đối với PJI mạn tính, cần xem xét loại bỏ implant. Các lựa chọn bao gồm:\n1. Two-stage revision\n2. Arthrodesis\n3. Amputation (trường hợp nặng)',
            'phác đồ': 'Phác đồ điều trị PJI bao gồm:\n1. Chẩn đoán xác định (CHC, mô bệnh học)\n2. Ngừng kháng sinh trước 5 ngày khí chẩn đoán\n3. Điều trị đa mô đun: Phẫu thuật + Kháng sinh',
        };

        for (const [key, response] of Object.entries(responses)) {
            if (lowerMessage.includes(key)) {
                return response;
            }
        }

        return 'Đây là một câu hỏi tốt. Theo các guideline hiện tại, việc điều trị cần phải cân nhắc kỹ lưỡng dựa trên đặc điểm lâm sàng và vi sinh vật gây bệnh. Bạn có thể cung cấp thêm thông tin để tôi đưa ra gợi ý chi tiết hơn?';
    };

    return (
        <div className="flex flex-col h-full relative">
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 flex-shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-400">psychology</span>
                        Gợi ý Phác đồ Phẫu thuật & Kháng sinh
                    </h1>
                </div>
                <div className="flex items-center gap-3 z-10">
                    <Button size="small" type="primary" className="bg-green-700 hover:!bg-green-400 border-none flex items-center gap-1.5">
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
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="text-lg font-bold text-slate-900">Điều trị kháng sinh toàn thân</h3>
                            </div>
                            <div className="p-4 relative">
                                <div className="absolute left-[39px] top-6 bottom-6 w-0.5 bg-slate-200 z-0"></div>

                                {/* Phase 1 */}
                                <div className="relative z-10 flex gap-6 mb-8 group">
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-full bg-blue-400 text-white flex items-center justify-center font-bold text-sm shadow ring-4 ring-white">1</div>
                                        <div className="mt-2 font-semibold text-black uppercase">Tuần 1-2</div>
                                    </div>
                                    <div className="flex-1 bg-blue-50 border border-blue-100 rounded-xl p-5 relative transition-all hover:shadow-md">
                                        <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button title="Hỏi AI" className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-white rounded-md transition-colors flex items-center">
                                                <span className="material-symbols-outlined text-[18px]">psychology</span>
                                            </button>
                                            <button title="Thêm thuốc" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-md transition-colors">
                                                <PlusOutlined className="text-sm" />
                                            </button>
                                            <button title="Chỉnh sửa" className="p-1.5 text-slate-400 hover:text-yellow-600 hover:bg-white rounded-md transition-colors">
                                                <EditOutlined className="text-sm" />
                                            </button>
                                            <button title="Xóa" className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-md transition-colors">
                                                <DeleteOutlined className="text-sm" />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="bg-blue-600/10 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Điều trị tiêm tĩnh mạch</span>
                                            <h4 className="font-bold text-slate-900 text-lg">Daptomycin</h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-slate-500 text-[10px] uppercase font-bold mb-0.5">Liều lượng</p>
                                                <p className="font-semibold text-slate-800">6-8 mg/kg IV</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500 text-[10px] uppercase font-bold mb-0.5">Thời gian</p>
                                                <p className="font-semibold text-slate-800">2-4 tuần</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Phase 2 */}
                                <div className="relative z-10 flex gap-6 group">
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow ring-4 ring-white">2</div>
                                        <div className="mt-2 text-xs font-semibold text-slate-500 uppercase">Tuần 3-6</div>
                                    </div>
                                    <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-xl p-5 relative transition-all hover:shadow-md">
                                        <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button title="Hỏi AI" className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-white rounded-md transition-colors flex items-center">
                                                <span className="material-symbols-outlined text-[18px]">psychology</span>
                                            </button>
                                            <button title="Thêm thuốc" className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-md transition-colors">
                                                <PlusOutlined className="text-sm" />
                                            </button>
                                            <button title="Chỉnh sửa" className="p-1.5 text-slate-400 hover:text-yellow-600 hover:bg-white rounded-md transition-colors">
                                                <EditOutlined className="text-sm" />
                                            </button>
                                            <button title="Xóa" className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-md transition-colors">
                                                <DeleteOutlined className="text-sm" />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="bg-emerald-600/10 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Điều trị uống duy trì</span>
                                            <h4 className="font-bold text-slate-900 text-lg">Rifampin + Levofloxacin</h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-slate-500 text-[10px] uppercase font-bold mb-0.5">Liều lượng</p>
                                                <p className="font-semibold text-slate-800">900mg/ngày</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500 text-[10px] uppercase font-bold mb-0.5">Thời gian</p>
                                                <p className="font-semibold text-slate-800">12 tuần</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                        {/**Section: Local Antibitics */}
                        <LocalAntibioticTreatment />

                        {/* Section: surgery */}
                        <SurgerySection />

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
                                    <h3 className="font-bold text-slate-900 text-sm">Cơ sở bằng chứng (RAG)</h3>
                                </div>
                                <span className="text-[10px] font-bold uppercase bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Tạo bởi AI</span>
                            </div>
                            <div className="p-5 flex-1 space-y-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Trích dẫn hướng dẫn</p>
                                    <blockquote className="text-sm text-slate-700 italic border-l-2 border-primary pl-3 leading-relaxed">
                                        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Porro modi cupiditate sunt maiores? Impe
                                        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Porro modi cupiditate sunt maiores? Impe
                                        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Porro modi cupiditate sunt maiores? Impedit ratione enim magnam vel! Dolores, veniam? Non blanditiis veniam adipisci, quos amet ad earum aliquam alias.
                                    </blockquote>
                                    <div className="mt-2 flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-xs text-slate-400">menu_book</span>
                                        <a href="#" className="text-xs font-medium text-primary hover:underline">Hướng dẫn đồng thuận ICM 2018</a>
                                    </div>
                                </div>
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
        </div>
    );
};
