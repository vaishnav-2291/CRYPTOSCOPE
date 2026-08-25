import React, { createContext, useContext, useState, useEffect } from "react";
import api, { subscribeToRealtimeStream } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  // Listen for real-time security events (e.g. password changed on another device)
  useEffect(() => {
    if (!token || !user) return;

    const unsubscribe = subscribeToRealtimeStream((msg) => {
      if (msg.type === "password_changed") {
        const targetUserId = msg.data?.userId;
        const currentUserId = user.id || user._id;
        if (targetUserId && currentUserId && String(targetUserId) === String(currentUserId)) {
          logout();
          window.location.href = "/login?error=" + encodeURIComponent("Your password was recently changed. Please sign in again.");
        }
      }
    });

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [token, user]);

  // Initialize and verify authentication on boot
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        try {
          const res = await api.get("/auth/me");
          if (res.data?.success && res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem("user", JSON.stringify(res.data.user));
          } else {
            logout();
          }
        } catch (err) {
          logout();
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    initAuth();
  }, []);


  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    if (res.data?.token) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem("token", res.data.token);
      if (res.data.refreshToken) {
        localStorage.setItem("refreshToken", res.data.refreshToken);
      }
      localStorage.setItem("user", JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await api.post("/auth/register", { name, email, password });
    if (res.data?.token) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem("token", res.data.token);
      if (res.data.refreshToken) {
        localStorage.setItem("refreshToken", res.data.refreshToken);
      }
      localStorage.setItem("user", JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const loginWithTokens = async (accessToken, refreshToken) => {
    setToken(accessToken);
    localStorage.setItem("token", accessToken);
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }
    try {
      const res = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.data?.success && res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        return res.data.user;
      }
    } catch (err) {
      console.error("Failed to load user profile after OAuth:", err);
    }
    return null;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  };

  const updateUserData = (updatedFields) => {
    setUser((prev) => {
      const next = { ...prev, ...updatedFields };
      localStorage.setItem("user", JSON.stringify(next));
      return next;
    });
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isAdmin: user?.role === "admin",
    loading,
    login,
    loginWithTokens,
    register,
    logout,
    updateUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
