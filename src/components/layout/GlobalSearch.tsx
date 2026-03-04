'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search, Clock, Users, School, FileText,
    ClipboardList, Activity, Bell, ArrowRight, Command,
} from 'lucide-react';
import { searchApi } from '@/lib/api';

interface SearchResult {
    id: number;
    title: string;
    subtitle: string;
    extra: string;
    type: string;
    score: number;
    url: string;
}

interface Suggestion {
    text: string;
    type: string;
}

const TYPE_CONFIG: Record<string, { icon: typeof Users; label: string; color: string; bg: string }> = {
    students: { icon: Users, label: 'Học sinh', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
    classes: { icon: School, label: 'Lớp học', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
    assignments: { icon: FileText, label: 'Bài tập', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
    quizzes: { icon: ClipboardList, label: 'Bài kiểm tra', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
    activities: { icon: Activity, label: 'Hoạt động', color: '#f472b6', bg: 'rgba(244,114,182,0.12)' },
    notifications: { icon: Bell, label: 'Thông báo', color: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
};

export default function GlobalSearch({ onClose }: { onClose: () => void }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Record<string, SearchResult[]>>({});
    const [topResults, setTopResults] = useState<SearchResult[]>([]);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [total, setTotal] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const router = useRouter();

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    // Focus input on mount & load suggestions
    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 100);
        searchApi.getSuggestions('').then(data => {
            setSuggestions(data.suggestions || []);
        }).catch(() => { });
    }, []);

    // Debounced search
    const doSearch = useCallback((q: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!q.trim()) {
            setResults({});
            setTopResults([]);
            setTotal(0);
            setSelectedIndex(-1);
            // reload suggestions
            searchApi.getSuggestions('').then(data => {
                setSuggestions(data.suggestions || []);
            }).catch(() => { });
            return;
        }
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const [searchData, suggestData] = await Promise.all([
                    searchApi.search(q),
                    searchApi.getSuggestions(q),
                ]);
                setResults(searchData.results || {});
                setTopResults(searchData.top_results || []);
                setTotal(searchData.total || 0);
                setSuggestions(suggestData.suggestions || []);
                setSelectedIndex(-1);
            } catch {
                // ignore
            } finally {
                setLoading(false);
            }
        }, 300);
    }, []);

    const handleInputChange = (value: string) => {
        setQuery(value);
        doSearch(value);
    };

    const handleResultClick = (result: SearchResult) => {
        // Log click for personalization
        searchApi.logClick({
            query: query,
            result_type: result.type,
            result_id: result.id,
        }).catch(() => { });
        onClose();
        router.push(result.url);
    };

    const handleSuggestionClick = (text: string) => {
        setQuery(text);
        doSearch(text);
    };

    // Keyboard navigation
    const flatResults = topResults;
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, flatResults.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, -1));
        } else if (e.key === 'Enter' && selectedIndex >= 0 && flatResults[selectedIndex]) {
            e.preventDefault();
            handleResultClick(flatResults[selectedIndex]);
        }
    };



    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9998,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    animation: 'gsBackdropIn 0.2s ease-out',
                }}
            />

            {/* Modal */}
            <div style={{
                position: 'fixed',
                top: '15%',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                width: '100%',
                maxWidth: '640px',
                animation: 'gsModalIn 0.25s ease-out',
            }}>
                <div style={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '16px',
                    boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(148,163,184,0.1)',
                    overflow: 'hidden',
                    maxHeight: '70vh',
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    {/* Search Input */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '16px 20px',
                        borderBottom: '1px solid #334155',
                    }}>
                        <Search style={{ width: '20px', height: '20px', color: '#14b8a6', flexShrink: 0 }} />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={e => handleInputChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Tìm kiếm học sinh, lớp học, bài tập, bài kiểm tra..."
                            style={{
                                flex: 1,
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                fontSize: '15px',
                                color: '#e2e8f0',
                                fontWeight: 400,
                            }}
                        />
                        {loading && (
                            <div style={{
                                width: '18px', height: '18px',
                                border: '2px solid #334155',
                                borderTopColor: '#14b8a6',
                                borderRadius: '50%',
                                animation: 'gsSpin 0.6s linear infinite',
                                flexShrink: 0,
                            }} />
                        )}
                        <button
                            onClick={onClose}
                            style={{
                                background: 'rgba(148,163,184,0.15)',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                color: '#94a3b8',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                flexShrink: 0,
                            }}
                        >
                            ESC
                        </button>
                    </div>

                    {/* Results area */}
                    <div style={{ overflowY: 'auto', maxHeight: 'calc(70vh - 60px)' }}>

                        {/* Suggestions (when no query) */}
                        {!query.trim() && suggestions.length > 0 && (
                            <div style={{ padding: '12px 16px' }}>
                                <div style={{
                                    fontSize: '11px', fontWeight: 600,
                                    color: '#64748b', textTransform: 'uppercase',
                                    letterSpacing: '0.05em', marginBottom: '8px',
                                }}>
                                    🕐 Tìm kiếm gần đây
                                </div>
                                {suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSuggestionClick(s.text)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            width: '100%',
                                            padding: '8px 12px',
                                            background: 'transparent',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: '#cbd5e1',
                                            fontSize: '13px',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(148,163,184,0.08)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <Clock style={{ width: '14px', height: '14px', color: '#64748b' }} />
                                        {s.text}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Autocomplete suggestions (when typing) */}
                        {query.trim() && suggestions.length > 0 && total === 0 && !loading && (
                            <div style={{ padding: '12px 16px' }}>
                                <div style={{
                                    fontSize: '11px', fontWeight: 600,
                                    color: '#64748b', textTransform: 'uppercase',
                                    letterSpacing: '0.05em', marginBottom: '8px',
                                }}>
                                    💡 Gợi ý
                                </div>
                                {suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSuggestionClick(s.text)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            width: '100%',
                                            padding: '8px 12px',
                                            background: 'transparent',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: '#cbd5e1',
                                            fontSize: '13px',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(148,163,184,0.08)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <Search style={{ width: '14px', height: '14px', color: '#64748b' }} />
                                        {s.text}
                                        <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#475569' }}>{s.type}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Grouped results */}
                        {query.trim() && total > 0 && (
                            <div style={{ padding: '8px 12px' }}>
                                {/* Summary */}
                                <div style={{
                                    padding: '8px 8px 12px',
                                    fontSize: '12px',
                                    color: '#64748b',
                                }}>
                                    Tìm thấy <strong style={{ color: '#14b8a6' }}>{total}</strong> kết quả cho &quot;<strong style={{ color: '#e2e8f0' }}>{query}</strong>&quot;
                                </div>

                                {Object.entries(results).map(([type, items]) => {
                                    if (!items || items.length === 0) return null;
                                    const config = TYPE_CONFIG[type];
                                    if (!config) return null;
                                    const Icon = config.icon;

                                    return (
                                        <div key={type} style={{ marginBottom: '8px' }}>
                                            {/* Category header */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '6px 8px',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                color: config.color,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em',
                                            }}>
                                                <Icon style={{ width: '14px', height: '14px' }} />
                                                {config.label}
                                                <span style={{
                                                    marginLeft: '4px',
                                                    background: config.bg,
                                                    padding: '1px 6px',
                                                    borderRadius: '10px',
                                                    fontSize: '10px',
                                                }}>
                                                    {items.length}
                                                </span>
                                            </div>

                                            {/* Items */}
                                            {items.slice(0, 5).map((item, idx) => {
                                                const globalIdx = flatResults.findIndex(
                                                    r => r.id === item.id && r.type === item.type
                                                );
                                                const isSelected = globalIdx === selectedIndex;

                                                return (
                                                    <button
                                                        key={`${item.type}-${item.id}-${idx}`}
                                                        onClick={() => handleResultClick(item)}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '12px',
                                                            width: '100%',
                                                            padding: '10px 12px',
                                                            background: isSelected ? 'rgba(20,184,166,0.1)' : 'transparent',
                                                            border: isSelected ? '1px solid rgba(20,184,166,0.2)' : '1px solid transparent',
                                                            borderRadius: '10px',
                                                            cursor: 'pointer',
                                                            textAlign: 'left',
                                                            transition: 'all 0.15s',
                                                        }}
                                                        onMouseEnter={e => {
                                                            if (!isSelected) {
                                                                e.currentTarget.style.background = 'rgba(148,163,184,0.06)';
                                                            }
                                                        }}
                                                        onMouseLeave={e => {
                                                            if (!isSelected) {
                                                                e.currentTarget.style.background = 'transparent';
                                                            }
                                                        }}
                                                    >
                                                        {/* Icon */}
                                                        <div style={{
                                                            width: '36px',
                                                            height: '36px',
                                                            borderRadius: '10px',
                                                            background: config.bg,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            flexShrink: 0,
                                                        }}>
                                                            <Icon style={{ width: '16px', height: '16px', color: config.color }} />
                                                        </div>

                                                        {/* Content */}
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{
                                                                fontSize: '13px',
                                                                fontWeight: 600,
                                                                color: '#e2e8f0',
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                            }}>
                                                                {item.title}
                                                            </div>
                                                            {item.subtitle && (
                                                                <div style={{
                                                                    fontSize: '11px',
                                                                    color: '#64748b',
                                                                    marginTop: '2px',
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                }}>
                                                                    {item.subtitle}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Status badge */}
                                                        {item.extra && (
                                                            <span style={{
                                                                fontSize: '10px',
                                                                fontWeight: 600,
                                                                padding: '2px 8px',
                                                                borderRadius: '6px',
                                                                background: 'rgba(148,163,184,0.1)',
                                                                color: '#94a3b8',
                                                                flexShrink: 0,
                                                            }}>
                                                                {item.extra}
                                                            </span>
                                                        )}

                                                        {/* Arrow */}
                                                        <ArrowRight style={{
                                                            width: '14px', height: '14px',
                                                            color: '#475569',
                                                            flexShrink: 0,
                                                            opacity: isSelected ? 1 : 0,
                                                            transition: 'opacity 0.15s',
                                                        }} />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* No results */}
                        {query.trim() && !loading && total === 0 && suggestions.length === 0 && (
                            <div style={{
                                padding: '40px 20px',
                                textAlign: 'center',
                                color: '#64748b',
                            }}>
                                <Search style={{ width: '40px', height: '40px', margin: '0 auto 12px', opacity: 0.3 }} />
                                <div style={{ fontSize: '14px', fontWeight: 500 }}>
                                    Không tìm thấy kết quả
                                </div>
                                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                                    Thử tìm kiếm với từ khóa khác
                                </div>
                            </div>
                        )}

                        {/* Empty state */}
                        {!query.trim() && suggestions.length === 0 && (
                            <div style={{
                                padding: '40px 20px',
                                textAlign: 'center',
                                color: '#64748b',
                            }}>
                                <Search style={{ width: '40px', height: '40px', margin: '0 auto 12px', opacity: 0.3 }} />
                                <div style={{ fontSize: '14px', fontWeight: 500 }}>
                                    Tìm kiếm nhanh
                                </div>
                                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                                    Nhập tên học sinh, lớp học, bài tập hoặc bài kiểm tra
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 20px',
                        borderTop: '1px solid #334155',
                        fontSize: '11px',
                        color: '#475569',
                    }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <kbd style={{
                                    background: 'rgba(148,163,184,0.12)',
                                    border: '1px solid #334155',
                                    borderRadius: '4px',
                                    padding: '1px 4px',
                                    fontSize: '10px',
                                }}>↑↓</kbd>
                                di chuyển
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <kbd style={{
                                    background: 'rgba(148,163,184,0.12)',
                                    border: '1px solid #334155',
                                    borderRadius: '4px',
                                    padding: '1px 4px',
                                    fontSize: '10px',
                                }}>↵</kbd>
                                mở
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <kbd style={{
                                    background: 'rgba(148,163,184,0.12)',
                                    border: '1px solid #334155',
                                    borderRadius: '4px',
                                    padding: '1px 4px',
                                    fontSize: '10px',
                                }}>esc</kbd>
                                đóng
                            </span>
                        </div>
                        <span style={{ color: '#14b8a6', fontWeight: 600, fontSize: '10px' }}>
                            ⚡ Smart Search
                        </span>
                    </div>
                </div>
            </div>

            {/* Animations */}
            <style jsx global>{`
                @keyframes gsBackdropIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes gsModalIn {
                    from { opacity: 0; transform: translateX(-50%) translateY(-10px) scale(0.98); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
                }
                @keyframes gsSpin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
}

// Exported trigger button for Header
export function SearchTrigger({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            title="Tìm kiếm (Ctrl+K)"
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid #334155',
                background: 'rgba(148,163,184,0.06)',
                color: '#64748b',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
            }}
        >
            <Search style={{ width: '14px', height: '14px' }} />
            <span>Tìm kiếm...</span>
            <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                marginLeft: '8px',
                background: 'rgba(148,163,184,0.12)',
                border: '1px solid #334155',
                borderRadius: '4px',
                padding: '1px 6px',
                fontSize: '10px',
                fontWeight: 600,
                color: '#475569',
            }}>
                <Command style={{ width: '10px', height: '10px' }} />K
            </span>
        </button>
    );
}
