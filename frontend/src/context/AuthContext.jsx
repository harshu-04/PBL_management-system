import { createContext, useState, useEffect, useContext } from 'react';
import { loginApi, registerApi, getMeApi } from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Restore session from localStorage on mount ──
  useEffect(() => {
    const restore = async () => {
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser(parsed);
          setToken(parsed.token);

          // Optionally verify token is still valid against backend
          try {
            const res = await getMeApi();
            // Merge fresh data (e.g. teamId updates) with stored token
            const refreshed = { ...res.data, token: parsed.token };
            setUser(refreshed);
            localStorage.setItem('user', JSON.stringify(refreshed));
          } catch {
            // Token expired or invalid — clear session
            localStorage.removeItem('user');
            setUser(null);
            setToken(null);
          }
        }
      } catch {
        localStorage.removeItem('user');
      }
      setLoading(false);
    };
    restore();
  }, []);

  // ── Persist user+token to state and localStorage ──
  const saveAuth = (userData) => {
    setUser(userData);
    setToken(userData.token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // ── Login ──
  const login = async (email, password) => {
    const res = await loginApi(email, password);
    saveAuth(res.data);
    return res.data;
  };

  // ── Register — returns token immediately ──
  const register = async (name, email, password, role) => {
    const res = await registerApi(name, email, password, role);
    saveAuth(res.data);
    return res.data;
  };

  // ── Logout — clear state + localStorage ──
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
