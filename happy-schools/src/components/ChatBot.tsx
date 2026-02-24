'use client';

import { useState, useRef, useEffect } from 'react';
import { User, Users, GraduationCap } from 'lucide-react';
import { BaseChatBot, Message } from './BaseChatBot';

type Persona = 'friend' | 'parent' | 'teacher';
const PERSONAS: { id: Persona; label: string; icon: React.ReactNode; description: string }[] = [
    { id: 'friend', label: 'Bạn bè', icon: <Users size={20} />, description: 'Trò chuyện như bạn thân' },
    { id: 'parent', label: 'Cha mẹ', icon: <User size={20} />, description: 'Lời khuyên từ cha mẹ' },
    { id: 'teacher', label: 'Thầy cô', icon: <GraduationCap size={20} />, description: 'Hướng dẫn từ thầy cô' },
];

export default function ChatBot() {
    const [persona, setPersona] = useState<Persona>('friend');
    const [showPersonaSelector, setShowPersonaSelector] = useState(true);
    const appendRef = useRef<(msg: Message) => void>(() => {});
    const setMessagesRef = useRef<React.Dispatch<React.SetStateAction<Message[]>>>(() => {});

    const handleReady = ({
        appendMessage,
        setMessages,
    }: {
        appendMessage: (msg: Message) => void;
        setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    }) => {
        appendRef.current = appendMessage;
        setMessagesRef.current = setMessages;
    };

    const selectPersona = (p: Persona) => {
        setPersona(p);
        setShowPersonaSelector(false);
        const greeting =
            p === 'friend'
                ? 'Chào bạn! 👋 Mình là trợ lý AI. Có chuyện gì bạn muốn chia sẻ không?'
                : p === 'parent'
                ? 'Chào con! 💚 Ba/mẹ luôn sẵn sàng lắng nghe con. Con có điều gì muốn nói không?'
                : 'Chào em! 📚 Thầy/cô sẵn sàng hỗ trợ em. Em có thắc mắc gì không?';
        setMessagesRef.current([{ role: 'assistant', content: greeting }]);
    };

    const resetChat = () => {
        setShowPersonaSelector(true);
        setMessagesRef.current([]);
    };

    const extraContent = showPersonaSelector ? (
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
                            backgroundColor: '#1e293b',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                    >
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
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
    ) : null;

    const handleUserMessage = async (_text: string, _appendMessage: (m: Message) => void) => {
        if (showPersonaSelector) {
            // ignore user input until persona selected
            return true;
        }
        return false;
    };

    return (
        <BaseChatBot
            persona={persona}
            initialMessages={[]}
            onUserMessage={handleUserMessage}
            disableInput={showPersonaSelector}
            headerTitle="Trợ lý Tâm lý AI"
            headerSubtitle={
                showPersonaSelector
                    ? 'Chọn vai trò'
                    : PERSONAS.find(p => p.id === persona)?.label || ''
            }
            headerRight={
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
            }
            extraContent={extraContent}
            placeholder="Hỏi chuyện gì đó hoặc chọn vai trò trước"
            onReady={handleReady}
        />
    );
}
