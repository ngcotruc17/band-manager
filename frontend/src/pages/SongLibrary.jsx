import { useState, useEffect, useContext } from "react";
import api from '../services/api';
import { AuthContext } from "../context/AuthContext";
import { AudioContext } from "../context/AudioContext"; // 👈 Dùng để phát nhạc toàn cục
import { Music, UploadCloud, Trash2, Search, FileText, PlayCircle, Plus, X, Download, Headphones, Loader } from "lucide-react";
import toast from "react-hot-toast";

const SongLibrary = () => {
  const [songs, setSongs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: "", note: "" });
  const [files, setFiles] = useState({ sheet: null, beat: null });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  const { user } = useContext(AuthContext);
  const { playTrack, currentTrack, isPlaying } = useContext(AudioContext); // 👈 Lấy từ AudioContext

  const fetchSongs = async () => {
    try {
      const res = await api.get("/library");
      setSongs(res.data);
    } catch (err) { toast.error("Không tải được danh sách nhạc"); }
    finally { setFetchLoading(false); }
  };

  useEffect(() => { fetchSongs(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.title) return toast.error("Vui lòng nhập tên bài hát");
    setLoading(true);
    const postData = new FormData();
    postData.append("title", formData.title);
    postData.append("note", formData.note);
    if (files.sheet) postData.append("sheet", files.sheet);
    if (files.beat) postData.append("beat", files.beat);

    try {
      await api.post("/library", postData, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Đã thêm bài hát vào kho! 🎵");
      setFormData({ title: "", note: "" });
      setFiles({ sheet: null, beat: null });
      setShowModal(false);
      fetchSongs();
    } catch (err) { toast.error("Lỗi upload bài hát"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn muốn xóa bài này khỏi kho?")) return;
    try {
      await api.delete(`/library/${id}`);
      toast.success("Đã xóa");
      fetchSongs();
    } catch (err) { toast.error("Lỗi khi xóa"); }
  };

  const filteredSongs = songs.filter(s =>
    (s.title || s.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.note || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen p-4 md:p-8 pt-8 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
              <span className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-2.5 rounded-2xl shadow-lg shadow-blue-200">
                <Music size={28} />
              </span>
              Kho Nhạc Của Band
            </h1>
            <p className="text-slate-500 mt-1 font-medium">Lưu trữ file Sheet và Beat tập luyện chung.</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-white bg-white/50 backdrop-blur-md shadow-sm focus:ring-2 ring-blue-500 outline-none font-medium transition"
                placeholder="Tìm bài hát, tone, điệu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={() => setShowModal(true)} className="bg-slate-900 hover:bg-black text-white px-6 py-3.5 rounded-2xl font-bold shadow-xl transition flex items-center gap-2 whitespace-nowrap">
              <Plus size={20} /> <span className="hidden sm:inline">Thêm Bài</span>
            </button>
          </div>
        </div>

        {/* LIST SONGS */}
        {fetchLoading ? (
          <div className="text-center py-20"><Loader className="animate-spin mx-auto text-blue-600" size={32}/></div>
        ) : filteredSongs.length === 0 ? (
          <div className="text-center py-20 glass rounded-[40px] border-dashed">
            <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Music size={40} className="text-slate-300" />
            </div>
            <h3 className="text-slate-400 font-bold text-lg">Không tìm thấy bài hát nào</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSongs.map((song) => (
              <div key={song._id} className="bg-white rounded-[32px] shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden group flex flex-col card-hover">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl">
                      <Headphones size={24} />
                    </div>
                    {user?.role === "admin" && (
                      <button onClick={() => handleDelete(song._id)} className="text-slate-300 hover:text-rose-500 transition p-2 rounded-full hover:bg-rose-50">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                  <h3 className="font-black text-slate-800 text-xl line-clamp-2 leading-tight mb-2 group-hover:text-blue-600 transition tracking-tight">
                    {song.title || song.name}
                  </h3>
                  <p className="text-sm text-slate-400 font-medium italic line-clamp-1">
                    {song.note || "Chưa có ghi chú"}
                  </p>
                </div>

                <div className="bg-slate-50/50 p-5 border-t border-slate-100 flex flex-col gap-3">
                  {song.sheetUrl ? (
                    <a
                      href={`https://band-manager-s9tm.onrender.com/${song.sheetUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:border-rose-500 hover:text-rose-600 transition shadow-sm"
                    >
                      <FileText size={16} className="text-rose-500" /> Xem Sheet Nhạc
                    </a>
                  ) : (
                    <div className="text-center text-[10px] font-bold text-slate-400 py-2.5 bg-slate-100 rounded-xl uppercase tracking-widest">Không có Sheet</div>
                  )}

                  {song.beatUrl ? (
                    <button 
                      onClick={() => playTrack(song.beatUrl, song.title || song.name)}
                      className="flex justify-between items-center bg-slate-900 text-white p-3 rounded-xl shadow-lg shadow-slate-200 hover:bg-black transition group/play"
                    >
                      <div className="flex items-center gap-2">
                        <PlayCircle size={18} className="text-blue-400 group-hover/play:scale-110 transition" />
                        <span className="text-xs font-black uppercase tracking-widest">Nghe Beat</span>
                      </div>
                      {currentTrack?.url?.includes(song.beatUrl) && isPlaying && (
                         <div className="flex gap-0.5 items-end h-3">
                           <div className="w-1 bg-blue-400 h-full animate-pulse"></div>
                           <div className="w-1 bg-blue-400 h-2/3 animate-pulse delay-75"></div>
                           <div className="w-1 bg-blue-400 h-4/5 animate-pulse delay-150"></div>
                         </div>
                      )}
                    </button>
                  ) : (
                    <div className="text-center text-[10px] font-bold text-slate-400 py-2.5 border border-dashed border-slate-200 rounded-xl uppercase tracking-widest">Chưa có Beat</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL UPLOAD */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-2xl text-slate-800 flex items-center gap-2">
                <UploadCloud className="text-blue-600" size={28} /> Tải lên Kho Nhạc
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-rose-500 bg-white p-2 rounded-full transition shadow-sm">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tên bài hát *</label>
                <input
                  className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 ring-blue-500 outline-none bg-slate-50 font-bold text-slate-800 transition"
                  placeholder="VD: Cắt đôi nỗi sầu..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Ghi chú (Tone / Điệu)</label>
                <input
                  className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 ring-blue-500 outline-none bg-slate-50 font-medium transition"
                  placeholder="VD: Tone Am - Disco"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative group cursor-pointer">
                  <div className={`p-5 border-2 border-dashed rounded-3xl transition text-center ${files.sheet ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                    <FileText className={`mx-auto mb-2 ${files.sheet ? 'text-rose-500' : 'text-slate-400'}`} size={28} />
                    <span className="text-[10px] font-black uppercase tracking-tighter block truncate">
                      {files.sheet ? files.sheet.name : "Chọn file PDF"}
                    </span>
                  </div>
                  <input type="file" accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setFiles({ ...files, sheet: e.target.files[0] })} />
                </div>

                <div className="relative group cursor-pointer">
                  <div className={`p-5 border-2 border-dashed rounded-3xl transition text-center ${files.beat ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                    <Music className={`mx-auto mb-2 ${files.beat ? 'text-blue-500' : 'text-slate-400'}`} size={28} />
                    <span className="text-[10px] font-black uppercase tracking-tighter block truncate">
                      {files.beat ? files.beat.name : "Chọn file MP3"}
                    </span>
                  </div>
                  <input type="file" accept="audio/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setFiles({ ...files, beat: e.target.files[0] })} />
                </div>
              </div>

              <button disabled={loading} className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-500/10 transition active:scale-95 flex items-center justify-center gap-2">
                {loading ? "Đang xử lý..." : <><UploadCloud size={20} /> LƯU VÀO KHO</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SongLibrary;