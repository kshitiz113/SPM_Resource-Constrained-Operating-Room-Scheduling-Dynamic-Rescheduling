import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../api/endpoints';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: { username: string; password: string; fullName: string; email: string; roles?: UserRole[] }) => Promise<void>;
  updateUser: (updatedUser: User) => void;
  quickLogin: (role: UserRole) => Promise<void>;
  logout: () => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });

  useEffect(() => {
    if (token && !user) {
      api.auth.getCurrentUser()
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        })
        .catch(() => {
          const saved = localStorage.getItem('user');
          if (saved) {
            try {
              setUser(JSON.parse(saved));
              return;
            } catch (_) {}
          }
          logout();
        });
    }
  }, [token]);

  const login = async (username: string, password: string) => {
    const res = await api.auth.login({ username, password });
    const { token: jwt, user: u } = res.data;
    setToken(jwt);
    setUser(u);
    localStorage.setItem('token', jwt);
    localStorage.setItem('user', JSON.stringify(u));
  };

  const register = async (data: { username: string; password: string; fullName: string; email: string; roles?: UserRole[] }) => {
    const res = await api.auth.register(data);
    const { token: jwt, user: u } = res.data;
    setToken(jwt);
    setUser(u);
    localStorage.setItem('token', jwt);
    localStorage.setItem('user', JSON.stringify(u));
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const quickLogin = async (role: UserRole) => {
    const credentialsMap: Record<UserRole, { u: string; p: string }> = {
      ADMIN: { u: 'admin', p: 'password123' },
      OR_MANAGER: { u: 'ormanager', p: 'password123' },
      SCHEDULER: { u: 'scheduler1', p: 'password123' },
      CLINICAL_STAFF: { u: 'dr.alice', p: 'password123' },
    };
    const creds = credentialsMap[role];
    await login(creds.u, creds.p);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user || !user.roles) return false;
    const checkRoles = Array.isArray(roles) ? roles : [roles];
    return user.roles.some((r) => checkRoles.includes(r));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        login,
        register,
        updateUser,
        quickLogin,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
