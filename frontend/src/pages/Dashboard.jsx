import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { Calendar, DollarSign, Music, Users, ArrowUpRight, Clock, MapPin, TrendingUp, AlertCircle, Sparkles } from "lucide-react";
import api from '../services/api';
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState({
    totalPendingFine: 0, 
    totalRevenue: 0, 
    estimatedRevenue: 0, 
    showsThisMonth: 0, 
    totalMembers: 0, 
    upcomingShows: [], 
    nextRehearsal: null
  });

  const [time, setTime] = useState(new Date());

  const [leaderboard, setLeaderboard] = useState({ attendanceLeaderboard: [], fineLeaderboard: [] });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/dashboard");
        setData(res.data);
      } catch (error) {
        console.error("Lỗi Dashboard:", error);
      }
    };

    const fetchLeaderboard = async () => {
      try {
        const res = await api.get("/rehearsals/leaderboard");
        setLeaderboard(res.data);
      } catch (error) {
        console.error("Lỗi Leaderboard:", error);
      }
    };

    fetchData();
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fmt = (num) => (num || 0).toLocaleString('vi-VN') + 'đ';

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 pt-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* 1. WELCOME BANNER (Glassmorphism Light Premium with Realtime Clock) */}
        <div className="relative overflow-hidden rounded-[32px] bg-white border border-slate-200/60 p-6 md:p-8 text-slate-800 shadow-xl shadow-slate-200/20">
          {/* Decorative colored glow blobs */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-indigo-200/30 rounded-full mix-blend-multiply filter blur-[80px] opacity-60"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-fuchsia-200/20 rounded-full mix-blend-multiply filter blur-[80px] opacity-50"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-indigo-650 font-extrabold tracking-widest text-[10px] uppercase mb-1.5 flex items-center gap-1.5">
                <Sparkles size={14} className="animate-pulse text-indigo-500" /> Tổng quan hệ thống quản lý
              </p>
              <h2 className="text-2xl md:text-3xl font-black mb-2 tracking-tight text-slate-850">
                Chào <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-650 to-fuchsia-600 font-black">{user?.fullName?.split(' ').pop()}</span>, sẵn sàng bùng nổ?
              </h2>
              <p className="text-slate-500 text-xs font-semibold">Hôm nay ban nhạc có {data.showsThisMonth} show diễn trong tháng này.</p>
            </div>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              {/* Real-time Clock Widget */}
              <div className="bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200/40 flex flex-col items-center justify-center min-w-[140px] text-center shadow-sm">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Thời gian thực</span>
                <span className="text-lg font-black font-mono mt-0.5 text-indigo-650 tracking-wide">
                  {time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className="text-[9px] text-slate-500 font-bold mt-0.5">
                  {time.toLocaleDateString('vi-VN', { weekday: 'short', month: 'numeric', day: 'numeric' })}
                </span>
              </div>

              {/* Members/Shows quick stats */}
              <div className="flex bg-slate-50 py-2.5 px-2 rounded-2xl border border-slate-200/40 shadow-sm">
                <div className="text-center px-4 border-r border-slate-200">
                  <p className="text-[9px] text-slate-455 font-black uppercase tracking-wider mb-0.5">Thành viên</p>
                  <p className="text-xl font-black text-slate-800">{data.totalMembers}</p>
                </div>
                <div className="text-center px-4">
                  <p className="text-[9px] text-slate-455 font-black uppercase tracking-wider mb-0.5">Lịch diễn</p>
                  <p className="text-xl font-black text-slate-800">{data.showsThisMonth}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. STATS GRID (Widget style) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card: Doanh thu thực tế */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-650 flex items-center justify-center shadow-sm">
                <DollarSign size={22} />
              </div>
              <span className="flex items-center gap-1 text-[10px] font-black text-emerald-650 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                THỰC THU <TrendingUp size={10} />
              </span>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Doanh thu thực tế</p>
              <h3 className="text-2xl font-black text-slate-850 mt-1 tracking-tight">{fmt(data.totalRevenue)}</h3>
            </div>
          </div>

          {/* Card: Dự kiến Booking */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-650 flex items-center justify-center shadow-sm">
                <Music size={22} />
              </div>
              <span className="text-[10px] font-black text-indigo-650 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 uppercase">
                Ước tính
              </span>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Dự kiến (Booking)</p>
              <h3 className="text-2xl font-black text-indigo-600 mt-1 tracking-tight">{fmt(data.estimatedRevenue)}</h3>
            </div>
          </div>

          {/* Card: Quỹ phạt chờ thu */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm transition-all duration-300 hover:shadow-md relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-20 h-20 bg-rose-500/5 rounded-bl-full group-hover:scale-110 transition duration-500"></div>
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-sm">
                <AlertCircle size={22} />
              </div>
              <span className="text-[10px] font-black text-rose-650 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100 uppercase">
                Chưa nộp
              </span>
            </div>
            <div className="relative z-10">
              <p className="text-rose-500/80 text-xs font-bold uppercase tracking-wider">Quỹ phạt chờ thu</p>
              <h3 className="text-2xl font-black text-rose-600 mt-1 tracking-tight">{fmt(data.totalPendingFine)}</h3>
            </div>
          </div>

          {/* Card: Lịch tập tiếp theo */}
          <Link to="/rehearsals" className="rounded-3xl p-6 flex flex-col justify-between text-white group relative overflow-hidden shadow-lg shadow-indigo-500/10 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 via-indigo-650 to-violet-600 z-0"></div>
            <div className="relative z-10 flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center backdrop-blur-md border border-white/10 shadow-sm">
                <Calendar size={22} />
              </div>
              <div className="p-1.5 bg-white/10 rounded-xl group-hover:bg-white group-hover:text-slate-900 transition-colors duration-250">
                <ArrowUpRight size={15} />
              </div>
            </div>
            <div className="relative z-10 mt-6">
              <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-wider">Lịch tập tiếp theo</p>
              {data.nextRehearsal ? (
                <div className="mt-1">
                  <h3 className="text-lg font-extrabold truncate tracking-tight">{data.nextRehearsal.content || "Tập ráp band"}</h3>
                  <p className="text-xs text-slate-200 flex items-center gap-1.5 mt-1 font-medium">
                    <Clock size={13} className="text-white/80" /> {new Date(data.nextRehearsal.date).toLocaleDateString('vi-VN')} • {data.nextRehearsal.time}
                  </p>
                </div>
              ) : (
                <p className="text-base font-bold mt-1 text-slate-200 italic">Chưa có lịch mới</p>
              )}
            </div>
          </Link>
        </div>

        {/* 3. LỊCH DIỄN SẮP TỚI & LỐI TẮT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Cột trái: SHOW SẮP TỚI */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Calendar className="text-indigo-600" size={22} /> SHOW SẮP TỚI MỚI NHẤT
              </h3>
              <Link to="/bookings" className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-xl transition duration-200">
                Xem tất cả
              </Link>
            </div>

            <div className="space-y-4">
              {(data.upcomingShows?.length || 0) > 0 ? (
                data.upcomingShows.map((show) => (
                  <Link
                    to={`/bookings/${show._id}`}
                    key={show._id}
                    className="group flex flex-col sm:flex-row items-center gap-4 bg-white rounded-2xl p-4 border border-slate-200/60 hover:border-indigo-500/20 transition-all duration-300 hover:shadow-sm"
                  >
                    <div className="flex-shrink-0 w-16 h-16 bg-slate-50 rounded-xl flex flex-col items-center justify-center border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-650 transition-colors duration-300">
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-200">
                        Th. {new Date(show.date).getMonth() + 1}
                      </span>
                      <span className="text-2xl font-black text-slate-800 group-hover:text-white leading-tight">
                        {new Date(show.date).getDate()}
                      </span>
                    </div>

                    <div className="flex-1 text-center sm:text-left min-w-0">
                      <h4 className="text-base font-extrabold text-slate-850 group-hover:text-indigo-600 transition-colors duration-200 truncate">
                        {show.title}
                      </h4>
                      <div className="flex flex-wrap justify-center sm:justify-start gap-2.5 mt-2 text-xs font-semibold text-slate-500">
                        <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md text-[11px] font-bold">
                          <Clock size={12} className="text-amber-500" /> {show.time}
                        </span>
                        <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md text-[11px] font-bold truncate max-w-[200px]">
                          <MapPin size={12} className="text-blue-500" /> {show.location}
                        </span>
                        <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-[11px] font-black">
                          <DollarSign size={12} /> {fmt(show.price)}
                        </span>
                      </div>
                    </div>

                    <div className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
                      show.status === 'confirmed' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                        : 'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {show.status === 'confirmed' ? 'Đã Chốt' : 'Chờ Duyệt'}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                  <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Music size={20} className="text-slate-400" />
                  </div>
                  <p className="text-slate-500 text-xs font-semibold">Chưa có show diễn nào sắp tới.</p>
                  <Link to="/bookings" className="mt-3 inline-block px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition shadow-sm">
                    + Tạo Lịch Diễn Mới
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Cột phải: LỐI TẮT NHANH */}
          <div className="space-y-6">
            <h3 className="text-xl font-black text-slate-800">QUẢN TRỊ NHANH</h3>
            <div className="bg-white rounded-3xl p-5 space-y-3.5 border border-slate-200/60 shadow-sm">
              
              <Link to="/bookings" className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-slate-50 transition duration-200 group border border-transparent hover:border-slate-200/40">
                <div className="bg-gradient-to-br from-indigo-100 to-fuchsia-100 text-indigo-650 p-3 rounded-xl group-hover:scale-105 transition-transform duration-300 shadow-sm">
                  <Music size={20} />
                </div>
                <div>
                  <h5 className="font-extrabold text-slate-800 text-sm leading-snug">Quản lý Lịch Diễn</h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">Sắp xếp sảnh diễn & cát-xê</p>
                </div>
              </Link>
              
              <div className="h-px bg-slate-100 w-full"></div>
              
              <Link to="/rehearsals" className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-slate-50 transition duration-200 group border border-transparent hover:border-slate-200/40">
                <div className="bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-650 p-3 rounded-xl group-hover:scale-105 transition-transform duration-300 shadow-sm">
                  <Calendar size={20} />
                </div>
                <div>
                  <h5 className="font-extrabold text-slate-800 text-sm leading-snug">Điểm Danh & Quỹ Phạt</h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">Ghi chép chuyên cần nhóm tập</p>
                </div>
              </Link>

              <div className="h-px bg-slate-100 w-full"></div>

              <Link to="/finance" className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-slate-50 transition duration-200 group border border-transparent hover:border-slate-200/40">
                <div className="bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-650 p-3 rounded-xl group-hover:scale-105 transition-transform duration-300 shadow-sm">
                  <DollarSign size={20} />
                </div>
                <div>
                  <h5 className="font-extrabold text-slate-800 text-sm leading-snug">Báo Cáo Tài Chính</h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">Thống kê chi thu quỹ ban nhạc</p>
                </div>
              </Link>
            </div>
          </div>

        </div>

        {/* 4. LEADERBOARDS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Cột 1: Leaderboard Chuyên Cần */}
           <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/60 shadow-sm">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                <Sparkles className="text-violet-500" size={20}/> BXH CHUYÊN CẦN (%)
              </h3>
              <div className="space-y-4">
                 {leaderboard.attendanceLeaderboard.slice(0, 5).map((user, idx) => (
                    <div key={user.userId} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-2xl border border-slate-150 transition hover:border-violet-300">
                       <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 flex items-center justify-center font-black text-xs rounded-full ${
                             idx === 0 ? 'bg-amber-100 text-amber-700' :
                             idx === 1 ? 'bg-slate-200 text-slate-700' :
                             idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                          }`}>{idx + 1}</span>
                          <span className="font-extrabold text-xs text-slate-800">{user.fullName}</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400">({user.presentCount} có mặt / {user.presentCount + user.lateCount + user.absentCount} buổi)</span>
                          <span className="font-black text-xs text-indigo-650 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">{user.attendanceRate}%</span>
                       </div>
                    </div>
                 ))}
                 {leaderboard.attendanceLeaderboard.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-6">Chưa có dữ liệu chuyên cần</p>
                 )}
              </div>
           </div>

           {/* Cột 2: BXH Vua Phạt */}
           <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/60 shadow-sm relative overflow-hidden">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                <AlertCircle className="text-rose-500" size={20}/> BXH TÍCH LŨY PHẠT
              </h3>
              <div className="space-y-4">
                 {leaderboard.fineLeaderboard.slice(0, 5).map((user, idx) => (
                    <div key={user.userId} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-2xl border border-slate-150 transition hover:border-rose-350">
                       <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 flex items-center justify-center font-black text-xs rounded-full ${
                             idx === 0 && user.totalFines > 0 ? 'bg-rose-150 text-rose-700' : 'bg-slate-100 text-slate-500'
                          }`}>{idx === 0 && user.totalFines > 0 ? "👑" : idx + 1}</span>
                          <span className="font-extrabold text-xs text-slate-800">{user.fullName}</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400">({user.lateCount} muộn, {user.absentCount} vắng)</span>
                          <span className={`font-black text-xs px-2.5 py-0.5 rounded-md ${user.totalFines > 0 ? 'text-rose-600 bg-rose-50 border border-rose-100' : 'text-slate-550 bg-slate-100 border border-slate-250'}`}>
                             {user.totalFines.toLocaleString()}đ
                          </span>
                       </div>
                    </div>
                 ))}
                 {leaderboard.fineLeaderboard.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-6">Chưa có dữ liệu đóng phạt</p>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;