import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Package, Leaf, Search, X, User, MapPin, Calendar, Clock, Tag, Hash, ChevronRight } from 'lucide-react';

const API = 'http://localhost:5001';

const CATEGORY_EMOJIS = { Vegetables: '🥦', Fruits: '🍎', Grains: '🌾', Dairy: '🥛', Herbs: '🌿', Other: '📦' };

/**
 * CustomerTraceability – shows all products with a QR code.
 * Scanning (or clicking) the QR code shows full product + farmer details.
 */
const CustomerTraceability = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null); // product to show in detail modal

    useEffect(() => {
        fetch(`${API}/api/products`)
            .then(r => r.json())
            .then(data => {
                if (data.success) setProducts(data.products);
                else setError(data.message || 'Failed to load products');
            })
            .catch(() => setError('Server is offline. Please try again later.'))
            .finally(() => setLoading(false));
    }, []);

    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.farmer_name || '').toLowerCase().includes(search.toLowerCase())
    );

    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

    // URL that the QR will encode — clicking in modal navigates to product detail
    const qrUrl = (id) => `${window.location.origin}/customer/products/${id}`;

    return (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem' }}>
            <div style={{ marginBottom: '1.75rem' }}>
                <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: '0.35rem' }}>🔍 Traceability</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.93rem' }}>
                    Every product's journey — from farm to your doorstep. Scan any QR code to get full traceability details.
                </p>
            </div>

            {/* Search bar */}
            <div style={{ position: 'relative', marginBottom: '1.5rem', maxWidth: 460 }}>
                <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                    className="form-control"
                    style={{ paddingLeft: '2.4rem' }}
                    placeholder="Search by product, category, or farmer…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {loading && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: 130, height: 130, background: '#f3f4f6', borderRadius: 8 }} />
                            <div style={{ height: 14, width: '70%', background: '#f3f4f6', borderRadius: 4 }} />
                        </div>
                    ))}
                </div>
            )}

            {error && (
                <div style={{ padding: '1rem', background: '#fee', border: '1px solid #fcc', borderRadius: 8, color: '#c33', marginBottom: '1rem' }}>
                    ⚠️ {error}
                </div>
            )}

            {!loading && !error && filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <Package size={48} style={{ opacity: 0.15, marginBottom: '0.75rem' }} />
                    <p style={{ fontWeight: 600 }}>No products match your search.</p>
                </div>
            )}

            {/* Product grid — name + QR code only */}
            {!loading && !error && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}>
                    {filtered.map(p => (
                        <div
                            key={p.id}
                            onClick={() => setSelected(p)}
                            style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--border)', padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.04)'; }}
                        >
                            {/* QR Code */}
                            <div style={{ padding: 8, background: '#f9fafb', borderRadius: 10, border: '1px solid var(--border)' }}>
                                <QRCodeSVG value={qrUrl(p.id)} size={130} level="M" fgColor="#1f2937" />
                            </div>

                            {/* Product name + category badge */}
                            <div style={{ textAlign: 'center' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary)', background: 'rgba(79,121,66,0.1)', padding: '2px 8px', borderRadius: 99 }}>
                                    {CATEGORY_EMOJIS[p.category] || '📦'} {p.category || 'Other'}
                                </span>
                                <h3 style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)', margin: '0.4rem 0 0' }}>{p.name}</h3>
                                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>🌾 {p.farmer_name || 'Local Farmer'}</p>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600 }}>
                                View Details <ChevronRight size={12} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Detail Modal ── */}
            {selected && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
                    onClick={() => setSelected(null)}
                >
                    <div
                        className="card"
                        style={{ maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                            <div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', background: 'rgba(79,121,66,0.1)', padding: '2px 8px', borderRadius: 99, display: 'inline-block', marginBottom: '0.35rem' }}>
                                    {CATEGORY_EMOJIS[selected.category] || '📦'} {selected.category}
                                </span>
                                <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.3rem' }}>{selected.name}</h2>
                            </div>
                            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}><X size={20} /></button>
                        </div>

                        {/* QR + info two-column */}
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                            <div style={{ padding: 10, background: '#f9fafb', borderRadius: 10, border: '1px solid var(--border)', flexShrink: 0 }}>
                                <QRCodeSVG value={qrUrl(selected.id)} size={140} level="M" fgColor="#1f2937" />
                                <p style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-muted)', margin: '0.5rem 0 0' }}>Scan to view product</p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1 }}>
                                <InfoRow icon={Hash} label="Product ID" value={`#PRD-${selected.id}`} />
                                <InfoRow icon={User} label="Farmer" value={selected.farmer_name || '—'} />
                                <InfoRow icon={MapPin} label="Farm Location" value={selected.farm_location || '—'} />
                                <InfoRow icon={Tag} label="Price" value={`LKR ${Number(selected.price).toLocaleString()} / ${selected.unit}`} />
                                <InfoRow icon={Package} label="Available Qty" value={selected.quantity > 0 ? `${selected.quantity} ${selected.unit}` : 'Out of Stock'} />
                            </div>
                        </div>

                        {/* Dates */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                            <div style={{ padding: '0.85rem', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: '#16a34a', fontWeight: 700, marginBottom: '0.25rem' }}><Calendar size={13} /> Harvest Date</div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{fmt(selected.harvest_date)}</div>
                            </div>
                            <div style={{ padding: '0.85rem', background: '#fef9f0', borderRadius: 10, border: '1px solid #fde68a' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: '#d97706', fontWeight: 700, marginBottom: '0.25rem' }}><Clock size={13} /> Expiry Date</div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{fmt(selected.expiry_date)}</div>
                            </div>
                        </div>

                        {/* Badges */}
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {selected.is_organic && (
                                <span style={{ background: '#16a34a', color: '#fff', padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Leaf size={11} /> Certified Organic
                                </span>
                            )}
                            {selected.description && (
                                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.5rem 0 0', width: '100%' }}>{selected.description}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const InfoRow = ({ icon: Icon, label, value }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <Icon size={14} color="var(--primary)" style={{ marginTop: 2, flexShrink: 0 }} />
        <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{value}</div>
        </div>
    </div>
);

export { CustomerTraceability };
export default CustomerTraceability;
