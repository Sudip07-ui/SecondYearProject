import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

const Login = () => {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from || '/';

  const [form, setForm]     = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.first_name}! 🎉`);
      if (user.role === 'admin' || user.role === 'staff') navigate('/admin');
      else navigate(from === '/login' ? '/' : from);
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="auth-logo">🛵 Rento</Link>
          <h1>Welcome Back</h1>
          <p>Sign in to your account to continue</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input name="email" type="email" className="form-control" placeholder="you@example.com"
              value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-icon-wrap">
              <input name="password" type={showPwd ? 'text' : 'password'} className="form-control"
                placeholder="Your password" value={form.password} onChange={handleChange} required />
              <button type="button" className="eye-btn" onClick={() => setShowPwd(p => !p)}>
                {showPwd ? '' : ''}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
            {loading ? <><span className="spinner" /> Signing in...</> : 'Sign In'}
          </button>
        </form>



        <p className="auth-link">Don't have an account? <Link to="/register">Create one →</Link></p>
      </div>
    </div>
  );
};

export default Login;
