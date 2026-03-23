import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import toast from 'react-hot-toast';

const statusInfo = {
  pending:   { color: '#854d0e', bg: '#fef9c3', icon: '', label: 'Awaiting Admin Approval' },
  confirmed: { color: '#1e40af', bg: '#dbeafe', icon: '', label: 'Approved — Pay to Confirm' },
  active:    { color: '#166534', bg: '#dcfce7', icon: '', label: 'Active — Currently Rented' },
  completed: { color: '#374151', bg: '#f3f4f6', icon: '', label: 'Completed' },
  cancelled: { color: '#991b1b', bg: '#fee2e2', icon: '', label: 'Cancelled' },
};

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);

  function load() {
    setLoading(true);
    API.get('/bookings/my')
      .then(r => setBookings(r.data.bookings || []))
      .catch(() => toast.error('Failed to load bookings'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function cancelBooking(id) {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    API.put(`/bookings/${id}/cancel`)
      .then(() => { toast.success('Booking cancelled.'); load(); })
      .catch(err => toast.error(err.response?.data?.message || 'Cancel failed.'));
  }

  if (loading) return (
    <div className="container" style={{ padding: '60px 0', textAlign: 'center', color: 'var(--gray-500)' }}>
      Loading your bookings...
    </div>
  );

  return (
    <div className="container" style={{ padding: '32px 0 64px' }}>
      <div className="page-header">
        <h1 className="page-title"> My Bookings</h1>
        <p style={{ color: 'var(--gray-500)', marginTop: 4 }}>Track all your vehicle rental history</p>
      </div>

      {bookings.length === 0 ? (
        <div className="empty-state">
          <div className="icon"></div>
          <h3>No bookings yet</h3>
          <p>Browse our vehicles and make your first booking!</p>
          <Link to="/vehicles" className="btn btn-primary" style={{ marginTop: 16 }}>Browse Vehicles</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {bookings.map(b => {
            const info = statusInfo[b.status] || statusInfo.pending;
            return (
              <div key={b.id} className="card">
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 20 }}>
                    <img
                      src={b.image_url || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=300'}
                      alt={b.model_name}
                      style={{ width: 90, height: 68, objectFit: 'cover', borderRadius: 10 }}
                      onError={e => { e.target.src = 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=300'; }}
                    />
                    <div>
                      {/* Top row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                        <div>
                          <strong style={{ fontSize: 16, color: 'var(--secondary)' }}>
                            {b.brand} {b.model_name}
                          </strong>
                          <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--gray-500)' }}>
                            Booking #{b.id}
                          </span>
                        </div>
                        {/* Status badge */}
                        <span style={{ padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 700,
                          background: info.bg, color: info.color, display: 'flex', alignItems: 'center', gap: 5 }}>
                          {info.icon} {info.label}
                        </span>
                      </div>

                      {/* Details row */}
                      <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--gray-500)', flexWrap: 'wrap', marginBottom: 12 }}>
                        <span>{new Date(b.start_date).toLocaleDateString()} → {new Date(b.end_date).toLocaleDateString()}</span>
                        <span>{b.total_days} day{b.total_days > 1 ? 's' : ''}</span>
                        <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 14 }}>
                          NPR {parseFloat(b.total_price).toLocaleString()}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>

                        {/* CONFIRMED by admin → show Pay Now */}
                        {b.status === 'confirmed' && (
                          <Link to={`/payment/${b.id}`} className="btn btn-primary btn-sm">
                             Pay Now – NPR {parseFloat(b.total_price).toLocaleString()}
                          </Link>
                        )}

                        {/* PENDING → waiting message */}
                        {b.status === 'pending' && (
                          <div style={{ fontSize: 13, color: '#854d0e', background: '#fef9c3',
                            padding: '6px 14px', borderRadius: 8, fontWeight: 600 }}>
                            Waiting for admin to approve your booking
                          </div>
                        )}

                        {/* COMPLETED → review */}
                        {b.status === 'completed' && (
                          <Link to={`/review/${b.id}`} className="btn btn-outline btn-sm">
                             Write Review
                          </Link>
                        )}

                        {/* ACTIVE → info */}
                        {b.status === 'active' && (
                          <div style={{ fontSize: 13, color: '#166534', background: '#dcfce7',
                            padding: '6px 14px', borderRadius: 8, fontWeight: 600 }}>
                            Your vehicle is currently active
                          </div>
                        )}

                        {/* Cancel button for pending or confirmed */}
                        {(b.status === 'pending' || b.status === 'confirmed') && (
                          <button className="btn btn-danger btn-sm" onClick={() => cancelBooking(b.id)}>
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyBookings;
