import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { 
  Calendar, MapPin, User, Phone, DollarSign, 
  Plus, Search, Filter, 
  CheckCircle, Clock, XCircle, Music, FileText, Trash2, Loader
} from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom"; // Ensure Link is imported

const BookingManager = () => {
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // API Config
  const API_URL = "https://band-manager-s9tm.onrender.com/api/shows";
  const getHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  // Form State
  const initialForm = {
    title: "", customerName: "", phone: "", 
    date: "", time: "", location: "", 
    price: "", deposit: "", notes: "" 
  };
  const [formData, setFormData] = useState(initialForm);

  // 1. Fetch Bookings
  const fetchBookings = async () => {
    try {
      const res = await axios.get(API_URL, getHeaders());
      setBookings(res.data);
    } catch (err) {
      toast.error("Lỗi tải danh sách show");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  // 2. Handle Input Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. Create New Show
  const handleCreate = async () => {
    if (!formData.title || !formData.date || !formData.price) return toast.error("Vui lòng nhập các thông tin bắt buộc!");
    
    try {
      await axios.post(API_URL, formData, getHeaders());
      toast.success("Đã tạo Booking mới! 🎤");
      setShowModal(false);
      setFormData(initialForm);
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi tạo show");
    }
  };

  // 4. Delete Show
  const handleDelete = async (e, id) => {
    e.preventDefault(); // Prevent navigation when clicking delete
    e.stopPropagation();
    if(!window.confirm("Bạn chắc chắn muốn xóa show này?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`, getHeaders());
      toast.success("Đã xóa");
      fetchBookings();
    } catch (err) { toast.error("Lỗi xóa"); }
  };

  // 5. Update Status
  const updateStatus = async (e, id, status) => {
    e.preventDefault(); // Prevent navigation when clicking status buttons
    e.stopPropagation();
    try {
      await axios.put(`${API_URL}/${id}/status`, { status }, getHeaders());
      toast.success("Đã cập nhật trạng thái");
      fetchBookings();
    } catch (err) { toast.error("Lỗi cập nhật"); }
  };

  // Statistics
  const currentMonth = new Date().getMonth();
  const showsThisMonth = bookings.filter(b => new Date(b.date).getMonth() === currentMonth).length;
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.price || 0), 0);
  const pendingRevenue = bookings.reduce((sum, b) => sum + ((b.price || 0) - (b.deposit || 0)), 0);

  // Status Badge Helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold border border-yellow-200"><Clock size={12}/> Đang chốt</span>;
      case 'confirmed': return <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200"><CheckCircle size={12}/> Đã chốt</span>;
      case 'completed': return <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold border border-green-200"><Music size={12}/> Đã diễn</span>;
      case 'cancelled': return <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200"><XCircle size={12}/> Đã hủy</span>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3">
              <span className="bg-gradient-to-r from-pink-500 to-rose-500 text-white p-2.5 rounded-xl shadow-lg shadow-pink-200"><Music size={28} /></span>
              Quản Lý Booking
            </h1>
          </div>
          {user?.role === 'admin' && (
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-xl font-bold shadow-lg hover:bg-gray-800 transition transform active:scale-95">
              <Plus size={20}/> Tạo Booking Mới
            </button>
          )}
        </div>

        {/* REAL-TIME STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div><p className="text-gray-400 text-xs font-bold uppercase">Show tháng này</p><h3 className="text-3xl font-extrabold text-gray-800 mt-1">{showsThisMonth}</h3></div>
            <div className="w-12 h-12 bg-pink-50 text-pink-500 rounded-full flex items-center justify-center"><Calendar size={24}/></div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-2xl shadow-lg shadow-green-200 text-white flex items-center justify-between">
            <div><p className="text-green-100 text-xs font-bold uppercase">Tổng Doanh thu</p><h3 className="text-3xl font-extrabold mt-1">{(totalRevenue/1000000).toFixed(1)}M</h3></div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"><DollarSign size={24}/></div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 flex items-center justify-between">
            <div><p className="text-orange-400 text-xs font-bold uppercase">Chờ thanh toán</p><h3 className="text-3xl font-extrabold text-orange-600 mt-1">{(pendingRevenue/1000000).toFixed(1)}M</h3></div>
            <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center"><Clock size={24}/></div>
          </div>
        </div>

        {/* SEARCH */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
            <input 
              type="text" 
              placeholder="Tìm tên show, khách hàng..." 
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 ring-pink-500 outline-none shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-600 font-medium shadow-sm flex items-center gap-2"><Filter size={18}/> Lọc</button>
        </div>

        {/* BOOKING LIST */}
        <div className="grid grid-cols-1 gap-4">
          {loading ? <div className="text-center py-10"><Loader className="animate-spin mx-auto text-pink-500"/></div> : 
           bookings.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? 
           <p className="text-center text-gray-400 py-10">Chưa có show nào.</p> :
           
           bookings.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
            // START CHANGE: Wrapped card content in Link
            <Link 
              to={`/bookings/${item._id}`} 
              key={item._id} 
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden block"
            >
              <div className="p-6 flex flex-col md:flex-row gap-6">
                
                {/* Date Ticket */}
                <div className="flex-shrink-0 w-full md:w-24 bg-gray-50 rounded-xl border border-gray-200 flex flex-col items-center justify-center p-4 md:p-0">
                  <span className="text-red-500 font-bold uppercase text-xs tracking-wider">THÁNG {new Date(item.date).getMonth() + 1}</span>
                  <span className="text-3xl font-black text-gray-800">{new Date(item.date).getDate()}</span>
                  <span className="text-gray-400 text-xs font-medium">{new Date(item.date).getFullYear()}</span>
                </div>

                {/* Main Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 group-hover:text-pink-600 transition">{item.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <User size={14}/> {item.customerName} • <Phone size={14}/> {item.phone || "---"}
                      </div>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2"><Clock size={16} className="text-orange-500"/> <span className="font-semibold">{item.time}</span></div>
                    <div className="flex items-center gap-2"><MapPin size={16} className="text-blue-500"/> {item.location}</div>
                    {item.notes && <div className="flex items-center gap-2 text-gray-500 italic"><FileText size={16}/> {item.notes}</div>}
                  </div>
                </div>

                {/* Financial Column */}
                <div className="flex-shrink-0 w-full md:w-48 border-t md:border-t-0 md:border-l border-gray-100 md:pl-6 pt-4 md:pt-0 flex flex-col justify-center gap-2">
                   <div className="text-right">
                      <p className="text-xs text-gray-400 font-bold uppercase">Tổng cát-xê</p>
                      <p className="text-xl font-extrabold text-green-600">{(item.price || 0).toLocaleString()}đ</p>
                   </div>
                   <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className={`h-full ${item.deposit >= item.price ? 'bg-green-500' : 'bg-yellow-400'}`} style={{ width: `${Math.min(100, (item.deposit / item.price) * 100)}%` }}></div>
                   </div>
                   <div className="flex justify-between text-xs font-medium">
                      <span className="text-gray-500">Cọc: {(item.deposit || 0).toLocaleString()}</span>
                      <span className={(item.price - item.deposit) > 0 ? "text-red-500" : "text-green-500"}>
                        {(item.price - item.deposit) > 0 ? `Thiếu: ${(item.price - item.deposit).toLocaleString()}` : "Đủ"}
                      </span>
                   </div>
                </div>
              </div>
              
              {/* Admin Toolbar */}
              {user?.role === 'admin' && (
                <div className="bg-gray-50 border-t border-gray-100 p-2 flex justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                   {/* Passed 'e' to stop propagation */}
                   {item.status !== 'completed' && <button onClick={(e) => updateStatus(e, item._id, 'completed')} className="text-xs font-bold text-green-600 bg-white border border-green-200 px-3 py-1.5 rounded hover:bg-green-50">✓ Hoàn thành</button>}
                   {item.status !== 'confirmed' && <button onClick={(e) => updateStatus(e, item._id, 'confirmed')} className="text-xs font-bold text-blue-600 bg-white border border-blue-200 px-3 py-1.5 rounded hover:bg-blue-50">✓ Chốt</button>}
                   <button onClick={(e) => handleDelete(e, item._id)} className="text-xs font-bold text-red-500 hover:text-red-700 px-3 py-1.5 rounded bg-white border hover:border-red-300 shadow-sm transition flex items-center gap-1"><Trash2 size={14}/> Xóa</button>
                </div>
              )}
            </Link>
            // END CHANGE
          ))}
        </div>

      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-scale-up">
            <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
               <h3 className="font-bold text-lg flex items-center gap-2"><Plus size={20}/> Tạo Booking Mới</h3>
               <button onClick={() => setShowModal(false)} className="hover:text-red-400"><XCircle size={24}/></button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Tên Show *</label><input name="title" value={formData.title} onChange={handleChange} type="text" className="w-full p-3 border rounded-xl focus:ring-2 ring-pink-500 outline-none bg-gray-50" placeholder="VD: Tiệc tất niên cty A"/></div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Tên Khách Hàng</label><input name="customerName" value={formData.customerName} onChange={handleChange} type="text" className="w-full p-3 border rounded-xl focus:ring-2 ring-pink-500 outline-none bg-gray-50" placeholder="Người liên hệ"/></div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">SĐT</label><input name="phone" value={formData.phone} onChange={handleChange} type="text" className="w-full p-3 border rounded-xl focus:ring-2 ring-pink-500 outline-none"/></div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Ngày diễn *</label><input name="date" value={formData.date} onChange={handleChange} type="date" className="w-full p-3 border rounded-xl focus:ring-2 ring-pink-500 outline-none"/></div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Giờ diễn</label><input name="time" value={formData.time} onChange={handleChange} type="time" className="w-full p-3 border rounded-xl focus:ring-2 ring-pink-500 outline-none"/></div>
               </div>
               <div><label className="block text-sm font-bold text-gray-700 mb-1">Địa điểm</label><input name="location" value={formData.location} onChange={handleChange} type="text" className="w-full p-3 border rounded-xl focus:ring-2 ring-pink-500 outline-none" placeholder="Nhập địa chỉ chính xác"/></div>
               <div className="grid grid-cols-2 gap-4 bg-green-50 p-4 rounded-xl border border-green-100">
                  <div><label className="block text-sm font-bold text-green-800 mb-1">Tổng Cát-xê *</label><input name="price" value={formData.price} onChange={handleChange} type="number" className="w-full p-3 border rounded-xl focus:ring-2 ring-green-500 outline-none" placeholder="0"/></div>
                  <div><label className="block text-sm font-bold text-green-800 mb-1">Đã cọc</label><input name="deposit" value={formData.deposit} onChange={handleChange} type="number" className="w-full p-3 border rounded-xl focus:ring-2 ring-green-500 outline-none" placeholder="0"/></div>
               </div>
               <div><label className="block text-sm font-bold text-gray-700 mb-1">Ghi chú</label><textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" className="w-full p-3 border rounded-xl focus:ring-2 ring-pink-500 outline-none" placeholder="Yêu cầu khác..."></textarea></div>
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
               <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition">Hủy bỏ</button>
               <button onClick={handleCreate} className="px-6 py-2.5 rounded-xl font-bold bg-gray-900 text-white hover:bg-black shadow-lg transition">Tạo Booking</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManager;