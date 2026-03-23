import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();
  const [menuOpen, setMenuOpen]           = useState(false);
  const [notifOpen, setNotifOpen]         = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]               = useState(0);
  const notifRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    API.get('/notifications').then(r => {
      setNotifications(r.data.notifications || []);
      setUnread(r.data.unread || 0);
    }).catch(() => {});
  }, [user, location.pathname]);

  useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  const markRead = async (id) => {
    await API.put(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await API.put('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnread(0);
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff';

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <span className="brand-icon">🛵</span>
          <span className="brand-text">Rento</span>
        </Link>

        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/vehicles" className={`nav-link ${isActive('/vehicles') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
            Browse Vehicles
          </Link>
          {user && !isAdminOrStaff && (
            <>
              <Link to="/my-bookings" className={`nav-link ${isActive('/my-bookings') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                My Bookings
              </Link>
              <Link to="/verification" className={`nav-link ${isActive('/verification') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                Verification
              </Link>
            </>
          )}
          {isAdminOrStaff && (
            <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
              Dashboard
            </Link>
          )}
        </div>

        <div className="nav-actions">
          {user ? (
            <>
              {/* Notifications Bell */}
              <div className="notif-wrap" ref={notifRef}>
                <button className="notif-btn" onClick={() => setNotifOpen(!notifOpen)}>
                  🔔
                  {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
                </button>
                {notifOpen && (
                  <div className="notif-dropdown">
                    <div className="notif-header">
                      <span>Notifications</span>
                      {unread > 0 && <button onClick={markAllRead} className="mark-all-btn">Mark all read</button>}
                    </div>
                    <div className="notif-list">
                      {notifications.length === 0 ? (
                        <div className="notif-empty">No notifications yet</div>
                      ) : notifications.slice(0, 10).map(n => (
                        <div key={n.id} className={`notif-item ${!n.is_read ? 'unread' : ''}`} onClick={() => markRead(n.id)}>
                          <div className="notif-type-icon">{n.type === 'booking' ? '📅' : n.type === 'payment' ? '💳' : n.type === 'verification' ? '✅' : '🔔'}</div>
                          <div>
                            <div className="notif-title">{n.title}</div>
                            <div className="notif-msg">{n.message}</div>
                            <div className="notif-time">{new Date(n.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User menu */}
              <div className="user-menu">
                <Link to="/profile" className="user-avatar-btn">
                  <div className="avatar">{user.first_name?.[0]}{user.last_name?.[0]}</div>
                  <span className="user-name hide-mobile">{user.first_name}</span>
                </Link>
                <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
              </div>
            </>
          ) : (
            <div className="auth-btns">
              <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </div>
          )}
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
