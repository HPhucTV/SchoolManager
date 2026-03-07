/* eslint-disable */
'use client';
import { useState, useEffect } from 'react';
import { gamificationApi } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AchievementsPage() {
    const [stats, setStats] = useState<any>(null);
    const [badges, setBadges] = useState<any[]>([]);
    const [leaderboard, setLeaderboard] = useState<any>(null);
    const [shop, setShop] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'badges' | 'leaderboard' | 'shop'>('badges');
    const [checkInResult, setCheckInResult] = useState<any>(null);
    const [lbScope, setLBScope] = useState('class');


    const loadAll = async () => {
        try {
            const [s, b, lb, sh] = await Promise.all([
                gamificationApi.getMyStats(),
                gamificationApi.getBadges(),
                gamificationApi.getLeaderboard('class'),
                gamificationApi.getShop()
            ]);
            setStats(s);
            setBadges(b);
            setLeaderboard(lb);
            setShop(sh);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { loadAll(); }, []);

    const handleCheckIn = async () => {
        try {
            const result = await gamificationApi.checkIn();
            setCheckInResult(result);
            loadAll();
            setTimeout(() => setCheckInResult(null), 4000);
        } catch (e) { console.error(e); }
    };

    const handleBuy = async (itemId: number) => {
        try {
            await gamificationApi.buyItem(itemId);
            loadAll();
        } catch (e) { console.error(e); }
    };

    const loadLeaderboard = async (scope: string) => {
        setLBScope(scope);
        try {
            const lb = await gamificationApi.getLeaderboard(scope);
            setLeaderboard(lb);
        } catch (e) { console.error(e); }
    };

    if (loading) return (
        <ProtectedRoute allowedRoles={['student']}>
            <div style={{ padding: '24px', textAlign: 'center', paddingTop: '100px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎮</div>
                <p style={{ color: '#94a3b8' }}>Đang tải...</p>
            </div>
        </ProtectedRoute>
    );

    return (
        <ProtectedRoute allowedRoles={['student']}>
            <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>🎮 Thành tích & Phần thưởng</h1>
                        <p style={{ color: '#94a3b8', margin: '4px 0 0' }}>Chinh phục thử thách, nhận huy hiệu, đổi phần thưởng</p>
                    </div>
                    <button onClick={handleCheckIn} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '15px', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}>
                        🔥 Điểm danh
                    </button>
                </div>

                {/* Check-in toast */}
                {checkInResult && (
                    <div style={{ position: 'fixed', top: '20px', right: '20px', background: checkInResult.already_checked ? '#f59e0b' : 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', padding: '16px 24px', borderRadius: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 1000, animation: 'slideIn 0.3s ease' }}>
                        <div style={{ fontWeight: 700, fontSize: '15px' }}>{checkInResult.message}</div>
                        {!checkInResult.already_checked && (
                            <div style={{ fontSize: '13px', marginTop: '4px' }}>+{checkInResult.xp_earned} XP | +{checkInResult.coins_earned} xu {checkInResult.leveled_up ? '| 🎉 LEVEL UP!' : ''}</div>
                        )}
                    </div>
                )}

                {/* Stats Bar */}
                {stats && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' }}>
                        {[
                            { label: 'Level', value: stats.level, icon: '⭐', color: '#f59e0b' },
                            { label: 'XP', value: stats.xp, icon: '✨', color: '#8b5cf6' },
                            { label: 'Xu', value: stats.coins, icon: '🪙', color: '#f97316' },
                            { label: 'Streak', value: `${stats.streak} ngày`, icon: '🔥', color: '#ef4444' },
                            { label: 'Huy hiệu', value: `${stats.badges_earned}/${stats.total_badges}`, icon: '🏆', color: '#10b981' },
                        ].map((s, i) => (
                            <div key={i} style={{ background: '#1e293b', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.2)', border: '1px solid #334155', textAlign: 'center' }}>
                                <div style={{ fontSize: '24px' }}>{s.icon}</div>
                                <div style={{ fontSize: '20px', fontWeight: 700, color: s.color }}>{s.value}</div>
                                <div style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 500 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* XP Progress */}
                {stats && (
                    <div style={{ background: '#1e293b', borderRadius: '14px', padding: '16px 20px', marginBottom: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.2)', border: '1px solid #334155' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                            <span>Level {stats.level}</span>
                            <span>{stats.xp_progress}/100 XP</span>
                            <span>Level {stats.level + 1}</span>
                        </div>
                        <div style={{ width: '100%', height: '10px', background: '#334155', borderRadius: '5px' }}>
                            <div style={{ width: `${stats.xp_progress}%`, height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #6d28d9)', borderRadius: '5px', transition: 'width 0.5s' }} />
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                    {[
                        { key: 'badges' as const, label: '🏆 Huy hiệu' },
                        { key: 'leaderboard' as const, label: '🏅 Bảng xếp hạng' },
                        { key: 'shop' as const, label: '🛒 Cửa hàng' }
                    ].map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '10px 20px', borderRadius: '10px', border: tab === t.key ? 'none' : '1px solid #334155', cursor: 'pointer', fontWeight: 600, fontSize: '14px', background: tab === t.key ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#1e293b', color: tab === t.key ? 'white' : '#cbd5e1' }}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Badges */}
                {tab === 'badges' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                        {badges.map((b: any) => (
                            <div key={b.id} style={{ background: '#1e293b', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.2)', border: b.earned ? '2px solid #f59e0b' : '1px solid #334155', textAlign: 'center', opacity: b.earned ? 1 : 0.55 }}>
                                <div style={{ fontSize: '40px', marginBottom: '8px' }}>{b.icon}</div>
                                <div style={{ fontWeight: 700, fontSize: '14px', color: '#e2e8f0', marginBottom: '4px' }}>{b.name}</div>
                                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 8px' }}>{b.description}</p>
                                <div style={{ fontSize: '11px', color: '#8b5cf6' }}>+{b.xp_reward} XP | +{b.coin_reward} xu</div>
                                {b.earned && <div style={{ marginTop: '8px', fontSize: '11px', color: '#22c55e', fontWeight: 600 }}>✅ Đã nhận</div>}
                            </div>
                        ))}
                    </div>
                )}

                {/* Leaderboard */}
                {tab === 'leaderboard' && leaderboard && (
                    <div style={{ background: '#1e293b', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.2)', border: '1px solid #334155' }}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                            <button onClick={() => loadLeaderboard('class')} style={{ padding: '8px 16px', borderRadius: '8px', border: lbScope === 'class' ? 'none' : '1px solid #334155', cursor: 'pointer', fontWeight: 600, fontSize: '13px', background: lbScope === 'class' ? '#f59e0b' : '#0f172a', color: lbScope === 'class' ? 'white' : '#cbd5e1' }}>Lớp</button>
                            <button onClick={() => loadLeaderboard('school')} style={{ padding: '8px 16px', borderRadius: '8px', border: lbScope === 'school' ? 'none' : '1px solid #334155', cursor: 'pointer', fontWeight: 600, fontSize: '13px', background: lbScope === 'school' ? '#f59e0b' : '#0f172a', color: lbScope === 'school' ? 'white' : '#cbd5e1' }}>Trường</button>
                        </div>
                        {leaderboard.leaderboard?.map((item: any) => (
                            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: item.is_me ? 'rgba(245,158,11,0.1)' : '#0f172a', borderRadius: '10px', marginBottom: '6px', border: item.is_me ? '2px solid #f59e0b' : '1px solid #334155' }}>
                                <span style={{ fontWeight: 700, fontSize: '18px', color: item.rank <= 3 ? '#f59e0b' : '#94a3b8', minWidth: '30px' }}>
                                    {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `#${item.rank}`}
                                </span>
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                                    {item.avatar_url ? <img src={item.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : '👤'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontWeight: 600, fontSize: '14px', color: '#e2e8f0' }}>{item.name} {item.is_me ? '(Bạn)' : ''}</span>
                                    {item.equipped_title && <span style={{ fontSize: '11px', color: '#8b5cf6', marginLeft: '6px' }}>• {item.equipped_title}</span>}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#f59e0b' }}>{item.xp} XP</div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Lv.{item.level} | 🔥{item.streak}</div>
                                </div>
                            </div>
                        ))}
                        <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '13px', color: '#94a3b8' }}>
                            Hạng của bạn: #{leaderboard.my_rank}
                        </div>
                    </div>
                )}

                {/* Shop */}
                {tab === 'shop' && shop && (
                    <div>
                        <div style={{ background: 'rgba(245,158,11,0.1)', borderRadius: '12px', padding: '16px', marginBottom: '16px', textAlign: 'center', border: '1px solid rgba(245,158,11,0.2)' }}>
                            <span style={{ fontSize: '20px' }}>🪙</span> Số xu hiện tại: <strong style={{ color: '#f59e0b' }}>{shop.coins}</strong>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                            {shop.items?.map((item: any) => (
                                <div key={item.id} style={{ background: '#1e293b', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.2)', border: '1px solid #334155', textAlign: 'center' }}>
                                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>{item.icon}</div>
                                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px', color: '#e2e8f0' }}>{item.name}</div>
                                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 12px' }}>{item.description}</p>
                                    {item.owned ? (
                                        <div style={{ padding: '8px', background: 'rgba(34,197,94,0.1)', borderRadius: '8px', color: '#4ade80', fontWeight: 600, fontSize: '13px' }}>✅ Đã sở hữu</div>
                                    ) : (
                                        <button onClick={() => handleBuy(item.id)} disabled={shop.coins < item.price} style={{ width: '100%', padding: '10px', border: 'none', borderRadius: '10px', cursor: shop.coins >= item.price ? 'pointer' : 'default', fontWeight: 600, fontSize: '13px', background: shop.coins >= item.price ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#334155', color: shop.coins >= item.price ? 'white' : '#64748b' }}>
                                            🪙 {item.price} xu
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
