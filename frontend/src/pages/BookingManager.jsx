import { useState, useEffect, useContext } from "react";
import api from '../services/api'; 
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { 
  Calendar, MapPin, User, Phone, DollarSign, Plus, Search, 
  CheckCircle, Clock, Music, FileText, Loader, Lock, Unlock, PlayCircle, Check, Edit, Trash2, Sparkles, AlertCircle
} from "lucide-react";
import BookingModal from "../components/BookingModal"; 

const BookingManager = () => {
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const[showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const[editingId, setEditingId] = useState(null);

  const initialForm = {
    title: "", customerName: "", phone: "", date: "", time: "", location: "", price: "", deposit: "", notes: "" 
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/shows'); 
      setBookings(res.data);
    } catch (err) {
      toast.error("Lỗi tải danh sách show");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); },[]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleEditClick = (e, item) => {
    e.preventDefault(); e.stopPropagation();
    const formattedDate = item.date ? new Date(item.date).toISOString().split('T')[0] : "";
    setEditingId(item._id);
    setFormData({
      title: item.title || "", customerName: item.customerName || "", phone: item.phone || "",
      date: formattedDate, time: item.time || "", location: item.location || "",
      price: item.price || 0, deposit: item.deposit || 0, notes: item.notes || ""
    });
    setShowModal(true);
  };

  const handleCreateClick = () => {
    setEditingId(null);
    setFormData(initialForm); 
    setShowModal(true);
  }

  const handleSave = async () => {
    if (!formData.title || !formData.date || !formData.price) return toast.error("Vui lòng nhập các thông tin bắt buộc!");
    try {
      if (editingId) {
        await api.put(`/shows/${editingId}`, formData);
        toast.success("Đã cập nhật thông tin show!");
      } else {
        await api.post('/shows', formData);
        toast.success("Đã tạo Booking mới! 🎤");
      }
      setShowModal(false);
      setFormData(initialForm);
      setEditingId(null);
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi thao tác");
    }
  };

  const handleDelete = async (e, id) => {
    e.preventDefault(); e.stopPropagation();
    if(!window.confirm("Bạn chắc chắn muốn xóa show này?")) return;
    try { await api.delete(`/shows/${id}`); toast.success("Đã xóa"); fetchBookings(); } catch (err) { toast.error("Lỗi xóa"); }
  };

  const updateStatus = async (e, id, status) => {
    e.preventDefault(); e.stopPropagation();
    try { await api.put(`/shows/${id}/status`, { status }); toast.success("Đã cập nhật trạng thái!"); fetchBookings(); } catch (err) { toast.error("Lỗi cập nhật"); }
  };

  const toggleLock = async (e, id) => {
    e.preventDefault(); e.stopPropagation();
    try { await api.put(`/shows/${id}/toggle-registration`); toast.success("Đã thay đổi trạng thái đăng ký"); fetchBookings(); } catch (err) { toast.error("Lỗi thao tác"); }
  };

  const currentMonth = new Date().getMonth();
  const showsThisMonth = bookings.filter(b => new Date(b.date).getMonth() === currentMonth).length;
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.price || 0), 0);
  const pendingRevenue = bookings.reduce((sum, b) => sum + ((b.price || 0) - (b.deposit || 0)), 0);

  const getStatusBadge = (item) => {
    if (item.status === 'completed') return <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100 shadow-sm"><CheckCircle size={14}/> Đã diễn xong</span>;
    if (item.status === 'pending') return <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 text-amber-600 text-xs font-bold border border-amber-100 shadow-sm animate-pulse"><Clock size={14}/> Chờ duyệt</span>;
    if (item.status === 'confirmed') {
        if (item.isRegistrationClosed) return <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold border border-rose-100 shadow-sm"><Lock size={14}/> Đã chốt sổ</span>;
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100 shadow-sm"><CheckCircle size={14}/> Đang mở ĐK</span>;
    }
    return null;
  };

  return (
    <div className="min-h-screen p-4 md:p-8 pt-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
              <span className="bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white p-2.5 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.3)]"><Music size={28} /></span>
              QUẢN LÝ BOOKING
            </h1>
          </div>
          {user?.role === 'admin' && (
            <button onClick={handleCreateClick} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl font-bold shadow-xl hover:bg-black transition transform active:scale-95">
              <Plus size={20}/> Tạo Booking Mới
            </button>
          )}
        </div>

        {/* THỐNG KÊ (Glassmorphism) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass rounded-3xl p-6 flex items-center justify-between card-hover">
            <div><p className="text-violet-500 text-xs font-bold uppercase tracking-wide">Show tháng này</p><h3 className="text-4xl font-black text-slate-800 mt-1">{showsThisMonth}</h3></div>
            <div className="w-14 h-14 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center shadow-inner"><Calendar size={28}/></div>
          </div>
          <div className="glass-dark bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-3xl text-white flex items-center justify-between card-hover relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl"></div>
            <div className="relative z-10"><p className="text-emerald-400 text-xs font-bold uppercase tracking-wide">Tổng Doanh thu</p><h3 className="text-4xl font-black mt-1">{(totalRevenue/1000000).toFixed(1)}M</h3></div>
            <div className="relative z-10 w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10"><DollarSign size={28}/></div>
          </div>
          <div className="glass rounded-3xl p-6 flex items-center justify-between card-hover">
            <div><p className="text-amber-500 text-xs font-bold uppercase tracking-wide">Chờ thanh toán</p><h3 className="text-4xl font-black text-amber-600 mt-1">{(pendingRevenue/1000000).toFixed(1)}M</h3></div>
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner"><Clock size={28}/></div>
          </div>
        </div>

        {/* SEARCH */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
            <input 
              type="text" placeholder="Tìm tên show, khách hàng, địa điểm..." 
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-white bg-white/50 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus:ring-2 ring-violet-500 outline-none font-medium transition placeholder-slate-400"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* LIST BOOKING */}
        <div className="grid grid-cols-1 gap-5">
          {loading ? <div className="text-center py-10"><Loader className="animate-spin mx-auto text-violet-500" size={32}/></div> : 
           bookings.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
             <div className="text-center py-16 glass rounded-3xl border-dashed">
                <Music size={40} className="mx-auto text-slate-300 mb-4"/>
                <p className="text-slate-500 font-medium">Chưa có show nào được tìm thấy.</p>
             </div>
           ) :
           
           bookings.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
            <Link to={`/bookings/${item._id}`} key={item._id} className="glass rounded-3xl border border-white/60 shadow-sm hover:shadow-[0_8px_30px_rgb(139,92,246,0.1)] hover:border-violet-200 transition-all duration-300 group overflow-hidden block">
              <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
                
                {/* Lịch Date */}
                <div className="flex-shrink-0 w-full md:w-28 h-28 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 flex flex-col items-center justify-center p-4 md:p-0 shadow-inner group-hover:scale-105 transition-transform duration-300">
                  <span className="text-rose-500 font-black uppercase text-xs tracking-widest mb-1">THÁNG {new Date(item.date).getMonth() + 1}</span>
                  <span className="text-4xl font-black text-slate-800 leading-none">{new Date(item.date).getDate()}</span>
                  <span className="text-slate-400 text-xs font-bold mt-1">{new Date(item.date).getFullYear()}</span>
                </div>

                {/* Thông tin Show */}
                <div className="flex-1 w-full space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                    <div>
                      <h3 className="text-2xl font-black text-slate-800 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-violet-600 group-hover:to-fuchsia-600 transition">{item.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-500 mt-1.5">
                        <span className="flex items-center gap-1.5"><User size={16} className="text-blue-500"/> {item.customerName}</span>
                        <span className="hidden sm:block text-slate-300">•</span>
                        <span className="flex items-center gap-1.5"><Phone size={16} className="text-emerald-500"/> {item.phone || "---"}</span>
                      </div>
                    </div>
                    <div className="shrink-0">{getStatusBadge(item)}</div>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-lg font-semibold"><Clock size={16} className="text-orange-500"/> {item.time}</div>
                    <div className="flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-lg font-semibold"><MapPin size={16} className="text-blue-500"/> {item.location}</div>
                    {item.notes && <div className="flex items-center gap-2 bg-amber-50/80 text-amber-700 px-3 py-1.5 rounded-lg font-medium italic"><FileText size={16}/> {item.notes}</div>}
                  </div>
                </div>

                {/* Tài chính */}
                <div className="flex-shrink-0 w-full md:w-48 bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex flex-col justify-center">
                   <div className="text-right mb-2">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Cát-xê / người</p>
                      <p className="text-2xl font-black text-emerald-600">{(item.price || 0).toLocaleString()}đ</p>
                   </div>
                   <div className="flex justify-between text-xs font-bold border-t border-slate-200 pt-2 mt-1">
                      <span className="text-slate-500">Cọc: {(item.deposit || 0).toLocaleString()}</span>
                      <span className={(item.price - item.deposit) > 0 ? "text-rose-500" : "text-emerald-500"}>
                        {(item.price - item.deposit) > 0 ? `Thiếu: ${(item.price - item.deposit).toLocaleString()}` : "Đã đủ"}
                      </span>
                   </div>
                </div>
              </div>
              
              {/* TOOLBAR ADMIN */}
              {user?.role === 'admin' && (
                <div className="bg-slate-50/80 border-t border-slate-100 p-3 flex flex-wrap justify-end gap-2 items-center px-6">
                   <button onClick={(e) => handleEditClick(e, item)} className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3.5 py-2 rounded-xl hover:bg-slate-100 shadow-sm flex items-center gap-1.5 transition">
                      <Edit size={14}/> Sửa
                   </button>
                   <button onClick={(e) => handleDelete(e, item._id)} className="text-xs font-bold text-rose-600 bg-white border border-rose-200 px-3.5 py-2 rounded-xl hover:bg-rose-50 shadow-sm flex items-center gap-1.5 transition">
                      <Trash2 size={14}/> Xóa
                   </button>

                   {item.status === 'pending' && (
                        <button onClick={(e) => updateStatus(e, item._id, 'confirmed')} className="text-xs font-bold text-white bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 flex items-center gap-1.5 transition">
                           <PlayCircle size={14}/> Duyệt & Mở Đăng Ký
                        </button>
                   )}

                   {item.status === 'confirmed' && (
                     <>
                        <button onClick={(e) => toggleLock(e, item._id)} className={`text-xs font-bold px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5 text-white transition ${item.isRegistrationClosed ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-200'}`}>
                           {item.isRegistrationClosed ? <><Unlock size={14}/> Mở lại ĐK</> : <><Lock size={14}/> Chốt sổ</>}
                        </button>
                        <button onClick={(e) => updateStatus(e, item._id, 'completed')} className="text-xs font-bold text-white bg-emerald-600 px-4 py-2 rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-200 flex items-center gap-1.5 transition">
                          <Check size={14}/> Hoàn thành
                        </button>
                     </>
                   )}
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>

      <BookingModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        onSave={handleSave} 
        formData={formData} 
        handleChange={handleChange} 
        editingId={editingId} 
      />
    </div>
  );
};

export default BookingManager;