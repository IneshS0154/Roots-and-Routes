import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Package, ClipboardList, LifeBuoy, MapPin, Bell, Search, Leaf, RefreshCw, AlertTriangle, Check } from 'lucide-react';
import { getUser } from '../../utils/userSession';
import { addToCart } from '../../utils/cartUtils';

const API = 'http://localhost:5001';

const CATEGORY_EMOJIS = { Vegetables: '🥦', Fruits: '🍎', Grains: '🌾', Dairy: '🥛', Herbs: '🌿', Other: '📦' };
const CATEGORY_COLORS = { Vegetables: '#16a34a', Fruits: '#ea580c', Grains: '#ca8a04', Dairy: '#2563eb', Herbs: '#7c3aed', Other: '#6b7280' };

/* ─── Mini product card for recommendations ───────────────────────────────── */
const RecommendCard = ({ product, onAdd, isGuest, navigate }) => {
    const isOOS = Number(product.quantity) === 0;
    const catColor = CATEGORY_COLORS[product.category] || '#6b7280';
    const [added, setAdded] = useState(false);

    const handleAdd = () => {
        if (isOOS) return;
        if (isGuest) { navigate('/login'); return; }
        addToCart(product, 1);
        setAdded(true);
        onAdd?.();
        setTimeout(() => setAdded(false), 1800);
    };

    return (
        <div style={{
            background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', transition: 'transform 0.18s, box-shadow 0.18s',
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
        }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.05)'; }}>

            <div style={{ height: 130, background: `linear-gradient(135deg, ${catColor}22, ${catColor}44)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <span style={{ fontSize: '3rem' }}>{CATEGORY_EMOJIS[product.category] || '📦'}</span>
                {!!product.is_organic && (
                    <span style={{ position: 'absolute', top: 8, left: 8, background: '#16a34a', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Leaf size={9} /> Organic
                    </span>
                )}
                {isOOS && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.82rem' }}>Out of Stock</span>
                    </div>
                )}
            </div>

            <div style={{ padding: '0.85rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 99, background: catColor + '18', color: catColor, fontSize: '0.65rem', fontWeight: 700, width: 'fit-content' }}>{product.category}</span>
                <h3 style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)', margin: 0 }}>{product.name}</h3>
                <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', margin: 0 }}>🌾 {product.farmer_name || 'Local Farmer'}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--primary)' }}>LKR {Number(product.price).toLocaleString()}<span style={{ fontWeight: 400, fontSize: '0.73rem', color: 'var(--text-muted)' }}>/{product.unit}</span></span>
                </div>
                <button
                    onClick={handleAdd}
                    disabled={isOOS}
                    style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '0.45rem', borderRadius: 8, border: 'none', background: added ? '#16a34a' : isOOS ? '#f3f4f6' : 'var(--primary)', color: added ? '#fff' : isOOS ? '#9ca3af' : '#fff', fontWeight: 700, fontSize: '0.8rem', cursor: isOOS ? 'not-allowed' : 'pointer', transition: 'background 0.3s' }}>
                    {added ? <><Check size={13} /> Added!</> : isGuest ? <><ShoppingCart size={13} /> Login to Buy</> : <><ShoppingCart size={13} /> {isOOS ? 'Out of Stock' : 'Add to Cart'}</>}
                </button>
            </div>
        </div>
    );
};

/* ─── Main Component ──────────────────────────────────────────────────────── */
const CustomerHome = () => {
    const user = getUser();
    const navigate = useNavigate();
    const isGuest = !user;  // true when viewed publicly without login
    const firstName = user?.name?.split(' ')[0] || 'there';

    const [recommendations, setRecommendations] = useState([]);
    const [recLoading, setRecLoading]           = useState(true);
    const [recError, setRecError]               = useState('');
    const [organicFilter, setOrganicFilter]     = useState(false);
    const [searchVal, setSearchVal]             = useState('');

    const fetchRecs = async () => {
        try {
            setRecLoading(true);
            const res = await fetch(`${API}/api/products/random?limit=8`);
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            setRecommendations(data.products);
            setRecError('');
        } catch (err) {
            setRecError(err.message);
        } finally {
            setRecLoading(false);
        }
    };

    useEffect(() => { fetchRecs(); }, []);

    const visibleRecs = organicFilter ? recommendations.filter(p => p.is_organic) : recommendations;

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchVal.trim()) navigate(`/customer/products?search=${encodeURIComponent(searchVal.trim())}`);
        else navigate('/customer/products');
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>

            {/* ── Notification bar ────────────────────────────────────────── */}
            <div className="card" style={{ backgroundColor: 'var(--secondary)', color: 'white', padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundImage: 'linear-gradient(to right, var(--secondary), var(--primary))' }}>
                <Bell size={20} />
                <span style={{ fontWeight: 500 }}>Your order #ORD-1029 is out for delivery!</span>
            </div>

            {/* ── Welcome banner ──────────────────────────────────────────── */}
            <div className="card" style={{ backgroundColor: 'var(--primary)', color: 'var(--white)', padding: '3rem 2rem', marginBottom: '2rem', backgroundImage: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', boxShadow: 'var(--shadow-lg)' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Welcome back, {firstName}!</h1>
                <p style={{ fontSize: '1.125rem', opacity: 0.9, maxWidth: '600px' }}>
                    Ready for fresh, organic, farm-to-table goodness? Support local agriculture while eating healthier.
                </p>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0', background: 'white', padding: '0.35rem 0.35rem 0.35rem 1rem', borderRadius: 'var(--radius-md)', maxWidth: '500px', marginTop: '1.5rem', alignItems: 'center' }}>
                    <Search color="var(--text-muted)" size={18} style={{ marginRight: '0.5rem', flexShrink: 0 }} />
                    <input
                        type="text"
                        value={searchVal}
                        onChange={e => setSearchVal(e.target.value)}
                        placeholder="Search for organic vegetables, fruits..."
                        style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem', color: 'var(--text-main)', background: 'transparent' }}
                    />
                    <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>Search</button>
                </form>
            </div>

            {/* ── Quick actions ───────────────────────────────────────────── */}
            <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '2.5rem' }}>
                {(isGuest ? [
                    { to: '/products',      icon: Package,       label: 'Browse Products' },
                    { to: '/traceability',  icon: MapPin,        label: 'Track Product' },
                    { to: '/login',         icon: ClipboardList, label: 'My Orders' },
                    { to: '/login',         icon: LifeBuoy,      label: 'Support' },
                ] : [
                    { to: '/customer/products',     icon: Package,       label: 'Browse Products' },
                    { to: '/customer/orders',       icon: ClipboardList, label: 'My Orders' },
                    { to: '/customer/traceability', icon: MapPin,        label: 'Track Product' },
                    { to: '/customer/support',      icon: LifeBuoy,      label: 'Support' },
                ]).map(({ to, icon: Icon, label }) => (
                    <Link key={to} to={to} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: 'inherit', transition: 'all 0.2s', borderBottom: '3px solid transparent' }}
                        onMouseEnter={e => e.currentTarget.style.borderBottomColor = 'var(--primary)'}
                        onMouseLeave={e => e.currentTarget.style.borderBottomColor = 'transparent'}>
                        <div style={{ padding: '1rem', backgroundColor: 'rgba(79,121,66,0.1)', borderRadius: '50%', color: 'var(--primary)' }}>
                            <Icon size={32} />
                        </div>
                        <span style={{ fontWeight: 600 }}>{label}</span>
                    </Link>
                ))}
            </div>

            {/* ── Recommended For You ─────────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Recommended For You</h2>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                        onClick={() => setOrganicFilter(!organicFilter)}
                        className={organicFilter ? '' : 'badge badge-success'}
                        style={{ border: organicFilter ? 'none' : undefined, cursor: 'pointer', background: organicFilter ? '#16a34a' : undefined, color: organicFilter ? '#fff' : undefined, padding: '0.3rem 0.8rem', borderRadius: 99, fontWeight: 600, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Leaf size={12} /> {organicFilter ? '🌿 Organic Only' : 'Organic Only'}
                    </button>
                    <button onClick={fetchRecs} title="Shuffle recommendations" style={{ background: 'transparent', border: '1.5px solid var(--border)', borderRadius: 8, padding: '0.3rem 0.6rem', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', fontWeight: 600 }}>
                        <RefreshCw size={13} /> Shuffle
                    </button>
                    <Link to={isGuest ? '/products' : '/customer/products'} style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>View all →</Link>
                </div>
            </div>

            {recError && (
                <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', background: '#ef444412', border: '1px solid #ef444430', borderRadius: 8, color: '#ef4444', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={14} /> {recError} — Server may be offline.
                </div>
            )}

            {recLoading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1.25rem', marginBottom: '2.5rem' }}>
                    {[1,2,3,4].map(i => (
                        <div key={i} style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
                            <div style={{ height: 130, background: '#f3f4f6' }} />
                            <div style={{ padding: '0.85rem' }}>
                                <div style={{ height: 10, background: '#f3f4f6', borderRadius: 4, marginBottom: 6, width: '50%' }} />
                                <div style={{ height: 16, background: '#f3f4f6', borderRadius: 4, marginBottom: 8 }} />
                                <div style={{ height: 32, background: '#f3f4f6', borderRadius: 8 }} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : visibleRecs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', background: '#fff', borderRadius: 14, border: '1px solid var(--border)', marginBottom: '2.5rem' }}>
                    <Package size={40} style={{ opacity: 0.15, marginBottom: '0.75rem' }} />
                    <p style={{ fontWeight: 600 }}>{organicFilter ? 'No organic products available yet' : 'No products available yet'}</p>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>Farmers are adding products — check back soon!</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
                    {visibleRecs.map(p => <RecommendCard key={p.id} product={p} isGuest={isGuest} navigate={navigate} onAdd={isGuest ? undefined : () => window.dispatchEvent(new Event('cart-updated'))} />)}
                </div>
            )}
        </div>
    );
};

export default CustomerHome;
