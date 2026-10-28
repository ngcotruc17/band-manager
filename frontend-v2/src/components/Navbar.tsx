"use client";

import React, { useContext, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import { 
  Music, LogOut, Menu, X, Bell, ChevronDown, ChevronRight,
  Settings, Radio, Calendar, DollarSign, BookOpen, 
  CheckSquare, ShieldCheck, Sparkles, Layers, MessageSquare, 
  Users, CalendarDays, Music2, Coins, ArrowUpRight, Flame
} from "lucide-react";
import ProfileModal from "./ProfileModal";

interface NotificationItem {
  _id: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

interface SubNavItem {
  href: string;
  label: string;
  description: string;
  icon: React.ElementType;
  colorScheme: "orange" | "emerald" | "amber" | "rose" | "violet" | "cyan";
  highlight?: boolean;
  badge?: string;
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  items: SubNavItem[];
}

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const pathname = usePathname();
  const router = useRouter();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const notiRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLDivElement | null>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data || []);
      setUnreadCount((res.data || []).filter((n: NotificationItem) => !n.isRead).length);
    } catch {
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
      if (navRef.current && !navRef.current.contains(target)) setOpenDropdown(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown and drawer on route change
  useEffect(() => {
    setOpenDropdown(null);
    setIsMenuOpen(false);
  }, [pathname]);

  if (!user || pathname === "/change-password" || pathname === "/login" || pathname === "/register") return null;

  // 🍊 FPTU Band Streamlined Navigation (Live Stage Runner archived/shelved per request)
  const navGroups: NavGroup[] = [
    {
      id: "schedules",
      label: "Lịch trình",
      icon: CalendarDays,
      items: [
        {
          href: "/bookings",
          label: "Lịch diễn (Shows)",
          description: "Quản lý show diễn, địa điểm & thù lao",
          icon: Calendar,
          colorScheme: "orange"
        },
        {
          href: "/rehearsals",
          label: "Lịch tập ráp",
          description: "Lịch phòng tập, bài tập & ban nhạc",
          icon: Layers,
          colorScheme: "amber"
        },
        {
          href: "/checkin",
          label: "Điểm danh & Chấm công",
          description: "Quét mã QR & lịch sử có mặt",
          icon: CheckSquare,
          colorScheme: "emerald"
        }
      ]
    },
    {
      id: "music",
      label: "Kho âm nhạc",
      icon: Music2,
      items: [
        {
          href: "/library",
          label: "Kho bài hát & Sheet",
          description: "Thư viện bài hát, sheet nhạc & beat mp3",
          icon: BookOpen,
          colorScheme: "orange"
        },
        {
          href: "/repertoire",
          label: "Danh mục Repertoire",
          description: "Danh mục bài hát & lập setlist sự kiện",
          icon: Layers,
          colorScheme: "cyan"
        }
      ]
    },
    {
      id: "management",
      label: "Quản trị & Điều phối",
      icon: Coins,
      items: [
        {
          href: "/finance",
          label: "Tài chính & Quỹ ban",
          description: "Doanh thu, quỹ 10%, lương show & đối soát",
          icon: DollarSign,
          colorScheme: "emerald"
        },
        {
          href: "/members",
          label: "Thành viên ban nhạc",
          description: "Danh sách cán bộ, giảng viên, sinh viên & vai trò",
          icon: Users,
          colorScheme: "orange"
        }
      ]
    }
  ];

  const getColorClasses = (scheme: SubNavItem["colorScheme"]) => {
    switch (scheme) {
      case "orange":
        return "bg-orange-50 text-orange-600 border-orange-200 group-hover:bg-orange-100/80";
      case "amber":
        return "bg-amber-50 text-amber-600 border-amber-200 group-hover:bg-amber-100/80";
      case "emerald":
        return "bg-emerald-50 text-emerald-600 border-emerald-200 group-hover:bg-emerald-100/80";
      case "violet":
        return "bg-violet-50 text-violet-600 border-violet-200 group-hover:bg-violet-100/80";
      case "cyan":
        return "bg-cyan-50 text-cyan-600 border-cyan-200 group-hover:bg-cyan-100/80";
      case "rose":
        return "bg-rose-50 text-rose-600 border-rose-200 group-hover:bg-rose-100/80";
      default:
        return "bg-orange-50 text-orange-600 border-orange-200 group-hover:bg-orange-100/80";
    }
  };

  const isGroupActive = (group: NavGroup) => {
    return group.items.some(item => pathname === item.href || pathname.startsWith(item.href + "/"));
  };

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
      {/* 🍊 Floating iOS / OneUI Frosted Capsule Header */}
      <header className="fixed top-3 left-1/2 -translate-x-1/2 w-[calc(100%-1.25rem)] sm:w-[calc(100%-2rem)] max-w-7xl z-50 rounded-2xl sm:rounded-3xl bg-white/85 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_0_rgba(15,23,42,0.07)] px-3.5 sm:px-6 h-15 sm:h-16 flex items-center justify-between transition-all">
        
        {/* Brand & Dynamic FPTU Band Pill */}
        <Link href="/dashboard" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-[#F27024] via-[#FA8C16] to-[#EA580C] flex items-center justify-center text-white font-black shadow-md shadow-orange-500/30 group-hover:scale-105 transition-all relative border border-white/40">
            <Flame className="w-5 h-5 fill-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm sm:text-base tracking-tight text-slate-900 group-hover:text-[#F27024] transition-colors">
                FPTU BAND
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-orange-50 text-orange-700 border border-orange-200/80 rounded-full tracking-wider shadow-2xs">
                MANAGER
              </span>
            </div>
            <span className="hidden sm:block text-[9px] font-bold text-slate-400 tracking-wider uppercase -mt-0.5">
              Bộ Môn & Phòng CTSV ĐH FPT TP.HCM
            </span>
          </div>
        </Link>

        {/* 🍊 Desktop Navigation (Clean OneUI Pill Triggers) */}
        <nav className="hidden lg:flex items-center gap-1.5" ref={navRef}>
          
          {/* Direct Link: Tổng quan */}
          <Link
            href="/dashboard"
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              pathname === "/dashboard"
                ? "bg-orange-500/10 text-orange-700 border border-orange-300/60 shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-black/[0.04]"
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${pathname === "/dashboard" ? "text-[#F27024]" : "text-slate-400"}`} />
            <span>Tổng quan</span>
          </Link>

          {/* Group Dropdowns */}
          {navGroups.map((group) => {
            const GroupIcon = group.icon;
            const active = isGroupActive(group);
            const isOpen = openDropdown === group.id;

            return (
              <div key={group.id} className="relative">
                <button
                  onClick={() => setOpenDropdown(isOpen ? null : group.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? "bg-orange-500/10 text-orange-700 border border-orange-300/60 shadow-xs"
                      : isOpen
                      ? "bg-black/[0.06] text-slate-900"
                      : "text-slate-600 hover:text-slate-900 hover:bg-black/[0.04]"
                  }`}
                >
                  <GroupIcon className={`w-3.5 h-3.5 ${active ? "text-[#F27024]" : "text-slate-400"}`} />
                  <span>{group.label}</span>
                  {active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F27024] shrink-0" />
                  )}
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {/* 🍏 iOS Frosted Glass Flyout Dropdown */}
                {isOpen && (
                  <div className="absolute top-full left-0 mt-3 w-80 bg-white/92 backdrop-blur-2xl border border-white/90 shadow-[0_20px_45px_-10px_rgba(15,23,42,0.15)] rounded-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 mb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      {group.label}
                    </div>

                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const ItemIcon = item.icon;
                        const isCurrent = pathname === item.href || pathname.startsWith(item.href + "/");

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpenDropdown(null)}
                            className={`group flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer ${
                              isCurrent
                                ? "bg-orange-50/90 border border-orange-200/90 text-orange-950 shadow-2xs"
                                : "hover:bg-slate-50/80 text-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${getColorClasses(item.colorScheme)}`}>
                                <ItemIcon className="w-4 h-4" />
                              </div>
                              <div className="truncate">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-900 group-hover:text-[#F27024] transition-colors truncate">
                                    {item.label}
                                  </span>
                                  {item.badge && (
                                    <span className="px-1.5 py-0.2 rounded-full bg-orange-50 text-orange-700 border border-orange-300 text-[9px] font-black uppercase tracking-wider shrink-0">
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">
                                  {item.description}
                                </p>
                              </div>
                            </div>

                            <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${isCurrent ? "text-[#F27024]" : "text-slate-300"}`} />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Right Action Icons & User Dropdown */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Notifications Dropdown */}
          <div className="relative" ref={notiRef}>
            <button
              onClick={() => setIsNotiOpen(!isNotiOpen)}
              className="relative p-2 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 border border-white/60 transition-colors cursor-pointer"
              aria-label="Thông báo"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-black text-[9px] flex items-center justify-center animate-bounce shadow-sm">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Popover */}
            {isNotiOpen && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white/92 backdrop-blur-2xl border border-white/90 shadow-[0_20px_45px_-10px_rgba(15,23,42,0.16)] rounded-2xl p-4 z-50">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#F27024]" />
                    <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">Thông báo FPTU Band</h4>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-bold text-[#F27024] hover:text-orange-700 cursor-pointer"
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
                            : "bg-orange-50/70 border-orange-200 text-slate-900 hover:bg-orange-50 font-semibold"
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
                    className="text-xs font-bold text-[#F27024] hover:text-orange-700 flex items-center gap-1"
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
              className="flex items-center gap-2 p-1 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 border border-white/60 transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#F27024] to-[#EA580C] flex items-center justify-center font-black text-xs text-white shadow-2xs">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="hidden sm:block text-left pr-1">
                <span className="text-xs font-bold text-slate-900 block truncate max-w-[100px]">
                  {user.fullName}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block mr-1" />
            </button>

            {/* Profile Popover Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white/92 backdrop-blur-2xl border border-white/90 shadow-[0_20px_45px_-10px_rgba(15,23,42,0.16)] rounded-2xl p-2 z-50">
                <div className="p-3 border-b border-slate-100 mb-1">
                  <p className="text-xs font-black text-slate-900 truncate">{user.fullName}</p>
                  <p className="text-[11px] text-slate-400 truncate">@{user.username}</p>
                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-bold">
                    <ShieldCheck className="w-3 h-3 text-[#F27024]" />
                    <span>{user.role.toUpperCase()}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    setShowProfileModal(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-[#F27024]" />
                  <span>Cài đặt cá nhân</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors mt-1 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Info Pill for Mobile */}
          <div className="lg:hidden text-right pl-1">
            <span className="text-[10px] font-extrabold text-[#F27024] bg-orange-50 border border-orange-200/80 px-2 py-0.5 rounded-full">
              FPTU
            </span>
          </div>

        </div>
      </header>

      {/* 📱 OneUI / iOS Floating Bottom Navigation Dock (Thumb-friendly mobile & tablet bar) */}
      <nav 
        aria-label="Điều hướng di động"
        className="lg:hidden fixed bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-1.25rem)] max-w-md z-40 oneui-dock-bar px-2 py-1.5 flex items-center justify-around"
      >
        <Link
          href="/dashboard"
          className={`oneui-tab-item ${pathname === "/dashboard" ? "active" : ""}`}
        >
          <div className="oneui-tab-icon">
            <Sparkles className="w-4 h-4" />
          </div>
          <span>Tổng quan</span>
        </Link>

        <Link
          href="/bookings"
          className={`oneui-tab-item ${pathname.startsWith("/bookings") || pathname.startsWith("/rehearsals") ? "active" : ""}`}
        >
          <div className="oneui-tab-icon">
            <Calendar className="w-4 h-4" />
          </div>
          <span>Lịch diễn</span>
        </Link>

        <Link
          href="/checkin"
          className={`oneui-tab-item ${pathname.startsWith("/checkin") ? "active" : ""}`}
        >
          <div className="oneui-tab-icon">
            <CheckSquare className="w-4 h-4" />
          </div>
          <span>Điểm danh</span>
        </Link>

        <Link
          href="/library"
          className={`oneui-tab-item ${pathname.startsWith("/library") || pathname.startsWith("/repertoire") ? "active" : ""}`}
        >
          <div className="oneui-tab-icon">
            <BookOpen className="w-4 h-4" />
          </div>
          <span>Kho nhạc</span>
        </Link>

        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`oneui-tab-item ${isMenuOpen || pathname === "/finance" || pathname === "/members" || pathname === "/notifications" ? "active" : ""}`}
        >
          <div className="oneui-tab-icon">
            {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </div>
          <span>Thêm</span>
        </button>
      </nav>

      {/* 📱 OneUI Bottom Sheet Drawer (When "Thêm" is clicked) */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div 
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
          />

          {/* Drawer Sheet */}
          <div className="relative z-10 oneui-sheet-drawer p-5 max-h-[82vh] overflow-y-auto space-y-4 animate-in slide-in-from-bottom duration-300">
            {/* Grabber Handle */}
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto -mt-1 mb-2" />

            {/* User Quick Info Tile */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-orange-50/70 border border-orange-200/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#F27024] to-[#EA580C] text-white flex items-center justify-center font-black text-sm shadow-sm">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900">{user.fullName}</h4>
                  <p className="text-[11px] text-slate-500 font-medium">@{user.username} • {user.instrument || "FPTU Band"}</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-white text-[#F27024] text-[10px] font-black border border-orange-200 uppercase">
                {user.role === 'admin' ? 'Admin' : user.role === 'manager' || user.role === 'staff' ? 'Cán bộ CTSV/Bộ môn' : user.role === 'lecturer' ? 'Giảng viên' : 'Sinh viên'}
              </span>
            </div>

            {/* Inset Menu Section: Quản trị & Hoạt động */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-2 space-y-1">
              <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Quản trị & Điều phối FPTU Band
              </div>

              <Link
                href="/finance"
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all ${
                  pathname === "/finance" ? "bg-[#F27024] text-white shadow-sm" : "hover:bg-white text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Tài chính & Quỹ ban FPTU</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/members"
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all ${
                  pathname === "/members" ? "bg-[#F27024] text-white shadow-sm" : "hover:bg-white text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-orange-600" />
                  <span>Thành viên ban nhạc FPTU</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/rehearsals"
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all ${
                  pathname === "/rehearsals" ? "bg-[#F27024] text-white shadow-sm" : "hover:bg-white text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-amber-600" />
                  <span>Lịch tập ráp phòng thu</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/repertoire"
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all ${
                  pathname === "/repertoire" ? "bg-[#F27024] text-white shadow-sm" : "hover:bg-white text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Music className="w-4 h-4 text-cyan-600" />
                  <span>Danh mục bài hát Repertoire</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/notifications"
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all ${
                  pathname === "/notifications" ? "bg-[#F27024] text-white shadow-sm" : "hover:bg-white text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-violet-600" />
                  <span>Trung tâm thông báo FPTU</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>

            {/* Inset Menu Section: Tài khoản */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-2 space-y-1">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setShowProfileModal(true);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold hover:bg-white text-slate-700 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-[#F27024]" />
                  <span>Cài đặt thông tin cá nhân</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Đăng xuất khỏi hệ thống</span>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-400" />
              </button>
            </div>

          </div>
        </div>
      )}

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
