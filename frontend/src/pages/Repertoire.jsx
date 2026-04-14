import { useState, useEffect } from "react";
import api from '../services/api';
import { BookOpen, Search, Printer, Music, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

const Repertoire = () => {
  const [songs, setSongs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const res = await api.get("/library");
        // Sắp xếp bài hát theo bảng chữ cái
        const sortedSongs = res.data.sort((a, b) => {
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

  // Nhóm bài hát theo chữ cái đầu tiên
  const groupedSongs = filteredSongs.reduce((acc, song) => {
    let firstLetter = (song.title || song.name || "#").charAt(0).toUpperCase();
    if (!/[A-Z]/.test(firstLetter)) firstLetter = "#"; // Nhóm số và ký tự đặc biệt
    
    if (!acc[firstLetter]) acc[firstLetter] = [];
    acc[firstLetter].push(song);
    return acc;
  }, {});

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Đang tải Menu...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto">
        
        {/* --- HEADER KHÔNG HIỂN THỊ KHI IN --- */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 print:hidden">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3">
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-2 rounded-xl shadow-lg shadow-orange-200">
                <BookOpen size={28} />
              </span>
              Repertoire - Menu Bài Hát
            </h1>
            <p className="text-gray-500 mt-1 text-sm">Danh sách các bài hát Sắc Band có thể biểu diễn ({songs.length} bài)</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 ring-orange-500 outline-none"
                placeholder="Tìm bài hát..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={handlePrint} className="bg-gray-900 hover:bg-black text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition">
              <Printer size={18}/> In PDF
            </button>
          </div>
        </div>

        {/* --- KHU VỰC TRANG IN (MENU) --- */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12 print:shadow-none print:border-none print:p-0">
          
          {/* Header Trang In */}
          <div className="text-center mb-10 border-b-2 border-gray-200 pb-8">
            <Music size={40} className="mx-auto text-orange-500 mb-2"/>
            <h2 className="text-4xl font-black text-gray-900 uppercase tracking-widest">Sắc Band</h2>
            <p className="text-gray-500 font-medium tracking-widest mt-2 uppercase text-sm">Official Repertoire</p>
          </div>

          {/* Danh sách nhóm theo chữ cái */}
          {Object.keys(groupedSongs).length === 0 ? (
            <div className="text-center py-10 text-gray-400 italic">Không tìm thấy bài hát nào.</div>
          ) : (
            <div className="space-y-10">
              {Object.keys(groupedSongs).sort().map(letter => (
                <div key={letter} className="break-inside-avoid">
                  <div className="flex items-center gap-4 mb-4">
                    <h3 className="text-2xl font-black text-orange-500">{letter}</h3>
                    <div className="h-px bg-gray-200 flex-1"></div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
                    {groupedSongs[letter].map(song => (
                      <div key={song._id} className="flex justify-between items-baseline group border-b border-gray-100 border-dashed pb-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle size={12} className="text-green-500 print:hidden opacity-0 group-hover:opacity-100 transition"/>
                          <span className="font-bold text-gray-800 text-lg group-hover:text-orange-600 transition">{song.title || song.name}</span>
                        </div>
                        {song.note && (
                           <span className="text-xs text-gray-400 italic text-right ml-4 shrink-0 max-w-[40%] truncate">
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

          {/* Footer Trang In */}
          <div className="hidden print:block text-center mt-12 pt-8 border-t border-gray-200 text-sm text-gray-500">
            <p>Liên hệ Booking Sắc Band: (Số điện thoại của bạn)</p>
            <p className="italic text-xs mt-1">Danh sách cập nhật ngày {new Date().toLocaleDateString('vi-VN')}</p>
          </div>
        </div>
      </div>

      {/* Style ẩn các thành phần không cần thiết khi in */}
      <style>{`
        @media print {
          body { background: white; }
          nav, footer { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Repertoire;