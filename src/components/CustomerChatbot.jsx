import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, AlertTriangle, ChevronRight, RefreshCw, Loader } from 'lucide-react';
import { getUser } from '../utils/userSession';

const API = 'http://localhost:5001';

const QUICK_QUESTIONS = [
    { label: '📦 Track my order',       msg: 'track order' },
    { label: '💳 Payment issue',        msg: 'payment issue' },
    { label: '↩️ Refund request',       msg: 'refund' },
    { label: '🥦 Product quality issue',msg: 'product quality' },
    { label: '📦 Wrong item delivered', msg: 'wrong item' },
    { label: '🚚 Delivery delay',       msg: 'delivery delay' },
    { label: '❌ Cancel order',          msg: 'cancel order' },
];

function renderBotText(text) {
    // Bold **x** → <strong>x</strong>, support both Gemini plain text and legacy markdown
    return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
        i % 2 === 1 ? <strong key={i}>{part}</strong> : part
    );
}

function Bubble({ msg }) {
    const isBot   = msg.sender_type === 'bot';
    const isAdmin = msg.sender_type === 'admin';
    const isLeft  = isBot || isAdmin;

    return (
        <div style={{ display: 'flex', justifyContent: isLeft ? 'flex-start' : 'flex-end', marginBottom: '0.5rem' }}>
            {isLeft && (
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: isAdmin ? '#8b5cf6' : 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0, marginRight: 6, marginTop: 2 }}>
                    {isAdmin ? 'A' : '🌿'}
                </div>
            )}
            <div style={{
                maxWidth: '78%', padding: '0.6rem 0.9rem', borderRadius: isLeft ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                background: isAdmin ? '#ede9fe' : isBot ? '#f0fdf4' : 'var(--primary)',
                color: isLeft ? 'var(--text-main)' : '#fff',
                fontSize: '0.85rem', lineHeight: 1.55,
                border: isBot ? '1px solid #bbf7d0' : isAdmin ? '1px solid #ddd6fe' : 'none',
                whiteSpace: 'pre-wrap',
            }}>
                {isBot || isAdmin ? <span>{renderBotText(msg.message)}</span> : msg.message}
                <div style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: '0.25rem', textAlign: isLeft ? 'left' : 'right' }}>
                    {isAdmin ? '👤 Admin · ' : ''}{new Date(msg.created_at || Date.now()).toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        </div>
    );
}

