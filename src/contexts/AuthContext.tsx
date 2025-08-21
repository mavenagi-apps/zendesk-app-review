'use client';

import { PropsWithChildren, createContext, useContext } from 'react';

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps extends PropsWithChildren {
  token: string | null; 
}

export function AuthProvider({ token, children }: PropsWithChildren<AuthProviderProps>) {
  const value = {
    token,
    isAuthenticated: Boolean(token),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 