'use client';

import { useState, useEffect } from 'react';
import {
    Heart, Sun, Smile, Star, Zap, Cloud, Moon, Music,
    Coffee, Flower, Ghost, Crown, Anchor, Gift, Bell, Camera
} from 'lucide-react';
import { ArrowLeft, RefreshCw, Trophy } from 'lucide-react';
import Link from 'next/link';

// Available icons for the game
const ICONS = [
    Heart, Sun, Smile, Star, Zap, Cloud, Moon, Music,
    Coffee, Flower, Ghost, Crown, Anchor, Gift, Bell, Camera
];

type Level = 'easy' | 'medium' | 'hard';

const LEVELS = {
    easy: { pairs: 6, cols: 3, label: 'Dễ' }, // 4x3 grid
    medium: { pairs: 8, cols: 4, label: 'Vừa' }, // 4x4 grid
    hard: { pairs: 12, cols: 4, label: 'Khó' }, // 6x4 grid
};

interface Card {
    id: number;
    iconIndex: number;
    isFlipped: boolean;
    isMatched: boolean;
}

export default function MemoryGamePage() {
    const [level, setLevel] = useState<Level>('easy');
    const [cards, setCards] = useState<Card[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [matchedCount, setMatchedCount] = useState(0);
    const [moves, setMoves] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [gameWon, setGameWon] = useState(false);

    // Initialize game
    const initGame = (selectedLevel: Level) => {
        const config = LEVELS[selectedLevel];
        const selectedIcons = ICONS.slice(0, config.pairs);

        // Double the icons to make pairs
        const deck = [...selectedIcons, ...selectedIcons].map((_, index) => ({
            id: index,
            iconIndex: index % config.pairs,
            isFlipped: false,
            isMatched: false,
        }));

        // Shuffle
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        setCards(deck);
        setFlippedIndices([]);
        setMatchedCount(0);
        setMoves(0);
        setGameWon(false);
        setIsPlaying(true);
        setLevel(selectedLevel);
    };

    useEffect(() => {
        initGame('easy');
    }, []);

    // Handle card click
    const handleCardClick = (index: number) => {
        if (!isPlaying || gameWon || cards[index].isMatched || cards[index].isFlipped || flippedIndices.length >= 2) {
            return;
        }

        // Flip card
        const newCards = [...cards];
        newCards[index].isFlipped = true;
        setCards(newCards);

        const newFlipped = [...flippedIndices, index];
        setFlippedIndices(newFlipped);

        // Check match if 2 cards flipped
        if (newFlipped.length === 2) {
            setMoves(m => m + 1);
            const [firstIndex, secondIndex] = newFlipped;

            if (cards[firstIndex].iconIndex === cards[secondIndex].iconIndex) {
                // Match
                setTimeout(() => {
                    setCards(prev => prev.map((c, i) =>
                        i === firstIndex || i === secondIndex
                            ? { ...c, isMatched: true, isFlipped: true }
                            : c
                    ));
                    setFlippedIndices([]);
                    setMatchedCount(prev => {
                        const newCount = prev + 1;
                        if (newCount === LEVELS[level].pairs) {
                            setGameWon(true);
                            setIsPlaying(false);
                        }
                        return newCount;
                    });
                }, 500);
            } else {
                // No match
                setTimeout(() => {
                    setCards(prev => prev.map((c, i) =>
                        i === firstIndex || i === secondIndex
                            ? { ...c, isFlipped: false }
                            : c
                    ));
                    setFlippedIndices([]);
                }, 1000);
            }
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
                <Link href="/student/entertain" style={{
                    padding: '10px', backgroundColor: 'white', borderRadius: '12px', color: '#374151',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display: 'flex'
                }}>
                    <ArrowLeft size={20} />
                </Link>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1f2937', margin: 0 }}>Vườn Ươm Cảm Xúc</h1>
            </div>

            {/* Controls */}
            <div style={{
                backgroundColor: 'white', padding: '20px', borderRadius: '20px',
                marginBottom: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px'
            }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                    {(Object.keys(LEVELS) as Level[]).map((l) => (
                        <button
                            key={l}
                            onClick={() => initGame(l)}
                            style={{
                                padding: '8px 16px', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: 'pointer',
                                backgroundColor: level === l ? '#22c55e' : '#f3f4f6',
                                color: level === l ? 'white' : '#6b7280',
                                transition: 'all 0.2s',
                            }}
                        >
                            {LEVELS[l].label}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '20px', fontWeight: 600, color: '#374151', alignItems: 'center' }}>
                    <span>Số bước: {moves}</span>
                    <button
                        onClick={() => initGame(level)}
                        style={{
                            padding: '8px', borderRadius: '50%', backgroundColor: '#e5e7eb',
                            border: 'none', cursor: 'pointer', display: 'flex'
                        }}
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {/* Game Board */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${LEVELS[level].cols}, minmax(80px, 1fr))`,
                gap: '16px', maxWidth: '600px', margin: '0 auto',
                perspective: '1000px'
            }}>
                {cards.map((card, index) => {
                    const Icon = ICONS[card.iconIndex];
                    return (
                        <div
                            key={card.id}
                            onClick={() => handleCardClick(index)}
                            style={{
                                aspectRatio: '1', cursor: 'pointer',
                                position: 'relative', transformStyle: 'preserve-3d',
                                transition: 'transform 0.6s',
                                transform: card.isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                            }}
                        >
                            {/* Front (Hidden) */}
                            <div style={{
                                position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                                backgroundColor: '#bfdbfe', borderRadius: '16px',
                                background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)',
                                border: '2px solid white'
                            }}>
                                <span style={{ fontSize: '32px', opacity: 0.5 }}>?</span>
                            </div>

                            {/* Back (Revealed) */}
                            <div style={{
                                position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                                backgroundColor: 'white', borderRadius: '16px',
                                transform: 'rotateY(180deg)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                                border: card.isMatched ? '4px solid #22c55e' : '1px solid #e5e7eb'
                            }}>
                                <Icon size={40} color={card.isMatched ? '#22c55e' : '#f59e0b'} fill={card.isMatched ? '#dcfce7' : 'none'} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Victory Overlay */}
            {gameWon && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        backgroundColor: 'white', padding: '40px', borderRadius: '32px',
                        textAlign: 'center', maxWidth: '90%', width: '400px',
                        animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#fef3c7',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                            color: '#f59e0b'
                        }}>
                            <Trophy size={40} fill="#f59e0b" />
                        </div>
                        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', margin: '0 0 8px 0' }}>Xuất sắc!</h2>
                        <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                            Bạn đã hoàn thành mức {LEVELS[level].label} trong {moves} bước.
                        </p>
                        <button
                            onClick={() => initGame(level)}
                            style={{
                                padding: '12px 32px', borderRadius: '16px', border: 'none', cursor: 'pointer',
                                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                color: 'white', fontWeight: 700, fontSize: '16px',
                                boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)'
                            }}
                        >
                            Chơi lại
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes popIn {
                    from { opacity: 0; transform: scale(0.8); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}
