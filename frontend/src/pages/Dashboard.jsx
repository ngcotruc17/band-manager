import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { Calendar, DollarSign, Music, Users, ArrowUpRight, Clock, MapPin, TrendingUp, AlertCircle, Sparkles } from "lucide-react";
import api from '../services/api'; // 👈 Dùng cái này thay cho axios
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState({
    totalPendingFine: 0, totalRevenue: 0, estimatedRevenue: 0, showsThisMonth: 0, totalMembers: 0, upcomingShows: [], nextRehearsal: null
  });

  const API_URL = "https://band-manager-s9tm.onrender.com/api/dashboard";

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Không cần lấy token thủ công nữa vì 'api' đã có interceptor lo rồi
        const res = await api.get("/dashboard");
        setData(res.data);
      } catch (error) {
        console.error("Lỗi Dashboard:", error);
      }
    };
    fetchData();
  }, []);

  const fmt = (num) => (num || 0).toLocaleString('vi-VN') + 'đ';

  return (
    <div className="min-h-screen p-4 md:p-8 pt-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* 1. WELCOME BANNER (Glassmorphism Dark) */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 md:p-10 text-white shadow-2xl">
          {/* Đèn mờ trang trí */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-violet-600 rounded-full mix-blend-screen filter blur-[80px] opacity-60"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-fuchsia-600 rounded-full mix-blend-screen filter blur-[80px] opacity-40"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <p className="text-violet-300 font-bold tracking-widest text-sm uppercase mb-1">Tổng quan hệ thống</p>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-2">
                Chào <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-violet-400">{user?.fullName?.split(' ').pop()}</span>, sẵn sàng quẩy chưa?
              </h2>
            </div>

            <div className="flex gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-inner">
              <div className="text-center px-4 border-r border-white/20">
                <p className="text-xs text-slate-300 font-bold uppercase mb-1">Thành viên</p>
                <p className="text-3xl font-black">{data.totalMembers}</p>
              </div>
              <div className="text-center px-4">
                <p className="text-xs text-slate-300 font-bold uppercase mb-1">Show tháng này</p>
                <p className="text-3xl font-black">{data.showsThisMonth}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. STATS GRID (Widget style) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass rounded-3xl p-6 card-hover">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner"><DollarSign size={24} /></div>
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">+12% <TrendingUp size={12} /></span>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Doanh thu thực tế</p>
              <h3 className="text-3xl font-black text-slate-800 mt-1">{fmt(data.totalRevenue)}</h3>
            </div>
          </div>

          <div className="glass rounded-3xl p-6 card-hover">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center shadow-inner"><Music size={24} /></div>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Dự kiến (Booking)</p>
              <h3 className="text-3xl font-black text-violet-600 mt-1">{fmt(data.estimatedRevenue)}</h3>
            </div>
          </div>

          <div className="glass rounded-3xl p-6 card-hover relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-rose-500/5 rounded-bl-full group-hover:scale-110 transition duration-500"></div>
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-inner"><AlertCircle size={24} /></div>
            </div>
            <div className="relative z-10">
              <p className="text-rose-400 text-xs font-bold uppercase tracking-wide">Quỹ phạt chờ thu</p>
              <h3 className="text-3xl font-black text-rose-600 mt-1">{fmt(data.totalPendingFine)}</h3>
            </div>
          </div>

          {/* Widget Lịch tập */}
          <Link to="/rehearsals" className="glass-dark rounded-3xl p-6 card-hover flex flex-col justify-between text-white group relative overflow-hidden block">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 opacity-90 z-0"></div>
            <div className="relative z-10 flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center backdrop-blur-md border border-white/10"><Calendar size={24} /></div>
              <div className="p-2 bg-white/10 rounded-full group-hover:bg-white group-hover:text-slate-900 transition"><ArrowUpRight size={16} /></div>
            </div>
            <div className="relative z-10 mt-6">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Lịch tập tiếp theo</p>
              {data.nextRehearsal ? (
                <div className="mt-1">
                  <h3 className="text-xl font-bold truncate">{data.nextRehearsal.content || "Tập luyện"}</h3>
                  <p className="text-sm text-slate-300 flex items-center gap-1.5 mt-1">
                    <Clock size={14} className="text-fuchsia-400" /> {new Date(data.nextRehearsal.date).toLocaleDateString('vi-VN')} • {data.nextRehearsal.time}
                  </p>
                </div>
              ) : (
                <p className="text-xl font-bold mt-1 text-slate-500">Chưa có lịch mới</p>
              )}
            </div>
          </Link>
        </div>

        {/* 3. LỊCH DIỄN SẮP TỚI */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                <Sparkles className="text-violet-600" /> SHOW SẮP TỚI
              </h3>
              <Link to="/bookings" className="text-sm font-bold text-violet-600 hover:bg-violet-50 px-4 py-2 rounded-xl transition">Xem tất cả</Link>
            </div>

            <div className="space-y-4">
              {(data.upcomingShows?.length || 0) > 0 ? (
                data.upcomingShows.map((show) => (
                  <Link
                    to={`/bookings/${show._id}`}
                    key={show._id}
                    className="group flex flex-col md:flex-row items-center gap-6 glass rounded-2xl p-4 card-hover block"
                  >
                    <div className="flex-shrink-0 w-full md:w-20 h-24 bg-slate-50 rounded-xl flex flex-col items-center justify-center border border-slate-100 group-hover:bg-violet-600 group-hover:text-white group-hover:border-violet-600 transition duration-300">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-violet-200">Tháng {new Date(show.date).getMonth() + 1}</span>
                      <span className="text-3xl font-black text-slate-800 group-hover:text-white">{new Date(show.date).getDate()}</span>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                      <h4 className="text-xl font-bold text-slate-800 group-hover:text-violet-600 transition">{show.title}</h4>
                      <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3 text-sm font-medium text-slate-500">
                        <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md"><Clock size={14} className="text-orange-500" /> {show.time}</span>
                        <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md"><MapPin size={14} className="text-blue-500" /> {show.location}</span>
                        <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md font-bold"><DollarSign size={14} /> {fmt(show.price)}</span>
                      </div>
                    </div>

                    <div className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border ${show.status === 'confirmed' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                      {show.status === 'confirmed' ? 'ĐANG MỞ' : 'CHỜ DUYỆT'}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-16 glass rounded-3xl border-dashed">
                  <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Music size={24} className="text-slate-400" /></div>
                  <p className="text-slate-500 font-medium">Không có show nào sắp tới. Nghỉ ngơi thôi! 😴</p>
                  <Link to="/bookings" className="mt-4 inline-block px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-black transition shadow-lg">
                    + Tạo Booking Mới
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* LỐI TẮT NHANH */}
          <div className="space-y-6">
            <h3 className="text-2xl font-extrabold text-slate-800">Lối tắt</h3>
            <div className="glass rounded-3xl p-6 space-y-3">
              <Link to="/bookings" className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition group border border-transparent hover:border-slate-200">
                <div className="bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-600 p-3.5 rounded-xl group-hover:scale-110 transition duration-300 shadow-sm"><Music size={22} /></div>
                <div>
                  <h5 className="font-bold text-slate-800 text-lg leading-tight">Quản lý Booking</h5>
                  <p className="text-sm text-slate-500 mt-0.5">Lịch diễn & doanh thu</p>
                </div>
              </Link>
              <div className="h-px bg-slate-100 w-full"></div>
              <Link to="/rehearsals" className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition group border border-transparent hover:border-slate-200">
                <div className="bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-600 p-3.5 rounded-xl group-hover:scale-110 transition duration-300 shadow-sm"><Calendar size={22} /></div>
                <div>
                  <h5 className="font-bold text-slate-800 text-lg leading-tight">Lịch tập & Phạt</h5>
                  <p className="text-sm text-slate-500 mt-0.5">Điểm danh, quỹ nhóm</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;