const CustomerChatbot = () => {
    const user = getUser();
    const [open, setOpen]         = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput]       = useState('');
    const [sending, setSending]   = useState(false);
    const [showComplaint, setShowComplaint] = useState(false);
    const [complaintText, setComplaintText] = useState('');
    const [submittingComplaint, setSubmittingComplaint] = useState(false);
    const [unread, setUnread]     = useState(0);
    const bottomRef = useRef(null);

    // Scroll to bottom whenever messages change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, showComplaint]);

    // Start session when opened for the first time
    useEffect(() => {
        if (!open || sessionId || !user?.id) return;
        (async () => {
            const res  = await fetch(`${API}/api/chat/session`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customer_id: user.id }),
            });
            const data = await res.json();
            if (data.success) {
                setSessionId(data.sessionId);
                setMessages([{ sender_type: 'bot', message: data.greeting, created_at: new Date() }]);
            }
        })();
    }, [open, sessionId, user?.id]);

    const sendMessage = async (text) => {
        if (!text.trim() || !sessionId || sending) return;
        const userMsg = { sender_type: 'customer', message: text.trim(), created_at: new Date() };
        setMessages(m => [...m, userMsg]);
        setInput('');
        setSending(true);
        try {
            const res  = await fetch(`${API}/api/chat/message`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: sessionId, customer_id: user.id, message: text }),
            });
            const data = await res.json();
            if (data.success) {
                setMessages(m => [...m, { sender_type: 'bot', message: data.reply, created_at: new Date() }]);
            }
        } finally { setSending(false); }
    };

    const submitComplaint = async () => {
        if (!complaintText.trim() || !sessionId) return;
        setSubmittingComplaint(true);
        try {
            const res  = await fetch(`${API}/api/chat/complaint`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: sessionId, customer_id: user.id, complaint_text: complaintText }),
            });
            const data = await res.json();
            if (data.success) {
                setMessages(m => [
                    ...m,
                    { sender_type: 'customer', message: `[COMPLAINT] ${complaintText}`, created_at: new Date() },
                    { sender_type: 'bot', message: data.message, created_at: new Date() },
                ]);
                setComplaintText('');
                setShowComplaint(false);
            }
        } finally { setSubmittingComplaint(false); }
    };

    const openChat = () => { setOpen(true); setUnread(0); };

    return (
        <>
            {/* Floating trigger button */}
            <button
                onClick={open ? () => setOpen(false) : openChat}
                aria-label="Open chat"
                style={{
                    position: 'fixed', bottom: '1.75rem', right: '1.75rem', zIndex: 9999,
                    width: 56, height: 56, borderRadius: '50%', border: 'none',
                    background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                    color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(22,163,74,0.45)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
                {open ? <X size={22} /> : <MessageCircle size={24} />}
                {!open && unread > 0 && (
                    <span style={{ position: 'absolute', top: 4, right: 4, background: '#ef4444', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: '0.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {unread}
                    </span>
                )}
            </button>

            {/* Chat window */}
            {open && (
                <div style={{
                    position: 'fixed', bottom: '5.5rem', right: '1.75rem', zIndex: 9998,
                    width: 360, maxHeight: '82vh', display: 'flex', flexDirection: 'column',
                    background: '#fff', borderRadius: 18,
                    boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
                    animation: 'chatSlideUp 0.22s ease-out',
                    overflow: 'hidden',
                }}>
                    {/* Header */}
                    <div style={{ padding: '0.9rem 1.1rem', background: 'linear-gradient(135deg, #16a34a, #22c55e)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🌿</div>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>Roots & Routes Assistant</div>
                                <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>🟢 Online · Usually replies instantly</div>
                            </div>
                        </div>
                        <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <X size={15} />
                        </button>
                    </div>

                    {/* Messages area */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0.85rem 0.5rem', display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}

                        {sending && (
                            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '0.5rem' }}>
                                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', marginRight: 6, marginTop: 2 }}>🤖</div>
                                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0 12px 12px 12px', padding: '0.55rem 0.9rem', display: 'flex', gap: 4, alignItems: 'center' }}>
                                    <div style={dotAnim(0)} /><div style={dotAnim(1)} /><div style={dotAnim(2)} />
                                </div>
                            </div>
                        )}

                        {/* Quick questions — show until the customer has sent their first message */}
                        {!messages.some(m => m.sender_type === 'customer') && !sending && (
                            <div style={{ marginTop: '0.75rem' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Quick questions</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                    {QUICK_QUESTIONS.map(q => (
                                        <button key={q.msg} onClick={() => sendMessage(q.msg)}
                                            style={{ textAlign: 'left', padding: '0.5rem 0.9rem', borderRadius: 9, border: '1.5px solid #bbf7d0', background: '#f0fdf4', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600, color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.15s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#dcfce7'}
                                            onMouseLeave={e => e.currentTarget.style.background = '#f0fdf4'}>
                                            {q.label} <ChevronRight size={13} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Complaint form */}
                        {showComplaint && (
                            <div style={{ marginTop: '0.75rem', padding: '0.85rem', background: '#fff7ed', borderRadius: 12, border: '1.5px solid #fed7aa' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#b45309', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <AlertTriangle size={13} /> Submit a Complaint
                                </div>
                                <textarea value={complaintText} onChange={e => setComplaintText(e.target.value)} rows={3}
                                    placeholder="Describe your issue in detail…"
                                    style={{ width: '100%', borderRadius: 8, border: '1.5px solid #fed7aa', padding: '0.5rem 0.65rem', fontSize: '0.8rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box', marginBottom: '0.5rem' }} />
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    <button onClick={() => setShowComplaint(false)} style={{ flex: 1, padding: '0.45rem', borderRadius: 7, border: '1.5px solid var(--border)', background: 'transparent', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                                    <button onClick={submitComplaint} disabled={!complaintText.trim() || submittingComplaint}
                                        style={{ flex: 2, padding: '0.45rem', borderRadius: 7, border: 'none', background: !complaintText.trim() ? '#d1fae5' : '#16a34a', color: '#fff', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                                        {submittingComplaint ? 'Submitting…' : '✓ Submit Complaint'}
                                    </button>
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Complaint toggle */}
                    {!showComplaint && sessionId && (
                        <div style={{ padding: '0.4rem 0.85rem 0', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowComplaint(true)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <AlertTriangle size={11} /> File a Complaint
                            </button>
                        </div>
                    )}

                    {/* Input bar */}
                    <div style={{ padding: '0.7rem 0.85rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                            placeholder="Type a message…"
                            disabled={sending}
                            style={{ flex: 1, padding: '0.55rem 0.85rem', borderRadius: 99, border: '1.5px solid var(--border)', fontSize: '0.85rem', outline: 'none', background: '#f9fafb' }}
                        />
                        <button onClick={() => sendMessage(input)} disabled={!input.trim() || sending}
                            style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: input.trim() ? '#16a34a' : '#e5e7eb', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}>
                            <Send size={15} />
                        </button>
                    </div>
                </div>
            )}

            {/* Keyframe for slide-up animation */}
            <style>{`
                @keyframes chatSlideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes chatDot {
                    0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
                    40%            { transform: scale(1);   opacity: 1;   }
                }
            `}</style>
        </>
    );
};

function dotAnim(i) {
    return {
        width: 7, height: 7, borderRadius: '50%', background: '#16a34a',
        animation: `chatDot 1.2s infinite`, animationDelay: `${i * 0.2}s`,
    };
}

export default CustomerChatbot;
