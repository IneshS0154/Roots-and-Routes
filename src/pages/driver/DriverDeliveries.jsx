import React, { useState, useEffect, useCallback } from 'react';
import {
    Truck, Package, CheckCircle, Clock, MapPin, Phone,
    RefreshCw, AlertTriangle, Navigation, ChevronDown, ChevronUp, User
} from 'lucide-react';
import { getUser } from '../../utils/userSession';

const API = 'http://localhost:5001';

const STATUSES = ['Pending', 'Processing', 'Out for Delivery', 'Delivered', 'Cancelled'];

const STATUS_CONFIG = {
    Pending:           { color: '#f59e0b', bg: '#fef3c7', label: 'Pending',           icon: Clock },
    Processing:        { color: '#3b82f6', bg: '#dbeafe', label: 'Processing',        icon: Package },
    'Out for Delivery':{ color: '#8b5cf6', bg: '#ede9fe', label: 'Out for Delivery', icon: Navigation },
    Delivered:         { color: '#22c55e', bg: '#dcfce7', label: 'Delivered',         icon: CheckCircle },
    Cancelled:         { color: '#ef4444', bg: '#fee2e2', label: 'Cancelled',         icon: AlertTriangle },
};

function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-LK', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const DriverDeliveries = () => {
    const user = getUser();
    const [orders, setOrders]     = useState([]);
    const [stats, setStats]       = useState({});
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState('');
    const [expanded, setExpanded] = useState({});
    const [updating, setUpdating] = useState(null);
    const [statusFilter, setFilter] = useState('All');

    const fetchOrders = useCallback(async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const res = await fetch(`${API}/api/driver/orders?driver_id=${user.id}`);
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            setOrders(data.orders);
            setStats(data.stats || {});
            setError('');
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, [user?.id]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const updateStatus = async (orderId, newStatus) => {
        setUpdating(orderId);
        try {
            const res = await fetch(`${API}/api/driver/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus, driver_id: user?.id }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        } catch (err) { setError(err.message); }
        finally { setUpdating(null); }
    };

    const filtered = statusFilter === 'All' ? orders : orders.filter(o => o.status === statusFilter);

    const td = { padding: '0.875rem 1rem', fontSize: '0.875rem', verticalAlign: 'middle' };

    return (
        <div style={{ padding: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
                        <Truck size={26} color="var(--primary)" /> My Deliveries
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                        Orders assigned to you in {user?.city ? <strong>{user.city}</strong> : 'your area'}
                    </p>
                </div>
                <button onClick={fetchOrders} style={ghostBtn}><RefreshCw size={15} /> Refresh</button>
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.85rem', marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total Assigned', value: stats.total || 0,          color: 'var(--primary)', icon: Package },
                    { label: 'Pending',         value: stats.pending || 0,        color: '#f59e0b',        icon: Clock },
                    { label: 'Out for Delivery',value: stats.outForDelivery || 0, color: '#8b5cf6',        icon: Navigation },
                    { label: 'Delivered',       value: stats.delivered || 0,      color: '#22c55e',        icon: CheckCircle },
                ].map((s, i) => (
                    <div key={i} className="card" style={{ borderTop: `3px solid ${s.color}`, padding: '1.1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.2rem' }}>{s.label}</div>
                                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: s.color }}>{loading ? '…' : s.value}</div>
                            </div>
                            <s.icon size={20} color={s.color} style={{ opacity: 0.5, marginTop: 2 }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                {['All', ...STATUSES].map(s => {
                    const cfg = STATUS_CONFIG[s] || {};
                    return (
                        <button key={s} onClick={() => setFilter(s)}
                            style={{ padding: '0.4rem 1rem', borderRadius: 99, border: `1.5px solid ${statusFilter === s ? (cfg.color || 'var(--primary)') : 'var(--border)'}`, background: statusFilter === s ? (cfg.bg || 'var(--primary)18') : '#fff', color: statusFilter === s ? (cfg.color || 'var(--primary)') : 'var(--text-muted)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.15s' }}>
                            {s}
                        </button>
                    );
                })}
            </div>

            {error && (
                <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', background: '#ef444412', border: '1px solid #ef444430', borderRadius: 8, color: '#ef4444', fontSize: '0.83rem', display: 'flex', gap: 6 }}>
                    <AlertTriangle size={14} style={{ flexShrink: 0 }} /> {error}
                </div>
            )}

            {/* Orders */}
            {loading ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Truck size={40} style={{ opacity: 0.15, marginBottom: '1rem' }} />
                    <p>Loading deliveries…</p>
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Package size={52} style={{ opacity: 0.1, marginBottom: '1.25rem' }} />
                    <h3 style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                        {statusFilter === 'All' ? 'No deliveries assigned yet' : `No ${statusFilter} orders`}
                    </h3>
                    <p style={{ fontSize: '0.88rem' }}>Orders from customers in your city will appear here.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {filtered.map(order => {
                        const cfg = STATUS_CONFIG[order.status] || { color: '#6b7280', bg: '#f3f4f6' };
                        const Icon = cfg.icon || Package;
                        return (
                            <div key={order.id} className="card" style={{ padding: 0, overflow: 'hidden', border: `1.5px solid ${expanded[order.id] ? cfg.color + '44' : 'var(--border)'}` }}>
                                {/* Header */}
                                <div onClick={() => setExpanded(e => ({ ...e, [order.id]: !e[order.id] }))}
                                    style={{ padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Icon size={18} color={cfg.color} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                #ORD-{String(order.id).padStart(4,'0')}
                                                <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700, background: cfg.bg, color: cfg.color }}>{order.status}</span>
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: 2 }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><User size={11} />{order.customer_name}</span>
                                                {order.city && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={11} />{order.city}</span>}
                                                <span>📦 {order.item_count} item{order.item_count !== 1 ? 's' : ''}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--primary)' }}>LKR {Number(order.total_amount).toLocaleString()}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{fmtDate(order.created_at)}</div>
                                        </div>
                                        {expanded[order.id] ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                                    </div>
                                </div>

                                {/* Expanded detail */}
                                {expanded[order.id] && (
                                    <div style={{ borderTop: '1px solid var(--border)', padding: '1.1rem 1.25rem', background: 'var(--bg-color)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                        {/* Delivery info */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                            <div style={{ padding: '0.75rem', background: '#fff', borderRadius: 10, border: '1px solid var(--border)' }}>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.3rem' }}>Customer</div>
                                                <div style={{ fontWeight: 700 }}>{order.customer_name}</div>
                                                {order.customer_phone && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}><Phone size={11} />{order.customer_phone}</div>}
                                            </div>
                                            <div style={{ padding: '0.75rem', background: '#fff', borderRadius: 10, border: '1px solid var(--border)' }}>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.3rem' }}>Delivery Address</div>
                                                <div style={{ fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                                                    <MapPin size={13} style={{ flexShrink: 0, marginTop: 2, color: 'var(--primary)' }} />
                                                    {order.delivery_address || '—'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Payment info */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem' }}>
                                            <span style={{ fontWeight: 600 }}>Payment:</span>
                                            <span style={{ padding: '2px 9px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 700, background: order.payment_status === 'Paid' ? '#22c55e18' : '#f59e0b18', color: order.payment_status === 'Paid' ? '#15803d' : '#b45309' }}>
                                                {order.payment_method === 'card' ? '💳' : '💵'} {order.payment_status}
                                            </span>
                                            <span style={{ color: 'var(--text-muted)' }}>
                                                {order.payment_method === 'cash' && order.payment_status === 'Unpaid' ? '⚠️ Collect cash on delivery' : ''}
                                            </span>
                                        </div>

                                        {/* Status update */}
                                        {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>Update Status:</span>
                                                {STATUSES.filter(s => s !== 'Cancelled').map(s => {
                                                    const sCfg = STATUS_CONFIG[s] || {};
                                                    const isCurrent = order.status === s;
                                                    return (
                                                        <button key={s} disabled={isCurrent || updating === order.id}
                                                            onClick={() => updateStatus(order.id, s)}
                                                            style={{ padding: '0.45rem 1rem', borderRadius: 9, border: `1.5px solid ${isCurrent ? sCfg.color : 'var(--border)'}`, background: isCurrent ? sCfg.bg : '#fff', color: isCurrent ? sCfg.color : 'var(--text-muted)', fontWeight: 700, fontSize: '0.8rem', cursor: isCurrent ? 'default' : 'pointer', opacity: updating === order.id ? 0.5 : 1, transition: 'all 0.15s' }}>
                                                            {isCurrent ? '✓ ' : ''}{s}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {(order.status === 'Delivered' || order.status === 'Cancelled') && (
                                            <div style={{ fontSize: '0.82rem', color: order.status === 'Delivered' ? '#15803d' : '#ef4444', fontWeight: 600 }}>
                                                {order.status === 'Delivered' ? '✅ Delivery completed' : '❌ Order cancelled'}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.75rem', textAlign: 'right' }}>
                {filtered.length} of {orders.length} order{orders.length !== 1 ? 's' : ''} shown
            </p>
        </div>
    );
};

const ghostBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.55rem 1.1rem', borderRadius: 8, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' };

export default DriverDeliveries;
