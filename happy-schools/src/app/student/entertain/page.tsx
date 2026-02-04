'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Gamepad2, Brain, MessageCircle, Puzzle, ArrowLeft } from 'lucide-react';

const GAMES = [
    {
        id: 'memory',
        title: 'Lật Hình Rèn Trí Nhớ',
        description: 'Thử thách trí nhớ với 3 cấp độ: Dễ, Vừa và Khó.',
        icon: Brain,
        color: 'from-pink-500 to-rose-500',
        image: '/images/games/memory-thumbnail.png',
        href: '/student/entertain/memory',
        status: 'available'
    },
    {
        id: 'riddles',
        title: 'Giải Đố Vui',
        description: 'Những câu đố dân gian và trí tuệ hóc búa.',
        icon: Puzzle,
        color: 'from-violet-500 to-purple-500',
        image: '/images/games/riddles-thumbnail.png',
        href: '/student/entertain/riddles',
        status: 'available'
    },
    {
        id: 'word-chain',
        title: 'Nối Từ Tiếng Việt',
        description: 'Đấu trí nối từ với AI siêu thông minh.',
        icon: MessageCircle,
        color: 'from-amber-500 to-orange-500',
        image: '/images/games/word-chain-thumbnail.png',
        href: '/student/entertain/word-chain',
        status: 'available'
    }
];

export default function GameCenterPage() {
    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
            padding: '40px 24px',
            animation: 'fadeIn 0.5s ease-out'
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ marginBottom: '40px' }}>
                    <Link href="/student" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        color: 'white', textDecoration: 'none', fontWeight: 600,
                        marginBottom: '24px', backgroundColor: 'rgba(255,255,255,0.2)',
                        padding: '8px 16px', borderRadius: '12px',
                        backdropFilter: 'blur(4px)',
                        transition: 'all 0.2s ease'
                    }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                    >
                        <ArrowLeft size={20} />
                        Quay lại
                    </Link>

                    <div style={{ textAlign: 'center' }}>
                        <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>
                            🎮 Góc Giải Trí
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '18px' }}>Thư giãn và rèn luyện trí tuệ sau giờ học</p>
                    </div>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '24px'
                }}>
                    {GAMES.map((game) => (
                        <Link
                            key={game.id}
                            href={game.href}
                            style={{ textDecoration: 'none' }}
                        >
                            <div style={{
                                backgroundColor: 'white',
                                borderRadius: '24px',
                                overflow: 'hidden',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                cursor: 'pointer',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                position: 'relative',
                            }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-10px)';
                                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
                                }}
                            >
                                {/* Image Container */}
                                <div style={{ position: 'relative', width: '100%', height: '220px' }}>
                                    <Image
                                        src={game.image}
                                        alt={game.title}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        style={{ objectFit: 'cover' }}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        top: 0, left: 0, right: 0, bottom: 0,
                                        background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 100%)'
                                    }} />
                                </div>

                                <div style={{
                                    padding: '24px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                    flex: 1
                                }}>
                                    <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>
                                        {game.title}
                                    </h3>
                                    <p style={{ fontSize: '15px', color: '#4b5563', lineHeight: '1.6' }}>
                                        {game.description}
                                    </p>

                                    {game.status === 'coming_soon' ? (
                                        <span style={{
                                            marginTop: '16px',
                                            padding: '6px 16px',
                                            backgroundColor: '#f3f4f6',
                                            color: '#6b7280',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                        }}>
                                            Sắp ra mắt
                                        </span>
                                    ) : (
                                        <div style={{
                                            marginTop: 'auto',
                                            paddingTop: '20px',
                                            color: game.id === 'memory' ? '#ec4899' : game.id === 'riddles' ? '#8b5cf6' : '#f59e0b',
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            Chơi ngay &rarr;
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
