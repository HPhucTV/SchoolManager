'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

/* ─── Types ─── */
interface CharacterProps {
    eyeOffset: { x: number; y: number };
    isCovering: boolean; // true when password is visible → characters cover eyes
}

/* ─── SVG Character: Pencil (scared, covers eyes with hands) ─── */
function PencilCharacter({ eyeOffset, isCovering }: CharacterProps) {
    return (
        <svg viewBox="0 0 120 280" width="120" height="280" style={{ position: 'absolute', bottom: '40px', left: '38%', zIndex: 3 }}>
            {/* Body */}
            <rect x="25" y="40" width="70" height="200" rx="12" fill="#5B5FE6" />
            {/* Tip */}
            <polygon points="25,240 95,240 60,280" fill="#FFD666" />
            <polygon points="45,265 75,265 60,280" fill="#333" />
            {/* Top eraser */}
            <rect x="30" y="20" width="60" height="30" rx="8" fill="#FF7EB3" />
            {/* Band */}
            <rect x="25" y="45" width="70" height="12" rx="2" fill="#4A4ED4" />

            {isCovering ? (
                <>
                    {/* Covering eyes — two hands over face */}
                    <ellipse cx="45" cy="100" rx="18" ry="14" fill="#FFD666" />
                    <ellipse cx="75" cy="100" rx="18" ry="14" fill="#FFD666" />
                    {/* Fingers */}
                    <rect x="30" y="92" width="10" height="18" rx="5" fill="#FFD666" />
                    <rect x="42" y="89" width="10" height="22" rx="5" fill="#FFD666" />
                    <rect x="54" y="87" width="10" height="24" rx="5" fill="#FFD666" />
                    <rect x="66" y="89" width="10" height="22" rx="5" fill="#FFD666" />
                    <rect x="78" y="92" width="10" height="18" rx="5" fill="#FFD666" />
                    {/* Peeking — one tiny eye between fingers */}
                    <circle cx="59" cy="98" r="2.5" fill="#222" />
                    {/* Embarrassed mouth */}
                    <path d="M 48 125 Q 55 120 60 125 Q 65 130 72 125" stroke="#FF7EB3" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    {/* Sweat drop */}
                    <ellipse cx="88" cy="85" rx="3" ry="5" fill="#82B1FF" opacity="0.8">
                        <animate attributeName="cy" values="85;95;85" dur="1s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1s" repeatCount="indefinite" />
                    </ellipse>
                    {/* Blush */}
                    <ellipse cx="38" cy="118" rx="8" ry="4" fill="#FF7EB3" opacity="0.5" />
                    <ellipse cx="82" cy="118" rx="8" ry="4" fill="#FF7EB3" opacity="0.5" />
                </>
            ) : (
                <>
                    {/* Normal eyes */}
                    <ellipse cx={50 + eyeOffset.x * 3} cy={100 + eyeOffset.y * 2} rx="8" ry="10" fill="white" />
                    <ellipse cx={50 + eyeOffset.x * 5} cy={100 + eyeOffset.y * 3} rx="4" ry="5" fill="#222" />
                    {/* Sparkle in eye */}
                    <circle cx={48 + eyeOffset.x * 4} cy={97 + eyeOffset.y * 2} r="2" fill="white" opacity="0.8" />
                    <ellipse cx={75 + eyeOffset.x * 3} cy={100 + eyeOffset.y * 2} rx="8" ry="10" fill="white" />
                    <ellipse cx={75 + eyeOffset.x * 5} cy={100 + eyeOffset.y * 3} rx="4" ry="5" fill="#222" />
                    <circle cx={73 + eyeOffset.x * 4} cy={97 + eyeOffset.y * 2} r="2" fill="white" opacity="0.8" />
                    {/* Happy smile */}
                    <path d="M 48 125 Q 60 138 72 125" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    {/* Eyebrow */}
                    <path d="M 42 85 Q 50 80 58 85" stroke="#4A4ED4" strokeWidth="2" fill="none" strokeLinecap="round" />
                    <path d="M 65 85 Q 73 80 82 85" stroke="#4A4ED4" strokeWidth="2" fill="none" strokeLinecap="round" />
                </>
            )}
        </svg>
    );
}

