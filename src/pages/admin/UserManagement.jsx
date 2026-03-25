import React, { useEffect, useMemo, useState } from 'react';
import { Users, Package, ShoppingCart, Truck, CheckCircle, XCircle, Edit, Eye, Search, X, Save, Trash2 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5001';

const SRI_LANKA_CITIES = [
    'Colombo', 'Kandy', 'Galle', 'Jaffna', 'Negombo', 'Batticaloa',
    'Trincomalee', 'Anuradhapura', 'Polonnaruwa', 'Ratnapura',
    'Matara', 'Kurunegala', 'Badulla', 'Kegalle', 'Nuwara Eliya',
    'Hambantota', 'Puttalam', 'Vavuniya', 'Mannar', 'Ampara',
    'Matale', 'Gampaha', 'Kalutara',
];

// ── Shared modal shell ───────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
        <div className="card" style={{ width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>{title}</h3>
                <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem' }} onClick={onClose}><X size={16} /></button>
            </div>
            {children}
        </div>
    </div>
);

// ── View detail row ───────────────────────────────────────────────────────────
const DetailRow = ({ label, value }) => (
    <div style={{ display: 'flex', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
        <span style={{ width: 160, color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500, flexShrink: 0 }}>{label}</span>
        <span style={{ fontWeight: 600, wordBreak: 'break-all' }}>{value || <em style={{ color: 'var(--text-muted)', fontWeight: 400 }}>—</em>}</span>
    </div>
);

// ── Inline error banner ───────────────────────────────────────────────────────
const ErrorBanner = ({ msg }) => msg ? (
    <div style={{ marginBottom: '0.75rem', padding: '0.7rem 1rem', background: '#fee', border: '1px solid #fcc', borderRadius: 8, color: '#c33', fontSize: '0.875rem' }}>
        ⚠️ {msg}
    </div>
) : null;

const UserManagement = () => {
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState([]);
    const [counts, setCounts] = useState({ total: 0, farmer: 0, user: 0, driver: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // ── Add modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState('');
    const [formData, setFormData] = useState({
        role: 'user', firstName: '', lastName: '', email: '', password: '', phone: '',
        farmLocation: '', farmSize: '', cropsProduced: '', licenseNumber: '', vehicleNumber: '', vehicleType: '',
    });

    // ── View modal
    const [viewUser, setViewUser] = useState(null);

    // ── Edit modal
    const [editUser, setEditUser] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState('');

    const tabs = ['all', 'farmer', 'user', 'driver'];

    const fetchUsers = async () => {
        setLoading(true); setError('');
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/users?role=all`);
            const data = await res.json();
            if (!res.ok || !data.success) { setError(data.message || 'Failed to load users'); return; }
            setUsers(data.users || []);
            setCounts(data.counts || { total: 0, farmer: 0, user: 0, driver: 0 });
        } catch { setError('Unable to load users. Make sure backend is running on port 5001.'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchUsers(); }, []);

    const filteredUsers = useMemo(() => {
        const roleFiltered = activeTab === 'all' ? users : users.filter(u => u.role === activeTab);
        if (!searchTerm.trim()) return roleFiltered;
        const q = searchTerm.toLowerCase();
        return roleFiltered.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone || '').includes(q));
    }, [activeTab, users, searchTerm]);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const validatePhone = (phone) => /^\d{10}$/.test(phone);

    // ── View ──────────────────────────────────────────────────────────────────
    const handleView = async (user) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/users/${user.role}/${user.id}`);
            const data = await res.json();
            if (data.success) setViewUser({ ...data.user, role: user.role });
            else setViewUser(user);
        } catch { setViewUser(user); }
    };

    // ── Edit ──────────────────────────────────────────────────────────────────
    const handleEditOpen = async (user) => {
        setEditError('');
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/users/${user.role}/${user.id}`);
            const data = await res.json();
            const u = data.success ? data.user : user;
            setEditUser({ ...u, role: user.role });
            setEditForm({
                name: u.name || '', email: u.email || '', phone: u.phone || '',
                city: u.city || '',
                farmLocation: u.farm_location || '', farmSize: u.farm_size || '', cropsProduced: u.crops_produced || '',
                licenseNumber: u.license_number || '', vehicleNumber: u.vehicle_number || '', vehicleType: u.vehicle_type || '',
            });
        } catch { setEditUser(user); setEditForm({ name: user.name, email: user.email, phone: user.phone || '' }); }
    };

    const handleEditSave = async (e) => {
        e.preventDefault(); setEditError('');
        if (!editForm.name.trim()) { setEditError('Name is required.'); return; }
        if (!editForm.email.trim()) { setEditError('Email is required.'); return; }
        if (!validatePhone(editForm.phone)) { setEditError('Phone must be exactly 10 digits.'); return; }
        setEditLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/users/${editUser.role}/${editUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });
            const data = await res.json();
            if (!data.success) { setEditError(data.message || 'Failed to update.'); return; }
            setEditUser(null);
            await fetchUsers();
        } catch { setEditError('Connection error.'); }
        finally { setEditLoading(false); }
    };

    // ── Delete ────────────────────────────────────────────────────────────────
    const handleDelete = async (user) => {
        if (!window.confirm(`Delete ${user.role === 'user' ? 'customer' : user.role} "${user.name}"? This cannot be undone.`)) return;
        try {
            await fetch(`${API_BASE_URL}/api/admin/users/${user.role}/${user.id}`, { method: 'DELETE' });
            await fetchUsers();
        } catch { alert('Delete failed. Please try again.'); }
    };

    // ── Add User ──────────────────────────────────────────────────────────────
    const resetForm = () => setFormData({
        role: 'user', firstName: '', lastName: '', email: '', password: '', phone: '',
        farmLocation: '', farmSize: '', cropsProduced: '', licenseNumber: '', vehicleNumber: '', vehicleType: '',
    });

    const handleAddUser = async (e) => {
        e.preventDefault(); setAddError('');
        if (!validatePhone(formData.phone)) { setAddError('Phone must be exactly 10 digits.'); return; }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) { setAddError('Please enter a valid email.'); return; }
        setAddLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (!res.ok || !data.success) { setAddError(data.message || 'Unable to create user'); return; }
            setShowAddModal(false); resetForm(); await fetchUsers();
        } catch { setAddError('Failed to create user. Please try again.'); }
        finally { setAddLoading(false); }
    };

    return (
        <div style={{ padding: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>User Management</h2>
                <button className="btn btn-primary" onClick={() => { setShowAddModal(true); setAddError(''); }}><Users size={16} /> Add User</button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total Users', value: counts.total, icon: Users, color: 'var(--primary)' },
                    { label: 'Farmers', value: counts.farmer, icon: Package, color: 'var(--success)' },
                    { label: 'Customers', value: counts.user, icon: ShoppingCart, color: 'var(--secondary)' },
                    { label: 'Drivers', value: counts.driver, icon: Truck, color: 'var(--warning)' },
                ].map((stat, i) => (
                    <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-lg)', backgroundColor: stat.color + '20' }}>
                            <stat.icon size={22} color={stat.color} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stat.label}</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs + Search */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                {tabs.map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={activeTab === tab ? 'btn btn-primary' : 'btn btn-outline'}
                        style={{ textTransform: 'capitalize', padding: '0.4rem 1rem' }}>
                        {tab === 'user' ? 'Customers' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
                <div style={{ marginLeft: 'auto', position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="form-control" style={{ paddingLeft: '2.25rem', width: '220px' }} placeholder="Search users..."
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0 }}>
                {error && <div style={{ padding: '1rem', color: 'var(--danger)' }}>{error}</div>}
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'var(--bg-color)', borderBottom: '2px solid var(--border)' }}>
                            {['User ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Actions'].map(h => (
                                <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {!loading && filteredUsers.length === 0 && (
                            <tr><td colSpan={7} style={{ padding: '1.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No users found.</td></tr>
                        )}
                        {filteredUsers.map((user, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.875rem' }}>{user.userId}</td>
                                <td style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem' }}>
                                            {user.name[0]}
                                        </div>
                                        {user.name}
                                    </div>
                                </td>
                                <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)' }}>{user.email}</td>
                                <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)' }}>{user.phone}</td>
                                <td style={{ padding: '0.875rem 1rem' }}>
                                    <span className={`badge ${user.role === 'farmer' ? 'badge-success' : user.role === 'driver' ? 'badge-warning' : 'badge-primary'}`} style={{ textTransform: 'capitalize' }}>
                                        {user.role === 'user' ? 'Customer' : user.role}
                                    </span>
                                </td>
                                <td style={{ padding: '0.875rem 1rem' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.875rem', color: user.status === 'Active' ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                                        {user.status === 'Active' ? <CheckCircle size={14} /> : <XCircle size={14} />} {user.status}
                                    </span>
                                </td>
                                <td style={{ padding: '0.875rem 1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                                        <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }} title="View" onClick={() => handleView(user)}><Eye size={14} /></button>
                                        <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }} title="Edit" onClick={() => handleEditOpen(user)}><Edit size={14} /></button>
                                        <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', borderColor: 'var(--danger)', color: 'var(--danger)' }} title="Delete" onClick={() => handleDelete(user)}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ── VIEW MODAL ── */}
            {viewUser && (
                <Modal title="User Details" onClose={() => setViewUser(null)}>
                    <div style={{ marginBottom: '1rem' }}>
                        <span className={`badge ${viewUser.role === 'farmer' ? 'badge-success' : viewUser.role === 'driver' ? 'badge-warning' : 'badge-primary'}`}>
                            {viewUser.role === 'user' ? 'Customer' : viewUser.role}
                        </span>
                    </div>
                    <DetailRow label="Name" value={viewUser.name} />
                    <DetailRow label="Email" value={viewUser.email} />
                    <DetailRow label="Phone" value={viewUser.phone} />
                    {viewUser.role === 'user' && <DetailRow label="City" value={viewUser.city} />}
                    {viewUser.role === 'farmer' && <>
                        <DetailRow label="Farm Location" value={viewUser.farm_location} />
                        <DetailRow label="Farm Size" value={viewUser.farm_size} />
                        <DetailRow label="Crops Produced" value={viewUser.crops_produced} />
                    </>}
                    {viewUser.role === 'driver' && <>
                        <DetailRow label="City" value={viewUser.city} />
                        <DetailRow label="License Number" value={viewUser.license_number} />
                        <DetailRow label="Vehicle Number" value={viewUser.vehicle_number} />
                        <DetailRow label="Vehicle Type" value={viewUser.vehicle_type} />
                    </>}
                    <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline" onClick={() => setViewUser(null)}>Close</button>
                    </div>
                </Modal>
            )}

            {/* ── EDIT MODAL ── */}
            {editUser && (
                <Modal title={`Edit ${editUser.role === 'user' ? 'Customer' : editUser.role.charAt(0).toUpperCase() + editUser.role.slice(1)}`} onClose={() => setEditUser(null)}>
                    <form onSubmit={handleEditSave}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                <label className="form-label">Full Name</label>
                                <input className="form-control" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input type="email" className="form-control" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>(10 digits)</span></label>
                                <input className="form-control" value={editForm.phone}
                                    onChange={e => setEditForm({ ...editForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                    maxLength={10} />
                            </div>
                        </div>
                        {(editUser.role === 'user' || editUser.role === 'driver') && (
                            <div className="form-group">
                                <label className="form-label">City</label>
                                <select className="form-control" value={editForm.city} onChange={e => setEditForm({ ...editForm, city: e.target.value })}>
                                    <option value="">— Select city —</option>
                                    {SRI_LANKA_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        )}
                        {editUser.role === 'farmer' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                    <label className="form-label">Farm Location</label>
                                    <input className="form-control" value={editForm.farmLocation} onChange={e => setEditForm({ ...editForm, farmLocation: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Farm Size</label>
                                    <input className="form-control" value={editForm.farmSize} onChange={e => setEditForm({ ...editForm, farmSize: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Crops Produced</label>
                                    <input className="form-control" value={editForm.cropsProduced} onChange={e => setEditForm({ ...editForm, cropsProduced: e.target.value })} />
                                </div>
                            </div>
                        )}
                        {editUser.role === 'driver' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group">
                                    <label className="form-label">License Number</label>
                                    <input className="form-control" value={editForm.licenseNumber} onChange={e => setEditForm({ ...editForm, licenseNumber: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Vehicle Number</label>
                                    <input className="form-control" value={editForm.vehicleNumber} onChange={e => setEditForm({ ...editForm, vehicleNumber: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Vehicle Type</label>
                                    <input className="form-control" value={editForm.vehicleType} onChange={e => setEditForm({ ...editForm, vehicleType: e.target.value })} />
                                </div>
                            </div>
                        )}
                        <ErrorBanner msg={editError} />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <button type="button" className="btn btn-outline" onClick={() => setEditUser(null)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={editLoading}>
                                <Save size={14} /> {editLoading ? 'Saving…' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* ── ADD USER MODAL ── */}
            {showAddModal && (
                <Modal title="Add New Account" onClose={() => { setShowAddModal(false); resetForm(); }}>
                    <form onSubmit={handleAddUser}>
                        <div className="form-group">
                            <label className="form-label">Role</label>
                            <select className="form-control" name="role" value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })} required>
                                <option value="user">Customer</option>
                                <option value="farmer">Farmer</option>
                                <option value="driver">Driver</option>
                            </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div className="form-group">
                                <label className="form-label">First Name</label>
                                <input className="form-control" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Last Name</label>
                                <input className="form-control" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input type="email" className="form-control" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <input type="password" className="form-control" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>(10 digits)</span></label>
                            <input className="form-control" value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                maxLength={10} placeholder="0771234567" required />
                        </div>
                        {formData.role === 'farmer' && (<>
                            <div className="form-group">
                                <label className="form-label">Farm Location</label>
                                <input className="form-control" value={formData.farmLocation} onChange={e => setFormData({ ...formData, farmLocation: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Farm Size</label>
                                    <input className="form-control" value={formData.farmSize} onChange={e => setFormData({ ...formData, farmSize: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Crops Produced</label>
                                    <input className="form-control" value={formData.cropsProduced} onChange={e => setFormData({ ...formData, cropsProduced: e.target.value })} />
                                </div>
                            </div>
                        </>)}
                        {formData.role === 'driver' && (<>
                            <div className="form-group">
                                <label className="form-label">License Number</label>
                                <input className="form-control" value={formData.licenseNumber} onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Vehicle Number</label>
                                    <input className="form-control" value={formData.vehicleNumber} onChange={e => setFormData({ ...formData, vehicleNumber: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Vehicle Type</label>
                                    <input className="form-control" value={formData.vehicleType} onChange={e => setFormData({ ...formData, vehicleType: e.target.value })} />
                                </div>
                            </div>
                        </>)}
                        <ErrorBanner msg={addError} />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <button type="button" className="btn btn-outline" onClick={() => { setShowAddModal(false); resetForm(); }}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={addLoading}>{addLoading ? 'Adding…' : 'Add Account'}</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default UserManagement;
