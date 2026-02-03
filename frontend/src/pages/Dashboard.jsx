import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { 
  Calendar, DollarSign, Music, Users, 
  ArrowUpRight, Clock, MapPin, TrendingUp, AlertCircle
} from "lucide-react";
import axios from "axios";
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

  const API_URL = "https://band-manager-s9tm.onrender.com/api/dashboard";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(API_URL, { headers: { Authorization: `Bearer ${token}` } });
        
        setData({
          totalPendingFine: res.data?.totalPendingFine || 0,
          totalRevenue: res.data?.totalRevenue || 0,
          estimatedRevenue: res.data?.estimatedRevenue || 0,
          showsThisMonth: res.data?.showsThisMonth || 0,
          totalMembers: res.data?.totalMembers || 0,
          upcomingShows: res.data?.upcomingShows || [], 
          nextRehearsal: res.data?.nextRehearsal || null
        });
      } catch (error) {
        console.error("Lỗi tải Dashboard:", error);
      }
    };
    fetchData();
  }, []);

  const fmt = (num) => (num || 0).toLocaleString('vi-VN') + 'đ';

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* 1. WELCOME BANNER */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 p-8 text-white shadow-xl shadow-purple-200">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white opacity-10 blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-extrabold mb-2 flex items-center gap-2">
                Hi, {user?.fullName?.split(' ').pop()}! 👋
              </h2>
              <p className="text-purple-100 font-medium opacity-90">
                Hôm nay là một ngày tuyệt vời để cháy hết mình với âm nhạc! 🎸
              </p>
            </div>
            <div className="flex gap-4 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20">
              <div className="text-center px-4 border-r border-white/20">
                <p className="text-xs text-purple-200 font-bold uppercase">Thành viên</p>
                <p className="text-2xl font-bold">{data.totalMembers}</p>
              </div>
              <div className="text-center px-4">
                <p className="text-xs text-purple-200 font-bold uppercase">Show tháng này</p>
                <p className="text-2xl font-bold">{data.showsThisMonth}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-xl"><DollarSign size={24}/></div>
              <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">+12% <TrendingUp size={12}/></span>
            </div>
            <p className="text-gray-400 text-xs font-bold uppercase">Doanh thu thực tế</p>
            <h3 className="text-2xl font-extrabold text-gray-800 mt-1">{fmt(data.totalRevenue)}</h3>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Music size={24}/></div>
            </div>
            <p className="text-gray-400 text-xs font-bold uppercase">Dự kiến (Booking)</p>
            <h3 className="text-2xl font-extrabold text-blue-600 mt-1">{fmt(data.estimatedRevenue)}</h3>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 hover:shadow-md transition relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-20 h-20 bg-red-500/5 rounded-bl-full group-hover:scale-110 transition"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl"><AlertCircle size={24}/></div>
            </div>
            <p className="text-red-400 text-xs font-bold uppercase">Quỹ phạt chờ thu</p>
            <h3 className="text-2xl font-extrabold text-red-600 mt-1">{fmt(data.totalPendingFine)}</h3>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl shadow-lg text-white flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-white/10 rounded-xl"><Calendar size={24}/></div>
              <Link to="/rehearsals" className="p-2 hover:bg-white/10 rounded-lg transition"><ArrowUpRight size={18}/></Link>
            </div>
            <div className="mt-4">
               <p className="text-gray-400 text-xs font-bold uppercase">Lịch tập tiếp theo</p>
               {data.nextRehearsal ? (
                 <div className="mt-1">
                   <h3 className="text-lg font-bold truncate">{data.nextRehearsal.content || "Tập luyện"}</h3>
                   <p className="text-sm text-gray-300 flex items-center gap-1 mt-1">
                     <Clock size={12}/> {new Date(data.nextRehearsal.date).toLocaleDateString('vi-VN')} • {data.nextRehearsal.time}
                   </p>
                 </div>
               ) : (
                 <p className="text-lg font-bold mt-1 text-gray-500">Chưa có lịch mới</p>
               )}
            </div>
          </div>
        </div>

        {/* 3. MAIN AREA (Upcoming Shows) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Music className="text-pink-500"/> Show Sắp Diễn Ra
              </h3>
              <Link to="/bookings" className="text-sm font-bold text-blue-600 hover:underline">Xem tất cả</Link>
            </div>

            <div className="space-y-4">
              {(data.upcomingShows?.length || 0) > 0 ? (
                data.upcomingShows.map((show) => (
                  // 👇 THAY ĐỔI Ở ĐÂY: Dùng Link thay cho div để bấm được
                  <Link 
                    to={`/bookings/${show._id}`} 
                    key={show._id} 
                    className="group flex flex-col md:flex-row items-center gap-6 bg-white p-5 rounded-2xl border border-gray-100 hover:border-pink-200 hover:shadow-lg hover:shadow-pink-100 transition-all cursor-pointer block"
                  >
                    <div className="flex-shrink-0 w-full md:w-20 h-20 bg-pink-50 text-pink-600 rounded-2xl flex flex-col items-center justify-center border border-pink-100 group-hover:bg-pink-600 group-hover:text-white transition">
                      <span className="text-xs font-bold uppercase">Tháng {new Date(show.date).getMonth() + 1}</span>
                      <span className="text-2xl font-black">{new Date(show.date).getDate()}</span>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h4 className="text-lg font-bold text-gray-800 group-hover:text-pink-600 transition">{show.title}</h4>
                      <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Clock size={14}/> {show.time}</span>
                        <span className="flex items-center gap-1"><MapPin size={14}/> {show.location}</span>
                        <span className="flex items-center gap-1 font-bold text-green-600"><DollarSign size={14}/> {fmt(show.price)}</span>
                      </div>
                    </div>
                    <div className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-500 group-hover:bg-pink-100 group-hover:text-pink-600 transition">
                      {show.status === 'confirmed' ? 'Đã chốt' : 'Đang chờ'}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                  <p className="text-gray-400">Không có show nào sắp tới. Nghỉ ngơi thôi! 😴</p>
                  <Link to="/bookings" className="mt-4 inline-block px-6 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition">
                    + Tạo Booking Mới
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
             <h3 className="text-xl font-bold text-gray-800">Lối tắt</h3>
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <Link to="/bookings" className="flex items-center gap-4 p-4 rounded-xl hover:bg-pink-50 transition group border border-transparent hover:border-pink-100">
                   <div className="bg-pink-100 text-pink-600 p-3 rounded-lg group-hover:scale-110 transition"><Music size={20}/></div>
                   <div>
                      <h5 className="font-bold text-gray-800">Quản lý Booking</h5>
                      <p className="text-xs text-gray-400">Xem lịch diễn & doanh thu</p>
                   </div>
                </Link>
                <Link to="/rehearsals" className="flex items-center gap-4 p-4 rounded-xl hover:bg-blue-50 transition group border border-transparent hover:border-blue-100">
                   <div className="bg-blue-100 text-blue-600 p-3 rounded-lg group-hover:scale-110 transition"><Calendar size={20}/></div>
                   <div>
                      <h5 className="font-bold text-gray-800">Lịch tập & Phạt</h5>
                      <p className="text-xs text-gray-400">Điểm danh & thu tiền phạt</p>
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