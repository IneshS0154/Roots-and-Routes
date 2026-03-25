import React, { useState, useEffect } from 'react';
import { Send, Users, MessageSquare, CheckCircle, AlertTriangle, RefreshCw, MapPin, Package } from 'lucide-react';

const API = 'http://localhost:5001';

const SellerContact = () => {
    const [farmers, setFarmers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isUrgent, setIsUrgent] = useState(true);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const fetchFarmers = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API}/api/admin/farmers`);
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            setFarmers(data.farmers);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };
    useEffect(() => { fetchFarmers(); }, []);

    const selectedFarmer = farmers.find(f => String(f.id) === String(selected));

    const quickMessages = [
        { label: 'Price Update Needed', text: 'Please review and update your product prices to remain competitive with current market rates.' },
        { label: 'Low Stock Warning', text: 'Several of your products are running low on stock. Please restock soon to avoid listing suspensions.' },
        { label: 'Quality Alert', text: 'We have received customer complaints regarding the quality of recent deliveries. Please review your packing and freshness standards.' },
        { label: 'Account Verification', text: 'Your account documents are due for renewal. Please submit updated verification documents within 7 days.' },
        { label: 'Congratulations', text: 'Congratulations! You have been identified as one of our top-performing farmer this month. Keep up the great work!' },
    ];

    const handleSend = async () => {
        if (!selected) { setError('Please select a Farmer.'); return; }
        if (!subject.trim()) { setError('Please enter a subject.'); return; }
        if (!message.trim()) { setError('Please enter a message.'); return; }
        setError('');
        setSending(true);
        try {
            const res = await fetch(`${API}/api/admin/notifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ farmer_id: Number(selected), subject, message, is_urgent: isUrgent }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            setSent(true);
            setSubject('');
            setMessage('');
            setTimeout(() => setSent(false), 3000);
        } catch (err) { setError(err.message); }
        finally { setSending(false); }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1100px' }}>
            <div style={{ marginBottom: '1.75rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                    <MessageSquare size={26} color="var(--primary)" /> Farmer Contact
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                    Send direct messages to farmers — they will appear as urgent notifications in their dashboard
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
                {/* ── Compose panel ────────────────────────────────────── */}
                <div className="card" style={{ padding: '1.75rem' }}>
                    <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Send size={16} color="var(--primary)" /> Compose Message
                    </h3>

                    {/* Farmer select */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={labelStyle}>Select Farmer *</label>
                        <select
                            value={selected}
                            onChange={e => setSelected(e.target.value)}
                            style={{ ...inputStyle, cursor: 'pointer' }}>
                            <option value="">— Choose a farmer —</option>
                            {farmers.map(f => (
                                <option key={f.id} value={f.id}>{f.name}{f.farm_location ? ` (${f.farm_location})` : ''}</option>
                            ))}
                        </select>
                    </div>

                    {/* Subject */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={labelStyle}>Subject *</label>
                        <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Quality Alert for Your Products" style={inputStyle} />
                    </div>

                    {/* Quick templates */}
                    <div style={{ marginBottom: '0.75rem' }}>
                        <label style={labelStyle}>Quick Templates</label>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {quickMessages.map(q => (
                                <button key={q.label} onClick={() => { setSubject(q.label); setMessage(q.text); }}
                                    style={{ padding: '3px 10px', borderRadius: 99, border: '1.5px solid var(--border)', background: '#fff', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                                    {q.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Message */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={labelStyle}>Message *</label>
                        <textarea value={message} onChange={e => setMessage(e.target.value)}
                            placeholder="Write your message to the farmer here…"
                            rows={5} style={{ ...inputStyle, resize: 'vertical' }} />
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '0.25rem' }}>{message.length} characters</div>
                    </div>

                    {/* Urgent toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', padding: '0.75rem 1rem', borderRadius: 10, background: isUrgent ? '#ef444408' : '#fafafa', border: `1px solid ${isUrgent ? '#ef444433' : 'var(--border)'}` }}>
                        <div onClick={() => setIsUrgent(!isUrgent)} style={{ width: 40, height: 22, borderRadius: 99, background: isUrgent ? '#ef4444' : 'var(--border)', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }}>
                            <div style={{ position: 'absolute', top: 2, left: isUrgent ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: isUrgent ? '#ef4444' : 'var(--text-main)' }}>
                                {isUrgent ? '🚨 Mark as Urgent' : 'Mark as Urgent'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {isUrgent ? 'Will show a red urgent badge in farmer dashboard' : 'Will appear as a regular notification'}
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div style={{ padding: '0.65rem 1rem', marginBottom: '1rem', background: '#ef444410', border: '1px solid #ef444430', borderRadius: 8, color: '#ef4444', fontSize: '0.83rem', display: 'flex', gap: 6 }}>
                            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
                        </div>
                    )}

                    {sent && (
                        <div style={{ padding: '0.65rem 1rem', marginBottom: '1rem', background: '#22c55e10', border: '1px solid #22c55e30', borderRadius: 8, color: '#15803d', fontSize: '0.83rem', display: 'flex', gap: 6 }}>
                            <CheckCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> Message sent successfully!
                        </div>
                    )}

                    <button onClick={handleSend} disabled={sending} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%', padding: '0.9rem', borderRadius: 10, border: 'none', background: sending ? 'var(--border)' : 'var(--primary)', color: sending ? 'var(--text-muted)' : '#fff', fontWeight: 800, fontSize: '1rem', cursor: sending ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
                        <Send size={16} /> {sending ? 'Sending…' : 'Send Message'}
                    </button>
                </div>

                {/* ── Farmer list sidebar ───────────────────────────────── */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 5 }}><Users size={16} /> Registered Farmers</h3>
                        <button onClick={fetchFarmers} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><RefreshCw size={14} /></button>
                    </div>
                    {loading ? (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem' }}>Loading Farmers...</div>
                    ) : farmers.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem' }}>No farmers registered yet</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {farmers.map(f => (
                                <div key={f.id}
                                    onClick={() => setSelected(String(f.id))}
                                    style={{ padding: '0.9rem 1rem', borderRadius: 10, border: `1.5px solid ${String(selected) === String(f.id) ? 'var(--primary)' : 'var(--border)'}`, background: String(selected) === String(f.id) ? 'var(--primary)08' : '#fff', cursor: 'pointer', transition: 'all 0.15s' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--primary)20', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>
                                            {f.name?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: String(selected) === String(f.id) ? 'var(--primary)' : 'var(--text-main)' }}>{f.name}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: 6 }}>
                                                {f.farm_location && <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><MapPin size={9} />{f.farm_location}</span>}
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><Package size={9} />{f.product_count} products</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const inputStyle = { width: '100%', padding: '0.65rem 0.85rem', borderRadius: 8, border: '1.5px solid var(--border)', background: '#fff', fontSize: '0.9rem', outline: 'none', color: 'var(--text-main)', boxSizing: 'border-box' };
const labelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' };

export default SellerContact;
