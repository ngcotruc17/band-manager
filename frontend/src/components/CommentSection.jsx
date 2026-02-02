import { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Send, Trash2, MessageCircle } from 'lucide-react';

const CommentSection = ({ eventId }) => {
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const { user } = useContext(AuthContext);
  const bottomRef = useRef(null);

  const getHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const fetchComments = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/comments/${eventId}`, getHeaders());
      setComments(res.data);
      // Tự động cuộn xuống dưới cùng khi mới vào
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchComments(); }, [eventId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      const res = await axios.post('http://localhost:5000/api/comments', { content, eventId }, getHeaders());
      setComments([...comments, res.data]); // Thêm comment mới vào list ngay lập tức
      setContent('');
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) { alert('Lỗi gửi bình luận'); }
  };

  const handleDelete = async (commentId) => {
    if(!window.confirm("Xóa bình luận này?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/comments/${commentId}`, getHeaders());
      setComments(comments.filter(c => c._id !== commentId));
    } catch (err) { alert('Lỗi xóa'); }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mt-8 border border-gray-200">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <MessageCircle className="text-blue-600"/> Thảo luận & Trao đổi
      </h3>

      {/* KHUNG HIỂN THỊ CHAT */}
      <div className="bg-gray-50 p-4 rounded-lg h-80 overflow-y-auto mb-4 border border-gray-100">
        {comments.length === 0 ? (
          <p className="text-center text-gray-400 mt-10 italic">Chưa có bình luận nào. Hãy mở lời trước nhé!</p>
        ) : (
          <div className="space-y-4">
            {comments.map((c) => {
              const isMe = c.user._id === user._id;
              return (
                <div key={c._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-3 max-w-[80%] ${isMe ? 'flex-row-reverse' : ''}`}>
                    {/* AVATAR (Chữ cái đầu) */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0 ${isMe ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'}`}>
                      {c.user.fullName ? c.user.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>

                    {/* NỘI DUNG CHAT */}
                    <div className={`p-3 rounded-lg text-sm shadow-sm relative group ${isMe ? 'bg-blue-100 text-blue-900 rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'}`}>
                      {!isMe && <p className="text-xs font-bold text-gray-500 mb-1">{c.user.fullName}</p>}
                      <p className="whitespace-pre-wrap">{c.content}</p>
                      
                      {/* TIME & DELETE BUTTON */}
                      <div className="flex items-center gap-2 mt-1 justify-end">
                        <span className="text-[10px] text-gray-400">
                          {new Date(c.createdAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                        {(isMe || user?.role === 'admin') && (
                          <button onClick={() => handleDelete(c._id)} className="hidden group-hover:block text-red-400 hover:text-red-600">
                            <Trash2 size={12}/>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Ô NHẬP LIỆU */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input 
          className="flex-1 border p-2 rounded-lg focus:outline-none focus:ring-2 ring-blue-500"
          placeholder="Viết bình luận..."
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        <button className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition shadow">
          <Send size={20}/>
        </button>
      </form>
    </div>
  );
};

export default CommentSection;