import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  useEffect(() => {
    if (token) {
      // In a real app, decode JWT or fetch profile to get role. For now, assume it's in localStorage too.
      const storedRole = localStorage.getItem('role');
      if (storedRole) {
        setUser({ role: storedRole });
      }
    }
  }, [token]);

  const login = (newToken, role) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('role', role);
    setToken(newToken);
    setUser({ role });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
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
