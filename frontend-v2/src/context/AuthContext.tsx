"use client";

import React, { createContext, useState, useEffect, ReactNode } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

export interface UserProfile {
  _id: string;
  fullName: string;
  email?: string;
  phone?: string;
  username: string;
  role: "admin" | "member" | "viewer";
  status: "pending" | "active" | "banned";
  instrument: string;
  isApproved: boolean;
  mustChangePassword: boolean;
  walletBalance?: number;
  points?: number;
  attendanceRate?: number;
  totalFinePaid?: number;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (formData: any) => Promise<any>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {}
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Tải thông tin tài khoản khi load lại trang
  const loadUser = async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
    } catch (error: any) {
      console.error("Lỗi xác thực:", error.response?.data?.message);
      localStorage.removeItem("token");
      setUser(null);
      if (error.response?.status === 403) {
        toast.error("Phiên đăng nhập hết hạn hoặc tài khoản chưa được duyệt!");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (formData: any) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", formData);
      localStorage.setItem("token", res.data.token);
      setUser(res.data);
      toast.success("Đăng nhập thành công! 🎸");
      return res.data;
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Sai tên đăng nhập hoặc mật khẩu";
      toast.error(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    toast.success("Đã đăng xuất");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
