import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { 
  Calendar, Clock, MapPin, User, ArrowLeft, Music, 
  UploadCloud, AlertTriangle
} from "lucide-react";
import toast from "react-hot-toast";

const BookingDetail = () => {
  const { id } = useParams(); // Get ID from URL
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = `https://band-manager-s9tm.onrender.com/api/shows/${id}`;

  useEffect(() => {
    const fetchShow = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(API_URL, { headers: { Authorization: `Bearer ${token}` } });
        setShow(res.data);
      } catch (error) {
        toast.error("Lỗi tải thông tin show");
        navigate("/bookings"); 
      } finally {
        setLoading(false);
      }
    };
    fetchShow();
  }, [id, navigate]);

  // Handle Join / Leave Show
  const handleJoin = async () => {
    try {
      const token = localStorage.getItem('token');
      // Call join API
      const res = await axios.post(
        `https://band-manager-s9tm.onrender.com/api/shows/${id}/join`, 
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(res.data.message);
      
      // Refresh page to show updated list
      window.location.reload(); 
      
    } catch (err) {
      toast.error("Lỗi thao tác");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">Đang tải thông tin show...</div>;
  if (!show) return null;

  // Check if current user has joined
  const isJoined = show.participants?.some(p => p.user?._id === user?._id);

  const fmt = (num) => (num || 0).toLocaleString('vi-VN') + 'đ';

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Back Button */}
        <Link to="/bookings" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold transition mb-2">
          <ArrowLeft size={20}/> Quay lại danh sách
        </Link>

        {/* SHOW HEADER */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex gap-2 mb-3">
                 <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${show.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : show.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {show.status === 'confirmed' ? 'Đã Chốt Lịch' : show.status === 'completed' ? 'Đã Hoàn Thành' : 'Đang Chờ Duyệt'}
                 </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">{show.title}</h1>
              <div className="flex flex-wrap gap-6 mt-4 text-gray-600 font-medium text-sm">
                <span className="flex items-center gap-2"><Calendar className="text-pink-500" size={18}/> {new Date(show.date).toLocaleDateString('vi-VN')}</span>
                <span className="flex items-center gap-2"><Clock className="text-orange-500" size={18}/> {show.time}</span>
                <span className="flex items-center gap-2"><MapPin className="text-blue-500" size={18}/> {show.location}</span>
              </div>
            </div>

            <div className="text-right bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <p className="text-xs text-gray-400 font-bold uppercase">Cát-xê dự kiến</p>
              <p className="text-2xl font-black text-green-600">{fmt(show.price)}</p>
              {show.deposit > 0 && <p className="text-xs text-gray-500 mt-1">Đã cọc: {fmt(show.deposit)}</p>}
            </div>
          </div>
        </div>

        {/* MAIN CONTENT (2 Cols) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* LEFT COL: Register & Music List */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Registration Box */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                <User className="text-purple-500"/> Đăng Ký Tham Gia
              </h3>
              
              <div className="bg-purple-50 p-5 rounded-xl border border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-gray-900">Bạn có muốn tham gia show này?</p>
                  <p className="text-sm text-gray-600 mt-1">Xác nhận sớm để Leader sắp xếp đội hình nhé.</p>
                </div>
                
                {/* Dynamic Join Button */}
                <button 
                  onClick={handleJoin}
                  className={`px-6 py-2.5 rounded-xl font-bold shadow-lg transition active:scale-95 whitespace-nowrap
                    ${isJoined 
                      ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                >
                  {isJoined ? "❌ Hủy tham gia" : "✋ Đăng ký ngay"}
                </button>
              </div>

              {/* Participants List */}
              <div className="mt-6">
                <p className="text-xs font-bold text-gray-400 uppercase mb-3">Đội hình hiện tại ({show.participants?.length || 0})</p>
                <div className="space-y-3">
                  {show.participants && show.participants.length > 0 ? (
                    show.participants.map((p) => (
                      <div key={p._id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700 text-xs">
                          {p.user?.fullName?.charAt(0)}
                        </div>
                        <span className="font-bold text-gray-700 text-sm">{p.user?.fullName}</span>
                        {p.user?._id === user?._id && <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded border">Bạn</span>}
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-3 p-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                       <span className="text-sm italic">Chưa có ai đăng ký...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Music List Box */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Music className="text-pink-500"/> List Nhạc & Beat
                </h3>
                <button className="text-sm font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition flex items-center gap-1">
                  <UploadCloud size={16}/> Up Beat Mới
                </button>
              </div>

              <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <Music className="mx-auto text-gray-300 mb-2 opacity-50" size={40}/>
                <p className="text-gray-500 text-sm font-medium">Chưa có bài hát nào.</p>
                <p className="text-xs text-gray-400 mt-1">Hãy thêm bài hát để mọi người cùng tập nhé!</p>
              </div>
            </div>
          </div>

          {/* RIGHT COL: Customer Info */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 text-lg">Thông tin Khách Hàng</h3>
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-400 uppercase font-bold mb-1">Tên khách hàng</p>
                  <p className="font-semibold text-gray-800">{show.customerName}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-400 uppercase font-bold mb-1">Liên hệ</p>
                  <p className="font-semibold text-gray-800">{show.phone || "Không có SĐT"}</p>
                </div>
                
                <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                  <p className="text-xs text-yellow-600 uppercase font-bold mb-2 flex items-center gap-1">
                    <AlertTriangle size={12}/> Ghi chú Show
                  </p>
                  <p className="text-sm text-gray-700 italic leading-relaxed">
                    "{show.notes || "Không có ghi chú gì đặc biệt."}"
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BookingDetail;