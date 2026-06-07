"use client";
 
import React, { useState, useEffect, useContext } from "react";
import api from '../../services/api'; 
import { AuthContext } from "../../context/AuthContext";
import Link from "next/link";
import toast from "react-hot-toast";
import { 
  Calendar, MapPin, User, Phone, DollarSign, Plus, Search, 
  CheckCircle, XCircle, Clock, Music, FileText, Loader, Lock, Unlock, PlayCircle, Check, Edit, Trash2,
  Users, ChevronDown, ChevronUp, Save, Camera, X, RefreshCw
} from "lucide-react";
import BookingModal from "../../components/BookingModal"; 

interface ShowItem {
  _id: string;
  title: string;
  customerName: string;
  phone?: string;
  date: string;
  time: string;
  location: string;
  price: number;
  deposit: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  isRegistrationClosed: boolean;
  // Trường mới
  eventType?: string;
  memberCount?: number;
  dresscode?: string;
  extraFee?: number;
}

interface AttendanceItem {
  _id: string;
  user: {
    _id: string;
    fullName: string;
    email?: string;
  };
  status: 'pending' | 'present' | 'late' | 'absent';
  fine: number;
}

interface RehearsalItem {
  _id: string;
  date: string;
  time: string;
  location: string;
  content?: string;
  attendance: AttendanceItem[];
}

