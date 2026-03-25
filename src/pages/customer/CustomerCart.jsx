import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Package, Leaf } from 'lucide-react';
import { getCart, updateCartItem, removeFromCart, getCartTotal, clearCart } from '../../utils/cartUtils';

const CAT_EMOJI = { Vegetables: '🥦', Fruits: '🍎', Grains: '🌾', Dairy: '🥛', Herbs: '🌿', Other: '📦' };

const CustomerCart = () => {
    const navigate = useNavigate();
    const [cart, setCart] = useState(getCart());

    const refresh = () => setCart(getCart());

    const handleQty = (productId, qty) => { updateCartItem(productId, qty); refresh(); };
    const handleRemove = (productId) => { removeFromCart(productId); refresh(); };

    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const deliveryFee = cart.length > 0 ? 150 : 0;
    const grandTotal = total + deliveryFee;

    if (cart.length === 0) return (
        <div style={{ maxWidth: 700, margin: '6rem auto', padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <ShoppingCart size={64} style={{ opacity: 0.12, marginBottom: '1.5rem' }} />
            <h2 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Your cart is empty</h2>
            <p style={{ marginBottom: '2rem', fontSize: '0.95rem' }}>Discover fresh products from local farmers.</p>
            <Link to="/customer/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.8rem 1.8rem', borderRadius: 10, background: 'var(--primary)', color: '#fff', fontWeight: 700, textDecoration: 'none', fontSize: '0.95rem' }}>
                Browse Products <ArrowRight size={16} />
            </Link>
        </div>
    );

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem' }}>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <ShoppingCart size={26} color="var(--primary)" /> Shopping Cart
                <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: 4 }}>({cart.length} item{cart.length !== 1 ? 's' : ''})</span>
            </h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem', alignItems: 'start' }}>
                {/* ── Items ─────────────────────────────────────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {cart.map(item => (
                        <div key={item.product_id} className="card" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', padding: '1.25rem' }}>
                            {/* Thumbnail */}
                            <div style={{ width: 72, height: 72, borderRadius: 12, background: 'var(--primary)15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0 }}>
                                {CAT_EMOJI[item.category] || '📦'}
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>{item.name}</span>
                                    {item.is_organic && <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: '#16a34a18', color: '#16a34a', display: 'flex', alignItems: 'center', gap: 3 }}><Leaf size={9} /> Organic</span>}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>🌾 {item.farmer_name}</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 700 }}>
                                    LKR {item.price.toLocaleString()}/{item.unit}
                                </div>
                            </div>

                            {/* Qty stepper */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                                <button onClick={() => handleQty(item.product_id, item.quantity - 1)} style={qtyBtn}><Minus size={14} /></button>
                                <span style={{ minWidth: 28, textAlign: 'center', fontWeight: 700, fontSize: '1rem' }}>{item.quantity}</span>
                                <button onClick={() => handleQty(item.product_id, item.quantity + 1)} disabled={item.quantity >= item.maxQty} style={{ ...qtyBtn, opacity: item.quantity >= item.maxQty ? 0.4 : 1 }}><Plus size={14} /></button>
                            </div>

                            {/* Subtotal */}
                            <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 100 }}>
                                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary)' }}>LKR {(item.price * item.quantity).toLocaleString()}</div>
                                <button onClick={() => handleRemove(item.product_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', marginTop: '0.5rem', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <Trash2 size={12} /> Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Summary panel ─────────────────────────────────────── */}
                <div className="card" style={{ padding: '1.5rem', position: 'sticky', top: '80px' }}>
                    <h3 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '1.25rem' }}>Order Summary</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div style={rowStyle}><span style={{ color: 'var(--text-muted)' }}>Subtotal</span><span style={{ fontWeight: 600 }}>LKR {total.toLocaleString()}</span></div>
                        <div style={rowStyle}><span style={{ color: 'var(--text-muted)' }}>Delivery fee</span><span style={{ fontWeight: 600 }}>LKR {deliveryFee}</span></div>
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', ...rowStyle }}>
                            <span style={{ fontWeight: 800 }}>Total</span>
                            <span style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--primary)' }}>LKR {grandTotal.toLocaleString()}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/customer/checkout')}
                        style={{ width: '100%', padding: '0.9rem', borderRadius: 10, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        Proceed to Checkout <ArrowRight size={18} />
                    </button>
                    <Link to="/customer/products" style={{ display: 'block', textAlign: 'center', marginTop: '0.85rem', color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600 }}>
                        ← Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    );
};

const qtyBtn = { width: 32, height: 32, borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' };
const rowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };

export default CustomerCart;
