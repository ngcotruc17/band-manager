import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Calendar, DollarSign, MapPin, Clock, Music, ArrowRight, History, CheckCircle, AlertTriangle } from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState({
    balance: 0,
    pendingFines: 0, // 👈 Đã thêm state này
    upcomingEvents: [],
    historyEvents: [],
    rehearsals: []
  });
  const [loading, setLoading] = useState(true);

  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/dashboard`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setData(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatMoney = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  // Render badge trạng thái
  const renderStatus = (status) => {
    if (status === 'pending') return <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded-full">CHỜ DUYỆT</span>;
    if (status === 'completed') return <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle size={10}/> ĐÃ DIỄN</span>;
    return <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full">SẮP DIỄN</span>;
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-gray-400">Đang tải dữ liệu...</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
      
      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <div className="text-blue-100 font-bold uppercase tracking-wider text-xs mb-1">Dashboard quản lý</div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Xin chào, {user?.fullName}! 👋</h1>
          <p className="text-blue-100 opacity-90">Chào mừng trở lại. Kiểm tra lịch diễn và tập luyện ngay!</p>
        </div>
        <Link to="/bookings" className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition shadow-lg flex items-center gap-2">
           + Tạo Show Mới
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CỘT TRÁI (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* SHOW SẮP TỚI */}
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Music className="text-pink-500" /> Show Sắp Tới
            </h2>
            <div className="space-y-4">
              {data.upcomingEvents.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-dashed border-gray-300 text-center text-gray-400">
                  Chưa có show nào sắp tới. Nghỉ ngơi thôi! 😴
                </div>
              ) : (
                data.upcomingEvents.map(event => (
                  <Link key={event._id} to={`/events/${event._id}`} className="block group">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition flex items-center gap-5 relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-500 to-purple-500"></div>
                      <div className="flex-shrink-0 text-center bg-slate-50 p-3 rounded-xl min-w-[70px]">
                        <div className="text-xs font-bold text-slate-400 uppercase">THÁNG {new Date(event.date).getMonth() + 1}</div>
                        <div className="text-2xl font-black text-slate-800">{new Date(event.date).getDate()}</div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition">{event.title}</h3>
                        <div className="text-sm text-slate-500 flex items-center gap-3 mt-1">
                           <span className="flex items-center gap-1"><MapPin size={14}/> {event.location}</span>
                           <span className="flex items-center gap-1"><Clock size={14}/> {event.time || "19:00"}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {renderStatus(event.bookingRef?.status || 'approved')}
                        <ArrowRight size={18} className="text-gray-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition"/>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* LỊCH SỬ SHOW */}
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2 opacity-70">
              <History className="text-gray-500" /> Lịch Sử Show
            </h2>
            <div className="space-y-4">
               {data.historyEvents.length === 0 ? (
                 <p className="text-sm text-gray-400 italic ml-2">Chưa có show nào đã diễn.</p>
               ) : (
                 data.historyEvents.map(event => (
                  <Link key={event._id} to={`/events/${event._id}`} className="block group opacity-70 hover:opacity-100 transition">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center gap-4 hover:bg-white hover:shadow-sm">
                       <div className="text-center min-w-[50px]">
                          <div className="text-[10px] font-bold text-gray-400">THG {new Date(event.date).getMonth() + 1}</div>
                          <div className="text-xl font-bold text-gray-600">{new Date(event.date).getDate()}</div>
                       </div>
                       <div className="flex-1">
                          <h3 className="font-bold text-gray-700">{event.title}</h3>
                          <div className="text-xs text-gray-400 flex gap-2">
                             <span>{new Date(event.date).toLocaleDateString('vi-VN')}</span> • <span>{event.location}</span>
                          </div>
                       </div>
                       <div>{renderStatus('completed')}</div>
                    </div>
                  </Link>
                 ))
               )}
            </div>
          </div>

        </div>

        {/* CỘT PHẢI (1/3) */}
        <div className="space-y-8">
           
           {/* Widget Tiền */}
           <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -top-4 bg-green-50 rounded-full w-32 h-32 opacity-50"></div>
              <div className="relative z-10">
                 <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-green-100 text-green-600 rounded-xl"><DollarSign size={24}/></div>
                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-lg">Tiền mặt</span>
                 </div>
                 <div className="text-slate-400 text-xs font-bold uppercase tracking-wide">QUỸ THỰC TẾ</div>
                 <div className="text-3xl font-black text-slate-800 mt-1">{formatMoney(data.balance)}</div>
                 
                 {/* 👇 PHẦN PHẠT CHỜ THU - HIỂN THỊ SỐ TIỀN THẬT */}
                 <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                    <div className="text-xs text-amber-500 font-bold flex items-center gap-1">
                        <AlertTriangle size={12}/> PHẠT CHỜ THU
                    </div>
                    <div className="text-sm font-bold text-amber-600">
                        {formatMoney(data.pendingFines)} {/* 👈 Biến này giờ đã có giá trị */}
                    </div>
                 </div>
              </div>
           </div>

           {/* Widget Lịch Tập */}
           <div>
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Calendar className="text-amber-500"/> Lịch Tập</h2>
                 <Link to="/rehearsals" className="text-sm font-bold text-blue-600 hover:underline">Tất cả →</Link>
              </div>
              <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm min-h-[150px]">
                 {data.rehearsals.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                       <Calendar size={32} className="mb-2 opacity-20"/>
                       Chưa có lịch tập.
                    </div>
                 ) : (
                    <div className="space-y-3">
                       {data.rehearsals.map(reh => (
                          <div key={reh._id} className="flex gap-3 items-center p-2 hover:bg-slate-50 rounded-xl transition cursor-pointer">
                             <div className="bg-blue-50 text-blue-600 font-bold rounded-lg w-10 h-10 flex flex-col items-center justify-center leading-none">
                                <span className="text-[8px] uppercase">T{new Date(reh.date).getMonth()+1}</span>
                                <span className="text-lg">{new Date(reh.date).getDate()}</span>
                             </div>
                             <div>
                                <div className="font-bold text-slate-700 text-sm">{reh.content}</div>
                                <div className="text-xs text-slate-400 flex items-center gap-2">
                                   <span className="flex items-center gap-1"><Clock size={10}/> {reh.time}</span>
                                   <span className="flex items-center gap-1"><MapPin size={10}/> {reh.location}</span>
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;