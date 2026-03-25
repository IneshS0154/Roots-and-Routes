import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, RefreshCw, CheckCircle, Clock, AlertTriangle, MessageSquare, Send, X, ArrowLeft } from 'lucide-react';

const API = 'http://localhost:5001';

const STATUS_STYLES = {
    'Open':         { bg: '#3b82f618', color: '#1d4ed8', label: '🔵 Open' },
    'Under Review': { bg: '#f59e0b18', color: '#b45309', label: '⏳ Under Review' },
    'Resolved':     { bg: '#22c55e18', color: '#15803d', label: '✅ Resolved' },
    'Closed':       { bg: '#6b728018', color: '#374151', label: '🔒 Closed' },
};

function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-LK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function Bubble({ msg }) {
    const isBot   = msg.sender_type === 'bot';
    const isAdmin = msg.sender_type === 'admin';
    const isLeft  = isBot || isAdmin;
    return (
        <div style={{ display: 'flex', justifyContent: isLeft ? 'flex-start' : 'flex-end', marginBottom: '0.5rem' }}>
            {isLeft && (
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: isAdmin ? '#8b5cf6' : '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0, marginRight: 6, marginTop: 2 }}>
                    {isAdmin ? 'A' : '🤖'}
                </div>
            )}
            <div style={{
                maxWidth: '75%', padding: '0.55rem 0.85rem', borderRadius: isLeft ? '0 12px 12px 12px' : '12px 0 12px 12px',
                background: isAdmin ? '#ede9fe' : isBot ? '#f0fdf4' : 'var(--primary)',
                color: isLeft ? 'var(--text-main)' : '#fff',
                fontSize: '0.83rem', lineHeight: 1.5,
                border: isBot ? '1px solid #bbf7d0' : isAdmin ? '1px solid #ddd6fe' : 'none',
            }}>
                {msg.message}
                <div style={{ fontSize: '0.65rem', opacity: 0.55, marginTop: '0.15rem', textAlign: isLeft ? 'left' : 'right' }}>
                    {isAdmin ? '👤 Admin · ' : isBot ? '🤖 Bot · ' : ''}
                    {fmtDate(msg.created_at)}
                </div>
            </div>
        </div>
    );
}

