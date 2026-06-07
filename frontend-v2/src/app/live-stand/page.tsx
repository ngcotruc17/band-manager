"use client";
 
import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import api from "../../services/api";
import { 
  Music, Play, Pause, RefreshCw, Volume2, 
  Users, Lock, Unlock, FileText, ChevronRight, 
  ChevronLeft, Sliders, Radio, Activity,
  Loader, ArrowUp, ArrowDown, RadioTower, HelpCircle
} from "lucide-react";
import toast from "react-hot-toast";
 
interface Song {
  title: string;
  note: string;
  sheetUrl?: string;
  beatUrl?: string;
}
 
interface ShowItem {
  _id: string;
  title: string;
  date: string;
  location: string;
  status: string;
}

const DEFAULT_CHORDS: { [key: string]: string } = {
  "Bật Tình Yêu Lên": `[G]Chẳng biết từ bao giờ [Em]em đã mong chờ
[Am]Chờ một tình yêu sẽ [D]đến bất ngờ
[G]Và rồi anh đến như [Em]một giấc mơ
[Am]Làm tim em thổn [D]thức từng giờ...

[C]Có phải anh là tình [D]yêu em tìm kiếm
[Bm]Có phải anh là định [Em]mệnh đời em
[Am]Hãy nói một lời để [D]em không còn chờ [G]mong.

[G]Bật tình yêu lên anh [Em]nhé, hỡi chàng trai
[Am]Đừng để thời gian trôi [D]qua thật hoài phí
[G]Cầm tay em đi ta [Em]cùng bước chung đôi
[Am]Trọn đời bên nhau không [D]bao giờ chia [G]phôi.`,

  "Cắt Đôi Nỗi Sầu": `[Dm]Cắt đôi nỗi sầu anh [Am]buông tay nơi đây
[Bb]Cắt đôi nỗi sầu anh [C]đâu muốn thế này
[Dm]Gió lay lá vàng rơi [Am]trên con đường xưa
[Bb]Mưa ngập tràn lối [C]em đi về chưa...

[Dm]Anh muốn quên hết những [Am]tháng ngày qua
[Bb]Quên đi bóng hình của [C]người con gái ta yêu
[Dm]Nỗi sầu này cắt [Am]làm đôi, [Bb]để anh trở lại [C]chính mình.

[Dm]Cắt đôi nỗi sầu anh [Am]buông tay nơi đây
[Bb]Cắt đôi nỗi sầu anh [C]đâu muốn thế này
[Dm]Gió lay lá vàng rơi [Am]trên con đường xưa
[Bb]Mưa ngập tràn lối [C]em đi về chưa...`,

  "Ngày Mai Người Ta Lấy Chồng": `[C#m]Ngày mai người ta lấy [G#m]chồng rồi em ơi
[A]Bỏ lại mình anh với [B]nỗi cô đơn chơi vơi
[C#m]Dòng sông xưa giờ đây [G#m]đã thay đổi rồi
[A]Em theo người ta [B]về nơi xứ xa...

[F#m]Tiếng pháo hồng tiễn [G#m]đưa người đi
[A]Lệ hoen mi cay đắng [B]cho mối tình đầu
[C#m]Chúc em hạnh phúc [G#m]bên người, [A]quên đi mối tình [B]xưa cũ [C#m]đau lòng.

[C#m]Ngày mai người ta lấy [G#m]chồng rồi em ơi
[A]Bỏ lại mình anh với [B]nỗi cô đơn chơi vơi
[C#m]Dòng sông xưa giờ đây [G#m]đã thay đổi rồi
[A]Em theo người ta [B]về nơi xứ xa...`
};

