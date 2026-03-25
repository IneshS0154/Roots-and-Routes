import React, { useState, useEffect, useRef } from 'react';
import { getUser } from '../../utils/userSession';
import { MessageCircle, Send, RefreshCw, AlertTriangle, CheckCircle, Clock, Lock, ChevronRight, ArrowLeft } from 'lucide-react';

const API = 'http://localhost:5001';

const STATUS_META = {
    'Open':         { color: '#1d4ed8', bg: '#dbeafe', icon: MessageCircle, label: 'Open' },
    'Under Review': { color: '#b45309', bg: '#fef3c7', icon: Clock,         label: 'Under Review' },
    'Resolved':     { color: '#15803d', bg: '#dcfce7', icon: CheckCircle,   label: 'Resolved' },
    'Closed':       { color: '#374151', bg: '#f3f4f6', icon: Lock,          label: 'Closed' },
};

function fmtDate(d) {
    if (!d) return '';
    return new Date(d).toLocaleString('en-LK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** A single chat bubble */
function Bubble({ msg, myName }) {
    const isMe    = msg.sender_type === 'customer';
    const isAdmin = msg.sender_type === 'admin';
    const isBot   = msg.sender_type === 'bot';
    return (
        <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: '0.6rem' }}>
            {!isMe && (
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: isAdmin ? '#8b5cf6' : '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0, marginRight: 6, marginTop: 2 }}>
                    {isAdmin ? 'A' : '🤖'}
                </div>
            )}
            <div style={{
                maxWidth: '75%', padding: '0.6rem 0.9rem',
                borderRadius: isMe ? '12px 0 12px 12px' : '0 12px 12px 12px',
                background: isMe ? 'var(--primary)' : isAdmin ? '#ede9fe' : '#f0fdf4',
                color: isMe ? '#fff' : 'var(--text-main)',
                fontSize: '0.85rem', lineHeight: 1.55,
                border: isBot ? '1px solid #bbf7d0' : isAdmin ? '1px solid #ddd6fe' : 'none',
            }}>
                {msg.message}
                <div style={{ fontSize: '0.65rem', opacity: 0.6, marginTop: '0.2rem', textAlign: isMe ? 'right' : 'left' }}>
                    {isAdmin ? '👤 Admin · ' : isBot ? '🤖 Bot · ' : `${myName?.split(' ')[0]} · `}
                    {fmtDate(msg.created_at)}
                </div>
            </div>
        </div>
    );
}

/** List view — all complaints */
function ComplaintList({ complaints, loading, onSelect, onRefresh }) {
    if (loading) return (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} style={{ opacity: 0.2, marginBottom: '0.5rem', animation: 'spin 1s linear infinite' }} />
            <p>Loading your complaints…</p>
        </div>
    );

    if (complaints.length === 0) return (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
            <MessageCircle size={52} style={{ opacity: 0.1, marginBottom: '1rem' }} />
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No complaints yet</h3>
            <p style={{ fontSize: '0.9rem' }}>
                If you have an issue, use the 💬 chatbot (bottom-right) and choose <strong>"File a Complaint"</strong>. It will appear here.
            </p>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {complaints.map(c => {
                const sm = STATUS_META[c.status] || STATUS_META['Open'];
                const StatusIcon = sm.icon;
                return (
                    <div key={c.id}
                        onClick={() => onSelect(c)}
                        style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--border)', padding: '1rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'box-shadow 0.15s, transform 0.15s', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'none'; }}
                    >
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: sm.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <StatusIcon size={20} color={sm.color} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                ⚠️ {c.subject}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                {c.message_count} message{c.message_count !== 1 ? 's' : ''} · Last updated {fmtDate(c.updated_at)}
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                            <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: '0.7rem', fontWeight: 700, background: sm.bg, color: sm.color }}>
                                {sm.label}
                            </span>
                            <ChevronRight size={16} color="var(--text-muted)" />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/** Thread view — messages for a single complaint */
