'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, MessageCircle, Info, Heart, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

import { API_URL } from '@/lib/api';
// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

export default function RiddlesPage() {
    const { token } = useAuth();
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: 'Chào bạn! Mình là thần Đố Vui. Bạn đã sẵn sàng để thử thách trí tuệ chưa?', sender: 'ai', timestamp: new Date() }
    ]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [score, setScore] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [skipsLeft, setSkipsLeft] = useState(3);
    const [hearts, setHearts] = useState(3);
    const [gameOver, setGameOver] = useState(false);
    const [gameOverReason, setGameOverReason] = useState<'hearts' | 'win' | null>(null);

    // Game state
    const [currentRiddleId, setCurrentRiddleId] = useState<number | null>(null);
    const [currentHint, setCurrentHint] = useState<string | null>(null);
    const [hasUsedHint, setHasUsedHint] = useState(false);
    const [historyIds, setHistoryIds] = useState<number[]>([]);
    const [isWaitingForAnswer, setIsWaitingForAnswer] = useState(false);

    const [lastAnswer, setLastAnswer] = useState<string | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (hearts <= 0 && !gameOver) {
            setGameOver(true);
            setGameOverReason('hearts');
        }
    }, [hearts, gameOver]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initial Start
    useEffect(() => {
        // Start game after a short delay
        if (!currentRiddleId && !gameOver && !loading) {
            const timer = setTimeout(() => {
                getNextRiddle();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const fetchAnswer = async (riddleId: number): Promise<string | null> => {
        try {
            const endpoint = `${API_URL}/api/ai/riddles/reveal`;
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify({ riddle_id: riddleId })
            });

            if (!res.ok) return null;
            const data = await res.json();
            return data.result?.correct_answer || null;
        } catch (e) {
            console.error(e);
            return null;
        }
    };

    const getNextRiddle = async () => {
        setLoading(true);
        setHasUsedHint(false);
        setCurrentHint(null);
        try {
            const endpoint = `${API_URL}/api/ai/riddles/next`;

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    history: historyIds
                })
            });

            if (!res.ok) throw new Error('Failed to fetch riddle');

            const data = await res.json();

            if (data.riddle) {
                setCurrentRiddleId(data.riddle.id);
                setCurrentHint(data.riddle.hint || null);
                setHistoryIds(prev => [...prev, data.riddle.id]);
                setIsWaitingForAnswer(true);

                const newMsg: Message = {
                    id: Date.now(),
                    text: `Câu đố: ${data.riddle.question}`,
                    sender: 'ai',
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, newMsg]);
            } else {
                // No more riddles! Win!
                setGameOver(true);
                setGameOverReason('win');
            }

        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, {
                id: Date.now(),
                text: "Lỗi kết nối. Không thể lấy câu đố.",
                sender: 'ai',
                timestamp: new Date()
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!inputText.trim() || loading || gameOver) return;
        if (!isWaitingForAnswer || !currentRiddleId) return;

        const userText = inputText.trim();

        // Add user message
        const newUserMsg: Message = {
            id: Date.now(),
            text: userText,
            sender: 'user',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, newUserMsg]);
        setInputText('');
        setLoading(true);

        try {
            const endpoint = `${API_URL}/api/ai/riddles/check`;
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    riddle_id: currentRiddleId,
                    answer: userText
                })
            });

            if (!res.ok) throw new Error('Failed to check answer');

            const data = await res.json();

            if (data.result.correct) {
                // Correct!
                setScore(s => s + 10);
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    text: `🎉 Chính xác! Đáp án là: ${data.result.correct_answer}`,
                    sender: 'ai',
                    timestamp: new Date()
                }]);

                setIsWaitingForAnswer(false);
                setTimeout(getNextRiddle, 1500);
            } else {
                // Incorrect
                let newHearts = hearts - 1;
                setHearts(newHearts); // Update hearts state

                if (newHearts <= 0) {
                    // Game over due to hearts. Reveal answer.
                    const ans = await fetchAnswer(currentRiddleId);
                    setLastAnswer(ans);
                    setMessages(prev => [...prev, {
                        id: Date.now() + 1,
                        text: `❌ Sai rồi. Đáp án đúng là: ${ans || '...'}`,
                        sender: 'ai',
                        timestamp: new Date()
                    }]);
                    // The useEffect for hearts will trigger setGameOver(true)
                } else {
                    setMessages(prev => [...prev, {
                        id: Date.now() + 1,
                        text: `❌ Chưa đúng rồi. Thử lại nhé!`,
                        sender: 'ai',
                        timestamp: new Date()
                    }]);
                }
            }

        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, {
                id: Date.now(),
                text: "Lỗi kiểm tra đáp án.",
                sender: 'ai',
                timestamp: new Date()
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleHint = () => {
        if (!currentHint || hasUsedHint || loading || gameOver) return;

        setHasUsedHint(true);
        // Maybe deduct score? For now just show hint.
        // setScore(s => Math.max(0, s - 5));

        const hintMsg: Message = {
            id: Date.now(),
            text: `💡 Gợi ý: ${currentHint}`,
            sender: 'ai',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, hintMsg]);
    };

    const handleSkip = async () => {
        if (skipsLeft <= 0 || loading || gameOver || !currentRiddleId) return;

        setSkipsLeft(s => s - 1);
        const skipMsg: Message = {
            id: Date.now(),
            text: "🏳️ Em xin bỏ qua câu này!",
            sender: 'user',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, skipMsg]);

        // Fetch answer
        setLoading(true);
        const ans = await fetchAnswer(currentRiddleId);

        const replyMsg: Message = {
            id: Date.now() + 1,
            text: `Được rồi. Đáp án là: ${ans || '...'}`,
            sender: 'ai',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, replyMsg]);

        setIsWaitingForAnswer(false);
        setTimeout(getNextRiddle, 2000);
    };

    const handleRestart = () => {
        setScore(0);
        setSkipsLeft(3);
        setHearts(3);
        setGameOver(false);
        setGameOverReason(null);
        setHistoryIds([]);
        setCurrentRiddleId(null);
        setIsWaitingForAnswer(false);
        setLastAnswer(null);
        setMessages([
            { id: 1, text: 'Chào bạn! Mình là thần Đố Vui. Bạn đã sẵn sàng để thử thách trí tuệ chưa?', sender: 'ai', timestamp: new Date() }
        ]);
        setTimeout(getNextRiddle, 1000);
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', // Purple theme for Riddles
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        }}>
            {/* Header */}
            <div style={{
                width: '100%', maxWidth: '600px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '20px'
            }}>
                <Link href="/student/entertain" style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    color: 'white', textDecoration: 'none', fontWeight: 600,
                    backgroundColor: 'rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '12px'
                }}>
                    <ArrowLeft size={20} /> Thoát
                </Link>
                <div style={{ display: 'flex', gap: '12px' }}>
                    {/* Hearts Display */}
                    <div style={{
                        backgroundColor: 'white', padding: '8px 16px', borderRadius: '20px',
                        fontWeight: 700, color: '#dc2626',
                        display: 'flex', gap: '4px', alignItems: 'center'
                    }}>
                        {[...Array(3)].map((_, i) => (
                            <Heart
                                key={i}
                                size={20}
                                fill={i < hearts ? "#dc2626" : "transparent"}
                                strokeWidth={i < hearts ? 0 : 2}
                                color="#dc2626"
                            />
                        ))}
                    </div>

                    <div style={{
                        backgroundColor: 'white', padding: '8px 20px', borderRadius: '20px',
                        fontWeight: 800, color: '#6d28d9', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                    }}>
                        🏆 {score}
                    </div>
                </div>
            </div>

            {/* Game Container */}
            <div style={{
                width: '100%', maxWidth: '600px',
                height: '70vh',
                backgroundColor: 'white',
                borderRadius: '24px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative'
            }}>
                {/* Title */}
                <div style={{
                    padding: '16px', borderBottom: '1px solid #f3f4f6',
                    textAlign: 'center', backgroundColor: '#f3f4f6',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#5b21b6', display: 'flex', gap: '8px', margin: 0 }}>
                        <HelpCircle size={20} /> Giải Đố Vui
                    </h1>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={handleHint}
                            disabled={!currentHint || hasUsedHint || gameOver || !isWaitingForAnswer}
                            style={{
                                fontSize: '14px', padding: '6px 12px', borderRadius: '8px',
                                backgroundColor: !currentHint || hasUsedHint ? '#f3f4f6' : '#fff7ed',
                                color: !currentHint || hasUsedHint ? '#9ca3af' : '#ea580c',
                                border: 'none', cursor: !currentHint || hasUsedHint ? 'not-allowed' : 'pointer',
                                fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px'
                            }}
                        >
                            💡 Gợi ý
                        </button>
                        <button
                            onClick={handleSkip}
                            disabled={skipsLeft <= 0 || gameOver || !isWaitingForAnswer}
                            style={{
                                fontSize: '14px', padding: '6px 12px', borderRadius: '8px',
                                backgroundColor: skipsLeft > 0 ? '#ede9fe' : '#f3f4f6',
                                color: skipsLeft > 0 ? '#7c3aed' : '#9ca3af',
                                border: 'none', cursor: skipsLeft > 0 ? 'pointer' : 'not-allowed',
                                fontWeight: 600
                            }}
                        >
                            Bỏ qua ({skipsLeft}/3)
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div style={{
                    flex: 1, overflowY: 'auto', padding: '20px',
                    display: 'flex', flexDirection: 'column', gap: '16px',
                    scrollBehavior: 'smooth'
                }}>
                    {messages.map((msg) => (
                        <div key={msg.id} style={{
                            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '80%',
                        }}>
                            <div style={{
                                padding: '12px 16px',
                                borderRadius: msg.sender === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                                backgroundColor: msg.text.startsWith('❌') ? '#fee2e2' : (msg.text.startsWith('🎉') ? '#d1fae5' : (msg.text.startsWith('💡') ? '#fff7ed' : (msg.sender === 'user' ? '#8b5cf6' : '#f3f4f6'))),
                                color: msg.text.startsWith('❌') ? '#b91c1c' : (msg.text.startsWith('🎉') ? '#065f46' : (msg.text.startsWith('💡') ? '#c2410c' : (msg.sender === 'user' ? 'white' : '#1f2937'))),
                                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                fontSize: '16px',
                                fontWeight: 500
                            }}>
                                {msg.text}
                            </div>
                            <span style={{
                                fontSize: '10px', color: '#9ca3af',
                                marginTop: '4px', display: 'block',
                                textAlign: msg.sender === 'user' ? 'right' : 'left'
                            }}>
                                {msg.sender === 'user' ? 'Bạn' : 'AI'}
                            </span>
                        </div>
                    ))}
                    {loading && (
                        <div style={{ alignSelf: 'flex-start', padding: '12px 16px', backgroundColor: '#f3f4f6', borderRadius: '16px 16px 16px 0' }}>
                            <div className="animate-pulse flex gap-1">
                                <div style={{ width: '6px', height: '6px', backgroundColor: '#9ca3af', borderRadius: '50%' }}></div>
                                <div style={{ width: '6px', height: '6px', backgroundColor: '#9ca3af', borderRadius: '50%' }}></div>
                                <div style={{ width: '6px', height: '6px', backgroundColor: '#9ca3af', borderRadius: '50%' }}></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Game Over Overlay */}
                {gameOver && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.85)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        zIndex: 10, color: 'white', padding: '20px', textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '64px', marginBottom: '20px' }}>
                            {gameOverReason === 'win' ? '🏆' : '💔'}
                        </div>
                        <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '16px' }}>
                            {gameOverReason === 'win' ? 'Chiến Thắng!' : 'Hết Tim!'}
                        </h2>
                        <p style={{ fontSize: '18px', marginBottom: '8px', color: '#d1d5db' }}>
                            {gameOverReason === 'win' ? 'Bạn đã giải hết các câu đố!' : 'Bạn đã trả lời sai 3 lần.'}
                        </p>
                        {lastAnswer && (
                            <p style={{ fontSize: '18px', marginBottom: '8px', color: '#fca5a5' }}>
                                Đáp án câu cuối: <span style={{ fontWeight: 700, color: '#fecaca' }}>{lastAnswer}</span>
                            </p>
                        )}
                        <p style={{ fontSize: '24px', marginBottom: '8px' }}>Tổng điểm: <span style={{ color: '#f59e0b', fontWeight: 700 }}>{score}</span></p>
                        <button
                            onClick={handleRestart}
                            style={{
                                marginTop: '24px', padding: '12px 32px', borderRadius: '24px',
                                backgroundColor: '#f59e0b', color: 'white', fontWeight: 700, fontSize: '18px',
                                border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)'
                            }}
                        >
                            Chơi lại
                        </button>
                    </div>
                )}

                {/* Input Area */}
                <div style={{
                    padding: '16px', backgroundColor: 'white', borderTop: '1px solid #f3f4f6',
                    display: 'flex', gap: '12px'
                }}>
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Nhập đáp án của bạn..."
                        disabled={loading || gameOver}
                        style={{
                            flex: 1, padding: '12px 16px',
                            borderRadius: '24px', border: '2px solid #e5e7eb',
                            fontSize: '16px', outline: 'none',
                            transition: 'border-color 0.2s',
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || !inputText.trim() || gameOver}
                        style={{
                            width: '48px', height: '48px',
                            borderRadius: '50%', border: 'none',
                            backgroundColor: loading || !inputText.trim() || gameOver ? '#e5e7eb' : '#8b5cf6',
                            color: 'white', cursor: loading || !inputText.trim() || gameOver ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            transform: loading || !inputText.trim() || gameOver ? 'scale(0.95)' : 'scale(1)'
                        }}
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>

            <p style={{
                marginTop: '16px', color: 'rgba(255,255,255,0.8)', fontSize: '14px',
                display: 'flex', alignItems: 'center', gap: '6px'
            }}>
                <Info size={16} /> Sai 3 lần sẽ thua • Không tính thời gian
            </p>
        </div>
    );
}
