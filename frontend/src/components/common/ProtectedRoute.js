import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location          = useLocation();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--gray-500)', fontSize: 16 }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🚫</div>
        <h2 style={{ color: 'var(--secondary)' }}>Access Denied</h2>
        <p style={{ color: 'var(--gray-500)', marginTop: 8 }}>You don't have permission to view this page.</p>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