const getChordsForSong = (title: string, note: string) => {
  if (DEFAULT_CHORDS[title]) return DEFAULT_CHORDS[title];
  
  let root = "Am";
  const match = (note || "").match(/tone\s*([A-G][b#]?m?)/i);
  if (match) {
    root = match[1];
  }
  
  return `[${root}]Đây là dòng lyric 1 của bài hát: ${title}
[Dm]Hòa âm phối khí nhịp nhàng cùng [G]Sắc Band
[C]Chúng ta cùng nhau biểu diễn cực [F]sung
[E7]Giữ vững nhịp độ âm nhạc thăng [${root}]hoa...

[${root}]Sân khấu số đồng bộ thời gian thực v2.0
[Dm]Âm nhạc kết nối tâm hồn nghệ sĩ
[G]Hãy tự tin tỏa sáng cùng [C]Sắc Band
[E7]Chúc anh em có một đêm diễn thành [${root}]công rực rỡ!`;
};

const transposeChord = (chord: string, semitones: number): string => {
  const scale = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const flats: { [key: string]: string } = { "Db": "C#", "Eb": "D#", "Gb": "F#", "Ab": "G#", "Bb": "A#" };
  
  let root = "";
  let suffix = "";
  
  if (chord.length > 1 && (chord[1] === "#" || chord[1] === "b")) {
    root = chord.slice(0, 2);
    suffix = chord.slice(2);
  } else {
    root = chord.slice(0, 1);
    suffix = chord.slice(1);
  }
  
  if (flats[root]) {
    root = flats[root];
  }
  
  let idx = scale.indexOf(root.toUpperCase());
  if (idx === -1) return chord;
  
  let newIdx = (idx + semitones + 12) % 12;
  return scale[newIdx] + suffix;
};

const transposeText = (text: string, semitones: number): string => {
  if (semitones === 0) return text;
  return text.replace(/\[([^\]]+)\]/g, (match, chord) => {
    return `[${transposeChord(chord, semitones)}]`;
  });
};

const formatLyricsWithChords = (text: string) => {
  return text.replace(/\[([^\]]+)\]/g, '<span class="inline-block bg-indigo-50 border border-indigo-150 text-indigo-700 font-extrabold px-1.5 py-0.5 rounded text-[11px] mx-0.5 shadow-sm transform -translate-y-[2px]">$1</span>');
};
 
export default function DigitalMusicStand() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [role, setRole] = useState<"admin" | "member">("member");
  
  const [shows, setShows] = useState<ShowItem[]>([]);
  const [selectedShowId, setSelectedShowId] = useState<string>("");
  const [setlist, setSetlist] = useState<Song[]>([]);
  const [activeSongIndex, setActiveSongIndex] = useState<number>(0);
  const [autoSync, setAutoSync] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
 
  // Bộ chơi nhạc
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [tempo, setTempo] = useState<number>(1.0);
  const [preservePitch, setPreservePitch] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(0.8);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Tính năng nâng cấp
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const [metronomeSoundEnabled, setMetronomeSoundEnabled] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [autoScroll, setAutoScroll] = useState(false);
  const [isPlayingScroll, setIsPlayingScroll] = useState(false);
  const [scrollSpeedMultiplier, setScrollSpeedMultiplier] = useState(1);
  const [transpose, setTranspose] = useState(0);
  const [liveCue, setLiveCue] = useState("");

  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);
  const cueTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Phân tích BPM từ bài hát hiện tại
  const currentSong = setlist[activeSongIndex];
  const bpm = currentSong ? (() => {
    const match = (currentSong.note || "").match(/tempo\s*(\d+)/i);
    return match ? parseInt(match[1]) : 100;
  })() : 100;

  // Web Audio Click Synthesizer
  const playClickSound = (isFirstBeat: boolean) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.frequency.value = isFirstBeat ? 1000 : 700;
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } catch (e) {
      console.error("Lỗi âm thanh gõ nhịp:", e);
    }
  };

  // Metronome Timer Effect
  useEffect(() => {
    if (!metronomeEnabled || bpm <= 0) {
      setCurrentBeat(0);
      return;
    }
    
    const intervalMs = (60 / bpm) * 1000;
    let beat = 1;
    setCurrentBeat(beat);
    if (metronomeSoundEnabled) playClickSound(true);
    
    const timer = setInterval(() => {
      beat = beat === 4 ? 1 : beat + 1;
      setCurrentBeat(beat);
      if (metronomeSoundEnabled) {
        playClickSound(beat === 1);
      }
    }, intervalMs);
    
    return () => clearInterval(timer);
  }, [metronomeEnabled, bpm, metronomeSoundEnabled]);

  // Auto-scroll Animation Effect
  useEffect(() => {
    if (!autoScroll || !isPlayingScroll || bpm <= 0) return;
    const container = lyricsContainerRef.current;
    if (!container) return;
    
    let lastTime = performance.now();
    let animationFrameId: number;
    
    const scroll = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;
      
      const pixelsPerMs = (bpm / 60) * 0.015 * scrollSpeedMultiplier;
      
      if (container) {
        container.scrollTop += pixelsPerMs * delta;
        if (container.scrollTop + container.clientHeight >= container.scrollHeight - 1) {
          setIsPlayingScroll(false);
          return;
        }
      }
      
      animationFrameId = requestAnimationFrame(scroll);
    };
    
    animationFrameId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationFrameId);
  }, [autoScroll, isPlayingScroll, bpm, scrollSpeedMultiplier]);

  // Reset scroll và transpose khi đổi bài hát
  useEffect(() => {
    setTranspose(0);
    setIsPlayingScroll(false);
    if (lyricsContainerRef.current) {
      lyricsContainerRef.current.scrollTop = 0;
    }
  }, [activeSongIndex]);
 
  // Nạp danh sách show diễn
  useEffect(() => {
    const fetchShows = async () => {
      try {
        const res = await api.get("/shows");
        const activeShows = (res.data || []).filter((s: ShowItem) => s.status !== "cancelled");
        setShows(activeShows);
        if (activeShows.length > 0) {
          handleSelectShow(activeShows[0]._id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        toast.error("Không thể tải danh sách show diễn");
        setLoading(false);
      }
    };
    fetchShows();
  }, []);
 
  const handleSelectShow = async (showId: string) => {
    setSelectedShowId(showId);
    setLoading(true);
    try {
      const res = await api.get(`/shows/${showId}`);
      const dbSetlist = res.data.setlist || [];
      const formatted = dbSetlist.map((s: any) => ({
        title: s.title,
        note: s.note || "Tone hợp âm",
        sheetUrl: s.link || "",
        beatUrl: s.link || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
      }));
      setSetlist(formatted);
      setActiveSongIndex(0);
    } catch (err) {
      toast.error("Lỗi tải Setlist bài hát");
    } finally {
      setLoading(false);
    }
  };
 
  // Quản lý kết nối Socket.io
  useEffect(() => {
    if (!selectedShowId) return;
 
    const baseAPI = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:5000'
      : 'https://band-manager-s9tm.onrender.com';
      
    const socketInstance = io(baseAPI, {
      transports: ["websocket"],
      withCredentials: true
    });
 
    socketInstance.on("connect", () => {
      setConnected(true);
      setSocket(socketInstance);
      socketInstance.emit("live-show:join", selectedShowId);
    });
 
    socketInstance.on("disconnect", () => {
      setConnected(false);
    });
 
    socketInstance.on("setlist:active-song", (data: { songIndex: number }) => {
      if (autoSync) {
        setActiveSongIndex(data.songIndex);
      }
    });

    socketInstance.on("live-cue:receive", (data: { cueText: string }) => {
      setLiveCue(data.cueText);
      if (cueTimeoutRef.current) clearTimeout(cueTimeoutRef.current);
      cueTimeoutRef.current = setTimeout(() => {
        setLiveCue("");
      }, 3000);
    });
 
    return () => {
      socketInstance.disconnect();
    };
  }, [selectedShowId, autoSync]);
 
  const handleAdminChangeSong = (index: number) => {
    setActiveSongIndex(index);
    if (socket && role === "admin" && selectedShowId) {
      socket.emit("setlist:active-song", { showId: selectedShowId, songIndex: index });
    }
  };

  const handleSendLiveCue = (cueText: string) => {
    if (socket && role === "admin" && selectedShowId) {
      socket.emit("live-cue:send", { showId: selectedShowId, cueText });
      toast.success(`Đã phát lệnh: ${cueText}`);
      setLiveCue(cueText);
      if (cueTimeoutRef.current) clearTimeout(cueTimeoutRef.current);
      cueTimeoutRef.current = setTimeout(() => setLiveCue(""), 3000);
    }
  };
 
  // Bộ lọc âm thanh Pitch/Tempo
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = tempo;
      if ("preservesPitch" in audioRef.current) {
        audioRef.current.preservesPitch = preservePitch;
      }
    }
  }, [tempo, preservePitch]);
 
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
 
  if (loading && shows.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center gap-3">
        <Loader className="animate-spin text-indigo-650" size={32} />
        <span className="text-xs font-black uppercase tracking-wider text-slate-400">Đang chuẩn bị Sân khấu số...</span>
      </div>
    );
  }

  const chordsText = currentSong ? getChordsForSong(currentSong.title, currentSong.note) : "";
  const transposedChords = transposeText(chordsText, transpose);
 
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* 1. VISUAL METRONOME LED HEADER BAR */}
      {metronomeEnabled && (
        <div className="h-2 w-full bg-slate-200/50 flex transition-colors duration-100">
          <div className={`flex-1 transition-colors duration-75 ${currentBeat === 1 ? 'bg-emerald-500 shadow-md shadow-emerald-500/50' : 'bg-transparent'}`}></div>
          <div className={`flex-1 transition-colors duration-75 ${currentBeat === 2 ? 'bg-indigo-500 shadow-md shadow-indigo-500/50' : 'bg-transparent'}`}></div>
          <div className={`flex-1 transition-colors duration-75 ${currentBeat === 3 ? 'bg-indigo-500 shadow-md shadow-indigo-500/50' : 'bg-transparent'}`}></div>
          <div className={`flex-1 transition-colors duration-75 ${currentBeat === 4 ? 'bg-indigo-500 shadow-md shadow-indigo-500/50' : 'bg-transparent'}`}></div>
        </div>
      )}

      {/* 2. LIVE CUE OVERLAY BANNER */}
      {liveCue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] pointer-events-none animate-fade-in">
          <div className="bg-amber-500 text-slate-950 font-black px-10 py-7 rounded-3xl border-4 border-white shadow-2xl text-center text-3xl md:text-5xl animate-pulse tracking-wide max-w-lg leading-tight uppercase">
            👉 {liveCue} 👈
          </div>
        </div>
      )}

      {/* Header Live Stand */}
      <header className="bg-white px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-indigo-600 text-white rounded-xl">
            <Radio size={20} className="animate-pulse" />
          </span>
          <div>
            <h1 className="text-sm font-black uppercase tracking-wider text-slate-800">Sân Khấu Số (Live Stage)</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <select
                value={selectedShowId}
                onChange={e => handleSelectShow(e.target.value)}
                className="p-1.5 border border-slate-200 rounded-lg text-[10px] font-black uppercase text-indigo-650 bg-slate-50 focus:outline-none"
              >
                {shows.map(s => (
                  <option key={s._id} value={s._id}>{s.title}</option>
                ))}
                {shows.length === 0 && <option value="">Không có show</option>}
              </select>
            </div>
          </div>
        </div>
 
        <div className="flex flex-wrap items-center gap-3.5 text-xs font-semibold">
          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
            connected ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-rose-50 text-rose-500 border border-rose-200"
          }`}>
            <Activity size={10} className={connected ? "animate-pulse" : ""} />
            {connected ? "WebSocket Connected" : "Disconnected"}
          </span>
 
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex">
            <button 
              onClick={() => setRole("member")}
              className={`px-3 py-1 rounded-lg font-bold transition text-[10px] uppercase ${role === "member" ? "bg-white text-indigo-650 shadow-sm" : "text-slate-500"}`}
            >
              Nhạc Công
            </button>
            <button 
              onClick={() => setRole("admin")}
              className={`px-3 py-1 rounded-lg font-bold transition text-[10px] uppercase ${role === "admin" ? "bg-white text-indigo-650 shadow-sm" : "text-slate-500"}`}
            >
              Conductor (Admin)
            </button>
          </div>
        </div>
      </header>
 
      {/* VÙNG NỘI DUNG CHÍNH */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* CỘT TRÁI: SETLIST BÀI HÁT (4 cột) */}
        <aside className="lg:col-span-4 bg-white p-6 border-r border-slate-200 flex flex-col justify-between space-y-6 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Setlist Đêm Diễn</h3>
              {setlist.length === 0 ? (
                <p className="text-xs text-slate-400 italic font-semibold">Show diễn này chưa thiết lập Setlist bài hát</p>
              ) : (
                <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {setlist.map((song, idx) => (
                    <button
                      key={idx}
                      onClick={() => role === "admin" && handleAdminChangeSong(idx)}
                      disabled={role !== "admin" && autoSync}
                      className={`w-full text-left p-3.5 rounded-2xl border transition flex items-center justify-between ${
                        activeSongIndex === idx 
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold shadow-sm" 
                          : "bg-slate-50/50 hover:bg-slate-50 border-slate-150 text-slate-600"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-black text-xs truncate">{song.title}</p>
                        <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{song.note}</p>
                      </div>
                      {activeSongIndex === idx && <Music size={14} className="text-indigo-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
 
            {role === "member" && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                <div>
                  <h4 className="font-extrabold flex items-center gap-1.5">
                    {autoSync ? <Lock size={12} className="text-indigo-600" /> : <Unlock size={12} className="text-slate-400" />}
                    Tự động đồng bộ bài diễn
                  </h4>
                  <p className="text-[9px] text-slate-450 mt-0.5">Màn hình lật trang theo Trưởng nhóm</p>
                </div>
                <button
                  onClick={() => setAutoSync(!autoSync)}
                  className={`w-10 h-6 rounded-full p-1 transition duration-200 ${autoSync ? "bg-indigo-600" : "bg-slate-350"}`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-200 ${autoSync ? "translate-x-4" : ""}`} />
                </button>
              </div>
            )}

            {/* BẢNG CHỈ HUY LIVE CUES (CHỈ ADMIN THẤY) */}
            {role === "admin" && (
              <div className="p-4 rounded-3xl bg-amber-50/50 border border-amber-200/60 space-y-3">
                <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-1">
                  <RadioTower size={14}/> Bảng lệnh Conductor Live Cues
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                  {[
                    "Vào Intro", "Vào Điệp Khúc", "Lặp Điệp Khúc", 
                    "Guitar Solo", "Outro Kết Bài", "Dừng Lại"
                  ].map((cueText) => (
                    <button
                      key={cueText}
                      onClick={() => handleSendLiveCue(cueText)}
                      className="bg-white border border-amber-200 hover:bg-amber-500 hover:text-white text-slate-700 py-2.5 rounded-xl transition shadow-sm active:scale-95 text-center truncate"
                    >
                      {cueText}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
 
          {/* BỘ ĐIỀU KHIỂN ÂM THANH TẬP LUYỆN */}
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sliders size={14} className="text-indigo-650" /> Bộ điều khiển Beat Tập Luyện
            </h4>
 
            {setlist[activeSongIndex]?.beatUrl && (
              <audio 
                ref={audioRef}
                src={setlist[activeSongIndex]?.beatUrl}
                onEnded={() => setIsPlaying(false)}
              />
            )}
 
            <div className="flex justify-between items-center gap-3">
              <button 
                onClick={togglePlay}
                disabled={setlist.length === 0}
                className="MetoplayBtn bg-indigo-600 hover:bg-indigo-700 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md transition transform active:scale-95 disabled:opacity-50"
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>
 
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-800 truncate">{setlist[activeSongIndex]?.title || "Chưa chọn bài"}</p>
                <p className="text-[9px] text-slate-400 font-bold mt-0.5">MP3 Audio Player</p>
              </div>
            </div>
 
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Tốc Độ Phát (Tempo)</span>
                <span className="text-indigo-600 font-black">{tempo.toFixed(1)}x</span>
              </div>
              <input 
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={tempo}
                onChange={e => setTempo(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
 
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 pt-1">
              <span>Khóa Tone (Pitch Lock)</span>
              <button
                onClick={() => setPreservePitch(!preservePitch)}
                className={`px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wider transition ${
                  preservePitch 
                    ? "bg-indigo-50 border-indigo-200 text-indigo-600" 
                    : "border-slate-200 text-slate-400"
                }`}
              >
                {preservePitch ? "ĐANG KHÓA TONE" : "DỊCH GIỌNG THEO TỐC ĐỘ"}
              </button>
            </div>
          </div>
        </aside>
 
        {/* CỘT PHẢI: MÀN HÌNH BẢN PHÁT NHẠC (DIGITAL STAND - 8 cột) */}
        <main className="lg:col-span-8 p-6 flex flex-col justify-between items-center bg-slate-100 space-y-6">
          <div className="w-full flex-1 bg-white border border-slate-200 rounded-[32px] p-6 md:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden">
            
            {/* 3. CONTROL BAR: METRONOME, AUTO-SCROLL, TRANSPOSE */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-150 pb-4 mb-4 text-xs font-bold text-slate-600">
              
              {/* Metronome control */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 shrink-0">Máy Gõ Nhịp:</span>
                <button
                  onClick={() => setMetronomeEnabled(!metronomeEnabled)}
                  className={`px-3 py-1.5 rounded-xl border transition ${metronomeEnabled ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                >
                  LED
                </button>
                <button
                  onClick={() => setMetronomeSoundEnabled(!metronomeSoundEnabled)}
                  className={`px-3 py-1.5 rounded-xl border transition ${metronomeSoundEnabled ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                >
                  Click {metronomeSoundEnabled ? "On" : "Off"}
                </button>
              </div>

              {/* Transpose control */}
              <div className="flex items-center gap-1.5 justify-center">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 mr-1">Hợp Âm Tone:</span>
                <button 
                  onClick={() => setTranspose(prev => Math.max(-3, prev - 1))}
                  className="w-7 h-7 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg flex items-center justify-center font-black"
                >
                  -
                </button>
                <span className={`w-12 text-center font-black uppercase text-[11px] ${transpose !== 0 ? 'text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-150' : 'text-slate-700'}`}>
                  {transpose === 0 ? "Gốc" : transpose > 0 ? `+${transpose}` : transpose}
                </span>
                <button 
                  onClick={() => setTranspose(prev => Math.max(-3, Math.min(3, prev + 1)))}
                  className="w-7 h-7 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg flex items-center justify-center font-black"
                >
                  +
                </button>
              </div>

              {/* Auto scroll control */}
              <div className="flex items-center gap-2 justify-end">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Tự Động Cuộn:</span>
                <button
                  onClick={() => {
                    setAutoScroll(!autoScroll);
                    setIsPlayingScroll(!autoScroll);
                  }}
                  className={`px-3 py-1.5 rounded-xl border transition ${autoScroll ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                >
                  {autoScroll ? "BẬT" : "TẮT"}
                </button>
                {autoScroll && (
                  <select
                    value={scrollSpeedMultiplier}
                    onChange={e => setScrollSpeedMultiplier(parseFloat(e.target.value))}
                    className="p-1 border border-slate-200 rounded-lg text-[10px] font-black bg-slate-50 focus:outline-none"
                  >
                    <option value="0.5">0.5x</option>
                    <option value="1.0">1.0x</option>
                    <option value="1.5">1.5x</option>
                    <option value="2.0">2.0x</option>
                  </select>
                )}
              </div>

            </div>
 
            {/* MÀN HÌNH HIỂN THỊ CHORDS & LYRIC SHEET */}
            <div 
              ref={lyricsContainerRef}
              className="flex-1 overflow-y-auto px-4 py-6 bg-slate-50/50 rounded-2xl border border-slate-100 font-mono text-xs md:text-sm leading-relaxed text-slate-700 whitespace-pre scroll-smooth max-h-[420px]"
            >
              {currentSong ? (
                <div 
                  className="space-y-4 selection:bg-indigo-100"
                  dangerouslySetInnerHTML={{ 
                    __html: formatLyricsWithChords(transposedChords) 
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 py-20">
                  <Music className="mb-3 opacity-30" size={32}/>
                  <p className="font-bold italic">Chưa chọn bài diễn nào ở setlist bên trái</p>
                </div>
              )}
            </div>

            {/* Stage Footer Status */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-150 text-[10px] font-bold text-slate-400">
              <span className="flex items-center gap-1">
                <FileText size={12} className="text-indigo-600" /> 
                BPM bài diễn: <span className="text-indigo-650 font-black">{bpm}</span>
              </span>
              <span className="font-black tracking-widest uppercase">SẮC BAND DIGITAL MUSIC STAND</span>
              <span>Tone: {currentSong?.note || "Chưa rõ"}</span>
            </div>
 
          </div>
        </main>
 
      </div>
    </div>
  );
}
