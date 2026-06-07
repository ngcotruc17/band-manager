"use client";
 
import React, { useState, useEffect, useContext } from "react";
import api from '../../services/api';
import { AuthContext } from "../../context/AuthContext";
import { AudioContext } from "../../context/AudioContext";
import { 
  Music, UploadCloud, Trash2, Search, FileText, PlayCircle, Plus, X, Headphones, Loader,
  BookOpen, Printer, Layers, Disc, HelpCircle, ClipboardCheck, ArrowUp, ArrowDown, Copy, Save, ChevronRight,
  Calendar, Check
} from "lucide-react";
import toast from "react-hot-toast";

interface Song {
  _id: string;
  title: string;
  name: string;
  note?: string;
  sheetUrl?: string;
  beatUrl?: string;
}

interface Show {
  _id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  customerName?: string;
  price: number;
  status: string;
  notes?: string;
  setlist?: {
    title: string;
    link?: string;
    note?: string;
    _id?: string;
  }[];
}

export default function SongLibraryAndRepertoire() {
  const { user } = useContext(AuthContext);
  const { playTrack, currentTrack, isPlaying } = useContext(AudioContext);
  
  // Tab điều khiển chính: "library" (Kho beat/sheet) | "repertoire" (Danh mục & Planner)
  const [subTab, setSubTab] = useState<"library" | "repertoire">("library");

  // ==========================================
  // STATES & FUNCTIONS CHO KHO BEAT & SHEET
  // ==========================================
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({ title: "", note: "" });
  const [uploadFiles, setUploadFiles] = useState<{ sheet: File | null; beat: File | null }>({ sheet: null, beat: null });
  const [uploadLoading, setUploadLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  const fetchSongs = async () => {
    try {
      const res = await api.get("/library");
      const sortedSongs = (res.data || []).sort((a: Song, b: Song) => {
        const titleA = (a.title || a.name || "").toUpperCase();
        const titleB = (b.title || b.name || "").toUpperCase();
        return titleA.localeCompare(titleB);
      });
      setSongs(sortedSongs);
    } catch (err) { 
      toast.error("Không tải được danh sách nhạc"); 
    } finally { 
      setFetchLoading(false); 
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFormData.title) return toast.error("Vui lòng nhập tên bài hát");
    setUploadLoading(true);
    const postData = new FormData();
    postData.append("title", uploadFormData.title);
    postData.append("note", uploadFormData.note);
    if (uploadFiles.sheet) postData.append("sheet", uploadFiles.sheet);
    if (uploadFiles.beat) postData.append("beat", uploadFiles.beat);

    try {
      await api.post("/library", postData, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Đã thêm bài hát vào kho! 🎵");
      setUploadFormData({ title: "", note: "" });
      setUploadFiles({ sheet: null, beat: null });
      setShowUploadModal(false);
      fetchSongs();
    } catch (err) { 
      toast.error("Lỗi upload bài hát"); 
    } finally { 
      setUploadLoading(false); 
    }
  };

  const handleDeleteSong = async (id: string) => {
    if (!window.confirm("Bạn muốn xóa bài này khỏi kho?")) return;
    try {
      await api.delete(`/library/${id}`);
      toast.success("Đã xóa");
      fetchSongs();
    } catch (err) { 
      toast.error("Lỗi khi xóa"); 
    }
  };

  // ==========================================
  // STATES & FUNCTIONS CHO REPERTOIRE & PLANNER
  // ==========================================
  const [repertoireTab, setRepertoireTab] = useState<"catalog" | "planner">("catalog");
  const [shows, setShows] = useState<Show[]>([]);
  const [loadingShows, setLoadingShows] = useState(false);
  const [selectedShowId, setSelectedShowId] = useState("");
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [loadingShowDetail, setLoadingShowDetail] = useState(false);
  const [plannerSetlist, setPlannerSetlist] = useState<any[]>([]);
  const [showNotes, setShowNotes] = useState("");
  const [savingSetlist, setSavingSetlist] = useState(false);
  const [plannerSearchTerm, setPlannerSearchTerm] = useState("");

  const fetchShows = async () => {
    if (user?.role !== "admin") return;
    setLoadingShows(true);
    try {
      const res = await api.get("/shows");
      const activeShows = (res.data || [])
        .filter((s: Show) => s.status !== "cancelled")
        .sort((a: Show, b: Show) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setShows(activeShows);
    } catch (err) {
      toast.error("Lỗi tải danh sách show diễn");
    } finally {
      setLoadingShows(false);
    }
  };

  const handleSelectShow = async (showId: string) => {
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
      const dbSetlist = res.data.setlist || [];
      const formattedSetlist = dbSetlist.map((item: any) => ({
        ...item,
        _id: item._id || `temp_${Math.random().toString(36).substring(2, 11)}`
      }));
      setPlannerSetlist(formattedSetlist);
      setShowNotes(res.data.notes || "");
    } catch (err) {
      toast.error("Lỗi tải chi tiết Show diễn");
    } finally {
      setLoadingShowDetail(false);
    }
  };

  const addSongToPlanner = (song: Song) => {
    const alreadyExists = plannerSetlist.some(item => item.title === song.title);
    if (alreadyExists) {
      toast.error("Bài hát này đã có trong Setlist!");
      return;
    }

    const newItem = {
      title: song.title,
      link: song.sheetUrl || song.beatUrl || "",
      note: song.note || "",
      _id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    };

    setPlannerSetlist([...plannerSetlist, newItem]);
    toast.success(`Đã thêm: ${newItem.title}`);
  };

  const removeSongFromPlanner = (id: string) => {
    setPlannerSetlist(plannerSetlist.filter(item => item._id !== id));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newList = [...plannerSetlist];
    const temp = newList[index];
    newList[index] = newList[index - 1];
    newList[index - 1] = temp;
    setPlannerSetlist(newList);
  };

  const moveDown = (index: number) => {
    if (index === plannerSetlist.length - 1) return;
    const newList = [...plannerSetlist];
    const temp = newList[index];
    newList[index] = newList[index + 1];
    newList[index + 1] = temp;
    setPlannerSetlist(newList);
  };

  const handleItemNoteChange = (index: number, newNote: string) => {
    const newList = [...plannerSetlist];
    newList[index].note = newNote;
    setPlannerSetlist(newList);
  };

  const handleSaveSetlist = async () => {
    if (!selectedShowId) return;
    setSavingSetlist(true);
    try {
      await api.put(`/shows/${selectedShowId}`, {
        setlist: plannerSetlist.map(item => ({
          title: item.title,
          link: item.link,
          note: item.note
        })),
        notes: showNotes
      });
      toast.success("Đã lưu Setlist vào hệ thống thành công! 💾");
      if (selectedShow) {
        setSelectedShow({
          ...selectedShow,
          setlist: plannerSetlist,
          notes: showNotes
        });
      }
    } catch (err) {
      toast.error("Lỗi khi lưu Setlist");
    } finally {
      setSavingSetlist(false);
    }
  };

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
    toast.success("Đã sao chép setlist định dạng Zalo! 📋");
  };

  // Nạp dữ liệu ban đầu
  useEffect(() => {
    fetchSongs();
    fetchShows();
  }, [user]);

  // Bộ lọc cho Kho Beat/Sheet (Tab 1)
  const filteredSongs = songs.filter(s =>
    (s.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.note || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Bộ lọc cho Catalog Repertoire Alphabet (Tab 2 - Catalog)
  const groupedSongs = filteredSongs.reduce<Record<string, Song[]>>((acc, song) => {
    let firstLetter = (song.title || "#").charAt(0).toUpperCase();
    if (!/[A-Z]/.test(firstLetter)) firstLetter = "#";
    
    if (!acc[firstLetter]) acc[firstLetter] = [];
    acc[firstLetter].push(song);
    return acc;
  }, {});

  // Bộ lọc cho Planner Song list (Tab 2 - Planner)
  const filteredPlannerSongs = songs.filter(s =>
    (s.title || "").toLowerCase().includes(plannerSearchTerm.toLowerCase()) ||
    (s.note || "").toLowerCase().includes(plannerSearchTerm.toLowerCase())
  );

  // Thống kê Repertoire
  const totalSongs = songs.length;
  const songsWithSheet = songs.filter(s => s.sheetUrl).length;
  const songsWithBeat = songs.filter(s => s.beatUrl).length;

  const getMostPopularTone = () => {
    const tones: Record<string, number> = {};
    songs.forEach(s => {
      const textToSearch = `${s.title} ${s.note || ""}`;
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

  const getFileUrl = (filePath: string) => {
    if (!filePath) return "";
    if (filePath.startsWith('http')) return filePath;
    const cleanedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const base = (hostname === 'localhost' || hostname === '127.0.0.1') 
      ? 'http://localhost:5000' 
      : 'https://band-manager-s9tm.onrender.com';
    return `${base}/${cleanedPath}`;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-10 print:bg-white print:p-0">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER HỆ THỐNG */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-slate-200/60 pb-6 print:hidden">
          <div>
            <h1 className="text-3xl font-black text-slate-850 flex items-center gap-3">
              <span className="bg-gradient-to-tr from-blue-650 to-indigo-650 text-white p-2.5 rounded-2xl shadow-lg shadow-indigo-500/10">
                <Music size={26} />
              </span>
              THƯ VIỆN & DANH MỤC BÀI HÁT
            </h1>
            <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">
              Tài nguyên beat/sheet biểu diễn và danh mục bài hát chính thức
            </p>
          </div>

          {/* SubTab Chọn Phân Hệ */}
          <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200/40 flex shadow-sm w-full md:w-auto shrink-0">
            <button
              onClick={() => setSubTab("library")}
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition ${
                subTab === "library" ? "bg-white text-indigo-650 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Kho Beat & Sheet
            </button>
            <button
              onClick={() => setSubTab("repertoire")}
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition ${
                subTab === "repertoire" ? "bg-white text-indigo-650 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Danh Mục Repertoire
            </button>
          </div>
        </div>

        {subTab === "library" && (
          <div className="space-y-8 animate-fade-in print:hidden">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tài nguyên beat & sheet phục vụ tập luyện</span>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white shadow-sm focus:ring-2 ring-indigo-500 outline-none text-slate-800 font-semibold transition text-sm"
                    placeholder="Tìm bài hát, tone, điệu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                {user?.role === "admin" && (
                  <button onClick={() => setShowUploadModal(true)} className="bg-slate-900 hover:bg-black text-white px-5 py-3.5 rounded-2xl font-bold shadow-lg transition flex items-center gap-2 whitespace-nowrap active:scale-[0.98] text-xs uppercase tracking-wider">
                    <Plus size={18} /> <span>Thêm Bài Mới</span>
                  </button>
                )}
              </div>
            </div>

            {fetchLoading ? (
              <div className="text-center py-20"><Loader className="animate-spin mx-auto text-indigo-600" size={32}/></div>
            ) : filteredSongs.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                <div className="bg-slate-100/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200">
                  <Music size={36} className="text-slate-350" />
                </div>
                <h3 className="text-slate-450 font-bold text-sm">Không tìm thấy bài hát nào trong kho</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredSongs.map((song) => (
                  <div key={song._id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition">
                    <div className="p-6 flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl border border-indigo-100/20">
                          <Headphones size={22} />
                        </div>
                        {user?.role === "admin" && (
                          <button onClick={() => handleDeleteSong(song._id)} className="text-slate-350 hover:text-rose-500 transition p-2 rounded-full hover:bg-rose-50 border border-transparent">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      <h3 className="font-extrabold text-slate-800 text-base line-clamp-2 leading-snug mb-1.5 hover:text-indigo-650 transition">
                        {song.title || song.name}
                      </h3>
                      <p className="text-xs text-slate-400 font-bold italic line-clamp-1">
                        {song.note || "Không có ghi chú"}
                      </p>
                    </div>

                    <div className="bg-slate-50/50 p-5 border-t border-slate-150 flex flex-col gap-3">
                      {song.sheetUrl ? (
                        <a
                          href={getFileUrl(song.sheetUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:border-indigo-550 hover:text-indigo-600 transition shadow-sm"
                        >
                          <FileText size={15} className="text-rose-500" /> Xem Sheet Nhạc
                        </a>
                      ) : (
                        <div className="text-center text-[10px] font-bold text-slate-400 py-2.5 bg-slate-100/60 rounded-xl uppercase tracking-widest border border-slate-200">Không có Sheet</div>
                      )}

                      {song.beatUrl ? (
                        <button 
                          onClick={() => playTrack(song.beatUrl || "", song.title || song.name)}
                          className="flex justify-between items-center bg-slate-900 text-white p-3 rounded-xl shadow-md hover:bg-black transition group"
                        >
                          <div className="flex items-center gap-2">
                            <PlayCircle size={16} className="text-indigo-400 group-hover:scale-110 transition" />
                            <span className="text-xs font-black uppercase tracking-widest">Nghe Beat</span>
                          </div>
                          {currentTrack?.url?.includes(song.beatUrl || "") && isPlaying && (
                             <div className="flex items-end gap-0.5 h-3 px-1">
                               <div className="w-[2px] bg-indigo-400 h-full origin-bottom animate-[bounce_0.75s_infinite_ease-in-out] rounded-sm"></div>
                               <div className="w-[2px] bg-indigo-400 h-2 origin-bottom animate-[bounce_0.65s_infinite_ease-in-out] rounded-sm"></div>
                               <div className="w-[2px] bg-indigo-400 h-3 origin-bottom animate-[bounce_0.85s_infinite_ease-in-out] rounded-sm"></div>
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
        )}

        {subTab === "repertoire" && (
          <div className="space-y-6 animate-fade-in">
            {/* Thanh điều hướng Repertoire subTab */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
              <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200 w-full md:w-auto">
                <button
                  onClick={() => setRepertoireTab("catalog")}
                  className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wide transition ${
                    repertoireTab === "catalog" ? "bg-white text-indigo-650 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Layers size={14} /> Tra cứu mục lục
                </button>
                {user?.role === "admin" && (
                  <button
                    onClick={() => setRepertoireTab("planner")}
                    className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wide transition ${
                      repertoireTab === "planner" ? "bg-white text-indigo-650 shadow-sm" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <ClipboardCheck size={14} /> Soạn Setlist Show
                  </button>
                )}
              </div>

              {repertoireTab === "catalog" && (
                <button 
                  onClick={() => window.print()} 
                  className="w-full md:w-auto bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-sm transition transform active:scale-95 text-xs uppercase tracking-wider print:hidden"
                >
                  <Printer size={15}/> In Bản Repertoire
                </button>
              )}
            </div>

            {/* PHÂN HỆ CATALOG TRA CỨU */}
            {repertoireTab === "catalog" && (
              <div className="space-y-6">
                
                {/* Thống kê nhanh */}
                <div className="grid grid-cols-3 gap-6 print:hidden">
                  <div className="bg-white p-5 rounded-3xl border border-slate-200/50 shadow-sm flex items-center gap-4 hover:shadow-md transition">
                    <div className="bg-indigo-50 text-indigo-650 p-3 rounded-2xl"><Music size={18} /></div>
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Mục lục bài</p>
                      <p className="text-lg font-black text-slate-850">{totalSongs}</p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-200/50 shadow-sm flex items-center gap-4 hover:shadow-md transition">
                    <div className="bg-rose-50 text-rose-505 p-3 rounded-2xl"><FileText size={18} /></div>
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Có Sheet nhạc</p>
                      <p className="text-lg font-black text-slate-850">{songsWithSheet}</p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-200/50 shadow-sm flex items-center gap-4 hover:shadow-md transition">
                    <div className="bg-amber-50 text-amber-505 p-3 rounded-2xl"><HelpCircle size={18} /></div>
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Tone chủ đạo</p>
                      <p className="text-xs font-black text-slate-850 truncate max-w-[140px]">{getMostPopularTone()}</p>
                    </div>
                  </div>
                </div>

                {/* Bản in Repertoire */}
                <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 p-8 md:p-12 print:shadow-none print:border-none print:p-0">
                  <div className="text-center mb-8 border-b-2 border-slate-200 pb-6">
                    <Music size={36} className="mx-auto text-indigo-600 mb-2"/>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-widest print:text-black">SẮC BAND</h2>
                    <p className="text-slate-500 font-bold tracking-widest mt-1 uppercase text-xs print:text-black">Official Repertoire</p>
                  </div>

                  {fetchLoading ? (
                    <div className="text-center py-20"><Loader className="animate-spin mx-auto text-indigo-650" size={32}/></div>
                  ) : Object.keys(groupedSongs).length === 0 ? (
                    <div className="text-center py-10 text-slate-400 italic">Không có bài hát trong danh mục.</div>
                  ) : (
                    <div className="space-y-8">
                      {Object.keys(groupedSongs).sort().map(letter => (
                        <div key={letter} className="break-inside-avoid">
                          <div className="flex items-center gap-4 mb-3">
                            <h3 className="text-xl font-black text-indigo-600">{letter}</h3>
                            <div className="h-px bg-slate-200 flex-1"></div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 print-grid">
                            {groupedSongs[letter].map(song => (
                              <div key={song._id} className="flex justify-between items-center group border-b border-slate-100 border-dashed pb-2">
                                <div className="flex items-center gap-2">
                                  {song.beatUrl ? (
                                    <button 
                                      onClick={() => playTrack(song.beatUrl || "", song.title || song.name)}
                                      className="text-slate-400 hover:text-indigo-650 p-1 rounded-lg hover:bg-slate-100 transition print:hidden animate-fade-in"
                                    >
                                      <PlayCircle size={15} className={currentTrack?.url?.includes(song.beatUrl || "") && isPlaying ? "text-indigo-600 animate-pulse" : ""} />
                                    </button>
                                  ) : (
                                    <div className="w-5 h-5 print:hidden"></div>
                                  )}
                                  
                                  <span className="font-bold text-slate-805 print:text-black">
                                    {song.title || song.name}
                                  </span>

                                  {song.sheetUrl && (
                                    <a href={getFileUrl(song.sheetUrl)} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-rose-505 p-0.5 print:hidden transition">
                                      <FileText size={12} />
                                    </a>
                                  )}
                                </div>
                                {song.note && <span className="text-xs text-slate-450 italic font-bold">{song.note}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PHÂN HỆ PLANNER SOẠN SETLIST (CHỈ ADMIN THẤY) */}
            {repertoireTab === "planner" && user?.role === "admin" && (
              <div className="space-y-6">
                
                {/* Chọn Show Diễn */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/50 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden animate-fade-in">
                  <div className="flex-1 w-full">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Chọn show diễn cần lên Setlist</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-450" size={18} />
                      <select
                        className="w-full pl-10 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-800 text-xs focus:bg-white focus:ring-2 ring-indigo-500 outline-none transition appearance-none cursor-pointer"
                        value={selectedShowId}
                        onChange={e => handleSelectShow(e.target.value)}
                        disabled={loadingShows}
                      >
                        <option value="">-- Chọn một Show diễn hoạt động --</option>
                        {shows.map(show => (
                          <option key={show._id} value={show._id}>
                            {show.title} ({new Date(show.date).toLocaleDateString('vi-VN')} - {show.customerName || "Khách hàng"})
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
                      <button onClick={handleCopyToClipboard} className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition">
                        <Copy size={15} /> Sao chép Zalo
                      </button>
                      <button onClick={() => window.print()} className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white px-5 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition">
                        <Printer size={15} /> In Stage Sheet
                      </button>
                    </div>
                  )}
                </div>

                {!selectedShowId && (
                  <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/50 shadow-sm print:hidden">
                    <div className="bg-indigo-50 text-indigo-650 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-100/30">
                      <ClipboardCheck size={32} />
                    </div>
                    <h3 className="text-slate-800 font-black text-lg">Chưa chọn Show diễn</h3>
                    <p className="text-slate-450 text-xs mt-1 max-w-sm mx-auto">Vui lòng chọn một Show diễn ở mục trên để bắt đầu lập Setlist bài hát.</p>
                  </div>
                )}

                {selectedShowId && selectedShow && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
                    
                    {/* Cột trái chọn bài */}
                    <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 print:hidden">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="font-black text-slate-850 flex items-center gap-2">
                          <Layers size={18} className="text-indigo-600" /> Chọn từ Kho Nhạc
                        </h3>
                      </div>

                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-405" size={16} />
                        <input
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none text-slate-800 text-xs font-semibold transition"
                          placeholder="Tìm bài hát..."
                          value={plannerSearchTerm}
                          onChange={e => setPlannerSearchTerm(e.target.value)}
                        />
                      </div>

                      <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
                        {filteredPlannerSongs.map(song => {
                          const inSetlist = plannerSetlist.some(item => item.title === song.title);
                          return (
                            <div key={song._id} className={`flex justify-between items-center p-3 rounded-xl border transition ${inSetlist ? 'bg-indigo-50/50 border-indigo-100 text-indigo-700 font-bold' : 'bg-slate-50/50 hover:bg-slate-50 border-slate-100 text-slate-800'}`}>
                              <div className="flex-1 min-w-0 pr-2">
                                <p className="font-bold text-xs truncate">{song.title}</p>
                                {song.note && <p className="text-[10px] text-slate-400 truncate italic">{song.note}</p>}
                              </div>
                              <button onClick={() => addSongToPlanner(song)} disabled={inSetlist} className={`p-1.5 rounded-lg transition ${inSetlist ? 'text-indigo-500 bg-indigo-50' : 'text-slate-500 hover:text-white bg-white hover:bg-indigo-650 border border-slate-200 shadow-sm'}`}>
                                {inSetlist ? <Check size={14} /> : <Plus size={14} />}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Cột phải Setlist */}
                    <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6 print:border-none print:shadow-none print:p-0">
                      <div className="border-b border-slate-200 pb-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                          <div>
                            <span className="bg-indigo-50 text-indigo-650 border border-indigo-100/50 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider print:hidden">Setlist của show</span>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-wide mt-1">{selectedShow.title}</h2>
                          </div>
                        </div>
                      </div>

                      {loadingShowDetail ? (
                        <div className="text-center py-10"><Loader className="animate-spin mx-auto text-indigo-650" size={32}/></div>
                      ) : (
                        <>
                          {plannerSetlist.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 italic">Setlist trống. Hãy thêm bài hát từ Kho bên trái.</div>
                          ) : (
                            <div className="space-y-2.5">
                              {plannerSetlist.map((item, index) => (
                                <div key={item._id} className="flex flex-col md:flex-row md:items-center gap-3 p-3 bg-slate-50/50 border border-slate-100 rounded-2xl print:bg-white print:border-b print:rounded-none">
                                  <div className="flex items-center justify-between flex-1 min-w-0">
                                    <div className="flex items-center gap-2.5">
                                      <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-650 border border-indigo-100/30 flex items-center justify-center font-black text-xs print:bg-black print:text-white">{index + 1}</span>
                                      <span className="font-extrabold text-sm text-slate-800 print:text-black">{item.title}</span>
                                    </div>
                                    <div className="flex items-center gap-1 print:hidden">
                                      <button onClick={() => moveUp(index)} disabled={index === 0} className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"><ArrowUp size={14} /></button>
                                      <button onClick={() => moveDown(index)} disabled={index === plannerSetlist.length - 1} className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"><ArrowDown size={14} /></button>
                                      <button onClick={() => removeSongFromPlanner(item._id)} className="p-1 text-slate-400 hover:text-rose-505 ml-1"><Trash2 size={14} /></button>
                                    </div>
                                  </div>
                                  <div className="w-full md:w-48 shrink-0">
                                    <input
                                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-slate-700 outline-none focus:ring-1 ring-indigo-500 transition shadow-sm focus:bg-white"
                                      placeholder="Ghi chú tone, ca sĩ..."
                                      value={item.note || ""}
                                      onChange={e => handleItemNoteChange(index, e.target.value)}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="space-y-2 pt-4 border-t border-slate-100">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ghi chú chung của show diễn (trang phục, lưu ý...)</label>
                            <textarea
                              rows={2}
                              className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 ring-indigo-500/20 outline-none font-semibold text-slate-750 text-xs transition bg-slate-50 focus:bg-white"
                              value={showNotes}
                              onChange={e => setShowNotes(e.target.value)}
                            />
                          </div>

                          <div className="pt-4 flex justify-end print:hidden">
                            <button onClick={handleSaveSetlist} disabled={savingSetlist} className="w-full md:w-auto bg-indigo-650 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg transition active:scale-95 text-xs uppercase tracking-wider">
                              {savingSetlist ? <Loader className="animate-spin" size={16} /> : <><Save size={16} /> Lưu Setlist</>}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL UPLOAD SONGS */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-lg text-slate-850 flex items-center gap-2">
                <UploadCloud className="text-indigo-650" size={24} /> Tải lên Kho Nhạc
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-rose-505 bg-white p-2 rounded-full transition shadow-sm border border-slate-100">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-405 uppercase tracking-widest">Tên bài hát *</label>
                <input
                  required
                  className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-1 ring-indigo-500 outline-none bg-slate-50 font-bold text-slate-800 text-xs transition focus:bg-white"
                  placeholder="VD: Cắt đôi nỗi sầu..."
                  value={uploadFormData.title}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, title: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-405 uppercase tracking-widest">Ghi chú (Tone / Điệu)</label>
                <input
                  className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-1 ring-indigo-500 outline-none bg-slate-50 font-medium text-slate-700 text-xs transition focus:bg-white"
                  placeholder="VD: Tone Am - Disco"
                  value={uploadFormData.note}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, note: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative group cursor-pointer">
                  <div className={`p-4 border-2 border-dashed rounded-2xl transition text-center ${uploadFiles.sheet ? 'bg-rose-50 border-rose-250 text-rose-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                    <FileText className={`mx-auto mb-1.5 ${uploadFiles.sheet ? 'text-rose-500' : 'text-slate-400'}`} size={24} />
                    <span className="text-[9px] font-black uppercase tracking-tighter block truncate">
                      {uploadFiles.sheet ? uploadFiles.sheet.name : "Chọn file PDF"}
                    </span>
                  </div>
                  <input type="file" accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files && setUploadFiles({ ...uploadFiles, sheet: e.target.files[0] })} />
                </div>

                <div className="relative group cursor-pointer">
                  <div className={`p-4 border-2 border-dashed rounded-2xl transition text-center ${uploadFiles.beat ? 'bg-indigo-50 border-indigo-250 text-indigo-650' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                    <Music className={`mx-auto mb-1.5 ${uploadFiles.beat ? 'text-indigo-500' : 'text-slate-400'}`} size={24} />
                    <span className="text-[9px] font-black uppercase tracking-tighter block truncate">
                      {uploadFiles.beat ? uploadFiles.beat.name : "Chọn file MP3"}
                    </span>
                  </div>
                  <input type="file" accept="audio/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files && setUploadFiles({ ...uploadFiles, beat: e.target.files[0] })} />
                </div>
              </div>

              <button disabled={uploadLoading} className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-2xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 text-xs uppercase tracking-wider">
                {uploadLoading ? "Đang xử lý..." : <><UploadCloud size={16} /> LƯU VÀO KHO</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Style CSS in ấn */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            padding: 0 !important;
          }
          nav, footer, .print-hidden, .print-hidden * {
            display: none !important;
          }
          .print-grid {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            column-gap: 2rem !important;
          }
        }
      `}</style>
    </div>
  );
}
