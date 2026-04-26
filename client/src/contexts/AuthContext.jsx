import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('grubsync_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  const setSession = (data) => {
    localStorage.setItem('grubsync_token', data.token);
    localStorage.setItem('grubsync_user', JSON.stringify(data));
    setUser(data);
  };

  const login = async (values) => {
    const { data } = await api.post('/auth/login', values);
    setSession(data);
    return data;
  };

  const register = async (values) => {
    const { data } = await api.post('/auth/register', values);
    setSession(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('grubsync_token');
    localStorage.removeItem('grubsync_user');
    setUser(null);
  };

  useEffect(() => {
    const token = localStorage.getItem('grubsync_token');
    if (!user && token) {
      setLoading(true);
      api.get('/auth/me')
        .then(({ data }) => setUser(data))
        .catch(() => logout())
        .finally(() => setLoading(false));
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