function ComplaintThread({ complaint, user, onBack }) {
    const [messages, setMessages]   = useState([]);
    const [msgLoading, setMsgLoading] = useState(true);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending]     = useState(false);
    const [error, setError]         = useState('');
    const bottomRef = useRef(null);

    const canReply = complaint.status !== 'Resolved' && complaint.status !== 'Closed';
    const sm = STATUS_META[complaint.status] || STATUS_META['Open'];
    const StatusIcon = sm.icon;

    const loadMessages = async () => {
        setMsgLoading(true);
        try {
            const res  = await fetch(`${API}/api/chat/sessions/${complaint.id}/messages`);
            const data = await res.json();
            if (data.success) setMessages(data.messages);
        } finally { setMsgLoading(false); }
    };

    useEffect(() => { loadMessages(); }, [complaint.id]);
    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const sendReply = async () => {
        if (!replyText.trim() || sending || !canReply) return;
        setSending(true); setError('');
        try {
            const res  = await fetch(`${API}/api/customer/complaints/${complaint.id}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customer_id: user.id, message: replyText.trim() }),
            });
            const data = await res.json();
            if (!data.success) { setError(data.message || 'Failed to send reply.'); return; }
            setReplyText('');
            await loadMessages();
        } catch { setError('Connection error. Please try again.'); }
        finally { setSending(false); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Thread header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontWeight: 600, padding: 0, fontSize: '0.875rem' }}>
                    <ArrowLeft size={16} /> Back
                </button>
                <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem' }}>⚠️ {complaint.subject}</h3>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        Complaint #{complaint.id} · Opened {fmtDate(complaint.created_at)}
                    </div>
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700, background: sm.bg, color: sm.color }}>
                    <StatusIcon size={12} /> {sm.label}
                </span>
            </div>

            {/* Messages */}
            <div className="card" style={{ flex: 1, padding: '1rem', overflowY: 'auto', marginBottom: '1rem', minHeight: 280, maxHeight: 420 }}>
                {msgLoading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading messages…</div>
                ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No messages yet.</div>
                ) : messages.map((m, i) => (
                    <Bubble key={i} msg={m} myName={user?.name} />
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Reply box */}
            {canReply ? (
                <div>
                    {error && (
                        <div style={{ marginBottom: '0.5rem', padding: '0.6rem 0.9rem', background: '#fee', border: '1px solid #fcc', borderRadius: 8, color: '#c33', fontSize: '0.83rem' }}>
                            ⚠️ {error}
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-end' }}>
                        <textarea
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                            placeholder="type your reply… (Enter to send, Shift+Enter for new line)"
                            rows={2}
                            style={{ flex: 1, padding: '0.65rem 1rem', border: '1.5px solid var(--border)', borderRadius: 12, fontSize: '0.875rem', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
                        />
                        <button
                            onClick={sendReply}
                            disabled={!replyText.trim() || sending}
                            style={{ padding: '0.65rem 1.1rem', borderRadius: 12, border: 'none', background: replyText.trim() ? 'var(--primary)' : '#e5e7eb', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: replyText.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, height: 'fit-content' }}
                        >
                            <Send size={14} /> {sending ? 'Sending…' : 'Reply'}
                        </button>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                        The admin will respond within 24 hours. You'll see their reply here.
                    </div>
                </div>
            ) : (
                <div style={{ padding: '0.75rem 1rem', background: '#f3f4f6', borderRadius: 10, fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    🔒 This complaint is <strong>{complaint.status}</strong> — no further replies possible.
                </div>
            )}
        </div>
    );
}

/** ── Main page component ── */
const CustomerSupport = () => {
    const user = getUser();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading]       = useState(true);
    const [selected, setSelected]     = useState(null);

    const loadComplaints = async () => {
        if (!user?.id) { setLoading(false); return; }
        setLoading(true);
        try {
            const res  = await fetch(`${API}/api/customer/complaints?customer_id=${user.id}`);
            const data = await res.json();
            if (data.success) setComplaints(data.sessions);
        } finally { setLoading(false); }
    };

    useEffect(() => { loadComplaints(); }, []);

    const openThread = async (c) => {
        // Refresh session data before opening
        setSelected(c);
    };

    const handleBack = () => {
        setSelected(null);
        loadComplaints(); // Refresh list when returning
    };

    return (
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '2rem' }}>
            {/* Page header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0 }}>Support</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
                        Your complaint threads with the Roots & Routes team
                    </p>
                </div>
                {!selected && (
                    <button onClick={loadComplaints} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.5rem 1rem', borderRadius: 8, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                        <RefreshCw size={14} /> Refresh
                    </button>
                )}
            </div>

            {/* Info banner — how to file a complaint */}
            {!selected && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.9rem 1.1rem', marginBottom: '1.5rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12 }}>
                    <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ fontSize: '0.875rem', color: '#92400e' }}>
                        <strong>How to file a complaint:</strong> Use the <strong>💬 chatbot</strong> button (bottom-right) → type your issue → choose <em>"File a Complaint"</em>. Your complaint will appear here automatically.
                    </div>
                </div>
            )}

            {selected ? (
                <ComplaintThread
                    complaint={selected}
                    user={user}
                    onBack={handleBack}
                />
            ) : (
                <ComplaintList
                    complaints={complaints}
                    loading={loading}
                    onSelect={openThread}
                    onRefresh={loadComplaints}
                />
            )}
        </div>
    );
};

export { CustomerSupport };
export default CustomerSupport;
