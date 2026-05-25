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
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // "all", "pending", "confirmed", "completed"

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
    if (item.status === 'completed') return <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100 shadow-sm"><CheckCircle size={14}/> Đã diễn</span>;
    if (item.status === 'pending') return <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 text-xs font-bold border border-amber-100 shadow-sm animate-pulse"><Clock size={14}/> Chờ duyệt</span>;
    if (item.status === 'confirmed') {
        if (item.isRegistrationClosed) return <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold border border-rose-100 shadow-sm"><Lock size={14}/> Đã chốt ĐK</span>;
        return <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100 shadow-sm"><CheckCircle size={14}/> Đang nhận ĐK</span>;
    }
    return null;
  };

  // Lọc show diễn theo Search Term và theo Tab
  const filteredBookings = bookings.filter(b => {
    const matchSearch = b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (b.customerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (b.location || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchTab = activeTab === "all" || b.status === activeTab;
    return matchSearch && matchTab;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 pt-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <span className="bg-gradient-to-tr from-indigo-650 to-fuchsia-600 text-white p-2.5 rounded-xl shadow-lg shadow-indigo-500/10"><Music size={24} /></span>
              QUẢN LÝ LỊCH DIỄN
            </h1>
          </div>
          {user?.role === 'admin' && (
            <button onClick={handleCreateClick} className="flex items-center gap-2 bg-indigo-650 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-bold shadow-md shadow-indigo-500/10 transition transform active:scale-[0.98]">
              <Plus size={20}/> Tạo Lịch Diễn Mới
            </button>
          )}
        </div>

        {/* THỐNG KÊ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-indigo-550 text-xs font-bold uppercase tracking-wide">Show tháng này</p>
              <h3 className="text-3xl font-black text-slate-850 mt-1">{showsThisMonth}</h3>
            </div>
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm"><Calendar size={24}/></div>
          </div>
          
          <div className="rounded-3xl p-6 text-white flex items-center justify-between shadow-lg shadow-indigo-500/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-violet-700 z-0"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl z-0"></div>
            <div className="relative z-10">
              <p className="text-indigo-100 text-xs font-bold uppercase tracking-wide">Tổng Doanh thu</p>
              <h3 className="text-3xl font-black mt-1">{(totalRevenue/1000000).toFixed(1)}M</h3>
            </div>
            <div className="relative z-10 w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10"><DollarSign size={24}/></div>
          </div>
          
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-amber-500 text-xs font-bold uppercase tracking-wide">Chờ thanh toán</p>
              <h3 className="text-3xl font-black text-amber-600 mt-1">{(pendingRevenue/1000000).toFixed(1)}M</h3>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-sm"><Clock size={24}/></div>
          </div>
        </div>

        {/* SEARCH AND TABS CONTAINER */}
        <div className="space-y-4">
          {/* SEARCH BAR */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
            <input 
              type="text" placeholder="Tìm tên show, khách hàng, địa điểm..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-all font-medium text-sm"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* TAB FILTERS */}
          <div className="flex overflow-x-auto gap-1 bg-slate-100/60 p-1 rounded-2xl max-w-full">
            {[
              { id: "all", name: "Tất cả", count: bookings.length },
              { id: "pending", name: "Chờ duyệt", count: bookings.filter(b => b.status === "pending").length },
              { id: "confirmed", name: "Sắp diễn", count: bookings.filter(b => b.status === "confirmed").length },
              { id: "completed", name: "Đã hoàn thành", count: bookings.filter(b => b.status === "completed").length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-white text-indigo-600 shadow-sm shadow-slate-200/50"
                    : "text-slate-500 hover:text-slate-850 hover:bg-white/40"
                }`}
              >
                {tab.name}
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                  activeTab === tab.id 
                    ? "bg-indigo-50 text-indigo-650" 
                    : "bg-slate-200/60 text-slate-500"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* LIST BOOKING */}
        <div className="grid grid-cols-1 gap-5">
          {loading ? (
            <div className="text-center py-20"><Loader className="animate-spin mx-auto text-indigo-500" size={32}/></div>
          ) : filteredBookings.length === 0 ? (
             <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
                <Music size={40} className="mx-auto text-slate-300 mb-3"/>
                <p className="text-slate-500 text-xs font-semibold">Không tìm thấy show diễn nào phù hợp.</p>
             </div>
          ) : (
             filteredBookings.map((item) => (
              <Link to={`/bookings/${item._id}`} key={item._id} className="bg-white rounded-[28px] border border-slate-200/65 hover:border-indigo-500/15 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden block">
                <div className="p-6 md:p-6.5 flex flex-col md:flex-row gap-6 items-center md:items-start">
                  
                  {/* Calendar Date Card */}
                  <div className="flex-shrink-0 w-full md:w-24 h-24 bg-slate-50 rounded-2xl border border-slate-200/55 flex flex-col items-center justify-center p-4 md:p-0 shadow-sm group-hover:scale-[1.02] transition-transform duration-300">
                    <span className="text-rose-500 font-extrabold uppercase text-[10px] tracking-wider mb-0.5">Tháng {new Date(item.date).getMonth() + 1}</span>
                    <span className="text-3xl font-black text-slate-800 leading-none">{new Date(item.date).getDate()}</span>
                    <span className="text-slate-400 text-[10px] font-bold mt-1">{new Date(item.date).getFullYear()}</span>
                  </div>

                  {/* Show Details */}
                  <div className="flex-1 w-full space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                      <div>
                        <h3 className="text-lg font-black text-slate-850 group-hover:text-indigo-600 transition-colors duration-200">{item.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500 mt-1.5">
                          <span className="flex items-center gap-1"><User size={14} className="text-blue-500"/> {item.customerName}</span>
                          <span className="hidden sm:block text-slate-350">•</span>
                          <span className="flex items-center gap-1"><Phone size={14} className="text-emerald-500"/> {item.phone || "---"}</span>
                        </div>
                      </div>
                      <div className="shrink-0">{getStatusBadge(item)}</div>
                    </div>

                    <div className="flex flex-wrap gap-2.5 text-xs">
                      <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 font-bold"><Clock size={14} className="text-orange-500"/> {item.time}</div>
                      <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 font-bold max-w-[280px] truncate"><MapPin size={14} className="text-blue-500"/> {item.location}</div>
                      {item.notes && <div className="flex items-center gap-1.5 bg-amber-50/70 text-amber-700 px-3 py-1.5 rounded-lg font-medium italic border border-amber-100/20"><FileText size={14}/> {item.notes}</div>}
                    </div>
                  </div>

                  {/* Financial Overview */}
                  <div className="flex-shrink-0 w-full md:w-44 bg-slate-50/50 rounded-2xl p-4 border border-slate-150 flex flex-col justify-center">
                     <div className="text-right mb-2">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Cát-xê / người</p>
                        <p className="text-xl font-black text-emerald-600 mt-0.5">{(item.price || 0).toLocaleString()}đ</p>
                     </div>
                     <div className="flex justify-between text-[11px] font-bold border-t border-slate-200 pt-2 mt-1">
                        <span className="text-slate-500">Cọc: {(item.deposit || 0).toLocaleString()}</span>
                        <span className={(item.price - item.deposit) > 0 ? "text-rose-500" : "text-emerald-500"}>
                          {(item.price - item.deposit) > 0 ? `Bù: ${(item.price - item.deposit).toLocaleString()}` : "Đã đủ"}
                        </span>
                     </div>
                  </div>
                </div>
                
                {/* TOOLBAR ADMIN */}
                {user?.role === 'admin' && (
                  <div className="bg-slate-50/80 border-t border-slate-150 p-3 flex flex-wrap justify-end gap-2 items-center px-6">
                     <button onClick={(e) => handleEditClick(e, item)} className="text-xs font-bold text-slate-650 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl hover:bg-slate-100 shadow-sm flex items-center gap-1.5 transition duration-150">
                        <Edit size={13}/> Sửa
                     </button>
                     <button onClick={(e) => handleDelete(e, item._id)} className="text-xs font-bold text-rose-600 bg-white border border-rose-200 px-3.5 py-1.5 rounded-xl hover:bg-rose-550 hover:text-white shadow-sm flex items-center gap-1.5 transition duration-150">
                        <Trash2 size={13}/> Xóa
                     </button>

                     {item.status === 'pending' && (
                          <button onClick={(e) => updateStatus(e, item._id, 'confirmed')} className="text-xs font-bold text-white bg-indigo-650 px-4 py-1.5 rounded-xl hover:bg-indigo-700 shadow-sm flex items-center gap-1.5 transition duration-150">
                             <PlayCircle size={13}/> Duyệt & Mở Nhận ĐK
                          </button>
                     )}

                     {item.status === 'confirmed' && (
                       <>
                          <button onClick={(e) => toggleLock(e, item._id)} className={`text-xs font-bold px-4 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 text-white transition duration-150 ${item.isRegistrationClosed ? 'bg-amber-500 hover:bg-amber-600' : 'bg-rose-500 hover:bg-rose-600'}`}>
                             {item.isRegistrationClosed ? <><Unlock size={13}/> Mở đăng ký</> : <><Lock size={13}/> Chốt sổ đăng ký</>}
                          </button>
                          <button onClick={(e) => updateStatus(e, item._id, 'completed')} className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 transition duration-150">
                            <Check size={13}/> Hoàn thành
                          </button>
                       </>
                     )}
                  </div>
                )}
              </Link>
            ))
          )}
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