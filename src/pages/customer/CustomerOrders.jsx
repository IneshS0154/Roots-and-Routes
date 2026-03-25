import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, RefreshCw, ShoppingBag, ChevronDown, ChevronUp, AlertTriangle, MapPin, Truck, Star } from 'lucide-react';
import { getUser } from '../../utils/userSession';
import ReviewModal from '../../components/ReviewModal';

const API = 'http://localhost:5001';

const TRACK_STEPS = ['Pending', 'Processing', 'Out for Delivery', 'Delivered'];
const TRACK_ICONS = ['🕐', '📦', '🚚', '✅'];

const STATUS_STYLES = {
    Pending:           { bg: '#f59e0b18', color: '#b45309', border: '#f59e0b33', step: 0 },
    Processing:        { bg: '#3b82f618', color: '#1d4ed8', border: '#3b82f633', step: 1 },
    'Out for Delivery':{ bg: '#8b5cf618', color: '#6d28d9', border: '#8b5cf633', step: 2 },
    Delivered:         { bg: '#22c55e18', color: '#15803d', border: '#22c55e33', step: 3 },
    Cancelled:         { bg: '#ef444418', color: '#b91c1c', border: '#ef444433', step: -1 },
};
const PAYMENT_STYLE = {
    Paid:   { bg: '#22c55e18', color: '#15803d', border: '#22c55e33' },
    Unpaid: { bg: '#f59e0b18', color: '#b45309', border: '#f59e0b33' },
};

