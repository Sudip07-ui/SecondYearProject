import React, { useState, useEffect } from 'react';
import API from '../../utils/api';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['', 'pending', 'confirmed', 'active', 'completed', 'cancelled'];
const statusColor = { pending:'badge-warning', confirmed:'badge-info', active:'badge-success', completed:'badge-secondary', cancelled:'badge-danger' };

function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('');

  function load(status) {
    setLoading(true);
    const q = status ? `?status=${status}` : '';
    API.get(`/bookings${q}`)
      .then(r => setBookings(r.data.bookings || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(filter); }, [filter]);

  async function updateStatus(id, status) {
    try {
      await API.put(`/bookings/${id}/status`, { status });
      toast.success(`Booking marked as ${status}.`);
      load(filter);
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed.'); }
  }

  return (
    <div style={{ padding: '24px 0 64px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">📅 All Bookings</h1>
        <p style={{ color: 'var(--gray-500)', fontSize: 14, marginTop: 4 }}>View and manage all customer bookings</p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {STATUS_OPTIONS.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--gray-500)' }}>Loading bookings...</div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>#</th><th>Customer</th><th>Vehicle</th><th>Dates</th><th>Days</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600 }}>#{b.id}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{b.first_name} {b.last_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{b.email}</div>
                    </td>
                    <td style={{ fontSize: 14 }}>{b.brand} {b.model_name}</td>
                    <td style={{ fontSize: 12 }}>
                      {new Date(b.start_date).toLocaleDateString()}<br />
                      → {new Date(b.end_date).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'center' }}>{b.total_days}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>NPR {parseFloat(b.total_price).toLocaleString()}</td>
                    <td><span className={`badge ${statusColor[b.status] || 'badge-secondary'}`}>{b.status}</span></td>
                    <td>
                      <select
                        value={b.status}
                        onChange={e => updateStatus(b.id, e.target.value)}
                        style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12, cursor: 'pointer' }}>
                        <option value="pending">pending</option>
                        <option value="confirmed">confirmed</option>
                        <option value="active">active</option>
                        <option value="completed">completed</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--gray-500)' }}>No bookings found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminBookings;
