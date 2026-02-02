import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  Music, UploadCloud, Trash2, Search, FileText, 
  PlayCircle, Plus, X, Download, Headphones 
} from 'lucide-react';
import toast from 'react-hot-toast';

const SongLibrary = () => {
  const [songs, setSongs] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State cho Modal & Form
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', note: '' });
  const [files, setFiles] = useState({ sheet: null, beat: null });
  const [loading, setLoading] = useState(false);

  const { user } = useContext(AuthContext);
  const BASE_URL = 'https://band-manager-s9tm.onrender.com/api'; // Hoặc lấy từ env

  const getHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  // 1. LẤY DANH SÁCH BÀI HÁT
  const fetchSongs = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/library`, getHeaders());
      setSongs(res.data);
      setFilteredSongs(res.data);
    } catch (err) { 
      console.error(err);
      toast.error("Không tải được danh sách nhạc");
    }
  };

  useEffect(() => { fetchSongs(); }, []);

  // 2. XỬ LÝ TÌM KIẾM
  useEffect(() => {
    const results = songs.filter(s => 
      (s.title || s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.note || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSongs(results);
  }, [searchTerm, songs]);

  // 3. UPLOAD BÀI HÁT
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.title) return toast.error("Vui lòng nhập tên bài hát");

    setLoading(true);
    const postData = new FormData();
    postData.append('title', formData.title);
    postData.append('note', formData.note);
    if (files.sheet) postData.append('sheet', files.sheet);
    if (files.beat) postData.append('beat', files.beat);

    const toastId = toast.loading("Đang đẩy lên kho...");

    try {
      await axios.post(`${BASE_URL}/library`, postData, {
        headers: { ...getHeaders().headers, 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success("Đã thêm bài hát mới! 🎵", { id: toastId });
      
      // Reset & Đóng modal
      setFormData({ title: '', note: '' });
      setFiles({ sheet: null, beat: null });
      setShowModal(false);
      fetchSongs();

    } catch (err) { 
      toast.error("Lỗi upload: " + (err.response?.data?.message || "Lỗi server"), { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // 4. XÓA BÀI HÁT
  const handleDelete = async (id) => {
    if(!window.confirm("Bạn chắc chắn muốn xóa bài này khỏi kho?")) return;
    try {
      await axios.delete(`${BASE_URL}/library/${id}`, getHeaders());
      toast.success("Đã xóa bài hát");
      fetchSongs();
    } catch (err) { toast.error("Lỗi khi xóa"); }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* --- HEADER & TOOLBAR --- */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3">
              <span className="bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-300">
                <Music size={28} />
              </span>
              Kho Nhạc Chung
            </h1>
            <p className="text-gray-500 mt-1 text-sm">Nơi lưu trữ Sheet & Beat cho toàn bộ Band</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Thanh tìm kiếm */}
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                className="w-full pl-10 pr-4 py-3 rounded-xl border-none shadow-sm focus:ring-2 ring-blue-500 bg-white placeholder-gray-400 font-medium transition"
                placeholder="Tìm tên bài, tone, ghi chú..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Nút thêm mới */}
            <button 
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition flex items-center gap-2 whitespace-nowrap"
            >
              <Plus size={20}/> <span className="hidden sm:inline">Thêm Bài Mới</span>
            </button>
          </div>
        </div>

        {/* --- DANH SÁCH BÀI HÁT (GRID VIEW) --- */}
        {filteredSongs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Music size={40} className="text-gray-300" />
            </div>
            <h3 className="text-gray-400 font-bold text-lg">Chưa tìm thấy bài hát nào</h3>
            <p className="text-gray-400 text-sm">Hãy thử tìm từ khóa khác hoặc thêm bài mới nhé.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSongs.map(song => (
              <div key={song._id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group flex flex-col">
                
                {/* Card Header: Icon & Title */}
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 p-3 rounded-xl">
                      <Headphones size={24} />
                    </div>
                    {user?.role === 'admin' && (
                      <button onClick={() => handleDelete(song._id)} className="text-gray-300 hover:text-red-500 transition p-1 rounded-full hover:bg-red-50">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                  
                  <h3 className="font-bold text-gray-800 text-lg line-clamp-2 leading-tight mb-1" title={song.title || song.name}>
                    {song.title || song.name}
                  </h3>
                  <p className="text-sm text-gray-500 italic line-clamp-1">
                    {song.note || "Chưa có ghi chú"}
                  </p>
                </div>

                {/* Card Actions: Sheet & Beat */}
                <div className="bg-gray-50/50 p-4 border-t border-gray-100 flex flex-col gap-3">
                  {/* Sheet Button */}
                  {song.sheetUrl ? (
                    <a 
                      href={`https://band-manager-s9tm.onrender.com/${song.sheetUrl}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-white border border-gray-200 text-gray-700 font-bold text-xs hover:border-red-500 hover:text-red-600 transition shadow-sm"
                    >
                      <FileText size={16} className="text-red-500"/> Xem Sheet Nhạc
                    </a>
                  ) : (
                    <div className="text-center text-xs text-gray-400 py-2 bg-gray-100 rounded-lg select-none">Chưa có Sheet</div>
                  )}

                  {/* Beat Player */}
                  {song.beatUrl ? (
                    <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-sm">
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <PlayCircle size={14} className="text-blue-500 animate-pulse"/>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Beat Audio</span>
                      </div>
                      <audio controls className="w-full h-8 block" src={`https://band-manager-s9tm.onrender.com/${song.beatUrl}`} />
                    </div>
                  ) : (
                    <div className="text-center text-xs text-gray-400 py-2 bg-gray-100 rounded-lg select-none">Chưa có Beat</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- MODAL UPLOAD (POPUP) --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-in-from-bottom">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                <UploadCloud className="text-blue-600"/> Tải lên Kho Nhạc
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 bg-white p-1 rounded-full hover:bg-red-50 transition"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleUpload} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tên bài hát <span className="text-red-500">*</span></label>
                <input 
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 ring-blue-500 outline-none bg-gray-50 focus:bg-white transition"
                  placeholder="VD: Cắt đôi nỗi sầu..."
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Ghi chú (Tone / Điệu / Ca sĩ)</label>
                <input 
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 ring-blue-500 outline-none bg-gray-50 focus:bg-white transition"
                  placeholder="VD: Tone Am - Disco - Tăng Duy Tân"
                  value={formData.note}
                  onChange={e => setFormData({...formData, note: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Input Sheet */}
                <div className="relative group cursor-pointer">
                  <div className="p-4 border-2 border-dashed border-red-200 rounded-xl bg-red-50 group-hover:bg-red-100 transition text-center">
                    <FileText className="mx-auto text-red-500 mb-2" size={24}/>
                    <span className="text-xs font-bold text-red-700 block truncate">
                      {files.sheet ? files.sheet.name : "Chọn file PDF"}
                    </span>
                  </div>
                  <input type="file" accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setFiles({...files, sheet: e.target.files[0]})} />
                </div>

                {/* Input Beat */}
                <div className="relative group cursor-pointer">
                  <div className="p-4 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50 group-hover:bg-blue-100 transition text-center">
                    <Music className="mx-auto text-blue-500 mb-2" size={24}/>
                    <span className="text-xs font-bold text-blue-700 block truncate">
                      {files.beat ? files.beat.name : "Chọn file MP3"}
                    </span>
                  </div>
                  <input type="file" accept="audio/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setFiles({...files, beat: e.target.files[0]})} />
                </div>
              </div>

              <button 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? "Đang xử lý..." : <><UploadCloud size={20}/> Lưu vào Kho Nhạc</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SongLibrary;