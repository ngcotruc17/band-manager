import { useEffect, useState, useContext, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { 
  Calendar, Clock, MapPin, User, ArrowLeft, Music, 
  UploadCloud, Lock, Unlock, Check, X, AlertCircle, 
  Download, Link as LinkIcon, Plus, Search, FileText
} from "lucide-react";
import toast from "react-hot-toast";

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);

  // State cho Modal Nhạc
  const [showAddMusicModal, setShowAddMusicModal] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [librarySongs, setLibrarySongs] = useState([]); // Dữ liệu kho nhạc
  
  // Form thêm nhạc nhanh
  const [musicForm, setMusicForm] = useState({ title: "", link: "", note: "" });

  const API_URL = `https://band-manager-s9tm.onrender.com/api/shows/${id}`;
  const getHeaders = useCallback(() => ({ 
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } 
  }), []);

  const fetchShow = useCallback(async () => {
    try {
      const res = await axios.get(API_URL, getHeaders());
      setShow(res.data);
      setLoading(false);
    } catch (error) {
       // Silent fail
    }
  }, [API_URL, getHeaders]);

  useEffect(() => {
    fetchShow();
  }, [fetchShow]);

  // --- ACTIONS ---
  const handleJoin = async () => {
    try {
      const res = await axios.post(`${API_URL}/join`, {}, getHeaders());
      toast.success(res.data.message);
      fetchShow();
    } catch (err) { toast.error(err.response?.data?.message || "Lỗi thao tác"); }
  };

  const handleApprove = async (userId) => {
    try {
      await axios.put(`${API_URL}/approve-participant`, { userId }, getHeaders());
      toast.success("Đã duyệt thành viên!");
      fetchShow();
    } catch (err) { toast.error("Lỗi duyệt"); }
  };

  const handleRemove = async (userId) => {
    if(!window.confirm("Muốn loại thành viên này?")) return;
    try {
      await axios.put(`${API_URL}/remove-participant`, { userId }, getHeaders());
      toast.success("Đã xóa thành viên");
      fetchShow();
    } catch (err) { toast.error("Lỗi xóa"); }
  };

  const toggleRegistration = async () => {
    try {
      const res = await axios.put(`${API_URL}/toggle-registration`, {}, getHeaders());
      toast.success(res.data.message);
      fetchShow();
    } catch (err) { toast.error("Lỗi thao tác"); }
  };

  // --- XỬ LÝ NHẠC ---
  
  // 1. Thêm nhạc thủ công (Link Drive/Youtube)
  const handleAddMusic = async () => {
    if (!musicForm.title) return toast.error("Vui lòng nhập tên bài hát");
    try {
      await axios.post(`${API_URL}/setlist`, musicForm, getHeaders());
      toast.success("Đã thêm bài hát!");
      setMusicForm({ title: "", link: "", note: "" });
      setShowAddMusicModal(false);
      fetchShow();
    } catch (err) { toast.error("Lỗi thêm nhạc"); }
  };

  // 2. Xóa nhạc
  const handleRemoveMusic = async (songId) => {
    if(!window.confirm("Xóa bài này khỏi list?")) return;
    try {
      await axios.delete(`${API_URL}/setlist/${songId}`, getHeaders());
      toast.success("Đã xóa");
      fetchShow();
    } catch (err) { toast.error("Lỗi xóa nhạc"); }
  };

  // 3. Lấy danh sách từ Kho Nhạc (Giả lập gọi API Songs)
  const fetchLibrary = async () => {
    try {
      // Gọi API lấy toàn bộ bài hát trong kho (Cần API này bên backend nếu chưa có)
      // Tạm thời mình gọi thử, nếu bạn chưa có API songs thì cần tạo thêm.
      const res = await axios.get("https://band-manager-s9tm.onrender.com/api/songs", getHeaders());
      setLibrarySongs(res.data);
      setShowLibraryModal(true);
    } catch (err) {
      toast.error("Không tải được kho nhạc (Cần API /api/songs)");
      // Mở modal rỗng để test giao diện
      setLibrarySongs([
        { _id: '1', title: 'Cắt Đôi Nỗi Sầu', link: 'https://youtube.com', note: 'Tone Em' },
        { _id: '2', title: 'Ngày Mai Người Ta Lấy Chồng', link: '', note: 'Tone Gm' }
      ]);
      setShowLibraryModal(true);
    }
  };

  // 4. Chọn nhạc từ kho add vào show
  const handleSelectFromLib = async (song) => {
    try {
      await axios.post(`${API_URL}/setlist`, {
        title: song.title,
        link: song.link || "",
        note: song.note || ""
      }, getHeaders());
      toast.success(`Đã thêm: ${song.title}`);
      fetchShow();
    } catch (err) { toast.error("Lỗi thêm nhạc"); }
  };


  if (loading || !show) return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;

  // PHÂN LOẠI DANH SÁCH
  const approvedMembers = show.participants?.filter(p => p.status === 'approved') || [];
  const pendingMembers = show.participants?.filter(p => p.status === 'pending') || [];
  const isJoined = show.participants?.some(p => p.user?._id === user?._id);
  const isAdmin = user?.role === 'admin';
  const canRegister = show.status === 'confirmed' && !show.isRegistrationClosed;
  
  // Logic hiển thị chức năng nhạc (Cho phép khi show đã chốt hoặc hoàn thành)
  const canEditMusic = show.status === 'confirmed' || show.status === 'completed';

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <Link to="/bookings" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold mb-2"><ArrowLeft size={20}/> Quay lại</Link>

        {/* HEADER */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex gap-2 mb-3">
                   {show.status === 'pending' && <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold uppercase">⏳ Chờ duyệt show</span>}
                   {show.status === 'confirmed' && !show.isRegistrationClosed && <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase">✅ Đang mở đăng ký</span>}
                   {show.status === 'confirmed' && show.isRegistrationClosed && <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold uppercase flex items-center gap-1"><Lock size={12}/> Đã chốt sổ</span>}
                </div>
                <h1 className="text-4xl font-extrabold text-gray-900">{show.title}</h1>
                <div className="flex gap-6 mt-4 text-gray-600 font-medium text-sm">
                  <span className="flex items-center gap-2"><Calendar className="text-pink-500" size={18}/> {new Date(show.date).toLocaleDateString('vi-VN')}</span>
                  <span className="flex items-center gap-2"><Clock className="text-orange-500" size={18}/> {show.time}</span>
                  <span className="flex items-center gap-2"><MapPin className="text-blue-500" size={18}/> {show.location}</span>
                </div>
              </div>
              <div className="text-right"><p className="text-gray-400 text-xs font-bold uppercase">Cát-xê</p><p className="text-3xl font-black text-green-600">{(show.price || 0).toLocaleString()}đ</p></div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            
            {/* KHU VỰC ĐĂNG KÝ */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><User className="text-purple-500"/> Đăng Ký Tham Gia</h3>
                  {isAdmin && show.status === 'confirmed' && (
                    <button onClick={toggleRegistration} className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition ${show.isRegistrationClosed ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                       {show.isRegistrationClosed ? <><Unlock size={14}/> Mở lại đăng ký</> : <><Lock size={14}/> Chốt sổ thành viên</>}
                    </button>
                  )}
               </div>

               <div className="bg-purple-50 p-5 rounded-xl border border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="font-bold text-gray-900">
                      Trạng thái: {isJoined ? (approvedMembers.find(p=>p.user?._id === user._id) ? "✅ Đã được duyệt" : "⏳ Đang chờ duyệt") : "Chưa đăng ký"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Đăng ký sớm để Admin sắp xếp đội hình.</p>
                  </div>
                  
                  {isJoined ? (
                     <button onClick={handleJoin} className="bg-red-100 text-red-600 border border-red-200 px-6 py-2.5 rounded-xl font-bold hover:bg-red-200 transition">❌ Hủy đăng ký</button>
                  ) : (
                     <button onClick={handleJoin} disabled={!canRegister} className={`px-6 py-2.5 rounded-xl font-bold shadow-lg transition ${canRegister ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>✋ Đăng ký ngay</button>
                  )}
               </div>

               {/* DANH SÁCH THÀNH VIÊN */}
               <div className="mb-6">
                  <p className="text-xs font-bold text-green-600 uppercase mb-3 flex items-center gap-1"><Check size={14}/> Đội hình chính thức ({approvedMembers.length})</p>
                  <div className="space-y-2">
                     {approvedMembers.length > 0 ? approvedMembers.map(p => (
                        <div key={p._id} className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-xl">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-200 text-green-700 rounded-full flex items-center justify-center font-bold text-xs">{p.user?.fullName?.charAt(0) || "U"}</div>
                              <div><p className="font-bold text-sm text-gray-800">{p.user?.fullName || "Ẩn"} {p.user?._id === user._id && "(Bạn)"}</p><p className="text-xs text-gray-500">{p.role}</p></div>
                           </div>
                           {isAdmin && <button onClick={() => handleRemove(p.user._id)} className="text-red-400 hover:text-red-600 p-1"><X size={16}/></button>}
                        </div>
                     )) : <p className="text-sm text-gray-400 italic">Chưa có thành viên chính thức.</p>}
                  </div>
               </div>
               
               {/* DANH SÁCH CHỜ */}
               {pendingMembers.length > 0 && (
                 <div>
                    <p className="text-xs font-bold text-orange-500 uppercase mb-3 flex items-center gap-1"><AlertCircle size={14}/> Danh sách chờ ({pendingMembers.length})</p>
                    <div className="space-y-2">
                       {pendingMembers.map(p => (
                          <div key={p._id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center font-bold text-xs">{p.user?.fullName?.charAt(0) || "U"}</div>
                                <p className="font-bold text-sm text-gray-600">{p.user?.fullName || "Ẩn"}</p>
                             </div>
                             {isAdmin && (
                                <div className="flex gap-2">
                                   <button onClick={() => handleApprove(p.user._id)} className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1.5 rounded hover:bg-green-200">✓</button>
                                   <button onClick={() => handleRemove(p.user._id)} className="text-xs font-bold bg-red-50 text-red-500 px-3 py-1.5 rounded hover:bg-red-100">✕</button>
                                </div>
                             )}
                          </div>
                       ))}
                    </div>
                 </div>
               )}
            </div>

            {/* --- LIST NHẠC & BEAT --- */}
            <div className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 ${!canEditMusic && 'opacity-80'}`}>
               <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Music className="text-pink-500"/> List Nhạc & Beat</h3>
                  <div className="flex gap-2">
                    <button onClick={fetchLibrary} disabled={!canEditMusic} className="text-sm font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-2 rounded-lg flex items-center gap-1 transition"><Search size={16}/> Lấy từ Kho</button>
                    <button onClick={() => setShowAddMusicModal(true)} disabled={!canEditMusic} className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg flex items-center gap-1 transition"><UploadCloud size={16}/> Up Beat Mới</button>
                  </div>
               </div>

               <div className="space-y-3">
                  {show.setlist && show.setlist.length > 0 ? (
                    show.setlist.map((song) => (
                      <div key={song._id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:shadow-sm transition group">
                         <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 bg-pink-100 text-pink-600 rounded-lg flex items-center justify-center"><Music size={20}/></div>
                            <div className="min-w-0">
                               <p className="font-bold text-gray-800 truncate">{song.title}</p>
                               <p className="text-xs text-gray-500 truncate">{song.note || "Chưa có ghi chú"}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                            {song.link && (
                              <a href={song.link} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center gap-1">
                                <Download size={14}/> Tải / Xem
                              </a>
                            )}
                            <button onClick={() => handleRemoveMusic(song._id)} className="text-gray-400 hover:text-red-500 p-2"><X size={16}/></button>
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                       <p className="text-gray-400 text-sm">Chưa có bài hát nào. Thêm nhạc để mọi người tập nhé!</p>
                    </div>
                  )}
               </div>
            </div>
          </div>

          {/* CỘT PHẢI */}
          <div className="space-y-6">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4">Thông tin Show</h3>
                <div className="space-y-4 text-sm text-gray-600">
                   <p>Khách hàng: <span className="font-bold">{show.customerName}</span></p>
                   <p>SĐT: <span className="font-bold">{show.phone || "---"}</span></p>
                   <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 italic">"{show.notes || "Không có ghi chú"}"</div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* --- MODAL THÊM NHẠC NHANH --- */}
      {showAddMusicModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-up">
              <h3 className="text-lg font-bold mb-4">Thêm Link Nhạc / Beat</h3>
              <div className="space-y-3">
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Tên bài hát *</label>
                    <input type="text" className="w-full p-2 border rounded-lg mt-1" value={musicForm.title} onChange={e => setMusicForm({...musicForm, title: e.target.value})} placeholder="VD: Cắt đôi nỗi sầu"/>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Link (Drive/Youtube)</label>
                    <input type="text" className="w-full p-2 border rounded-lg mt-1" value={musicForm.link} onChange={e => setMusicForm({...musicForm, link: e.target.value})} placeholder="https://..."/>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Ghi chú (Tone/Điệu)</label>
                    <input type="text" className="w-full p-2 border rounded-lg mt-1" value={musicForm.note} onChange={e => setMusicForm({...musicForm, note: e.target.value})} placeholder="VD: Tone Nam, Disco"/>
                 </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                 <button onClick={() => setShowAddMusicModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg font-bold">Hủy</button>
                 <button onClick={handleAddMusic} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">Thêm vào Show</button>
              </div>
           </div>
        </div>
      )}

      {/* --- MODAL KHO NHẠC --- */}
      {showLibraryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-scale-up h-[80vh] flex flex-col">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Music/> Chọn từ Kho Nhạc</h3>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                 {librarySongs.map(song => (
                    <div key={song._id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-gray-50 cursor-pointer" onClick={() => handleSelectFromLib(song)}>
                       <div>
                          <p className="font-bold text-gray-800">{song.title}</p>
                          <p className="text-xs text-gray-500">{song.note || "Không ghi chú"}</p>
                       </div>
                       <Plus size={20} className="text-blue-500"/>
                    </div>
                 ))}
                 {librarySongs.length === 0 && <p className="text-center text-gray-400 mt-10">Kho nhạc trống.</p>}
              </div>
              <div className="mt-4 pt-4 border-t text-right">
                 <button onClick={() => setShowLibraryModal(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-bold hover:bg-gray-200">Đóng</button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default BookingDetail;