import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Users, ShoppingCart, DollarSign, AlertCircle, Truck, PackageX, UserPlus, RefreshCw } from 'lucide-react';

const API = 'http://localhost:5001';
const COLORS = ['#4F7942', '#8A9A5B', '#f4a261'];

const fmtLKR = (n) => {
    if (n >= 1_000_000) return `LKR ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `LKR ${(n / 1_000).toFixed(0)}K`;
    return `LKR ${n}`;
};

const statusColor = (s) => {
    const map = { delivered: 'badge-success', processing: 'badge-warning', pending: 'badge-warning', 'in transit': 'badge-primary', cancelled: 'badge-danger' };
    return map[(s || '').toLowerCase()] || 'badge-primary';
};

const AdminDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchAnalytics = async () => {
        setLoading(true); setError('');
        try {
            const res = await fetch(`${API}/api/admin/analytics`);
            const json = await res.json();
            if (!json.success) throw new Error(json.message);
            setData(json);
        } catch (e) {
            setError(e.message || 'Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAnalytics(); }, []);

    // Fallback placeholders when DB has no data yet
    const kpi = data?.kpi || {};
    const roleData = data?.roleData?.some(r => r.value > 0) ? data.roleData : [
        { name: 'Customers', value: 1 }, { name: 'Farmers', value: 1 }, { name: 'Drivers', value: 1 }
    ];
    const revenueByDay = data?.revenueByDay?.length ? data.revenueByDay : [
        { name: 'Mon', revenue: 0 }, { name: 'Tue', revenue: 0 }, { name: 'Wed', revenue: 0 },
        { name: 'Thu', revenue: 0 }, { name: 'Fri', revenue: 0 }, { name: 'Sat', revenue: 0 }, { name: 'Sun', revenue: 0 },
    ];
    const topProducts = data?.topProducts?.length ? data.topProducts : [];
    const categoryOrders = data?.categoryOrders?.length ? data.categoryOrders : [];
    const recentOrders = data?.recentOrders || [];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>Platform Overview</h2>
                <button onClick={fetchAnalytics} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                    <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
                </button>
            </div>

            {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: '#fee', border: '1px solid #fcc', borderRadius: 8, color: '#c33', fontSize: '0.875rem' }}>
                    <AlertCircle size={16} />
                    <span>{error} — Showing cached or empty data.</span>
                </div>
            )}

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Total Users', value: kpi.totalUsers ?? '—', sub: `${kpi.farmers ?? 0} farmers · ${kpi.drivers ?? 0} drivers`, icon: Users, accent: 'var(--primary)' },
                    { label: 'Total Orders', value: kpi.totalOrders ?? '—', sub: 'All time', icon: ShoppingCart, accent: 'var(--primary)' },
                    { label: 'Revenue (Total)', value: kpi.totalRevenue != null ? fmtLKR(kpi.totalRevenue) : '—', sub: 'All time revenue', icon: DollarSign, accent: 'var(--primary)' },
                    { label: 'Customers', value: kpi.customers ?? '—', sub: 'Registered customers', icon: UserPlus, accent: 'var(--primary)' },
                ].map((stat, i) => (
                    <div key={i} className="card animate-tile" style={{ borderTop: `4px solid ${stat.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', animationDelay: `${0.05 * (i + 1)}s` }}>
                        <div>
                            <div className="text-muted" style={{ fontWeight: 600, fontSize: '0.875rem' }}>{stat.label}</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.25rem' }}>{loading ? '…' : stat.value}</div>
                            <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>{stat.sub}</div>
                        </div>
                        <div style={{ padding: '0.75rem', backgroundColor: `${stat.accent}1a`, borderRadius: '50%' }}>
                            <stat.icon size={24} color={stat.accent} />
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Charts ── */}
            <div className="grid grid-cols-2 gap-6">
                {/* Revenue line */}
                <div className="card animate-tile" style={{ animationDelay: '0.2s' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Revenue (Last 7 Days)</h3>
                    <div style={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={revenueByDay} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
                                <Tooltip formatter={v => [`LKR ${v.toLocaleString()}`, 'Revenue']} />
                                <Line type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Role pie */}
                <div className="card animate-tile" style={{ animationDelay: '0.25s' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>User Role Distribution</h3>
                    <div style={{ height: 280, display: 'flex', justifyContent: 'center' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={roleData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                                    {roleData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(v, n) => [v, n]} />
                                <Legend iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Orders per category */}
                <div className="card animate-tile" style={{ animationDelay: '0.3s' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Orders per Category</h3>
                    <div style={{ height: 280 }}>
                        {categoryOrders.length === 0 && !loading ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No order data yet</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categoryOrders} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'rgba(79,121,66,0.05)' }} />
                                    <Bar dataKey="orders" fill="var(--secondary)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Top 5 products */}
                <div className="card animate-tile" style={{ animationDelay: '0.35s' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Top 5 Selling Products</h3>
                    <div style={{ height: 280 }}>
                        {topProducts.length === 0 && !loading ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No sales data yet</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topProducts} layout="vertical" margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={130} tick={{ fontSize: 12 }} />
                                    <Tooltip cursor={{ fill: 'rgba(79,121,66,0.05)' }} />
                                    <Bar dataKey="sales" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Recent activity ── */}
            <div className="grid grid-cols-2 gap-6">
                <div className="card animate-tile" style={{ animationDelay: '0.4s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Recent Orders</h3>
                    </div>
                    {recentOrders.length === 0 && !loading ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No orders yet.</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                    {['Order ID', 'Customer', 'Total', 'Status'].map(h => (
                                        <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={4} style={{ padding: '1rem', color: 'var(--text-muted)' }}>Loading…</td></tr>
                                ) : recentOrders.map((o, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600, color: 'var(--secondary)', fontSize: '0.85rem' }}>ORD-{o.id}</td>
                                        <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.875rem' }}>{o.customer}</td>
                                        <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.875rem' }}>{fmtLKR(o.total)}</td>
                                        <td style={{ padding: '0.65rem 0.75rem' }}><span className={`badge ${statusColor(o.status)}`} style={{ textTransform: 'capitalize' }}>{o.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="card animate-tile" style={{ animationDelay: '0.45s' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.25rem' }}>Quick Stats</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[
                            { icon: Truck, color: 'var(--warning)', label: 'Registered Drivers', value: kpi.drivers ?? '—' },
                            { icon: PackageX, color: 'var(--secondary)', label: 'Registered Farmers', value: kpi.farmers ?? '—' },
                            { icon: ShoppingCart, color: 'var(--primary)', label: 'Total Customers', value: kpi.customers ?? '—' },
                        ].map((s, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'var(--bg-color)', borderRadius: 10 }}>
                                <s.icon size={20} color={s.color} />
                                <span style={{ fontWeight: 700, fontSize: '1.15rem' }}>{loading ? '…' : s.value}</span>
                                <span className="text-muted" style={{ fontSize: '0.875rem' }}>{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
