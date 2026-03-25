import React, { useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { saveUser, clearUser, getUser } from './utils/userSession';

// Auth
import AuthPage from './pages/AuthPage';

// Public layout
import PublicLayout from './layouts/PublicLayout';

// Admin
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import OrderManagement from './pages/admin/OrderManagement';
import PaymentManagement from './pages/admin/PaymentManagement';
import DisputeManagement from './pages/admin/DisputeManagement';
import DeliveryManagement from './pages/admin/DeliveryManagement';
import AnalyticsReports from './pages/admin/AnalyticsReports';
import ReviewManagement from './pages/admin/ReviewManagement';
import SystemSettings from './pages/admin/SystemSettings';
import Notifications from './pages/admin/Notifications';
import SellerContact from './pages/admin/SellerContact';

// Farmer
import FarmerLayout from './layouts/FarmerLayout';
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import FarmerProducts from './pages/farmer/FarmerProducts';
import FarmerSales from './pages/farmer/FarmerSales';
import FarmerNotifications from './pages/farmer/FarmerNotifications';
import FarmerReviews from './pages/farmer/FarmerReviews';
import FarmerInventory from './pages/farmer/FarmerInventory';

// Customer
import CustomerLayout from './layouts/CustomerLayout';
import CustomerHome from './pages/customer/CustomerHome';
import CustomerProducts from './pages/customer/CustomerProducts';
import CustomerProductDetail from './pages/customer/CustomerProductDetail';
import CustomerCart from './pages/customer/CustomerCart';
import CustomerCheckout from './pages/customer/CustomerCheckout';
import CustomerOrders from './pages/customer/CustomerOrders';
import CustomerProfile from './pages/customer/CustomerProfile';
import CustomerTraceability from './pages/customer/CustomerTraceability';
import CustomerSupport from './pages/customer/CustomerSupport';

// Driver
import DriverLayout from './layouts/DriverLayout';
import DriverDeliveries from './pages/driver/DriverDeliveries';
import { DriverDashboard, DriverHistory, DriverVehicle, DriverProfile } from './pages/driver/DummyPages';

// Role Guard
const RoleRoute = ({ children, allowedRole, user }) => {
  if (!user || user.role !== allowedRole) {
    return <Navigate to="/login" />;
  }
  return children;
};

// Inner app that has access to router context (needed for useNavigate)
function AppRoutes() {
  const [user, setUser] = useState(() => getUser());
  const navigate = useNavigate();

  const handleLogin = useCallback((userData, role) => {
    const enriched = { ...userData, role };
    setUser(enriched);
    saveUser(enriched);
    switch (role) {
      case 'admin': navigate('/admin/dashboard'); break;
      case 'farmer': navigate('/farmer/dashboard'); break;
      case 'driver': navigate('/driver/deliveries'); break;
      case 'customer':
      default: navigate('/customer/home'); break;
    }
  }, [navigate]);

  return (
    <Routes>
      {/* Public routes – no login needed, Login button shown in navbar */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<CustomerHome />} />
        <Route path="/products" element={<CustomerProducts />} />
        <Route path="/products/:id" element={<CustomerProductDetail />} />
        <Route path="/traceability" element={<CustomerTraceability />} />
      </Route>

      {/* Auth */}
      <Route path="/login" element={<AuthPage onLogin={handleLogin} />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<RoleRoute allowedRole="admin" user={user}><AdminLayout /></RoleRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="orders" element={<OrderManagement />} />
        <Route path="payments" element={<PaymentManagement />} />
        <Route path="seller-contact" element={<SellerContact />} />
        <Route path="disputes" element={<DisputeManagement />} />
        <Route path="deliveries" element={<DeliveryManagement />} />
        <Route path="analytics" element={<AnalyticsReports />} />
        <Route path="reviews" element={<ReviewManagement />} />
        <Route path="settings" element={<SystemSettings />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      {/* Farmer Routes */}
      <Route path="/farmer" element={<RoleRoute allowedRole="farmer" user={user}><FarmerLayout /></RoleRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<FarmerDashboard />} />
        <Route path="products" element={<FarmerProducts />} />
        <Route path="sales" element={<FarmerSales />} />
        <Route path="inventory" element={<FarmerInventory />} />
        <Route path="reviews" element={<FarmerReviews />} />
        <Route path="notifications" element={<FarmerNotifications />} />
      </Route>

      {/* Customer Routes */}
      <Route path="/customer" element={<RoleRoute allowedRole="customer" user={user}><CustomerLayout /></RoleRoute>}>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<CustomerHome />} />
        <Route path="products" element={<CustomerProducts />} />
        <Route path="products/:id" element={<CustomerProductDetail />} />
        <Route path="cart" element={<CustomerCart />} />
        <Route path="checkout" element={<CustomerCheckout />} />
        <Route path="orders" element={<CustomerOrders />} />
        <Route path="profile" element={<CustomerProfile />} />
        <Route path="traceability" element={<CustomerTraceability />} />
        <Route path="support" element={<CustomerSupport />} />
      </Route>

      {/* Driver Routes */}
      <Route path="/driver" element={<RoleRoute allowedRole="driver" user={user}><DriverLayout /></RoleRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DriverDashboard />} />
        <Route path="deliveries" element={<DriverDeliveries />} />
        <Route path="history" element={<DriverHistory />} />
        <Route path="vehicle" element={<DriverVehicle />} />
        <Route path="profile" element={<DriverProfile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
