import React from 'react';
import { Package, Edit, Trash, Filter, Star, AlertTriangle } from 'lucide-react';

export const FarmerProducts = () => (
    <div style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>My Products</h2>
            <button className="btn btn-primary"><Package size={16} /> Add Product</button>
        </div>
        <div className="card">
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <input className="form-control" style={{ flex: 1 }} placeholder="Search by name, category..." />
                <button className="btn btn-outline"><Filter size={16} /> Filters</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                        <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Product</th>
                        <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Stock</th>
                        <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Price</th>
                        <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Status</th>
                        <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {[
                        { name: 'Organic Carrots', stock: '45 kg', price: 'LKR 450/kg', status: 'Active', statusClass: 'badge-success' },
                        { name: 'Fresh Tomatoes', stock: '0 kg', price: 'LKR 300/kg', status: 'Out of Stock', statusClass: 'badge-warning' },
                        { name: 'Green Beans', stock: '12 kg', price: 'LKR 380/kg', status: 'Active', statusClass: 'badge-success' },
                    ].map((product, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: 'var(--primary)' }}>{product.name}</td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>{product.stock}</td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>{product.price}</td>
                            <td style={{ padding: '0.75rem 0.5rem' }}><span className={`badge ${product.statusClass}`}>{product.status}</span></td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }}><Edit size={14} /></button>
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

export const FarmerSales = () => (
    <div style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>Sales & Revenue</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            {[
                { label: 'Total Revenue', value: 'LKR 45,200', color: 'var(--primary)' },
                { label: 'Total Orders', value: '128', color: 'inherit' },
                { label: 'Commission Deducted', value: 'LKR 4,520', color: 'var(--danger)' },
                { label: 'Net Earnings', value: 'LKR 40,680', color: 'var(--success)' },
            ].map((stat, idx) => (
                <div key={idx} className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{stat.label}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                </div>
            ))}
        </div>
        <div className="card">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Recent Sales</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                        <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Order ID</th>
                        <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Product</th>
                        <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Amount</th>
                        <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Date</th>
                    </tr>
                </thead>
                <tbody>
                    {[
                        { id: '#ORD-1029', product: 'Organic Carrots', amount: 'LKR 900.00', date: 'Today, 10:30 AM' },
                        { id: '#ORD-1028', product: 'Green Beans', amount: 'LKR 760.00', date: 'Yesterday, 3:15 PM' },
                        { id: '#ORD-1020', product: 'Fresh Tomatoes', amount: 'LKR 450.00', date: '2026-03-01' },
                    ].map((sale, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{sale.id}</td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>{sale.product}</td>
                            <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: 'var(--primary)' }}>{sale.amount}</td>
                            <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>{sale.date}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