const DisputeManagement = () => {
    const [sessions, setSessions]     = useState([]);
    const [stats, setStats]           = useState({});
    const [loading, setLoading]       = useState(true);
    const [selected, setSelected]     = useState(null);
    const [messages, setMessages]     = useState([]);
    const [msgLoading, setMsgLoading] = useState(false);
    const [replyText, setReplyText]   = useState('');
    const [sending, setSending]       = useState(false);
    const [statusFilter, setStatusFilter] = useState('All');
    const [complaintOnly, setComplaintOnly] = useState(false);
    const [updating, setUpdating]     = useState(false);
    const bottomRef = useRef(null);

    const fetchSessions = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter !== 'All') params.set('status', statusFilter);
            if (complaintOnly) params.set('complaint', '1');
            const res  = await fetch(`${API}/api/admin/chat/sessions?${params}`);
            const data = await res.json();
            if (data.success) { setSessions(data.sessions); setStats(data.stats); }
        } finally { setLoading(false); }
    }, [statusFilter, complaintOnly]);

    useEffect(() => { fetchSessions(); }, [fetchSessions]);

    const openSession = async (session) => {
        setSelected(session);
        setMsgLoading(true);
        const res  = await fetch(`${API}/api/chat/sessions/${session.id}/messages`);
        const data = await res.json();
        if (data.success) setMessages(data.messages);
        setMsgLoading(false);
    };

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const sendReply = async () => {
        if (!replyText.trim() || !selected || sending) return;
        setSending(true);
        try {
            await fetch(`${API}/api/admin/chat/sessions/${selected.id}/reply`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: replyText.trim() }),
            });
            setReplyText('');
            // Reload messages
            const res  = await fetch(`${API}/api/chat/sessions/${selected.id}/messages`);
            const data = await res.json();
            if (data.success) setMessages(data.messages);
            fetchSessions();
        } finally { setSending(false); }
    };

    const changeStatus = async (newStatus) => {
        if (!selected || updating) return;
        setUpdating(true);
        await fetch(`${API}/api/admin/chat/sessions/${selected.id}/status`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });
        setSelected({ ...selected, status: newStatus });
        fetchSessions();
        setUpdating(false);
    };

    const td = { padding: '0.5rem 0' };

    return (
        <div style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.2rem' }}>Dispute & Chat Management</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>All customer chatbot sessions and complaints</p>
                </div>
                <button onClick={fetchSessions} style={ghostBtn}><RefreshCw size={14} /> Refresh</button>
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total Sessions',   value: stats.total,      color: 'var(--primary)', icon: MessageCircle },
                    { label: 'Open',             value: stats.open_count, color: '#3b82f6',        icon: MessageSquare },
                    { label: 'Under Review',     value: stats.reviewing,  color: '#f59e0b',        icon: Clock },
                    { label: 'Resolved',         value: stats.resolved,   color: '#22c55e',        icon: CheckCircle },
                    { label: 'Complaints',       value: stats.complaints, color: '#ef4444',        icon: AlertTriangle },
                ].map((s, i) => (
                    <div key={i} className="card" style={{ borderTop: `3px solid ${s.color}`, padding: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color }}>{loading ? '…' : (s.value ?? 0)}</div>
                        </div>
                        <s.icon size={16} color={s.color} style={{ opacity: 0.3 }} />
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {['All', 'Open', 'Under Review', 'Resolved', 'Closed'].map(f => (
                    <button key={f} onClick={() => setStatusFilter(f)}
                        style={{ padding: '0.35rem 0.85rem', borderRadius: 99, border: `1.5px solid ${statusFilter === f ? 'var(--primary)' : 'var(--border)'}`, background: statusFilter === f ? 'var(--primary)' : '#fff', color: statusFilter === f ? '#fff' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
                        {f}
                    </button>
                ))}
                <button onClick={() => setComplaintOnly(!complaintOnly)}
                    style={{ padding: '0.35rem 0.85rem', borderRadius: 99, border: `1.5px solid ${complaintOnly ? '#ef4444' : 'var(--border)'}`, background: complaintOnly ? '#ef444418' : '#fff', color: complaintOnly ? '#ef4444' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
                    ⚠️ Complaints only
                </button>
            </div>

            {/* Two-panel layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '1.25rem', flex: 1, minHeight: 0 }}>
                
                {/* Session list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
                    ) : sessions.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <MessageCircle size={36} style={{ opacity: 0.1, marginBottom: '0.75rem' }} />
                            <p>No sessions yet</p>
                        </div>
                    ) : sessions.map(s => {
                        const ss = STATUS_STYLES[s.status] || STATUS_STYLES['Open'];
                        const isActive = selected?.id === s.id;
                        return (
                            <div key={s.id} onClick={() => openSession(s)} className="card"
                                style={{ padding: '0.85rem 1rem', cursor: 'pointer', borderLeft: `4px solid ${isActive ? 'var(--primary)' : 'transparent'}`, background: isActive ? '#f0fdf4' : '#fff', transition: 'all 0.15s' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.3rem', flexWrap: 'wrap', gap: '0.3rem' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                                        {s.is_complaint ? '⚠️ ' : '💬 '}{s.subject}
                                    </div>
                                    <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 99, fontSize: '0.65rem', fontWeight: 700, background: ss.bg, color: ss.color }}>{ss.label}</span>
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>👤 {s.customer_name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{s.message_count} message{s.message_count !== 1 ? 's' : ''}</span>
                                    <span>{fmtDate(s.updated_at)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Chat detail panel */}
                <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 400 }}>
                    {!selected ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                            <MessageCircle size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                            <p style={{ fontWeight: 600 }}>Select a session to view the conversation</p>
                        </div>
                    ) : (
                        <>
                            {/* Session header */}
                            <div style={{ padding: '0.85rem 1.1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                                        {selected.is_complaint ? '⚠️ Complaint' : '💬 Chat'} — {selected.subject}
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>👤 {selected.customer_name} · Session #{selected.id}</div>
                                </div>
                                {/* Status selector */}
                                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                    {['Open', 'Under Review', 'Resolved', 'Closed'].map(st => {
                                        const ss = STATUS_STYLES[st];
                                        return (
                                            <button key={st} onClick={() => changeStatus(st)} disabled={updating || selected.status === st}
                                                style={{ padding: '3px 10px', borderRadius: 99, border: `1.5px solid ${selected.status === st ? ss.color : 'var(--border)'}`, background: selected.status === st ? ss.bg : 'transparent', color: selected.status === st ? ss.color : 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>
                                                {ss.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Messages */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0.85rem 0.5rem' }}>
                                {msgLoading ? (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading messages…</div>
                                ) : messages.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No messages yet</div>
                                ) : messages.map((msg, i) => <Bubble key={i} msg={msg} />)}
                                <div ref={bottomRef} />
                            </div>

                            {/* Reply input */}
                            {selected.status !== 'Closed' && selected.status !== 'Resolved' && (
                                <div style={{ padding: '0.75rem 0.85rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        value={replyText}
                                        onChange={e => setReplyText(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') sendReply(); }}
                                        placeholder="Type an admin reply…"
                                        style={{ flex: 1, padding: '0.55rem 0.85rem', borderRadius: 99, border: '1.5px solid var(--border)', fontSize: '0.85rem', outline: 'none' }}
                                    />
                                    <button onClick={sendReply} disabled={!replyText.trim() || sending}
                                        style={{ padding: '0.5rem 1rem', borderRadius: 99, border: 'none', background: replyText.trim() ? 'var(--primary)' : '#e5e7eb', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <Send size={13} /> {sending ? 'Sending…' : 'Reply'}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const ghostBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.55rem 1.1rem', borderRadius: 8, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' };

export default DisputeManagement;
