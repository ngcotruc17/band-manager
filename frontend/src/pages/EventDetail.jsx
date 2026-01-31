import { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Trash2, Edit, XCircle, Clock, Shirt, Lock, AlertTriangle, CheckCircle, PlusCircle, MinusCircle, DollarSign, Music, UploadCloud, Search, BookOpen } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import CommentSection from '../components/CommentSection'; // <--- 1. IMPORT COMPONENT CHAT

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [data, setData] = useState({ event: null, songs: [] });
  const [formData, setFormData] = useState({ name: '', note: '' });
  const [files, setFiles] = useState({ sheet: null, beat: null });
  const [isEditing, setIsEditing] = useState(false);
  const [editEventData, setEditEventData] = useState({ title: '', location: '', date: '', logistics: '', cast: 0 });

  // --- STATE CHO KHO NHẠC ---
  const [showLibModal, setShowLibModal] = useState(false);
  const [librarySongs, setLibrarySongs] = useState([]);
  const [libSearch, setLibSearch] = useState('');

  const getHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const loadData = async () => {
    try {
      const res = await axios.get(`https://band-api.onrender.co/api/events/${id}`, getHeaders());
      setData(res.data);
      setEditEventData({
        title: res.data.event.title,
        location: res.data.event.location,
        date: res.data.event.date.split('T')[0],
        logistics: res.data.event.logistics || '',
        cast: res.data.event.cast || 0
      });
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadData(); }, [id]);

  const handleJoin = async () => {
    try {
      await axios.post(`https://band-api.onrender.co/api/events/${id}/join`, {}, getHeaders());
      alert("🎉 Đã đăng ký tham gia show!");
      loadData();
    } catch (err) { alert(err.response?.data?.message || "Lỗi tham gia"); }
  };

  const handleTogglePerformer = async (userId) => {
    try {
      await axios.put(`https://band-api.onrender.co/api/events/${id}/performer`, { userId }, getHeaders());
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
      await axios.post(`https://band-api.onrender.co/api/events/${id}/songs`, postData, {
        headers: { ...getHeaders().headers, 'Content-Type': 'multipart/form-data' }
      });
      alert("✅ Đã thêm bài hát!");
      setFormData({ name: '', note: '' });
      setFiles({ sheet: null, beat: null });
      document.getElementById('file-sheet').value = "";
      document.getElementById('file-beat').value = "";
      loadData();
    } catch (err) { alert("Lỗi thêm bài hát"); }
  };

  // --- HÀM KHO NHẠC ---
  const fetchLibrary = async () => {
    try {
      const res = await axios.get('https://band-api.onrender.co/api/library', getHeaders());
      setLibrarySongs(res.data);
      setShowLibModal(true);
    } catch (err) { console.error(err); }
  };

  const handleAddFromLib = async (libSongId) => {
    try {
      await axios.post(`https://band-api.onrender.co/api/events/${id}/songs/from-library`, { librarySongId: libSongId }, getHeaders());
      alert("✅ Đã lấy nhạc từ kho!");
      setShowLibModal(false);
      loadData();
    } catch (err) { alert("Lỗi thêm nhạc"); }
  };
  // ---------------------------------

  const handleUpdateEvent = async () => {
    try {
      await axios.put(`https://band-api.onrender.co/api/events/${id}`, editEventData, getHeaders());
      alert("✅ Đã cập nhật!");
      setIsEditing(false);
      loadData();
    } catch (err) { alert("Lỗi cập nhật"); }
  };
  
  const handleDeleteSong = async (songId) => {
    if(!window.confirm("Xóa bài này?")) return;
    try {
      await axios.delete(`https://band-api.onrender.co/api/events/songs/${songId}`, getHeaders());
      loadData();
    } catch (err) { alert("Lỗi xóa"); }
  };

  const handleDeleteEvent = async () => {
    if(!window.confirm("⚠️ Xóa Show này?")) return;
    try {
      await axios.delete(`https://band-api.onrender.co/api/events/${id}`, getHeaders());
      alert("🗑️ Đã xóa show!");
      navigate('/dashboard');
    } catch (err) { alert("Lỗi xóa show"); }
  };

  if (!data.event) return <div className="p-10 text-center">⏳ Đang tải...</div>;
  
  const status = data.event.bookingRef?.status || 'approved';
  const isApproved = status === 'approved';
  const isRegistered = data.event.participants?.some(p => p.user?._id === user._id);
  const registeredList = data.event.participants || [];
  const officialRoster = registeredList.filter(p => p.isSelected);
  const waitingList = registeredList.filter(p => !p.isSelected);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Link to="/dashboard" className="text-blue-600 mb-4 inline-block hover:underline">← Quay lại Dashboard</Link>
      
      {!isApproved && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 font-bold ${
          status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-200 text-gray-600'
        }`}>
          {status === 'pending' && <><AlertTriangle/> Show đang chờ duyệt. Chưa thể đăng ký.</>}
          {status === 'completed' && <><Lock/> Show đã diễn xong.</>}
          {status === 'cancelled' && <><XCircle/> Show đã bị hủy.</>}
        </div>
      )}

      {/* --- PHẦN 1: THÔNG TIN SHOW & NHÂN SỰ --- */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 bg-white p-6 rounded-lg shadow border-l-4 border-blue-500 relative h-fit">
          {!isEditing ? (
            <>
              <div className="flex justify-between">
                <h1 className="text-3xl font-bold mb-2 text-gray-800">{data.event.title}</h1>
                {user?.role === 'admin' && (
                  <div className="flex gap-2">
                    <button onClick={() => setIsEditing(true)} className="text-gray-500 hover:text-blue-600 bg-gray-100 p-2 rounded"><Edit size={20} /></button>
                    <button onClick={handleDeleteEvent} className="text-gray-500 hover:text-red-600 bg-gray-100 p-2 rounded"><Trash2 size={20} /></button>
                  </div>
                )}
              </div>
              
              <div className="text-gray-600 text-lg mb-2">
                 <p>📅 {new Date(data.event.date).toLocaleDateString('vi-VN')} | 📍 {data.event.location}</p>
                 <p className="mt-2 text-green-600 font-bold flex items-center gap-1 text-xl">
                    <DollarSign size={24}/> Cát-xê: {data.event.cast ? data.event.cast.toLocaleString('vi-VN') : 0} VNĐ
                 </p>
              </div>

              <div className="mt-4 p-4 bg-yellow-50 rounded border border-yellow-200">
                <h3 className="font-bold text-yellow-800 flex items-center gap-2 mb-2"><Shirt size={18} /> Logistics:</h3>
                <p className="whitespace-pre-line text-gray-700">{data.event.logistics || "Chưa có ghi chú."}</p>
              </div>
            </>
          ) : (
             <div className="space-y-3">
               <label className="font-bold">Sửa thông tin:</label>
               <input className="border p-2 w-full rounded" value={editEventData.title} onChange={e => setEditEventData({...editEventData, title: e.target.value})} />
               <div className="flex gap-2">
                 <div className="w-1/3">
                    <label className="text-sm font-bold text-gray-600">Ngày diễn</label>
                    <input type="date" className="border p-2 w-full rounded" value={editEventData.date} onChange={e => setEditEventData({...editEventData, date: e.target.value})} />
                 </div>
                 <div className="w-2/3">
                    <label className="text-sm font-bold text-gray-600">Địa điểm</label>
                    <input className="border p-2 w-full rounded" value={editEventData.location} onChange={e => setEditEventData({...editEventData, location: e.target.value})} />
                 </div>
               </div>
               <div>
                  <label className="font-bold text-green-700">💰 Cát-xê (VNĐ):</label>
                  <input type="number" className="border p-2 w-full rounded font-bold text-green-700" value={editEventData.cast} onChange={e => setEditEventData({...editEventData, cast: e.target.value})} />
               </div>
               <label className="font-bold block mt-2">Ghi chú Hậu cần:</label>
               <textarea rows="3" className="border p-2 w-full rounded" value={editEventData.logistics} onChange={e => setEditEventData({...editEventData, logistics: e.target.value})} />
               <div className="flex gap-2 mt-2">
                 <button onClick={handleUpdateEvent} className="bg-blue-600 text-white px-4 py-2 rounded">Lưu</button>
                 <button onClick={() => setIsEditing(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded">Hủy</button>
               </div>
             </div>
          )}
        </div>

        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2 border-b pb-2"><CheckCircle size={20}/> Danh sách Đi Diễn ({officialRoster.length})</h3>
            {officialRoster.length === 0 ? <p className="text-sm text-gray-400 italic">Chưa chốt danh sách.</p> : (
              <ul className="space-y-2">
                {officialRoster.map(p => (
                  <li key={p._id} className="flex justify-between items-center bg-green-50 p-2 rounded border border-green-100">
                    <div>
                      <span className="font-bold text-green-900 block">{p.user?.fullName || p.user?.username}</span>
                      <span className="text-xs text-green-600">Đã chốt</span>
                    </div>
                    {user?.role === 'admin' && (
                      <button onClick={() => handleTogglePerformer(p.user._id)} className="text-red-500 hover:bg-red-100 p-1 rounded" title="Bỏ chọn"><MinusCircle size={18}/></button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-gray-400">
            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2 border-b pb-2"><Clock size={20}/> Danh sách Đăng Ký ({waitingList.length})</h3>
            <ul className="space-y-2 mb-4 max-h-60 overflow-y-auto">
              {waitingList.length === 0 && <p className="text-sm text-gray-400 italic">Chưa có ai đăng ký mới.</p>}
              {waitingList.map(p => (
                <li key={p._id} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200">
                  <div>
                    <span className="font-medium text-gray-800 block">{p.user?.fullName || p.user?.username}</span>
                    <span className="text-xs text-gray-500">{new Date(p.joinedAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} {new Date(p.joinedAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                  {user?.role === 'admin' && (
                    <button onClick={() => handleTogglePerformer(p.user._id)} className="text-blue-600 hover:bg-blue-100 p-1 rounded" title="Chọn đi diễn"><PlusCircle size={20}/></button>
                  )}
                </li>
              ))}
            </ul>
            {isApproved && (
               !isRegistered ? (
                  <button onClick={handleJoin} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-bold shadow transition">✋ Đăng ký tham gia</button>
               ) : (
                  <button disabled className="w-full bg-gray-100 text-gray-500 py-2 rounded font-bold cursor-not-allowed border border-gray-300">✅ Đã đăng ký</button>
               )
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-300 my-8"></div>
      
      <h2 className="text-2xl font-bold text-blue-900 mb-6 flex items-center gap-2">
        🎵 Quản lý Bài hát
      </h2>

      {/* --- PHẦN 2: BÀI HÁT & UPLOAD --- */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* CỘT TRÁI (2/3): DANH SÁCH BÀI HÁT */}
        <div className="md:col-span-2 space-y-4 order-2 md:order-1">
           {data.songs.length === 0 ? (
             <div className="bg-white p-8 rounded-lg border-2 border-dashed border-gray-300 text-center text-gray-500">
               <Music size={48} className="mx-auto mb-2 text-gray-300"/>
               <p>Chưa có bài hát nào. Hãy upload bên cạnh nhé!</p>
             </div>
           ) : (
             data.songs.map(song => (
                <div key={song._id} className="bg-white p-4 rounded shadow-sm border border-gray-100 flex justify-between items-start hover:shadow-md transition">
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-blue-900 flex items-center gap-2">
                      <Music size={18}/> {song.name}
                    </h4>
                    <p className="text-sm text-gray-500 mb-2 italic">{song.note || "Không có ghi chú"}</p>
                    <div className="flex gap-3 mt-2">
                      {song.sheetUrl && <a href={`https://band-api.onrender.co/${song.sheetUrl}`} target="_blank" className="text-red-600 bg-red-50 px-3 py-1 rounded border border-red-200 text-sm font-bold hover:bg-red-100 transition">📄 Sheet</a>}
                      {song.beatUrl && <audio controls src={`https://band-api.onrender.co/${song.beatUrl}`} className="h-8 w-64" />}
                    </div>
                  </div>
                  {user?.role === 'admin' && (
                    <button onClick={() => handleDeleteSong(song._id)} className="text-gray-400 hover:text-red-500 p-2"><Trash2 size={20} /></button>
                  )}
                </div>
             ))
           )}
        </div>

        {/* CỘT PHẢI (1/3): FORM UPLOAD & CHỌN TỪ KHO */}
        <div className={`md:col-span-1 h-fit order-1 md:order-2 ${isApproved ? '' : 'opacity-50 pointer-events-none'}`}>
          <div className="bg-white p-5 rounded-lg shadow border border-gray-200 sticky top-4">
            <h3 className="font-bold mb-4 border-b pb-2 text-lg flex items-center gap-2 text-gray-700">
              <UploadCloud size={20}/> Upload Beat/Sheet
            </h3>

            {/* NÚT CHỌN TỪ KHO */}
            <button 
              onClick={fetchLibrary}
              disabled={!isApproved}
              className="w-full mb-4 bg-purple-600 text-white py-2 rounded hover:bg-purple-700 font-bold shadow flex items-center justify-center gap-2"
            >
              <BookOpen size={18}/> Chọn từ Kho Nhạc
            </button>
            
            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">HOẶC UPLOAD MỚI</span>
                <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <form onSubmit={handleAddSong} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Tên bài hát</label>
                <input className="w-full border p-2 rounded focus:ring-2 ring-blue-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="VD: Cắt đôi nỗi sầu" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Ghi chú</label>
                <input className="w-full border p-2 rounded focus:ring-2 ring-blue-500 outline-none" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} placeholder="Tone Nam / Điệu Disco..." />
              </div>
              <div className="bg-gray-50 p-2 rounded border border-gray-200">
                <label className="block text-xs font-bold mb-1 text-red-600">Sheet nhạc (PDF)</label>
                <input id="file-sheet" type="file" accept=".pdf" className="text-sm w-full" onChange={e => setFiles({...files, sheet: e.target.files[0]})} />
              </div>
              <div className="bg-gray-50 p-2 rounded border border-gray-200">
                <label className="block text-xs font-bold mb-1 text-blue-600">Beat nhạc (MP3)</label>
                <input id="file-beat" type="file" accept="audio/*" className="text-sm w-full" onChange={e => setFiles({...files, beat: e.target.files[0]})} />
              </div>
              <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-bold shadow-lg transition transform hover:-translate-y-1" disabled={!isApproved}>
                🚀 Upload Ngay
              </button>
            </form>
            {!isApproved && <p className="text-xs text-red-500 mt-2 text-center font-bold bg-red-50 p-1 rounded">Chỉ được upload khi Show đã duyệt.</p>}
          </div>
        </div>
      </div>

      {/* --- PHẦN 3: BÌNH LUẬN (MỚI THÊM) --- */}
      <CommentSection eventId={id} /> 
      {/* ------------------------------------ */}

      {/* MODAL KHO NHẠC */}
      {showLibModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
              <h3 className="font-bold text-lg text-blue-900">📚 Chọn bài từ Kho Nhạc</h3>
              <button onClick={() => setShowLibModal(false)} className="text-gray-500 hover:text-red-500"><XCircle size={24}/></button>
            </div>
            
            <div className="p-4 border-b">
              <div className="relative">
                 <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                 <input 
                   className="w-full pl-9 p-2 border rounded focus:outline-none focus:ring-2 ring-blue-500" 
                   placeholder="Tìm tên bài hát..." 
                   autoFocus
                   value={libSearch}
                   onChange={e => setLibSearch(e.target.value)}
                 />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {librarySongs.filter(s => s.name.toLowerCase().includes(libSearch.toLowerCase())).map(song => (
                <div key={song._id} className="p-3 hover:bg-blue-50 border-b flex justify-between items-center group transition cursor-pointer" onClick={() => handleAddFromLib(song._id)}>
                   <div>
                     <p className="font-bold text-gray-800">{song.name}</p>
                     <p className="text-xs text-gray-500">{song.note || 'Chưa có ghi chú'}</p>
                   </div>
                   <button className="text-blue-600 font-bold text-sm bg-blue-100 px-3 py-1 rounded group-hover:bg-blue-600 group-hover:text-white transition">Chọn</button>
                </div>
              ))}
              {librarySongs.length === 0 && <p className="text-center p-4 text-gray-500">Kho nhạc trống.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetail;