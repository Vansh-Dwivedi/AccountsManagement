import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    token: localStorage.getItem('token'),
    isAuthenticated: null,
    user: null,
  });

  useEffect(() => {
    const loadUser = async () => {
      if (authState.token) {
        try {
          const res = await api.get('/users/profile');
          setAuthState({
            ...authState,
            isAuthenticated: true,
            user: res.data,
          });
        } catch (error) {
          setAuthState({
            ...authState,
            token: null,
            isAuthenticated: false,
            user: null,
          });
        }
      } else {
        setAuthState({
          ...authState,
          isAuthenticated: false,
        });
      }
    };

    loadUser();
  }, [authState.token]);

  return (
    <AuthContext.Provider value={{ authState, setAuthState }}>
      {children}
    </AuthContext.Provider>
  );
};