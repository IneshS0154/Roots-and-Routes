import React, { useState, useEffect, useCallback } from 'react';
import {
    Package, Search, Filter, AlertTriangle, CheckCircle,
    XCircle, Save, RefreshCw, Calendar, Clock
} from 'lucide-react';
import { getUser } from '../../utils/userSession';

const API = 'http://localhost:5001';
const CATEGORIES = ['Vegetables', 'Fruits', 'Grains', 'Dairy', 'Herbs', 'Other'];

/* ─── Status badge ────────────────────────────────────────────────────────── */
const StatusBadge = ({ qty, expiryDate }) => {
    if (expiryDate) {
        const exp = new Date(expiryDate);
        const today = new Date();
        const daysLeft = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 0) return <span style={badge('#9333ea')}>🕒 Expired</span>;
        if (daysLeft <= 3) return <span style={badge('#f59e0b')}>⏰ Expiring Soon</span>;
    }
    if (Number(qty) === 0) return <span style={badge('#ef4444')}><XCircle size={12} /> Out of Stock</span>;
    if (Number(qty) < 15)  return <span style={badge('#f59e0b')}><AlertTriangle size={12} /> Low Stock</span>;
    return <span style={badge('#22c55e')}><CheckCircle size={12} /> Active</span>;
};
function badge(color) {
    return { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600, background: color + '18', color, border: `1px solid ${color}33` };
}

