import { useState, useEffect } from "react";
import api from '../services/api';
import { BookOpen, Search, Printer, Music, CheckCircle, Loader } from "lucide-react";
import toast from "react-hot-toast";

const Repertoire = () => {
  const [songs, setSongs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const res = await api.get("/library");
        // Sort songs alphabetically
        const sortedSongs = (res.data || []).sort((a, b) => {
          const titleA = (a.title || a.name || "").toUpperCase();
          const titleB = (b.title || b.name || "").toUpperCase();
          return titleA.localeCompare(titleB);
        });
        setSongs(sortedSongs);
      } catch (err) {
        toast.error("Lỗi tải danh mục bài hát");
      } finally {
        setLoading(false);
      }
    };
    fetchSongs();
  }, []);

  const filteredSongs = songs.filter(s =>
    (s.title || s.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.note || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group songs by first letter
  const groupedSongs = filteredSongs.reduce((acc, song) => {
    let firstLetter = (song.title || song.name || "#").charAt(0).toUpperCase();
    if (!/[A-Z]/.test(firstLetter)) firstLetter = "#";
    
    if (!acc[firstLetter]) acc[firstLetter] = [];
    acc[firstLetter].push(song);
    return acc;
  }, {});

  const handlePrint = () => {
    window.print();
  };

  // Helper function to highlight searched terms
  const highlightText = (text, highlight) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const regex = new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) => 
          regex.test(part) ? (
            <mark key={i} className="bg-amber-200 text-slate-900 px-0.5 rounded font-black">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 transition-colors duration-300 print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 print:hidden">
          <div>
            <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
              <span className="bg-gradient-to-tr from-amber-500 to-orange-500 text-white p-2.5 rounded-2xl shadow-lg shadow-orange-500/10">
                <BookOpen size={26} />
              </span>
              DANH MỤC BIỂU DIỄN
            </h1>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 ring-orange-500 outline-none text-slate-800 text-sm font-semibold transition"
                placeholder="Tìm tên, ghi chú bài hát..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={handlePrint} className="bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md transition transform active:scale-95 text-xs uppercase tracking-wide">
              <Printer size={15}/> In Menu PDF
            </button>
          </div>
        </div>

        {/* REPERTOIRE PAPER SHEET CONTAINER */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-12 transition-colors duration-300 print:shadow-none print:border-none print:p-0 print-card">
          
          {/* Header Trang In */}
          <div className="text-center mb-10 border-b-2 border-slate-200 pb-8">
            <Music size={40} className="mx-auto text-orange-500 mb-2"/>
            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-widest print:text-black">SẮC BAND</h2>
            <p className="text-slate-500 font-medium tracking-widest mt-2.5 uppercase text-xs print:text-black">Official Repertoire</p>
          </div>

          {loading ? (
             <div className="text-center py-20"><Loader className="animate-spin mx-auto text-orange-500" size={32}/></div>
          ) : Object.keys(groupedSongs).length === 0 ? (
            <div className="text-center py-10 text-slate-400 italic">Không tìm thấy bài hát nào trong danh mục.</div>
          ) : (
            <div className="space-y-10">
              {Object.keys(groupedSongs).sort().map(letter => (
                <div key={letter} className="break-inside-avoid">
                  <div className="flex items-center gap-4 mb-4">
                    <h3 className="text-2xl font-black text-orange-500">{letter}</h3>
                    <div className="h-px bg-slate-200 flex-1 print:bg-black"></div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3.5 print-grid">
                    {groupedSongs[letter].map(song => (
                      <div key={song._id} className="flex justify-between items-baseline group border-b border-slate-100 border-dashed pb-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle size={12} className="text-green-500 print:hidden opacity-0 group-hover:opacity-100 transition"/>
                          <span className="font-bold text-slate-800 group-hover:text-orange-600 transition print:text-black">
                            {highlightText(song.title || song.name || "", searchTerm)}
                          </span>
                        </div>
                        {song.note && (
                           <span className="text-xs text-slate-400 italic text-right ml-4 shrink-0 max-w-[40%] truncate print:text-black">
                             {highlightText(song.note, searchTerm)}
                           </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer Trang In */}
          <div className="hidden print:block text-center mt-12 pt-8 border-t border-slate-200 text-sm text-slate-500">
            <p className="font-bold">Liên hệ Booking Sắc Band: (+84) 9xx xxx xxx</p>
            <p className="italic text-xs mt-1">Danh sách cập nhật ngày {new Date().toLocaleDateString('vi-VN')}</p>
          </div>
        </div>
      </div>

      {/* Style ẩn các thành phần không cần thiết và buộc 2 cột khi in */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
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