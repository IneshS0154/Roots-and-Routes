import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CreditCard, Banknote, CheckCircle, AlertTriangle,
    Lock, ArrowLeft, ShoppingBag, Leaf
} from 'lucide-react';
import { getCart, getCartTotal, clearCart } from '../../utils/cartUtils';
import { getUser } from '../../utils/userSession';
import { generateReceipt } from '../../utils/receiptPdf';

const API = 'http://localhost:5001';
const DELIVERY_FEE = 150;

/* ─── Card validation helpers ─────────────────────────────────────────────── */
const luhn = (n) => {
    let sum = 0;
    let isEven = false;
    for (let i = n.length - 1; i >= 0; i--) {
        let d = parseInt(n[i]);
        if (isEven) { d *= 2; if (d > 9) d -= 9; }
        sum += d;
        isEven = !isEven;
    }
    return sum % 10 === 0;
};
const fmtCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
const fmtExpiry = (v) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

/* ─── Card validation ─────────────────────────────────────────────────────── */
function validateCard(card) {
    const errs = {};
    const num = card.number.replace(/\s/g, '');
    if (num.length < 16) errs.number = 'Enter a valid 16-digit card number';
    else if (!luhn(num)) errs.number = 'Invalid card number';
    if (!card.name.trim()) errs.name = 'Cardholder name is required';
    const [m, y] = (card.expiry || '').split('/');
    const now = new Date();
    const expDate = new Date(2000 + parseInt(y || 0), parseInt(m || 0) - 1, 1);
    if (!m || !y || m < 1 || m > 12) errs.expiry = 'Invalid expiry (MM/YY)';
    else if (expDate < now) errs.expiry = 'Card has expired';
    if (!/^\d{3,4}$/.test(card.cvv)) errs.cvv = 'Enter 3 or 4 digit CVV';
    return errs;
}

