import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Leaf, MapPin, Search, Star, MessageSquare } from 'lucide-react';

export const CustomerProducts = () => (
    <div style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Available Products</h2>
        <div className="grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(id => (
                <div key={id} className="card" style={{ padding: 0 }}>
                    <div style={{ height: 160, backgroundColor: 'var(--secondary)', opacity: 0.3 }} />
                    <div style={{ padding: '1rem' }}>
                        <span className={`badge ${id % 2 === 0 ? 'badge-success' : 'badge-primary'}`}>{id % 2 === 0 ? 'Organic' : 'Non-Organic'}</span>
                        <h3 className="text-primary font-bold mt-2">Product Name</h3>
                        <p className="text-muted text-sm">Farmer Name • Location</p>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            <Link to={`/customer/products/${id}`} className="btn btn-outline" style={{ flex: 1, padding: '0.5rem' }}>View</Link>
                            <button className="btn btn-primary" style={{ flex: 1, padding: '0.5rem' }}><ShoppingCart size={16} /></button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export const CustomerProductDetail = () => (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <div className="card" style={{ display: 'flex', gap: '2rem' }}>
            <div style={{ flex: 1, backgroundColor: 'var(--secondary)', opacity: 0.2, minHeight: '300px' }} />
            <div style={{ flex: 1 }}>
                <span className="badge badge-success">Organic</span>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>Fresh Carrots</h1>
                <h2 className="text-primary font-bold mb-4">LKR 450.00 / kg</h2>
                <div className="text-muted mb-4">Harvest: 2026-03-01 <br />Expires: 2026-03-15</div>
                <button className="btn btn-primary w-full"><ShoppingCart size={16} /> Add to Cart</button>
                <Link to="/customer/traceability" className="btn btn-outline w-full mt-2"><MapPin size={16} /> Traceability</Link>
            </div>
        </div>
    </div>
);

export const CustomerCart = () => (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>Cart</h1>
        <div className="card" style={{ display: 'flex', gap: '2rem' }}>
            <div style={{ flex: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                    <div>
                        <div className="font-bold">Organic Carrots</div>
                        <div className="text-muted">Sunny Farm</div>
                    </div>
                    <div className="font-bold text-primary">LKR 900.00</div>
                </div>
            </div>
            <div style={{ flex: 1 }} className="card bg-gray-50">
                <h3 className="font-bold mb-2">Summary</h3>
                <div className="flex justify-between mb-4"><span>Total</span><span className="font-bold text-primary">LKR 965.00</span></div>
                <button className="btn btn-primary w-full">Checkout</button>
            </div>
        </div>
    </div>
);

export const CustomerOrders = () => (
    <div style={{ padding: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>My Orders</h1>
        <div className="card" style={{ padding: 0 }}>
            <table style={{ width: '100%' }}>
                <thead>
                    <tr><th>Order ID</th><th>Date</th><th>Total</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="font-bold">#ORD-1029</td>
                        <td>2026-03-02</td>
                        <td className="font-bold text-primary">LKR 1,250.00</td>
                        <td><span className="badge badge-warning">Processing</span></td>
                        <td><button className="btn btn-outline p-1 text-sm">Details</button></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
);

export const CustomerTraceability = () => (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>Traceability</h1>
        <div className="card mb-4 flex gap-2">
            <input className="form-control flex-1" placeholder="Batch ID..." />
            <button className="btn btn-primary"><Search size={16} /></button>
        </div>
        <div className="card">
            <h3 className="font-bold mb-4">Journey: #BCH-88219</h3>
            <div className="border-l-2 border-primary pl-4 py-2 relative">
                <div className="mb-4">
                    <div className="font-bold flex items-center gap-2"><Leaf size={16} className="text-primary" /> Harvested</div>
                    <div className="text-muted text-sm">Sunny Farm, Kandy • 2026-03-01</div>
                </div>
                <div>
                    <div className="font-bold flex items-center gap-2"><MapPin size={16} className="text-warning" /> Out for Delivery</div>
                    <div className="text-muted text-sm">Route A • 2026-03-03</div>
                </div>
            </div>
        </div>
    </div>
);

export const CustomerSupport = () => (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>Support</h1>
        <div className="card">
            <h3 className="font-bold mb-2 flex justify-between">Dispute #DSP-001 <span className="badge badge-warning">Under Review</span></h3>
            <p className="text-sm text-muted mb-4">Order: #ORD-0985</p>
            <div className="bg-gray-100 p-4 rounded mb-4">
                <p>My tomatoes arrived completely squashed.</p>
                <span className="text-xs text-muted block mt-2">Alex D. • Today</span>
            </div>
            <div className="flex gap-2">
                <input className="form-control flex-1" placeholder="Reply..." />
                <button className="btn btn-primary"><MessageSquare size={16} /></button>
            </div>
        </div>
    </div>
);
