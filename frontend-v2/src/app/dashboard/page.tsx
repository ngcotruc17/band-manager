"use client";

import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import Link from "next/link";
import { 
  TrendingUp, Calendar, DollarSign, Award, 
  Clock, MapPin, AlertCircle, Sparkles, 
  ChevronRight, ArrowUpRight, Trophy, Zap, Loader,
  CheckCircle, Radio, UserCheck, ShieldAlert, Crown, Medal,
  CalendarDays, Layers, ChevronDown, CheckSquare, Music2,
  Users, Activity, Wallet, ShieldCheck
} from "lucide-react";

interface Show {
  _id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  price: number;
  status: string;
}

interface Rehearsal {
  _id: string;
  date: string;
  time: string;
  location: string;
  content?: string;
}

interface DashboardData {
  totalPendingFine: number;
  totalRevenue: number;
  estimatedRevenue: number;
  showsThisMonth: number;
  totalMembers: number;
  upcomingShows: Show[];
  nextRehearsal: Rehearsal | null;
  monthlyRevenue?: { month: string; amount: number }[];
}

interface LeaderboardMember {
  userId: string;
  fullName: string;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  totalFines: number;
  attendanceRate: number;
}

interface LeaderboardData {
  attendanceLeaderboard: LeaderboardMember[];
  fineLeaderboard: LeaderboardMember[];
}

