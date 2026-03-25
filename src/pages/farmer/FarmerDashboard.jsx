import React, { useState, useEffect, useCallback } from 'react';
import { Package, AlertTriangle, TrendingUp, Boxes, RefreshCw, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../../utils/userSession';

const API = 'http://localhost:5001';

/* ─── Status badge ────────────────────────────────────────────────────────── */
function StatusBadge({ qty }) {
    if (Number(qty) === 0) return <span style={badge('#ef4444')}>Out of Stock</span>;
    if (Number(qty) < 15)  return <span style={badge('#f59e0b')}>Low Stock</span>;
    return                        <span style={badge('#22c55e')}>Active</span>;
}
function badge(color) {
    return { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 9px', borderRadius: 99, fontSize: '0.73rem', fontWeight: 600, background: color + '18', color, border: `1px solid ${color}33` };
}

const FarmerDashboard = () => {
    const user = getUser();
    const farmerId = user?.id;
    const navigate = useNavigate();

    const [stats, setStats]   = useState(null);
    const [recent, setRecent] = useState([]);
    const [sales, setSales]   = useState({ revenue: 0, count: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError]   = useState('');

    const fetchStats = useCallback(async () => {
        if (!farmerId) return;
        try {
            setLoading(true);
            const [statsRes, salesRes] = await Promise.all([
                fetch(`${API}/api/farmer/stats?farmer_id=${farmerId}`),
                fetch(`${API}/api/farmer/orders?farmer_id=${farmerId}`),
            ]);
            const statsData = await statsRes.json();
            const salesData = await salesRes.json();
            if (!statsData.success) throw new Error(statsData.message || 'Failed to load stats');
            setStats(statsData.stats);
            setRecent(statsData.recentProducts);
            if (salesData.success) {
                const orderIds = new Set(salesData.sales.map(s => s.order_id)).size;
                setSales({ revenue: salesData.totalRevenue, count: orderIds });
            }
            setError('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [farmerId]);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    /* ─── stat cards definition ─────────────────────────────────────────── */
    const cards = stats
        ? [
            { label: 'Total Products',    value: stats.totalProducts,                          color: 'var(--primary)', icon: '📦', sub: 'Listed in your catalogue' },
            { label: 'Low Stock Alerts',  value: stats.lowStock,                               color: '#f59e0b',        icon: '⚠️', sub: 'Products below 15 units'  },
            { label: 'Total Revenue',     value: `LKR ${Number(sales.revenue).toLocaleString()}`, color: '#22c55e',     icon: '💰', sub: 'From completed sales'      },
            { label: 'Total Orders',      value: sales.count,                                  color: '#3b82f6',        icon: '🛒', sub: 'Customer orders received' },
          ]
        : [];

    return (
        <div style={{ padding: '2rem' }}>

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                        👋 Welcome back, {user?.name?.split(' ')[0] || 'Farmer'}!
                    </h1>
                    <p className="text-muted">Here's a quick overview of your farm operations.</p>
                </div>
                <button onClick={fetchStats} style={ghostBtn}>
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            {/* ── Error ──────────────────────────────────────────────────── */}
            {error && (
                <div style={{ padding: '0.85rem 1.25rem', marginBottom: '1.5rem', background: '#ef444418', border: '1px solid #ef444433', borderRadius: 10, color: '#ef4444', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={16} /> {error} &nbsp;—&nbsp; Make sure the server is running.
                </div>
            )}

            {/* ── Stat cards ─────────────────────────────────────────────── */}
            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[1,2,3,4].map(i => (
                        <div key={i} className="card" style={{ padding: '1.5rem', animation: 'pulse 1.5s ease-in-out infinite' }}>
                            <div style={{ height: '1rem', background: '#f0f0f0', borderRadius: 6, marginBottom: '0.75rem', width: '60%' }} />
                            <div style={{ height: '2rem', background: '#f0f0f0', borderRadius: 6, width: '80%' }} />
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {cards.map((c, i) => (
                        <div key={i} className="card" style={{ borderTop: `4px solid ${c.color}`, padding: '1.4rem' }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{c.icon}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.2rem' }}>{c.label}</div>
                            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: c.color, lineHeight: 1.1 }}>{c.value}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{c.sub}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Quick-action shortcuts ──────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate('/farmer/products')} style={actionCard('#4F7942')}>
                    <Package size={24} />
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>Manage Products</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>Add or edit your product catalogue</div>
                    </div>
                    <ArrowRight size={20} style={{ marginLeft: 'auto' }} />
                </button>
                <button onClick={() => navigate('/farmer/inventory')} style={actionCard('#22c55e')}>
                    <Boxes size={24} />
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>Update Inventory</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>Set stock levels, dates & more</div>
                    </div>
                    <ArrowRight size={20} style={{ marginLeft: 'auto' }} />
                </button>
            </div>

            {/* ── Recent inventory ────────────────────────────────────────── */}
            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <TrendingUp size={20} /> Recent Inventory
                    </h3>
                    <button onClick={() => navigate('/farmer/inventory')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        View all <ArrowRight size={14} />
                    </button>
                </div>

                {loading ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading…</p>
                ) : recent.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        <Package size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p style={{ fontWeight: 600, marginBottom: '0.4rem' }}>No products yet</p>
                        <p style={{ fontSize: '0.85rem' }}>
                            <button onClick={() => navigate('/farmer/products')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>Add your first product →</button>
                        </p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                    {['Product', 'Category', 'Price', 'Stock', 'Status'].map(h => (
                                        <th key={h} style={thStyle}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {recent.map((p, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={tdStyle}><span style={{ fontWeight: 600 }}>{p.name}</span></td>
                                        <td style={tdStyle}><span style={catPill}>{p.category}</span></td>
                                        <td style={tdStyle}><span style={{ fontWeight: 600 }}>LKR {Number(p.price).toLocaleString()}</span>/{p.unit}</td>
                                        <td style={tdStyle}><span style={{ fontWeight: 700, color: Number(p.quantity) === 0 ? '#ef4444' : Number(p.quantity) < 15 ? '#f59e0b' : 'var(--text-main)' }}>{p.quantity}</span> {p.unit}</td>
                                        <td style={tdStyle}><StatusBadge qty={p.quantity} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

/* ─── Shared styles ───────────────────────────────────────────────────────── */
const thStyle = { padding: '0.7rem 1rem', fontSize: '0.77rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'left' };
const tdStyle = { padding: '0.8rem 1rem', fontSize: '0.875rem', verticalAlign: 'middle' };
const catPill = { display: 'inline-block', padding: '3px 9px', borderRadius: 99, background: 'var(--primary)15', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600 };
const ghostBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.55rem 1.1rem', borderRadius: 8, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' };
const actionCard = (color) => ({
    display: 'flex', alignItems: 'center', gap: '1rem',
    padding: '1.25rem 1.5rem', borderRadius: 12,
    background: color, color: '#fff', border: 'none',
    cursor: 'pointer', textAlign: 'left', width: '100%',
    transition: 'opacity 0.2s, transform 0.1s',
    boxShadow: `0 4px 14px ${color}44`,
});

export default FarmerDashboard;
