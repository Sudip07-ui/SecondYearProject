import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/admin',              icon: '', label: 'Dashboard',    end: true },
  { to: '/admin/vehicles',     icon: '', label: 'Vehicles' },
  { to: '/admin/bookings',     icon: '', label: 'Bookings' },
  { to: '/admin/verification', icon: '', label: 'Verification' },
  { to: '/admin/users',        icon: '', label: 'Users' },
  { to: '/admin/reports',      icon: '', label: 'Reports' },
];

function AdminLayout() {
  const { user } = useAuth();

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: 'var(--secondary)', flexShrink: 0, padding: '24px 0' }}>
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid rgba(255,255,255,.1)', marginBottom: 12 }}>
          <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
            {user?.role === 'admin' ? '⚡ Admin Panel' : '🔧 Staff Panel'}
          </div>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{user?.first_name} {user?.last_name}</div>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 10px' }}>
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                borderRadius: 8, fontSize: 14, fontWeight: 500, transition: 'all .2s', textDecoration: 'none',
                background: isActive ? 'rgba(230,57,70,.9)' : 'transparent',
                color: isActive ? '#fff' : 'rgba(255,255,255,.7)',
              })}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '0 32px', overflowX: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
