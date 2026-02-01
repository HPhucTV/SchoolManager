'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Script from 'next/script';
import { useAuth } from '@/lib/auth';

declare global {
    interface Window {
        JitsiMeetExternalAPI: any;
    }
}

// Lựa chọn server Jitsi (nếu meet.jit.si bị chặn, dùng server khác)
const JITSI_SERVERS = [
    'meet.jit.si',
    'jitsi.org',
];

export default function MeetingPage() {
    const { roomId } = useParams();
    const router = useRouter();
    const { user, isLoading } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [scriptLoaded, setScriptLoaded] = useState(false);

    const jitsiContainerRef = useRef<HTMLDivElement>(null);
    const jitsiApiRef = useRef<any>(null);
    const initAttemptRef = useRef(false);

    /* =========================
       Redirect if not logged in
    ========================= */
    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    /* =========================
       Init Jitsi (ONLY ONCE)
    ========================= */
    const startConference = () => {
        if (
            !user ||
            !scriptLoaded ||
            !window.JitsiMeetExternalAPI ||
            !jitsiContainerRef.current ||
            jitsiApiRef.current ||
            initAttemptRef.current
        ) {
            console.log('Cannot start conference:', {
                user: !!user,
                scriptLoaded,
                JitsiAPI: !!window.JitsiMeetExternalAPI,
                container: !!jitsiContainerRef.current,
                apiExists: !!jitsiApiRef.current,
                attempted: initAttemptRef.current,
            });
            return;
        }

        try {
            initAttemptRef.current = true;
            const roomName = (Array.isArray(roomId) ? roomId[0] : roomId)
                ?.replace(/[^a-zA-Z0-9_-]/g, 'room')
                ?.toLowerCase() || 'room';

            console.log('Starting Jitsi conference with room:', roomName);

            jitsiApiRef.current = new window.JitsiMeetExternalAPI(JITSI_SERVERS[0], {
                roomName,
                parentNode: jitsiContainerRef.current,
                width: '100%',
                height: '100%',
                userInfo: {
                    displayName: user.name || 'Guest',
                    email: user.email,
                },
                configOverwrite: {
                    startWithAudioMuted: true,
                    startWithVideoMuted: false,
                    prejoinPageEnabled: false,
                    disableDeepLinking: true,
                    enableWelcomePage: false,
                    enableClosePage: true,
                    disableAudioLevels: false,
                    constraints: {
                        video: {
                            height: {
                                ideal: 720,
                                max: 720,
                                min: 180,
                            },
                        },
                    },
                },
                interfaceConfigOverwrite: {
                    SHOW_JITSI_WATERMARK: false,
                    SHOW_WATERMARK_FOR_GUESTS: false,
                    TOOLBAR_BUTTONS: [
                        'microphone',
                        'camera',
                        'desktop',
                        'fullscreen',
                        'chat',
                        'raisehand',
                        'tileview',
                        'settings',
                        'hangup',
                    ],
                    DEFAULT_LANGUAGE: 'vi',
                },
                lang: 'vi',
            });

            jitsiApiRef.current.addEventListener('videoConferenceLeft', () => {
                console.log('User left conference');
                jitsiApiRef.current?.dispose();
                jitsiApiRef.current = null;
                router.push('/dashboard');
            });

            jitsiApiRef.current.addEventListener('readyToClose', () => {
                console.log('Conference ready to close');
                router.push('/dashboard');
            });

            jitsiApiRef.current.addEventListener('conferenceError', (error: any) => {
                console.error('Conference error:', error);
                setError(`Lỗi hội nghị: ${error.error}`);
            });

        } catch (err) {
            console.error('Failed to initialize Jitsi:', err);
            setError('Không thể khởi tạo cuộc họp. Vui lòng thử lại.');
            initAttemptRef.current = false;
        }
    };

    /* =========================
       Run when user is ready
    ========================= */
    useEffect(() => {
        if (!isLoading && user && scriptLoaded) {
            startConference();
        }

        return () => {
            if (jitsiApiRef.current) {
                try {
                    jitsiApiRef.current.dispose();
                    jitsiApiRef.current = null;
                    initAttemptRef.current = false;
                } catch (err) {
                    console.error('Error disposing Jitsi:', err);
                }
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading, user, scriptLoaded]);

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center text-[#5b21b6]">
                Đang tải phòng học...
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-red-50 text-red-900 p-4">
                <h1 className="text-2xl font-bold mb-4">Lỗi kết nối</h1>
                <p className="mb-6">{error}</p>
                <button
                    onClick={() => {
                        setError(null);
                        initAttemptRef.current = false;
                        setScriptLoaded(false);
                        window.location.reload();
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Thử lại
                </button>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-black">
            <Script
                src="https://meet.jit.si/external_api.js"
                strategy="afterInteractive"
                onLoad={() => {
                    console.log('Jitsi script loaded');
                    setScriptLoaded(true);
                }}
                onError={() => {
                    console.error('Failed to load Jitsi script');
                    setError('Không thể tải script hội nghị. Kiểm tra kết nối mạng.');
                }}
            />

            {!scriptLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                        <p>Đang khởi tạo cuộc họp...</p>
                    </div>
                </div>
            )}

            <div
                ref={jitsiContainerRef}
                className="h-full w-full"
            />
        </div>
    );
}
