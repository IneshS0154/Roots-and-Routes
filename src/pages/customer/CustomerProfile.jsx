import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, saveUser } from '../../utils/userSession';
import { User, Mail, Phone, MapPin, Edit2, Check, X, ArrowLeft } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5001';

const SRI_LANKA_CITIES = [
    'Colombo', 'Kandy', 'Galle', 'Jaffna', 'Negombo', 'Batticaloa',
    'Trincomalee', 'Anuradhapura', 'Polonnaruwa', 'Ratnapura',
    'Matara', 'Kurunegala', 'Badulla', 'Kegalle', 'Nuwara Eliya',
    'Hambantota', 'Puttalam', 'Vavuniya', 'Mannar', 'Ampara',
    'Matale', 'Gampaha', 'Kalutara',
];

const Field = ({ label, icon: Icon, value }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', padding: '1rem 0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(79,121,66,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={16} color="var(--primary)" />
        </div>
        <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.2rem' }}>{label}</div>
            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{value || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Not set</span>}</div>
        </div>
    </div>
);

const CustomerProfile = () => {
    const navigate = useNavigate();
    const sessionUser = getUser();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [form, setForm] = useState({ name: '', phone: '', city: '' });

    useEffect(() => {
        if (!sessionUser?.id) { navigate('/'); return; }
        fetch(`${API_BASE_URL}/api/customer/profile?id=${sessionUser.id}`)
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    setProfile(data.user);
                    setForm({ name: data.user.name || '', phone: data.user.phone || '', city: data.user.city || '' });
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const validate = () => {
        if (!form.name.trim()) return 'Name is required.';
        if (!/^\d{10}$/.test(form.phone)) return 'Phone must be exactly 10 digits.';
        return null;
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        const err = validate();
        if (err) { setError(err); return; }
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/customer/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: sessionUser.id, ...form }),
            });
            const data = await res.json();
            if (!data.success) { setError(data.message || 'Failed to save.'); return; }
            setProfile(data.user);
            // Update session so navbar reflects new name immediately
            saveUser({ ...sessionUser, name: data.user.name, phone: data.user.phone, city: data.user.city });
            setEditing(false);
            setSuccess('Profile updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch {
            setError('Connection error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const initials = profile?.name
        ? profile.name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
        : '?';

    return (
        <div style={{ maxWidth: 620, margin: '2.5rem auto', padding: '0 1.5rem' }}>
            <button
                onClick={() => navigate('/customer/home')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', marginBottom: '1.5rem', padding: 0 }}
            >
                <ArrowLeft size={16} /> Back to Home
            </button>

            <div className="card">
                {/* Avatar header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 700, flexShrink: 0 }}>
                        {initials}
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>{profile?.name || '—'}</h2>
                        <span className="badge badge-primary" style={{ marginTop: '0.35rem' }}>Customer</span>
                    </div>
                    {!editing && (
                        <button
                            onClick={() => { setEditing(true); setError(''); setSuccess(''); }}
                            className="btn btn-outline"
                            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                            <Edit2 size={15} /> Edit Profile
                        </button>
                    )}
                </div>

                {success && (
                    <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: '#e6f4ea', color: '#1e8e3e', borderRadius: 8, fontWeight: 500 }}>
                        ✓ {success}
                    </div>
                )}

                {loading ? (
                    <div style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>Loading…</div>
                ) : editing ? (
                    <form onSubmit={handleSave}>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input
                                className="form-control"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="Full name"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone Number <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(10 digits)</span></label>
                            <input
                                className="form-control"
                                value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                placeholder="0771234567"
                                maxLength={10}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">City</label>
                            <select className="form-control" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}>
                                <option value="">— Select city —</option>
                                {SRI_LANKA_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {error && (
                            <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#fee', border: '1px solid #fcc', borderRadius: 8, color: '#c33', fontSize: '0.875rem' }}>
                                ⚠️ {error}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                            <button type="button" className="btn btn-outline" onClick={() => { setEditing(false); setError(''); setForm({ name: profile.name || '', phone: profile.phone || '', city: profile.city || '' }); }}>
                                <X size={15} /> Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                <Check size={15} /> {saving ? 'Saving…' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <>
                        <Field label="Full Name" icon={User} value={profile?.name} />
                        <Field label="Email Address" icon={Mail} value={profile?.email} />
                        <Field label="Phone Number" icon={Phone} value={profile?.phone} />
                        <Field label="City" icon={MapPin} value={profile?.city} />
                        <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CustomerProfile;
