import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import { ShoppingCart, Leaf, Search, LogIn } from 'lucide-react';

/**
 * PublicLayout – same top-nav as CustomerLayout but:
 * - No authentication required
 * - Shows a "Login" button in place of the user chip / logout
 * - Cart button still visible but clicking → redirects to login with a message
 */
const PublicLayout = () => {
    const navigate = useNavigate();
    const navItems = [
        { path: '/home', name: 'Home' },
        { path: '/products', name: 'Products' },
        { path: '/traceability', name: 'Traceability' },
    ];

    const [searchFocused, setSearchFocused] = React.useState({ focus: false, val: '' });

    return (
        <div className="app-container" style={{ backgroundColor: 'var(--bg-color)', flexDirection: 'column' }}>
            <nav style={{ padding: '1rem 2rem', backgroundColor: 'var(--white)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
                    <Leaf className="logo-icon" size={28} color="var(--primary)" />
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>Roots &amp; Routes</h2>
                </div>

                {/* Nav links */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    {navItems.map(item => (
                        <NavLink key={item.path} to={item.path}
                            className={({ isActive }) => isActive ? 'text-primary' : 'text-muted'}
                            style={{ fontWeight: 600, textDecoration: 'none' }}>
                            {item.name}
                        </NavLink>
                    ))}
                </div>

                {/* Search bar */}
                <div style={{ flex: 1, maxWidth: '400px', margin: '0 2rem', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-color)', padding: '0.6rem 1rem', borderRadius: 'var(--radius-full)', border: searchFocused.focus ? '1px solid var(--primary)' : '1px solid var(--border)', transition: 'all 0.2s' }}>
                        <Search size={18} color="var(--text-muted)" style={{ marginRight: '0.5rem' }} />
                        <input
                            type="text"
                            placeholder="Search products, farmers, categories..."
                            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                            onFocus={() => setSearchFocused({ ...searchFocused, focus: true })}
                            onBlur={() => setTimeout(() => setSearchFocused({ ...searchFocused, focus: false }), 200)}
                            onChange={(e) => setSearchFocused({ ...searchFocused, val: e.target.value })}
                        />
                    </div>
                </div>

                {/* Right: cart + login */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <button
                        className="btn btn-outline"
                        style={{ padding: '0.5rem', borderRadius: '50%', position: 'relative' }}
                        onClick={() => navigate('/login', { state: { from: 'cart' } })}
                        title="Login to access cart"
                    >
                        <ShoppingCart size={20} />
                    </button>

                    <button
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 700, padding: '0.55rem 1.25rem' }}
                        onClick={() => navigate('/login')}
                    >
                        <LogIn size={16} /> Login
                    </button>
                </div>
            </nav>

            <div style={{ flex: 1, width: '100%', overflowY: 'auto' }}>
                <PageTransition>
                    <Outlet />
                </PageTransition>
            </div>
        </div>
    );
};

export default PublicLayout;
