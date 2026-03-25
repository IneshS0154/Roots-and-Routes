import React, { useState, useEffect } from 'react';
import { RefreshCw, CreditCard, Banknote, DollarSign, AlertTriangle } from 'lucide-react';

const API = 'http://localhost:5001';

function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-LK', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const PaymentManagement = () => {
    const [payments, setPayments] = useState([]);
    const [summary, setSummary]   = useState({});
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState('');

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API}/api/admin/payments`);
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            setPayments(data.payments);
            setSummary(data.summary || {});
            setError('');
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchPayments(); }, []);

    const td = { padding: '0.875rem 1rem', fontSize: '0.875rem', verticalAlign: 'middle' };

    const statCards = [
        { label: 'Total Revenue',   value: `LKR ${Number(summary.totalRevenue || 0).toLocaleString()}`,  icon: DollarSign,  color: 'var(--primary)' },
        { label: 'Paid (Card)',      value: `LKR ${Number(summary.cardRevenue || 0).toLocaleString()}`,   icon: CreditCard,  color: '#3b82f6' },
        { label: 'Cash (COD)',       value: `LKR ${Number(summary.cashRevenue || 0).toLocaleString()}`,   icon: Banknote,    color: '#f59e0b' },
        { label: 'Pending Payments', value: `LKR ${Number(summary.unpaidRevenue || 0).toLocaleString()}`,icon: AlertTriangle,color: '#ef4444' },
    ];

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Payment Management</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>All payment transactions on the platform</p>
                </div>
                <button onClick={fetchPayments} style={ghostBtn}><RefreshCw size={15} /> Refresh</button>
            </div>

            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.85rem', marginBottom: '1.5rem' }}>
                {statCards.map((s, i) => (
                    <div key={i} className="card" style={{ borderTop: `3px solid ${s.color}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>{s.label}</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: s.color }}>{loading ? '…' : s.value}</div>
                            </div>
                            <s.icon size={22} color={s.color} style={{ opacity: 0.6 }} />
                        </div>
                    </div>
                ))}
            </div>

            {error && (
                <div style={{ padding: '0.85rem 1.25rem', marginBottom: '1rem', background: '#ef444412', border: '1px solid #ef444433', borderRadius: 10, color: '#ef4444', fontSize: '0.875rem', display: 'flex', gap: 8 }}>
                    <AlertTriangle size={15} style={{ flexShrink: 0 }} /> {error}
                </div>
            )}

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-color)', borderBottom: '2px solid var(--border)' }}>
                                {['Order #', 'Customer', 'Farmers', 'Amount', 'Method', 'Status', 'Date'].map(h => (
                                    <th key={h} style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</td></tr>
                            ) : payments.length === 0 ? (
                                <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No payment records yet</td></tr>
                            ) : payments.map((p, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-color)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <td style={td}><span style={{ fontWeight: 800, color: 'var(--primary)' }}>#ORD-{String(p.order_id).padStart(4, '0')}</span></td>
                                    <td style={td}>
                                        <div style={{ fontWeight: 600 }}>{p.customer_name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.customer_email}</div>
                                    </td>
                                    <td style={{ ...td, fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.farmers || '—'}</td>
                                    <td style={td}><span style={{ fontWeight: 800 }}>LKR {Number(p.total_amount).toLocaleString()}</span></td>
                                    <td style={td}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 700, background: p.payment_method === 'card' ? '#3b82f618' : '#f59e0b18', color: p.payment_method === 'card' ? '#1d4ed8' : '#b45309' }}>
                                            {p.payment_method === 'card' ? <CreditCard size={12} /> : <Banknote size={12} />}
                                            {p.payment_method === 'card' ? 'Card' : 'Cash on Delivery'}
                                        </span>
                                    </td>
                                    <td style={td}>
                                        <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 700, background: p.payment_status === 'Paid' ? '#22c55e18' : '#f59e0b18', color: p.payment_status === 'Paid' ? '#15803d' : '#b45309' }}>
                                            {p.payment_status}
                                        </span>
                                    </td>
                                    <td style={{ ...td, fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(p.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.65rem', textAlign: 'right' }}>{payments.length} transaction{payments.length !== 1 ? 's' : ''}</p>
        </div>
    );
};

const ghostBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.55rem 1.1rem', borderRadius: 8, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' };

export default PaymentManagement;