/* ─── SVG Character: Globe (covers eyes, blushes heavily) ─── */
function GlobeCharacter({ eyeOffset, isCovering }: CharacterProps) {
    return (
        <svg viewBox="0 0 200 200" width="200" height="200" style={{ position: 'absolute', bottom: '20px', left: '5%', zIndex: 2 }}>
            {/* Body */}
            <circle cx="100" cy="100" r="90" fill="#FF8C42" />
            {/* Highlight */}
            <ellipse cx="75" cy="65" rx="35" ry="25" fill="#FFA563" opacity="0.6" />
            {/* Continent shapes */}
            <ellipse cx="80" cy="75" rx="20" ry="15" fill="#4CAF50" opacity="0.4" />
            <ellipse cx="120" cy="110" rx="15" ry="20" fill="#4CAF50" opacity="0.3" />

            {isCovering ? (
                <>
                    {/* Tightly shut eyes — X X */}
                    <line x1="68" y1="80" x2="88" y2="100" stroke="#333" strokeWidth="4" strokeLinecap="round" />
                    <line x1="88" y1="80" x2="68" y2="100" stroke="#333" strokeWidth="4" strokeLinecap="round" />
                    <line x1="108" y1="80" x2="128" y2="100" stroke="#333" strokeWidth="4" strokeLinecap="round" />
                    <line x1="128" y1="80" x2="108" y2="100" stroke="#333" strokeWidth="4" strokeLinecap="round" />
                    {/* Wavy panic mouth */}
                    <path d="M 70 125 Q 80 118 90 125 Q 100 132 110 125 Q 120 118 130 125" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
                    {/* Mega blush */}
                    <ellipse cx="60" cy="115" rx="14" ry="8" fill="#FF6B6B" opacity="0.6" />
                    <ellipse cx="140" cy="115" rx="14" ry="8" fill="#FF6B6B" opacity="0.6" />
                    {/* Sweat drops */}
                    <ellipse cx="45" cy="70" rx="4" ry="6" fill="#82B1FF" opacity="0.7">
                        <animate attributeName="cy" values="70;85;70" dur="0.8s" repeatCount="indefinite" />
                    </ellipse>
                    <ellipse cx="160" cy="75" rx="3" ry="5" fill="#82B1FF" opacity="0.6">
                        <animate attributeName="cy" values="75;88;75" dur="1.1s" repeatCount="indefinite" />
                    </ellipse>
                    {/* Exclamation marks */}
                    <text x="155" y="55" fontSize="20" fill="#E53935" fontWeight="bold" opacity="0.8">!</text>
                    <text x="40" y="50" fontSize="16" fill="#E53935" fontWeight="bold" opacity="0.7">!</text>
                </>
            ) : (
                <>
                    {/* Normal eyes */}
                    <ellipse cx={78 + eyeOffset.x * 3} cy={90 + eyeOffset.y * 2} rx="10" ry="12" fill="white" />
                    <ellipse cx={78 + eyeOffset.x * 5} cy={90 + eyeOffset.y * 3} rx="5" ry="6" fill="#222" />
                    <circle cx={76 + eyeOffset.x * 4} cy={87 + eyeOffset.y * 2} r="2.5" fill="white" opacity="0.8" />
                    <ellipse cx={118 + eyeOffset.x * 3} cy={90 + eyeOffset.y * 2} rx="10" ry="12" fill="white" />
                    <ellipse cx={118 + eyeOffset.x * 5} cy={90 + eyeOffset.y * 3} rx="5" ry="6" fill="#222" />
                    <circle cx={116 + eyeOffset.x * 4} cy={87 + eyeOffset.y * 2} r="2.5" fill="white" opacity="0.8" />
                    {/* Cute smile */}
                    <path d="M 80 120 Q 100 140 120 120" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
                    {/* Blush */}
                    <ellipse cx="65" cy="115" rx="10" ry="6" fill="#FF6B6B" opacity="0.3" />
                    <ellipse cx="135" cy="115" rx="10" ry="6" fill="#FF6B6B" opacity="0.3" />
                </>
            )}
        </svg>
    );
}

