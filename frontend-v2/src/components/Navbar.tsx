"use client";
 
import React, { useContext, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import { Music, LogOut, Menu, X, Bell, Info, ChevronDown, Settings } from "lucide-react";
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
 
  // Nạp thông báo từ API thực tế
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data || []);
      setUnreadCount((res.data || []).filter((n: NotificationItem) => !n.isRead).length);
    } catch (error) {
      console.error("Lỗi nạp thông báo:", error);
    }
  };
 
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);
 
  // Nhấp chuột ra ngoài để đóng dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (notiRef.current && !notiRef.current.contains(target)) setIsNotiOpen(false);
      if (profileRef.current && !profileRef.current.contains(target)) setIsProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
 
  if (!user || pathname === "/change-password") return null;
 
  const handleNotiClick = async (noti: NotificationItem) => {
    try {
      if (!noti.isRead) {
        await api.put(`/notifications/${noti._id}/read`);
        setNotifications(prev => prev.map(n => n._id === noti._id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setIsNotiOpen(false);
      if (noti.link) {
        router.push(noti.link);
      }
    } catch (error) {
      console.error(error);
    }
  };
 
  const handleMarkAllRead = async () => {
    try {
      await api.put(`/notifications/mark-all-read`);
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
 
  const handleUpdateSuccess = (updatedUser: any) => {
    // Reload local profile hoặc force refresh
    window.location.reload();
  };
 
  const navItems = [
    { name: "Tổng quan", path: "/dashboard" },
    { name: "Lịch trình", path: "/bookings" },
    { name: "Thư viện", path: "/library" },
    { name: "Tài chính", path: "/finance" },
    { name: "Thành viên", path: "/members" }
  ];
 
  const isActive = (path: string) => pathname === path || (path !== '/dashboard' && pathname.startsWith(path));
 
  return (
    <>
      <nav className="fixed top-0 w-full z-45 bg-white/85 backdrop-blur-xl border-b border-slate-200/35 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16">
          <div className="flex justify-between items-center h-full">
            
            {/* Logo Sắc Band */}
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center gap-2 mr-4 lg:mr-6 group">
                <div className="bg-indigo-600 text-white p-1.5 rounded-lg transition-transform group-hover:rotate-12">
                  <Music size={20} />
                </div>
                <span className="font-black text-base lg:text-lg tracking-tight bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
                  Sắc Band v2.0
                </span>
              </Link>
              
              {/* Desktop Navigation Links */}
              <div className="hidden xl:flex items-center gap-1 bg-slate-100/60 p-1 rounded-xl">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
                      isActive(item.path) 
                        ? "bg-white text-indigo-650 shadow-sm shadow-slate-200/40" 
                        : "text-slate-500 hover:text-slate-850 hover:bg-white/60"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
 
            {/* Right Side Widgets */}
            <div className="flex items-center gap-2 lg:gap-4">
              
              {/* Chuông Thông Báo */}
              <div className="relative" ref={notiRef}>
                <button
                  onClick={() => setIsNotiOpen(!isNotiOpen)}
                  className={`relative p-2 rounded-xl transition ${isNotiOpen ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:bg-slate-100"}`}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2 w-2 items-center justify-center rounded-full bg-rose-500 ring-2 ring-white"></span>
                  )}
                </button>
 
                {isNotiOpen && (
                  <div className="fixed inset-x-4 top-20 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-3 w-auto sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-fade-in">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <h3 className="font-bold text-slate-800 text-xs">Thông báo ({unreadCount})</h3>
                      <span onClick={handleMarkAllRead} className="text-[9px] text-indigo-600 font-black uppercase cursor-pointer hover:underline">Đã đọc hết</span>
                    </div>
                    <div className="max-h-[350px] overflow-y-auto bg-white text-xs">
                      {notifications.length > 0 ? (
                        notifications.map((noti) => (
                          <div 
                            key={noti._id} 
                            onClick={() => handleNotiClick(noti)} 
                            className={`p-4 border-b border-slate-50 transition cursor-pointer flex gap-3 items-start hover:bg-slate-50 ${noti.isRead ? "opacity-60" : "bg-indigo-50/30"}`}
                          >
                            <div className="mt-0.5 p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                              <Info size={12} />
                            </div>
                            <div className="flex-1">
                              <p className={`leading-relaxed ${noti.isRead ? "text-slate-505 font-medium" : "text-slate-900 font-bold"}`}>{noti.message}</p>
                              <p className="text-[8px] text-slate-400 mt-1 font-black uppercase">{new Date(noti.createdAt).toLocaleDateString('vi-VN')}</p>
                            </div>
                            {!noti.isRead && <div className="h-2 w-2 bg-indigo-500 rounded-full mt-2 shrink-0"></div>}
                          </div>
                        ))
                      ) : (
                        <div className="p-10 text-center text-slate-400 italic font-semibold">Không có thông báo mới</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
 
              {/* Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-105 transition"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-xs">
                    {user.fullName.charAt(0)}
                  </div>
                  <ChevronDown size={12} className={`text-slate-400 hidden sm:block transition-transform ${isProfileOpen ? "rotate-180" : ""}`}/>
                </button>
 
                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-2 animate-fade-in text-xs font-bold text-slate-700">
                    <div className="px-3 py-2 mb-2 bg-slate-50 rounded-xl">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Tài khoản</p>
                      <p className="font-extrabold text-slate-800 truncate mt-0.5">{user.fullName}</p>
                    </div>
                    <button 
                      onClick={() => { setShowProfileModal(true); setIsProfileOpen(false); }}
                      className="w-full text-left flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition"
                    >
                      <Settings size={14} className="text-slate-400"/> Hồ sơ của tôi
                    </button>
                    <button 
                      onClick={handleLogout} 
                      className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition mt-1"
                    >
                      <LogOut size={14}/> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
 
              {/* Mobile Menu Button (Shows links on small screen) */}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className="xl:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl"
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
 
          </div>
        </div>
 
        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="xl:hidden bg-white border-t border-slate-100 shadow-xl absolute w-full left-0 z-40 p-4 space-y-2 max-h-[75vh] overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={`block px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                  isActive(item.path) 
                    ? "bg-indigo-50 text-indigo-600" 
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        )}
      </nav>
      {/* Spacer to push content down below fixed Navbar */}
      <div className="h-16 print:hidden w-full shrink-0"></div>
 
      {showProfileModal && (
        <ProfileModal 
          user={user} 
          onClose={() => setShowProfileModal(false)} 
          onUpdateSuccess={handleUpdateSuccess} 
        />
      )}
    </>
  );
}
