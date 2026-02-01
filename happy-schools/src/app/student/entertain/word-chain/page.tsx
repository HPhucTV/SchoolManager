'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, MessageCircle, Info, Heart } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

export default function WordChainPage() {
    const { token } = useAuth();
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: 'Chào bạn! Mình là AI Nối Từ. Mời bạn đi trước một từ nhé!', sender: 'ai', timestamp: new Date() }
    ]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [score, setScore] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [timeLeft, setTimeLeft] = useState(90); // 90 seconds
    const [skipsLeft, setSkipsLeft] = useState(3);
    const [hearts, setHearts] = useState(3); // New Heart System
    const [gameOver, setGameOver] = useState(false);
    const [gameOverReason, setGameOverReason] = useState<'time' | 'hearts' | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (gameOver) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setGameOver(true);
                    setGameOverReason('time');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [gameOver]);

    useEffect(() => {
        if (hearts <= 0 && !gameOver) {
            setGameOver(true);
            setGameOverReason('hearts');
        }
    }, [hearts, gameOver]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!inputText.trim() || loading || gameOver) return;

        const userWord = inputText.trim().toLowerCase();

        // 0. Get Last Word from AI
        const lastMessage = messages[messages.length - 1];
        let lastWord = "";
        if (lastMessage && lastMessage.sender === 'ai' && !lastMessage.text.startsWith('⚠️') && !lastMessage.text.includes('bỏ qua')) {
            lastWord = lastMessage.text;
        }

        // 1. Validate Word Length (2-4 words) - Strict 2 words now? Dataset is strict 2-syllable.
        // Let's keep the frontend check loosely valid but backend is the authority.
        // Actually, user turned strictly 2 syllables. Let's update frontend hint too.
        const syllables = userWord.split(' ');
        if (syllables.length !== 2) {
            // Frontend validation failure -> also lose heart? 
            // Or just warn? User said "mỗi lần trả lời sai thì trừ 1 tim".
            // Let's be strict: -1 heart.
            setHearts(h => h - 1);
            setInputText('');
            // Maybe a small shake or visual cue?
            // For now just return.
            return;
        }

        // 2. Validate Connection (Tail Matching)
        // Only validate if there is a previous word and it's not the intro message
        if (lastWord && lastWord !== 'Chào bạn! Mình là AI Nối Từ. Mời bạn đi trước một từ nhé!' && !lastWord.includes('bỏ qua')) {
            const prevTail = lastWord.trim().toLowerCase().split(' ').pop();
            const inputHead = userWord.split(' ')[0];

            if (prevTail && inputHead !== prevTail) {
                setHearts(h => h - 1);
                setInputText('');
                return;
            }
        }

        // Add user message
        const newUserMsg: Message = {
            id: Date.now(),
            text: inputText,
            sender: 'user',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, newUserMsg]);
        setInputText('');
        setLoading(true);

        try {
            // Collect history - all valid words used (exclude error messages and initial greeting)
            const history = messages
                .filter(m => {
                    // Skip error messages
                    if (m.text.startsWith('[LỖI]')) return false;
                    // Skip initial greeting message
                    if (m.text.includes('Chào bạn! Mình là AI Nối Từ')) return false;
                    // Keep all other messages (user + AI words)
                    return true;
                })
                .map(m => m.text);

            // Use test endpoint (no auth required) if token is not available
            const endpoint = token
                ? `${API_URL}/api/ai/word-chain`
                : `${API_URL}/api/ai/word-chain/test`;

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
                    current_word: userWord,
                    history: history
                })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(`Failed to fetch: ${res.status} ${JSON.stringify(errorData)}`);
            }

            const data = await res.json();

            if (data.valid) {
                // Add AI response
                if (data.next_word) {
                    const aiMsg: Message = {
                        id: Date.now() + 1,
                        text: data.next_word,
                        sender: 'ai',
                        timestamp: new Date()
                    };
                    setMessages(prev => [...prev, aiMsg]);
                    setScore(s => s + 1); // 1 point per word
                } else {
                    // AI loses (Machine Defeated)
                    const aiMsg: Message = {
                        id: Date.now() + 1,
                        text: data.message || "Tuyệt vời! Tôi hết vốn từ rồi. +5 điểm!",
                        sender: 'ai',
                        timestamp: new Date()
                    };
                    setMessages(prev => [...prev, aiMsg]);
                    setScore(s => s + 5); // Bonus 5 points

                    // Auto reset after 2 seconds
                    setTimeout(() => {
                        handleRestart();
                    }, 3000);
                }
            } else {
                // Invalid word from server check -> LOSE HEART
                setHearts(h => h - 1);
                // User said: "không cần hệ thống hiện lên thông báo là từ đó không có trong từ điển"
                // So we do NOT add an error message.

                // Perhaps remove the user's invalid message to keep chat clean? 
                // Or keep it to show they tried?
                // Typically you keep it so they see what they typed.
            }

        } catch (err) {
            console.error(err);
            const errorMsg: Message = {
                id: Date.now() + 1,
                text: 'Lỗi kết nối máy chủ.',
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        if (skipsLeft <= 0 || loading || gameOver) return;

        setSkipsLeft(s => s - 1);
        const skipMsg: Message = {
            id: Date.now(),
            text: "🏳️ Em xin bỏ qua từ này!",
            sender: 'user',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, skipMsg]);

        // AI gives a new word
        setTimeout(() => {
            const aiMsg: Message = {
                id: Date.now() + 1,
                text: "Được thôi! Từ mới là: bắt đầu",
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMsg]);
        }, 500);
    };

    const handleRestart = () => {
        setScore(0);
        setTimeLeft(90);
        setSkipsLeft(3);
        setHearts(3);
        setGameOver(false);
        setGameOverReason(null);
        setMessages([
            { id: 1, text: 'Chào bạn! Mình là AI Nối Từ. Mời bạn đi trước một từ nhé!', sender: 'ai', timestamp: new Date() }
        ]);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
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
                        backgroundColor: 'white', padding: '8px 16px', borderRadius: '20px',
                        fontWeight: 700, color: timeLeft < 10 ? '#ef4444' : '#d97706',
                        border: timeLeft < 10 ? '2px solid #ef4444' : 'none',
                        minWidth: '80px', textAlign: 'center'
                    }}>
                        ⏱️ {formatTime(timeLeft)}
                    </div>
                    <div style={{
                        backgroundColor: 'white', padding: '8px 20px', borderRadius: '20px',
                        fontWeight: 800, color: '#d97706', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
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
                    textAlign: 'center', backgroundColor: '#fff7ed',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#9a3412', display: 'flex', gap: '8px', margin: 0 }}>
                        <MessageCircle size={20} /> Vua Nối Từ
                    </h1>
                    <button
                        onClick={handleSkip}
                        disabled={skipsLeft <= 0 || gameOver}
                        style={{
                            fontSize: '14px', padding: '6px 12px', borderRadius: '8px',
                            backgroundColor: skipsLeft > 0 ? '#fee2e2' : '#f3f4f6',
                            color: skipsLeft > 0 ? '#dc2626' : '#9ca3af',
                            border: 'none', cursor: skipsLeft > 0 ? 'pointer' : 'not-allowed',
                            fontWeight: 600
                        }}
                    >
                        Bỏ qua ({skipsLeft}/3)
                    </button>
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
                                backgroundColor: msg.text.startsWith('⚠️') ? '#fee2e2' : (msg.sender === 'user' ? '#f59e0b' : '#f3f4f6'),
                                color: msg.text.startsWith('⚠️') ? '#b91c1c' : (msg.sender === 'user' ? 'white' : '#1f2937'),
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
                            {gameOverReason === 'time' ? '⏰' : '💔'}
                        </div>
                        <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '16px' }}>
                            {gameOverReason === 'time' ? 'Hết Giờ!' : 'Hết Tim!'}
                        </h2>
                        <p style={{ fontSize: '18px', marginBottom: '8px', color: '#d1d5db' }}>
                            {gameOverReason === 'time' ? 'Bạn đã hết thời gian thi đấu.' : 'Bạn đã trả lời sai 3 lần.'}
                        </p>
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
                        placeholder="Nhập từ tiếp theo (2 tiếng)..."
                        disabled={loading || gameOver}
                        style={{
                            flex: 1, padding: '12px 16px',
                            borderRadius: '24px', border: '2px solid #e5e7eb',
                            fontSize: '16px', outline: 'none',
                            transition: 'border-color 0.2s',
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || !inputText.trim() || gameOver}
                        style={{
                            width: '48px', height: '48px',
                            borderRadius: '50%', border: 'none',
                            backgroundColor: loading || !inputText.trim() || gameOver ? '#e5e7eb' : '#f59e0b',
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
                <Info size={16} /> Sai 3 lần sẽ thua • Thời gian: 1:30s
            </p>
        </div>
    );
}