/** Visual progress stepper */
function OrderStepper({ status }) {
    const currentStep = STATUS_STYLES[status]?.step ?? 0;
    if (status === 'Cancelled') {
        return <div style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 700, padding: '0.6rem 0' }}>❌ Order Cancelled</div>;
    }
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, margin: '0.75rem 0', overflowX: 'auto' }}>
            {TRACK_STEPS.map((step, i) => {
                const done = i <= currentStep;
                const active = i === currentStep;
                return (
                    <React.Fragment key={step}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 72, flexShrink: 0 }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1rem', border: `2px solid ${done ? '#22c55e' : 'var(--border)'}`,
                                background: done ? '#22c55e' : '#fff',
                                boxShadow: active ? '0 0 0 4px #22c55e22' : 'none',
                                transition: 'all 0.3s',
                            }}>
                                {done ? (active && currentStep < 3 ? TRACK_ICONS[i] : '✓') : TRACK_ICONS[i]}
                            </div>
                            <div style={{ fontSize: '0.65rem', fontWeight: active ? 800 : 500, color: done ? '#15803d' : '#9ca3af', marginTop: '0.3rem', textAlign: 'center', lineHeight: 1.2 }}>
                                {step}
                            </div>
                        </div>
                        {i < TRACK_STEPS.length - 1 && (
                            <div style={{ flex: 1, height: 3, background: i < currentStep ? '#22c55e' : 'var(--border)', minWidth: 20, transition: 'background 0.3s', borderRadius: 2 }} />
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


const CustomerOrders = () => {
    const user = getUser();
    const navigate = useNavigate();
    const [orders, setOrders]     = useState([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState('');
    const [expanded, setExpanded] = useState({});
    const [reviewOrder, setReviewOrder] = useState(null);

    const fetchOrders = useCallback(async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const res = await fetch(`${API}/api/customer/orders?customer_id=${user.id}`);
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            setOrders(data.orders);
            setError('');
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, [user?.id]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', flexDirection: 'column', gap: '1rem', color: 'var(--text-muted)' }}>
            <Package size={40} style={{ opacity: 0.2 }} />
            <p>Loading your orders…</p>
        </div>
    );

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
                        <ShoppingBag size={26} color="var(--primary)" /> My Orders
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Track all your purchases</p>
                </div>
                <button onClick={fetchOrders} style={ghostBtn}><RefreshCw size={15} /> Refresh</button>
            </div>

            {error && (
                <div style={{ padding: '0.85rem 1.25rem', marginBottom: '1.5rem', background: '#ef444418', border: '1px solid #ef444433', borderRadius: 10, color: '#ef4444', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={16} /> {error}
                </div>
            )}

            {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-muted)' }}>
                    <Package size={56} style={{ opacity: 0.12, marginBottom: '1.25rem' }} />
                    <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>No orders yet</h3>
                    <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Browse products and place your first order!</p>
                    <button onClick={() => navigate('/customer/products')} style={primaryBtn}>Browse Products →</button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {orders.map(order => {
                        const st = STATUS_STYLES[order.status] || {};
                        const pt = PAYMENT_STYLE[order.payment_status] || {};
                        return (
                            <div key={order.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                {/* Header row */}
                                <div
                                    onClick={() => toggle(order.id)}
                                    style={{ padding: '1.15rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                        <span style={{ fontWeight: 800, fontSize: '1rem' }}>
                                            #ORD-{String(order.id).padStart(4, '0')}
                                        </span>
                                        <span style={{ ...badge(st), padding: '3px 10px' }}>{order.status}</span>
                                        <span style={{ ...badge(pt), padding: '3px 10px' }}>{order.payment_method === 'card' ? '💳' : '💵'} {order.payment_status}</span>
                                        {order.status === 'Delivered' && (
                                            <button onClick={e => { e.stopPropagation(); setReviewOrder(order.id); }}
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 99, border: '1.5px solid #f59e0b44', background: '#fef3c7', color: '#b45309', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
                                                <Star size={11} fill="#f59e0b" color="#f59e0b" /> Leave Reviews
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{fmtDate(order.created_at)}</div>
                                            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary)' }}>LKR {Number(order.total_amount).toLocaleString()}</div>
                                        </div>
                                        {expanded[order.id] ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
                                    </div>
                                </div>

                                {/* Expanded items */}
                                {expanded[order.id] && (
                                    <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.5rem', background: 'var(--bg-color)' }}>
                                        {/* Tracking stepper */}
                                        <div style={{ marginBottom: '1rem' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                                                📍 Order Tracking
                                            </div>
                                            <OrderStepper status={order.status} />
                                        </div>

                                        {/* Driver note */}
                                        {order.status !== 'Cancelled' && (
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: '0.85rem', padding: '0.5rem 0.75rem', background: '#fff', borderRadius: 8, border: '1px solid var(--border)' }}>
                                                <Truck size={13} color="var(--primary)" />
                                                {order.status === 'Out for Delivery'
                                                    ? <span><strong>Your order is on the way!</strong> Your delivery driver is en route to your address.</span>
                                                    : order.status === 'Delivered'
                                                        ? <span><strong>Delivered!</strong> Your order has been successfully delivered.</span>
                                                        : <span>A local delivery driver has been assigned and will pick up your order soon.</span>
                                                }
                                            </div>
                                        )}

                                        {order.delivery_address && (
                                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <MapPin size={12} /> {order.delivery_address}
                                            </p>
                                        )}
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                                    {['Product', 'Farmer', 'Qty', 'Unit Price', 'Subtotal'].map(h => (
                                                        <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {order.items?.map((item, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                                        <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>{item.product_name}</td>
                                                        <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>{item.farmer_name}</td>
                                                        <td style={{ padding: '0.6rem 0.75rem' }}>{item.quantity} {item.unit}</td>
                                                        <td style={{ padding: '0.6rem 0.75rem' }}>LKR {Number(item.unit_price).toLocaleString()}</td>
                                                        <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: 'var(--primary)' }}>LKR {Number(item.subtotal).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                            </div>
                        );
                    })}
                </div>
            )}

            {reviewOrder && (
                <ReviewModal
                    orderId={reviewOrder}
                    customerId={user?.id}
                    onClose={() => setReviewOrder(null)}
                    onDone={fetchOrders}
                />
            )}
        </div>
    );
};

function badge(st) {
    return { display: 'inline-flex', alignItems: 'center', fontWeight: 700, fontSize: '0.75rem', borderRadius: 99, background: st.bg, color: st.color, border: `1px solid ${st.border}` };
}
const primaryBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.7rem 1.4rem', borderRadius: 9, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' };
const ghostBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.55rem 1.1rem', borderRadius: 8, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' };

export default CustomerOrders;