/* ─── SVG Character: Backpack (peeks through fingers) ─── */
function BackpackCharacter({ eyeOffset, isCovering }: CharacterProps) {
    return (
        <svg viewBox="0 0 130 220" width="130" height="220" style={{ position: 'absolute', bottom: '30px', left: '52%', zIndex: 4 }}>
            {/* Body */}
            <rect x="15" y="50" width="100" height="150" rx="20" fill="#2D2D2D" />
            {/* Top flap */}
            <rect x="30" y="20" width="70" height="50" rx="15" fill="#3D3D3D" />
            {/* Pocket */}
            <rect x="30" y="130" width="70" height="50" rx="10" fill="#404040" />
            <rect x="50" y="128" width="30" height="6" rx="3" fill="#555" />
            {/* Straps */}
            <rect x="5" y="70" width="15" height="80" rx="7" fill="#444" />
            <rect x="110" y="70" width="15" height="80" rx="7" fill="#444" />

            {isCovering ? (
                <>
                    {/* Hands covering face */}
                    <rect x="22" y="78" width="86" height="30" rx="12" fill="#666" />
                    {/* Peeking eyes — half-open, looking nervously */}
                    <ellipse cx="48" cy="88" rx="8" ry="3" fill="white" />
                    <ellipse cx="48" cy="89" rx="3.5" ry="2.5" fill="#222" />
                    <ellipse cx="82" cy="88" rx="8" ry="3" fill="white" />
                    <ellipse cx="82" cy="89" rx="3.5" ry="2.5" fill="#222" />
                    {/* Finger lines on hands */}
                    <line x1="35" y1="83" x2="35" y2="103" stroke="#555" strokeWidth="1.5" />
                    <line x1="50" y1="80" x2="50" y2="106" stroke="#555" strokeWidth="1.5" />
                    <line x1="65" y1="79" x2="65" y2="107" stroke="#555" strokeWidth="1.5" />
                    <line x1="80" y1="80" x2="80" y2="106" stroke="#555" strokeWidth="1.5" />
                    <line x1="95" y1="83" x2="95" y2="103" stroke="#555" strokeWidth="1.5" />
                    {/* Nervous mouth */}
                    <path d="M 50 115 Q 55 110 60 115 Q 65 120 70 115 Q 75 110 80 115" stroke="#888" strokeWidth="2" fill="none" strokeLinecap="round" />
                    {/* Question mark */}
                    <text x="98" y="68" fontSize="18" fill="#FFD233" fontWeight="bold">?</text>
                </>
            ) : (
                <>
                    {/* Normal eyes */}
                    <ellipse cx={48 + eyeOffset.x * 3} cy={90 + eyeOffset.y * 2} rx="9" ry="11" fill="white" />
                    <ellipse cx={48 + eyeOffset.x * 5} cy={90 + eyeOffset.y * 3} rx="4.5" ry="5.5" fill="#222" />
                    <circle cx={46 + eyeOffset.x * 4} cy={87 + eyeOffset.y * 2} r="2" fill="white" opacity="0.8" />
                    <ellipse cx={82 + eyeOffset.x * 3} cy={90 + eyeOffset.y * 2} rx="9" ry="11" fill="white" />
                    <ellipse cx={82 + eyeOffset.x * 5} cy={90 + eyeOffset.y * 3} rx="4.5" ry="5.5" fill="#222" />
                    <circle cx={80 + eyeOffset.x * 4} cy={87 + eyeOffset.y * 2} r="2" fill="white" opacity="0.8" />
                    {/* Content smile */}
                    <ellipse cx="65" cy="115" rx="8" ry="5" fill="#555" />
                    <ellipse cx="65" cy="113" rx="7" ry="3" fill="#2D2D2D" />
                </>
            )}
        </svg>
    );
}

