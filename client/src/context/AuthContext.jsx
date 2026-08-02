import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  useEffect(() => {
    if (token) {
      // In a real app, decode JWT or fetch profile to get role. For now, assume it's in localStorage too.
      const storedRole = localStorage.getItem('role');
      const storedUserId = localStorage.getItem('userId');
      if (storedRole) {
        setUser({ role: storedRole, id: storedUserId || null });
      }
    }
  }, [token]);

  const login = (newToken, role, userId) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('role', role);
    if (userId) localStorage.setItem('userId', userId);
    setToken(newToken);
    setUser({ role, id: userId || null });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