export default function DashboardV2() {
  const { user } = useContext(AuthContext);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  
  // 🍏 iOS Segmented Control states for grouped components
  const [scheduleTab, setScheduleTab] = useState<"shows" | "rehearsals">("shows");
  const [leaderboardTab, setLeaderboardTab] = useState<"attendance" | "fines">("attendance");

  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalPendingFine: 0,
    totalRevenue: 0,
    estimatedRevenue: 0,
    showsThisMonth: 0,
    totalMembers: 0,
    upcomingShows: [],
    nextRehearsal: null
  });
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardData>({
    attendanceLeaderboard: [],
    fineLeaderboard: []
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setCurrentDate(now.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashRes, leadRes] = await Promise.all([
          api.get("/dashboard"),
          api.get("/rehearsals/leaderboard")
        ]);
        setDashboardData(dashRes.data);
        setLeaderboard(leadRes.data);
      } catch (error) {
        console.error("Lỗi nạp dữ liệu Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-28">
        <div className="w-14 h-14 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/80 shadow-lg flex items-center justify-center mb-3">
          <Loader className="w-6 h-6 text-indigo-600 animate-spin" />
        </div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đang khởi tạo Control Center...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
      
      {/* 🍏 Modern iOS Control Center Hero Banner (Fluid Frosted Acrylic) */}
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-900/90 backdrop-blur-3xl p-6 sm:p-8 text-white border border-white/15 shadow-[0_20px_50px_-15px_rgba(15,23,42,0.3)] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Ambient neon light glow orbs */}
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-16 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/4 -top-20 w-60 h-60 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3 mb-2.5">
            <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-xl text-indigo-200 border border-white/20 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>SẮC BAND CONTROL CENTER</span>
            </span>
            <span className="text-xs font-semibold text-slate-400 capitalize">{currentDate}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Xin chào, {user?.fullName || "Nhạc Công"}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>{user?.instrument || (user?.role === 'admin' ? 'Trưởng Ban' : 'Thành Viên')}</span>
            </span>
          </div>

          <p className="text-xs sm:text-sm font-medium text-slate-300 mt-2 max-w-xl leading-relaxed">
            Trung tâm điều phối biểu diễn, lịch trình tập ráp & đối soát tài chính nội bộ Sắc Band.
          </p>
        </div>

        {/* Digital Stage Hardware Clock & Quick Console Actions */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <div className="bg-white/10 backdrop-blur-2xl px-4 py-2.5 rounded-2xl border border-white/15 text-right shadow-inner">
            <div className="flex items-center justify-end gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xl font-black text-emerald-400 font-mono tracking-tight">{currentTime}</span>
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">Live Stage Clock</span>
          </div>

          <Link
            href="/checkin"
            className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs flex items-center gap-2 transition-all backdrop-blur-md shadow-sm hover:scale-105 active:scale-95"
          >
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            <span>Điểm Danh QR</span>
          </Link>

          <Link
            href="/live-stand"
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 border border-white/20"
          >
            <Radio className="w-4 h-4 text-emerald-300 animate-pulse" />
            <span>Lên Sân Khấu</span>
          </Link>
        </div>
      </section>

      {/* 🍏 Grouped iOS Liquid Frosted Glass Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Metric 1: Tài chính ban nhạc (Gom nhóm Doanh thu thực tế & Dự kiến) */}
        <div className="ui-card p-5 ui-card-hover flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-2xs">
                  <DollarSign className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tài chính ban nhạc</span>
              </div>
              <Link href="/finance" className="text-slate-400 hover:text-indigo-600 transition-colors">
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">Doanh thu thực nhận</span>
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  {formatVND(dashboardData.totalRevenue)}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Dự kiến tháng này:</span>
                <span className="font-bold text-indigo-600 font-mono">{formatVND(dashboardData.estimatedRevenue)}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Tổng {dashboardData.showsThisMonth} show diễn trong tháng</span>
          </div>
        </div>

        {/* Metric 2: Kỷ luật & Tiền phạt chờ nộp */}
        <div className="ui-card p-5 ui-card-hover flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 shadow-2xs">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kỷ luật & Tiền phạt</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                QUỸ PHẠT
              </span>
            </div>

            <div>
              <span className="text-[11px] font-medium text-slate-400 block">Tiền phạt chờ thu</span>
              <div className="text-2xl font-black text-rose-600 tracking-tight">
                {formatVND(dashboardData.totalPendingFine)}
              </div>
            </div>
          </div>

          <div className="mt-3 p-2.5 rounded-xl bg-rose-50/60 border border-rose-200/60 text-[11px] text-rose-700 font-semibold flex items-center justify-between">
            <span>Cú pháp nộp:</span>
            <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-rose-200 text-rose-800">
              PHAT [ID]
            </code>
          </div>
        </div>

        {/* Metric 3: Đội ngũ nghệ sĩ & Sẵn sàng sân khấu */}
        <div className="ui-card p-5 ui-card-hover flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200 shadow-2xs">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đội hình nghệ sĩ</span>
              </div>
              <Link href="/members" className="text-slate-400 hover:text-indigo-600 transition-colors">
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            <div>
              <span className="text-[11px] font-medium text-slate-400 block">Nghệ sĩ & Kỹ thuật</span>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {dashboardData.totalMembers} <span className="text-sm font-semibold text-slate-400">thành viên</span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-indigo-600">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Tất cả sẵn sàng nhận điều phối lịch diễn</span>
          </div>
        </div>

      </section>

      {/* 🍏 Grouped Schedules Hub: Unified Shows & Rehearsals with iOS Segmented Control */}
      <section className="ui-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-200/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
              <CalendarDays className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">LỊCH TRÌNH HOẠT ĐỘNG</h3>
              <p className="text-[11px] text-slate-400 font-medium">Lịch biểu diễn sân khấu và lịch tập ráp của ban nhạc</p>
            </div>
          </div>

          {/* 🍏 iOS Segmented Switcher for Schedules */}
          <div className="ios-segmented-container self-start sm:self-auto">
            <button
              onClick={() => setScheduleTab("shows")}
              className={`ios-segmented-item ${scheduleTab === "shows" ? "active" : ""}`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Show diễn ({dashboardData.upcomingShows.length})</span>
            </button>
            <button
              onClick={() => setScheduleTab("rehearsals")}
              className={`ios-segmented-item ${scheduleTab === "rehearsals" ? "active" : ""}`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Lịch tập ({dashboardData.nextRehearsal ? "1" : "0"})</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Upcoming Shows */}
        {scheduleTab === "shows" && (
          <div>
            {dashboardData.upcomingShows.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-medium">
                Chưa có show diễn nào được lên lịch sắp tới.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {dashboardData.upcomingShows.map((show) => (
                  <div 
                    key={show._id} 
                    className="p-4 rounded-2xl bg-white/60 border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {show.title}
                        </h4>
                        <span className="font-extrabold text-xs text-emerald-600 font-mono px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 shrink-0">
                          {formatVND(show.price)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{new Date(show.date).toLocaleDateString("vi-VN")} • {show.time}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          <span className="truncate max-w-[180px]">{show.location}</span>
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Trạng thái: <span className="text-indigo-600">{show.status || "ĐÃ XÁC NHẬN"}</span>
                      </span>
                      <Link
                        href={`/bookings`}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <span>Xem chi tiết</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Next Rehearsal */}
        {scheduleTab === "rehearsals" && (
          <div>
            {dashboardData.nextRehearsal ? (
              <div className="p-5 rounded-2xl bg-white/60 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-extrabold border border-amber-300">
                      BUỔI TẬP BẮT BUỘC
                    </span>
                    <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(dashboardData.nextRehearsal.date).toLocaleDateString("vi-VN")} lúc {dashboardData.nextRehearsal.time}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
                    <MapPin className="w-4 h-4 text-rose-500" />
                    <span><strong>Phòng tập:</strong> {dashboardData.nextRehearsal.location}</span>
                  </div>

                  {dashboardData.nextRehearsal.content && (
                    <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200 max-w-xl">
                      <strong>Nội dung ráp bài:</strong> {dashboardData.nextRehearsal.content}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    href="/checkin"
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-indigo-600/25 active:scale-95"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Điểm danh có mặt</span>
                  </Link>
                  <Link
                    href="/rehearsals"
                    className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors"
                  >
                    Tất cả lịch tập
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs font-medium">
                Chưa có lịch tập mới nào được công bố.
              </div>
            )}
          </div>
        )}
      </section>

      {/* 🍏 Grouped Leaderboard Hub: Unified Attendance & Discipline with iOS Segmented Switcher */}
      <section className="ui-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-200/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-sm">
              <Trophy className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">THI ĐUA & KỶ LUẬT BAN NHẠC</h3>
              <p className="text-[11px] text-slate-400 font-medium">Thống kê tỷ lệ có mặt, chuyên cần & quỹ phạt nội bộ</p>
            </div>
          </div>

          {/* 🍏 iOS Segmented Switcher for Leaderboard */}
          <div className="ios-segmented-container self-start sm:self-auto">
            <button
              onClick={() => setLeaderboardTab("attendance")}
              className={`ios-segmented-item ${leaderboardTab === "attendance" ? "active" : ""}`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Bảng vàng chuyên cần</span>
            </button>
            <button
              onClick={() => setLeaderboardTab("fines")}
              className={`ios-segmented-item ${leaderboardTab === "fines" ? "active" : ""}`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Danh sách tiền phạt</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Attendance Leaderboard */}
        {leaderboardTab === "attendance" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {leaderboard.attendanceLeaderboard.slice(0, 6).map((member, index) => (
              <div 
                key={member.userId} 
                className="p-3.5 rounded-2xl bg-white/60 border border-slate-200/80 flex items-center justify-between hover:border-indigo-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-xl font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs ${
                    index === 0 ? "badge-rank-1" :
                    index === 1 ? "badge-rank-2" :
                    index === 2 ? "badge-rank-3" :
                    "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}>
                    {index === 0 ? <Crown className="w-4 h-4 text-amber-800" /> :
                     index === 1 ? <Medal className="w-4 h-4 text-slate-700" /> :
                     index === 2 ? <Award className="w-4 h-4 text-orange-800" /> :
                     `#${index + 1}`}
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{member.fullName}</h4>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Đúng giờ: <strong className="text-emerald-600">{member.presentCount}</strong> | Muộn: <strong className="text-amber-600">{member.lateCount}</strong> | Vắng: <strong className="text-rose-600">{member.absentCount}</strong>
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-black text-sm text-emerald-600 font-mono">
                    {member.attendanceRate}%
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Tỷ lệ có mặt</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Fine Wall */}
        {leaderboardTab === "fines" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {leaderboard.fineLeaderboard.slice(0, 6).map((member, index) => (
              <div 
                key={member.userId} 
                className="p-3.5 rounded-2xl bg-white/60 border border-slate-200/80 flex items-center justify-between hover:border-rose-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 font-black text-xs flex items-center justify-center border border-rose-200">
                    #{index + 1}
                  </span>
                  <h4 className="font-bold text-xs text-slate-900">{member.fullName}</h4>
                </div>

                <div className="text-right">
                  <span className="font-black text-sm text-rose-600 font-mono">
                    {formatVND(member.totalFines)}
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Tiền phạt phát sinh</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
