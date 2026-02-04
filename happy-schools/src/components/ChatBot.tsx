'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, User, Users, GraduationCap } from 'lucide-react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

type Persona = 'friend' | 'parent' | 'teacher';

const PERSONAS: { id: Persona; label: string; icon: React.ReactNode; description: string }[] = [
    { id: 'friend', label: 'Bạn bè', icon: <Users size={20} />, description: 'Trò chuyện như bạn thân' },
    { id: 'parent', label: 'Cha mẹ', icon: <User size={20} />, description: 'Lời khuyên từ cha mẹ' },
    { id: 'teacher', label: 'Thầy cô', icon: <GraduationCap size={20} />, description: 'Hướng dẫn từ thầy cô' },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [persona, setPersona] = useState<Persona>('friend');
    const [showPersonaSelector, setShowPersonaSelector] = useState(true);
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
        setShowPersonaSelector(false);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/ai/chat`, {
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
                    persona,
                }),
            });

            if (!response.ok) {
                throw new Error('Lỗi kết nối');
            }

            const data = await response.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '⚠️ Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.'
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

    const selectPersona = (p: Persona) => {
        setPersona(p);
        setShowPersonaSelector(false);
        setMessages([{
            role: 'assistant',
            content: p === 'friend'
                ? 'Chào bạn! 👋 Mình là trợ lý AI. Có chuyện gì bạn muốn chia sẻ không?'
                : p === 'parent'
                    ? 'Chào con! 💚 Ba/mẹ luôn sẵn sàng lắng nghe con. Con có điều gì muốn nói không?'
                    : 'Chào em! 📚 Thầy/cô sẵn sàng hỗ trợ em. Em có thắc mắc gì không?'
        }]);
    };

    const resetChat = () => {
        setMessages([]);
        setShowPersonaSelector(true);
    };

    return (
        <>
            {/* Chat Bubble Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    border: 'none',
                    boxShadow: '0 8px 32px rgba(34, 197, 94, 0.4)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    zIndex: 1000,
                    transition: 'all 0.3s ease',
                }}
            >
                {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    bottom: '100px',
                    right: '24px',
                    width: '380px',
                    height: '520px',
                    backgroundColor: 'white',
                    borderRadius: '20px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    zIndex: 999,
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '16px 20px',
                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '16px' }}>Trợ lý Tâm lý AI</div>
                            <div style={{ fontSize: '12px', opacity: 0.9 }}>
                                {PERSONAS.find(p => p.id === persona)?.label || 'Chọn vai trò'}
                            </div>
                        </div>
                        <button
                            onClick={resetChat}
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                color: 'white',
                                fontSize: '12px',
                                cursor: 'pointer',
                            }}
                        >
                            Đổi vai trò
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div style={{
                        flex: 1,
                        padding: '16px',
                        overflowY: 'auto',
                        backgroundColor: '#f8fafc',
                    }}>
                        {showPersonaSelector ? (
                            <div>
                                <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '16px', fontSize: '14px' }}>
                                    Bạn muốn trò chuyện với ai?
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {PERSONAS.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => selectPersona(p.id)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '16px',
                                                borderRadius: '12px',
                                                border: '2px solid #e2e8f0',
                                                backgroundColor: 'white',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            <div style={{
                                                width: '44px',
                                                height: '44px',
                                                borderRadius: '12px',
                                                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                            }}>
                                                {p.icon}
                                            </div>
                                            <div style={{ textAlign: 'left' }}>
                                                <div style={{ fontWeight: 600, color: '#1e293b' }}>{p.label}</div>
                                                <div style={{ fontSize: '12px', color: '#64748b' }}>{p.description}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                {messages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            display: 'flex',
                                            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                            marginBottom: '12px',
                                        }}
                                    >
                                        <div style={{
                                            maxWidth: '80%',
                                            padding: '12px 16px',
                                            borderRadius: msg.role === 'user'
                                                ? '16px 16px 4px 16px'
                                                : '16px 16px 16px 4px',
                                            backgroundColor: msg.role === 'user' ? '#22c55e' : 'white',
                                            color: msg.role === 'user' ? 'white' : '#1e293b',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                            fontSize: '14px',
                                            lineHeight: 1.5,
                                            whiteSpace: 'pre-wrap',
                                        }}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
                                        <div style={{
                                            padding: '12px 16px',
                                            borderRadius: '16px 16px 16px 4px',
                                            backgroundColor: 'white',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                        }}>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <span style={{ animation: 'bounce 1s infinite' }}>●</span>
                                                <span style={{ animation: 'bounce 1s infinite 0.2s' }}>●</span>
                                                <span style={{ animation: 'bounce 1s infinite 0.4s' }}>●</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>

                    {/* Input Area */}
                    {!showPersonaSelector && (
                        <div style={{
                            padding: '12px 16px',
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
                                placeholder="Nhập tin nhắn..."
                                disabled={isLoading}
                                style={{
                                    flex: 1,
                                    padding: '12px 16px',
                                    borderRadius: '24px',
                                    border: '2px solid #e2e8f0',
                                    outline: 'none',
                                    fontSize: '14px',
                                }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '50%',
                                    background: isLoading || !input.trim()
                                        ? '#e2e8f0'
                                        : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                    border: 'none',
                                    cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                }}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    )}
                </div>
            )}

            <style jsx global>{`
                @keyframes bounce {
                    0%, 60%, 100% { transform: translateY(0); }
                    30% { transform: translateY(-4px); }
                }
            `}</style>
        </>
    );
}
