import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import toast from 'react-hot-toast';

function Profile() {
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    first_name:    user?.first_name || '',
    last_name:     user?.last_name  || '',
    phone:         user?.phone      || '',
    address:       user?.address    || '',
    date_of_birth: user?.date_of_birth?.split('T')[0] || '',
  });
  const [pwd, setPwd]         = useState({ current_password: '', new_password: '', confirm: '' });
  const [saving, setSaving]   = useState(false);
  const [pwdSave, setPwdSave] = useState(false);
  const [tab, setTab]         = useState('profile');

  function handleChange(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }
  function handlePwd(e)    { setPwd(p  => ({ ...p,  [e.target.name]: e.target.value })); }

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await API.put('/auth/profile', form);
      updateUser(form);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally { setSaving(false); }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (pwd.new_password !== pwd.confirm) { toast.error('Passwords do not match.'); return; }
    if (pwd.new_password.length < 8)      { toast.error('Min 8 characters.'); return; }
    setPwdSave(true);
    try {
      await API.put('/auth/change-password', { current_password: pwd.current_password, new_password: pwd.new_password });
      toast.success('Password changed!');
      setPwd({ current_password: '', new_password: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    } finally { setPwdSave(false); }
  }

  const tabs = [
    { key: 'profile',  label: ' Profile' },
    { key: 'password', label: ' Password' },
  ];

  return (
    <div className="container" style={{ padding: '32px 0 80px', maxWidth: 640 }}>
      <h1 className="page-title">My Account</h1>

      {/* Role badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0 28px' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-head)' }}>
          {user?.first_name?.[0]}{user?.last_name?.[0]}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{user?.first_name} {user?.last_name}</div>
          <span className={`badge ${user?.role === 'admin' ? 'badge-danger' : user?.role === 'staff' ? 'badge-info' : 'badge-success'}`}>
            {user?.role}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid var(--border)', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
              color: tab === t.key ? 'var(--primary)' : 'var(--gray-500)',
              borderBottom: tab === t.key ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -2, transition: 'all .2s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === 'profile' && (
        <div className="card">
          <div className="card-body">
            <h3 style={{ marginBottom: 20, color: 'var(--secondary)' }}>Personal Information</h3>
            <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input name="first_name" className="form-control" value={form.first_name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input name="last_name" className="form-control" value={form.last_name} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-control" value={user?.email} disabled style={{ background: 'var(--gray-100)', cursor: 'not-allowed' }} />
                <small style={{ color: 'var(--gray-500)', fontSize: 12 }}>Email cannot be changed.</small>
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input name="phone" className="form-control" value={form.phone} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input name="date_of_birth" type="date" className="form-control" value={form.date_of_birth} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea name="address" className="form-control" rows={2} value={form.address} onChange={handleChange} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><span className="spinner" /> Saving...</> : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Password tab */}
      {tab === 'password' && (
        <div className="card">
          <div className="card-body">
            <h3 style={{ marginBottom: 20, color: 'var(--secondary)' }}>Change Password</h3>
            <form onSubmit={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input name="current_password" type="password" className="form-control" value={pwd.current_password} onChange={handlePwd} required />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input name="new_password" type="password" className="form-control" placeholder="Min 8 chars" value={pwd.new_password} onChange={handlePwd} required />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input name="confirm" type="password" className="form-control" value={pwd.confirm} onChange={handlePwd} required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={pwdSave}>
                {pwdSave ? <><span className="spinner" /> Saving...</> : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
