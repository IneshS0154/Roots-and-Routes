import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const AnalyticsReports = () => (
    <div style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Analytics & Reports</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select className="form-control"><option>Last 30 Days</option><option>Last 7 Days</option><option>This Year</option></select>
                <button className="btn btn-outline">Export CSV</button>
            </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
                { label: 'Total Revenue', value: 'LKR 284,500', trend: '+12%', up: true },
                { label: 'New Users', value: '128', trend: '+24%', up: true },
                { label: 'Orders Placed', value: '841', trend: '+6%', up: true },
                { label: 'Avg. Order Value', value: 'LKR 338', trend: '-2%', up: false },
            ].map((s, i) => (
                <div key={i} className="card">
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{s.label}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>{s.value}</div>
                    <div style={{ fontSize: '0.8rem', color: s.up ? 'var(--success)' : 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {s.up ? <TrendingUp size={13} /> : <TrendingDown size={13} />} {s.trend} vs last period
                    </div>
                </div>
            ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
            <div className="card">
                <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Revenue Overview</h3>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '180px', padding: '0 0.5rem' }}>
                    {[60, 80, 50, 90, 75, 110, 95, 120, 85, 100, 115, 130].map((h, i) => (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                            <div style={{ width: '100%', height: `${h}%`, backgroundColor: i === 11 ? 'var(--primary)' : 'var(--secondary)', opacity: i === 11 ? 1 : 0.5, borderRadius: '4px 4px 0 0', transition: 'all 0.3s' }}></div>
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="card">
                <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Top Categories</h3>
                {[
                    { name: 'Vegetables', pct: 48 },
                    { name: 'Fruits', pct: 30 },
                    { name: 'Dairy', pct: 15 },
                    { name: 'Grains', pct: 7 },
                ].map((c, i) => (
                    <div key={i} style={{ marginBottom: '0.875rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                            <span>{c.name}</span><span style={{ fontWeight: 600 }}>{c.pct}%</span>
                        </div>
                        <div style={{ height: '8px', background: 'var(--bg-color)', borderRadius: '99px' }}>
                            <div style={{ height: '100%', width: `${c.pct}%`, background: 'var(--primary)', borderRadius: '99px' }}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default AnalyticsReports;
