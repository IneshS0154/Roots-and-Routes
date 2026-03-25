import React, { useState, useEffect, useCallback } from 'react';
import {
    Package, Plus, Trash2, Edit3, Search, Filter,
    AlertTriangle, CheckCircle, XCircle, Save, X, Leaf
} from 'lucide-react';
import { getUser } from '../../utils/userSession';

const API = 'http://localhost:5001';

const CATEGORIES = ['Vegetables', 'Fruits', 'Grains', 'Dairy', 'Herbs', 'Other'];
const UNITS = ['kg', 'g', 'unit', 'litre', 'bundle'];
const EMPTY_FORM = { name: '', category: 'Vegetables', unit: 'kg', price: '', description: '', is_organic: false };

/* ─── Status badge ────────────────────────────────────────────────────────── */
const StatusBadge = ({ qty }) => {
    if (qty === 0) return <span style={badge('#ef4444')}><XCircle size={12} /> Out of Stock</span>;
    if (qty < 15)  return <span style={badge('#f59e0b')}><AlertTriangle size={12} /> Low Stock</span>;
    return                <span style={badge('#22c55e')}><CheckCircle size={12} /> Active</span>;
};
function badge(color) {
    return {
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 10px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600,
        background: color + '18', color, border: `1px solid ${color}33`,
    };
}

