import { useEffect, useState, useContext, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Trash2, Edit, XCircle, Clock, Shirt, Lock, AlertTriangle, 
  CheckCircle, PlusCircle, MinusCircle, DollarSign, Music, 
  UploadCloud, Search, BookOpen, MessageSquare, MapPin, Calendar,
  User, ChevronDown, ChevronUp, Send, PlayCircle, FileText
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import CommentSection from '../components/CommentSection';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const BASE_URL = (import.meta.env.VITE_API_URL || 'https://band-manager-s9tm.onrender.com/api');
  const getHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const [data, setData] = useState({ event: null, songs: [] });
  
  // State Edit
  const [isEditing, setIsEditing] = useState(false);
  const [editEventData, setEditEventData] = useState({ title: '', location: '', date: '', time: '', logistics: '', cast: 0 });

  // State Upload & Library
  const [formData, setFormData] = useState({ name: '', note: '' });
  const [files, setFiles] = useState({ sheet: null, beat: null });
  const [showUpload, setShowUpload] = useState(false); // Toggle form upload cho gọn
  
  const [showLibModal, setShowLibModal] = useState(false);
  const [librarySongs, setLibrarySongs] = useState([]);
  const [libSearch, setLibSearch] = useState('');

  const loadData = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/events/${id}`, getHeaders());
      setData(res.data);
      if (res.data.event) {
        setEditEventData({
          title: res.data.event.title,
          location: res.data.event.location,
          date: res.data.event.date.split('T')[0],
          time: res.data.event.time || '', 
          logistics: res.data.event.logistics || '',
          cast: res.data.event.cast || 0
        });
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadData(); }, [id]);

  // --- HANDLERS (Giữ nguyên logic cũ) ---
  const handleJoin = async () => {
    try {
      await axios.post(`${BASE_URL}/events/${id}/join`, {}, getHeaders());
      alert("🎉 Đã đăng ký tham gia show!");
      loadData();
    } catch (err) { alert(err.response?.data?.message || "Lỗi tham gia"); }
  };

  const handleTogglePerformer = async (userId) => {
    try {
      await axios.put(`${BASE_URL}/events/${id}/performer`, { userId }, getHeaders());
      loadData();
    } catch (err) { alert("Lỗi cập nhật trạng thái"); }
  };

  const handleAddSong = async (e) => {
    e.preventDefault();
    const postData = new FormData();
    postData.append('name', formData.name);
    postData.append('note', formData.note);
    if (files.sheet) postData.append('sheet', files.sheet);
    if (files.beat) postData.append('beat', files.beat);
    try {
      await axios.post(`${BASE_URL}/events/${id}/songs`, postData, {
        headers: { ...getHeaders().headers, 'Content-Type': 'multipart/form-data' }
      });
      alert("✅ Đã thêm bài hát!");
      setFormData({ name: '', note: '' });
      setFiles({ sheet: null, beat: null });
      document.getElementById('file-sheet').value = "";
      document.getElementById('file-beat').value = "";
      setShowUpload(false);
      loadData();
    } catch (err) { alert("Lỗi thêm bài hát"); }
  };

  const fetchLibrary = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/library`, getHeaders());
      setLibrarySongs(res.data);
      setShowLibModal(true);
    } catch (err) { console.error(err); }
  };

  const handleAddFromLib = async (libSongId) => {
    try {
      await axios.post(`${BASE_URL}/events/${id}/songs/from-library`, { librarySongId: libSongId }, getHeaders());
      alert("✅ Đã lấy nhạc từ kho!");
      setShowLibModal(false);
      loadData();
    } catch (err) { alert("Lỗi thêm nhạc"); }
  };

  const handleUpdateEvent = async () => {
    try {
      const payload = { ...editEventData, cast: Number(editEventData.cast) };
      await axios.put(`${BASE_URL}/events/${id}`, payload, getHeaders());
      alert("✅ Đã cập nhật!");
      setIsEditing(false);
      loadData();
    } catch (err) { alert("Lỗi cập nhật"); }
  };
  
  const handleDeleteSong = async (songId) => {
    if(!window.confirm("Xóa bài này?")) return;
    try {
      await axios.delete(`${BASE_URL}/events/songs/${songId}`, getHeaders());
      loadData();
    } catch (err) { alert("Lỗi xóa"); }
  };

  const handleDeleteEvent = async () => {
    if(!window.confirm("⚠️ Xóa Show này?")) return;
    try {
      await axios.delete(`${BASE_URL}/events/${id}`, getHeaders());
      alert("🗑️ Đã xóa show!");
      navigate('/dashboard');
    } catch (err) { alert("Lỗi xóa show"); }
  };

  // --- RENDER ---
  if (!data.event) return <div className="p-10 text-center animate-pulse text-gray-400">Đang tải dữ liệu...</div>;
  
  const status = data.event.bookingRef?.status || 'approved';
  const isApproved = status === 'approved';
  const isCompleted = status === 'completed';
  const isRegistered = data.event.participants?.some(p => p.user?._id === user._id);
  const registeredList = data.event.participants || [];
  const officialRoster = registeredList.filter(p => p.isSelected);
  const waitingList = registeredList.filter(p => !p.isSelected);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* HEADER GRADIENT */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white pt-8 pb-16 px-4 md:px-8 shadow-lg relative overflow-hidden">
        {/* Bong bóng trang trí */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-300 opacity-10 rounded-full -ml-10 -mb-10 blur-2xl"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-blue-200 hover:text-white transition mb-4 font-medium text-sm">
             ← Quay lại Dashboard
          </Link>
          
          {!isEditing ? (
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                   {/* BADGE TRẠNG THÁI */}
                   {status === 'pending' && <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold shadow-sm animate-pulse">⏳ ĐANG CHỜ DUYỆT</span>}
                   {status === 'approved' && <span className="bg-green-400 text-green-900 px-3 py-1 rounded-full text-xs font-bold shadow-sm">✅ CHÍNH THỨC</span>}
                   {status === 'completed' && <span className="bg-gray-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold shadow-sm">🏁 ĐÃ DIỄN XONG</span>}
                   {status === 'cancelled' && <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">❌ ĐÃ HỦY</span>}
                </div>
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-2 drop-shadow-md">{data.event.title}</h1>
                <div className="flex flex-wrap gap-4 text-blue-100 text-sm md:text-base font-medium">
                   <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm"><Calendar size={18}/> {new Date(data.event.date).toLocaleDateString('vi-VN')}</span>
                   <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm"><Clock size={18}/> {data.event.time || "--:--"}</span>
                   <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm"><MapPin size={18}/> {data.event.location}</span>
                </div>
              </div>

              {/* ACTION BUTTONS (ADMIN) */}
              {user?.role === 'admin' && (
                <div className="flex gap-2 bg-white/10 p-1.5 rounded-xl backdrop-blur-md">
                   <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white hover:text-blue-700 transition font-bold text-sm">
                      <Edit size={16}/> Sửa
                   </button>
                   <button onClick={handleDeleteEvent} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-500 hover:text-white text-red-300 transition font-bold text-sm">
                      <Trash2 size={16}/> Xóa
                   </button>
                </div>
              )}
            </div>
          ) : (
            // FORM EDIT TRÊN HEADER (Giữ nguyên logic form cũ nhưng style lại chút)
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 animate-fade-in text-white">
               {/* ... (Code form edit giống hệt cái cũ, chỉ cần copy paste lại nội dung bên trong form) ... */}
               <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Edit size={20}/> Chỉnh sửa thông tin</h3>
               <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <input className="bg-white/20 border border-white/30 p-3 rounded-xl placeholder-blue-200 text-white focus:outline-none focus:bg-white/30" placeholder="Tên Show" value={editEventData.title} onChange={e => setEditEventData({...editEventData, title: e.target.value})} />
                  <div className="flex gap-2">
                    <input type="date" className="bg-white/20 border border-white/30 p-3 rounded-xl text-white w-full" value={editEventData.date} onChange={e => setEditEventData({...editEventData, date: e.target.value})} />
                    <input type="time" className="bg-white/20 border border-white/30 p-3 rounded-xl text-white w-32" value={editEventData.time} onChange={e => setEditEventData({...editEventData, time: e.target.value})} />
                  </div>
                  <input className="bg-white/20 border border-white/30 p-3 rounded-xl placeholder-blue-200 text-white" placeholder="Địa điểm" value={editEventData.location} onChange={e => setEditEventData({...editEventData, location: e.target.value})} />
                  <input type="number" className="bg-white/20 border border-white/30 p-3 rounded-xl placeholder-blue-200 text-white font-bold" placeholder="Cát-xê" value={editEventData.cast} onChange={e => setEditEventData({...editEventData, cast: e.target.value})} />
               </div>
               <textarea rows="2" className="w-full bg-white/20 border border-white/30 p-3 rounded-xl placeholder-blue-200 text-white mb-4" placeholder="Logistics / Ghi chú" value={editEventData.logistics} onChange={e => setEditEventData({...editEventData, logistics: e.target.value})} />
               <div className="flex gap-3">
                 <button onClick={handleUpdateEvent} className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg transition">Lưu Lại</button>
                 <button onClick={() => setIsEditing(false)} className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-xl font-bold transition">Hủy</button>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-8 relative z-20">
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* CỘT TRÁI (2/3): SETLIST & INFO */}
          <div className="md:col-span-2 space-y-8">
            
            {/* 1. THÔNG TIN CHUNG & LOGISTICS */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="p-6 grid md:grid-cols-2 gap-6">
                  {/* Cát xê */}
                  <div className="flex items-center gap-4 bg-green-50 p-4 rounded-xl border border-green-100">
                     <div className="bg-green-100 text-green-600 p-3 rounded-full"><DollarSign size={24}/></div>
                     <div>
                        <div className="text-xs font-bold text-gray-500 uppercase">Cát-xê dự kiến</div>
                        <div className="text-2xl font-black text-green-700">{data.event.cast ? data.event.cast.toLocaleString('vi-VN') : 0} ₫</div>
                     </div>
                  </div>
                  {/* Ghi chú Logistics */}
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                     <div className="flex items-center gap-2 mb-2 text-amber-800 font-bold text-sm uppercase">
                        <Shirt size={16}/> Logistics / Trang phục
                     </div>
                     <p className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">
                        {data.event.logistics || "Chưa có ghi chú đặc biệt."}
                     </p>
                  </div>
               </div>
            </div>

            {/* 2. QUẢN LÝ BÀI HÁT (SETLIST) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
               <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                     <Music className="text-blue-600" size={24}/> Setlist Bài Hát ({data.songs.length})
                  </h2>
                  <div className="flex gap-2">
                    <button 
                      onClick={fetchLibrary}
                      className="hidden sm:flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-2 rounded-lg font-bold text-xs hover:bg-purple-200 transition"
                      disabled={!isApproved}
                    >
                      <BookOpen size={16}/> Lấy từ Kho
                    </button>
                    <button 
                       onClick={() => setShowUpload(!showUpload)}
                       className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-xs transition text-white shadow-md ${!isApproved ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                       disabled={!isApproved}
                    >
                       {showUpload ? <ChevronUp size={16}/> : <PlusCircle size={16}/>} Thêm Bài Mới
                    </button>
                  </div>
               </div>
               
               {/* FORM UPLOAD (Ẩn/Hiện) */}
               {showUpload && isApproved && (
                 <div className="p-6 bg-blue-50/50 border-b border-blue-100 animate-slide-in-from-top">
                    <form onSubmit={handleAddSong} className="grid md:grid-cols-2 gap-4">
                       <div className="md:col-span-2">
                          <input className="w-full border border-blue-200 p-3 rounded-xl focus:ring-2 ring-blue-500 outline-none" placeholder="Tên bài hát (VD: Cắt đôi nỗi sầu)" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required autoFocus/>
                       </div>
                       <div className="md:col-span-2">
                          <input className="w-full border border-blue-200 p-3 rounded-xl focus:ring-2 ring-blue-500 outline-none text-sm" placeholder="Ghi chú (Tone/Nhịp/Ca sĩ hát...)" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
                       </div>
                       <div className="bg-white p-3 rounded-xl border border-blue-200">
                          <label className="block text-xs font-bold text-gray-500 mb-1">Sheet nhạc (PDF)</label>
                          <input type="file" accept=".pdf" className="text-sm w-full file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:bg-blue-100 file:text-blue-700" onChange={e => setFiles({...files, sheet: e.target.files[0]})} />
                       </div>
                       <div className="bg-white p-3 rounded-xl border border-blue-200">
                          <label className="block text-xs font-bold text-gray-500 mb-1">Beat nhạc (MP3/Audio)</label>
                          <input type="file" accept="audio/*" className="text-sm w-full file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:bg-blue-100 file:text-blue-700" onChange={e => setFiles({...files, beat: e.target.files[0]})} />
                       </div>
                       <button className="md:col-span-2 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg">🚀 Upload & Lưu vào Show</button>
                    </form>
                 </div>
               )}

               {/* DANH SÁCH BÀI HÁT */}
               <div className="divide-y divide-gray-100">
                  {data.songs.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                       <Music size={48} className="mx-auto mb-3 opacity-20"/>
                       <p>Chưa có bài hát nào. Thêm ngay nhé!</p>
                    </div>
                  ) : (
                    data.songs.map((song, index) => (
                      <div key={song._id} className="p-4 hover:bg-gray-50 transition flex flex-col md:flex-row gap-4 items-start md:items-center group">
                         {/* Số thứ tự & Tên */}
                         <div className="flex-1 flex gap-4 items-center">
                            <span className="text-2xl font-black text-gray-200 w-8 text-center">{index + 1}</span>
                            <div>
                               <h4 className="font-bold text-gray-800 text-lg">{song.name}</h4>
                               {song.note && <p className="text-sm text-gray-500 italic">{song.note}</p>}
                            </div>
                         </div>
                         
                         {/* Actions: Sheet/Beat */}
                         <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                            {song.sheetUrl ? (
                               <a href={`${BASE_URL.replace('/api', '')}/${song.sheetUrl}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700 hover:border-red-500 hover:text-red-500 transition shadow-sm">
                                  <FileText size={14} className="text-red-500"/> Sheet
                               </a>
                            ) : <span className="text-xs text-gray-300 px-3">No Sheet</span>}

                            {song.beatUrl ? (
                               <div className="flex items-center gap-2 bg-gray-100 pl-2 pr-1 py-1 rounded-full border border-gray-200">
                                  <PlayCircle size={16} className="text-blue-600"/>
                                  <audio controls src={`${BASE_URL.replace('/api', '')}/${song.beatUrl}`} className="h-6 w-32 md:w-48 opacity-80" />
                               </div>
                            ) : <span className="text-xs text-gray-300 px-3">No Beat</span>}
                            
                            {user?.role === 'admin' && (
                               <button onClick={() => handleDeleteSong(song._id)} className="text-gray-300 hover:text-red-500 p-2 transition"><Trash2 size={18}/></button>
                            )}
                         </div>
                      </div>
                    ))
                  )}
               </div>
            </div>

            {/* 3. THẢO LUẬN (COMMENT) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
               <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><MessageSquare className="text-green-500"/> Thảo luận & Bàn bạc</h3>
               <CommentSection eventId={id} />
            </div>

          </div>

          {/* CỘT PHẢI (1/3): SIDEBAR NHÂN SỰ */}
          <div className="md:col-span-1 space-y-6">
            
            {/* Box 1: ĐỘI HÌNH CHÍNH THỨC */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
               <h3 className="font-bold text-green-800 mb-4 flex items-center gap-2"><CheckCircle size={20}/> Chính Thức ({officialRoster.length})</h3>
               
               {officialRoster.length === 0 ? (
                  <p className="text-sm text-gray-400 italic text-center py-4 bg-gray-50 rounded-xl">Chưa chốt danh sách.</p>
               ) : (
                  <div className="space-y-3">
                     {officialRoster.map(p => (
                        <div key={p._id} className="flex items-center justify-between bg-green-50/50 p-3 rounded-xl border border-green-100">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-green-200 text-green-700 flex items-center justify-center font-bold text-xs">
                                 {p.user?.fullName?.charAt(0) || "U"}
                              </div>
                              <span className="font-bold text-gray-700 text-sm">{p.user?.fullName}</span>
                           </div>
                           {user?.role === 'admin' && (
                              <button onClick={() => handleTogglePerformer(p.user._id)} className="text-red-400 hover:bg-red-100 p-1 rounded transition"><MinusCircle size={16}/></button>
                           )}
                        </div>
                     ))}
                  </div>
               )}
            </div>

            {/* Box 2: ĐANG ĐĂNG KÝ */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
               <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><User size={20}/> Đăng Ký ({waitingList.length})</h3>
               
               <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
                  {waitingList.length === 0 && <p className="text-sm text-gray-400 italic text-center">Chưa có ai đăng ký mới.</p>}
                  {waitingList.map(p => (
                     <div key={p._id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl hover:bg-gray-100 transition">
                        <div>
                           <div className="font-bold text-gray-800 text-sm">{p.user?.fullName}</div>
                           <div className="text-[10px] text-gray-400">{new Date(p.joinedAt).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}</div>
                        </div>
                        {user?.role === 'admin' && (
                           <button onClick={() => handleTogglePerformer(p.user._id)} className="text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white p-2 rounded-lg transition" title="Duyệt"><PlusCircle size={16}/></button>
                        )}
                     </div>
                  ))}
               </div>

               {/* NÚT ĐĂNG KÝ THAM GIA */}
               {isApproved && !isCompleted && (
                  !isRegistered ? (
                     <button onClick={handleJoin} className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition transform active:scale-95 flex items-center justify-center gap-2">
                        <span>👋</span> Đăng ký tham gia ngay
                     </button>
                  ) : (
                     <button disabled className="w-full bg-green-50 text-green-600 py-3 rounded-xl font-bold cursor-not-allowed border border-green-200 flex justify-center items-center gap-2">
                        <CheckCircle size={18}/> Bạn đã đăng ký
                     </button>
                  )
               )}
            </div>

          </div>
        </div>
      </div>

      {/* MODAL KHO NHẠC (Giữ nguyên logic) */}
      {showLibModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><BookOpen size={20} className="text-purple-600"/> Chọn bài từ Kho Nhạc</h3>
              <button onClick={() => setShowLibModal(false)} className="text-gray-400 hover:text-red-500 transition"><XCircle size={24}/></button>
            </div>
            <div className="p-4 border-b bg-white">
                 <div className="relative">
                   <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
                   <input className="w-full pl-10 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ring-purple-500 bg-gray-50" placeholder="Tìm tên bài hát..." autoFocus value={libSearch} onChange={e => setLibSearch(e.target.value)} />
                 </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 bg-gray-50">
              {librarySongs.filter(s => s.name.toLowerCase().includes(libSearch.toLowerCase())).map(song => (
                <div key={song._id} className="p-3 mb-2 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-purple-300 flex justify-between items-center group transition cursor-pointer" onClick={() => handleAddFromLib(song._id)}>
                   <div>
                     <p className="font-bold text-slate-800 group-hover:text-purple-700 transition">{song.name}</p>
                     <p className="text-xs text-gray-500">{song.note || 'Chưa có ghi chú'}</p>
                   </div>
                   <button className="text-purple-600 font-bold text-xs bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100 group-hover:bg-purple-600 group-hover:text-white transition">Chọn</button>
                </div>
              ))}
              {librarySongs.length === 0 && <p className="text-center p-8 text-gray-400 italic">Kho nhạc trống.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetail;