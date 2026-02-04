'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, HelpCircle, RefreshCw, Trophy, Lightbulb } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CrosswordData {
    id: number;
    topic: string;
    question: string;
    hint: string;
    length: number;
}

export default function CrosswordGame() {
    const router = useRouter();
    const [data, setData] = useState<CrosswordData | null>(null);
    const [userAnswer, setUserAnswer] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [isCorrect, setIsCorrect] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [score, setScore] = useState(0); // Local session score

    const [revealedIndices, setRevealedIndices] = useState<number[]>([]);


    const fetchCrossword = async () => {
        setLoading(true);
        setMessage('');
        setIsCorrect(false);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/games/crossword/random`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const newData = await res.json();
                setData(newData);
                setUserAnswer(new Array(newData.length).fill(''));
                setRevealedIndices([]);
                setShowHint(false);
            }
        } catch (error) {
            console.error('Failed to fetch crossword', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCrossword();
    }, []);

    const handleInputChange = (index: number, value: string) => {
        if (value.length > 1) return;

        const newAnswer = [...userAnswer];
        newAnswer[index] = value.toUpperCase();
        setUserAnswer(newAnswer);

        // Auto move focus
        if (value && index < userAnswer.length - 1) {
            const nextInput = document.getElementById(`char-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !userAnswer[index] && index > 0) {
            const prevInput = document.getElementById(`char-${index - 1}`);
            prevInput?.focus();
        }
    };

    const checkAnswer = async () => {
        if (!data) return;

        const fullAnswer = userAnswer.join('');

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/games/crossword/check`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ id: data.id, answer: fullAnswer })
            });

            const result = await res.json();

            if (result.correct) {
                setIsCorrect(true);
                setScore(prev => prev + result.bonus_score);
                setMessage(result.message);
            } else {
                setMessage(result.message);
                // Shake effect or visual feedback could be added here
            }
        } catch (error) {
            console.error('Error checking answer', error);
        }
    };

    if (loading && !data) return <div className="p-8 text-center">Đang tải câu đố...</div>;

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <Link href="/student" className="flex items-center text-slate-600 hover:text-slate-900">
                        <ArrowLeft className="mr-2" size={20} />
                        Quay lại Dashboard
                    </Link>
                    <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-full text-yellow-700 font-bold">
                        <Trophy size={20} />
                        <span>Điểm thưởng phiên: {score}</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>

                    <div className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold mb-6">
                        Chủ đề: {data?.topic}
                    </div>

                    <h1 className="text-2xl font-bold text-slate-800 mb-8 leading-relaxed">
                        {data?.question}
                    </h1>

                    {/* Crossword Grid */}
                    <div className="flex justify-center flex-wrap gap-2 mb-8">
                        {userAnswer.map((char, index) => (
                            <input
                                key={index}
                                id={`char-${index}`}
                                type="text"
                                maxLength={1}
                                value={char}
                                disabled={isCorrect}
                                onChange={(e) => handleInputChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className={`w-12 h-14 md:w-14 md:h-16 border-2 rounded-lg text-center text-2xl font-bold uppercase transition-all
                                    ${isCorrect
                                        ? 'bg-green-100 border-green-500 text-green-700'
                                        : 'bg-white border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                                    }
                                    ${revealedIndices.includes(index) ? 'text-purple-600' : ''}
                                `}
                                autoComplete="off"
                            />
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex gap-4">
                            {!isCorrect ? (
                                <>
                                    <button
                                        onClick={() => setShowHint(!showHint)}
                                        className="flex items-center gap-2 px-6 py-3 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 transition-colors font-medium"
                                    >
                                        <Lightbulb size={20} />
                                        Gợi ý
                                    </button>
                                    <button
                                        onClick={checkAnswer}
                                        className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all font-bold text-lg"
                                    >
                                        Kiểm tra
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={fetchCrossword}
                                    className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 transition-all font-bold text-lg animate-bounce"
                                >
                                    <RefreshCw size={20} />
                                    Câu tiếp theo
                                </button>
                            )}
                        </div>

                        {/* Messages & Hints */}
                        {showHint && (
                            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 animate-fade-in-up">
                                <span className="font-semibold text-amber-600">Gợi ý:</span> {data?.hint}
                            </div>
                        )}

                        {message && (
                            <div className={`mt-4 text-lg font-bold ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                                {message}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
