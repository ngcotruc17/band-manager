"use client";

import React, { useEffect, useState, useContext, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import api from '../../../services/api';
import { AuthContext } from "../../../context/AuthContext";
import { 
  Calendar, Clock, MapPin, User, ArrowLeft, Music, 
  Lock, Unlock, Check, X, AlertCircle, Plus, Search, FileText, PlayCircle, ShieldCheck, Loader, CheckCircle, Phone 
} from "lucide-react";
import toast from "react-hot-toast";

interface Participant {
  user: {
    _id: string;
    fullName: string;
    email?: string;
    username: string;
    role: string;
    instrument?: string;
  };
  role: string;
  status: 'pending' | 'approved';
  joinedAt: string;
}

interface SetlistItem {
  _id: string;
  title: string;
  link?: string;
  note?: string;
}

interface ShowDetail {
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
  participants: Participant[];
  setlist: SetlistItem[];
  // Extended fields
  eventType?: string;
  memberCount?: number;
  dresscode?: string;
  extraFee?: number;
}

interface LibrarySong {
  _id: string;
  title: string;
  name: string;
  note?: string;
  sheetUrl?: string;
  beatUrl?: string;
}

export default function BookingDetail() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user } = useContext(AuthContext);

  const [show, setShow] = useState<ShowDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // State Modal
  const [showAddMusicModal, setShowAddMusicModal] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [librarySongs, setLibrarySongs] = useState<LibrarySong[]>([]);
  const [musicForm, setMusicForm] = useState({ title: "", link: "", note: "" });
  const [librarySearchTerm, setLibrarySearchTerm] = useState("");

  const fetchShow = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.get(`/shows/${id}`);
      setShow(res.data);
    } catch (error) { 
      toast.error("Không tải được chi tiết Show"); 
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { 
    fetchShow(); 
  }, [fetchShow]);

  const handleJoin = async () => {
    try { 
      await api.post(`/shows/${id}/join`); 
      toast.success("Đã thay đổi trạng thái đăng ký!"); 
      fetchShow(); 
    } catch (err: any) { 
      toast.error(err.response?.data?.message || "Lỗi thao tác"); 
    }
  };

  const handleApprove = async (userId: string) => {
    try { 
      await api.put(`/shows/${id}/approve-participant`, { userId }); 
      toast.success("Đã duyệt thành viên!"); 
      fetchShow(); 
    } catch (err) { 
      toast.error("Lỗi duyệt"); 
    }
  };

  const handleRemove = async (userId: string) => {
    if (!window.confirm("Bạn có chắc muốn loại thành viên này khỏi show?")) return;
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

  const handleRemoveMusic = async (songId: string) => {
    if (!window.confirm("Xóa bài này khỏi setlist?")) return;
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
      setLibrarySongs(res.data || []);
      setShowLibraryModal(true);
    } catch (err) { 
      toast.error("Lỗi tải kho nhạc"); 
    }
  };

  const handleSelectFromLib = async (song: LibrarySong, type: 'sheet' | 'beat' = 'sheet') => {
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

  const getDownloadLink = (link?: string) => {
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
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center space-y-4">
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

  const filteredLibrary = librarySongs.filter(s => 
    (s.title || s.name || "").toLowerCase().includes(librarySearchTerm.toLowerCase()) ||
    (s.note || "").toLowerCase().includes(librarySearchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-10">
      
      {/* HEADER: Back Button & Title */}
      <div className="max-w-6xl mx-auto space-y-6">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs font-bold text-slate-550 hover:text-slate-800 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm transition">
          <ArrowLeft size={16}/> Quay lại
        </button>

        <div className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-200/50 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                 {show.status === 'pending' && <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-250 text-amber-700 text-[10px] font-black uppercase tracking-widest animate-pulse">⏳ Chờ duyệt show</span>}
                 {show.status === 'confirmed' && !show.isRegistrationClosed && <span className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-black uppercase tracking-widest">✅ Đang nhận đăng ký</span>}
                 {show.status === 'confirmed' && show.isRegistrationClosed && <span className="px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><Lock size={12}/> Đã chốt sổ</span>}
                 {show.status === 'completed' && <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-250 text-emerald-700 text-[10px] font-black uppercase tracking-widest">🎉 Đã hoàn thành</span>}
              </div>
              
              <h1 className="text-2xl md:text-3xl font-black text-slate-850 tracking-tight leading-tight mb-4">{show.title}</h1>
              
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
      <div className="max-w-6xl mx-auto mt-8">
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
                    <button onClick={toggleRegistration} className={`text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition ${show.isRegistrationClosed ? 'bg-emerald-50 text-emerald-650 hover:bg-emerald-100' : 'bg-rose-50 text-rose-650 hover:bg-rose-100'}`}>
                       {show.isRegistrationClosed ? <><Unlock size={13}/> Mở lại đăng ký</> : <><Lock size={13}/> Chốt sổ đăng ký</>}
                    </button>
                  )}
               </div>

               {/* Join/Enroll Status Container */}
               <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 transition-all ${isJoined ? 'bg-emerald-50/50 border-emerald-150' : 'bg-slate-50 border-slate-200'}`}>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">
                      Đăng ký của bạn: 
                      <span className={`ml-1.5 font-black ${isJoined ? (approvedMembers.find(p=>p.user?._id === user?._id) ? "text-emerald-600" : "text-amber-600") : "text-slate-500"}`}>
                        {isJoined ? (approvedMembers.find(p=>p.user?._id === user?._id) ? "Đã được duyệt chính thức" : "Đang chờ duyệt") : "Chưa đăng ký đi diễn"}
                      </span>
                    </p>
                  </div>
                  {canRegister && (
                     <button onClick={handleJoin} className={`px-5 py-2 rounded-xl font-bold transition text-xs whitespace-nowrap ${isJoined ? 'bg-white border border-slate-350 text-slate-600 hover:bg-rose-50 hover:text-rose-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                       {isJoined ? "Rút tên đăng ký" : "Đăng ký đi diễn ngay"}
                     </button>
                  )}
               </div>

               {/* Grid Approved Members */}
               <div className="space-y-4">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thành viên chính thức ({approvedMembers.length})</h4>
                 {approvedMembers.length === 0 ? (
                   <p className="text-slate-400 text-xs font-semibold italic">Chưa duyệt thành viên nào vào đội hình chính.</p>
                 ) : (
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {approvedMembers.map(member => (
                       <div key={member.user._id} className="flex justify-between items-center p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                             {member.user.fullName?.charAt(0)}
                           </div>
                           <div>
                             <p className="font-bold text-xs text-slate-800">{member.user.fullName}</p>
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-wide">{member.role || member.user.instrument || 'Nhạc công'}</p>
                           </div>
                         </div>
                         {isAdmin && show.status === 'confirmed' && (
                           <button onClick={() => handleRemove(member.user._id)} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition"><X size={15}/></button>
                         )}
                       </div>
                     ))}
                   </div>
                 )}

                 {/* Pending Members */}
                 {isAdmin && pendingMembers.length > 0 && (
                   <div className="space-y-3 pt-6 border-t border-slate-100">
                     <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest animate-pulse">Yêu cầu đăng ký đi diễn ({pendingMembers.length})</h4>
                     <div className="space-y-2.5">
                       {pendingMembers.map(member => (
                         <div key={member.user._id} className="flex justify-between items-center p-4 bg-amber-50/20 rounded-2xl border border-amber-100">
                           <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-xs">
                               {member.user.fullName?.charAt(0)}
                             </div>
                             <div>
                               <p className="font-extrabold text-xs text-slate-850">{member.user.fullName}</p>
                               <p className="text-[9px] text-slate-500 font-bold">Nhạc cụ: {member.user.instrument || '---'}</p>
                             </div>
                           </div>
                           <div className="flex gap-2">
                             <button onClick={() => handleApprove(member.user._id)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition shadow-sm"><Check size={12}/> Duyệt</button>
                             <button onClick={() => handleRemove(member.user._id)} className="bg-white border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 px-3 py-1.5 rounded-xl font-bold text-xs transition shadow-sm"><X size={12}/></button>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
            </div>

            {/* 2. SETLIST MUSIC */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/60 shadow-sm">
               <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <Music className="text-indigo-600" size={22}/> SETLIST BÀI BIỂU DIỄN ({show.setlist?.length || 0})
                  </h3>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <button onClick={fetchLibrary} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition">Chọn từ Kho</button>
                      <button onClick={() => setShowAddMusicModal(true)} className="bg-indigo-650 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl font-black text-xs transition shadow-sm flex items-center gap-1"><Plus size={12}/> Thêm bài</button>
                    </div>
                  )}
               </div>

               {show.setlist?.length === 0 ? (
                 <div className="text-center py-12 border border-dashed border-slate-200 rounded-3xl">
                    <Music size={32} className="mx-auto text-slate-300 mb-2"/>
                    <p className="text-slate-400 text-xs font-semibold">Chưa thiết lập Setlist bài hát cho show này.</p>
                 </div>
               ) : (
                 <div className="space-y-3">
                   {show.setlist?.map((song, index) => (
                     <div key={song._id} className="flex flex-col sm:flex-row justify-between items-center p-4 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100 transition gap-4">
                       <div className="flex items-center gap-3">
                         <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">{index + 1}</span>
                         <div>
                           <p className="font-extrabold text-xs text-slate-800">{song.title}</p>
                           {song.note && <p className="text-[10px] text-slate-400 font-bold mt-0.5">{song.note}</p>}
                         </div>
                       </div>
                       
                       <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                         {song.link ? (
                           <a 
                             href={getDownloadLink(song.link)} 
                             target="_blank" 
                             rel="noreferrer"
                             className="flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 font-bold text-[10px] hover:border-indigo-600 hover:text-indigo-650 transition shadow-sm"
                           >
                             <FileText size={12} className="text-rose-500"/> Tài liệu / Sheet
                           </a>
                         ) : (
                           <span className="text-[9px] font-bold text-slate-400 italic">Không có file đính kèm</span>
                         )}
                         {isAdmin && (
                           <button onClick={() => handleRemoveMusic(song._id)} className="text-slate-350 hover:text-rose-500 p-1.5 rounded-lg transition"><X size={15}/></button>
                         )}
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>

          </div>

          {/* RIGHT COLUMN: Contact info & Notes */}
          <div className="space-y-6">
            {/* Thông tin khách & Hợp đồng */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/60 shadow-sm space-y-5">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3">Thông tin Khách & Hợp Đồng</h3>

              <div className="space-y-4 text-xs font-semibold text-slate-650">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Khách hàng liên hệ</p>
                  <p className="text-slate-800 text-sm font-extrabold">{show.customerName || "—"}</p>
                </div>
                {show.phone && (
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Số điện thoại</p>
                    <p className="text-slate-800 text-sm font-extrabold flex items-center gap-1"><Phone size={13} className="text-emerald-500"/> {show.phone}</p>
                  </div>
                )}
                {show.eventType && (
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Loại sự kiện</p>
                    <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-650 text-[10px] font-black rounded-lg border border-indigo-100">{show.eventType}</span>
                  </div>
                )}
                {show.dresscode && (
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Dress code / Trang phục</p>
                    <p className="text-slate-700 font-bold">{show.dresscode}</p>
                  </div>
                )}
                {show.memberCount && (
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Số thành viên tham diễn</p>
                    <p className="text-slate-800 font-extrabold">{show.memberCount} người</p>
                  </div>
                )}
                {show.notes && (
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Ghi chú sự kiện</p>
                    <p className="text-slate-600 bg-amber-50/60 p-3.5 rounded-xl border border-amber-100/30 italic leading-relaxed">{show.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bảng tài chính */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/60 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3">Tài Chính Show</h3>
              <div className="space-y-3 text-xs font-bold">
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-500">Cát-xê / người</span>
                  <span className="text-emerald-600 font-black">{(show.price || 0).toLocaleString()}đ</span>
                </div>
                {show.memberCount && (
                  <div className="flex justify-between items-center py-1.5 border-t border-slate-100">
                    <span className="text-slate-500">Tổng cát-xê ({show.memberCount} người)</span>
                    <span className="text-slate-800 font-black">{((show.price || 0) * show.memberCount).toLocaleString()}đ</span>
                  </div>
                )}
                {(show.extraFee || 0) > 0 && (
                  <div className="flex justify-between items-center py-1.5 border-t border-slate-100">
                    <span className="text-slate-500">Phụ phí khác</span>
                    <span className="text-slate-700 font-black">{(show.extraFee || 0).toLocaleString()}đ</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-t border-slate-200">
                  <span className="text-slate-500">Đã đặt cọc</span>
                  <span className="text-amber-600 font-black">-{(show.deposit || 0).toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between items-center py-2.5 px-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-slate-700 font-black uppercase text-[10px] tracking-wider">Còn lại</span>
                  <span className={`font-black text-sm ${(show.price || 0) - (show.deposit || 0) > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    {Math.max(0, (show.price || 0) - (show.deposit || 0)).toLocaleString()}đ
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL THÊM NHẠC THỦ CÔNG */}
      {showAddMusicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl p-6 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <h3 className="font-black text-lg text-slate-850 flex items-center gap-2">
                <Music className="text-indigo-650" size={22}/> Thêm nhạc vào Setlist
              </h3>
              <button onClick={() => setShowAddMusicModal(false)} className="text-slate-400 hover:text-rose-500 font-bold text-sm">Đóng</button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên bài hát *</label>
                <input 
                  type="text"
                  required
                  placeholder="VD: Ngày Mai Người Ta Lấy Chồng..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 text-xs focus:bg-white focus:ring-1 ring-indigo-500 transition"
                  value={musicForm.title}
                  onChange={e => setMusicForm({ ...musicForm, title: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Đường link sheet/beat (nếu có)</label>
                <input 
                  type="text"
                  placeholder="Link Google Drive, YouTube..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-850 text-xs focus:bg-white focus:ring-1 ring-indigo-500 transition"
                  value={musicForm.link}
                  onChange={e => setMusicForm({ ...musicForm, link: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ghi chú (Tone / Lời)</label>
                <input 
                  type="text"
                  placeholder="Tone Dm, Vocal nữ..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 text-xs focus:bg-white focus:ring-1 ring-indigo-500 transition"
                  value={musicForm.note}
                  onChange={e => setMusicForm({ ...musicForm, note: e.target.value })}
                />
              </div>
              
              <button onClick={handleAddMusic} className="w-full bg-slate-900 hover:bg-black text-white font-black py-3.5 rounded-xl shadow-md transition active:scale-95 text-xs uppercase tracking-wider">
                Xác nhận thêm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHỌN NHẠC TỪ KHO */}
      {showLibraryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-lg text-slate-850 flex items-center gap-2">
                <Music className="text-indigo-650" size={22}/> Chọn từ Kho Beat & Sheet
              </h3>
              <button onClick={() => setShowLibraryModal(false)} className="text-slate-400 hover:text-rose-500 font-bold text-sm">Đóng</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                <input 
                  type="text" 
                  placeholder="Tìm bài hát trong kho..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-800 transition focus:bg-white"
                  value={librarySearchTerm}
                  onChange={e => setLibrarySearchTerm(e.target.value)}
                />
              </div>

              <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
                {filteredLibrary.length === 0 ? (
                  <p className="text-center text-slate-400 text-xs py-10 font-semibold italic">Không tìm thấy bài hát nào</p>
                ) : (
                  filteredLibrary.map(song => (
                    <div key={song._id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl border border-slate-100 transition">
                      <div>
                        <p className="font-extrabold text-xs text-slate-800">{song.title || song.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold">{song.note || "Không có ghi chú"}</p>
                      </div>
                      <div className="flex gap-2">
                        {song.sheetUrl && (
                          <button onClick={() => handleSelectFromLib(song, 'sheet')} className="bg-rose-50 text-rose-600 hover:bg-rose-100 text-[10px] font-black px-2.5 py-1.5 rounded-lg border border-rose-100 transition uppercase tracking-wide">
                            + Sheet
                          </button>
                        )}
                        {song.beatUrl && (
                          <button onClick={() => handleSelectFromLib(song, 'beat')} className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-[10px] font-black px-2.5 py-1.5 rounded-lg border border-indigo-100 transition uppercase tracking-wide">
                            + Beat
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
