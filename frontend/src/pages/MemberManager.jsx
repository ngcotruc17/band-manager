import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Users, Search, Key, Trash2, Shield, User, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const MemberManager = () => {
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useContext(AuthContext);

  const BASE_URL = 'https://band-manager-s9tm.onrender.com/api/auth';
  const getHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  // 1. Lấy danh sách thành viên
  const fetchMembers = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/users`, getHeaders());
      setMembers(res.data);
    } catch (err) {
      toast.error("Không tải được danh sách nhân sự");
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  // 2. Xử lý Reset Mật khẩu
  const handleResetPassword = async (memberId, memberName) => {
    // Hỏi xác nhận cho chắc
    if (!window.confirm(`⚠️ CẢNH BÁO:\n\nBạn có chắc muốn Reset mật khẩu của "${memberName}" không?\n\nMật khẩu sẽ về mặc định: 123456\nThành viên sẽ phải đổi lại khi đăng nhập.`)) {
      return;
    }

    const toastId = toast.loading("Đang reset mật khẩu...");
    try {
      await axios.put(`${BASE_URL}/users/${memberId}/reset-password`, {}, getHeaders());
      
      toast.success(`Đã reset mật khẩu cho ${memberName}!`, { id: toastId });
      fetchMembers(); // Load lại data (để cập nhật trạng thái nếu cần)
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi reset", { id: toastId });
    }
  };

  // Lọc theo tên hoặc email
  const filteredMembers = members.filter(m => 
    m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.email && m.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3">
              <span className="bg-purple-600 text-white p-2 rounded-xl shadow-lg shadow-purple-300">
                <Users size={28} />
              </span>
              Quản Lý Nhân Sự
            </h1>
            <p className="text-gray-500 mt-1 text-sm">Danh sách thành viên & Phân quyền</p>
          </div>

          <div className="relative w-full md:w-80">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
             <input 
               className="w-full pl-10 pr-4 py-3 rounded-xl border-none shadow-sm focus:ring-2 ring-purple-500 bg-white placeholder-gray-400 font-medium transition"
               placeholder="Tìm theo tên, username..."
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
          </div>
        </div>

        {/* Bảng Danh sách */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                  <th className="p-5 font-bold">Thành viên</th>
                  <th className="p-5 font-bold">Vai trò</th>
                  <th className="p-5 font-bold">Trạng thái</th>
                  <th className="p-5 font-bold text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredMembers.map(member => (
                  <tr key={member._id} className="hover:bg-purple-50/50 transition duration-200 group">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-purple-700 font-bold shadow-sm">
                          {member.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{member.fullName}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Mail size={10}/> {member.email || member.username}
                          </p>
                        </div>
                      </div>
                    </td>
                    
                    <td className="p-5">
                      {member.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600 border border-red-200">
                          <Shield size={12}/> Quản trị viên
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-600 border border-blue-200">
                          <User size={12}/> Thành viên
                        </span>
                      )}
                    </td>

                    <td className="p-5">
                       {/* Hiển thị trạng thái đổi pass */}
                       {member.mustChangePassword ? (
                         <span className="text-xs text-orange-500 font-bold bg-orange-50 px-2 py-1 rounded border border-orange-100">
                           ⚠️ Cần đổi pass
                         </span>
                       ) : (
                         <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded border border-green-100">
                           ✅ Ổn định
                         </span>
                       )}
                    </td>

                    <td className="p-5 text-center">
                      {/* Chỉ hiển thị nút nếu không phải là chính mình (để tránh tự reset pass mình rồi bị logout) */}
                      {user._id !== member._id && (
                        <div className="flex items-center justify-center gap-2 opacity-80 group-hover:opacity-100 transition">
                          
                          {/* NÚT RESET PASSWORD */}
                          <button 
                            onClick={() => handleResetPassword(member._id, member.fullName)}
                            title="Reset mật khẩu về 123456"
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-yellow-100 text-yellow-600 hover:bg-yellow-500 hover:text-white transition shadow-sm"
                          >
                            <Key size={16} />
                          </button>

                          {/* NÚT XÓA (Nếu muốn thêm sau này) */}
                          {/* <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-400 hover:bg-red-500 hover:text-white transition shadow-sm">
                            <Trash2 size={16} />
                          </button> */}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredMembers.length === 0 && (
             <div className="p-8 text-center text-gray-400 italic">Không tìm thấy thành viên nào.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberManager;