"use client";

import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import Link from "next/link";
import { 
  TrendingUp, Calendar, DollarSign, Award, 
  Clock, MapPin, AlertCircle, Sparkles, 
  ChevronRight, ArrowUpRight, Trophy, Zap, Loader,
  CheckCircle, Radio, UserCheck, ShieldAlert, Crown, Medal
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
      <div className="flex-1 flex flex-col items-center justify-center py-24">
        <Loader className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đang nạp dữ liệu Tổng quan...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
      
      {/* Modern Concert Console Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white border border-slate-800 shadow-xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Ambient neon light glow */}
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-16 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3 mb-2.5">
            <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-indigo-200 border border-white/15 text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>SẮC BAND STAGE CONSOLE</span>
            </span>
            <span className="text-xs font-medium text-slate-400 capitalize">{currentDate}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Xin chào, {user?.fullName || "Nhạc Công"}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>{user?.instrument || (user?.role === 'admin' ? 'Trưởng Ban' : 'Thành Viên')}</span>
            </span>
          </div>

          <p className="text-xs sm:text-sm font-medium text-slate-300 mt-1.5 max-w-xl leading-relaxed">
            Trung tâm điều phối biểu diễn, lịch tập ráp & đối soát tài chính nội bộ Sắc Band.
          </p>
        </div>

        {/* Digital Stage Hardware Clock & Quick Console Actions */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-right shadow-inner">
            <div className="flex items-center justify-end gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xl font-black text-emerald-400 font-mono tracking-tight">{currentTime}</span>
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">Thời Gian Thực</span>
          </div>

          <Link
            href="/rehearsals"
            className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs flex items-center gap-1.5 transition backdrop-blur-md shadow-sm"
          >
            <Clock className="w-3.5 h-3.5 text-indigo-300" />
            <span>Lịch Tập Ráp</span>
          </Link>

          <Link
            href="/notifications"
            className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs flex items-center gap-1.5 transition backdrop-blur-md shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Thông Báo</span>
          </Link>

          <Link
            href="/live-stand"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 transition shadow-lg shadow-indigo-500/30 active:scale-95"
          >
            <Radio className="w-4 h-4 text-emerald-300 animate-pulse" />
            <span>Lên Sân Khấu</span>
          </Link>
        </div>
      </section>

      {/* 4 Clean Metric Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Revenue */}
        <div className="ui-card p-5 ui-card-hover">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Doanh thu thực tế</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {formatVND(dashboardData.totalRevenue)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Đã đối soát ngân hàng</span>
          </div>
        </div>

        {/* Card 2: Estimated Revenue */}
        <div className="ui-card p-5 ui-card-hover">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dự kiến tháng này</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {formatVND(dashboardData.estimatedRevenue)}
          </div>
          <div className="mt-2 text-[11px] font-medium text-slate-500">
            Tổng {dashboardData.showsThisMonth} show diễn trong tháng
          </div>
        </div>

        {/* Card 3: Pending Fine */}
        <div className="ui-card p-5 ui-card-hover">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tiền phạt chờ nộp</span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 tracking-tight">
            {formatVND(dashboardData.totalPendingFine)}
          </div>
          <div className="mt-2 text-[11px] font-medium text-rose-600">
            Chuyển khoản: PHAT [USER_ID]
          </div>
        </div>

        {/* Card 4: Total Members */}
        <div className="ui-card p-5 ui-card-hover">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Thành viên Ban Nhạc</span>
            <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-200">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {dashboardData.totalMembers} <span className="text-xs text-slate-500 font-normal">Nhạc công</span>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-indigo-600">
            Sẵn sàng nhận lịch diễn
          </div>
        </div>

      </section>

      {/* Main Content Grid: Upcoming Shows & Next Rehearsal */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upcoming Shows (2 Columns) */}
        <div className="lg:col-span-2 ui-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">Show Diễn Sắp Tới</h3>
              </div>
              <Link href="/bookings" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                <span>Xem tất cả</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {dashboardData.upcomingShows.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs font-medium">
                Chưa có show diễn nào được lên lịch sắp tới.
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardData.upcomingShows.map((show) => (
                  <div key={show._id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{show.title}</h4>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" />
                          {new Date(show.date).toLocaleDateString("vi-VN")} - {show.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          {show.location}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-xs text-emerald-700 font-mono">
                        {formatVND(show.price)}
                      </span>
                      <Link
                        href={`/bookings/${show._id}`}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-xs font-semibold transition-colors"
                      >
                        Chi tiết
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Next Rehearsal Widget (1 Column) */}
        <div className="ui-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">Lịch Tập Tiếp Theo</h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                BẮT BUỘC
              </span>
            </div>

            {dashboardData.nextRehearsal ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span>{new Date(dashboardData.nextRehearsal.date).toLocaleDateString("vi-VN")} - {dashboardData.nextRehearsal.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 text-xs font-medium mt-1.5">
                    <MapPin className="w-4 h-4 text-rose-500" />
                    <span>{dashboardData.nextRehearsal.location}</span>
                  </div>
                  {dashboardData.nextRehearsal.content && (
                    <div className="mt-3 p-2.5 rounded-lg bg-white text-xs text-slate-700 border border-slate-200 font-medium">
                      <strong>Nội dung:</strong> {dashboardData.nextRehearsal.content}
                    </div>
                  )}
                </div>

                <Link
                  href="/checkin"
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Điểm Danh QR / GPS</span>
                </Link>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500 text-xs font-medium">
                Chưa có lịch tập mới nào được công bố.
              </div>
            )}
          </div>
        </div>

      </section>

      {/* Band Leaderboard & Fine Wall of Fame */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Attendance Leaderboard */}
        <div className="ui-card p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">Bảng Xếp Hạng Chuyên Cần</h3>
          </div>

          <div className="space-y-2">
            {leaderboard.attendanceLeaderboard.slice(0, 5).map((member, index) => (
              <div key={member.userId} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-lg font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs ${
                    index === 0 ? "badge-rank-1" :
                    index === 1 ? "badge-rank-2" :
                    index === 2 ? "badge-rank-3" :
                    "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}>
                    {index === 0 ? <Crown className="w-3.5 h-3.5 text-amber-800" /> :
                     index === 1 ? <Medal className="w-3.5 h-3.5 text-slate-700" /> :
                     index === 2 ? <Award className="w-3.5 h-3.5 text-orange-800" /> :
                     `#${index + 1}`}
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{member.fullName}</h4>
                    <span className="text-[10px] text-slate-500">
                      Đúng giờ: {member.presentCount} | Muộn: {member.lateCount} | Vắng: {member.absentCount}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-xs text-emerald-700 font-mono">
                    {member.attendanceRate}%
                  </span>
                  <span className="text-[10px] text-slate-500 block">Có mặt</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fine Wall of Fame */}
        <div className="ui-card p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">Bảng Vàng Tiền Phạt</h3>
          </div>

          <div className="space-y-2">
            {leaderboard.fineLeaderboard.slice(0, 5).map((member, index) => (
              <div key={member.userId} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-rose-50 text-rose-600 font-bold text-xs flex items-center justify-center border border-rose-200">
                    #{index + 1}
                  </span>
                  <h4 className="font-bold text-xs text-slate-900">{member.fullName}</h4>
                </div>

                <div className="text-right">
                  <span className="font-bold text-xs text-rose-600 font-mono">
                    {formatVND(member.totalFines)}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Tiền phạt</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>

    </div>
  );
}
