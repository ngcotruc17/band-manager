import { useEffect, useState, useContext, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from '../services/api';
import { AuthContext } from "../context/AuthContext";
import { 
  Calendar, Clock, MapPin, User, ArrowLeft, Music, 
  Lock, Unlock, Check, X, AlertCircle, Download, Plus, Search, FileText, PlayCircle, ShieldCheck, Loader, CheckCircle, Phone 
} from "lucide-react";
import toast from "react-hot-toast";

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);

  // State Modal
  const [showAddMusicModal, setShowAddMusicModal] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [librarySongs, setLibrarySongs] = useState([]);
  const [musicForm, setMusicForm] = useState({ title: "", link: "", note: "" });
  const [librarySearchTerm, setLibrarySearchTerm] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentDescription, setPaymentDescription] = useState("");

  const fetchShow = useCallback(async () => {
    try {
      const res = await api.get(`/shows/${id}`);
      setShow(res.data);
    } catch (error) { 
      toast.error("Không tải được chi tiết Show"); 
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchShow(); }, [fetchShow]);

  // --- CÁC HÀNH ĐỘNG ---
  const handleJoin = async () => {
    try { 
      await api.post(`/shows/${id}/join`); 
      toast.success("Đã gửi yêu cầu tham gia!"); 
      fetchShow(); 
    } catch (err) { 
      toast.error(err.response?.data?.message || "Lỗi thao tác"); 
    }
  };

  const handleApprove = async (userId) => {
    try { 
      await api.put(`/shows/${id}/approve-participant`, { userId }); 
      toast.success("Đã duyệt thành viên!"); 
      fetchShow(); 
    } catch (err) { 
      toast.error("Lỗi duyệt"); 
    }
  };

  const handleRemove = async (userId) => {
    if(!window.confirm("Bạn có chắc muốn loại thành viên này?")) return;
    try { 
      await api.put(`/shows/${id}/remove-participant`, { userId }); 
      toast.success("Đã xóa khỏi danh sách"); 
      fetchShow(); 
    } catch (err) { 
      toast.error("Lỗi xóa"); 
    }
  };

  const toggleRegistration = async () => {
    try { 
      await api.put(`/shows/${id}/toggle-registration`); 
      toast.success("Đã đổi trạng thái đăng ký"); 
      fetchShow(); 
    } catch (err) { 
      toast.error("Lỗi thao tác"); 
    }
  };

  // --- QUẢN LÝ NHẠC ---
  const handleAddMusic = async () => {
    if (!musicForm.title) return toast.error("Vui lòng nhập tên bài hát");
    try {
      await api.post(`/shows/${id}/setlist`, musicForm);
      toast.success("Đã thêm bài hát vào Setlist!");
      setMusicForm({ title: "", link: "", note: "" });
      setShowAddMusicModal(false);
      fetchShow();
    } catch (err) { 
      toast.error("Lỗi thêm nhạc"); 
    }
  };

  const handleRemoveMusic = async (songId) => {
    if(!window.confirm("Xóa bài này khỏi setlist?")) return;
    try { 
      await api.delete(`/shows/${id}/setlist/${songId}`); 
      toast.success("Đã xóa khỏi setlist"); 
      fetchShow(); 
    } catch (err) { 
      toast.error("Lỗi xóa nhạc"); 
    }
  };

  const fetchLibrary = async () => {
    try {
      const res = await api.get(`/library`);
      setLibrarySongs(res.data);
      setShowLibraryModal(true);
    } catch (err) { 
      toast.error("Lỗi tải kho nhạc"); 
    }
  };

  const handleSelectFromLib = async (song, type = 'sheet') => {
    let linkToUse = "";
    let typeNote = "";

    if (type === 'sheet' && song.sheetUrl) { 
      linkToUse = song.sheetUrl; 
      typeNote = "(Sheet)"; 
    } else if (type === 'beat' && song.beatUrl) { 
      linkToUse = song.beatUrl; 
      typeNote = "(Beat)"; 
    } else { 
      linkToUse = song.sheetUrl || song.beatUrl || ""; 
    }

    try {
      await api.post(`/shows/${id}/setlist`, {
        title: song.title || song.name,
        link: linkToUse,
        note: `${song.note || ""} ${typeNote}`.trim()
      });
      toast.success(`Đã thêm: ${song.title || song.name}`);
      fetchShow();
      setShowLibraryModal(false);
    } catch (err) { 
      toast.error("Lỗi thêm nhạc"); 
    }
  };

  const getDownloadLink = (link) => {
    if (!link) return "#";
    const getAPIBase = () => {
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return 'http://localhost:5000';
        }
      }
      return 'https://band-manager-s9tm.onrender.com';
    };
    const cleanedUrl = link.replace(/\\/g, "/");
    if (cleanedUrl.includes("uploads/") || cleanedUrl.includes("file-")) {
      const pathPart = cleanedUrl.substring(cleanedUrl.indexOf("uploads/"));
      return `${getAPIBase()}/${pathPart}`;
    }
    return link;
  };

  if (loading || !show) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center space-y-4 transition-colors duration-300">
        <Loader className="animate-spin text-indigo-650" size={40} />
        <p className="text-indigo-600 font-bold animate-pulse text-xs uppercase tracking-widest">Đang tải chi tiết Lịch diễn...</p>
      </div>
    );
  }

  const approvedMembers = show.participants?.filter(p => p.status === 'approved') || [];
  const pendingMembers = show.participants?.filter(p => p.status === 'pending') || [];
  const isJoined = show.participants?.some(p => p.user?._id === user?._id);
  const isAdmin = user?.role === 'admin';
  const canRegister = show.status === 'confirmed' && !show.isRegistrationClosed;
  const canEditMusic = show.status === 'confirmed' || show.status === 'completed';

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 pt-6">
      
      {/* HEADER: Back Button & Title */}
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs font-bold text-slate-550 hover:text-slate-800 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm transition">
          <ArrowLeft size={16}/> Quay lại
        </button>

        <div className="mt-6 bg-white rounded-[32px] p-6 md:p-8 border border-slate-200/50 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                 {show.status === 'pending' && <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-250 text-amber-700 text-[10px] font-black uppercase tracking-widest animate-pulse">⏳ Chờ duyệt show</span>}
                 {show.status === 'confirmed' && !show.isRegistrationClosed && <span className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-black uppercase tracking-widest">✅ Đang nhận đăng ký</span>}
                 {show.status === 'confirmed' && show.isRegistrationClosed && <span className="px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><Lock size={12}/> Đã chốt sổ</span>}
                 {show.status === 'completed' && <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-250 text-emerald-700 text-[10px] font-black uppercase tracking-widest">🎉 Đã hoàn thành</span>}
              </div>
              
              <h1 className="text-3xl md:text-4xl font-black text-slate-850 tracking-tight leading-tight mb-4">{show.title}</h1>
              
              <div className="flex flex-wrap gap-4 text-slate-500 font-bold text-xs">
                <span className="flex items-center gap-1.5"><Calendar className="text-indigo-600" size={16}/> {new Date(show.date).toLocaleDateString('vi-VN')}</span>
                <span className="flex items-center gap-1.5"><Clock className="text-orange-500" size={16}/> {show.time}</span>
                <span className="flex items-center gap-1.5"><MapPin className="text-blue-500" size={16}/> {show.location}</span>
              </div>
            </div>
            
            <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl text-right md:min-w-[180px] shadow-sm">
              <p className="text-emerald-700 text-[9px] font-bold uppercase tracking-widest mb-0.5">Cát-xê / người</p>
              <p className="text-2xl font-black text-emerald-600">{(show.price || 0).toLocaleString()}đ</p>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT - 2 COLUMNS LAYOUT */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-8 relative z-20 animate-slide-up">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Setlist & Participants */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. PARTICIPANTS LIST */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/60 shadow-sm">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="text-emerald-500" size={22}/> ĐỘI HÌNH BIỂU DIỄN
                  </h3>
                  {isAdmin && show.status === 'confirmed' && (
                    <button onClick={toggleRegistration} className={`text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition duration-150 ${show.isRegistrationClosed ? 'bg-emerald-50 text-emerald-650 hover:bg-emerald-100' : 'bg-rose-50 text-rose-650 hover:bg-rose-100'}`}>
                       {show.isRegistrationClosed ? <><Unlock size={13}/> Mở lại đăng ký</> : <><Lock size={13}/> Chốt sổ đăng ký</>}
                    </button>
                  )}
               </div>

               {/* Join/Enroll Status Container */}
               <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 transition-all ${isJoined ? 'bg-emerald-50/50 border-emerald-150' : 'bg-slate-50 border-slate-200'}`}>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">
                      Đăng ký của bạn: 
                      <span className={`ml-1.5 font-black ${isJoined ? (approvedMembers.find(p=>p.user?._id === user._id) ? "text-emerald-600" : "text-amber-600") : "text-slate-500"}`}>
                        {isJoined ? (approvedMembers.find(p=>p.user?._id === user._id) ? "Đã được duyệt chính thức" : "Đang chờ duyệt") : "Chưa đăng ký đi diễn"}
                      </span>
                    </p>
                  </div>
                  {isJoined ? (
                     <button onClick={handleJoin} className="bg-white border border-slate-300 text-slate-650 px-5 py-2 rounded-xl font-bold hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition text-xs whitespace-nowrap">Rút tên đăng ký</button>
                  ) : (
                     <button onClick={handleJoin} disabled={!canRegister} className={`px-6 py-2.5 rounded-xl font-black text-xs transition tracking-wider whitespace-nowrap ${canRegister ? 'bg-slate-900 hover:bg-black text-white shadow-sm' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>✋ Đăng ký đi Show</button>
                  )}
               </div>

               {/* APPROVED MEMBERS */}
               <div className="mb-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3.5 flex items-center gap-1.5"><CheckCircle size={14} className="text-emerald-500"/> THÀNH VIÊN CHÍNH THỨC ({approvedMembers.length})</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     {approvedMembers.length > 0 ? approvedMembers.map(p => (
                        <div key={p._id} className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-2xl group hover:border-emerald-300 hover:shadow-sm transition-all">
                           <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black text-xs border border-emerald-100/50">
                                {p.user?.fullName?.charAt(0) || "U"}
                              </div>
                              <div>
                                <p className="font-extrabold text-xs text-slate-800">{p.user?.fullName || "Ẩn danh"}</p>
                                <p className="text-[9px] uppercase font-bold text-emerald-650 mt-0.5">{p.role}</p>
                              </div>
                           </div>
                           {isAdmin && (
                             <button onClick={() => handleRemove(p.user._id)} className="text-slate-350 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-xl transition duration-150 opacity-0 group-hover:opacity-100">
                               <X size={15}/>
                             </button>
                           )}
                        </div>
                     )) : <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center col-span-full">Chưa có thành viên nào được duyệt.</p>}
                  </div>
               </div>
               
               {/* PENDING MEMBERS */}
               {pendingMembers.length > 0 && (
                 <div className="pt-6 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3.5 flex items-center gap-1.5"><AlertCircle size={14} className="text-amber-500"/> DANH SÁCH CHỜ DUYỆT ({pendingMembers.length})</p>
                    <div className="space-y-2.5">
                       {pendingMembers.map(p => (
                          <div key={p._id} className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-2xl hover:border-amber-200 transition">
                             <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center font-extrabold text-xs">{p.user?.fullName?.charAt(0) || "U"}</div>
                                <p className="font-extrabold text-xs text-slate-700">{p.user?.fullName || "Ẩn danh"}</p>
                             </div>
                             {isAdmin && (
                                <div className="flex gap-1.5">
                                   <button onClick={() => handleApprove(p.user._id)} className="text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition">Duyệt</button>
                                   <button onClick={() => handleRemove(p.user._id)} className="text-[10px] font-black bg-white border border-slate-200 text-slate-500 px-3 py-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition">Loại</button>
                                </div>
                             )}
                          </div>
                       ))}
                    </div>
                 </div>
               )}
            </div>

            {/* 2. SETLIST SONGS */}
            <div className={`bg-white rounded-3xl p-6 md:p-8 border border-slate-200/60 shadow-sm ${!canEditMusic && 'opacity-80'}`}>
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><Music className="text-indigo-600" size={22}/> SETLIST BÀI HÁT</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={fetchLibrary} disabled={!canEditMusic} className="text-xs font-bold text-indigo-650 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl flex items-center gap-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                      <Search size={14}/> Chọn từ Kho
                    </button>
                    <button onClick={() => setShowAddMusicModal(true)} disabled={!canEditMusic} className="text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-xl flex items-center gap-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                      <Plus size={14}/> Thêm Link Ngoài
                    </button>
                  </div>
               </div>

               <div className="space-y-3">
                  {show.setlist && show.setlist.length > 0 ? (
                    show.setlist.map((song, idx) => (
                      <div key={song._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-white border border-slate-200 rounded-2xl hover:border-indigo-300 hover:shadow-sm transition group gap-4">
                         <div className="flex items-center gap-3.5 overflow-hidden w-full sm:w-auto">
                            <span className="text-lg font-black text-slate-300 w-6 text-center">{idx + 1}</span>
                            <div className="min-w-0 flex-1">
                               <p className="font-extrabold text-slate-800 text-sm truncate group-hover:text-indigo-650 transition-colors">{song.title}</p>
                               <p className="text-xs text-slate-500 truncate mt-0.5">{song.note || "Không có ghi chú"}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            {song.link && (
                              <a 
                                href={getDownloadLink(song.link)} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-[11px] font-black text-slate-650 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl hover:bg-slate-100 flex items-center gap-1.5 transition whitespace-nowrap"
                              >
                                <Download size={13}/> Xem / Tải Sheet Beat
                              </a>
                            )}
                            <button onClick={() => handleRemoveMusic(song._id)} className="text-slate-400 hover:bg-rose-50 hover:text-rose-500 p-2 rounded-xl transition"><X size={16}/></button>
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 border border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                       <Music size={32} className="mx-auto text-slate-300 mb-3"/>
                    </div>
                  )}
               </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Customer Detail Card, Payment & Salary Split */}
          <div className="space-y-8">
             {/* THANH TOÁN CARD */}
             {show.status !== 'completed' && show.status !== 'cancelled' && (show.deposit > 0 || show.price > 0) && (
               <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/60 shadow-sm">
                  <h3 className="font-extrabold text-slate-850 mb-6 text-sm flex items-center gap-2 pb-4 border-b border-slate-100">
                    <FileText className="text-blue-500"/> THANH TOÁN / ĐẶT CỌC
                  </h3>
                  <div className="space-y-4">
                     {show.deposit > 0 && (
                        <div className="flex flex-col gap-2">
                           <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-550 font-bold">Số tiền đặt cọc:</span>
                              <span className="font-extrabold text-slate-800">{show.deposit.toLocaleString()}đ</span>
                           </div>
                           <button 
                             onClick={() => {
                               setPaymentAmount(show.deposit);
                               setPaymentDescription(`Coc Show: ${show.title}`);
                               setShowPaymentModal(true);
                             }}
                             className="w-full py-2.5 bg-blue-50 text-blue-600 border border-blue-150 hover:bg-blue-100 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2"
                           >
                             Quét VietQR Đặt Cọc
                           </button>
                        </div>
                     )}
                     {show.price > 0 && (
                        <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                           <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-550 font-bold">Tổng chi phí Show:</span>
                              <span className="font-extrabold text-slate-800">{show.price.toLocaleString()}đ</span>
                           </div>
                           <button 
                             onClick={() => {
                               setPaymentAmount(show.price);
                               setPaymentDescription(`Thanh Toan Show: ${show.title}`);
                               setShowPaymentModal(true);
                             }}
                             className="w-full py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm"
                           >
                             Quét VietQR Toàn Bộ
                           </button>
                        </div>
                     )}
                  </div>
               </div>
             )}

             {/* SALARY SPLIT CARD */}
             {show.status === 'completed' && (
               <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/60 shadow-sm bg-gradient-to-br from-emerald-50/20 to-white">
                  <h3 className="font-black text-slate-800 mb-6 text-sm flex items-center gap-2 pb-4 border-b border-slate-100">
                    <CheckCircle className="text-emerald-500" size={18}/> BẢNG KÊ CÁT-XÊ CHI TIẾT
                  </h3>
                  <div className="space-y-4 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-550 font-bold">Tổng doanh thu show:</span>
                      <span className="font-black text-slate-800">{(show.salarySplit?.totalPrice || show.price || 0).toLocaleString()}đ</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-550 font-bold">Trích Quỹ Band ({show.salarySplit?.bandFundPercent || 10}%):</span>
                      <span className="font-black text-rose-500">-{(show.salarySplit?.bandFundAmount || 0).toLocaleString()}đ</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-550 font-bold">Chia cho mỗi thành viên ({show.salarySplit?.members?.length || approvedMembers.length || 0} người):</span>
                      <span className="font-black text-emerald-600">+{(show.salarySplit?.memberAmount || 0).toLocaleString()}đ</span>
                    </div>
                    
                    <div className="mt-4 pt-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Thành viên nhận cát-xê</p>
                      <div className="space-y-2">
                        {approvedMembers.map(p => (
                          <div key={p._id} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-150">
                            <span className="font-bold text-slate-700">{p.user?.fullName}</span>
                            <span className="font-black text-emerald-600">{(show.salarySplit?.memberAmount || 0).toLocaleString()}đ</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
               </div>
             )}

             <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/60 shadow-sm">
                <h3 className="font-extrabold text-slate-850 mb-6 text-sm flex items-center gap-2 pb-4 border-b border-slate-100"><FileText className="text-amber-500"/> THÔNG TIN LIÊN HỆ</h3>
                <div className="space-y-5 text-xs">
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Khách hàng / Sảnh tiệc</p>
                     <p className="font-extrabold text-slate-850 text-sm">{show.customerName || "---"}</p>
                     {show.phone && <p className="text-slate-500 mt-1 flex items-center gap-1"><Phone size={12} className="text-emerald-500"/> {show.phone}</p>}
                   </div>
                   
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Yêu cầu & Lưu ý</p>
                     <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700 leading-relaxed italic text-[11px]">
                       {show.notes ? `"${show.notes}"` : "Không có lưu ý đặc biệt từ admin/khách hàng."}
                     </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* --- MODALS ADD SETLIST SONGS --- */}
      {showAddMusicModal && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-slide-up border border-slate-200">
              <h3 className="text-lg font-black mb-5 text-slate-800 flex items-center gap-2"><Plus className="text-blue-500"/> Thêm Link Nhạc Ngoài</h3>
              <div className="space-y-4 text-xs">
                 <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Tên bài hát *</label>
                    <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ring-blue-500 outline-none font-bold text-slate-850" value={musicForm.title} onChange={e => setMusicForm({...musicForm, title: e.target.value})} placeholder="VD: Cô đơn trên sofa"/>
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Link sheet / beat (Tùy chọn)</label>
                    <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ring-blue-500 outline-none text-slate-800" value={musicForm.link} onChange={e => setMusicForm({...musicForm, link: e.target.value})} placeholder="VD: Drive, Youtube, PDF..."/>
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Ghi chú (Tùy chọn)</label>
                    <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ring-blue-500 outline-none text-slate-850" value={musicForm.note} onChange={e => setMusicForm({...musicForm, note: e.target.value})} placeholder="VD: Tone Am, Điệu Ballad..."/>
                 </div>
              </div>
              <div className="flex justify-end gap-2.5 mt-8 text-xs font-bold">
                 <button onClick={() => setShowAddMusicModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl transition">Hủy</button>
                 <button onClick={handleAddMusic} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-black transition shadow-md">Thêm bài hát</button>
              </div>
           </div>
        </div>
      )}

      {/* Modal Kho Nhạc */}
      {showLibraryModal && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-3xl p-0 w-full max-w-2xl shadow-2xl h-[80vh] flex flex-col overflow-hidden animate-slide-up border border-slate-200">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
                 <h3 className="text-base font-black text-slate-850 flex items-center gap-2"><Music className="text-violet-500"/> Chọn từ Kho Nhạc</h3>
                 <button onClick={() => { setShowLibraryModal(false); setLibrarySearchTerm(""); }} className="text-slate-400 hover:bg-slate-100 hover:text-slate-800 p-2 rounded-full transition"><X size={18}/></button>
              </div>
              
              {/* Thanh tìm kiếm bài hát */}
              <div className="px-5 py-3 border-b border-slate-100 bg-white">
                 <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 ring-violet-500 outline-none text-xs font-bold text-slate-800 transition"
                      placeholder="Tìm bài hát, tone, điệu..."
                      value={librarySearchTerm}
                      onChange={(e) => setLibrarySearchTerm(e.target.value)}
                    />
                 </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                 {librarySongs
                   .filter(song => 
                     (song.title || song.name || "").toLowerCase().includes(librarySearchTerm.toLowerCase()) || 
                     (song.note || "").toLowerCase().includes(librarySearchTerm.toLowerCase())
                   )
                   .map(song => (
                     <div key={song._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-white border border-slate-200 rounded-2xl hover:shadow-sm hover:border-violet-300 transition group gap-3">
                        <div className="flex-1 min-w-0">
                           <p className="font-extrabold text-slate-850 text-sm group-hover:text-indigo-650 transition-colors truncate">{song.title || song.name}</p>
                           <p className="text-[11px] text-slate-550 mt-0.5">{song.note || 'Không có tone/điệu'}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 w-full sm:w-auto text-[10px] font-black">
                           {song.sheetUrl && <button onClick={() => handleSelectFromLib(song, 'sheet')} className="bg-white border border-slate-200 text-slate-650 hover:bg-slate-50 px-3 py-1.5 rounded-xl flex items-center gap-1 transition"><FileText size={12} className="text-rose-500"/> + Sheet</button>}
                           {song.beatUrl && <button onClick={() => handleSelectFromLib(song, 'beat')} className="bg-white border border-slate-200 text-slate-650 hover:bg-slate-50 px-3 py-1.5 rounded-xl flex items-center gap-1 transition"><PlayCircle size={12} className="text-blue-500"/> + Beat</button>}
                           {!song.sheetUrl && !song.beatUrl && <span className="text-slate-400 italic bg-slate-50 px-3 py-1.5 rounded-xl">Chỉ có tên bài</span>}
                           
                           <button onClick={() => handleSelectFromLib(song, 'sheet')} className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-1.5 rounded-xl flex items-center gap-1 ml-auto sm:ml-2 shadow-sm transition">Thêm</button>
                        </div>
                     </div>
                  ))}
                 {librarySongs.length === 0 && <p className="text-center text-slate-400 mt-10 text-xs italic">Kho nhạc đang trống.</p>}
              </div>
           </div>
        </div>
      )}

      {/* Modal VietQR Thanh Toán */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-slide-up border border-slate-200 text-center">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-150">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Chuyển Khoản Nhanh VietQR</h3>
                <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:bg-slate-100 hover:text-slate-800 p-1.5 rounded-full transition"><X size={16}/></button>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-200 flex flex-col items-center">
                <img 
                  src={`https://img.vietqr.io/image/MB-19038475839-compact2.png?amount=${paymentAmount}&addInfo=${encodeURIComponent(paymentDescription)}&accountName=SAC%20BAND%20QUY`}
                  alt="VietQR Payment"
                  className="w-52 h-52 object-contain rounded-xl shadow-sm border border-slate-100"
                />
                <p className="text-[10px] font-bold text-slate-400 mt-2">Quét mã bằng ứng dụng Ngân hàng / Ví điện tử</p>
              </div>

              <div className="space-y-2 text-left text-[11px] bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6">
                <div className="flex justify-between"><span className="text-slate-550 font-bold">Ngân hàng:</span><span className="font-extrabold text-slate-800">MBBank (Quân Đội)</span></div>
                <div className="flex justify-between"><span className="text-slate-550 font-bold">Số tài khoản:</span><span className="font-extrabold text-slate-800">19038475839</span></div>
                <div className="flex justify-between"><span className="text-slate-550 font-bold">Chủ tài khoản:</span><span className="font-extrabold text-slate-800">SACH BAND QUY</span></div>
                <div className="flex justify-between"><span className="text-slate-550 font-bold">Số tiền:</span><span className="font-black text-emerald-600">{paymentAmount.toLocaleString()}đ</span></div>
                <div className="flex justify-between"><span className="text-slate-550 font-bold">Nội dung chuyển:</span><span className="font-extrabold text-slate-750 italic">{paymentDescription}</span></div>
              </div>

              <button onClick={() => setShowPaymentModal(false)} className="w-full py-3 bg-slate-900 text-white rounded-xl hover:bg-black transition font-bold text-xs tracking-wider uppercase">
                Xác nhận đã chuyển
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default BookingDetail;