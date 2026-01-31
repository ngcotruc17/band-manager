import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Music, UploadCloud, Trash2, Search, FileText, PlayCircle } from 'lucide-react';

const SongLibrary = () => {
  const [songs, setSongs] = useState([]);
  const [formData, setFormData] = useState({ name: '', note: '' });
  const [files, setFiles] = useState({ sheet: null, beat: null });
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useContext(AuthContext);

  const getHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const fetchSongs = async () => {
    try {
      const res = await axios.get('https://band-api.onrender.co/api/library', getHeaders());
      setSongs(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchSongs(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    const postData = new FormData();
    postData.append('name', formData.name);
    postData.append('note', formData.note);
    if (files.sheet) postData.append('sheet', files.sheet);
    if (files.beat) postData.append('beat', files.beat);

    try {
      await axios.post('https://band-api.onrender.co/api/library', postData, {
        headers: { ...getHeaders().headers, 'Content-Type': 'multipart/form-data' }
      });
      alert("✅ Đã thêm vào Kho Nhạc!");
      setFormData({ name: '', note: '' });
      setFiles({ sheet: null, beat: null });
      document.getElementById('lib-sheet').value = "";
      document.getElementById('lib-beat').value = "";
      fetchSongs();
    } catch (err) { alert("Lỗi upload"); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Xóa bài này khỏi kho?")) return;
    try {
      await axios.delete(`https://band-api.onrender.co/api/library/${id}`, getHeaders());
      fetchSongs();
    } catch (err) { alert("Lỗi xóa"); }
  };

  const filteredSongs = songs.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-900 mb-6 flex items-center gap-2">
        📚 Kho Nhạc Chung
      </h1>

      <div className="grid md:grid-cols-3 gap-8">
        {/* FORM UPLOAD (Chỉ Admin) */}
        {user?.role === 'admin' && (
          <div className="md:col-span-1 h-fit bg-white p-5 rounded-lg shadow border border-blue-100">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-blue-800"><UploadCloud/> Thêm bài mới</h3>
            <form onSubmit={handleUpload} className="space-y-3">
              <input className="w-full border p-2 rounded" placeholder="Tên bài hát" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              <input className="w-full border p-2 rounded" placeholder="Ghi chú (Tone/Nhịp)" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
              <div className="text-sm">
                <label className="block font-bold mb-1 text-red-600">Sheet (PDF)</label>
                <input id="lib-sheet" type="file" accept=".pdf" className="w-full" onChange={e => setFiles({...files, sheet: e.target.files[0]})} />
              </div>
              <div className="text-sm">
                <label className="block font-bold mb-1 text-blue-600">Beat (MP3)</label>
                <input id="lib-beat" type="file" accept="audio/*" className="w-full" onChange={e => setFiles({...files, beat: e.target.files[0]})} />
              </div>
              <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-bold">Lưu vào Kho</button>
            </form>
          </div>
        )}

        {/* DANH SÁCH BÀI HÁT */}
        <div className={`md:col-span-${user?.role === 'admin' ? '2' : '3'}`}>
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input 
              className="w-full pl-10 p-3 rounded-lg border focus:ring-2 ring-blue-500 outline-none shadow-sm"
              placeholder="🔍 Tìm kiếm bài hát trong kho..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
            {filteredSongs.length === 0 ? (
              <p className="p-8 text-center text-gray-400">Chưa có bài hát nào.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredSongs.map(song => (
                  <div key={song._id} className="p-4 hover:bg-gray-50 flex justify-between items-center group">
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg">{song.name}</h4>
                      <p className="text-sm text-gray-500">{song.note || "Không có ghi chú"}</p>
                      <div className="flex gap-2 mt-1">
                        {song.sheetUrl && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded flex items-center gap-1"><FileText size={12}/> Sheet</span>}
                        {song.beatUrl && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded flex items-center gap-1"><PlayCircle size={12}/> Beat</span>}
                      </div>
                    </div>
                    {user?.role === 'admin' && (
                      <button onClick={() => handleDelete(song._id)} className="text-gray-300 hover:text-red-500 p-2"><Trash2 size={18}/></button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongLibrary;