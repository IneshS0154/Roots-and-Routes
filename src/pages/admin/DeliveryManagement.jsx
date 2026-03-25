import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, RefreshCw, Search, Truck, Clock, CheckCircle, Package, AlertTriangle, ChevronDown, ChevronUp, User } from 'lucide-react';

const API = 'http://localhost:5001';

const STAGES = ['Pending', 'Processing', 'Out for Delivery', 'Delivered'];

const STATUS_STYLE = {
    'Pending':          { bg: '#f59e0b18', color: '#b45309', border: '#f59e0b33', label: '⏳ Pending' },
    'Processing':       { bg: '#3b82f618', color: '#1d4ed8', border: '#3b82f633', label: '⚙️ Processing' },
    'Out for Delivery': { bg: '#8b5cf618', color: '#6d28d9', border: '#8b5cf633', label: '🚚 Out for Delivery' },
    'Delivered':        { bg: '#22c55e18', color: '#15803d', border: '#22c55e33', label: '✅ Delivered' },
    'Cancelled':        { bg: '#ef444418', color: '#b91c1c', border: '#ef444433', label: '❌ Cancelled' },
};

function StageBar({ status }) {
    const idx = STAGES.indexOf(status);
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, width: '100%', paddingTop: '0.25rem' }}>
            {STAGES.map((stage, i) => {
                const done    = i < idx;
                const current = i === idx;
                const color   = done || current ? 'var(--primary)' : '#e5e7eb';
                return (
                    <React.Fragment key={stage}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                            <div style={{
                                width: 22, height: 22, borderRadius: '50%',
                                background: done ? 'var(--primary)' : current ? 'var(--primary)' : '#e5e7eb',
                                border: `2px solid ${color}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.6rem', color: done || current ? '#fff' : '#9ca3af',
                                fontWeight: 700, flexShrink: 0,
                                boxShadow: current ? '0 0 0 4px rgba(22,163,74,0.15)' : 'none',
                                transition: 'all 0.2s',
                            }}>
                                {done ? '✓' : i + 1}
                            </div>
                            <div style={{ fontSize: '0.6rem', color: done || current ? 'var(--primary)' : '#9ca3af', fontWeight: current ? 700 : 500, marginTop: 2, textAlign: 'center', whiteSpace: 'nowrap' }}>
                                {stage}
                            </div>
                        </div>
                        {i < STAGES.length - 1 && (
                            <div style={{ flex: 1, height: 2, background: i < idx ? 'var(--primary)' : '#e5e7eb', marginBottom: '1rem', transition: 'background 0.2s' }} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-LK', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const DeliveryManagement = () => {
    const [deliveries, setDeliveries] = useState([]);
    const [stats, setStats]           = useState({});
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState('');
    const [search, setSearch]         = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [expanded, setExpanded]     = useState({});

    const fetchData = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const params = new URLSearchParams();
            if (statusFilter !== 'All') params.set('status', statusFilter);
            if (search) params.set('search', search);
            const res  = await fetch(`${API}/api/admin/deliveries?${params}`);
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            setDeliveries(data.deliveries);
            setStats(data.stats);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, [statusFilter, search]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

    const STAT_CARDS = [
        { label: 'Total Orders',      value: stats.total,            color: 'var(--primary)', icon: Package },
        { label: 'Pending',           value: stats.pending,          color: '#f59e0b',        icon: Clock },
        { label: 'Out for Delivery',  value: stats.out_for_delivery, color: '#8b5cf6',        icon: Truck },
        { label: 'Delivered',         value: stats.delivered,        color: '#22c55e',        icon: CheckCircle },
        { label: 'No Driver Assigned', value: stats.unassigned,       color: '#ef4444',        icon: AlertTriangle },
    ];

    const td = { padding: '0.85rem 1rem', verticalAlign: 'middle', fontSize: '0.85rem' };

    return (
        <div style={{ padding: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.2rem' }}>Delivery Management</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Live status of every order in the system</p>
                </div>
                <button onClick={fetchData} style={ghostBtn}><RefreshCw size={14} /> Refresh</button>
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
                {STAT_CARDS.map((s, i) => (
                    <div key={i} className="card" style={{ borderTop: `3px solid ${s.color}`, padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.1rem' }}>{s.label}</div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: s.color }}>{loading ? '…' : (s.value ?? 0)}</div>
                        </div>
                        <s.icon size={18} color={s.color} style={{ opacity: 0.35 }} />
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <form onSubmit={e => { e.preventDefault(); setSearch(searchInput); }} style={{ display: 'flex', position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search by order, customer, driver…"
                        style={{ padding: '0.55rem 0.85rem 0.55rem 2.25rem', borderRadius: '8px 0 0 8px', border: '1.5px solid var(--border)', fontSize: '0.875rem', outline: 'none', width: '260px' }} />
                    <button type="submit" style={{ padding: '0.55rem 0.9rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '0 8px 8px 0', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>Search</button>
                </form>

                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {['All', ...STAGES, 'Cancelled'].map(s => (
                        <button key={s} onClick={() => setStatusFilter(s)}
                            style={{ padding: '0.4rem 0.85rem', borderRadius: 99, border: `1.5px solid ${statusFilter === s ? 'var(--primary)' : 'var(--border)'}`, background: statusFilter === s ? 'var(--primary)' : '#fff', color: statusFilter === s ? '#fff' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', background: '#ef444412', border: '1px solid #ef444430', borderRadius: 8, color: '#ef4444', fontSize: '0.83rem', display: 'flex', gap: 6 }}>
                    <AlertTriangle size={14} /> {error}
                </div>
            )}

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-color)', borderBottom: '2px solid var(--border)' }}>
                                {['Order', 'Customer', 'Driver', 'City', 'Items', 'Amount', 'Status', 'Date', ''].map(h => (
                                    <th key={h} style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading deliveries…</td></tr>
                            ) : deliveries.length === 0 ? (
                                <tr><td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No deliveries found</td></tr>
                            ) : deliveries.map(d => {
                                const ss = STATUS_STYLE[d.status] || STATUS_STYLE['Pending'];
                                const isOpen = expanded[d.order_id];
                                return (
                                    <React.Fragment key={d.order_id}>
                                        <tr style={{ borderBottom: isOpen ? 'none' : '1px solid var(--border)', cursor: 'pointer', background: isOpen ? '#f8fdf8' : 'transparent' }}
                                            onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = 'var(--bg-color)'; }}
                                            onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent'; }}
                                            onClick={() => toggleExpand(d.order_id)}>
                                            <td style={{ ...td, fontWeight: 700 }}>
                                                #ORD-{String(d.order_id).padStart(4, '0')}
                                            </td>
                                            <td style={td}>
                                                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{d.customer_name}</div>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{d.customer_email}</div>
                                            </td>
                                            <td style={td}>
                                                {d.driver_name ? (
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <User size={12} /> {d.driver_name}
                                                        </div>
                                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{d.driver_phone || ''}</div>
                                                    </div>
                                                ) : (
                                                    <span style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 700 }}>⚠️ Unassigned</span>
                                                )}
                                            </td>
                                            <td style={{ ...td, fontSize: '0.8rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                                    <MapPin size={11} color="var(--primary)" />
                                                    {d.customer_city || '—'}
                                                </div>
                                            </td>
                                            <td style={{ ...td, textAlign: 'center', fontWeight: 700, color: 'var(--primary)' }}>{d.item_count}</td>
                                            <td style={{ ...td, fontWeight: 700 }}>LKR {Number(d.total_amount).toLocaleString()}</td>
                                            <td style={td}>
                                                <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, whiteSpace: 'nowrap' }}>
                                                    {ss.label}
                                                </span>
                                            </td>
                                            <td style={{ ...td, fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(d.created_at)}</td>
                                            <td style={{ ...td, width: 32 }}>
                                                {isOpen ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                                            </td>
                                        </tr>

                                        {/* Expanded detail row */}
                                        {isOpen && (
                                            <tr style={{ borderBottom: '1px solid var(--border)', background: '#f8fdf8' }}>
                                                <td colSpan={9} style={{ padding: '1rem 1.5rem 1.5rem' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
                                                        {/* Stage progress bar */}
                                                        <div>
                                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.6rem' }}>Delivery Progress</div>
                                                            <StageBar status={d.status} />
                                                        </div>

                                                        {/* Delivery info */}
                                                        <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Details</div>
                                                            <div><strong>Address:</strong> <span style={{ color: 'var(--text-muted)' }}>{d.delivery_address || '—'}</span></div>
                                                            <div><strong>Payment:</strong> <span style={{ color: 'var(--text-muted)' }}>{d.payment_method === 'card' ? '💳 Card' : '💵 Cash'} · {d.payment_status}</span></div>
                                                            {d.driver_name && <div><strong>Driver:</strong> <span style={{ color: 'var(--text-muted)' }}>{d.driver_name} ({d.driver_city}){d.driver_phone ? ` — ${d.driver_phone}` : ''}</span></div>}
                                                            {!d.driver_name && <div style={{ color: '#ef4444', fontWeight: 600 }}>⚠️ No driver assigned — order may not be delivered</div>}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {!loading && deliveries.length > 0 && (
                    <div style={{ padding: '0.6rem 1rem', borderTop: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {deliveries.length} order{deliveries.length !== 1 ? 's' : ''} shown
                    </div>
                )}
            </div>
        </div>
    );
};

const ghostBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.55rem 1.1rem', borderRadius: 8, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' };

export default DeliveryManagement;
