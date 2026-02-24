"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface user {
  _id: string;
  email: string;
  role: 'Participant' | 'Organizer' | 'Admin';
  firstName?: string;
  lastName?: string;
}

interface authcontx {
  user: user | null;
  token: string | null;
  login: (token: string, user: user, redirect?: string) => void;
  logout: () => void;
  loading: boolean;
  isauth: boolean;
}

const authcontext = createContext<authcontx | undefined>(undefined);

export const AuthProvider = ({children}: { children: ReactNode }) => {
  const [user, setuser] = useState<user | null>(null);
  const [token, settoken] = useState<string | null>(null);
  const [loading, setloading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const storedtoken = localStorage.getItem('token');
    const storeduser = localStorage.getItem('user');

    if (storeduser && storedtoken) {
      try {
        settoken(storedtoken);
        setuser(JSON.parse(storeduser));
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } 
    }

    setloading(false);
  }, []);

  const login = (newtoken: string, userdata: user, redirect?: string) => {
    localStorage.setItem('token', newtoken);
    localStorage.setItem('user', JSON.stringify(userdata));
    settoken(newtoken);
    setuser(userdata);

    if (redirect) {
      router.push(redirect);
    } else if (userdata.role === 'Admin') {
      router.push('/admin');
    } else if (userdata.role === 'Organizer') {
      router.push('/organizer');
    } else {
      router.push('/dashboard');
    }
  }

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    settoken(null);
    setuser(null);
    router.push('/login');
  };

  return (
    <authcontext.Provider value={{
      user, token, login, logout, loading, isauth: !!user && !!token
    }}>
      {children}
    </authcontext.Provider>
  );
};

export const useauth = () => {
  const ctx = useContext(authcontext);
  if (!ctx) throw new Error('useauth must be used within authprovider');
  return ctx;
}
