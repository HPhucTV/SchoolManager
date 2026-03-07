/* eslint-disable */
'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, MessageCircle } from 'lucide-react';
import { API_URL } from '@/lib/api';

export interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface BaseChatBotProps {
    persona: string;
    initialMessages?: Message[];
    onUserMessage?: (message: string, appendMessage: (msg: Message) => void) => Promise<boolean>;
    headerRight?: React.ReactNode;
    extraContent?: React.ReactNode;
    disableInput?: boolean;
    placeholder?: string;
    onReady?: (helpers: {
        appendMessage: (msg: Message) => void;
        setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    }) => void;
    openButtonColor?: string;
    headerTitle?: string;
    headerSubtitle?: string;
}

export function BaseChatBot({
    persona,
    initialMessages = [],
    onUserMessage,
    headerRight,
    extraContent,
    disableInput = false,
    placeholder,
    onReady,
    openButtonColor = 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    headerTitle = 'Trợ lý AI',
    headerSubtitle = ''
}: BaseChatBotProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState('');
    const placeholderText = placeholder || "Gõ tin nhắn của bạn...";
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    useEffect(scrollToBottom, [messages]);

    const appendMessage = (msg: Message) => setMessages(prev => [...prev, msg]);

    useEffect(() => {
        onReady?.({ appendMessage, setMessages });
        // we intentionally only run once on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        const userContent = input;
        const userMessage: Message = { role: 'user', content: userContent };
        appendMessage(userMessage);
        setInput('');
        setIsLoading(true);

        let handled = false;
        if (onUserMessage) {
            try {
                handled = await onUserMessage(userContent, appendMessage);
            } catch (e) {
                console.error('onUserMessage error', e);
            }
        }

        if (!handled) {
            // default AI call
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_URL}/api/ai/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
                        persona,
                    }),
                });
                if (!response.ok) throw new Error('Lỗi kết nối');
                if (!response.body) throw new Error('Không có dữ liệu');
                appendMessage({ role: 'assistant', content: '' });
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let assistantMessage = '';
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const text = decoder.decode(value, { stream: true });
                    assistantMessage += text;
                    setMessages(prev => {
                        const newMsgs = [...prev];
                        const last = newMsgs[newMsgs.length - 1];
                        if (last.role === 'assistant') {
                            last.content = assistantMessage;
                        }
                        return newMsgs;
                    });
                }
            } catch (err) {
                console.error(err);
                appendMessage({ role: 'assistant', content: '⚠️ Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.' });
            }
        }

        setIsLoading(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: openButtonColor,
                    border: 'none',
                    boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    zIndex: 1000,
                    transition: 'all 0.3s ease',
                }}
            >
                {isOpen ? <X size={28} /> : <Sparkles size={28} />}
            </button>

            {isOpen && (
                <div style={{
                    position: 'fixed',
                    bottom: '100px',
                    right: '24px',
                    width: '400px',
                    height: '600px',
                    backgroundColor: '#1e293b',
                    borderRadius: '20px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    zIndex: 999,
                    animation: 'slideUp 0.3s ease-out'
                }}>
                    <div style={{
                        padding: '20px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '12px',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Sparkles size={20} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '16px' }}>{headerTitle}</div>
                                {headerSubtitle && <div style={{ fontSize: '12px', opacity: 0.9 }}>
                                    {headerSubtitle}
                                </div>}
                            </div>
                        </div>
                        {headerRight}
                    </div>

                    <div style={{
                        flex: 1,
                        padding: '20px',
                        overflowY: 'auto',
                        backgroundColor: '#0f172a',
                    }}>
                        {extraContent}
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                style={{
                                    display: 'flex',
                                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    marginBottom: '16px'
                                }}>
                                <div style={{
                                    maxWidth: '80%',
                                    padding: '16px',
                                    borderRadius: msg.role === 'user' ? '20px 20px 0px 20px' : '20px 20px 20px 0px',
                                    backgroundColor: msg.role === 'user' ? '#22c55e' : '#1e293b',
                                    color: msg.role === 'user' ? 'white' : '#e2e8f0',
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                                    fontSize: '14px',
                                    lineHeight: 1.5,
                                    whiteSpace: 'pre-wrap',
                                    border: msg.role === 'assistant' ? '1px solid #334155' : 'none',
                                }}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
                                <div style={{
                                    padding: '16px',
                                    borderRadius: '20px 20px 20px 4px',
                                    backgroundColor: '#1e293b',
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                                }}>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <span style={{ animation: 'bounce 1s infinite', color: '#3b82f6' }}>●</span>
                                        <span style={{ animation: 'bounce 1s infinite 0.2s', color: '#3b82f6' }}>●</span>
                                        <span style={{ animation: 'bounce 1s infinite 0.4s', color: '#3b82f6' }}>●</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div style={{
                        padding: '16px 20px',
                        borderTop: '1px solid #334155',
                        backgroundColor: '#1e293b',
                        display: 'flex',
                        gap: '12px',
                    }}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={placeholderText}
                            disabled={isLoading || disableInput}
                            style={{
                                flex: 1,
                                padding: '14px 20px',
                                borderRadius: '28px',
                                border: '1px solid #334155',
                                backgroundColor: '#0f172a',
                                color: '#e2e8f0',
                                outline: 'none',
                                fontSize: '14px',
                                transition: 'all 0.2s',
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                            onBlur={(e) => e.target.style.borderColor = '#334155'}
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                background: isLoading || !input.trim()
                                    ? '#e2e8f0'
                                    : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                                border: 'none',
                                cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                boxShadow: isLoading || !input.trim() ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.3)',
                            }}
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes bounce {
                    0%, 60%, 100% { transform: translateY(0); }
                    30% { transform: translateY(-4px); }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </>
    );
}
