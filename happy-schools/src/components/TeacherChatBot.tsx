'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function TeacherChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Chào bạn! Tôi là Trợ lý Giáo dục AI. Tôi đã xem qua số liệu các lớp của bạn. Bạn cần tư vấn gì hôm nay?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            // Use raw fetch for custom endpoint if api wrapper doesn't support it yet or for explicit control
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/ai/teacher-chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content
                    })),
                    persona: 'consultant', // Backend helper
                }),
            });

            if (!response.ok) {
                throw new Error('Lỗi kết nối');
            }

            const data = await response.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '⚠️ Xin lỗi, tôi đang gặp chút sự cố khi phân tích dữ liệu. Vui lòng thử lại sau.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* Chat Bubble Button - Blue/Purple Gradient */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
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

            {/* Chat Window */}
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    bottom: '100px',
                    right: '24px',
                    width: '400px',
                    height: '600px',
                    backgroundColor: 'white',
                    borderRadius: '20px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    zIndex: 999,
                    animation: 'slideUp 0.3s ease-out'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '20px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '16px' }}>Trợ lý Giáo dục AI</div>
                            <div style={{ fontSize: '12px', opacity: 0.9 }}>
                                Phân tích & Tư vấn chuyên sâu
                            </div>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div style={{
                        flex: 1,
                        padding: '20px',
                        overflowY: 'auto',
                        backgroundColor: '#f8fafc',
                    }}>
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                style={{
                                    display: 'flex',
                                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    marginBottom: '16px',
                                }}
                            >
                                <div style={{
                                    maxWidth: '85%',
                                    padding: '16px',
                                    borderRadius: msg.role === 'user'
                                        ? '20px 20px 4px 20px'
                                        : '20px 20px 20px 4px',
                                    backgroundColor: msg.role === 'user' ? '#3b82f6' : 'white',
                                    color: msg.role === 'user' ? 'white' : '#1e293b',
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                                    fontSize: '14px',
                                    lineHeight: 1.6,
                                    whiteSpace: 'pre-wrap',
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
                                    backgroundColor: 'white',
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

                    {/* Input Area */}
                    <div style={{
                        padding: '16px 20px',
                        borderTop: '1px solid #e2e8f0',
                        backgroundColor: 'white',
                        display: 'flex',
                        gap: '12px',
                    }}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Hỏi về tình hình lớp học..."
                            disabled={isLoading}
                            style={{
                                flex: 1,
                                padding: '14px 20px',
                                borderRadius: '28px',
                                border: '2px solid #e2e8f0',
                                outline: 'none',
                                fontSize: '14px',
                                transition: 'all 0.2s',
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
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
