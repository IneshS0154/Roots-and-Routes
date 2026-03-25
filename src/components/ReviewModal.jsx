import React, { useState, useEffect, useCallback } from 'react';
import { Star, X, Send, CheckCircle, AlertTriangle } from 'lucide-react';
import { getUser } from '../utils/userSession';

const API = 'http://localhost:5001';

const CAT_EMOJI = { Vegetables: '🥦', Fruits: '🍎', Grains: '🌾', Dairy: '🥛', Herbs: '🌿', Other: '📦' };

/** Reusable star-rating input */
function StarPicker({ value, onChange }) {
    const [hovered, setHovered] = useState(0);
    return (
        <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3, 4, 5].map(s => (
                <button key={s} type="button"
                    onMouseEnter={() => setHovered(s)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => onChange(s)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, transition: 'transform 0.1s', transform: (hovered || value) >= s ? 'scale(1.15)' : 'scale(1)' }}>
                    <Star size={28} fill={(hovered || value) >= s ? '#f59e0b' : 'transparent'} color="#f59e0b" />
                </button>
            ))}
            <span style={{ alignSelf: 'center', marginLeft: 6, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {['', 'Terrible', 'Poor', 'Okay', 'Good', 'Excellent'][hovered || value] || ''}
            </span>
        </div>
    );
}

/**
 * ReviewModal – shown after a Delivered order is expanded.
 * Props: orderId, customerId, onClose, onDone
 */
const ReviewModal = ({ orderId, customerId, onClose, onDone }) => {
    const [items, setItems]         = useState([]);
    const [loading, setLoading]     = useState(true);
    const [ratings, setRatings]     = useState({});
    const [comments, setComments]   = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState({});
    const [error, setError]         = useState('');

    useEffect(() => {
        (async () => {
            const res = await fetch(`${API}/api/orders/${orderId}/reviewable-items?customer_id=${customerId}`);
            const data = await res.json();
            if (data.success) setItems(data.items);
            setLoading(false);
        })();
    }, [orderId, customerId]);

    const submitReview = async (item) => {
        if (!ratings[item.product_id]) { setError(`Please select a rating for ${item.product_name}`); return; }
        setError('');
        setSubmitting(item.product_id);
        try {
            const res = await fetch(`${API}/api/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_id: orderId, product_id: item.product_id,
                    farmer_id: item.farmer_id, customer_id: customerId,
                    rating: ratings[item.product_id],
                    comment: comments[item.product_id] || '',
                }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            setSubmitted(s => ({ ...s, [item.product_id]: true }));
            setItems(prev => prev.map(i => i.product_id === item.product_id ? { ...i, review_id: data.reviewId } : i));
        } catch (err) { setError(err.message); }
        finally { setSubmitting(null); }
    };

    const allDone = items.every(i => submitted[i.product_id] || i.review_id);

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                {/* Header */}
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontWeight: 800, fontSize: '1.15rem', margin: 0 }}>⭐ Leave a Review</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Share your experience with these products</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: '1.25rem 1.5rem' }}>
                    {loading ? <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading products…</p>
                        : items.length === 0 ? <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No products to review.</p>
                        : items.map(item => {
                            const alreadyReviewed = item.review_id || submitted[item.product_id];
                            return (
                                <div key={item.product_id} style={{ marginBottom: '1.25rem', padding: '1rem', borderRadius: 12, border: `1.5px solid ${alreadyReviewed ? '#22c55e44' : 'var(--border)'}`, background: alreadyReviewed ? '#f0fdf4' : '#fff' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                        <span style={{ fontSize: '1.5rem' }}>{CAT_EMOJI[item.category] || '📦'}</span>
                                        <div>
                                            <div style={{ fontWeight: 700 }}>{item.product_name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>by {item.farmer_name}</div>
                                        </div>
                                        {alreadyReviewed && <CheckCircle size={18} color="#22c55e" style={{ marginLeft: 'auto' }} />}
                                    </div>
                                    {alreadyReviewed ? (
                                        <div style={{ fontSize: '0.85rem', color: '#15803d', fontWeight: 600 }}>✅ Review submitted – thank you!</div>
                                    ) : (
                                        <>
                                            <div style={{ marginBottom: '0.6rem' }}>
                                                <StarPicker value={ratings[item.product_id] || 0} onChange={v => setRatings(r => ({ ...r, [item.product_id]: v }))} />
                                            </div>
                                            <textarea
                                                placeholder="Share your experience (optional)…"
                                                value={comments[item.product_id] || ''}
                                                onChange={e => setComments(c => ({ ...c, [item.product_id]: e.target.value }))}
                                                rows={3}
                                                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: '0.875rem', resize: 'vertical', boxSizing: 'border-box', outline: 'none', marginBottom: '0.6rem' }}
                                            />
                                            <button
                                                onClick={() => submitReview(item)}
                                                disabled={submitting === item.product_id}
                                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 1.1rem', borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', opacity: submitting === item.product_id ? 0.6 : 1 }}>
                                                <Send size={14} /> {submitting === item.product_id ? 'Submitting…' : 'Submit Review'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            );
                        })
                    }

                    {error && (
                        <div style={{ padding: '0.6rem 0.85rem', marginBottom: '0.75rem', background: '#ef444412', border: '1px solid #ef444430', borderRadius: 8, color: '#ef4444', fontSize: '0.82rem', display: 'flex', gap: 6 }}>
                            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
                        </div>
                    )}

                    <button onClick={() => { onDone?.(); onClose(); }}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: 9, border: allDone ? 'none' : '1.5px solid var(--border)', background: allDone ? 'var(--primary)' : 'transparent', color: allDone ? '#fff' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
                        {allDone ? '✓ Done' : 'Close'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export { ReviewModal, StarPicker };
export default ReviewModal;