/* ─── Main Component ──────────────────────────────────────────────────────── */
const CustomerCheckout = () => {
    const navigate = useNavigate();
    const user = getUser();
    const cart = getCart();
    const subtotal = getCartTotal();
    const grandTotal = subtotal + DELIVERY_FEE;

    const [payMethod, setPayMethod] = useState('cash'); // 'cash' | 'card'
    const [address, setAddress]     = useState('');
    const [notes, setNotes]         = useState('');
    const [card, setCard]           = useState({ number: '', name: '', expiry: '', cvv: '' });
    const [cardErrors, setCardErrors] = useState({});
    const [cvvVisible, setCvvVisible] = useState(false);

    const [placing, setPlacing]  = useState(false);
    const [success, setSuccess]  = useState(null); // { orderId, total, items, address, paymentMethod }
    const [orderError, setOrderError] = useState('');

    if (cart.length === 0 && !success) {
        navigate('/customer/cart');
        return null;
    }

    /* ── Card input handlers ── */
    const handleCardChange = (field, rawVal) => {
        let val = rawVal;
        if (field === 'number') val = fmtCard(rawVal);
        if (field === 'expiry') val = fmtExpiry(rawVal);
        if (field === 'cvv') val = rawVal.replace(/\D/g, '').slice(0, 4);
        setCard(c => ({ ...c, [field]: val }));
        setCardErrors(e => ({ ...e, [field]: '' }));
    };

    /* ── Place order ── */
    const handlePlaceOrder = async () => {
        if (!address.trim()) { setOrderError('Please enter a delivery address.'); return; }
        if (payMethod === 'card') {
            const errs = validateCard(card);
            if (Object.keys(errs).length) { setCardErrors(errs); return; }
        }
        setOrderError('');
        setPlacing(true);
        try {
            const cartSnapshot = [...cart]; // capture before clearing
            const items = cart.map(i => ({
                product_id: i.product_id,
                farmer_id: i.farmer_id,
                quantity: i.quantity,
                unit_price: i.price,
            }));
            const res = await fetch(`${API}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customer_id: user?.id, items, payment_method: payMethod, delivery_address: address, notes }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message || 'Order failed');
            clearCart();
            setSuccess({ orderId: data.orderId, total: data.total, items: cartSnapshot, address, paymentMethod: payMethod });
        } catch (err) {
            setOrderError(err.message);
        } finally {
            setPlacing(false);
        }
    };

    /* ── Success screen ── */
    if (success) return (
        <div style={{ maxWidth: 520, margin: '5rem auto', padding: '2rem', textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#22c55e18', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <CheckCircle size={44} color="#22c55e" />
            </div>
            <h1 style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Order Placed! 🎉</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Thank you for your purchase, <strong>{user?.name?.split(' ')[0]}</strong>!
            </p>
            <div style={{ padding: '1rem 1.5rem', borderRadius: 12, background: 'var(--bg-color)', border: '1px solid var(--border)', margin: '1.5rem 0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Order ID</div>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>#ORD-{String(success.orderId).padStart(4, '0')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Paid</div>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary)' }}>LKR {Number(success.total).toLocaleString()}</div>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                    onClick={() => generateReceipt({
                        orderId: success.orderId,
                        customer: user,
                        items: (success.items || []).map(i => ({ ...i, price: i.price, unit_price: i.price })),
                        paymentMethod: success.paymentMethod,
                        deliveryAddress: success.address,
                        total: Number(success.total),
                        deliveryFee: 150,
                        date: new Date().toISOString(),
                    })}
                    style={{ ...primaryBtn, background: '#16a34a' }}>
                    📄 Download Receipt
                </button>
                <button onClick={() => navigate('/customer/orders')} style={primaryBtn}>
                    <ShoppingBag size={16} /> My Orders
                </button>
                <button onClick={() => navigate('/customer/products')} style={ghostBtn}>
                    Continue Shopping
                </button>
            </div>
        </div>
    );

    return (
        <div style={{ maxWidth: '1050px', margin: '0 auto', padding: '2rem' }}>
            {/* Back */}
            <button onClick={() => navigate('/customer/cart')} style={{ ...ghostBtn, marginBottom: '1.5rem' }}>
                <ArrowLeft size={15} /> Back to Cart
            </button>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Lock size={22} color="var(--primary)" /> Checkout
            </h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem', alignItems: 'start' }}>
                {/* ── Left: form ────────────────────────────────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Delivery */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>📦 Delivery Details</h3>
                        <label style={labelStyle}>Delivery Address *</label>
                        <textarea
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            placeholder="No. 12, Main Street, Colombo 03, Sri Lanka"
                            rows={3}
                            style={{ ...inputStyle, resize: 'vertical', marginBottom: '1rem' }}
                        />
                        <label style={labelStyle}>Order Notes (optional)</label>
                        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Call before delivery" style={inputStyle} />
                    </div>

                    {/* Payment method */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '1rem' }}>💳 Payment Method</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: payMethod === 'card' ? '1.25rem' : 0 }}>
                            {[
                                { val: 'cash', icon: Banknote, label: 'Cash on Delivery', sub: 'Pay when delivered' },
                                { val: 'card', icon: CreditCard, label: 'Credit / Debit Card', sub: 'Instant payment' },
                            ].map(({ val, icon: Icon, label, sub }) => (
                                <button
                                    key={val}
                                    onClick={() => { setPayMethod(val); setCardErrors({}); }}
                                    style={{
                                        padding: '1rem', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                                        border: `2px solid ${payMethod === val ? 'var(--primary)' : 'var(--border)'}`,
                                        background: payMethod === val ? 'var(--primary)0a' : '#fff',
                                        transition: 'all 0.2s',
                                    }}>
                                    <Icon size={22} color={payMethod === val ? 'var(--primary)' : 'var(--text-muted)'} style={{ marginBottom: '0.5rem' }} />
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: payMethod === val ? 'var(--primary)' : 'var(--text-main)' }}>{label}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub}</div>
                                </button>
                            ))}
                        </div>

                        {/* Card form */}
                        {payMethod === 'card' && (
                            <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem', background: '#fafafa' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '1rem', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                    <Lock size={12} /> Secure demo card verification
                                </div>
                                <div style={{ display: 'grid', gap: '0.85rem' }}>
                                    <div>
                                        <label style={labelStyle}>Card Number</label>
                                        <input
                                            value={card.number}
                                            onChange={e => handleCardChange('number', e.target.value)}
                                            placeholder="4242 4242 4242 4242"
                                            maxLength={19}
                                            style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '0.08em', borderColor: cardErrors.number ? '#ef4444' : undefined }}
                                        />
                                        {cardErrors.number && <p style={errText}>{cardErrors.number}</p>}
                                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Demo: use 4242 4242 4242 4242</p>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Cardholder Name</label>
                                        <input value={card.name} onChange={e => handleCardChange('name', e.target.value)} placeholder="John Silva" style={{ ...inputStyle, borderColor: cardErrors.name ? '#ef4444' : undefined }} />
                                        {cardErrors.name && <p style={errText}>{cardErrors.name}</p>}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                        <div>
                                            <label style={labelStyle}>Expiry (MM/YY)</label>
                                            <input value={card.expiry} onChange={e => handleCardChange('expiry', e.target.value)} placeholder="12/29" maxLength={5} style={{ ...inputStyle, borderColor: cardErrors.expiry ? '#ef4444' : undefined }} />
                                            {cardErrors.expiry && <p style={errText}>{cardErrors.expiry}</p>}
                                        </div>
                                        <div>
                                            <label style={labelStyle}>CVV</label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type={cvvVisible ? 'text' : 'password'}
                                                    value={card.cvv}
                                                    onChange={e => handleCardChange('cvv', e.target.value)}
                                                    placeholder="•••"
                                                    maxLength={4}
                                                    style={{ ...inputStyle, paddingRight: '2.5rem', borderColor: cardErrors.cvv ? '#ef4444' : undefined }}
                                                />
                                                <button type="button" onClick={() => setCvvVisible(v => !v)} style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600 }}>
                                                    {cvvVisible ? 'HIDE' : 'SHOW'}
                                                </button>
                                            </div>
                                            {cardErrors.cvv && <p style={errText}>{cardErrors.cvv}</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right: summary ────────────────────────────────────── */}
                <div style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '1rem' }}>Order Summary</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1rem' }}>
                            {cart.map(item => (
                                <div key={item.product_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', gap: '0.5rem' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                        {item.is_organic && <Leaf size={11} color="#16a34a" />}
                                        <span>{item.name} × {item.quantity} {item.unit}</span>
                                    </span>
                                    <span style={{ fontWeight: 600, flexShrink: 0 }}>LKR {(item.price * item.quantity).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={rowStyle}><span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Subtotal</span><span style={{ fontWeight: 600 }}>LKR {subtotal.toLocaleString()}</span></div>
                            <div style={rowStyle}><span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Delivery</span><span style={{ fontWeight: 600 }}>LKR {DELIVERY_FEE}</span></div>
                            <div style={{ ...rowStyle, borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                                <span style={{ fontWeight: 800 }}>Total</span>
                                <span style={{ fontWeight: 900, fontSize: '1.25rem', color: 'var(--primary)' }}>LKR {grandTotal.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {orderError && (
                        <div style={{ padding: '0.75rem 1rem', background: '#ef444415', border: '1px solid #ef444433', borderRadius: 10, color: '#ef4444', fontSize: '0.85rem', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                            <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} /> {orderError}
                        </div>
                    )}

                    <button
                        onClick={handlePlaceOrder}
                        disabled={placing}
                        style={{ ...primaryBtn, width: '100%', justifyContent: 'center', padding: '1rem', fontSize: '1.05rem', opacity: placing ? 0.7 : 1 }}>
                        {placing ? 'Placing order…' : payMethod === 'card' ? '🔒 Pay & Place Order' : '✅ Place Order'}
                    </button>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        <Lock size={10} /> Your information is secure and encrypted
                    </p>
                </div>
            </div>
        </div>
    );
};

const primaryBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.75rem 1.5rem', borderRadius: 10, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer' };
const ghostBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.55rem 1.1rem', borderRadius: 8, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' };
const inputStyle = { width: '100%', padding: '0.65rem 0.85rem', borderRadius: 8, border: '1.5px solid var(--border)', background: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', color: 'var(--text-main)' };
const labelStyle = { display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' };
const rowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const errText = { color: '#ef4444', fontSize: '0.77rem', marginTop: '0.25rem', fontWeight: 600 };

export default CustomerCheckout;
