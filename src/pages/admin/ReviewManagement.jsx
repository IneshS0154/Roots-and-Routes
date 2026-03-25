import React, { useState, useEffect, useCallback } from 'react';
import { Star, RefreshCw, CheckCircle, XCircle, AlertTriangle, Trash2, MessageSquare } from 'lucide-react';

const API = 'http://localhost:5001';

function StarDisplay({ rating, size = 14 }) {
    return (
        <div style={{ display: 'flex', gap: 2 }}>
            {[1,2,3,4,5].map(s => <Star key={s} size={size} fill={s <= rating ? '#f59e0b' : 'transparent'} color="#f59e0b" />)}
        </div>
    );
}
function fmtDate(d) {
    if (!d) return '';
    return new Date(d).toLocaleString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' });
}

const ReviewManagement = () => {
    const [tab, setTab]           = useState('reviews');
    const [reviews, setReviews]   = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [actioning, setActioning] = useState(null);
    const [error, setError]       = useState('');

    const fetchAll = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const [r1, r2] = await Promise.all([
                fetch(`${API}/api/admin/reviews`).then(r => r.json()),
                fetch(`${API}/api/admin/reviews/deletion-requests`).then(r => r.json()),
            ]);
            if (r1.success) setReviews(r1.reviews);
            if (r2.success) setRequests(r2.requests);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleAction = async (reqId, action) => {
        setActioning(reqId);
        try {
            await fetch(`${API}/api/admin/reviews/deletion-requests/${reqId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });
            fetchAll();
        } catch (err) { setError(err.message); }
        finally { setActioning(null); }
    };

    const pendingCount = requests.filter(r => r.status === 'Pending').length;
    const td = { padding: '0.875rem 1rem', fontSize: '0.85rem', verticalAlign: 'middle' };

    return (
        <div style={{ padding: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.2rem' }}>Review Management</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>All product reviews and deletion requests across the platform</p>
                </div>
                <button onClick={fetchAll} style={ghostBtn}><RefreshCw size={15} /> Refresh</button>
            </div>

            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.85rem', marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total Reviews',     value: reviews.length,  color: 'var(--primary)', icon: MessageSquare },
                    { label: 'Deletion Requests', value: requests.length, color: '#f59e0b',        icon: Trash2 },
                    { label: 'Pending Requests',  value: pendingCount,    color: '#ef4444',        icon: AlertTriangle },
                ].map((s, i) => (
                    <div key={i} className="card" style={{ borderTop: `3px solid ${s.color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1rem' }}>
                        <div>
                            <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color }}>{loading ? '…' : s.value}</div>
                        </div>
                        <s.icon size={20} color={s.color} style={{ opacity: 0.4 }} />
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '2px solid var(--border)', paddingBottom: '0' }}>
                {[
                    { id: 'reviews',  label: `All Reviews (${reviews.length})` },
                    { id: 'requests', label: `Deletion Requests (${requests.length})${pendingCount > 0 ? ` 🔴 ${pendingCount} pending` : ''}` },
                ].map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '0.6rem 1.25rem', borderRadius: '8px 8px 0 0', border: 'none', background: tab === t.id ? 'var(--primary)' : 'transparent', color: tab === t.id ? '#fff' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', marginBottom: '-2px', transition: 'all 0.15s' }}>
                        {t.label}
                    </button>
                ))}
            </div>

            {error && <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', background: '#ef444412', border: '1px solid #ef444430', borderRadius: 8, color: '#ef4444', fontSize: '0.83rem' }}>{error}</div>}

            {/* ── All Reviews Table ──────────────────────────────────────────── */}
            {tab === 'reviews' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-color)', borderBottom: '2px solid var(--border)' }}>
                                    {['Product', 'Seller', 'Customer', 'Rating', 'Review', 'Date', 'Deletion Status'].map(h => (
                                        <th key={h} style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</td></tr>
                                ) : reviews.length === 0 ? (
                                    <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No reviews yet</td></tr>
                                ) : reviews.map((r, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-color)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <td style={td}><span style={{ fontWeight: 700 }}>{r.product_name}</span><br/><span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.category}</span></td>
                                        <td style={{ ...td, color: 'var(--primary)', fontWeight: 600 }}>{r.farmer_name}</td>
                                        <td style={td}>{r.customer_name}</td>
                                        <td style={td}>
                                            <StarDisplay rating={r.rating} />
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{r.rating}/5 · {['','Terrible','Poor','Okay','Good','Excellent'][r.rating]}</div>
                                        </td>
                                        <td style={{ ...td, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: r.comment ? 'italic' : 'normal', color: r.comment ? 'var(--text-main)' : 'var(--text-muted)' }}>
                                            {r.comment ? `"${r.comment}"` : '—'}
                                        </td>
                                        <td style={{ ...td, color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{fmtDate(r.created_at)}</td>
                                        <td style={td}>
                                            {r.deletion_status ? (
                                                <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700, background: r.deletion_status === 'Pending' ? '#f59e0b18' : r.deletion_status === 'Approved' ? '#22c55e18' : '#ef444418', color: r.deletion_status === 'Pending' ? '#b45309' : r.deletion_status === 'Approved' ? '#15803d' : '#b91c1c' }}>
                                                    {r.deletion_status}
                                                </span>
                                            ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Deletion Requests ─────────────────────────────────────────── */}
            {tab === 'requests' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {loading ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
                    ) : requests.length === 0 ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <CheckCircle size={48} style={{ opacity: 0.1, marginBottom: '0.75rem' }} />
                            <p>No deletion requests</p>
                        </div>
                    ) : requests.map(req => (
                        <div key={req.id} className="card" style={{ padding: '1.25rem', border: `1.5px solid ${req.status === 'Pending' ? '#f59e0b33' : req.status === 'Approved' ? '#22c55e33' : '#ef444433'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                        <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{req.product_name}</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>← {req.farmer_name}</span>
                                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: '0.7rem', fontWeight: 700, background: req.status === 'Pending' ? '#f59e0b18' : req.status === 'Approved' ? '#22c55e18' : '#ef444418', color: req.status === 'Pending' ? '#b45309' : req.status === 'Approved' ? '#15803d' : '#b91c1c' }}>
                                            {req.status === 'Pending' ? '⏳ Pending' : req.status === 'Approved' ? '✅ Approved' : '❌ Rejected'}
                                        </span>
                                    </div>

                                    {/* The review being disputed */}
                                    <div style={{ padding: '0.65rem 0.85rem', background: 'var(--bg-color)', borderRadius: 8, marginBottom: '0.5rem', border: '1px solid var(--border)' }}>
                                        <StarDisplay rating={req.rating} />
                                        <p style={{ fontSize: '0.82rem', fontStyle: 'italic', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>{req.review_text ? `"${req.review_text}"` : '(no comment)'}</p>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>by {req.customer_name}</div>
                                    </div>

                                    <div style={{ fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                                        <strong>Farmer's reason:</strong>&nbsp;
                                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>{req.reason || '—'}</span>
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Requested: {fmtDate(req.created_at)}{req.resolved_at ? ` · Resolved: ${fmtDate(req.resolved_at)}` : ''}</div>
                                </div>

                                {req.status === 'Pending' && (
                                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                        <button
                                            onClick={() => handleAction(req.id, 'approve')}
                                            disabled={actioning === req.id}
                                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0.5rem 1rem', borderRadius: 8, border: 'none', background: '#22c55e', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', opacity: actioning === req.id ? 0.5 : 1 }}>
                                            <CheckCircle size={14} /> Approve & Delete
                                        </button>
                                        <button
                                            onClick={() => handleAction(req.id, 'reject')}
                                            disabled={actioning === req.id}
                                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0.5rem 1rem', borderRadius: 8, border: '1.5px solid #ef444433', background: '#fff', color: '#ef4444', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', opacity: actioning === req.id ? 0.5 : 1 }}>
                                            <XCircle size={14} /> Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ghostBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.55rem 1.1rem', borderRadius: 8, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' };

export default ReviewManagement;
