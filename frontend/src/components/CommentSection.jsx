import { useState, useEffect, useContext, useRef } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Send, Trash2, MessageCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const CommentSection = ({ eventId }) => {
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const { user } = useContext(AuthContext);
  const bottomRef = useRef(null);

  const fetchComments = async () => {
    try {
      const res = await api.get(`/comments/${eventId}`);
      setComments(res.data);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchComments(); }, [eventId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      const res = await api.post('/comments', { content, eventId });
      setComments([...comments, res.data]);
      setContent('');
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) { toast.error('Không gửi được tin nhắn'); }
  };

  const handleDelete = async (commentId) => {
    if(!window.confirm("Xóa tin nhắn này?")) return;
    try {
      await api.delete(`/comments/${commentId}`);
      setComments(comments.filter(c => c._id !== commentId));
    } catch (err) { toast.error('Lỗi xóa'); }
  };

  return (
    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
        <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center shadow-inner">
          <MessageCircle size={20}/>
        </div>
        <div>
          <h3 className="font-black text-slate-800 leading-tight">Thảo luận Show</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nội bộ ban nhạc</p>
        </div>
      </div>

      {/* Tin nhắn */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
        {comments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-60">
             <MessageCircle size={48} className="mb-2"/>
             <p className="text-sm font-medium italic">Chưa có trao đổi nào...</p>
          </div>
        ) : (
          comments.map((c) => {
            const isMe = c.user?._id === user?._id;
            return (
              <div key={c._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`flex gap-3 max-w-[85%] ${isMe ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-[10px] shadow-sm ${isMe ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-violet-600'}`}>
                    {c.user?.fullName?.charAt(0) || 'U'}
                  </div>

                  <div className={`space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm font-medium shadow-sm leading-relaxed ${
                      isMe ? 'bg-violet-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                    }`}>
                      {!isMe && <p className="text-[10px] font-black uppercase text-violet-500 mb-1 tracking-tighter">{c.user?.fullName}</p>}
                      <p className="whitespace-pre-wrap">{c.content}</p>
                    </div>
                    
                    <div className={`flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-tighter ${isMe ? 'flex-row-reverse' : ''}`}>
                       <span>{new Date(c.createdAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</span>
                       {(isMe || user?.role === 'admin') && (
                          <button onClick={() => handleDelete(c._id)} className="hover:text-rose-500 transition"><Trash2 size={10}/></button>
                       )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Ô nhập liệu */}
      <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-slate-100 flex gap-2">
        <input 
          className="flex-1 bg-slate-50 border border-slate-100 px-5 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 ring-violet-500 font-medium transition"
          placeholder="Nhập nội dung trao đổi..."
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        <button className="bg-slate-900 text-white p-3 rounded-2xl hover:bg-black transition shadow-lg shadow-slate-200">
          <Send size={20}/>
        </button>
      </form>
    </div>
  );
};

export default CommentSection;