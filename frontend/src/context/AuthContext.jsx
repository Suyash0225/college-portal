import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getMe, logout as apiLogout } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    try { return JSON.parse(localStorage.getItem("admin_user") || "null"); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await getMe();
      setAdmin(data.admin);
      localStorage.setItem("admin_user", JSON.stringify(data.admin));
    } catch {
      setAdmin(null);
      localStorage.removeItem("admin_user");
      localStorage.removeItem("auth_token");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
    const handler = () => {
      setAdmin(null);
      localStorage.removeItem("admin_user");
      localStorage.removeItem("auth_token");
    };
    window.addEventListener("auth:logout", handler);
    return () => window.removeEventListener("auth:logout", handler);
  }, [fetchMe]);

  const signIn = (adminData, token) => {
    setAdmin(adminData);
    localStorage.setItem("admin_user", JSON.stringify(adminData));
    if (token) localStorage.setItem("auth_token", token);
  };

  const signOut = async () => {
    await apiLogout().catch(() => {});
    setAdmin(null);
    localStorage.removeItem("admin_user");
    localStorage.removeItem("auth_token");
  };

  return (
    <AuthContext.Provider value={{ admin, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
