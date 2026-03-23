import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar   from './components/layout/Navbar';
import Footer   from './components/layout/Footer';

// Public pages
import Home          from './pages/Home';
import Vehicles      from './pages/Vehicles';
import VehicleDetail from './pages/VehicleDetail';

// Auth pages
import Login    from './pages/auth/Login';
import Register from './pages/auth/Register';

// Customer pages
import MyBookings    from './pages/MyBookings';
import Payment       from './pages/Payment';
import Verification  from './pages/Verification';
import Profile       from './pages/Profile';
import Review        from './pages/Review';

// Admin pages
import AdminLayout       from './pages/admin/AdminLayout';
import AdminDashboard    from './pages/admin/AdminDashboard';
import AdminVehicles     from './pages/admin/AdminVehicles';
import AdminBookings     from './pages/admin/AdminBookings';
import AdminVerification from './pages/admin/AdminVerification';
import AdminUsers        from './pages/admin/AdminUsers';
import AdminReports      from './pages/admin/AdminReports';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3500, style: { fontFamily: 'DM Sans, sans-serif', fontSize: 14 } }} />
        <Navbar />
        <Routes>
          {/* Public */}
          <Route path="/"           element={<Home />} />
          <Route path="/vehicles"   element={<Vehicles />} />
          <Route path="/vehicles/:id" element={<VehicleDetail />} />
          <Route path="/login"      element={<Login />} />
          <Route path="/register"   element={<Register />} />

          {/* Customer (protected) */}
          <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route path="/payment/:bookingId" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
          <Route path="/verification" element={<ProtectedRoute><Verification /></ProtectedRoute>} />
          <Route path="/profile"      element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/review/:bookingId" element={<ProtectedRoute><Review /></ProtectedRoute>} />

          {/* Admin/Staff (protected) */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin','staff']}><AdminLayout /></ProtectedRoute>}>
            <Route index               element={<AdminDashboard />} />
            <Route path="vehicles"     element={<AdminVehicles />} />
            <Route path="bookings"     element={<AdminBookings />} />
            <Route path="verification" element={<AdminVerification />} />
            <Route path="users"        element={<AdminUsers />} />
            <Route path="reports"      element={<AdminReports />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={
            <div className="container" style={{ textAlign:'center', padding:'80px 20px' }}>
              <div style={{ fontSize: 72 }}>🛵</div>
              <h2 style={{ color:'var(--secondary)', marginTop:16 }}>Page Not Found</h2>
              <p style={{ color:'var(--gray-500)', marginTop:8 }}>The page you're looking for doesn't exist.</p>
              <a href="/" className="btn btn-primary" style={{ marginTop:20 }}>Go Home</a>
            </div>
          } />
        </Routes>
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