/* ─── SVG Character: Star/Chick (tiny, covers whole face) ─── */
function StarCharacter({ eyeOffset, isCovering }: CharacterProps) {
    return (
        <svg viewBox="0 0 120 140" width="120" height="140" style={{ position: 'absolute', bottom: '15px', right: '5%', zIndex: 3 }}>
            {/* Body */}
            <ellipse cx="60" cy="85" rx="50" ry="55" fill="#FFD233" />
            {/* Highlight */}
            <ellipse cx="45" cy="65" rx="18" ry="12" fill="#FFE066" opacity="0.6" />

            {isCovering ? (
                <>
                    {/* Tiny hands covering face */}
                    <ellipse cx="42" cy="82" rx="16" ry="12" fill="#FFCA28" />
                    <ellipse cx="78" cy="82" rx="16" ry="12" fill="#FFCA28" />
                    {/* Eyes completely hidden — just lines */}
                    <line x1="36" y1="82" x2="48" y2="82" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="68" y1="82" x2="80" y2="82" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
                    {/* Embarrassed O mouth */}
                    <circle cx="60" cy="100" r="6" fill="#FFB300" stroke="#333" strokeWidth="2" />
                    {/* Floating hearts (embarrassed) */}
                    <text x="90" y="55" fontSize="14" opacity="0.7" fill="#FF7EB3">
                        ♥
                        <animate attributeName="y" values="55;45;55" dur="1.5s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.7;0.3;0.7" dur="1.5s" repeatCount="indefinite" />
                    </text>
                    {/* Mega blush */}
                    <ellipse cx="35" cy="95" rx="8" ry="5" fill="#FF7EB3" opacity="0.6" />
                    <ellipse cx="85" cy="95" rx="8" ry="5" fill="#FF7EB3" opacity="0.6" />
                </>
            ) : (
                <>
                    {/* Normal eyes */}
                    <ellipse cx={45 + eyeOffset.x * 3} cy={78 + eyeOffset.y * 2} rx="7" ry="9" fill="white" />
                    <ellipse cx={45 + eyeOffset.x * 5} cy={78 + eyeOffset.y * 3} rx="3.5" ry="4.5" fill="#222" />
                    <circle cx={43 + eyeOffset.x * 4} cy={75 + eyeOffset.y * 2} r="1.8" fill="white" opacity="0.8" />
                    <ellipse cx={72 + eyeOffset.x * 3} cy={78 + eyeOffset.y * 2} rx="7" ry="9" fill="white" />
                    <ellipse cx={72 + eyeOffset.x * 5} cy={78 + eyeOffset.y * 3} rx="3.5" ry="4.5" fill="#222" />
                    <circle cx={70 + eyeOffset.x * 4} cy={75 + eyeOffset.y * 2} r="1.8" fill="white" opacity="0.8" />
                    {/* Happy smile */}
                    <path d="M 48 100 Q 58 112 70 100" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    {/* Tiny hands */}
                    <ellipse cx="12" cy="90" rx="8" ry="6" fill="#FFCA28" />
                    <ellipse cx="108" cy="90" rx="8" ry="6" fill="#FFCA28" />
                </>
            )}
        </svg>
    );
}

/* ─── Floating particles ─── */
function FloatingItems() {
    const items = [
        { emoji: '📚', top: '10%', left: '10%', delay: '0s', dur: '6s' },
        { emoji: '✏️', top: '20%', left: '70%', delay: '1s', dur: '5s' },
        { emoji: '🎒', top: '60%', left: '15%', delay: '2s', dur: '7s' },
        { emoji: '⭐', top: '15%', left: '45%', delay: '0.5s', dur: '4s' },
        { emoji: '📐', top: '50%', left: '75%', delay: '3s', dur: '6s' },
        { emoji: '🎓', top: '75%', left: '50%', delay: '1.5s', dur: '5s' },
        { emoji: '🌟', top: '5%', left: '80%', delay: '2.5s', dur: '8s' },
        { emoji: '📖', top: '40%', left: '30%', delay: '0.8s', dur: '5.5s' },
    ];
    return (
        <>
            {items.map((item, i) => (
                <div
                    key={i}
                    style={{
                        position: 'absolute',
                        top: item.top,
                        left: item.left,
                        fontSize: '24px',
                        opacity: 0.25,
                        animation: `floatItem ${item.dur} ease-in-out ${item.delay} infinite`,
                        pointerEvents: 'none',
                        zIndex: 1,
                    }}
                >
                    {item.emoji}
                </div>
            ))}
        </>
    );
}