/* ─── Main Component ──────────────────────────────────────────────────────── */
const FarmerInventory = () => {
    const user = getUser();
    const farmerId = user?.id;

    const [inventory, setInventory]   = useState([]);
    const [edits, setEdits]           = useState({});      // { [inventoryId]: { quantity, harvest_date, expiry_date } }
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState('');
    const [savingId, setSavingId]     = useState(null);
    const [savedId, setSavedId]       = useState(null);
    const [search, setSearch]         = useState('');
    const [filterCat, setFilterCat]   = useState('All');

    /* ── fetch ── */
    const fetchInventory = useCallback(async () => {
        if (!farmerId) return;
        try {
            setLoading(true);
            const res = await fetch(`${API}/api/farmer/inventory?farmer_id=${farmerId}`);
            const data = await res.json();
            if (!data.success) throw new Error(data.message || 'Failed to load inventory');
            setInventory(data.inventory);
            // Seed local edit state from fetched values
            const seedEdits = {};
            data.inventory.forEach(item => {
                seedEdits[item.inventory_id] = {
                    quantity: item.quantity,
                    harvest_date: item.harvest_date ? item.harvest_date.split('T')[0] : '',
                    expiry_date:  item.expiry_date  ? item.expiry_date.split('T')[0]  : '',
                };
            });
            setEdits(seedEdits);
            setError('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [farmerId]);

    useEffect(() => { fetchInventory(); }, [fetchInventory]);

    /* ── helper: get editable field value ── */
    const getField = (invId, field) => edits[invId]?.[field] ?? '';

    const setField = (invId, field, value) =>
        setEdits(prev => ({ ...prev, [invId]: { ...prev[invId], [field]: value } }));

    /* ── save a single row ── */
    const handleSave = async (invId) => {
        const row = edits[invId];
        if (!row || row.quantity === '' || Number(row.quantity) < 0) {
            alert('Enter a valid quantity (≥ 0).');
            return;
        }
        setSavingId(invId);
        try {
            const res = await fetch(`${API}/api/farmer/inventory/${invId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quantity:     Number(row.quantity),
                    harvest_date: row.harvest_date || null,
                    expiry_date:  row.expiry_date  || null,
                }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message || 'Save failed');
            setSavedId(invId);
            setTimeout(() => setSavedId(null), 2000);
            // update local inventory so status badge refreshes
            setInventory(prev => prev.map(i =>
                i.inventory_id === invId
                    ? { ...i, quantity: Number(row.quantity), harvest_date: row.harvest_date || null, expiry_date: row.expiry_date || null }
                    : i
            ));
        } catch (err) {
            alert(err.message);
        } finally {
            setSavingId(null);
        }
    };

    /* ── derived stats ── */
    const totalValue  = inventory.reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0);
    const outOfStock  = inventory.filter(i => Number(i.quantity) === 0).length;
    const lowStock    = inventory.filter(i => Number(i.quantity) > 0 && Number(i.quantity) < 15).length;

    /* ── filtered view ── */
    const visible = inventory.filter(p => {
        const q = search.toLowerCase();
        const matchSearch = p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
        const matchCat = filterCat === 'All' || p.category === filterCat;
        return matchSearch && matchCat;
    });

    return (
        <div style={{ padding: '2rem', minHeight: '100vh' }}>

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Package size={28} color="var(--primary)" /> Inventory
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                        Adjust quantities, harvest dates and expiry dates for your products.
                    </p>
                </div>
                <button onClick={fetchInventory} style={ghostBtn}>
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            {/* ── Stat cards ─────────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {[
                    { label: 'Total Products',  value: inventory.length,                     color: 'var(--primary)', icon: '📦' },
                    { label: 'Out of Stock',     value: outOfStock,                           color: '#ef4444',        icon: '🚫' },
                    { label: 'Low Stock',        value: lowStock,                             color: '#f59e0b',        icon: '⚠️' },
                    { label: 'Inventory Value',  value: `LKR ${totalValue.toLocaleString()}`, color: '#22c55e',        icon: '💰' },
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
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…" style={{ ...inputStyle, paddingLeft: '2.4rem' }} />
                </div>
                <div style={{ position: 'relative' }}>
                    <Filter size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ ...inputStyle, paddingLeft: '2.2rem', cursor: 'pointer' }}>
                        <option value="All">All Categories</option>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {/* ── Error ──────────────────────────────────────────────────── */}
            {error && (
                <div style={{ padding: '0.85rem 1.25rem', marginBottom: '1.5rem', background: '#ef444418', border: '1px solid #ef444433', borderRadius: 10, color: '#ef4444', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={16} /> {error}
                </div>
            )}

            {/* ── Inventory hint ─────────────────────────────────────────── */}
            <div style={{ marginBottom: '1rem', padding: '0.65rem 1rem', background: 'rgba(79,121,66,0.07)', border: '1px solid rgba(79,121,66,0.2)', borderRadius: 8, fontSize: '0.83rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                💡 Use the <strong>Products</strong> section to add or remove products. Here you can update stock levels, harvest dates and expiry dates.
            </div>

            {/* ── Table ──────────────────────────────────────────────────── */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Package size={40} style={{ opacity: 0.25, marginBottom: '1rem' }} />
                        <p>Loading inventory…</p>
                    </div>
                ) : visible.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Package size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No inventory items found</p>
                        <p style={{ fontSize: '0.875rem' }}>Add products in the <strong>Products</strong> section first.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-color)', borderBottom: '2px solid var(--border)' }}>
                                    {['#', 'Product', 'Category', 'Unit Price', 'Quantity', 'Harvest Date', 'Expiry Date', 'Status', 'Save'].map(h => (
                                        <th key={h} style={th}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {visible.map((item, idx) => {
                                    const invId = item.inventory_id;
                                    const isSaving = savingId === invId;
                                    const justSaved = savedId === invId;
                                    const qty = getField(invId, 'quantity');
                                    return (
                                        <tr key={invId}
                                            style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s', background: justSaved ? 'rgba(34,197,94,0.05)' : 'transparent' }}
                                            onMouseEnter={e => { if (!justSaved) e.currentTarget.style.background = 'var(--bg-color)'; }}
                                            onMouseLeave={e => { if (!justSaved) e.currentTarget.style.background = 'transparent'; }}>

                                            <td style={td}><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{idx + 1}</span></td>

                                            {/* Product name */}
                                            <td style={td}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                    <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--primary)15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <Package size={15} color="var(--primary)" />
                                                    </div>
                                                    <span style={{ fontWeight: 600 }}>{item.name}</span>
                                                </div>
                                            </td>

                                            <td style={td}><span style={catPill}>{item.category}</span></td>

                                            <td style={td}>
                                                <span style={{ fontWeight: 600 }}>LKR {Number(item.price).toLocaleString()}</span>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.77rem' }}>/{item.unit}</span>
                                            </td>

                                            {/* Quantity – +/− stepper + direct input */}
                                            <td style={td}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <button
                                                        onClick={() => setField(invId, 'quantity', Math.max(0, Number(qty) - 1))}
                                                        style={qtyBtn}>−</button>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        value={qty}
                                                        onChange={e => setField(invId, 'quantity', e.target.value)}
                                                        style={{ ...inputStyle, width: '68px', textAlign: 'center', fontWeight: 700, padding: '0.4rem 0.4rem', color: Number(qty) === 0 ? '#ef4444' : Number(qty) < 15 ? '#f59e0b' : 'var(--text-main)' }}
                                                    />
                                                    <button
                                                        onClick={() => setField(invId, 'quantity', Number(qty) + 1)}
                                                        style={qtyBtn}>+</button>
                                                    <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{item.unit}</span>
                                                </div>
                                            </td>

                                            {/* Harvest date */}
                                            <td style={td}>
                                                <div style={{ position: 'relative' }}>
                                                    <Calendar size={13} style={{ position: 'absolute', left: '0.55rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                                    <input
                                                        type="date"
                                                        value={getField(invId, 'harvest_date')}
                                                        onChange={e => setField(invId, 'harvest_date', e.target.value)}
                                                        style={{ ...inputStyle, paddingLeft: '1.8rem', width: '150px', fontSize: '0.82rem' }}
                                                    />
                                                </div>
                                            </td>

                                            {/* Expiry date */}
                                            <td style={td}>
                                                <div style={{ position: 'relative' }}>
                                                    <Clock size={13} style={{ position: 'absolute', left: '0.55rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                                    <input
                                                        type="date"
                                                        value={getField(invId, 'expiry_date')}
                                                        onChange={e => setField(invId, 'expiry_date', e.target.value)}
                                                        style={{ ...inputStyle, paddingLeft: '1.8rem', width: '150px', fontSize: '0.82rem' }}
                                                    />
                                                </div>
                                            </td>

                                            <td style={td}><StatusBadge qty={qty} expiryDate={getField(invId, 'expiry_date') || item.expiry_date} /></td>

                                            {/* Save button */}
                                            <td style={td}>
                                                <button
                                                    onClick={() => handleSave(invId)}
                                                    disabled={isSaving}
                                                    style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                                        padding: '6px 14px', borderRadius: 7, fontSize: '0.8rem', fontWeight: 700,
                                                        border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer',
                                                        background: justSaved ? '#22c55e' : 'var(--primary)',
                                                        color: '#fff', opacity: isSaving ? 0.7 : 1,
                                                        transition: 'background 0.3s',
                                                        whiteSpace: 'nowrap',
                                                    }}>
                                                    {justSaved ? <><CheckCircle size={14} /> Saved!</> : isSaving ? 'Saving…' : <><Save size={14} /> Save</>}
                                                </button>
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
                Showing {visible.length} of {inventory.length} products
            </p>
        </div>
    );
};

/* ─── Shared styles ───────────────────────────────────────────────────────── */
const th = { padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'left', whiteSpace: 'nowrap' };
const td = { padding: '0.75rem 1rem', fontSize: '0.875rem', verticalAlign: 'middle' };
const catPill = { display: 'inline-block', padding: '3px 10px', borderRadius: 99, background: 'var(--primary)15', color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 600 };
const qtyBtn = { width: 28, height: 28, borderRadius: 7, border: '1.5px solid var(--border)', background: 'var(--bg-color)', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', flexShrink: 0 };
const ghostBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.6rem 1.3rem', borderRadius: 9, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' };
const inputStyle = { width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--white)', color: 'var(--text-main)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' };

export default FarmerInventory;
