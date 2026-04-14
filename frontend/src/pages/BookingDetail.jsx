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
  const[showLibraryModal, setShowLibraryModal] = useState(false);
  const [librarySongs, setLibrarySongs] = useState([]);
  
  const [musicForm, setMusicForm] = useState({ title: "", link: "", note: "" });

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

  useEffect(() => { fetchShow(); },[fetchShow]);

  // --- CÁC HÀNH ĐỘNG ---
  const handleJoin = async () => {
    try { await api.post(`/shows/${id}/join`); toast.success("Đã gửi yêu cầu tham gia!"); fetchShow(); } 
    catch (err) { toast.error(err.response?.data?.message || "Lỗi thao tác"); }
  };

  const handleApprove = async (userId) => {
    try { await api.put(`/shows/${id}/approve-participant`, { userId }); toast.success("Đã duyệt thành viên!"); fetchShow(); } 
    catch (err) { toast.error("Lỗi duyệt"); }
  };

  const handleRemove = async (userId) => {
    if(!window.confirm("Bạn có chắc muốn loại thành viên này?")) return;
    try { await api.put(`/shows/${id}/remove-participant`, { userId }); toast.success("Đã xóa khỏi danh sách"); fetchShow(); } 
    catch (err) { toast.error("Lỗi xóa"); }
  };

  const toggleRegistration = async () => {
    try { await api.put(`/shows/${id}/toggle-registration`); toast.success("Đã đổi trạng thái đăng ký"); fetchShow(); } 
    catch (err) { toast.error("Lỗi thao tác"); }
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
    } catch (err) { toast.error("Lỗi thêm nhạc"); }
  };

  const handleRemoveMusic = async (songId) => {
    if(!window.confirm("Xóa bài này khỏi setlist?")) return;
    try { await api.delete(`/shows/${id}/setlist/${songId}`); toast.success("Đã xóa khỏi setlist"); fetchShow(); } 
    catch (err) { toast.error("Lỗi xóa nhạc"); }
  };

  const fetchLibrary = async () => {
    try {
      const res = await api.get(`/library`);
      setLibrarySongs(res.data);
      setShowLibraryModal(true);
    } catch (err) { toast.error("Lỗi tải kho nhạc"); }
  };

  const handleSelectFromLib = async (song, type = 'sheet') => {
    let linkToUse = "";
    let typeNote = "";

    if (type === 'sheet' && song.sheetUrl) { linkToUse = song.sheetUrl; typeNote = "(Sheet)"; } 
    else if (type === 'beat' && song.beatUrl) { linkToUse = song.beatUrl; typeNote = "(Beat)"; } 
    else { linkToUse = song.sheetUrl || song.beatUrl || ""; }

    try {
      await api.post(`/shows/${id}/setlist`, {
        title: song.title || song.name,
        link: linkToUse,
        note: `${song.note || ""} ${typeNote}`.trim()
      });
      toast.success(`Đã thêm: ${song.title || song.name}`);
      fetchShow();
      setShowLibraryModal(false);
    } catch (err) { toast.error("Lỗi thêm nhạc"); }
  };

  const getDownloadLink = (link) => {
    if (!link) return "#";
    const API_BASE = "https://band-manager-s9tm.onrender.com";
    if (link.includes("uploads/") || link.includes("file-")) return `${API_BASE}/${link.replace(/\\/g, "/")}`;
    return link;
  };

  if (loading || !show) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <Loader className="animate-spin text-violet-500" size={40} />
        <p className="text-violet-600 font-bold animate-pulse tracking-wide">Đang tải cấu hình Show...</p>
      </div>
    );
  }

  const approvedMembers = show.participants?.filter(p => p.status === 'approved') ||[];
  const pendingMembers = show.participants?.filter(p => p.status === 'pending') ||[];
  const isJoined = show.participants?.some(p => p.user?._id === user?._id);
  const isAdmin = user?.role === 'admin';
  const canRegister = show.status === 'confirmed' && !show.isRegistrationClosed;
  const canEditMusic = show.status === 'confirmed' || show.status === 'completed';

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 font-sans">
      
      {/* HEADER BANNER (Clean Light Mode) */}
      <div className="bg-white border-b border-slate-200 pt-8 pb-12 px-4 md:px-8 relative">
        <div className="max-w-6xl mx-auto relative z-10 animate-fade-in">
          <Link to="/bookings" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold mb-6 transition">
            <ArrowLeft size={18}/> Quay lại lịch diễn
          </Link>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                 {show.status === 'pending' && <span className="px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold uppercase tracking-widest animate-pulse">⏳ Chờ duyệt show</span>}
                 {show.status === 'confirmed' && !show.isRegistrationClosed && <span className="px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-widest">✅ Đang mở đăng ký</span>}
                 {show.status === 'confirmed' && show.isRegistrationClosed && <span className="px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5"><Lock size={14}/> Đã chốt sổ</span>}
                 {show.status === 'completed' && <span className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-widest">🎉 Đã hoàn thành</span>}
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">{show.title}</h1>
              <div className="flex flex-wrap gap-4 text-slate-600 font-medium text-sm">
                <span className="flex items-center gap-2"><Calendar className="text-violet-500" size={18}/> {new Date(show.date).toLocaleDateString('vi-VN')}</span>
                <span className="flex items-center gap-2"><Clock className="text-orange-500" size={18}/> {show.time}</span>
                <span className="flex items-center gap-2"><MapPin className="text-blue-500" size={18}/> {show.location}</span>
              </div>
            </div>
            
            <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl text-right md:min-w-[200px]">
              <p className="text-emerald-700 text-xs font-bold uppercase tracking-widest mb-1">Cát-xê / người</p>
              <p className="text-3xl font-black text-emerald-600">{(show.price || 0).toLocaleString()}đ</p>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-8 relative z-20 animate-slide-up">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CỘT TRÁI (2 Phần) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. KHU VỰC ĐĂNG KÝ (Clean Card) */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
                  <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="text-emerald-500" size={24}/> Đội Hình Đi Diễn
                  </h3>
                  {isAdmin && show.status === 'confirmed' && (
                    <button onClick={toggleRegistration} className={`text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition ${show.isRegistrationClosed ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}>
                       {show.isRegistrationClosed ? <><Unlock size={14}/> Mở lại đăng ký</> : <><Lock size={14}/> Chốt sổ thành viên</>}
                    </button>
                  )}
               </div>

               {/* Bảng báo danh Clean */}
               <div className={`p-6 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 ${isJoined ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
                  <div>
                    <p className="font-bold text-slate-800 text-lg">
                      Trạng thái: 
                      <span className={`ml-2 ${isJoined ? (approvedMembers.find(p=>p.user?._id === user._id) ? "text-emerald-600" : "text-amber-600") : "text-slate-500"}`}>
                        {isJoined ? (approvedMembers.find(p=>p.user?._id === user._id) ? "✅ Đã được duyệt" : "⏳ Đang chờ duyệt") : "Chưa đăng ký"}
                      </span>
                    </p>
                    <p className="text-sm text-slate-500 mt-1">Đăng ký sớm để Admin chốt đội hình nhé.</p>
                  </div>
                  {isJoined ? (
                     <button onClick={handleJoin} className="bg-white border border-slate-300 text-slate-600 px-6 py-2.5 rounded-xl font-bold hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition whitespace-nowrap">Hủy đăng ký</button>
                  ) : (
                     <button onClick={handleJoin} disabled={!canRegister} className={`px-8 py-2.5 rounded-xl font-bold transition whitespace-nowrap ${canRegister ? 'bg-slate-900 text-white hover:bg-black shadow-md' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>✋ Đăng ký đi Show</button>
                  )}
               </div>

               {/* DANH SÁCH CHÍNH THỨC */}
               <div className="mb-8">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5"><CheckCircle size={16} className="text-emerald-500"/> Chính thức ({approvedMembers.length})</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     {approvedMembers.length > 0 ? approvedMembers.map(p => (
                        <div key={p._id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-2xl group hover:border-emerald-200 hover:shadow-sm transition-all">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center font-bold text-sm border border-emerald-100">{p.user?.fullName?.charAt(0) || "U"}</div>
                              <div>
                                <p className="font-bold text-sm text-slate-800">{p.user?.fullName || "Ẩn danh"}</p>
                                <p className="text-[10px] uppercase font-bold text-emerald-600">{p.role}</p>
                              </div>
                           </div>
                           {isAdmin && <button onClick={() => handleRemove(p.user._id)} className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-xl transition opacity-0 group-hover:opacity-100"><X size={16}/></button>}
                        </div>
                     )) : <p className="text-sm text-slate-400 italic bg-slate-50 border border-slate-100 p-4 rounded-2xl text-center col-span-full">Chưa chốt thành viên nào.</p>}
                  </div>
               </div>
               
               {/* DANH SÁCH CHỜ */}
               {pendingMembers.length > 0 && (
                 <div className="pt-6 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5"><AlertCircle size={16} className="text-amber-500"/> Chờ duyệt ({pendingMembers.length})</p>
                    <div className="space-y-3">
                       {pendingMembers.map(p => (
                          <div key={p._id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-amber-200 transition">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold text-xs">{p.user?.fullName?.charAt(0) || "U"}</div>
                                <p className="font-bold text-sm text-slate-700">{p.user?.fullName || "Ẩn danh"}</p>
                             </div>
                             {isAdmin && (
                                <div className="flex gap-2">
                                   <button onClick={() => handleApprove(p.user._id)} className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition">Duyệt</button>
                                   <button onClick={() => handleRemove(p.user._id)} className="text-xs font-bold bg-white border border-slate-200 text-slate-500 px-3 py-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition">Loại</button>
                                </div>
                             )}
                          </div>
                       ))}
                    </div>
                 </div>
               )}
            </div>

            {/* 2. LIST NHẠC & BEAT */}
            <div className={`bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm ${!canEditMusic && 'opacity-80'}`}>
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2"><Music className="text-violet-500" size={24}/> Setlist Bài Hát</h3>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Danh sách nhạc sẽ đánh trong show này</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={fetchLibrary} disabled={!canEditMusic} className="text-sm font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 px-4 py-2 rounded-xl flex items-center gap-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed">
                      <Search size={16}/> Lấy từ Kho
                    </button>
                    <button onClick={() => setShowAddMusicModal(true)} disabled={!canEditMusic} className="text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-xl flex items-center gap-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                      <Plus size={16}/> Thêm Link Ngoài
                    </button>
                  </div>
               </div>

               <div className="space-y-3">
                  {show.setlist && show.setlist.length > 0 ? (
                    show.setlist.map((song, idx) => (
                      <div key={song._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-violet-300 hover:shadow-sm transition group gap-4">
                         <div className="flex items-center gap-4 overflow-hidden w-full sm:w-auto">
                            <span className="text-xl font-black text-slate-300 w-6 text-center">{idx + 1}</span>
                            <div className="min-w-0 flex-1">
                               <p className="font-bold text-slate-800 text-lg truncate group-hover:text-violet-600 transition">{song.title}</p>
                               <p className="text-xs text-slate-500 truncate mt-0.5">{song.note || "Chưa có ghi chú (Tone/Ca sĩ...)"}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            {song.link && (
                              <a 
                                href={getDownloadLink(song.link)} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-100 flex items-center gap-1.5 transition whitespace-nowrap"
                              >
                                <Download size={14}/> Tải / Xem
                              </a>
                            )}
                            <button onClick={() => handleRemoveMusic(song._id)} className="text-slate-400 hover:bg-rose-50 hover:text-rose-500 p-2 rounded-xl transition"><X size={18}/></button>
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 border border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                       <Music size={40} className="mx-auto text-slate-300 mb-3"/>
                       <p className="text-slate-500 font-medium">{canEditMusic ? "Chưa có bài hát nào trong Setlist." : "Phải duyệt Show mới được thêm nhạc."}</p>
                    </div>
                  )}
               </div>
            </div>
          </div>

          {/* CỘT PHẢI (Thông tin khách hàng) */}
          <div className="space-y-8">
             <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
                <h3 className="font-extrabold text-slate-800 mb-6 text-lg flex items-center gap-2 pb-4 border-b border-slate-100"><FileText className="text-amber-500"/> Chi tiết Booking</h3>
                <div className="space-y-6 text-sm text-slate-600">
                   <div>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Khách hàng liên hệ</p>
                     <p className="font-bold text-slate-800 text-base">{show.customerName}</p>
                     <p className="text-slate-500 mt-1 flex items-center gap-1.5"><Phone size={14}/> {show.phone || "Không có SĐT"}</p>
                   </div>
                   
                   <div>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Ghi chú & Yêu cầu</p>
                     <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700 leading-relaxed italic">
                       {show.notes ? `"${show.notes}"` : "Không có yêu cầu đặc biệt từ khách hàng."}
                     </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* --- MODALS THÊM NHẠC --- */}
      {showAddMusicModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-slide-up border border-slate-200">
              <h3 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2"><Plus className="text-blue-500"/> Thêm Link Nhạc Ngoài</h3>
              <div className="space-y-4">
                 <div>
                   <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Tên bài hát *</label>
                   <input type="text" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ring-blue-500 outline-none font-bold text-slate-800" value={musicForm.title} onChange={e => setMusicForm({...musicForm, title: e.target.value})} placeholder="VD: Cắt đôi nỗi sầu"/>
                 </div>
                 <div>
                   <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Link đính kèm (Tùy chọn)</label>
                   <input type="text" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ring-blue-500 outline-none text-slate-800" value={musicForm.link} onChange={e => setMusicForm({...musicForm, link: e.target.value})} placeholder="Link Drive / Youtube / PDF..."/>
                 </div>
                 <div>
                   <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Ghi chú (Tùy chọn)</label>
                   <input type="text" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ring-blue-500 outline-none text-slate-800" value={musicForm.note} onChange={e => setMusicForm({...musicForm, note: e.target.value})} placeholder="Tone, điệu, ca sĩ..."/>
                 </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                 <button onClick={() => setShowAddMusicModal(false)} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition">Hủy</button>
                 <button onClick={handleAddMusic} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition shadow-md">Thêm vào List</button>
              </div>
           </div>
        </div>
      )}

      {/* Modal Kho Nhạc */}
      {showLibraryModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-3xl p-0 w-full max-w-2xl shadow-2xl h-[85vh] flex flex-col overflow-hidden animate-slide-up border border-slate-200">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                 <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Music className="text-violet-500"/> Chọn từ Kho Nhạc</h3>
                 <button onClick={() => setShowLibraryModal(false)} className="text-slate-400 hover:bg-slate-100 hover:text-slate-800 p-2 rounded-full transition"><X size={20}/></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                 {librarySongs.map(song => (
                    <div key={song._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:shadow-sm hover:border-violet-300 transition group gap-3">
                       <div className="flex-1">
                          <p className="font-bold text-slate-800 text-lg group-hover:text-violet-600 transition">{song.title || song.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{song.note || 'Không có ghi chú'}</p>
                       </div>
                       <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                          {song.sheetUrl && <button onClick={() => handleSelectFromLib(song, 'sheet')} className="text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-3 py-2 rounded-xl flex items-center gap-1.5 transition"><FileText size={14} className="text-rose-500"/> + Sheet</button>}
                          {song.beatUrl && <button onClick={() => handleSelectFromLib(song, 'beat')} className="text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-3 py-2 rounded-xl flex items-center gap-1.5 transition"><PlayCircle size={14} className="text-blue-500"/> + Beat</button>}
                          {!song.sheetUrl && !song.beatUrl && <span className="text-xs text-slate-400 italic bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl">Chỉ có tên bài</span>}
                          
                          <button onClick={() => handleSelectFromLib(song, 'sheet')} className="text-xs font-bold bg-slate-900 text-white hover:bg-black px-4 py-2 rounded-xl flex items-center gap-1 transition ml-auto sm:ml-2 shadow-sm"><Plus size={14}/> Thêm</button>
                       </div>
                    </div>
                 ))}
                 {librarySongs.length === 0 && <p className="text-center text-slate-400 mt-10">Kho nhạc đang trống.</p>}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default BookingDetail;