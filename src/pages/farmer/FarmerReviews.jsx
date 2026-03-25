import React, { useState, useEffect, useCallback } from 'react';
import { Star, X, AlertTriangle, RefreshCw, Trash2, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import { getUser } from '../../utils/userSession';

const API = 'http://localhost:5001';

const STAR_LABELS = ['', 'Terrible', 'Poor', 'Okay', 'Good', 'Excellent'];

function StarDisplay({ rating, size = 14 }) {
    return (
        <div style={{ display: 'flex', gap: 2 }}>
            {[1,2,3,4,5].map(s => (
                <Star key={s} size={size} fill={s <= rating ? '#f59e0b' : 'transparent'} color="#f59e0b" />
            ))}
        </div>
    );
}

function fmtDate(d) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Deletion Request Modal */
function DeleteRequestModal({ review, onClose, onDone }) {
    const user = getUser();
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError]   = useState('');

    const submit = async () => {
        setLoading(true); setError('');
        try {
            const res = await fetch(`${API}/api/farmer/reviews/deletion-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ review_id: review.id, farmer_id: user.id, reason }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            onDone();
            onClose();
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 440, padding: '1.5rem', boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ fontWeight: 800, fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Trash2 size={16} color="#ef4444" /> Request Review Deletion
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
                </div>

                {/* Review preview */}
                <div style={{ padding: '0.85rem', background: 'var(--bg-color)', borderRadius: 10, marginBottom: '1rem', border: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.3rem' }}>{review.product_name}</div>
                    <StarDisplay rating={review.rating} />
                    {review.comment && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.35rem', fontStyle: 'italic' }}>"{review.comment}"</p>}
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>by {review.customer_name} · {fmtDate(review.created_at)}</div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>Reason for deletion request *</label>
                    <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Explain why this review should be removed…"
                        style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: '0.875rem', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }} />
                </div>

                {error && <div style={{ marginBottom: '0.75rem', color: '#ef4444', fontSize: '0.82rem', display: 'flex', gap: 5 }}><AlertTriangle size={13} />{error}</div>}

                <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '0.6rem', borderRadius: 8, border: '1.5px solid var(--border)', background: 'transparent', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>Cancel</button>
                    <button onClick={submit} disabled={loading || !reason.trim()} style={{ flex: 2, padding: '0.6rem', borderRadius: 8, border: 'none', background: loading || !reason.trim() ? 'var(--border)' : '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem' }}>
                        {loading ? 'Sending…' : 'Send Request to Admin'}
                    </button>
                </div>
            </div>
        </div>
    );
}

const FarmerReviews = () => {
    const user = getUser();
    const [reviews, setReviews]     = useState([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState('');
    const [selectedReview, setSelectedReview] = useState(null);
    const [filter, setFilter]       = useState('All');

    const fetch_ = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const res  = await fetch(`${API}/api/farmer/reviews?farmer_id=${user.id}`);
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            setReviews(data.reviews);
            setError('');
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, [user?.id]);

    useEffect(() => { fetch_(); }, [fetch_]);

    const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—';
    const fiveStars = reviews.filter(r => r.rating === 5).length;

    const filtered = filter === 'All' ? reviews
        : filter === 'No Request' ? reviews.filter(r => !r.deletion_status)
        : reviews.filter(r => r.deletion_status === filter);

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Star size={24} color="#f59e0b" fill="#f59e0b" /> Product Reviews
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Customer reviews for your products</p>
                </div>
                <button onClick={fetch_} style={ghostBtn}><RefreshCw size={14} /> Refresh</button>
            </div>

            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.85rem', marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total Reviews',  value: reviews.length, color: 'var(--primary)', icon: '⭐' },
                    { label: 'Average Rating', value: avg,            color: '#f59e0b',        icon: '📊' },
                    { label: '5-Star Reviews', value: fiveStars,      color: '#22c55e',        icon: '🌟' },
                ].map((s, i) => (
                    <div key={i} className="card" style={{ borderTop: `3px solid ${s.color}`, padding: '1rem' }}>
                        <div style={{ fontSize: '1.25rem', marginBottom: '0.2rem' }}>{s.icon}</div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color }}>{loading ? '…' : s.value}</div>
                    </div>
                ))}
            </div>

            {/* Filter */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {['All', 'No Request', 'Pending', 'Approved', 'Rejected'].map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        style={{ padding: '0.35rem 0.9rem', borderRadius: 99, border: `1.5px solid ${filter === f ? 'var(--primary)' : 'var(--border)'}`, background: filter === f ? 'var(--primary)' : '#fff', color: filter === f ? '#fff' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                        {f}
                    </button>
                ))}
            </div>

            {error && <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', background: '#ef444412', border: '1px solid #ef444430', borderRadius: 8, color: '#ef4444', fontSize: '0.83rem' }}>{error}</div>}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}><Star size={40} style={{ opacity: 0.1, marginBottom: '0.75rem' }} /><p>Loading reviews…</p></div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <MessageSquare size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                    <h3 style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>No reviews yet</h3>
                    <p style={{ fontSize: '0.88rem' }}>Reviews from customers who purchased your products will appear here.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filtered.map(review => {
                        const ds = review.deletion_status;
                        const dsBg = ds === 'Pending' ? '#f59e0b12' : ds === 'Approved' ? '#22c55e12' : ds === 'Rejected' ? '#ef444412' : '#fff';
                        const dsBorder = ds === 'Pending' ? '#f59e0b33' : ds === 'Approved' ? '#22c55e33' : ds === 'Rejected' ? '#ef444433' : 'var(--border)';
                        return (
                            <div key={review.id} className="card" style={{ padding: '1.15rem 1.25rem', background: dsBg, border: `1.5px solid ${dsBorder}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                                            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{review.product_name}</span>
                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: 99, background: 'var(--bg-color)', border: '1px solid var(--border)' }}>{review.category}</span>
                                            {ds && (
                                                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: ds === 'Pending' ? '#f59e0b18' : ds === 'Approved' ? '#22c55e18' : '#ef444418', color: ds === 'Pending' ? '#b45309' : ds === 'Approved' ? '#15803d' : '#b91c1c' }}>
                                                    {ds === 'Pending' ? '⏳ Deletion Pending' : ds === 'Approved' ? '✅ Deletion Approved' : '❌ Deletion Rejected'}
                                                </span>
                                            )}
                                        </div>
                                        <StarDisplay rating={review.rating} />
                                        {review.comment && <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.4rem', fontStyle: 'italic', lineHeight: 1.5 }}>"{review.comment}"</p>}
                                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                                            👤 {review.customer_name} · 📅 {fmtDate(review.created_at)} · Order #{String(review.order_id).padStart(4, '0')}
                                        </div>
                                    </div>
                                    {/* Request deletion button (show only if no active request) */}
                                    {(!ds || ds === 'Rejected') && (
                                        <button onClick={() => setSelectedReview(review)}
                                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.85rem', borderRadius: 8, border: '1.5px solid #ef444433', background: '#fff', color: '#ef4444', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', flexShrink: 0 }}>
                                            <Trash2 size={13} /> Request Deletion
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {selectedReview && (
                <DeleteRequestModal
                    review={selectedReview}
                    onClose={() => setSelectedReview(null)}
                    onDone={fetch_}
                />
            )}
        </div>
    );
};

const ghostBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.55rem 1.1rem', borderRadius: 8, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' };

export default FarmerReviews;
