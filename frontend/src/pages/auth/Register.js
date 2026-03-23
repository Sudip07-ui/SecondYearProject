import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    password: '', confirm_password: '', date_of_birth: '', address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    if (form.password !== form.confirm_password) return 'Passwords do not match.';
    if (form.password.length < 8) return 'Password must be at least 8 characters.';
    if (!/[0-9]/.test(form.password)) return 'Password must contain at least 1 number.';
    if (!/[!@#$%^&*]/.test(form.password)) return 'Password must contain at least 1 special character (!@#$%^&*).';
    if (form.date_of_birth) {
      const age = (Date.now() - new Date(form.date_of_birth)) / (365.25 * 86400000);
      if (age < 18) return 'You must be at least 18 years old to register.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError(''); setLoading(true);
    try {
      const { confirm_password, ...payload } = form;
      await register(payload);
      toast.success('Account created successfully! ');
      navigate('/verification');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const pwdStrength = () => {
    const p = form.password;
    if (!p) return null;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[!@#$%^&*]/.test(p)) score++;
    if (p.length >= 12) score++;
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'];
    return { score, label: labels[score], color: colors[score] };
  };
  const strength = pwdStrength();

  return (
    <div className="auth-page">
      <div className="auth-card wide">
        <div className="auth-header">
          <Link to="/" className="auth-logo">🛵 Rento</Link>
          <h1>Create Account</h1>
          <p>Join Nepal's simplest vehicle rental platform</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input name="first_name" className="form-control" placeholder="John" value={form.first_name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input name="last_name" className="form-control" placeholder="Doe" value={form.last_name} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input name="email" type="email" className="form-control" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input name="phone" type="tel" className="form-control" placeholder="98XXXXXXXX" value={form.phone} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date of Birth (min. 18 yrs)</label>
              <input name="date_of_birth" type="date" className="form-control" value={form.date_of_birth} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input name="address" className="form-control" placeholder="Kathmandu, Nepal" value={form.address} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Password *</label>
              <div className="input-icon-wrap">
                <input name="password" type={showPwd ? 'text' : 'password'} className="form-control"
                  placeholder="Min 8 chars, 1 number, 1 special" value={form.password} onChange={handleChange} required />
                <button type="button" className="eye-btn" onClick={() => setShowPwd(p => !p)}>{showPwd ? '🙈' : '👁️'}</button>
              </div>
              {strength && (
                <div className="pwd-strength">
                  <div className="pwd-bar"><div style={{width:`${strength.score*25}%`,background:strength.color}} /></div>
                  <span style={{color:strength.color,fontSize:'11px',fontWeight:'600'}}>{strength.label}</span>
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <input name="confirm_password" type="password" className="form-control"
                placeholder="Re-enter password" value={form.confirm_password} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-group">
            <label style={{display:'flex',gap:'8px',alignItems:'flex-start',fontSize:'13px',cursor:'pointer'}}>
              <input type="checkbox" required style={{marginTop:'2px'}} />
              I confirm I am 18+ years old and agree to the <Link to="/terms" style={{color:'var(--primary)'}}>Terms of Service</Link>
            </label>
          </div>
          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
            {loading ? <><span className="spinner" /> Creating account...</> : 'Create Account →'}
          </button>
        </form>

        <p className="auth-link">Already have an account? <Link to="/login">Sign in →</Link></p>
      </div>
    </div>
  );
};

export default Register;
