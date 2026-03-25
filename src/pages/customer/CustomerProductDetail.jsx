import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ShoppingCart, Leaf, Calendar, Clock, Package,
    MapPin, AlertTriangle, CheckCircle, Minus, Plus, ArrowLeft, Star
} from 'lucide-react';
import { addToCart } from '../../utils/cartUtils';

const API = 'http://localhost:5001';

function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' });
}

const CAT_EMOJI = { Vegetables: '🥦', Fruits: '🍎', Grains: '🌾', Dairy: '🥛', Herbs: '🌿', Other: '📦' };
const CAT_COLOR = { Vegetables: '#16a34a', Fruits: '#ea580c', Grains: '#ca8a04', Dairy: '#2563eb', Herbs: '#7c3aed', Other: '#6b7280' };

const CustomerProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct]   = useState(null);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState('');
    const [qty, setQty]           = useState(1);
    const [added, setAdded]       = useState(false);
    const [reviews, setReviews]   = useState([]);
    const [reviewsAvg, setReviewsAvg] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const [prodRes, revRes] = await Promise.all([
                    fetch(`${API}/api/products/${id}`),
                    fetch(`${API}/api/reviews/product/${id}`),
                ]);
                const prodData = await prodRes.json();
                const revData  = await revRes.json();
                if (!prodData.success) throw new Error(prodData.message);
                setProduct(prodData.product);
                if (revData.success) {
                    setReviews(revData.reviews);
                    setReviewsAvg(revData.average);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '1rem', color: 'var(--text-muted)' }}>
            <Package size={48} style={{ opacity: 0.2 }} />
            <p>Loading product…</p>
        </div>
    );
    if (error || !product) return (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#ef4444' }}>
            <AlertTriangle size={40} style={{ marginBottom: '1rem' }} />
            <p>{error || 'Product not found'}</p>
            <button onClick={() => navigate(-1)} style={ghostBtn}>← Back</button>
        </div>
    );

    const avail = Number(product.quantity);
    const isOOS = avail === 0;
    const catColor = CAT_COLOR[product.category] || '#6b7280';
    const expiryDays = product.expiry_date
        ? Math.ceil((new Date(product.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
        : null;

    const handleAddToCart = () => {
        addToCart(product, qty);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem' }}>
            {/* Back */}
            <button onClick={() => navigate(-1)} style={{ ...ghostBtn, marginBottom: '1.5rem' }}>
                <ArrowLeft size={16} /> Back to Products
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.05fr', gap: '2rem', alignItems: 'start' }}>
                {/* ── Left: visual panel ─────────────────────────────────── */}
                <div>
                    <div style={{
                        height: 320, borderRadius: 18,
                        background: `linear-gradient(135deg, ${catColor}22 0%, ${catColor}55 100%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative', marginBottom: '1.25rem',
                        border: `1px solid ${catColor}33`,
                    }}>
                        <span style={{ fontSize: '7rem' }}>{CAT_EMOJI[product.category] || '📦'}</span>
                        {product.is_organic && (
                            <span style={{ position: 'absolute', top: 14, left: 14, background: '#16a34a', color: '#fff', fontWeight: 700, fontSize: '0.78rem', padding: '5px 12px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 5 }}>
                                <Leaf size={13} /> Organic
                            </span>
                        )}
                        {isOOS && (
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.2rem' }}>Out of Stock</span>
                            </div>
                        )}
                    </div>

                    {/* Date cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div style={infoCard}>
                            <Calendar size={18} color="var(--primary)" />
                            <div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>Harvest Date</div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{fmtDate(product.harvest_date)}</div>
                            </div>
                        </div>
                        <div style={{ ...infoCard, borderColor: expiryDays !== null && expiryDays <= 3 ? '#f59e0b55' : undefined }}>
                            <Clock size={18} color={expiryDays !== null && expiryDays <= 0 ? '#ef4444' : expiryDays !== null && expiryDays <= 3 ? '#f59e0b' : '#6b7280'} />
                            <div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>Expiry Date</div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: expiryDays !== null && expiryDays <= 3 ? '#f59e0b' : 'inherit' }}>
                                    {fmtDate(product.expiry_date)}
                                    {expiryDays !== null && expiryDays > 0 && expiryDays <= 7 && (
                                        <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 600, marginLeft: 4 }}>({expiryDays}d left)</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Right: product info + purchase ─────────────────────── */}
                <div className="card" style={{ padding: '2rem' }}>
                    {/* Category + organic */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: '0.85rem', flexWrap: 'wrap' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 99, background: catColor + '18', color: catColor, fontSize: '0.75rem', fontWeight: 700 }}>{product.category}</span>
                        {product.is_organic && <span style={{ padding: '3px 10px', borderRadius: 99, background: '#16a34a18', color: '#16a34a', fontSize: '0.75rem', fontWeight: 700 }}>🌿 Certified Organic</span>}
                    </div>

                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>{product.name}</h1>

                    {/* Farmer */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                        <MapPin size={14} />
                        <span>{product.farmer_name}{product.farm_location ? ` · ${product.farm_location}` : ''}</span>
                    </div>

                    {/* Price */}
                    <div style={{ marginBottom: '1rem' }}>
                        <span style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--primary)' }}>LKR {Number(product.price).toLocaleString()}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>/{product.unit}</span>
                    </div>

                    {/* Stock badge */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        {isOOS
                            ? <span style={stockBadge('#ef4444')}><AlertTriangle size={14} /> Out of Stock</span>
                            : avail < 15
                                ? <span style={stockBadge('#f59e0b')}><AlertTriangle size={14} /> Only {avail} {product.unit} left</span>
                                : <span style={stockBadge('#16a34a')}><CheckCircle size={14} /> {avail} {product.unit} available</span>
                        }
                    </div>

                    {/* Description */}
                    {product.description && (
                        <div style={{ marginBottom: '1.25rem', padding: '0.85rem 1rem', background: 'var(--bg-color)', borderRadius: 10, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                            {product.description}
                        </div>
                    )}

                    {!isOOS && (
                        <>
                            {/* Quantity selector */}
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.6rem', color: 'var(--text-muted)' }}>
                                    QUANTITY ({product.unit})
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <button onClick={() => setQty(q => Math.max(1, q - 1))} style={qtyBtn}><Minus size={16} /></button>
                                    <input
                                        type="number" min={1} max={avail} value={qty}
                                        onChange={e => setQty(Math.min(avail, Math.max(1, parseInt(e.target.value) || 1)))}
                                        style={{ width: 70, textAlign: 'center', padding: '0.5rem', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: '1rem', fontWeight: 700 }}
                                    />
                                    <button onClick={() => setQty(q => Math.min(avail, q + 1))} style={qtyBtn}><Plus size={16} /></button>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.87rem' }}>Max: {avail} {product.unit}</span>
                                </div>
                            </div>

                            {/* Subtotal */}
                            <div style={{ marginBottom: '1.5rem', padding: '0.85rem 1rem', borderRadius: 10, background: 'var(--primary)08', border: '1px solid var(--primary)22', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Subtotal</span>
                                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)' }}>
                                    LKR {(Number(product.price) * qty).toLocaleString()}
                                </span>
                            </div>

                            {/* CTA buttons */}
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button
                                    onClick={handleAddToCart}
                                    style={{
                                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                                        padding: '0.85rem', borderRadius: 10, border: 'none',
                                        background: added ? '#16a34a' : 'var(--primary)', color: '#fff',
                                        fontWeight: 800, fontSize: '1rem', cursor: 'pointer', transition: 'background 0.3s',
                                    }}>
                                    {added ? <><CheckCircle size={18} /> Added!</> : <><ShoppingCart size={18} /> Add to Cart</>}
                                </button>
                                <button
                                    onClick={() => { addToCart(product, qty); navigate('/customer/cart'); }}
                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '0.85rem', borderRadius: 10, border: '2px solid var(--primary)', background: 'transparent', color: 'var(--primary)', fontWeight: 800, fontSize: '1rem', cursor: 'pointer' }}>
                                    Buy Now →
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── Reviews Section ───────────────────────────────────────────── */}
            <div style={{ marginTop: '2.5rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Star size={20} fill="#f59e0b" color="#f59e0b" /> Customer Reviews
                    {reviewsAvg && <span style={{ fontSize: '1rem', color: '#f59e0b', fontWeight: 900 }}>{reviewsAvg}</span>}
                    {reviews.length > 0 && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>}
                </h2>

                {reviews.length === 0 ? (
                    <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-color)', borderRadius: 12, border: '1px solid var(--border)' }}>
                        <Star size={36} style={{ opacity: 0.12, marginBottom: '0.75rem' }} />
                        <p style={{ fontWeight: 600 }}>No reviews yet</p>
                        <p style={{ fontSize: '0.85rem' }}>Be the first to review this product after purchasing!</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.85rem' }}>
                        {reviews.map(r => (
                            <div key={r.id} style={{ padding: '1rem 1.25rem', borderRadius: 12, border: '1px solid var(--border)', background: '#fff' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{r.customer_name}</div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                        {new Date(r.created_at).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 2, marginBottom: '0.4rem' }}>
                                    {[1,2,3,4,5].map(s => <Star key={s} size={13} fill={s <= r.rating ? '#f59e0b' : 'transparent'} color="#f59e0b" />)}
                                </div>
                                {r.comment && <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5, margin: 0 }}>"{r.comment}"</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};


const ghostBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.55rem 1.1rem', borderRadius: 8, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' };
const qtyBtn = { width: 38, height: 38, borderRadius: 9, border: '1.5px solid var(--border)', background: 'var(--bg-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' };
const infoCard = { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', borderRadius: 10, border: '1px solid var(--border)', background: '#fff' };
const stockBadge = (color) => ({ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 99, background: color + '15', color, border: `1px solid ${color}33`, fontWeight: 700, fontSize: '0.85rem' });

export default CustomerProductDetail;
