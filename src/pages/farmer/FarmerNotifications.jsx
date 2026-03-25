import React, { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, CheckCheck, AlertTriangle, RefreshCw } from 'lucide-react';
import { getUser } from '../../utils/userSession';

const API = 'http://localhost:5001';

function fmtDate(d) {
    if (!d) return '';
    return new Date(d).toLocaleString('en-LK', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/**
 * FarmerNotifications – can be used as a standalone page or embedded panel.
 * Props: compact (bool) – if true shows a slim card-style version for dashboard sidebar
 */
const FarmerNotifications = ({ compact = false }) => {
    const user = getUser();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading]             = useState(true);
    const [error, setError]                 = useState('');

    const fetchNotifs = useCallback(async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const res  = await fetch(`${API}/api/farmer/notifications?farmer_id=${user.id}`);
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            setNotifications(data.notifications);
            setError('');
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, [user?.id]);

    useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

    const markRead = async (id) => {
        await fetch(`${API}/api/farmer/notifications/${id}/read`, { method: 'PUT' });
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    };

    const markAllRead = async () => {
        const unread = notifications.filter(n => !n.is_read);
        await Promise.all(unread.map(n => fetch(`${API}/api/farmer/notifications/${n.id}/read`, { method: 'PUT' })));
        setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    if (compact) {
        if (notifications.length === 0 && !loading) return null;
        return (
            <div style={{ marginBottom: '1.5rem' }}>
                {notifications.filter(n => !n.is_read).slice(0, 3).map(n => (
                    <div key={n.id}
                        style={{ padding: '0.85rem 1rem', borderRadius: 10, marginBottom: '0.6rem', border: `1.5px solid ${n.is_urgent ? '#ef4444' : '#f59e0b'}`, background: n.is_urgent ? '#ef444408' : '#fef3c708', cursor: 'pointer' }}
                        onClick={() => markRead(n.id)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            {n.is_urgent && <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '2px 7px', borderRadius: 99, background: '#ef4444', color: '#fff' }}>🚨 URGENT</span>}
                            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>{n.subject}</span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{n.message}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{fmtDate(n.created_at)}</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#ef4444' }}>Tap to dismiss</span>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div style={{ padding: compact ? 0 : '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
                        <Bell size={24} color="var(--primary)" /> Notifications
                        {unreadCount > 0 && <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '2px 10px', borderRadius: 99, background: '#ef4444', color: '#fff' }}>{unreadCount} new</span>}
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>Messages from the platform admin</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {unreadCount > 0 && (
                        <button onClick={markAllRead} style={{ ...ghostBtn, color: '#16a34a', borderColor: '#16a34a44' }}><CheckCheck size={14} /> Mark all read</button>
                    )}
                    <button onClick={fetchNotifs} style={ghostBtn}><RefreshCw size={14} /> Refresh</button>
                </div>
            </div>

            {error && (
                <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', background: '#ef444412', border: '1px solid #ef444430', borderRadius: 8, color: '#ef4444', fontSize: '0.83rem', display: 'flex', gap: 6 }}>
                    <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <Bell size={40} style={{ opacity: 0.1, marginBottom: '0.75rem' }} />
                    <p>Loading notifications…</p>
                </div>
            ) : notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <BellOff size={52} style={{ opacity: 0.1, marginBottom: '1.25rem' }} />
                    <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>No notifications yet</h3>
                    <p style={{ fontSize: '0.88rem' }}>You'll receive messages from the admin here.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {notifications.map(n => (
                        <div key={n.id}
                            style={{
                                padding: '1.1rem 1.25rem', borderRadius: 12, position: 'relative', transition: 'all 0.2s',
                                border: `1.5px solid ${!n.is_read ? (n.is_urgent ? '#ef4444' : '#f59e0b') : 'var(--border)'}`,
                                background: !n.is_read ? (n.is_urgent ? '#ef444406' : '#fef3c706') : '#fff',
                                opacity: n.is_read ? 0.75 : 1,
                            }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                                        {n.is_urgent && !n.is_read && (
                                            <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: '#ef4444', color: '#fff', flexShrink: 0 }}>🚨 URGENT</span>
                                        )}
                                        {!n.is_read && !n.is_urgent && (
                                            <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: '#f59e0b', color: '#fff', flexShrink: 0 }}>NEW</span>
                                        )}
                                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>{n.subject}</span>
                                    </div>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>{n.message}</p>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>📅 {fmtDate(n.created_at)} · <strong>From: Platform Admin</strong></div>
                                </div>
                                {!n.is_read && (
                                    <button onClick={() => markRead(n.id)} style={{ flexShrink: 0, padding: '0.35rem 0.75rem', borderRadius: 7, border: '1.5px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
                                        <CheckCheck size={13} /> Dismiss
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ghostBtn = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.45rem 0.9rem', borderRadius: 8, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' };

export default FarmerNotifications;
