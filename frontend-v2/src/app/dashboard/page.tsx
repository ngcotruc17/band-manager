"use client";
 
import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import Link from "next/link";
import { 
  TrendingUp, Calendar, DollarSign, Award, 
  Clock, MapPin, AlertCircle, Sparkles, 
  ChevronRight, ArrowUpRight, Trophy, Zap, Loader
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
 
  // Cập nhật đồng hồ thời gian thực
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
 
  // Nạp dữ liệu từ API
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
    
    if (user) {
      fetchDashboard();
    }
  }, [user]);
 
  const formatCurrency = (val: number) => {
    return (val || 0).toLocaleString("vi-VN") + "đ";
  };
 
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center gap-3">
        <Loader className="animate-spin text-indigo-650" size={36} />
        <span className="text-xs font-black uppercase tracking-wider text-slate-400">Đang đồng bộ hóa hệ thống v2.0...</span>
      </div>
    );
  }
 
  // Thống kê 4 thẻ
  const stats = [
    { 
      title: "Số dư Ví Cát-xê", 
      value: formatCurrency(user?.walletBalance || 0), 
      icon: <DollarSign size={22} />, 
      trend: "Cát-xê túi cá nhân của bạn", 
      trendUp: true, 
      color: "from-blue-600 to-indigo-650" 
    },
    { 
      title: "Quỹ Band tích lũy", 
      value: formatCurrency(dashboardData.totalRevenue), 
      icon: <TrendingUp size={22} />, 
      trend: "Tổng thu thực tế các show", 
      trendUp: true, 
      color: "from-emerald-500 to-teal-600" 
    },
    { 
      title: "Công nợ Phạt quỹ", 
      value: formatCurrency(dashboardData.totalPendingFine), 
      icon: <AlertCircle size={22} />, 
      trend: "Tổng quỹ phạt chưa thu", 
      trendUp: false, 
      color: "from-rose-500 to-amber-600" 
    },
    { 
      title: "Điểm chuyên cần", 
      value: `${user?.points || 0} PTS`, 
      icon: <Award size={22} />, 
      trend: `Tỷ lệ đi tập: ${user?.attendanceRate || 100}%`, 
      trendUp: true, 
      color: "from-fuchsia-500 to-purple-600" 
    }
  ];
 
  // Huy hiệu thành viên
  const badges = [
    { name: "Chiến thần đúng giờ", icon: <Clock size={20} />, description: "Đi tập ráp đúng giờ 100% trong tháng", color: "bg-emerald-50 text-emerald-600 border-emerald-250" },
    { name: "Vua Chạy Show", icon: <Trophy size={20} />, description: "Tham gia đầy đủ các show diễn chính thức", color: "bg-amber-50 text-amber-600 border-amber-250" },
    { name: "Cánh Tay Đắc Lực", icon: <Zap size={20} />, description: "Hỗ trợ chuẩn bị nhạc cụ biểu diễn hiệu quả", color: "bg-indigo-50 text-indigo-600 border-indigo-250" }
  ];
 
  // Doanh thu thực tế theo tháng lấy từ API
  const revenueData = dashboardData.monthlyRevenue || [
    { month: "T1", amount: 0 },
    { month: "T2", amount: 0 },
    { month: "T3", amount: 0 },
    { month: "T4", amount: 0 },
    { month: "T5", amount: 0 },
    { month: "T6", amount: 0 }
  ];

  const maxAmount = Math.max(10, ...revenueData.map(d => d.amount));
 
  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Banner tiêu đề chào mừng */}
        <div className="relative overflow-hidden rounded-[32px] bg-white border border-slate-200/60 p-6 md:p-8 shadow-xl shadow-slate-200/10">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-indigo-200/30 rounded-full mix-blend-multiply filter blur-[80px] opacity-60"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-fuchsia-200/20 rounded-full mix-blend-multiply filter blur-[80px] opacity-50"></div>
 
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-indigo-650 font-extrabold tracking-widest text-[10px] uppercase mb-1.5 flex items-center gap-1.5">
                <Sparkles size={14} className="animate-pulse text-indigo-500" /> Hệ thống quản trị tự động v2.0
              </p>
              <h2 className="text-2xl md:text-3xl font-black mb-2 tracking-tight text-slate-850">
                Chào mừng trở lại, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-fuchsia-600 font-black">{user?.fullName || "Thành viên"}</span>!
              </h2>
              <p className="text-slate-500 text-xs font-semibold">Tất cả dịch vụ điểm danh GPS, đối soát tự động TPBank/Cake và Live Mode lật nhạc đã sẵn sàng.</p>
            </div>
 
            <div className="flex flex-wrap items-center gap-4">
              <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-200/40 flex flex-col items-center justify-center min-w-[150px] text-center shadow-sm">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Thời gian thực</span>
                <span className="text-lg font-black font-mono mt-0.5 text-indigo-655 tracking-wide">{currentTime}</span>
                <span className="text-[9px] text-slate-550 font-bold mt-0.5 capitalize">{currentDate}</span>
              </div>
            </div>
          </div>
        </div>
 
        {/* Các thẻ thông số (Cards Stats) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white rounded-3xl border border-slate-150 p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden relative group">
              {/* Decorative gradient accent bar at top */}
              <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.color} opacity-60 group-hover:opacity-100 transition-opacity`}></div>
              
              {/* Row: Icon + Title */}
              <div className="flex items-center gap-3.5 mb-4">
                <div className={`p-3 rounded-2xl bg-gradient-to-tr ${stat.color} text-white shadow-lg shrink-0`}>
                  {stat.icon}
                </div>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider leading-tight">{stat.title}</p>
              </div>
              
              {/* Value */}
              <p className="text-[1.6rem] font-black text-slate-800 tracking-tight leading-none mb-2">{stat.value}</p>
              
              {/* Trend with colored dot */}
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${stat.trendUp ? "bg-emerald-400" : "bg-rose-400"}`}></span>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider truncate">{stat.trend}</p>
              </div>
            </div>
          ))}
        </div>
 
        {/* Khối Nội dung Chính: Biểu đồ & Lịch trình */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* CỘT TRÁI: Lịch diễn sắp tới & Biểu đồ doanh thu SVG (8 cột) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Thẻ Lịch Diễn Sắp Tới */}
            <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-150 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-850 flex items-center gap-2">
                    <Calendar size={20} className="text-indigo-600" /> Lịch Trình Biểu Diễn Sắp Tới
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Các sự kiện biểu diễn đã được chốt đội hình</p>
                </div>
                <Link href="/bookings" className="text-xs text-indigo-600 font-black uppercase hover:underline flex items-center gap-1">
                  Xem tất cả <ChevronRight size={14} />
                </Link>
              </div>
 
              <div className="space-y-4">
                {dashboardData.upcomingShows.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-400 font-bold italic">Chưa có show diễn nào sắp tới</p>
                  </div>
                ) : (
                  dashboardData.upcomingShows.map((show) => (
                    <div key={show._id} className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100 transition duration-200 gap-4">
                      <div className="flex gap-4 items-center">
                        <div className="bg-indigo-50 text-indigo-650 w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                          <Calendar size={20} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-sm text-slate-800 truncate">{show.title}</h4>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-450 text-[11px] font-bold mt-1">
                            <span className="flex items-center gap-1">
                              <Clock size={12}/>{new Date(show.date).toLocaleDateString('vi-VN')} vào {show.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin size={12}/>{show.location}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between md:justify-end items-center gap-4 w-full md:w-auto">
                        <span className="text-xs font-black text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl">
                          Cát-xê: {formatCurrency(show.price)}
                        </span>
                        <Link href={`/bookings/${show._id}`} className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition duration-200">
                          <ArrowUpRight size={16} />
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Thẻ Biểu Đồ Doanh Thu */}
            <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-150 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-850 flex items-center gap-2">
                    <TrendingUp size={20} className="text-indigo-600" /> Doanh Thu Hoạt Động Show
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Biểu đồ tổng quan doanh số theo tháng (Triệu VND)</p>
                </div>
                <span className="text-xs bg-slate-100 text-slate-650 px-3 py-1.5 rounded-xl font-bold">Tháng 1 - Tháng 6</span>
              </div>
 
              {/* Biểu đồ SVG Tự chế bằng Tailwind CSS */}
              <div className="relative h-64 w-full flex items-end justify-between pt-6 px-4">
                {/* Đường lưới nền */}
                <div className="absolute inset-x-0 bottom-0 h-full flex flex-col justify-between pointer-events-none">
                  <div className="border-t border-dashed border-slate-100 w-full"></div>
                  <div className="border-t border-dashed border-slate-100 w-full"></div>
                  <div className="border-t border-dashed border-slate-100 w-full"></div>
                  <div className="border-t border-dashed border-slate-100 w-full"></div>
                  <div className="h-0 w-full"></div>
                </div>
 
                {revenueData.map((data, idx) => {
                  const barHeight = `${(data.amount / maxAmount) * 100}%`;
                  return (
                    <div key={idx} className="h-[200px] flex flex-col justify-end items-center gap-2 w-1/12 group relative z-10">
                      {/* Tooltip hiển thị giá trị */}
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md transition duration-200 whitespace-nowrap shadow-md">
                        {data.amount} triệu
                      </span>
                      
                      {/* Cột dữ liệu */}
                      <div 
                        style={{ height: `calc(${barHeight} - 16px)` }} 
                        className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-xl group-hover:from-fuchsia-600 group-hover:to-fuchsia-400 transition-all duration-350 shadow-md shadow-indigo-500/10"
                      ></div>
                      
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{data.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
 
          </div>
 
          {/* CỘT PHẢI: Hệ thống Huy hiệu & Xếp hạng (4 cột) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Lịch tập ráp tiếp theo */}
            <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-150 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-slate-850 flex items-center gap-2">
                  <Calendar size={20} className="text-indigo-605" /> Lịch Tập Ráp Kế Tiếp
                </h3>
              </div>
              {dashboardData.nextRehearsal ? (
                <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100/40 text-slate-800 space-y-4">
                  <div>
                    <h4 className="font-black text-xs uppercase text-indigo-650 tracking-wider">Nội dung tập ráp</h4>
                    <p className="font-bold text-sm mt-1">{dashboardData.nextRehearsal.content || "Tập ráp band thường kỳ"}</p>
                  </div>
                  <div className="flex flex-col gap-2 text-xs font-semibold text-slate-650">
                    <span className="flex items-center gap-2">
                      <Clock size={14} className="text-orange-500"/>
                      {new Date(dashboardData.nextRehearsal.date).toLocaleDateString('vi-VN')} lúc {dashboardData.nextRehearsal.time}
                    </span>
                    <span className="flex items-center gap-2">
                      <MapPin size={14} className="text-blue-500"/>
                      {dashboardData.nextRehearsal.location}
                    </span>
                  </div>
                  <Link href="/checkin" className="block text-center w-full py-3 bg-indigo-605 hover:bg-indigo-650 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition">
                    ĐIỂM DANH NGAY
                  </Link>
                </div>
              ) : (
                <div className="p-6 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 font-bold italic">Chưa lên lịch tập tiếp theo</p>
                </div>
              )}
            </div>
 
            {/* Khối Huy hiệu Gamification */}
            <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-150 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-slate-850 flex items-center gap-2">
                  <Award size={20} className="text-indigo-600" /> Hệ Thống Huy Hiệu Đạt Được
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Tích lũy điểm để mở khóa phần thưởng và show lớn</p>
              </div>
 
              <div className="space-y-4">
                {badges.map((badge, idx) => (
                  <div key={idx} className={`flex items-start gap-4 p-4 border rounded-2xl ${badge.color} transition duration-200`}>
                    <div className="p-2.5 bg-white rounded-xl shadow-sm shrink-0 border border-inherit">
                      {badge.icon}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs text-slate-800">{badge.name}</h4>
                      <p className="text-[10px] text-slate-505 font-semibold mt-1 leading-normal">{badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
 
            {/* Bảng Xếp hạng Chuyên cần Tóm tắt */}
            <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-150 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-slate-850 flex items-center gap-2">
                  <Trophy size={20} className="text-indigo-605" /> Bảng Chuyên Cần Top 3
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Thành viên đi tập đúng giờ nhất</p>
              </div>
 
              <div className="space-y-3">
                {leaderboard.attendanceLeaderboard.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">Chưa có dữ liệu chuyên cần</p>
                ) : (
                  leaderboard.attendanceLeaderboard.slice(0, 3).map((item, idx) => (
                    <div key={item.userId} className="flex justify-between items-center p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                          idx === 0 ? "bg-amber-100 text-amber-700" :
                          idx === 1 ? "bg-slate-200 text-slate-700" : "bg-orange-100 text-orange-700"
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100/30 flex items-center justify-center font-black text-xs uppercase">
                          {item.fullName.charAt(0)}
                        </div>
                        <span className="font-extrabold text-xs text-slate-800">{item.fullName}</span>
                      </div>
                      <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                        {item.attendanceRate}%
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
 
          </div>
 
        </div>
 
      </div>
    </div>
  );
}