export default function BookingAndRehearsalManager() {
  const { user } = useContext(AuthContext);
  
  // Tab điều khiển chính: "shows" (Lịch diễn) | "rehearsals" (Lịch tập ráp)
  const [subTab, setSubTab] = useState<"shows" | "rehearsals">("shows");

  // ==========================================
  // STATES & FUNCTIONS CHO LỊCH BIỂU DIỄN (SHOWS)
  // ==========================================
  const [bookings, setBookings] = useState<ShowItem[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingSearchTerm, setBookingSearchTerm] = useState("");
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [bookingActiveTab, setBookingActiveTab] = useState("all");

  const initialBookingForm = {
    title: "", customerName: "", phone: "", date: "", time: "", location: "",
    price: "", deposit: "", notes: "",
    eventType: "", memberCount: "", dresscode: "", extraFee: ""
  };
  const [bookingFormData, setBookingFormData] = useState(initialBookingForm);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/shows'); 
      setBookings(res.data || []);
    } catch (err) {
      toast.error("Lỗi tải danh sách show");
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleBookingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setBookingFormData({ ...bookingFormData, [e.target.name]: e.target.value });
  };

  const handleBookingEditClick = (e: React.MouseEvent, item: ShowItem) => {
    e.preventDefault(); 
    e.stopPropagation();
    const formattedDate = item.date ? new Date(item.date).toISOString().split('T')[0] : "";
    setEditingBookingId(item._id);
    setBookingFormData({
      title: item.title || "",
      customerName: item.customerName || "",
      phone: item.phone || "",
      date: formattedDate,
      time: item.time || "",
      location: item.location || "",
      price: String(item.price || 0),
      deposit: String(item.deposit || 0),
      notes: item.notes || "",
      eventType: (item as any).eventType || "",
      memberCount: String((item as any).memberCount || ""),
      dresscode: (item as any).dresscode || "",
      extraFee: String((item as any).extraFee || "")
    });
    setShowBookingModal(true);
  };

  const handleBookingCreateClick = () => {
    setEditingBookingId(null);
    setBookingFormData(initialBookingForm); 
    setShowBookingModal(true);
  };

  const handleBookingSave = async () => {
    if (!bookingFormData.title || !bookingFormData.date || !bookingFormData.price) {
      toast.error("Vui lòng nhập các thông tin bắt buộc!");
      return;
    }
    
    try {
      if (editingBookingId) {
        await api.put(`/shows/${editingBookingId}`, bookingFormData);
        toast.success("Đã cập nhật thông tin show!");
      } else {
        await api.post('/shows', bookingFormData);
        toast.success("Đã tạo Booking mới! 🎤");
      }
      setShowBookingModal(false);
      setBookingFormData(initialBookingForm);
      setEditingBookingId(null);
      fetchBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi thao tác");
    }
  };

  const handleBookingDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); 
    e.stopPropagation();
    if (!window.confirm("Bạn chắc chắn muốn xóa show này?")) return;
    try { 
      await api.delete(`/shows/${id}`); 
      toast.success("Đã xóa"); 
      fetchBookings(); 
    } catch (err) { 
      toast.error("Lỗi xóa"); 
    }
  };

  const updateBookingStatus = async (e: React.MouseEvent, id: string, status: string) => {
    e.preventDefault(); 
    e.stopPropagation();
    try { 
      await api.put(`/shows/${id}/status`, { status }); 
      toast.success("Đã cập nhật trạng thái!"); 
      fetchBookings(); 
    } catch (err) { 
      toast.error("Lỗi cập nhật"); 
    }
  };

  const toggleBookingLock = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); 
    e.stopPropagation();
    try { 
      await api.put(`/shows/${id}/toggle-registration`); 
      toast.success("Đã thay đổi trạng thái đăng ký"); 
      fetchBookings(); 
    } catch (err) { 
      toast.error("Lỗi thao tác"); 
    }
  };

  // ==========================================
  // STATES & FUNCTIONS CHO LỊCH TẬP RÁP (REHEARSALS)
  // ==========================================
  const [rehearsals, setRehearsals] = useState<RehearsalItem[]>([]);
  const [loadingRehearsals, setLoadingRehearsals] = useState(true);
  const [showRehearsalModal, setShowRehearsalModal] = useState(false);
  const [rehearsalForm, setRehearsalForm] = useState({ date: "", time: "", location: "", content: "" });
  const [expandedRehearsalId, setExpandedRehearsalId] = useState<string | null>(null);
  const [editingAttendance, setEditingAttendance] = useState<AttendanceItem[]>([]);

  const [showQRModal, setShowQRModal] = useState(false);
  const [qrRehearsal, setQrRehearsal] = useState<RehearsalItem | null>(null);
  const [qrToken, setQrToken] = useState("");
  const [qrLoading, setQrLoading] = useState(false);

  const fetchRehearsals = async () => {
    try {
      const res = await api.get("/rehearsals");
      setRehearsals(res.data || []);
    } catch (err) { 
      toast.error("Lỗi tải lịch tập"); 
    } finally { 
      setLoadingRehearsals(false); 
    }
  };

  const handleRehearsalCreate = async () => {
    if (!rehearsalForm.date || !rehearsalForm.time || !rehearsalForm.location) return toast.error("Vui lòng nhập đủ thông tin");
    try {
      await api.post("/rehearsals", rehearsalForm);
      toast.success("Đã lên lịch tập mới! 🎸");
      setShowRehearsalModal(false);
      setRehearsalForm({ date: "", time: "", location: "", content: "" });
      fetchRehearsals();
    } catch (err) { 
      toast.error("Lỗi tạo lịch"); 
    }
  };

  const handleRehearsalDelete = async (id: string) => {
    if (!window.confirm("Xóa lịch tập này?")) return;
    try {
      await api.delete(`/rehearsals/${id}`);
      toast.success("Đã xóa");
      fetchRehearsals();
    } catch (err) { 
      toast.error("Lỗi xóa"); 
    }
  };

  const toggleRehearsalExpand = (item: RehearsalItem) => {
    if (expandedRehearsalId === item._id) {
      setExpandedRehearsalId(null);
    } else {
      setExpandedRehearsalId(item._id);
      setEditingAttendance(JSON.parse(JSON.stringify(item.attendance || [])));
    }
  };

  const changeAttendanceStatus = (memberId: string, newStatus: 'pending' | 'present' | 'late' | 'absent') => {
    setEditingAttendance(prev => prev.map(m => {
      const mUserId = m.user?._id || m.user;
      if (mUserId === memberId || m._id === memberId) {
        let fine = 0;
        if (newStatus === 'late') fine = 50000;
        if (newStatus === 'absent') fine = 100000;
        return { ...m, status: newStatus, fine };
      }
      return m;
    }));
  };

  const saveRehearsalAttendance = async (rehearsalId: string) => {
    try {
      await api.put(`/rehearsals/${rehearsalId}/attendance`, { attendance: editingAttendance });
      toast.success("Đã cập nhật điểm danh!");
      fetchRehearsals(); 
      setExpandedRehearsalId(null);
    } catch (err) { 
      toast.error("Lỗi lưu điểm danh"); 
    }
  };

  const fetchQRToken = async (rehearsalId: string) => {
    setQrLoading(true);
    try {
      const res = await api.get(`/rehearsals/${rehearsalId}/qr-token`);
      setQrToken(res.data.token);
    } catch (err) {
      toast.error("Không thể tạo mã QR điểm danh");
    } finally {
      setQrLoading(false);
    }
  };

  const handleShowRehearsalQR = (item: RehearsalItem) => {
    setQrRehearsal(item);
    setShowQRModal(true);
    setQrToken("");
    fetchQRToken(item._id);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showQRModal && qrRehearsal) {
      interval = setInterval(() => {
        fetchQRToken(qrRehearsal._id);
      }, 60000);
    }
    return () => clearInterval(interval);
  }, [showQRModal, qrRehearsal]);

  // Nạp dữ liệu ban đầu
  useEffect(() => {
    fetchBookings();
    fetchRehearsals();
  }, []);

  // Tính toán số liệu Shows
  const currentMonth = new Date().getMonth();
  const showsThisMonth = bookings.filter(b => b.date && new Date(b.date).getMonth() === currentMonth).length;
  const totalBookingRevenue = bookings.reduce((sum, b) => sum + (Number(b.price) || 0), 0);
  const pendingBookingRevenue = bookings.reduce((sum, b) => sum + ((Number(b.price) || 0) - (Number(b.deposit) || 0)), 0);

  const filteredBookings = bookings.filter(b => {
    const matchSearch = b.title.toLowerCase().includes(bookingSearchTerm.toLowerCase()) ||
                        (b.customerName || "").toLowerCase().includes(bookingSearchTerm.toLowerCase()) ||
                        (b.location || "").toLowerCase().includes(bookingSearchTerm.toLowerCase());
    const matchTab = bookingActiveTab === "all" || b.status === bookingActiveTab;
    return matchSearch && matchTab;
  });

  // Tính toán số liệu Rehearsals
  const totalRehearsalFines = rehearsals.reduce((acc, curr) => {
    const list = curr.attendance || []; 
    return acc + list.reduce((sum, m) => sum + (m.fine || 0), 0);
  }, 0);

  const getQRLinkOrigin = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'http://localhost:3000';
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER HỆ THỐNG */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-slate-200/60 pb-6">
          <div>
            <h1 className="text-3xl font-black text-slate-850 flex items-center gap-3">
              <span className="bg-gradient-to-tr from-indigo-650 to-fuchsia-600 text-white p-2.5 rounded-2xl shadow-lg shadow-indigo-500/10">
                <Calendar size={26} />
              </span>
              QUẢN LÝ LỊCH TRÌNH BAN NHẠC
            </h1>
            <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">
              Hợp diễn, biểu diễn, tập ráp và điểm danh chuyên cần
            </p>
          </div>

          {/* SubTab Chọn Phân Hệ */}
          <div className="bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200 flex shadow-sm w-full md:w-auto">
            <button
              onClick={() => setSubTab("shows")}
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition ${
                subTab === "shows" ? "bg-white text-indigo-650 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Lịch Biểu Diễn ({bookings.length})
            </button>
            <button
              onClick={() => setSubTab("rehearsals")}
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition ${
                subTab === "rehearsals" ? "bg-white text-indigo-650 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Lịch Tập Ráp ({rehearsals.length})
            </button>
          </div>
        </div>

        {subTab === "shows" && (
          <div className="space-y-8 animate-fade-in">
            {/* Thống kê Show */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200/60 rounded-3xl p-6 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-indigo-550 text-xs font-bold uppercase tracking-wider">Show tháng này</p>
                  <h3 className="text-3xl font-black text-slate-850 mt-1">{showsThisMonth}</h3>
                </div>
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm"><Calendar size={24}/></div>
              </div>
              
              <div className="bg-white border border-slate-200/60 rounded-3xl p-6 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tổng Doanh thu</p>
                  <h3 className="text-3xl font-black text-slate-850 mt-1">{(totalBookingRevenue/1000000).toFixed(1)}M</h3>
                </div>
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm"><DollarSign size={24}/></div>
              </div>
              
              <div className="bg-white border border-slate-200/60 rounded-3xl p-6 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-amber-500 text-xs font-bold uppercase tracking-wider">Chờ thanh toán</p>
                  <h3 className="text-3xl font-black text-amber-600 mt-1">{(pendingBookingRevenue/1000000).toFixed(1)}M</h3>
                </div>
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-sm"><Clock size={24}/></div>
              </div>
            </div>

            {/* Bộ lọc và Tìm kiếm */}
            <div className="flex flex-col md:flex-row justify-between gap-4 items-stretch">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                <input 
                  type="text" placeholder="Tìm tên show, khách hàng, địa điểm..." 
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-850 outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition font-semibold text-sm shadow-sm"
                  value={bookingSearchTerm} onChange={(e) => setBookingSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between gap-3 shrink-0">
                <div className="flex overflow-x-auto gap-1 bg-slate-100 p-1 rounded-2xl max-w-full">
                  {[
                    { id: "all", name: "Tất cả" },
                    { id: "pending", name: "Chờ duyệt" },
                    { id: "confirmed", name: "Sắp diễn" },
                    { id: "completed", name: "Đã diễn" }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setBookingActiveTab(tab.id)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition whitespace-nowrap ${
                        bookingActiveTab === tab.id
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {tab.name}
                    </button>
                  ))}
                </div>
                {user?.role === 'admin' && (
                  <button onClick={handleBookingCreateClick} className="flex items-center gap-2 bg-indigo-650 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl font-bold shadow-md transition whitespace-nowrap text-xs uppercase tracking-wider">
                    <Plus size={18}/> Tạo Mới
                  </button>
                )}
              </div>
            </div>

            {/* Danh sách Bookings */}
            <div className="grid grid-cols-1 gap-5">
              {loadingBookings ? (
                <div className="text-center py-20"><Loader className="animate-spin mx-auto text-indigo-500" size={32}/></div>
              ) : filteredBookings.length === 0 ? (
                 <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
                    <Music size={36} className="mx-auto text-slate-350 mb-3"/>
                    <p className="text-slate-500 text-xs font-semibold">Không tìm thấy show diễn nào.</p>
                 </div>
              ) : (
                filteredBookings.map((item) => (
                  <div key={item._id} className="bg-white rounded-[28px] border border-slate-200 hover:border-indigo-500/15 shadow-sm hover:shadow-md transition group overflow-hidden">
                    <Link href={`/bookings/${item._id}`} className="p-6 flex flex-col md:flex-row gap-6 items-center md:items-start cursor-pointer">
                      
                      {/* Calendar Date Card */}
                      <div className="flex-shrink-0 w-full md:w-24 h-24 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center p-4 md:p-0 shadow-sm">
                        <span className="text-rose-500 font-extrabold uppercase text-[10px] tracking-wider mb-0.5">Tháng {new Date(item.date).getMonth() + 1}</span>
                        <span className="text-3xl font-black text-slate-800 leading-none">{new Date(item.date).getDate()}</span>
                        <span className="text-slate-400 text-[10px] font-bold mt-1">{new Date(item.date).getFullYear()}</span>
                      </div>

                      {/* Show Details */}
                      <div className="flex-1 w-full space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                          <div>
                            <h3 className="text-lg font-black text-slate-850 group-hover:text-indigo-650 transition-colors">{item.title}</h3>
                            <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500 mt-1.5">
                              <span className="flex items-center gap-1"><User size={14} className="text-blue-500"/> {item.customerName}</span>
                              <span className="hidden sm:block text-slate-350">•</span>
                              <span className="flex items-center gap-1"><Phone size={14} className="text-emerald-500"/> {item.phone || "---"}</span>
                            </div>
                          </div>
                          <div className="shrink-0">
                            {item.status === 'completed' && <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100 shadow-sm"><CheckCircle size={14}/> Đã diễn</span>}
                            {item.status === 'pending' && <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 text-xs font-bold border border-amber-100 shadow-sm animate-pulse"><Clock size={14}/> Chờ duyệt</span>}
                            {item.status === 'confirmed' && (
                              item.isRegistrationClosed 
                                ? <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold border border-rose-100 shadow-sm"><Lock size={14}/> Đã chốt ĐK</span>
                                : <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100 shadow-sm"><CheckCircle size={14}/> Đang nhận ĐK</span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs">
                          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 font-bold"><Clock size={14} className="text-orange-500"/> {item.time}</div>
                          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 font-bold max-w-[200px] truncate"><MapPin size={14} className="text-blue-500"/> {item.location}</div>
                          {(item as any).eventType && <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-650 px-3 py-1.5 rounded-lg font-bold border border-indigo-100/50">{(item as any).eventType}</div>}
                          {(item as any).memberCount && <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 font-bold"><Users size={14} className="text-purple-500"/> {(item as any).memberCount} người</div>}
                          {item.notes && <div className="flex items-center gap-1.5 bg-amber-50/70 text-amber-700 px-3 py-1.5 rounded-lg font-medium italic border border-amber-100/20 max-w-[220px] truncate"><FileText size={14}/> {item.notes}</div>}
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
                    </Link>
                    
                    {/* TOOLBAR ADMIN */}
                    {user?.role === 'admin' && (
                      <div className="bg-slate-50/80 border-t border-slate-150 p-3 flex flex-wrap justify-end gap-2 items-center px-6">
                         <button onClick={(e) => handleBookingEditClick(e, item)} className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl hover:bg-slate-100 shadow-sm flex items-center gap-1.5 transition">
                            <Edit size={13}/> Sửa
                         </button>
                         <button onClick={(e) => handleBookingDelete(e, item._id)} className="text-xs font-bold text-rose-600 bg-white border border-rose-200 px-3.5 py-1.5 rounded-xl hover:bg-rose-50 shadow-sm flex items-center gap-1.5 transition">
                            <Trash2 size={13}/> Xóa
                         </button>

                         {item.status === 'pending' && (
                              <button onClick={(e) => updateBookingStatus(e, item._id, 'confirmed')} className="text-xs font-bold text-white bg-indigo-650 px-4 py-1.5 rounded-xl hover:bg-indigo-700 shadow-sm flex items-center gap-1.5 transition">
                                 <PlayCircle size={13}/> Duyệt & Mở Nhận ĐK
                              </button>
                         )}

                         {item.status === 'confirmed' && (
                           <>
                              <button onClick={(e) => toggleBookingLock(e, item._id)} className={`text-xs font-bold px-4 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 text-white transition ${item.isRegistrationClosed ? 'bg-amber-500 hover:bg-amber-600' : 'bg-rose-500 hover:bg-rose-600'}`}>
                                 {item.isRegistrationClosed ? <><Unlock size={13}/> Mở đăng ký</> : <><Lock size={13}/> Chốt sổ đăng ký</>}
                              </button>
                              <button onClick={(e) => updateBookingStatus(e, item._id, 'completed')} className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 transition">
                                <Check size={13}/> Hoàn thành
                              </button>
                           </>
                         )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {subTab === "rehearsals" && (
          <div className="space-y-8 animate-fade-in">
            {/* Thống kê Lịch tập */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200/55 p-6 rounded-3xl flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-indigo-655 text-xs font-bold uppercase tracking-wider">Số buổi tập ráp band</p>
                  <h3 className="text-3xl font-black text-slate-850 mt-1">{rehearsals.length}</h3>
                </div>
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm"><Music size={24}/></div>
              </div>
              
              <div className="bg-white border border-slate-200/55 p-6 rounded-3xl flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-rose-505 text-xs font-bold uppercase tracking-wider">Quỹ phạt chờ thu</p>
                  <h3 className="text-3xl font-black text-rose-600 mt-1">{totalRehearsalFines.toLocaleString()}đ</h3>
                </div>
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-sm"><DollarSign size={24}/></div>
              </div>
            </div>

            {/* Thanh bar công cụ */}
            <div className="flex justify-between items-center gap-4">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Nhật ký tập ráp định kỳ</span>
              <div className="flex gap-2">
                <Link href="/checkin" className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-5 py-3 rounded-2xl font-bold shadow-md transition transform active:scale-[0.98] text-xs uppercase tracking-wider">
                  <Camera size={18}/> Quét QR Điểm Danh
                </Link>
                {user?.role === 'admin' && (
                  <button onClick={() => setShowRehearsalModal(true)} className="flex items-center gap-2 bg-indigo-650 hover:bg-indigo-700 text-white px-5 py-3.5 rounded-2xl font-bold shadow-md shadow-indigo-500/10 transition transform active:scale-[0.98] text-xs uppercase tracking-wider">
                    <Plus size={18}/> Lên Lịch Tập
                  </button>
                )}
              </div>
            </div>

            {/* Danh sách Rehearsals */}
            <div className="space-y-5">
              {loadingRehearsals ? (
                <div className="text-center py-20"><Loader className="animate-spin mx-auto text-indigo-650" size={32}/></div>
              ) : rehearsals.length === 0 ? (
                 <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
                    <Music size={36} className="mx-auto text-slate-300 mb-3"/>
                    <p className="text-slate-505 text-xs font-semibold">Chưa có lịch tập nào được ghi nhận.</p>
                 </div>
              ) : (
                rehearsals.map((item) => (
                  <div key={item._id} className={`bg-white rounded-3xl border border-slate-200 transition-all duration-300 overflow-hidden ${expandedRehearsalId === item._id ? 'ring-2 ring-indigo-500/20 shadow-md' : 'shadow-sm'}`}>
                    <div className="p-6 flex flex-col md:flex-row gap-6">
                      
                      {/* Calendar Date Icon */}
                      <div className="flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 bg-slate-50 text-slate-800 rounded-2xl border border-slate-200 shadow-sm">
                        <span className="text-[9px] font-black uppercase text-indigo-655">{new Date(item.date).toLocaleString('vi', { month: 'short' })}</span>
                        <span className="text-3xl font-black leading-none mt-0.5">{new Date(item.date).getDate()}</span>
                      </div>

                      <div className="flex-1 space-y-3">
                        <h3 className="text-lg font-black text-slate-850 leading-tight">{item.content || "Buổi tập thường kỳ"}</h3>
                        <div className="flex flex-wrap gap-2.5 text-xs">
                          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 font-bold"><Clock size={14} className="text-orange-500"/> {item.time}</div>
                          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 font-bold"><MapPin size={14} className="text-blue-500"/> {item.location}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 md:border-l md:pl-6 border-slate-150 justify-between md:justify-start">
                        {user?.role === 'admin' && (
                          <button 
                            onClick={() => handleShowRehearsalQR(item)}
                            className="flex items-center gap-1 bg-violet-50 text-violet-650 border border-violet-100 hover:bg-violet-100 px-3.5 py-2.5 rounded-xl font-bold text-xs transition"
                            title="Tạo mã QR điểm danh"
                          >
                            <Camera size={14}/> Mã QR
                          </button>
                        )}
                        <button onClick={() => toggleRehearsalExpand(item)} className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl font-bold text-xs transition duration-150 ${expandedRehearsalId === item._id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-650 hover:bg-slate-200'}`}>
                          <Users size={15}/> {user?.role === 'admin' ? "Điểm danh" : "Thành viên"}
                          {expandedRehearsalId === item._id ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
                        </button>
                        {user?.role === 'admin' && (
                          <button onClick={() => handleRehearsalDelete(item._id)} className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition">
                            <Trash2 size={18}/>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Điểm danh mở rộng */}
                    {expandedRehearsalId === item._id && (
                      <div className="bg-slate-50/50 border-t border-slate-150 p-6 md:p-7">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {(editingAttendance || []).map((m) => (
                            <div key={m.user?._id || m._id} className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition">
                              <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 text-indigo-650 flex items-center justify-center font-black text-base border border-indigo-100/30">
                                  {m.user?.fullName?.charAt(0) || "?"}
                                </div>
                                <div>
                                  <p className="font-extrabold text-slate-800 text-xs md:text-sm leading-tight">{m.user?.fullName || "Thành viên"}</p>
                                  <p className={`text-[10px] font-black uppercase mt-1 ${m.status === 'present' ? 'text-emerald-500' : m.status === 'late' ? 'text-amber-500' : m.status === 'absent' ? 'text-rose-500' : 'text-slate-450'}`}>
                                     {m.status === 'pending' ? 'Chưa báo danh' : m.status === 'present' ? 'Có mặt' : m.status === 'late' ? 'Đi muộn' : 'Vắng mặt'}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                 {user?.role === 'admin' ? (
                                   <>
                                     <button 
                                       onClick={() => changeAttendanceStatus(m.user?._id || m._id, 'present')} 
                                       title="Có mặt"
                                       className={`p-2.5 rounded-xl transition border ${m.status === 'present' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm' : 'text-slate-300 hover:bg-slate-100 border-transparent'}`}
                                     >
                                       <CheckCircle size={18}/>
                                     </button>
                                     <button 
                                       onClick={() => changeAttendanceStatus(m.user?._id || m._id, 'late')} 
                                       title="Trễ (phạt 50k)"
                                       className={`p-2.5 rounded-xl transition border ${m.status === 'late' ? 'bg-amber-50 text-amber-600 border-amber-200 shadow-sm' : 'text-slate-300 hover:bg-slate-100 border-transparent'}`}
                                     >
                                       <Clock size={18}/>
                                     </button>
                                     <button 
                                       onClick={() => changeAttendanceStatus(m.user?._id || m._id, 'absent')} 
                                       title="Vắng (phạt 100k)"
                                       className={`p-2.5 rounded-xl transition border ${m.status === 'absent' ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-sm' : 'text-slate-300 hover:bg-slate-100 border-transparent'}`}
                                     >
                                       <XCircle size={18}/>
                                     </button>
                                   </>
                                 ) : m.fine > 0 && (
                                   <span className="px-3 py-1.5 bg-rose-50 text-rose-600 text-[10px] font-black rounded-xl border border-rose-100 shadow-sm">
                                     -{m.fine.toLocaleString()}đ
                                   </span>
                                 )}
                              </div>
                            </div>
                          ))}
                        </div>
                        {user?.role === 'admin' && (
                          <div className="mt-6 flex justify-end">
                             <button onClick={() => saveRehearsalAttendance(item._id)} className="flex items-center gap-1.5 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-xs shadow-md hover:bg-black transition transform active:scale-95 tracking-wide">
                               <Save size={15}/> LƯU BẢNG ĐIỂM DANH
                             </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <BookingModal 
        isOpen={showBookingModal} 
        onClose={() => setShowBookingModal(false)} 
        onSave={handleBookingSave} 
        formData={bookingFormData} 
        handleChange={handleBookingChange} 
        editingId={editingBookingId} 
      />

      {/* MODAL CREATE REHEARSAL */}
      {showRehearsalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/65 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 border border-slate-200">
              <h3 className="text-xl font-black text-slate-850 mb-6 flex items-center gap-2">Lên Lịch Tập Mới <span className="text-indigo-650">🎸</span></h3>
              <div className="space-y-4 text-xs">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-405 uppercase tracking-widest mb-1.5">Ngày tập</label>
                        <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ring-indigo-500/20 outline-none font-bold text-slate-800" onChange={e => setRehearsalForm({...rehearsalForm, date: e.target.value})}/>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-405 uppercase tracking-widest mb-1.5">Giờ tập</label>
                        <input type="time" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ring-indigo-500/20 outline-none font-bold text-slate-800" onChange={e => setRehearsalForm({...rehearsalForm, time: e.target.value})}/>
                    </div>
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-slate-405 uppercase tracking-widest mb-1.5">Địa điểm tập</label>
                    <input type="text" placeholder="Tên phòng tập (VD: Sonar Studio)..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ring-indigo-500/20 outline-none font-medium text-slate-850" onChange={e => setRehearsalForm({...rehearsalForm, location: e.target.value})}/>
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-slate-405 uppercase tracking-widest mb-1.5">Nội dung tập ráp (Tùy chọn)</label>
                    <textarea rows={3} placeholder="Ghi chú setlist bài ráp hôm nay..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ring-indigo-500/20 outline-none font-medium text-slate-850" onChange={e => setRehearsalForm({...rehearsalForm, content: e.target.value})}></textarea>
                 </div>
              </div>
              <div className="mt-8 flex gap-2.5 justify-end text-xs font-bold">
                 <button onClick={() => setShowRehearsalModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl transition">Hủy</button>
                 <button onClick={handleRehearsalCreate} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-black transition shadow-md">TẠO LỊCH TẬP</button>
              </div>
           </div>
        </div>
      )}

      {/* Modal QR Điểm Danh (Admin) */}
      {showQRModal && qrRehearsal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center border border-slate-200 animate-slide-up">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-150">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Mã QR Điểm Danh Buổi Tập</h3>
                <button onClick={() => setShowQRModal(false)} className="text-slate-400 hover:bg-slate-100 hover:text-slate-800 p-1.5 rounded-full transition"><X size={16}/></button>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl mb-4 border border-slate-200 flex flex-col items-center justify-center min-h-[260px]">
                {qrLoading && !qrToken ? (
                  <Loader className="animate-spin text-indigo-650" size={32}/>
                ) : qrToken ? (
                  <>
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${getQRLinkOrigin()}/checkin/${qrRehearsal._id}?token=${qrToken}`)}`}
                      alt="Checkin QR"
                      className="w-48 h-48 object-contain rounded-xl shadow-md border border-white bg-white p-2"
                    />
                    <div className="mt-3 flex items-center gap-1.5 text-[10px] text-amber-600 font-extrabold bg-amber-50 px-2.5 py-1 rounded-md">
                      <RefreshCw size={10} className="animate-spin"/> Mã QR tự động làm mới sau 60s
                    </div>
                  </>
                ) : (
                  <p className="text-xs font-bold text-rose-500">Lỗi tạo mã QR. Vui lòng thử lại.</p>
                )}
              </div>

              <div className="text-xs text-left bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 space-y-1">
                <p className="font-extrabold text-slate-700">Thông tin buổi tập:</p>
                <p className="text-[11px] text-slate-600 font-semibold">• Ngày: {new Date(qrRehearsal.date).toLocaleDateString('vi-VN')}</p>
                <p className="text-[11px] text-slate-600 font-semibold">• Giờ tập: {qrRehearsal.time}</p>
                <p className="text-[11px] text-slate-600 font-semibold">• Địa điểm: {qrRehearsal.location}</p>
              </div>

              <div className="flex flex-col gap-2">
                {/* Hiển thị token thô để admin sao chép gửi cho thành viên */}
                {qrToken && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mã Token (gửi cho thành viên nếu không quét được)</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-[10px] font-mono font-bold text-indigo-650 bg-indigo-50 px-2 py-1.5 rounded-lg border border-indigo-100 truncate select-all">
                        {qrToken}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(qrToken);
                          toast.success("Đã sao chép mã token!");
                        }}
                        className="shrink-0 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px] uppercase tracking-wide transition shadow-sm"
                      >
                        Sao chép
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      const checkinUrl = `${getQRLinkOrigin()}/checkin/${qrRehearsal._id}?token=${qrToken}`;
                      navigator.clipboard.writeText(checkinUrl);
                      toast.success("Đã sao chép link check-in!");
                    }}
                    className="flex-1 py-2.5 bg-slate-100 border border-slate-250 text-slate-700 font-bold rounded-lg text-xs hover:bg-slate-200 transition"
                  >
                    Sao chép Link
                  </button>
                  <button 
                    onClick={() => fetchQRToken(qrRehearsal._id)}
                    className="px-4 py-2.5 bg-indigo-50 border border-indigo-150 text-indigo-655 font-bold rounded-lg text-xs hover:bg-indigo-100 transition"
                  >
                    <RefreshCw size={14}/>
                  </button>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
