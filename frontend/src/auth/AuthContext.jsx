import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import instance, {
  SESSION_EXPIRED_EVENT,
  setAuthToken,
} from "../api/axiosInstance";

const AuthContext = createContext(null);
const TOKEN_KEY = "cms.auth.token";
const USER_KEY = "cms.auth.user";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [initializing, setInitializing] = useState(Boolean(token));

  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setAuthToken(null);
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const handleSessionExpired = () => {
      clearSession();
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, []);

  useEffect(() => {
    setAuthToken(token);
    if (!token) {
      setInitializing(false);
      return;
    }

    instance
      .get("auth/me/")
      .then((res) => {
        setUser(res.data);
        localStorage.setItem(USER_KEY, JSON.stringify(res.data));
      })
      .catch(() => {
        clearSession();
      })
      .finally(() => setInitializing(false));
  }, [token]);

  const login = async (credentials) => {
    const res = await instance.post("auth/login/", credentials);
    localStorage.setItem(TOKEN_KEY, res.data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
    setAuthToken(res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = async () => {
    try {
      await instance.post("auth/logout/");
    } finally {
      clearSession();
    }
  };

  const value = useMemo(
    () => ({
      token,
      user,
      role: user?.role,
      permissions: user?.permissions || [],
      initializing,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
    }),
    [token, user, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
