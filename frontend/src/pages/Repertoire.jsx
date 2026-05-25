import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { AudioContext } from "../context/AudioContext";
import { Navigate } from "react-router-dom";
import api from '../services/api';
import { 
  BookOpen, Search, Printer, Music, CheckCircle, Loader, 
  Layers, Disc, HelpCircle, FileText, PlayCircle, Plus, 
  Trash2, ArrowUp, ArrowDown, ClipboardCheck, Calendar, 
  MapPin, Check, Save, Copy, FilePlus, ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";

const Repertoire = () => {
  const { user } = useContext(AuthContext);
  const { playTrack, currentTrack, isPlaying } = useContext(AudioContext);

  // Phân quyền: Chỉ admin được truy cập
  if (user && user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // State chung
  const [activeTab, setActiveTab] = useState("database"); // 'database' hoặc 'planner'
  const [songs, setSongs] = useState([]);
  const [loadingSongs, setLoadingSongs] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // State cho Tab Planner (Thiết lập Setlist)
  const [shows, setShows] = useState([]);
  const [loadingShows, setLoadingShows] = useState(false);
  const [selectedShowId, setSelectedShowId] = useState("");
  const [selectedShow, setSelectedShow] = useState(null);
  const [loadingShowDetail, setLoadingShowDetail] = useState(false);
  const [plannerSetlist, setPlannerSetlist] = useState([]);
  const [showNotes, setShowNotes] = useState("");
  const [savingSetlist, setSavingSetlist] = useState(false);
  const [plannerSearchTerm, setPlannerSearchTerm] = useState("");

  // Tải danh sách bài hát (Repertoire Database)
  const fetchSongs = async () => {
    try {
      const res = await api.get("/library");
      // Sắp xếp bảng chữ cái
      const sortedSongs = (res.data || []).sort((a, b) => {
        const titleA = (a.title || a.name || "").toUpperCase();
        const titleB = (b.title || b.name || "").toUpperCase();
        return titleA.localeCompare(titleB);
      });
      setSongs(sortedSongs);
    } catch (err) {
      toast.error("Lỗi tải danh mục bài hát");
    } finally {
      setLoadingSongs(false);
    }
  };

  // Tải danh sách các Show diễn
  const fetchShows = async () => {
    setLoadingShows(true);
    try {
      const res = await api.get("/shows");
      // Chỉ lấy các show chưa hoàn thành hoặc chưa bị hủy, sắp xếp theo ngày gần nhất
      const activeShows = (res.data || [])
        .filter(s => s.status !== "cancelled")
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      setShows(activeShows);
    } catch (err) {
      toast.error("Lỗi tải danh sách show diễn");
    } finally {
      setLoadingShows(false);
    }
  };

  useEffect(() => {
    fetchSongs();
    fetchShows();
  }, []);

  // Khi chọn Show diễn trong Tab Planner
  const handleSelectShow = async (showId) => {
    setSelectedShowId(showId);
    if (!showId) {
      setSelectedShow(null);
      setPlannerSetlist([]);
      setShowNotes("");
      return;
    }

    setLoadingShowDetail(true);
    try {
      const res = await api.get(`/shows/${showId}`);
      setSelectedShow(res.data);
      setPlannerSetlist(res.data.setlist || []);
      setShowNotes(res.data.notes || "");
    } catch (err) {
      toast.error("Lỗi tải chi tiết Show diễn");
    } finally {
      setLoadingShowDetail(false);
    }
  };

  // --- LOGIC THỐNG KÊ (TAB 1) ---
  const totalSongs = songs.length;
  const songsWithSheet = songs.filter(s => s.sheetUrl).length;
  const songsWithBeat = songs.filter(s => s.beatUrl).length;

  const getMostPopularTone = () => {
    const tones = {};
    songs.forEach(s => {
      const textToSearch = `${s.title} ${s.name} ${s.note || ""}`;
      // Tìm các từ khóa tone nhạc phổ biến (Am, Dm, C, G, Em, F, Bm, C#m, F#m, Eb, vv)
      const matches = textToSearch.match(/\b[A-G](?:m|#m|b|#)?\b/gi);
      if (matches) {
        matches.forEach(m => {
          const clean = m.toUpperCase();
          tones[clean] = (tones[clean] || 0) + 1;
        });
      }
    });
    let maxTone = "Chưa rõ";
    let maxCount = 0;
    Object.keys(tones).forEach(t => {
      if (tones[t] > maxCount) {
        maxCount = tones[t];
        maxTone = t;
      }
    });
    return maxCount > 0 ? `${maxTone} (${maxCount} bài)` : "N/A";
  };

  // --- LỌC BÀI HÁT (TAB 1) ---
  const filteredSongs = songs.filter(s =>
    (s.title || s.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.note || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Nhóm theo chữ cái đầu
  const groupedSongs = filteredSongs.reduce((acc, song) => {
    let firstLetter = (song.title || song.name || "#").charAt(0).toUpperCase();
    if (!/[A-Z]/.test(firstLetter)) firstLetter = "#";
    
    if (!acc[firstLetter]) acc[firstLetter] = [];
    acc[firstLetter].push(song);
    return acc;
  }, {});

  // --- LỌC BÀI HÁT TRONG PLANNER (TAB 2) ---
  const filteredPlannerSongs = songs.filter(s =>
    (s.title || s.name || "").toLowerCase().includes(plannerSearchTerm.toLowerCase()) ||
    (s.note || "").toLowerCase().includes(plannerSearchTerm.toLowerCase())
  );

  // --- CÁC THAO TÁC TRÊN SETLIST (TAB 2) ---
  // Thêm bài hát vào Setlist
  const addSongToPlanner = (song) => {
    const alreadyExists = plannerSetlist.some(item => item.title === (song.title || song.name));
    if (alreadyExists) {
      toast.error("Bài hát này đã có trong Setlist!");
      return;
    }

    const newItem = {
      title: song.title || song.name,
      link: song.sheetUrl || song.beatUrl || "",
      note: song.note || "",
      _id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    setPlannerSetlist([...plannerSetlist, newItem]);
    toast.success(`Đã thêm: ${newItem.title}`);
  };

  // Xóa bài hát khỏi Setlist
  const removeSongFromPlanner = (id) => {
    setPlannerSetlist(plannerSetlist.filter(item => item._id !== id));
  };

  // Di chuyển bài hát lên
  const moveUp = (index) => {
    if (index === 0) return;
    const newList = [...plannerSetlist];
    const temp = newList[index];
    newList[index] = newList[index - 1];
    newList[index - 1] = temp;
    setPlannerSetlist(newList);
  };

  // Di chuyển bài hát xuống
  const moveDown = (index) => {
    if (index === plannerSetlist.length - 1) return;
    const newList = [...plannerSetlist];
    const temp = newList[index];
    newList[index] = newList[index + 1];
    newList[index + 1] = temp;
    setPlannerSetlist(newList);
  };

  // Thay đổi ghi chú riêng của bài hát trong Setlist
  const handleItemNoteChange = (index, newNote) => {
    const newList = [...plannerSetlist];
    newList[index].note = newNote;
    setPlannerSetlist(newList);
  };

  // Lưu Setlist và Ghi chú chung của Show vào CSDL
  const handleSaveSetlist = async () => {
    if (!selectedShowId) return;
    setSavingSetlist(true);
    try {
      // Gọi API cập nhật Show diễn (Setlist + Notes)
      await api.put(`/shows/${selectedShowId}`, {
        setlist: plannerSetlist.map(item => ({
          title: item.title,
          link: item.link,
          note: item.note
        })),
        notes: showNotes
      });
      toast.success("Đã lưu Setlist vào hệ thống thành công! 💾");
      // Cập nhật lại thông tin show cục bộ
      setSelectedShow(prev => ({
        ...prev,
        setlist: plannerSetlist,
        notes: showNotes
      }));
    } catch (err) {
      toast.error("Lỗi khi lưu Setlist");
    } finally {
      setSavingSetlist(false);
    }
  };

  // Sao chép nhanh Setlist định dạng Zalo
  const handleCopyToClipboard = () => {
    if (!selectedShow || plannerSetlist.length === 0) {
      toast.error("Không có gì để sao chép!");
      return;
    }

    const showDate = new Date(selectedShow.date).toLocaleDateString('vi-VN');
    let text = `🎸 SETLIST BIỂU DIỄN: ${selectedShow.title.toUpperCase()}\n`;
    text += `📅 Ngày diễn: ${showDate} - Giờ: ${selectedShow.time}\n`;
    text += `📍 Địa điểm: ${selectedShow.location}\n`;
    if (showNotes.trim()) {
      text += `📝 Ghi chú chung: ${showNotes.trim()}\n`;
    }
    text += `----------------------------------------\n`;
    
    plannerSetlist.forEach((item, index) => {
      text += `[${index + 1}] ${item.title} ${item.note ? `(${item.note})` : ""}\n`;
    });
    
    text += `----------------------------------------\n`;
    text += `👉 SẮC BAND - Chúc anh em diễn tốt!`;

    navigator.clipboard.writeText(text);
    toast.success("Đã sao chép setlist định dạng đẹp! 📋");
  };

  // In toàn bộ trang (tùy thuộc vào Tab đang chọn để áp dụng css)
  const handlePrint = () => {
    window.print();
  };

  // Xử lý link file beat/sheet tĩnh
  const getFileUrl = (path) => {
    if (!path) return "";
    if (path.startsWith('http')) return path;
    const cleanedPath = path.startsWith('/') ? path.substring(1) : path;
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const base = (hostname === 'localhost' || hostname === '127.0.0.1') 
      ? 'http://localhost:5000' 
      : 'https://band-manager-s9tm.onrender.com';
    return `${base}/${cleanedPath}`;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 pt-20 transition-colors duration-300 print:bg-white print:p-0">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER & TABS NAVIGATION (Hiden when printing) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 print:hidden">
          <div>
            <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
              <span className="bg-gradient-to-tr from-indigo-650 to-violet-650 text-white p-2.5 rounded-2xl shadow-lg shadow-indigo-500/10">
                <BookOpen size={26} />
              </span>
              DANH MỤC & SETLIST
            </h1>
            <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">Trình điều hành danh sách biểu diễn ban nhạc</p>
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto shadow-inner">
            <button
              onClick={() => setActiveTab("database")}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition ${
                activeTab === "database"
                  ? "bg-white text-indigo-650 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Layers size={14} /> Danh mục chính
            </button>
            <button
              onClick={() => setActiveTab("planner")}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition ${
                activeTab === "planner"
                  ? "bg-white text-indigo-650 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <ClipboardCheck size={14} /> Thiết lập Setlist
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: DANH MỤC BIỂU DIỄN CHÍNH */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "database" && (
          <div className="space-y-6">
            
            {/* THỐNG KÊ NHANH (Hidden when printing) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
              <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-sm flex items-center gap-4 hover:shadow-md transition">
                <div className="bg-indigo-50 text-indigo-650 p-3.5 rounded-2xl">
                  <Music size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tổng số bài</p>
                  <p className="text-xl font-black text-slate-850">{totalSongs}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-sm flex items-center gap-4 hover:shadow-md transition">
                <div className="bg-rose-50 text-rose-500 p-3.5 rounded-2xl">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Có Sheet nhạc</p>
                  <p className="text-xl font-black text-slate-850">{songsWithSheet}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-sm flex items-center gap-4 hover:shadow-md transition">
                <div className="bg-blue-50 text-blue-500 p-3.5 rounded-2xl">
                  <Disc size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Có File Beat</p>
                  <p className="text-xl font-black text-slate-850">{songsWithBeat}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-sm flex items-center gap-4 hover:shadow-md transition">
                <div className="bg-amber-50 text-amber-500 p-3.5 rounded-2xl">
                  <HelpCircle size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tone phổ biến nhất</p>
                  <p className="text-sm font-black text-slate-850 truncate max-w-[130px]" title={getMostPopularTone()}>{getMostPopularTone()}</p>
                </div>
              </div>
            </div>

            {/* CÔNG CỤ TÌM KIẾM & IN (Hidden when printing) */}
            <div className="flex flex-col md:flex-row gap-3 justify-between items-center bg-white p-4 rounded-3xl border border-slate-150 shadow-sm print:hidden">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-450" size={18} />
                <input
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 ring-indigo-500 outline-none text-slate-800 text-sm font-semibold transition"
                  placeholder="Tìm tên bài, tone, ghi chú..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                onClick={handlePrint} 
                className="w-full md:w-auto bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-sm transition transform active:scale-95 text-xs uppercase tracking-wider"
              >
                <Printer size={15}/> In Danh Mục Repertoire
              </button>
            </div>

            {/* BẢNG MENU IN RA / HIỂN THỊ */}
            <div className="bg-white rounded-[32px] shadow-lg border border-slate-100 p-8 md:p-12 print:shadow-none print:border-none print:p-0 print-card">
              
              {/* Header của Repertoire In */}
              <div className="text-center mb-10 border-b-2 border-slate-200 pb-8">
                <Music size={40} className="mx-auto text-indigo-600 mb-2"/>
                <h2 className="text-4xl font-black text-slate-900 uppercase tracking-widest print:text-black">SẮC BAND</h2>
                <p className="text-slate-500 font-bold tracking-widest mt-2 uppercase text-xs print:text-black">Official Repertoire</p>
              </div>

              {loadingSongs ? (
                 <div className="text-center py-20"><Loader className="animate-spin mx-auto text-indigo-600" size={32}/></div>
              ) : Object.keys(groupedSongs).length === 0 ? (
                <div className="text-center py-10 text-slate-400 italic">Không tìm thấy bài hát nào trong danh mục.</div>
              ) : (
                <div className="space-y-10">
                  {Object.keys(groupedSongs).sort().map(letter => (
                    <div key={letter} className="break-inside-avoid">
                      <div className="flex items-center gap-4 mb-4">
                        <h3 className="text-2xl font-black text-indigo-600">{letter}</h3>
                        <div className="h-px bg-slate-200 flex-1 print:bg-black"></div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3.5 print-grid">
                        {groupedSongs[letter].map(song => (
                          <div key={song._id} className="flex justify-between items-center group border-b border-slate-100 border-dashed pb-2.5">
                            <div className="flex items-center gap-2">
                              {/* Nút Nghe beat trực tiếp (Hidden when printing) */}
                              {song.beatUrl ? (
                                <button 
                                  onClick={() => playTrack(song.beatUrl, song.title || song.name)}
                                  className="text-slate-400 hover:text-indigo-650 p-1 rounded-lg hover:bg-slate-100 transition print:hidden"
                                  title="Nghe Beat thử"
                                >
                                  <PlayCircle size={15} className={currentTrack?.url?.includes(song.beatUrl) && isPlaying ? "text-indigo-600 animate-pulse" : ""} />
                                </button>
                              ) : (
                                <div className="w-5 h-5 print:hidden"></div>
                              )}
                              
                              <span className="font-bold text-slate-800 group-hover:text-indigo-650 transition print:text-black">
                                {song.title || song.name}
                              </span>

                              {/* Sheet Link icon (Hidden when printing) */}
                              {song.sheetUrl && (
                                <a 
                                  href={getFileUrl(song.sheetUrl)} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="text-slate-400 hover:text-rose-500 p-0.5 print:hidden transition"
                                  title="Xem Sheet PDF"
                                >
                                  <FileText size={12} />
                                </a>
                              )}
                            </div>

                            {song.note && (
                               <span className="text-xs text-slate-450 italic text-right ml-4 shrink-0 max-w-[40%] truncate font-bold print:text-black">
                                 {song.note}
                               </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer của Repertoire In */}
              <div className="hidden print:block text-center mt-12 pt-8 border-t border-slate-200 text-sm text-slate-500">
                <p className="font-bold">Liên hệ Booking Sắc Band: (+84) 9xx xxx xxx</p>
                <p className="italic text-xs mt-1">Danh sách cập nhật ngày {new Date().toLocaleDateString('vi-VN')}</p>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: INTERACTIVE SETLIST PLANNER */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "planner" && (
          <div className="space-y-6">
            
            {/* CHỌN SHOW DIỄN (Hidden when printing) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
              <div className="flex-1 w-full">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Chọn show diễn cần lên Setlist</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-800 text-sm focus:bg-white focus:ring-2 ring-indigo-500 outline-none transition appearance-none cursor-pointer"
                    value={selectedShowId}
                    onChange={e => handleSelectShow(e.target.value)}
                    disabled={loadingShows}
                  >
                    <option value="">-- Chọn một Show diễn hoạt động --</option>
                    {shows.map(show => (
                      <option key={show._id} value={show._id}>
                        {show.title} ({new Date(show.date).toLocaleDateString('vi-VN')} - {show.customerName})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <ChevronRight size={16} className="rotate-90" />
                  </div>
                </div>
              </div>

              {selectedShow && (
                <div className="flex gap-2 w-full md:w-auto shrink-0 md:mt-5">
                  <button
                    onClick={handleCopyToClipboard}
                    className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition"
                    title="Sao chép Zalo"
                  >
                    <Copy size={15} /> Sao chép Zalo
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition"
                    title="In Setlist stage"
                  >
                    <Printer size={15} /> In Stage Sheet
                  </button>
                </div>
              )}
            </div>

            {/* NẾU CHƯA CHỌN SHOW */}
            {!selectedShowId && (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-150 shadow-sm print:hidden">
                <div className="bg-indigo-50 text-indigo-650 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ClipboardCheck size={32} />
                </div>
                <h3 className="text-slate-800 font-black text-lg">Chưa chọn Show diễn</h3>
                <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">Vui lòng chọn một Show diễn từ danh sách phía trên để bắt đầu soạn bài, sắp xếp thứ tự và viết ghi chú sân khấu.</p>
              </div>
            )}

            {/* PANEL CHÍNH LÊN SETLIST (Dual column layout) */}
            {selectedShowId && selectedShow && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* CỘT TRÁI: DANH SÁCH BÀI HÁT KHO NHẠC (Hidden when printing) */}
                <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-150 shadow-sm space-y-4 print:hidden">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="font-black text-slate-850 flex items-center gap-2">
                      <Layers size={18} className="text-indigo-600" /> Chọn từ Kho Nhạc
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Click dấu cộng để thêm bài vào setlist</p>
                  </div>

                  {/* Tìm kiếm bài bên planner */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none text-slate-800 text-xs font-semibold transition"
                      placeholder="Tìm bài hát..."
                      value={plannerSearchTerm}
                      onChange={e => setPlannerSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
                    {filteredPlannerSongs.length === 0 ? (
                      <p className="text-center py-8 text-xs text-slate-450 italic">Không tìm thấy bài hát</p>
                    ) : (
                      filteredPlannerSongs.map(song => {
                        const inSetlist = plannerSetlist.some(item => item.title === (song.title || song.name));
                        return (
                          <div 
                            key={song._id} 
                            className={`flex justify-between items-center p-3 rounded-xl border transition ${
                              inSetlist 
                                ? 'bg-indigo-50/45 border-indigo-100 text-indigo-700' 
                                : 'bg-slate-50/50 hover:bg-slate-50 border-slate-100 text-slate-800'
                            }`}
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <p className="font-bold text-xs truncate">{song.title || song.name}</p>
                              {song.note && <p className="text-[10px] text-slate-400 truncate italic">{song.note}</p>}
                            </div>
                            <button
                              onClick={() => addSongToPlanner(song)}
                              disabled={inSetlist}
                              className={`p-1.5 rounded-lg transition ${
                                inSetlist 
                                  ? 'text-indigo-500 bg-indigo-50' 
                                  : 'text-slate-550 hover:text-white bg-white hover:bg-indigo-600 border border-slate-200 hover:border-indigo-600'
                              }`}
                              title="Thêm bài"
                            >
                              {inSetlist ? <Check size={14} /> : <Plus size={14} />}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* CỘT PHẢI: SETLIST PLANNER CỦA SHOW */}
                <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-150 shadow-sm p-6 md:p-8 space-y-6 print:border-none print:shadow-none print:p-0 print-card">
                  
                  {/* Tiêu đề Show In */}
                  <div className="border-b border-slate-200 pb-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                      <div>
                        <span className="bg-indigo-100 text-indigo-650 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider print:hidden">Setlist thiết lập</span>
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-wide mt-1.5">{selectedShow.title}</h2>
                      </div>
                      <div className="text-slate-500 text-xs font-bold space-y-0.5 print:text-black">
                        <div className="flex items-center gap-1.5"><Calendar size={13}/>{new Date(selectedShow.date).toLocaleDateString('vi-VN')} - {selectedShow.time}</div>
                        <div className="flex items-center gap-1.5"><MapPin size={13}/>{selectedShow.location}</div>
                      </div>
                    </div>
                  </div>

                  {/* DANH SÁCH BÀI LÊN LỊCH */}
                  {plannerSetlist.length === 0 ? (
                    <div className="text-center py-20 text-slate-400 italic">Setlist trống. Hãy bấm thêm bài hát từ Kho nhạc bên trái.</div>
                  ) : (
                    <div className="space-y-3">
                      {plannerSetlist.map((item, index) => (
                        <div key={item._id} className="flex flex-col md:flex-row md:items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 print:bg-white print:border-b print:border-slate-100 print:rounded-none print:p-2 print:pb-3">
                          
                          <div className="flex items-center justify-between flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-650 flex items-center justify-center font-black text-xs print:bg-black print:text-white">
                                {index + 1}
                              </span>
                              <span className="font-extrabold text-sm text-slate-800 print:text-black">{item.title}</span>
                            </div>

                            {/* Các nút điều khiển di chuyển & xóa (Hidden when printing) */}
                            <div className="flex items-center gap-1 print:hidden">
                              <button onClick={() => moveUp(index)} disabled={index === 0} className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30">
                                <ArrowUp size={14} />
                              </button>
                              <button onClick={() => moveDown(index)} disabled={index === plannerSetlist.length - 1} className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30">
                                <ArrowDown size={14} />
                              </button>
                              <button onClick={() => removeSongFromPlanner(item._id)} className="p-1 text-slate-400 hover:text-rose-500 ml-1">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Ô viết Ghi chú cụ thể trong show */}
                          <div className="w-full md:w-48 shrink-0 flex items-center">
                            <input
                              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-slate-700 outline-none focus:ring-1 ring-indigo-500 transition print:border-none print:bg-transparent print:p-0 print:italic print:text-slate-650 print:text-right"
                              placeholder="Ghi chú (Tone, Singer...)"
                              value={item.note || ""}
                              onChange={e => handleItemNoteChange(index, e.target.value)}
                            />
                          </div>

                        </div>
                      ))}
                    </div>
                  )}

                  {/* GHI CHÚ CHUNG */}
                  <div className="space-y-2 pt-4 border-t border-slate-100">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest print:text-black">Ghi chú chung của show diễn (Trang phục, giờ giấc...)</label>
                    <textarea
                      rows={3}
                      className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 ring-indigo-500 outline-none font-semibold text-slate-750 text-xs transition bg-slate-50/50 focus:bg-white print:border-none print:bg-transparent print:p-0 print:text-black print:italic"
                      placeholder="Nhập ghi chú chung cho show diễn ở đây..."
                      value={showNotes}
                      onChange={e => setShowNotes(e.target.value)}
                    />
                  </div>

                  {/* NÚT LƯU THAY ĐỔI (Hidden when printing) */}
                  <div className="pt-4 flex justify-end print:hidden">
                    <button
                      onClick={handleSaveSetlist}
                      disabled={savingSetlist}
                      className="w-full md:w-auto bg-indigo-650 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 transition transform active:scale-95 text-xs uppercase tracking-wider"
                    >
                      {savingSetlist ? (
                        <>
                          <Loader className="animate-spin" size={16} /> Đang lưu...
                        </>
                      ) : (
                        <>
                          <Save size={16} /> Lưu Setlist Biểu Diễn
                        </>
                      )}
                    </button>
                  </div>

                  {/* Footer của Setlist In */}
                  <div className="hidden print:block text-center mt-12 pt-8 border-t border-slate-200 text-sm text-slate-500">
                    <p className="font-bold">SẮC BAND - LIVE PERFORMANCE SETLIST</p>
                    <p className="italic text-xs mt-1">Lập danh sách ngày {new Date().toLocaleDateString('vi-VN')}</p>
                  </div>

                </div>

              </div>
            )}

          </div>
        )}

      </div>

      {/* Style CSS ẩn Navbar/Footer khi in và buộc grid/layout in đẹp */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            padding: 0 !important;
          }
          nav, footer, .print-hidden {
            display: none !important;
          }
          .print-card {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            background: transparent !important;
          }
          .print-grid {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            column-gap: 2.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Repertoire;