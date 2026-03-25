import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, RefreshCw, Package, AlertTriangle, ShoppingBag } from 'lucide-react';
import { getUser } from '../../utils/userSession';

const API = 'http://localhost:5001';

const STATUS_STYLE = {
    Pending:           { bg: '#f59e0b18', color: '#b45309' },
    Processing:        { bg: '#3b82f618', color: '#1d4ed8' },
    'Out for Delivery':{ bg: '#8b5cf618', color: '#6d28d9' },
    Delivered:         { bg: '#22c55e18', color: '#15803d' },
    Cancelled:         { bg: '#ef444418', color: '#b91c1c' },
};

function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-LK', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const FarmerSales = () => {
    const user = getUser();
    const [sales, setSales]           = useState([]);
    const [totalRevenue, setTotal]    = useState(0);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState('');

    const fetchSales = useCallback(async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const res = await fetch(`${API}/api/farmer/orders?farmer_id=${user.id}`);
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            setSales(data.sales);
            setTotal(data.totalRevenue);
            setError('');
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, [user?.id]);

    useEffect(() => { fetchSales(); }, [fetchSales]);

    /* ── Derived stats ── */
    const totalOrders   = new Set(sales.map(s => s.order_id)).size;
    const totalUnits    = sales.reduce((s, r) => s + Number(r.quantity), 0);
    const paidRevenue   = sales.filter(s => s.payment_status === 'Paid').reduce((s, r) => s + Number(r.subtotal), 0);

    return (
        <div style={{ padding: '2rem', minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <TrendingUp size={28} color="var(--primary)" /> Sales
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Transactions from customers buying your products</p>
                </div>
                <button onClick={fetchSales} style={ghostBtn}><RefreshCw size={15} /> Refresh</button>
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {[
                    { label: 'Total Revenue',   value: `LKR ${Number(totalRevenue).toLocaleString()}`, color: '#22c55e', icon: '💰' },
                    { label: 'Paid Revenue',    value: `LKR ${paidRevenue.toLocaleString()}`,          color: 'var(--primary)', icon: '✅' },
                    { label: 'Total Orders',    value: totalOrders,                                    color: '#3b82f6',        icon: '📦' },
                    { label: 'Units Sold',      value: `${totalUnits}`,                                color: '#f59e0b',        icon: '🌾' },
                ].map((s, i) => (
                    <div key={i} className="card" style={{ borderTop: `4px solid ${s.color}`, padding: '1.25rem' }}>
                        <div style={{ fontSize: '1.4rem', marginBottom: '0.4rem' }}>{s.icon}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.25rem' }}>{s.label}</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Error */}
            {error && (
                <div style={{ padding: '0.85rem 1.25rem', marginBottom: '1.5rem', background: '#ef444418', border: '1px solid #ef444433', borderRadius: 10, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem' }}>
                    <AlertTriangle size={16} /> {error}
                </div>
            )}

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Package size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p>Loading sales…</p>
                    </div>
                ) : sales.length === 0 ? (
                    <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <ShoppingBag size={52} style={{ opacity: 0.12, marginBottom: '1.25rem' }} />
                        <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>No sales yet</h3>
                        <p style={{ fontSize: '0.9rem' }}>When customers buy your products, transactions will appear here.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-color)', borderBottom: '2px solid var(--border)' }}>
                                    {['Order #', 'Date', 'Product', 'Customer', 'Qty', 'Unit Price', 'Subtotal', 'Status', 'Payment'].map(h => (
                                        <th key={h} style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sales.map((sale, idx) => {
                                    const st = STATUS_STYLE[sale.status] || {};
                                    return (
                                        <tr key={idx}
                                            style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-color)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={td}><span style={{ fontWeight: 800 }}>#ORD-{String(sale.order_id).padStart(4, '0')}</span></td>
                                            <td style={td}><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{fmtDate(sale.created_at)}</span></td>
                                            <td style={td}>
                                                <div style={{ fontWeight: 600 }}>{sale.product_name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sale.category}</div>
                                            </td>
                                            <td style={td}>
                                                <div style={{ fontWeight: 600 }}>{sale.customer_name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sale.customer_email}</div>
                                            </td>
                                            <td style={td}><span style={{ fontWeight: 700 }}>{sale.quantity}</span> <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sale.unit}</span></td>
                                            <td style={td}>LKR {Number(sale.unit_price).toLocaleString()}</td>
                                            <td style={td}><span style={{ fontWeight: 800, color: 'var(--primary)' }}>LKR {Number(sale.subtotal).toLocaleString()}</span></td>
                                            <td style={td}>
                                                <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 99, fontSize: '0.73rem', fontWeight: 700, background: st.bg, color: st.color }}>{sale.status}</span>
                                            </td>
                                            <td style={td}>
                                                <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 99, fontSize: '0.73rem', fontWeight: 700, background: sale.payment_status === 'Paid' ? '#22c55e18' : '#f59e0b18', color: sale.payment_status === 'Paid' ? '#15803d' : '#b45309' }}>
                                                    {sale.payment_method === 'card' ? '💳' : '💵'} {sale.payment_status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.75rem', textAlign: 'right' }}>
                {sales.length} transaction{sales.length !== 1 ? 's' : ''} recorded
            </p>
        </div>
    );
};

const td = { padding: '0.85rem 1rem', fontSize: '0.875rem', verticalAlign: 'middle' };
const ghostBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.55rem 1.1rem', borderRadius: 8, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' };

export default FarmerSales;
