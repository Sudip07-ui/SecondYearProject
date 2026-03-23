import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('rento_user');
    const token = localStorage.getItem('rento_token');
    if (saved && token) {
      setUser(JSON.parse(saved));
      // Re-validate token silently
      API.get('/auth/me')
        .then(r => setUser(r.data.user))
        .catch(() => { localStorage.clear(); setUser(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    localStorage.setItem('rento_token', data.token);
    localStorage.setItem('rento_user',  JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (form) => {
    const { data } = await API.post('/auth/register', form);
    localStorage.setItem('rento_token', data.token);
    localStorage.setItem('rento_user',  JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('rento_token');
    localStorage.removeItem('rento_user');
    setUser(null);
  };

  const updateUser = (updated) => {
    const merged = { ...user, ...updated };
    setUser(merged);
    localStorage.setItem('rento_user', JSON.stringify(merged));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