/* ─── Main Login Page ─── */
export default function LoginPage() {
    const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const { login } = useAuth();
    const router = useRouter();

    // Track mouse position for eye movement
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const x = Math.max(-1, Math.min(1, (e.clientX - centerX) / (rect.width / 2)));
            const y = Math.max(-1, Math.min(1, (e.clientY - centerY) / (rect.height / 2)));
            setEyeOffset({ x, y });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (activeTab === 'signup') {
            if (password !== confirmPassword) {
                setError('Mật khẩu xác nhận không khớp');
                setIsLoading(false);
                return;
            }
            setError('Chức năng đăng ký sẽ sớm được hỗ trợ!');
            setIsLoading(false);
            return;
        }

        try {
            await login(email, password);
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
                const user = JSON.parse(savedUser);
                if (user.role === 'student') router.push('/student');
                else if (user.role === 'admin') router.push('/admin');
                else router.push('/teacher');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            ref={containerRef}
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'row',
                fontFamily: "'Inter', sans-serif",
            }}
        >
            {/* ══════ LEFT PANEL — Characters ══════ */}
            <div
                style={{
                    flex: '1 1 50%',
                    background: 'linear-gradient(160deg, #FFF5E6 0%, #FFECD2 40%, #FFE0B2 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    minHeight: '100vh',
                }}
            >
                <FloatingItems />

                {/* Title */}
                <div style={{
                    position: 'absolute',
                    top: '60px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    textAlign: 'center',
                    zIndex: 5,
                }}>
                    <h2 style={{
                        fontSize: '32px',
                        fontWeight: 800,
                        color: '#5B5FE6',
                        margin: 0,
                        lineHeight: 1.2,
                    }}>
                        🎓 Happy Schools
                    </h2>
                    <p style={{
                        fontSize: '15px',
                        color: '#888',
                        marginTop: '8px',
                        fontWeight: 500,
                    }}>
                        Nơi niềm vui học tập bắt đầu!
                    </p>
                </div>

                {/* Speech bubble when covering */}
                {showPassword && (
                    <div style={{
                        position: 'absolute',
                        top: '130px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'white',
                        borderRadius: '16px',
                        padding: '10px 18px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        zIndex: 10,
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#E53935',
                        whiteSpace: 'nowrap',
                        animation: 'popIn 0.3s ease-out',
                    }}>
                        🙈 Chúng tôi không nhìn đâu!
                        {/* Triangle pointer */}
                        <div style={{
                            position: 'absolute',
                            bottom: '-8px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '8px solid transparent',
                            borderRight: '8px solid transparent',
                            borderTop: '8px solid white',
                        }} />
                    </div>
                )}

                {/* Characters container */}
                <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '340px',
                    maxWidth: '500px',
                    transition: 'transform 0.3s ease',
                    transform: showPassword ? 'translateY(5px)' : 'translateY(0)',
                }}>
                    <GlobeCharacter eyeOffset={eyeOffset} isCovering={showPassword} />
                    <PencilCharacter eyeOffset={eyeOffset} isCovering={showPassword} />
                    <BackpackCharacter eyeOffset={eyeOffset} isCovering={showPassword} />
                    <StarCharacter eyeOffset={eyeOffset} isCovering={showPassword} />
                </div>

                {/* Ground shadow */}
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '20px',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.06), transparent)',
                }} />
            </div>

            {/* ══════ RIGHT PANEL — Form ══════ */}
            <div
                style={{
                    flex: '1 1 50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px',
                    background: '#fff',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Decorative wave at bottom */}
                <svg
                    viewBox="0 0 500 120"
                    preserveAspectRatio="none"
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '100%',
                        height: '120px',
                        zIndex: 0,
                    }}
                >
                    <defs>
                        <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#B388FF" stopOpacity="0.3" />
                            <stop offset="50%" stopColor="#FF80AB" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#82B1FF" stopOpacity="0.3" />
                        </linearGradient>
                    </defs>
                    <path d="M0,40 C100,100 200,0 300,60 C400,120 450,20 500,60 L500,120 L0,120 Z" fill="url(#waveGrad)" />
                    <path d="M0,70 C80,30 180,100 280,50 C380,0 440,80 500,40 L500,120 L0,120 Z" fill="url(#waveGrad)" opacity="0.5" />
                </svg>

                <div style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1 }}>
                    {/* Logo icon */}
                    <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '48px',
                            height: '48px',
                            borderRadius: '14px',
                            background: 'linear-gradient(135deg, #5B5FE6, #7C4DFF)',
                            boxShadow: '0 8px 24px rgba(91, 95, 230, 0.3)',
                            marginBottom: '6px',
                        }}>
                            <span style={{ fontSize: '24px' }}>🏫</span>
                        </div>
                    </div>

                    {/* Welcome text */}
                    <h1 style={{
                        fontSize: '28px',
                        fontWeight: 800,
                        color: '#1a1a2e',
                        textAlign: 'center',
                        margin: '0 0 4px 0',
                    }}>
                        {activeTab === 'login' ? 'Chào mừng trở lại!' : 'Tạo tài khoản'}
                    </h1>
                    <p style={{
                        color: '#999',
                        textAlign: 'center',
                        marginBottom: '28px',
                        fontSize: '14px',
                    }}>
                        {activeTab === 'login'
                            ? 'Vui lòng nhập thông tin đăng nhập'
                            : 'Điền thông tin để bắt đầu'}
                    </p>

                    {/* Tab switcher */}
                    <div style={{
                        display: 'flex',
                        marginBottom: '24px',
                        borderRadius: '12px',
                        background: '#f5f5f5',
                        padding: '4px',
                    }}>
                        {(['login', 'signup'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => { setActiveTab(tab); setError(''); }}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    border: 'none',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    transition: 'all 0.3s ease',
                                    background: activeTab === tab
                                        ? 'linear-gradient(135deg, #5B5FE6, #7C4DFF)'
                                        : 'transparent',
                                    color: activeTab === tab ? 'white' : '#999',
                                    boxShadow: activeTab === tab
                                        ? '0 4px 12px rgba(91, 95, 230, 0.3)'
                                        : 'none',
                                }}
                            >
                                {tab === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                            </button>
                        ))}
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{
                            padding: '10px 14px',
                            borderRadius: '10px',
                            backgroundColor: '#FFF0F0',
                            color: '#E53935',
                            fontSize: '13px',
                            marginBottom: '16px',
                            textAlign: 'center',
                            border: '1px solid #FFCDD2',
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        {activeTab === 'signup' && (
                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Họ và tên</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Nguyễn Văn A"
                                    required
                                    style={inputStyle}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                />
                            </div>
                        )}

                        <div style={{ marginBottom: '16px' }}>
                            <label style={labelStyle}>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                style={inputStyle}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                            />
                        </div>

                        <div style={{ marginBottom: activeTab === 'signup' ? '16px' : '10px' }}>
                            <label style={labelStyle}>Mật khẩu</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    style={{ ...inputStyle, paddingRight: '44px' }}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: showPassword ? '#7C4DFF' : '#aaa',
                                        padding: '4px',
                                        transition: 'color 0.2s ease',
                                    }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {activeTab === 'signup' && (
                            <div style={{ marginBottom: '10px' }}>
                                <label style={labelStyle}>Xác nhận mật khẩu</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    style={inputStyle}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                />
                            </div>
                        )}

                        {activeTab === 'login' && (
                            <div style={{
                                textAlign: 'right',
                                marginBottom: '20px',
                            }}>
                                <a href="#" style={{
                                    fontSize: '13px',
                                    color: '#7C4DFF',
                                    textDecoration: 'none',
                                    fontWeight: 500,
                                }}>
                                    Quên mật khẩu?
                                </a>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                padding: '14px',
                                fontSize: '15px',
                                fontWeight: 700,
                                color: 'white',
                                background: isLoading
                                    ? '#bbb'
                                    : 'linear-gradient(135deg, #5B5FE6 0%, #7C4DFF 100%)',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                boxShadow: isLoading ? 'none' : '0 8px 24px rgba(91, 95, 230, 0.35)',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                marginTop: activeTab === 'signup' ? '20px' : '0',
                            }}
                        >
                            {isLoading && <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />}
                            {isLoading
                                ? 'Đang xử lý...'
                                : activeTab === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                        </button>
                    </form>

                    {/* Demo accounts */}
                    <div style={{
                        marginTop: '24px',
                        padding: '14px',
                        background: 'linear-gradient(135deg, #F3E5F5 0%, #E8EAF6 100%)',
                        borderRadius: '12px',
                        fontSize: '12px',
                    }}>
                        <p style={{ fontWeight: 700, color: '#5B5FE6', marginBottom: '6px', fontSize: '13px' }}>
                            📌 Tài khoản demo:
                        </p>
                        <p style={{ color: '#555', marginBottom: '3px' }}>
                            <strong>Admin:</strong> admin@happyschools.vn / test123
                        </p>
                        <p style={{ color: '#555', marginBottom: '3px' }}>
                            <strong>Giáo viên:</strong> gv.10a@happyschools.vn / test123
                        </p>
                        <p style={{ color: '#555' }}>
                            <strong>Học sinh:</strong> hs.an@happyschools.vn / test123
                        </p>
                    </div>

                    {/* Switch prompt */}
                    <p style={{
                        textAlign: 'center',
                        marginTop: '20px',
                        fontSize: '13px',
                        color: '#999',
                    }}>
                        {activeTab === 'login'
                            ? 'Chưa có tài khoản? '
                            : 'Đã có tài khoản? '}
                        <button
                            onClick={() => { setActiveTab(activeTab === 'login' ? 'signup' : 'login'); setError(''); }}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#7C4DFF',
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontSize: '13px',
                            }}
                        >
                            {activeTab === 'login' ? 'Đăng ký' : 'Đăng nhập'}
                        </button>
                    </p>
                </div>
            </div>

            {/* ══════ Animations ══════ */}
            <style jsx global>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes floatItem {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    25% { transform: translateY(-15px) rotate(5deg); }
                    50% { transform: translateY(-8px) rotate(-3deg); }
                    75% { transform: translateY(-20px) rotate(3deg); }
                }
                @keyframes popIn {
                    0% { transform: translateX(-50%) scale(0.5); opacity: 0; }
                    70% { transform: translateX(-50%) scale(1.1); opacity: 1; }
                    100% { transform: translateX(-50%) scale(1); opacity: 1; }
                }
                @media (max-width: 768px) {
                    div[style*="flex-direction: row"] {
                        flex-direction: column !important;
                    }
                }
            `}</style>
        </div>
    );
}

/* ─── Shared styles ─── */
const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#555',
    marginBottom: '6px',
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    fontSize: '14px',
    borderRadius: '10px',
    border: '2px solid #eee',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    background: '#fafafa',
    color: '#333',
    boxSizing: 'border-box',
};

const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#7C4DFF';
    e.target.style.boxShadow = '0 0 0 3px rgba(124, 77, 255, 0.1)';
    e.target.style.background = '#fff';
};

const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#eee';
    e.target.style.boxShadow = 'none';
    e.target.style.background = '#fafafa';
};
