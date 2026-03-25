import React from 'react';
import { AlertTriangle, Users, ShoppingCart, CreditCard, Star } from 'lucide-react';

const Notifications = () => (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Notifications</h2>
            <button className="btn btn-outline" style={{ fontSize: '0.875rem' }}>Mark all as read</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
                { icon: AlertTriangle, color: 'var(--warning)', title: 'New Dispute Filed', desc: 'Customer Dilki S. filed a dispute on Order #ORD-1020.', time: '5 mins ago', read: false },
                { icon: Users, color: 'var(--primary)', title: 'New Farmer Registration', desc: 'Saman Perera has registered as a Farmer and is pending approval.', time: '1 hour ago', read: false },
                { icon: ShoppingCart, color: 'var(--success)', title: 'High Order Volume', desc: '50 orders were placed in the last hour — system performing normally.', time: '2 hours ago', read: true },
                { icon: CreditCard, color: 'var(--secondary)', title: 'Payout Processed', desc: 'Monthly payouts of LKR 45,200 have been processed to all farmers.', time: 'Yesterday', read: true },
                { icon: Star, color: 'var(--warning)', title: 'Review Flagged', desc: "A review on 'Fresh Tomatoes' has been flagged as inappropriate.", time: '2 days ago', read: true },
            ].map((n, i) => (
                <div key={i} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', background: !n.read ? 'rgba(79, 121, 66, 0.05)' : 'white', borderLeft: !n.read ? '4px solid var(--primary)' : '4px solid transparent' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: n.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <n.icon size={20} color={n.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: n.read ? 500 : 700 }}>{n.title}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{n.time}</span>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{n.desc}</p>
                    </div>
                    {!n.read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', marginTop: '6px', flexShrink: 0 }}></div>}
                </div>
            ))}
        </div>
    </div>
);

export default Notifications;
