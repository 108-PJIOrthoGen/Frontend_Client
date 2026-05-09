import React from 'react';
import { Button, Drawer, Input, Select, Spin } from 'antd';
import ReactMarkdown from 'react-markdown';
import hardenReactMarkdown from 'harden-react-markdown';
import type { IAiChatSession } from '@/types/backend';
import type { ChatMessage } from './hooks/useAiChat';

const HardenedMarkdown = hardenReactMarkdown(ReactMarkdown);

interface Props {
  open: boolean;
  onClose: () => void;
  sessions: IAiChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  isFetchingSessions: boolean;
  isFetchingMessages: boolean;
  messages: ChatMessage[];
  isChatLoading: boolean;
  inputValue: string;
  onInputChange: (val: string) => void;
  onSend: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const AiChatDrawer: React.FC<Props> = ({
  open,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onCreateSession,
  isFetchingSessions,
  isFetchingMessages,
  messages,
  isChatLoading,
  inputValue,
  onInputChange,
  onSend,
  messagesEndRef,
}) => {
  return (
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
              onChange={(val) => onSelectSession(val)}
              className="w-48 chat-select-custom"
              size="small"
              loading={isFetchingSessions}
              placeholder="Chọn phiên chat"
              bordered={false}
              options={sessions.map((s) => ({ value: String(s.id), label: s.title || `Session #${s.id}` }))}
            />
            <Button
              size="small"
              className="bg-slate-100 border-none text-slate-600 hover:bg-blue-50 hover:text-blue-600"
              onClick={onCreateSession}
              icon={<span className="material-symbols-outlined text-[14px]">add</span>}
              loading={isFetchingSessions}
            >
              Mới
            </Button>
          </div>
        </div>
      }
      onClose={onClose}
      open={open}
      width={550}
      bodyStyle={{ padding: '0px', display: 'flex', flexDirection: 'column', height: '100%' }}
      headerStyle={{ borderBottom: '1px solid #e2e8f0', padding: '16px 20px', background: '#f8fafc' }}
      closeIcon={
        <span className="material-symbols-outlined text-slate-400 hover:text-slate-800 transition-colors">
          close
        </span>
      }
    >
      <div className="flex flex-col h-full bg-[#f4f7f9] relative">
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm custom-scrollbar scroll-smooth">
          {isFetchingMessages ? (
            <div className="flex flex-col items-center justify-center p-8 h-full opacity-50">
              <Spin />
              <span className="mt-2 text-xs text-slate-500">Đang đồng bộ giao tiếp...</span>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}
              >
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${msg.role === 'user' ? 'text-blue-500' : 'text-indigo-500'}`}
                >
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
                <div
                  className={`px-4 py-3 max-w-[85%] shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm'
                      : 'bg-white text-slate-800 rounded-2xl rounded-tl-sm border border-slate-200/60'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="ai-markdown prose prose-sm prose-slate max-w-none">
                      <HardenedMarkdown>{msg.content}</HardenedMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.content}</p>
                  )}
                </div>
              </div>
            ))
          )}
          {isChatLoading && (
            <div className="flex items-center gap-3 text-slate-500 bg-white w-max px-4 py-2.5 rounded-2xl rounded-tl-sm border border-slate-200/60 shadow-sm animate-pulse">
              <span className="flex gap-1">
                <span
                  className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                ></span>
                <span
                  className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                ></span>
                <span
                  className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                ></span>
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
              onChange={(e) => onInputChange(e.target.value)}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
              disabled={isChatLoading}
              className="flex-1 bg-transparent border-none shadow-none focus:ring-0 min-h-[40px] max-h-[120px] py-2 px-3 text-sm resize-none custom-scrollbar"
              autoSize={{ minRows: 1, maxRows: 4 }}
            />
            <Button
              type="primary"
              onClick={onSend}
              loading={isChatLoading}
              disabled={!inputValue.trim() || isChatLoading}
              className="bg-blue-600 hover:bg-blue-700 h-10 w-10 p-0 rounded-xl flex items-center justify-center shrink-0 border-none shadow-md shadow-blue-500/20"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </Button>
          </div>
          <div className="text-center mt-2">
            <p className="text-[10px] text-slate-400 font-medium">
              AI có thể mắc lỗi. Vui lòng kiểm tra lại phác đồ trước khi lưu.
            </p>
          </div>
        </div>
      </div>
    </Drawer>
  );
};

export default AiChatDrawer;
