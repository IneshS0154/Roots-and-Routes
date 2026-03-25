import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ChevronDown, ChevronUp, AlertTriangle, Package, Search, Filter } from 'lucide-react';

const API = 'http://localhost:5001';
const STATUSES = ['All', 'Pending', 'Processing', 'Out for Delivery', 'Delivered', 'Cancelled'];
const PAYMENTS = ['All', 'Paid', 'Unpaid'];

const STATUS_COLOR = {
    Pending: '#f59e0b', Processing: '#3b82f6', 'Out for Delivery': '#8b5cf6',
    Delivered: '#22c55e', Cancelled: '#ef4444',
};

function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-LK', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const OrderManagement = () => {
    const [orders, setOrders]     = useState([]);
    const [summary, setSummary]   = useState({});
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState('');
    const [expanded, setExpanded] = useState({});
    const [search, setSearch]     = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [statusFilter, setStatus] = useState('All');
    const [payFilter, setPay]     = useState('All');
    const [updatingId, setUpdatingId] = useState(null);

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (statusFilter !== 'All') params.set('status', statusFilter);
            if (payFilter !== 'All') params.set('payment', payFilter);
            if (search) params.set('search', search);
            const res = await fetch(`${API}/api/admin/orders?${params}`);
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            setOrders(data.orders);
            setSummary(data.summary || {});
            setError('');
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, [statusFilter, payFilter, search]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const updateStatus = async (orderId, newStatus) => {
        setUpdatingId(orderId);
        try {
            await fetch(`${API}/api/admin/orders/${orderId}/status`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            fetchOrders();
        } finally { setUpdatingId(null); }
    };

    const td = { padding: '0.875rem 1rem', fontSize: '0.875rem', verticalAlign: 'middle' };

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Order Management</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>All customer orders across the platform</p>
                </div>
                <button onClick={fetchOrders} style={ghostBtn}><RefreshCw size={15} /> Refresh</button>
            </div>

            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '0.85rem', marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total Orders',   value: summary.total || 0,     color: 'var(--primary)' },
                    { label: 'Pending',        value: summary.pending || 0,   color: '#f59e0b' },
                    { label: 'Delivered',      value: summary.delivered || 0, color: '#22c55e' },
                    { label: 'Cancelled',      value: summary.cancelled || 0, color: '#ef4444' },
                    { label: 'Total Revenue',  value: `LKR ${Number(summary.totalRevenue || 0).toLocaleString()}`, color: '#3b82f6' },
                ].map((s, i) => (
                    <div key={i} className="card" style={{ textAlign: 'center', borderTop: `3px solid ${s.color}`, padding: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>{s.label}</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{loading ? '…' : s.value}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <form onSubmit={e => { e.preventDefault(); setSearch(searchInput); }} style={{ display: 'flex', flex: 1, minWidth: '200px', position: 'relative' }}>
                    <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search by customer or order ID…"
                        style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 2.2rem', borderRadius: '8px 0 0 8px', border: '1.5px solid var(--border)', fontSize: '0.875rem', outline: 'none', background: '#fff', boxSizing: 'border-box' }} />
                    <button type="submit" style={{ padding: '0.6rem 1rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '0 8px 8px 0', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>Search</button>
                </form>
                <div style={{ position: 'relative' }}>
                    <Filter size={13} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <select value={statusFilter} onChange={e => setStatus(e.target.value)} style={{ padding: '0.6rem 0.75rem 0.6rem 2rem', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: '0.875rem', outline: 'none', background: '#fff', cursor: 'pointer' }}>
                        {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                </div>
                <select value={payFilter} onChange={e => setPay(e.target.value)} style={{ padding: '0.6rem 0.75rem', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: '0.875rem', outline: 'none', background: '#fff', cursor: 'pointer' }}>
                    {PAYMENTS.map(p => <option key={p}>{p}</option>)}
                </select>
            </div>

            {error && (
                <div style={{ padding: '0.85rem 1.25rem', marginBottom: '1rem', background: '#ef444412', border: '1px solid #ef444433', borderRadius: 10, color: '#ef4444', fontSize: '0.875rem', display: 'flex', gap: 8 }}>
                    <AlertTriangle size={15} style={{ flexShrink: 0 }} /> {error}
                </div>
            )}

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}><Package size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} /><p>Loading orders…</p></div>
                ) : orders.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}><Package size={40} style={{ opacity: 0.1, marginBottom: '1rem' }} /><p>No orders found</p></div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-color)', borderBottom: '2px solid var(--border)' }}>
                                    {['', 'Order #', 'Customer', 'Items', 'Amount', 'Payment', 'Status', 'Date', 'Update Status'].map(h => (
                                        <th key={h} style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => {
                                    const stColor = STATUS_COLOR[order.status] || '#6b7280';
                                    return (
                                        <tr key={order.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ ...td, padding: '0.875rem 0.5rem 0.875rem 1rem' }}>
                                                <button onClick={() => setExpanded(e => ({ ...e, [order.id]: !e[order.id] }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                                    {expanded[order.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                </button>
                                            </td>
                                            <td style={td}><span style={{ fontWeight: 800 }}>#ORD-{String(order.id).padStart(4, '0')}</span></td>
                                            <td style={td}>
                                                <div style={{ fontWeight: 600 }}>{order.customer_name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.customer_email}</div>
                                            </td>
                                            <td style={td}><span style={{ fontWeight: 600 }}>{order.item_count}</span> item{order.item_count !== 1 ? 's' : ''}</td>
                                            <td style={td}><span style={{ fontWeight: 800, color: 'var(--primary)' }}>LKR {Number(order.total_amount).toLocaleString()}</span></td>
                                            <td style={td}>
                                                <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700, background: order.payment_status === 'Paid' ? '#22c55e18' : '#f59e0b18', color: order.payment_status === 'Paid' ? '#15803d' : '#b45309' }}>
                                                    {order.payment_method === 'card' ? '💳' : '💵'} {order.payment_status}
                                                </span>
                                            </td>
                                            <td style={td}>
                                                <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700, background: stColor + '18', color: stColor, border: `1px solid ${stColor}33` }}>{order.status}</span>
                                            </td>
                                            <td style={{ ...td, fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(order.created_at)}</td>
                                            <td style={td}>
                                                <select
                                                    value={order.status}
                                                    disabled={updatingId === order.id}
                                                    onChange={e => updateStatus(order.id, e.target.value)}
                                                    style={{ padding: '0.35rem 0.6rem', borderRadius: 6, border: '1.5px solid var(--border)', fontSize: '0.8rem', outline: 'none', background: '#fff', cursor: 'pointer', opacity: updatingId === order.id ? 0.5 : 1 }}>
                                                    {STATUSES.filter(s => s !== 'All').map(s => <option key={s}>{s}</option>)}
                                                </select>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.65rem', textAlign: 'right' }}>{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
        </div>
    );
};

const ghostBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.55rem 1.1rem', borderRadius: 8, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' };

export default OrderManagement;