/* ─── Main Component ──────────────────────────────────────────────────────── */
const FarmerProducts = () => {
    const user = getUser();
    const farmerId = user?.id;

    const [products, setProducts]   = useState([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState('');
    const [search, setSearch]       = useState('');
    const [filterCat, setFilterCat] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [form, setForm]           = useState(EMPTY_FORM);
    const [formError, setFormError] = useState('');
    const [saving, setSaving]       = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);

    /* ── fetch ── */
    const fetchProducts = useCallback(async () => {
        if (!farmerId) return;
        try {
            setLoading(true);
            const res = await fetch(`${API}/api/farmer/products?farmer_id=${farmerId}`);
            const data = await res.json();
            if (!data.success) throw new Error(data.message || 'Failed to load products');
            setProducts(data.products);
            setError('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [farmerId]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    /* ── filtered view ── */
    const visible = products.filter(p => {
        const q = search.toLowerCase();
        const matchSearch = p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
        const matchCat = filterCat === 'All' || p.category === filterCat;
        return matchSearch && matchCat;
    });

    /* ── modal helpers ── */
    const openAdd = () => {
        setEditTarget(null);
        setForm(EMPTY_FORM);
        setFormError('');
        setShowModal(true);
    };
    const openEdit = (p) => {
        setEditTarget(p.id);
        setForm({ name: p.name, category: p.category, unit: p.unit, price: p.price, description: p.description || '', is_organic: !!p.is_organic });
        setFormError('');
        setShowModal(true);
    };
    const closeModal = () => { setShowModal(false); setFormError(''); };

    /* ── save ── */
    const handleSave = async () => {
        if (!form.name.trim()) return setFormError('Product name is required.');
        if (form.price === '' || +form.price < 0) return setFormError('Enter a valid price.');

        setSaving(true);
        try {
            let res, data;
            if (editTarget) {
                res = await fetch(`${API}/api/farmer/products/${editTarget}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...form, price: +form.price }),
                });
            } else {
                res = await fetch(`${API}/api/farmer/products`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...form, price: +form.price, farmer_id: farmerId }),
                });
            }
            data = await res.json();
            if (!data.success) throw new Error(data.message || 'Save failed');
            closeModal();
            fetchProducts();
        } catch (err) {
            setFormError(err.message);
        } finally {
            setSaving(false);
        }
    };

    /* ── delete ── */
    const handleDelete = async (id) => {
        try {
            const res = await fetch(`${API}/api/farmer/products/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!data.success) throw new Error(data.message || 'Delete failed');
            setConfirmDelete(null);
            fetchProducts();
        } catch (err) {
            alert(err.message);
        }
    };

    /* ── derived stats ── */
    const totalValue = products.reduce((s, p) => s + p.price * (p.quantity || 0), 0);
    const outOfStock = products.filter(p => (p.quantity || 0) === 0).length;
    const lowStock   = products.filter(p => (p.quantity || 0) > 0 && (p.quantity || 0) < 15).length;

    return (
        <div style={{ padding: '2rem', minHeight: '100vh' }}>

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Leaf size={28} color="var(--primary)" /> My Products
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                        Add and manage the products you grow and sell.
                    </p>
                </div>
                <button onClick={openAdd} style={primaryBtn}>
                    <Plus size={18} /> Add Product
                </button>
            </div>

            {/* ── Stat cards ─────────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {[
                    { label: 'Total Products',   value: products.length,                              color: 'var(--primary)', icon: '📦' },
                    { label: 'Out of Stock',      value: outOfStock,                                   color: '#ef4444',       icon: '🚫' },
                    { label: 'Low Stock',         value: lowStock,                                     color: '#f59e0b',       icon: '⚠️' },
                    { label: 'Total Inv. Value',  value: `LKR ${totalValue.toLocaleString()}`,         color: '#22c55e',       icon: '💰' },
                ].map((s, i) => (
                    <div key={i} className="card" style={{ borderTop: `4px solid ${s.color}`, padding: '1.25rem' }}>
                        <div style={{ fontSize: '1.4rem', marginBottom: '0.4rem' }}>{s.icon}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.25rem' }}>{s.label}</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* ── Filters ────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search products or categories…"
                        style={{ ...formInput, paddingLeft: '2.4rem' }}
                    />
                </div>
                <div style={{ position: 'relative' }}>
                    <Filter size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ ...formInput, paddingLeft: '2.2rem', cursor: 'pointer' }}>
                        <option value="All">All Categories</option>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {/* ── Error banner ───────────────────────────────────────────── */}
            {error && (
                <div style={{ padding: '0.85rem 1.25rem', marginBottom: '1.5rem', background: '#ef444418', border: '1px solid #ef444433', borderRadius: 10, color: '#ef4444', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={16} /> {error}
                </div>
            )}

            {/* ── Table ──────────────────────────────────────────────────── */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Package size={40} style={{ opacity: 0.25, marginBottom: '1rem' }} />
                        <p>Loading products…</p>
                    </div>
                ) : visible.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Package size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No products found</p>
                        <p style={{ fontSize: '0.875rem' }}>
                            {products.length === 0
                                ? <>Click <button onClick={openAdd} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontSize: 'inherit' }}>Add Product</button> to get started.</>
                                : 'Try adjusting your search or category filter.'}
                        </p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg)', borderBottom: '2px solid var(--border)' }}>
                                    {['#', 'Product', 'Category', 'Unit Price', 'Stock', 'Status', 'Actions'].map(h => (
                                        <th key={h} style={th}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {visible.map((p, idx) => (
                                    <tr key={p.id}
                                        style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-color)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <td style={td}><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{idx + 1}</span></td>
                                        <td style={td}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary)18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <Package size={16} color="var(--primary)" />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                                                    {p.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{p.description.substring(0, 50)}{p.description.length > 50 ? '…' : ''}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={td}><span style={catPill}>{p.category}</span></td>
                                        <td style={td}><span style={{ fontWeight: 600 }}>LKR {Number(p.price).toLocaleString()}</span><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>/{p.unit}</span></td>
                                        <td style={td}><span style={{ fontWeight: 700, color: (p.quantity || 0) === 0 ? '#ef4444' : (p.quantity || 0) < 15 ? '#f59e0b' : 'var(--text-main)' }}>{p.quantity || 0}</span> <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{p.unit}</span></td>
                                        <td style={td}>
                                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                <StatusBadge qty={p.quantity || 0} />
                                                <span style={p.is_organic ? badge('#16a34a') : badge('#6b7280')}>{p.is_organic ? '🌿 Organic' : 'Non-Organic'}</span>
                                            </div>
                                        </td>
                                        <td style={td}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => openEdit(p)} style={editBtn}><Edit3 size={14} /> Edit</button>
                                                <button onClick={() => setConfirmDelete(p)} style={deleteBtn}><Trash2 size={14} /> Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.75rem', textAlign: 'right' }}>
                Showing {visible.length} of {products.length} products
            </p>

            {/* ── Add / Edit Modal ────────────────────────────────────────── */}
            {showModal && (
                <div style={overlayStyle} onClick={closeModal}>
                    <div style={modalBox} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                                {editTarget ? <><Edit3 size={18} color="var(--primary)" /> Edit Product</> : <><Plus size={18} color="var(--primary)" /> Add New Product</>}
                            </h3>
                            <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={22} /></button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            {/* Product Name – full width */}
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={labelStyle}>Product Name *</label>
                                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Organic Carrots" style={formInput} />
                            </div>
                            <div>
                                <label style={labelStyle}>Category</label>
                                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={formInput}>
                                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Unit</label>
                                <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} style={formInput}>
                                    {UNITS.map(u => <option key={u}>{u}</option>)}
                                </select>
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={labelStyle}>Price (LKR) *</label>
                                <input type="number" min={0} value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="e.g. 350" style={formInput} />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={labelStyle}>Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    placeholder="Optional – brief description of the product"
                                    rows={3}
                                    style={{ ...formInput, resize: 'vertical' }}
                                />
                            </div>
                            {/* Organic toggle */}
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', userSelect: 'none' }}>
                                    <div
                                        onClick={() => setForm(f => ({ ...f, is_organic: !f.is_organic }))}
                                        style={{
                                            width: 44, height: 24, borderRadius: 99, position: 'relative', transition: 'background 0.25s',
                                            background: form.is_organic ? '#16a34a' : 'var(--border)', cursor: 'pointer', flexShrink: 0,
                                        }}>
                                        <div style={{
                                            position: 'absolute', top: 3, left: form.is_organic ? 23 : 3, width: 18, height: 18,
                                            borderRadius: '50%', background: '#fff', transition: 'left 0.25s',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                        }} />
                                    </div>
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                        {form.is_organic ? '🌿 Organic Product' : 'Non-Organic Product'}
                                    </span>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                        {form.is_organic ? 'Will show an Organic badge to customers' : 'Toggle on if grown without synthetic pesticides'}
                                    </span>
                                </label>
                            </div>
                        </div>

                        {formError && (
                            <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.9rem', background: '#ef444418', border: '1px solid #ef444433', borderRadius: 8, color: '#ef4444', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <AlertTriangle size={14} /> {formError}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
                            <button onClick={handleSave} disabled={saving} style={{ ...primaryBtn, flex: 1, justifyContent: 'center', opacity: saving ? 0.7 : 1 }}>
                                <Save size={16} /> {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Product'}
                            </button>
                            <button onClick={closeModal} style={{ ...ghostBtn, flex: 1, justifyContent: 'center' }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Confirm Delete Modal ─────────────────────────────────────── */}
            {confirmDelete && (
                <div style={overlayStyle} onClick={() => setConfirmDelete(null)}>
                    <div style={{ ...modalBox, maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🗑️</div>
                            <h3 style={{ marginBottom: '0.5rem', fontWeight: 700 }}>Delete Product?</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                <strong>{confirmDelete.name}</strong> will be removed from your product list and inventory. This cannot be undone.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={() => handleDelete(confirmDelete.id)} style={{ ...deleteBtn, flex: 1, justifyContent: 'center', padding: '0.65rem' }}>
                                <Trash2 size={16} /> Yes, Delete
                            </button>
                            <button onClick={() => setConfirmDelete(null)} style={{ ...ghostBtn, flex: 1, justifyContent: 'center' }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ─── Shared styles ───────────────────────────────────────────────────────── */
const th = { padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'left', whiteSpace: 'nowrap' };
const td = { padding: '0.85rem 1rem', fontSize: '0.875rem', verticalAlign: 'middle' };
const catPill = { display: 'inline-block', padding: '3px 10px', borderRadius: 99, background: 'var(--primary)15', color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 600 };
const editBtn = { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 7, fontSize: '0.8rem', fontWeight: 600, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer' };
const deleteBtn = { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 7, fontSize: '0.8rem', fontWeight: 600, border: '1.5px solid #ef444444', background: '#ef444410', color: '#ef4444', cursor: 'pointer' };
const primaryBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.6rem 1.3rem', borderRadius: 9, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' };
const ghostBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.6rem 1.3rem', borderRadius: 9, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' };
const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' };
const modalBox = { background: 'var(--white)', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 540, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', border: '1px solid var(--border)' };
const formInput = { width: '100%', padding: '0.6rem 0.85rem', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-muted)' };

export default FarmerProducts;
