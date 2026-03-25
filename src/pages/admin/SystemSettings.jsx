import React from 'react';
import { DollarSign, Settings } from 'lucide-react';

const SystemSettings = () => (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>System Settings</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
                <h3 style={{ fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <DollarSign size={18} color="var(--primary)" /> Commission & Fees
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">Platform Commission (%)</label>
                        <input type="number" className="form-control" defaultValue={10} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Platform Fee (LKR)</label>
                        <input type="number" className="form-control" defaultValue={20} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Tax Rate (%)</label>
                        <input type="number" className="form-control" defaultValue={5} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Min. Order Amount (LKR)</label>
                        <input type="number" className="form-control" defaultValue={200} />
                    </div>
                </div>
            </div>
            <div className="card">
                <h3 style={{ fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Settings size={18} color="var(--primary)" /> General Settings
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[
                        { label: 'Allow new farmer registrations', defaultOn: true },
                        { label: 'Allow new customer registrations', defaultOn: true },
                        { label: 'Enable product reviews', defaultOn: true },
                        { label: 'Maintenance mode', defaultOn: false },
                    ].map((s, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-color)', borderRadius: 'var(--radius-md)' }}>
                            <span style={{ fontWeight: 500 }}>{s.label}</span>
                            <div style={{ width: '44px', height: '24px', background: s.defaultOn ? 'var(--primary)' : 'var(--border)', borderRadius: '99px', position: 'relative', cursor: 'pointer' }}>
                                <div style={{ position: 'absolute', top: '2px', left: s.defaultOn ? '22px' : '2px', width: '20px', height: '20px', background: 'white', borderRadius: '50%', transition: 'all 0.2s' }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button className="btn btn-outline">Reset to Defaults</button>
                <button className="btn btn-primary">Save Changes</button>
            </div>
        </div>
    </div>
);

export default SystemSettings;
