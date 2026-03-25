import React from 'react';
import { Filter, Eye, Trash } from 'lucide-react';

const ProductManagement = () => (
    <div style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Product Management</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input className="form-control" placeholder="Search products..." style={{ width: '220px' }} />
                <button className="btn btn-outline"><Filter size={16} /></button>
            </div>
        </div>
        <div className="card" style={{ padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ background: 'var(--bg-color)', borderBottom: '2px solid var(--border)' }}>
                        {['Product', 'Farmer', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map(h => (
                            <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {[
                        { name: 'Organic Carrots', farmer: 'Sunny Farm', category: 'Vegetables', price: 'LKR 450/kg', stock: '45 kg', status: 'Active' },
                        { name: 'Fresh Tomatoes', farmer: 'Green Valley', category: 'Vegetables', price: 'LKR 300/kg', stock: '0 kg', status: 'Out of Stock' },
                        { name: 'Alphonso Mangoes', farmer: 'Hill Top Farm', category: 'Fruits', price: 'LKR 1200/kg', stock: '20 kg', status: 'Active' },
                        { name: 'Coconut Milk', farmer: 'Coast Farm', category: 'Dairy', price: 'LKR 250/L', stock: '15 L', status: 'Pending Review' },
                    ].map((p, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>{p.name}</td>
                            <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)' }}>{p.farmer}</td>
                            <td style={{ padding: '0.875rem 1rem' }}><span className="badge badge-primary" style={{ color: 'var(--primary)' }}>{p.category}</span></td>
                            <td style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>{p.price}</td>
                            <td style={{ padding: '0.875rem 1rem', color: p.stock === '0 kg' ? 'var(--danger)' : 'inherit' }}>{p.stock}</td>
                            <td style={{ padding: '0.875rem 1rem' }}>
                                <span className={`badge ${p.status === 'Active' ? 'badge-success' : p.status === 'Pending Review' ? 'badge-warning' : ''}`}
                                    style={{ color: p.status === 'Out of Stock' ? 'var(--danger)' : '' }}>{p.status}</span>
                            </td>
                            <td style={{ padding: '0.875rem 1rem' }}>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }}><Eye size={14} /></button>
                                    <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}><Trash size={14} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

export default ProductManagement;
