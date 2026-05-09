import { useEffect, useRef, useState } from 'react';
import { message } from 'antd';
import {
  callCreateAiChatSession,
  callFetchAiChatMessages,
  callFetchAiChatSessionsByEpisode,
  callSendAiChatMessage,
} from '@/apis/api';
import type { IAiChatMessage, IAiChatSession } from '@/types/backend';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Options {
  isChatOpen: boolean;
  episodeId?: string | number;
  runIdRef: React.MutableRefObject<string | null>;
}

export function useAiChat({ isChatOpen, episodeId, runIdRef }: Options) {
  const [sessions, setSessions] = useState<IAiChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isFetchingSessions, setIsFetchingSessions] = useState(false);
  const [isFetchingMessages, setIsFetchingMessages] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
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
        title,
      });
      if (res?.data?.id) {
        const newId = String(res.data.id);
        setSessions((prev) => [res.data as IAiChatSession, ...prev]);
        setCurrentSessionId(newId);
      }
    } catch {
      message.error('Lỗi khi tạo phiên chat mới');
    } finally {
      setIsFetchingSessions(false);
    }
  };

  const loadSessions = async () => {
    if (!episodeId) return;
    setIsFetchingSessions(true);
    try {
      const res = await callFetchAiChatSessionsByEpisode(String(episodeId), 'sort=createdAt,desc&size=50');
      const fetchedSessions = res?.data?.result ?? [];
      setSessions(fetchedSessions);
      if (fetchedSessions.length > 0 && !currentSessionId) {
        setCurrentSessionId(String(fetchedSessions[0].id));
      } else if (fetchedSessions.length === 0) {
        await handleCreateNewSession();
      }
    } catch {
      message.error('Lỗi khi tải lịch sử chat');
    } finally {
      setIsFetchingSessions(false);
    }
  };

  const loadMessagesForSession = async (sessionId: string) => {
    setIsFetchingMessages(true);
    try {
      const res = await callFetchAiChatMessages(sessionId, 'sort=createdAt,asc&size=500');
      const fetchedMsgs = res?.data?.result ?? [];
      const mapped: ChatMessage[] = fetchedMsgs.map((m: IAiChatMessage) => ({
        id: String(m.id),
        role: m.role as 'user' | 'assistant',
        content: m.content || '',
        timestamp: m.createdAt ? new Date(m.createdAt) : new Date(),
      }));

      if (mapped.length === 0) {
        mapped.push({
          id: 'greeting',
          role: 'assistant',
          content:
            'Xin chào! Tôi là trợ lý AI. Bạn có thể hỏi tôi bất kỳ điều gì về phác đồ điều trị, kháng sinh, hay phẫu thuật trên.',
          timestamp: new Date(),
        });
      }
      setMessages(mapped);
    } catch {
      message.error('Lỗi khi tải tin nhắn');
    } finally {
      setIsFetchingMessages(false);
    }
  };

  useEffect(() => {
    if (isChatOpen) {
      loadSessions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChatOpen, episodeId]);

  useEffect(() => {
    if (currentSessionId && isChatOpen) {
      loadMessagesForSession(currentSessionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSessionId, isChatOpen]);

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

    const optimisticUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMsgContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, optimisticUserMsg]);
    setIsChatLoading(true);

    try {
      const res = await callSendAiChatMessage(currentSessionId, {
        content: userMsgContent,
        useEpisodeContext: true,
        useRunContext: true,
        useChatHistory: true,
      });

      if (res?.data) {
        const aiData = res.data;
        const aiMsg: ChatMessage = {
          id: String(aiData.id),
          role: 'assistant',
          content: aiData.content || '',
          timestamp: aiData.createdAt ? new Date(aiData.createdAt) : new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Lỗi kết nối với AI');
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUserMsg.id));
    } finally {
      setIsChatLoading(false);
    }
  };

  return {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    isFetchingSessions,
    isFetchingMessages,
    messages,
    inputValue,
    setInputValue,
    isChatLoading,
    messagesEndRef,
    handleCreateNewSession,
    handleSendMessage,
  };
}
