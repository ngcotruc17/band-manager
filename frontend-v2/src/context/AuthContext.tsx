"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "../services/api";
import toast from "react-hot-toast";

export type UserRole = "admin" | "manager" | "staff" | "lecturer" | "student" | "member" | "system" | "viewer";

export interface UserProfile {
  _id: string;
  fullName: string;
  email?: string;
  phone?: string;
  username: string;
  role: UserRole;
  status: "pending" | "active" | "banned";
  instrument: string;
  isApproved: boolean;
  mustChangePassword: boolean;
  walletBalance?: number;
  points?: number;
  attendanceRate?: number;
  totalFinePaid?: number;
}

export interface LoginCredentials {
  username?: string;
  password?: string;
  [key: string]: unknown;
}

export interface LoginResponse {
  token: string;
  mustChangePassword?: boolean;
  _id?: string;
  username?: string;
  fullName?: string;
  role?: UserRole;
  [key: string]: unknown;
}

interface AxiosErrorLike {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
}

export type AuthChannelMessage =
  | { type: "LOGOUT"; timestamp: number }
  | { type: "LOGIN"; token: string; user?: UserProfile; timestamp: number };

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  setUser: (user: UserProfile | null) => void;
  updateUser: (updatedUser: Partial<UserProfile>) => void;
  refreshUser: () => Promise<void>;
  login: (formData: LoginCredentials) => Promise<LoginResponse>;
  logout: (broadcast?: boolean) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  updateUser: () => {},
  refreshUser: async () => {},
  login: async () => ({ token: "" }),
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const router = useRouter();
  const authChannelRef = useRef<BroadcastChannel | null>(null);
  const userRef = useRef<UserProfile | null>(user);
  const lastLogoutTimestampRef = useRef<number>(0);
  const lastLoginTimestampRef = useRef<number>(0);

  // Luôn đồng bộ userRef với state user
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const updateUser = useCallback((updated: Partial<UserProfile>) => {
    setUser((prev) => (prev ? { ...prev, ...updated } : null));
  }, []);

  const refreshUser = useCallback(async () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await api.get<UserProfile>("/auth/me");
      setUser(res.data);
    } catch (error: unknown) {
      console.error("Lỗi làm mới thông tin user:", error);
    }
  }, []);

  /**
   * Xử lý đăng xuất từ tab khác gửi qua BroadcastChannel hoặc storage event
   */
  const handleRemoteLogout = useCallback(() => {
    const now = Date.now();
    // Chống xử lý trùng lặp nếu cả BroadcastChannel và storage event cùng kích hoạt
    if (now - lastLogoutTimestampRef.current < 1000) {
      return;
    }
    lastLogoutTimestampRef.current = now;

    const hadToken = typeof window !== "undefined" && !!localStorage.getItem("token");
    const hadUser = !!userRef.current;

    localStorage.removeItem("token");
    setUser(null);

    if (hadToken || hadUser) {
      toast.error("Phiên làm việc đã kết thúc từ tab khác");
      router.push("/login");
    }
  }, [router]);

  /**
   * Xử lý đăng nhập thành công từ tab khác gửi qua BroadcastChannel hoặc storage event
   */
  const handleRemoteLogin = useCallback(async (token: string, newUser?: UserProfile) => {
    const now = Date.now();
    if (now - lastLoginTimestampRef.current < 1000) {
      return;
    }
    lastLoginTimestampRef.current = now;

    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
    }

    if (newUser) {
      setUser(newUser);
    } else {
      try {
        const res = await api.get<UserProfile>("/auth/me");
        setUser(res.data);
      } catch (err) {
        console.error("Lỗi đồng bộ thông tin user từ tab khác:", err);
      }
    }
  }, []);

  // Khởi tạo BroadcastChannel và Fallback storage listener
  useEffect(() => {
    if (typeof window === "undefined") return;

    let channel: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      try {
        channel = new BroadcastChannel("auth_channel");
        authChannelRef.current = channel;

        channel.onmessage = (event: MessageEvent<AuthChannelMessage>) => {
          if (!event.data) return;
          if (event.data.type === "LOGOUT") {
            handleRemoteLogout();
          } else if (event.data.type === "LOGIN") {
            handleRemoteLogin(event.data.token, event.data.user);
          }
        };
      } catch (err) {
        console.warn("BroadcastChannel không được hỗ trợ hoặc khởi tạo thất bại:", err);
      }
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token") {
        if (!e.newValue) {
          // Token bị xóa ở tab khác
          handleRemoteLogout();
        } else if (e.newValue) {
          // Token được cập nhật ở tab khác
          handleRemoteLogin(e.newValue);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      if (channel) {
        channel.close();
        authChannelRef.current = null;
      }
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [handleRemoteLogout, handleRemoteLogin]);

  useEffect(() => {
    let isCancelled = false;

    const initAuth = async () => {
      // Async boundary ensures setState is never called synchronously inside effect
      await Promise.resolve();
      if (isCancelled) return;

      if (typeof window === "undefined") return;
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get<UserProfile>("/auth/me");
        if (!isCancelled) {
          setUser(res.data);
        }
      } catch (error: unknown) {
        if (!isCancelled) {
          const axiosError = error as AxiosErrorLike;
          console.error("Lỗi xác thực:", axiosError.response?.data?.message);
          localStorage.removeItem("token");
          setUser(null);
          if (axiosError.response?.status === 403) {
            toast.error("Phiên đăng nhập hết hạn hoặc tài khoản chưa được duyệt!");
          }
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isCancelled = true;
    };
  }, []);

  const login = async (formData: LoginCredentials): Promise<LoginResponse> => {
    setLoading(true);
    try {
      const res = await api.post<LoginResponse & UserProfile>("/auth/login", formData);
      localStorage.setItem("token", res.data.token);
      const userProfile = res.data as unknown as UserProfile;
      setUser(userProfile);
      toast.success("Đăng nhập thành công!");

      // Broadcast sự kiện LOGIN sang các tab khác
      try {
        authChannelRef.current?.postMessage({
          type: "LOGIN",
          token: res.data.token,
          user: userProfile,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error("Lỗi broadcast LOGIN:", err);
      }

      return res.data;
    } catch (err: unknown) {
      const axiosError = err as AxiosErrorLike;
      let errMsg = "Sai tên đăng nhập hoặc mật khẩu";
      if (axiosError.response?.data?.message) {
        errMsg = axiosError.response.data.message;
      } else if (!axiosError.response) {
        errMsg = "Không thể kết nối đến máy chủ backend (lỗi mạng hoặc CORS). Vui lòng thử lại sau vài giây!";
      } else if (axiosError.response.status && axiosError.response.status >= 500) {
        errMsg = `Máy chủ đang gặp sự cố (${axiosError.response.status}). Vui lòng kiểm tra lại log hệ thống!`;
      }
      toast.error(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback((broadcast: boolean = true) => {
    localStorage.removeItem("token");
    setUser(null);
    if (broadcast) {
      try {
        authChannelRef.current?.postMessage({
          type: "LOGOUT",
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error("Lỗi broadcast LOGOUT:", err);
      }
      toast.success("Đã đăng xuất");
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, updateUser, refreshUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
