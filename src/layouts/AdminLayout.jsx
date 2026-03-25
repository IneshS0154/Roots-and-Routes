import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import {
    LayoutDashboard,
    Users,
    ShoppingCart,
    CreditCard,
    Scale,
    Truck,
    BarChart,
    Star,
    Settings,
    Bell,
    Menu,
    LogOut,
    Leaf,
    ChevronLeft,
    MessageSquare
} from 'lucide-react';

const AdminLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        navigate('/login');
    };

    const navItems = [
        { path: '/admin/dashboard', name: 'Dashboard Overview', icon: LayoutDashboard },
        { path: '/admin/users', name: 'User Management', icon: Users },
        { path: '/admin/orders', name: 'Order Management', icon: ShoppingCart },
        { path: '/admin/payments', name: 'Payment Management', icon: CreditCard },
        { path: '/admin/seller-contact', name: 'Seller Contact', icon: MessageSquare },
        { path: '/admin/disputes', name: 'Dispute Management', icon: Scale },
        { path: '/admin/deliveries', name: 'Delivery Management', icon: Truck },
        { path: '/admin/analytics', name: 'Analytics & Reports', icon: BarChart },
        { path: '/admin/reviews', name: 'Review Management', icon: Star },
        { path: '/admin/settings', name: 'System Settings', icon: Settings },
        { path: '/admin/notifications', name: 'Notifications', icon: Bell },
    ];

    return (
        <div className="app-container">
            {/* Dynamic Sidebar */}
            <div className={`sidebar admin-sidebar ${collapsed ? 'collapsed' : ''}`} style={{ width: collapsed ? '80px' : '260px', transition: 'width 0.3s' }}>
                <div className="sidebar-header" style={{ justifyContent: collapsed ? 'center' : 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                        <Leaf className="logo-icon flex-shrink-0" size={28} />
                        {!collapsed && <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--white)', whiteSpace: 'nowrap' }}>Roots & Routes</h2>}
                    </div>
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
                    >
                        {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
                    </button>
                </div>

                <div className="sidebar-nav" style={{ overflowY: 'auto' }}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            title={collapsed ? item.name : undefined}
                        >
                            <item.icon size={20} className="flex-shrink-0" />
                            {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.name}</span>}
                        </NavLink>
                    ))}
                </div>

                <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <button className="btn btn-outline" style={{ width: '100%', justifyContent: collapsed ? 'center' : 'flex-start' }} onClick={handleLogout}>
                        <LogOut size={20} className="flex-shrink-0" />
                        {!collapsed && <span>Sign Out</span>}
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* Top Navbar */}
                <div className="admin-topbar">
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        Super Admin Control Panel
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => navigate('/admin/notifications')}>
                            <Bell size={24} color="var(--text-muted)" />
                            <div style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, backgroundColor: 'var(--danger)', borderRadius: '50%', border: '2px solid white' }}></div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                A
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.2 }}>Platform Admin</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>admin@rootsroutes.com</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Page Content from sub-routes */}
                <div className="main-content" style={{ backgroundColor: '#F4F7F4' }}>
                    <PageTransition>
                        <Outlet />
                    </PageTransition>
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
