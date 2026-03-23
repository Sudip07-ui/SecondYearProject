import React, { useState, useEffect } from 'react';
import API from '../../utils/api';
import toast from 'react-hot-toast';

const verificationColor = { approved: 'badge-success', pending: 'badge-warning', rejected: 'badge-danger' };

function AdminUsers() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  function load() {
    setLoading(true);
    API.get('/admin/users').then(r => setUsers(r.data.users || [])).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function toggleUser(id) {
    try {
      await API.put(`/admin/users/${id}/toggle`);
      toast.success('User status updated.');
      load();
    } catch { toast.error('Failed.'); }
  }

  async function deleteUser(id, name) {
    if (!window.confirm(`Permanently delete account of "${name}"?\n\nThis will also delete all their bookings and data. This cannot be undone.`)) return;
    try {
      await API.delete(`/admin/users/${id}`);
      toast.success(`Account of ${name} deleted.`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed.'); }
  }

  const filtered = users.filter(u =>
    `${u.first_name} ${u.last_name} ${u.email} ${u.phone}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '24px 0 64px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">👥 Users</h1>
        <p style={{ color: 'var(--gray-500)', fontSize: 14, marginTop: 4 }}>Manage all registered customers and staff</p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input className="form-control" style={{ maxWidth: 320 }} placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--gray-500)' }}>Loading...</div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>User</th><th>Phone</th><th>Role</th><th>Verification</th><th>Bookings</th><th>Joined</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                          {u.first_name?.[0]}{u.last_name?.[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{u.first_name} {u.last_name}</div>
                          <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{u.phone}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-danger' : u.role === 'staff' ? 'badge-info' : 'badge-secondary'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {u.verification_status ? (
                        <span className={`badge ${verificationColor[u.verification_status] || 'badge-secondary'}`}>
                          {u.verification_status}
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>Not submitted</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>{u.total_bookings || 0}</td>
                    <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {u.role !== 'admin' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-success'}`}
                            onClick={() => toggleUser(u.id)}>
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button className="btn btn-sm btn-danger"
                            onClick={() => deleteUser(u.id, u.first_name + ' ' + u.last_name)}
                            style={{ background: '#7f1d1d', color: '#fff' }}>
                            🗑️ Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--gray-500)' }}>No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
