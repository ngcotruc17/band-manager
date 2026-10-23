"use client";

import React, { useContext, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import { 
  Music, LogOut, Menu, X, Bell, ChevronDown, 
  Settings, User, Radio, Calendar, DollarSign, BookOpen, 
  CheckSquare, ShieldCheck, Sparkles, Layers, MessageSquare 
} from "lucide-react";
import ProfileModal from "./ProfileModal";

interface NotificationItem {
  _id: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const pathname = usePathname();
  const router = useRouter();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const notiRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data || []);
      setUnreadCount((res.data || []).filter((n: NotificationItem) => !n.isRead).length);
    } catch (error) {
      // Quiet fail if network / auth not ready
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 25000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (notiRef.current && !notiRef.current.contains(target)) setIsNotiOpen(false);
      if (profileRef.current && !profileRef.current.contains(target)) setIsProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user || pathname === "/change-password" || pathname === "/login" || pathname === "/register") return null;

  const navLinks = [
    { href: "/dashboard", label: "Tổng quan", icon: Sparkles },
    { href: "/bookings", label: "Show diễn", icon: Calendar },
    { href: "/rehearsals", label: "Lịch tập", icon: Layers },
    { href: "/live-stand", label: "Live Stage", icon: Radio, highlight: true },
    { href: "/library", label: "Kho bài hát", icon: BookOpen },
    { href: "/checkin", label: "Điểm danh", icon: CheckSquare },
    { href: "/finance", label: "Tài chính", icon: DollarSign },
    { href: "/members", label: "Thành viên", icon: User },
  ];

  const handleNotiClick = async (noti: NotificationItem) => {
    try {
      if (!noti.isRead) {
        await api.put(`/notifications/${noti._id}/read`);
        setNotifications(prev => prev.map(n => n._id === noti._id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setIsNotiOpen(false);
      if (noti.link) router.push(noti.link);
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put(`/notifications/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-black shadow-md shadow-indigo-600/25 group-hover:scale-105 transition-transform relative">
              <Music className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" title="Hệ thống Live Online" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                  SẮC BAND
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-md tracking-wider">
                  PRO
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200/90 shadow-2xs"
                      : link.highlight
                      ? "text-amber-700 bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200/60"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-indigo-600" : link.highlight ? "text-amber-600" : "text-slate-400"}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons & User Dropdown */}
          <div className="flex items-center gap-2.5 shrink-0">

            {/* Notifications Dropdown */}
            <div className="relative" ref={notiRef}>
              <button
                onClick={() => setIsNotiOpen(!isNotiOpen)}
                className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/80 transition-colors cursor-pointer"
                aria-label="Thông báo"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-extrabold text-[9px] flex items-center justify-center animate-bounce">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {isNotiOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 ui-card p-4 z-50 shadow-2xl border border-slate-200">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-indigo-600" />
                      <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">Thông báo ban nhạc</h4>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                      >
                        Đã đọc tất cả
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs font-medium">
                        Không có thông báo mới
                      </div>
                    ) : (
                      notifications.map((noti) => (
                        <div
                          key={noti._id}
                          onClick={() => handleNotiClick(noti)}
                          className={`p-3 rounded-xl cursor-pointer transition-colors border ${
                            noti.isRead 
                              ? "bg-slate-50/70 border-slate-200/80 text-slate-600 hover:bg-slate-100" 
                              : "bg-indigo-50/70 border-indigo-200 text-slate-900 hover:bg-indigo-50 font-semibold"
                          }`}
                        >
                          <p className="text-xs leading-relaxed">{noti.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                            {new Date(noti.createdAt).toLocaleString("vi-VN")}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      href="/notifications"
                      onClick={() => setIsNotiOpen(false)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Xem toàn bộ thông báo</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profile & User Avatar Menu */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-black text-xs text-white">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="hidden sm:block text-left pr-1">
                  <span className="text-xs font-bold text-slate-900 block truncate max-w-[110px]">
                    {user.fullName}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block mr-1" />
              </button>

              {/* Profile Popover Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 ui-card p-2 z-50 shadow-2xl border border-slate-200">
                  <div className="p-3 border-b border-slate-100 mb-1">
                    <p className="text-xs font-black text-slate-900 truncate">{user.fullName}</p>
                    <p className="text-[11px] text-slate-400 truncate">@{user.username}</p>
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{user.role.toUpperCase()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      setShowProfileModal(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-indigo-600" />
                    <span>Cài đặt cá nhân</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors mt-1 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="xl:hidden p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMenuOpen && (
          <div className="xl:hidden p-4 bg-white/95 backdrop-blur-md border-b border-slate-200 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-bold ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <ProfileModal 
          user={user}
          onClose={() => setShowProfileModal(false)}
          onUpdateSuccess={() => window.location.reload()}
        />
      )}
    </>
  );
}
