import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    ShoppingCart, Search, Filter, Package, Leaf,
    AlertTriangle, SlidersHorizontal, X, Plus, Minus, CheckCircle
} from 'lucide-react';
import { addToCart } from '../../utils/cartUtils';

const API = 'http://localhost:5001';
const CATEGORIES = ['All', 'Vegetables', 'Fruits', 'Grains', 'Dairy', 'Herbs', 'Other'];
const CATEGORY_COLORS = {
    Vegetables: '#16a34a', Fruits: '#ea580c', Grains: '#ca8a04',
    Dairy: '#2563eb', Herbs: '#7c3aed', Other: '#6b7280',
};

/* ─── Product card ────────────────────────────────────────────────────────── */
const ProductCard = ({ product }) => {
    const isOOS = Number(product.quantity) === 0;
    const catColor = CATEGORY_COLORS[product.category] || '#6b7280';
    const maxQty = Number(product.quantity);

    const [qty, setQty]     = useState(1);
    const [added, setAdded] = useState(false);

    const handleAdd = () => {
        addToCart(product, qty);
        setAdded(true);
        setQty(1);
        setTimeout(() => setAdded(false), 1800);
    };

    return (
        <div style={{
            background: '#fff', borderRadius: 14, overflow: 'hidden',
            border: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
            transition: 'transform 0.18s, box-shadow 0.18s', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}>

            {/* Image area */}
            <div style={{ height: 150, background: `linear-gradient(135deg, ${catColor}22, ${catColor}44)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <span style={{ fontSize: '3.5rem' }}>{getCategoryEmoji(product.category)}</span>
                {product.is_organic ? (
                    <span style={{ position: 'absolute', top: 10, left: 10, background: '#16a34a', color: '#fff', fontSize: '0.68rem', fontWeight: 700, padding: '3px 8px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Leaf size={10} /> Organic
                    </span>
                ) : (
                    <span style={{ position: 'absolute', top: 10, left: 10, background: '#f3f4f6', color: '#6b7280', fontSize: '0.68rem', fontWeight: 700, padding: '3px 8px', borderRadius: 99 }}>
                        Non-Organic
                    </span>
                )}
                {isOOS && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>Out of Stock</span>
                    </div>
                )}
            </div>

            <div style={{ padding: '1rem 1.1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 99, background: catColor + '18', color: catColor, fontSize: '0.7rem', fontWeight: 700, width: 'fit-content' }}>{product.category}</span>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', margin: 0 }}>{product.name}</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                    🌾 {product.farmer_name || 'Local Farmer'}
                    {product.farm_location ? ` · ${product.farm_location}` : ''}
                </p>
                {product.description && (
                    <p style={{ fontSize: '0.77rem', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{product.description}</p>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '0.75rem' }}>
                    <div>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary)' }}>LKR {Number(product.price).toLocaleString()}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>/{product.unit}</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: maxQty < 15 && !isOOS ? '#f59e0b' : 'var(--text-muted)', fontWeight: 600 }}>
                        {isOOS ? '' : `${product.quantity} ${product.unit} left`}
                    </span>
                </div>

                {/* Quantity picker + Add to Cart */}
                {!isOOS && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-color)', borderRadius: 9, padding: '0.35rem 0.5rem', border: '1px solid var(--border)' }}>
                        <button
                            onClick={() => setQty(q => Math.max(1, q - 1))}
                            style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Minus size={12} />
                        </button>
                        <input
                            type="number" min={1} max={maxQty} value={qty}
                            onChange={e => setQty(Math.min(maxQty, Math.max(1, parseInt(e.target.value) || 1)))}
                            style={{ width: 38, textAlign: 'center', border: 'none', background: 'transparent', fontWeight: 700, fontSize: '0.9rem', outline: 'none' }}
                        />
                        <button
                            onClick={() => setQty(q => Math.min(maxQty, q + 1))}
                            style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Plus size={12} />
                        </button>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flex: 1, textAlign: 'center' }}>{product.unit}</span>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <Link to={`/customer/products/${product.id}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', borderRadius: 8, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.82rem', textDecoration: 'none', gap: 4 }}>
                        View Details
                    </Link>
                    <button
                        disabled={isOOS || added}
                        onClick={handleAdd}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '0.5rem', borderRadius: 8, border: 'none', background: added ? '#22c55e' : isOOS ? '#f3f4f6' : 'var(--primary)', color: added || !isOOS ? '#fff' : '#9ca3af', fontWeight: 700, fontSize: '0.82rem', cursor: isOOS ? 'not-allowed' : 'pointer', transition: 'background 0.25s' }}>
                        {added ? <><CheckCircle size={14} /> Added!</> : <><ShoppingCart size={14} /> Add</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

function getCategoryEmoji(cat) {
    const map = { Vegetables: '🥦', Fruits: '🍎', Grains: '🌾', Dairy: '🥛', Herbs: '🌿', Other: '📦' };
    return map[cat] || '📦';
}



/* ─── Main Component ──────────────────────────────────────────────────────── */
const CustomerProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [organicOnly, setOrganicOnly] = useState(false);
    const [sort, setSort] = useState('name');
    const [searchInput, setSearchInput] = useState('');

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (category !== 'All') params.set('category', category);
            if (organicOnly) params.set('organic', '1');
            if (search) params.set('search', search);
            params.set('sort', sort);
            const res = await fetch(`${API}/api/products?${params}`);
            const data = await res.json();
            if (!data.success) throw new Error(data.message || 'Failed to load products');
            setProducts(data.products);
            setError('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [category, organicOnly, search, sort]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setSearch(searchInput);
    };

    const activeCount = products.filter(p => Number(p.quantity) > 0).length;
    const organicCount = products.filter(p => p.is_organic).length;

    return (
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem' }}>

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Fresh from the Farm
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                    Browse products directly from local farmers — fresh, traceable, and delivered to you.
                </p>
            </div>

            {/* ── Search + Filters ────────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Search bar */}
                <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flex: 1, minWidth: '220px', position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        placeholder="Search products…"
                        style={{ width: '100%', padding: '0.65rem 0.85rem 0.65rem 2.4rem', borderRadius: '8px 0 0 8px', border: '1.5px solid var(--border)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', background: '#fff' }}
                    />
                    <button type="submit" style={{ padding: '0.65rem 1rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '0 8px 8px 0', fontWeight: 700, cursor: 'pointer' }}>Search</button>
                </form>

                {/* Category filter */}
                <div style={{ position: 'relative' }}>
                    <Filter size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: '0.65rem 0.85rem 0.65rem 2.1rem', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: '0.9rem', outline: 'none', background: '#fff', cursor: 'pointer' }}>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                </div>

                {/* Sort */}
                <div style={{ position: 'relative' }}>
                    <SlidersHorizontal size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: '0.65rem 0.85rem 0.65rem 2.1rem', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: '0.9rem', outline: 'none', background: '#fff', cursor: 'pointer' }}>
                        <option value="name">Sort: A–Z</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                    </select>
                </div>

                {/* Organic toggle */}
                <button
                    onClick={() => setOrganicOnly(!organicOnly)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.65rem 1rem', borderRadius: 8, border: `1.5px solid ${organicOnly ? '#16a34a' : 'var(--border)'}`, background: organicOnly ? '#16a34a18' : '#fff', color: organicOnly ? '#16a34a' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                    <Leaf size={15} /> Organic Only
                </button>

                {/* Clear filters */}
                {(search || category !== 'All' || organicOnly) && (
                    <button onClick={() => { setSearch(''); setSearchInput(''); setCategory('All'); setOrganicOnly(false); }} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0.65rem 1rem', borderRadius: 8, border: '1.5px solid #ef444444', background: '#ef444408', color: '#ef4444', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' }}>
                        <X size={14} /> Clear
                    </button>
                )}
            </div>

            {/* ── Stats row ──────────────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {[
                    { label: `${products.length} Products`, color: 'var(--primary)' },
                    { label: `${activeCount} In Stock`, color: '#22c55e' },
                    { label: `${organicCount} Organic`, color: '#16a34a' },
                ].map((s, i) => (
                    <span key={i} style={{ padding: '4px 12px', borderRadius: 99, background: s.color + '15', color: s.color, fontSize: '0.8rem', fontWeight: 700, border: `1px solid ${s.color}33` }}>{s.label}</span>
                ))}
            </div>

            {/* ── Error ──────────────────────────────────────────────────── */}
            {error && (
                <div style={{ padding: '0.85rem 1.25rem', marginBottom: '1.5rem', background: '#ef444418', border: '1px solid #ef444433', borderRadius: 10, color: '#ef4444', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={16} /> {error} — Make sure the server is running.
                </div>
            )}

            {/* ── Product Grid ────────────────────────────────────────────── */}
            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '1.25rem' }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
                            <div style={{ height: 150, background: '#f3f4f6' }} />
                            <div style={{ padding: '1rem' }}>
                                <div style={{ height: 12, background: '#f3f4f6', borderRadius: 6, marginBottom: 8, width: '60%' }} />
                                <div style={{ height: 18, background: '#f3f4f6', borderRadius: 6, marginBottom: 8 }} />
                                <div style={{ height: 12, background: '#f3f4f6', borderRadius: 6, width: '40%' }} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-muted)' }}>
                    <Package size={56} style={{ opacity: 0.15, marginBottom: '1.25rem' }} />
                    <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>No products found</h3>
                    <p style={{ fontSize: '0.9rem' }}>Try adjusting your filters or check back later for new listings.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '1.25rem' }}>
                    {products.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
            )}

            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1.25rem', textAlign: 'right' }}>
                {loading ? '' : `${products.length} product${products.length !== 1 ? 's' : ''} listed`}
            </p>
        </div>
    );
};

export default CustomerProducts;
