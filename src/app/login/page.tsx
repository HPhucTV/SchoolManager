'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(false);

    const { login } = useAuth();
    const router = useRouter();

    // Handle resize to fix hydration mismatch
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        // Initial check
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Track mouse position for eye movement
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            // Calculate offset from center (-1 to 1)
            const offsetX = (e.clientX - centerX) / (rect.width / 2);
            const offsetY = (e.clientY - centerY) / (rect.height / 2);

            // Limit ease
            setEyeOffset({
                x: Math.max(-1, Math.min(1, offsetX)),
                y: Math.max(-1, Math.min(1, offsetY))
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    /* ─── Interaction Handlers ─── */
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [randomQuote, setRandomQuote] = useState('');
    const [quoteIndex, setQuoteIndex] = useState(0);

    const funnyQuotes = [
        "Gõ nhanh lên nào!",
        "Đừng nhìn lén nha!",
        "Mật khẩu là 123456 hả?",
        "Suỵt! Bí mật nhé...",
        "Tớ đang nhìn đấy!",
        "Hi hi, nhột quá!",
        "Chính xác chưa đó?"
    ];

    const handleInputFocus = () => {
        setIsInputFocused(true);
        // Pick a random quote distinct from the last one (simple approach)
        const nextIndex = (quoteIndex + 1) % funnyQuotes.length;
        setQuoteIndex(nextIndex);
        setRandomQuote(funnyQuotes[Math.floor(Math.random() * funnyQuotes.length)]);
    };

    const handleInputBlur = () => {
        setIsInputFocused(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

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
                fontFamily: "'Inter', sans-serif",
                backgroundColor: '#0f172a', // Ensure bg color matches
            }}
            className="flex-col md:flex-row" // Tailwind handling
        >
            {/* ══════ LEFT PANEL — Characters ══════ */}
            <div
                className="flex md:flex-1 relative overflow-hidden items-center justify-center bg-[#0f172a] w-full md:w-auto h-[45vh] md:h-screen transition-all duration-500"
            >
                {/* Background Effects */}
                <div className="absolute inset-0 bg-[#0f172a]">
                    <div className="absolute top-[10%] left-[20%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-indigo-600/20 rounded-full blur-[80px] md:blur-[120px] animate-pulse-slow"></div>
                    <div className="absolute bottom-[10%] right-[10%] w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-teal-500/10 rounded-full blur-[60px] md:blur-[100px] animate-pulse-slow delay-1000"></div>
                </div>

                <FloatingItems />

                {/* Title - Hidden on small mobile to save space for characters, or scaled down */}
                <div style={{
                    position: 'absolute',
                    top: '10%', // Moved up for mobile
                    left: '50%',
                    transform: 'translateX(-50%)',
                    textAlign: 'center',
                    zIndex: 5,
                    width: '100%',
                    transition: 'opacity 0.5s ease',
                    opacity: isInputFocused ? 0.3 : 1
                }} className="hidden md:block">
                    {/* Only show "Happy Schools" title on desktop, on mobile focus on characters */}
                    <h2 className="text-4xl font-bold text-white mb-2 tracking-tight animate-bounce-slow">
                        🎓 SchoolManager
                    </h2>
                    <p className="text-slate-400 text-lg font-medium">
                        Nơi niềm vui học tập bắt đầu!
                    </p>
                </div>

                {/* Speech bubble when covering */}
                {showPassword && (
                    <div className="absolute top-[15%] md:top-[25%] left-1/2 -translate-x-1/2 bg-white text-rose-500 px-4 py-2 md:px-5 md:py-3 rounded-2xl shadow-xl z-20 font-bold text-xs md:text-sm whitespace-nowrap animate-bounce">
                        🙈 Chúng tôi không nhìn đâu!
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white"></div>
                    </div>
                )}

                {/* Funny Quote Bubble (When Typing) */}
                {isInputFocused && !showPassword && (
                    <div className="absolute top-[20%] md:top-[28%] right-[5%] md:right-[15%] bg-white text-indigo-600 px-4 py-3 md:px-6 md:py-4 rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl shadow-2xl z-30 font-bold text-sm md:text-base whitespace-nowrap animate-in fade-in zoom-in slide-in-from-bottom-4 duration-300">
                        {randomQuote}
                        {/* Triangle pointer */}
                        <div className="absolute -bottom-3 right-8 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[12px] border-t-white"></div>
                    </div>
                )}

                {/* Characters container */}
                <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '350px',
                    maxWidth: '500px',
                    transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    // Responsive styling via conditional transform
                    transform: showPassword
                        ? 'translateY(20px)'
                        : isInputFocused
                            ? isMobile
                                ? 'scale(0.85) translateY(10px)' // Mobile focus: just slight move
                                : 'translate(60px, 10px) scale(0.95) rotate(-2deg)' // Desktop focus
                            : isMobile
                                ? 'scale(0.7)' // Mobile default: smaller
                                : 'scale(0.85)', // Desktop default
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {/* Glow behind characters */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[250px] md:w-[350px] h-[100px] md:h-[150px] bg-indigo-500/20 blur-3xl rounded-full animate-pulse"></div>

                    {/* Characters with funny animations & Staggered Entrance */}

                    {/* 1. Globe (Left) */}
                    <div className="absolute bottom-12 left-[10%] md:left-[5%]">
                        <div className="animate-jump-in" style={{ animationDelay: '0.1s' }}>
                            <div className="animate-sway">
                                <GlobeCharacter eyeOffset={eyeOffset} isCovering={showPassword} />
                            </div>
                        </div>
                    </div>

                    {/* 2. Pencil (Left-Center) */}
                    <div className="absolute bottom-24 left-[30%] z-10">
                        <div className="animate-jump-in" style={{ animationDelay: '0.3s' }}>
                            <div className="animate-float-slow">
                                <PencilCharacter eyeOffset={eyeOffset} isCovering={showPassword} />
                            </div>
                        </div>
                    </div>

                    {/* 3. Backpack (Right-Center) */}
                    <div
                        className="absolute bottom-16 right-[35%] md:right-[42%] z-10 transition-transform duration-500"
                        style={{ transform: isInputFocused ? 'translateX(10px) translateY(-5px)' : 'none' }}
                    >
                        <div className="animate-jump-in" style={{ animationDelay: '0.5s' }}>
                            <div className="animate-bounce-gentle">
                                <BackpackCharacter eyeOffset={eyeOffset} isCovering={showPassword} />
                            </div>
                        </div>
                    </div>

                    {/* 4. Star (Right) */}
                    <div className="absolute bottom-20 right-[2%] md:right-[5%] z-20">
                        <div className="animate-jump-in" style={{ animationDelay: '0.7s' }}>
                            <div className="animate-spin-slow">
                                <StarCharacter eyeOffset={eyeOffset} isCovering={showPassword} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════ RIGHT PANEL — Form ══════ */}
            <div className="flex-1 flex items-center justify-center p-6 bg-[#0f172a] relative border-t md:border-t-0 md:border-l border-white/5 w-full rounded-t-[2rem] md:rounded-none -mt-8 md:mt-0 z-20 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)] md:shadow-none min-h-[55vh] md:min-h-screen">
                {/* Decorative background for mobile */}
                <div className="absolute inset-0 md:hidden bg-[#0f172a] rounded-t-[2rem]">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
                </div>

                <div className="w-full max-w-md relative z-10 pb-8">
                    {/* Logo icon */}
                    <div className="text-center mb-6 md:mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 mb-4 transform hover:scale-110 hover:rotate-3 transition-all duration-300 animate-jump-in">
                            <span className="text-2xl md:text-3xl animate-wiggle">🏫</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight animate-jump-in" style={{ animationDelay: '0.2s' }}>
                            Chào mừng trở lại!
                        </h1>
                        <p className="text-slate-400 text-sm md:text-base animate-jump-in" style={{ animationDelay: '0.4s' }}>
                            Vui lòng nhập thông tin đăng nhập
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium mb-6 text-center animate-shake">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5 animate-jump-in" style={{ animationDelay: '0.8s' }}>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 ml-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onFocus={handleInputFocus}
                                onBlur={handleInputBlur}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@happyschools.vn"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all hover:bg-slate-800"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 ml-1">Mật khẩu</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onFocus={handleInputFocus}
                                    onBlur={handleInputBlur}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all hover:bg-slate-800 pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <a href="#" className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                                Quên mật khẩu?
                            </a>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-3.5 rounded-xl text-white font-bold text-base transition-all duration-300 shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 ${isLoading
                                ? 'bg-slate-700 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-500 hover:-translate-y-0.5'
                                }`}
                        >
                            {isLoading && <Loader2 size={18} className="animate-spin" />}
                            {isLoading ? 'Đang xử lý...' : 'Đăng nhập ngay'}
                        </button>
                    </form>

                    {/* Demo accounts */}
                    <div className="mt-8 p-5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 backdrop-blur-sm animate-jump-in" style={{ animationDelay: '1s' }}>
                        <p className="font-bold text-indigo-400 mb-3 text-sm flex items-center gap-2">
                            📌 Tài khoản Demo (Click để copy):
                        </p>
                        <div className="space-y-2 text-sm text-slate-300">
                            {[
                                { role: 'Admin', email: 'admin@happyschools.vn', pass: 'test123' },
                                { role: 'Giáo viên', email: 'gv.10a@happyschools.vn', pass: 'test123' },
                                { role: 'Học sinh', email: 'hs.an@happyschools.vn', pass: 'test123' }
                            ].map((acc, idx) => (
                                <div
                                    key={idx}
                                    className="group flex justify-between items-center p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                                    onClick={() => { setEmail(acc.email); setPassword(acc.pass); }}
                                    title="Click để điền tự động"
                                >
                                    <span className="font-medium text-white w-20">{acc.role}:</span>
                                    <span className="font-mono text-xs opacity-70 group-hover:opacity-100">{acc.email}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 text-center animate-jump-in" style={{ animationDelay: '1.4s' }}>
                        <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center gap-1">
                            ← Quay về Trang chủ
                        </Link>
                    </div>
                </div>
            </div>

            {/* ══════ Animations ══════ */}
            <style jsx global>{`
                /* Entrance Animation */
                @keyframes jump-in {
                    0% { opacity: 0; transform: translateY(50px) scale(0.5); }
                    60% { opacity: 1; transform: translateY(-10px) scale(1.05); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-jump-in {
                    animation: jump-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
                }

                @keyframes animate-pulse-slow {
                    0%, 100% { opacity: 0.4; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(1.1); }
                }
                .animate-pulse-slow {
                    animation: animate-pulse-slow 4s infinite;
                }
                @keyframes floatItem {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    25% { transform: translateY(-15px) rotate(5deg); }
                    50% { transform: translateY(-8px) rotate(-3deg); }
                    75% { transform: translateY(-20px) rotate(3deg); }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
                    20%, 40%, 60%, 80% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                }

                /* Funny animations */
                @keyframes sway {
                    0%, 100% { transform: rotate(-3deg); }
                    50% { transform: rotate(3deg); }
                }
                .animate-sway {
                    animation: sway 3s ease-in-out infinite;
                }

                @keyframes float-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-15px); }
                }
                .animate-float-slow {
                    animation: float-slow 4s ease-in-out infinite;
                }

                @keyframes bounce-gentle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                .animate-bounce-gentle {
                    animation: bounce-gentle 2.5s ease-in-out infinite;
                }

                @keyframes spin-slow {
                    0%, 100% { transform: rotate(0deg); }
                    50% { transform: rotate(10deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 5s ease-in-out infinite;
                }

                @keyframes wiggle {
                    0%, 100% { transform: rotate(-5deg); }
                    50% { transform: rotate(5deg); }
                }
                .animate-wiggle {
                    animation: wiggle 1s ease-in-out infinite;
                }

                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
