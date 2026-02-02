import { useState, useEffect } from "react";
import axios from "axios";
import { Trash2, UserCheck, Shield, Music, CheckCircle, Clock, Save, Edit3 } from "lucide-react";
import toast from 'react-hot-toast';

const MemberManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");

  // Dùng biến môi trường hoặc fallback về localhost
  const API_URL = "http://localhost:5000/api/users";

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(API_URL, getAuthHeader());
      setUsers(res.data);
    } catch (error) {
      toast.error("Bạn không có quyền truy cập!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // --- 🔥 1. HÀM CẬP NHẬT TỨC THÌ (AUTO SAVE) 🔥 ---
  const handleUpdate = async (userId, field, value) => {
    // Gọi API cập nhật ngay lập tức
    try {
      await axios.put(`${API_URL}/${userId}`, { [field]: value }, getAuthHeader());
      
      // Cập nhật State giao diện để không cần load lại trang
      setUsers(prevUsers => prevUsers.map(user => 
        user._id === userId ? { ...user, [field]: value } : user
      ));

      toast.success(`Đã cập nhật ${field === 'role' ? 'vai trò' : 'vị trí'} thành công! ✅`);
    } catch (error) {
      toast.error("Lỗi khi cập nhật! Vui lòng thử lại.");
      console.error(error);
    }
  };

  // 2. Duyệt thành viên
  const handleApprove = async (userId, currentName) => {
    if(!window.confirm(`Duyệt thành viên "${currentName}"?`)) return;
    try {
      await axios.put(`${API_URL}/${userId}`, { status: 'active' }, getAuthHeader());
      toast.success(`Đã duyệt "${currentName}"!`);
      fetchUsers();
    } catch (error) { toast.error("Lỗi khi duyệt"); }
  };

  // 3. Xóa thành viên
  const handleDelete = async (userId, currentName) => {
    if(!window.confirm(`Xóa vĩnh viễn "${currentName}"?`)) return;
    try {
      await axios.delete(`${API_URL}/${userId}`, getAuthHeader());
      toast.success("Đã xóa thành viên");
      setUsers(users.filter(u => u._id !== userId));
    } catch (error) { toast.error("Lỗi khi xóa"); }
  };

  const filteredUsers = users.filter(user => filterStatus === "all" ? true : user.status === filterStatus);

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải danh sách...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Shield className="text-blue-600" /> Quản Lý Nhân Sự
          </h1>
          <p className="text-gray-500 text-sm mt-1">Phê duyệt & Phân công vai trò (Tự động lưu)</p>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-xl mt-4 md:mt-0">
          {['all', 'pending', 'active'].map(status => (
            <button 
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition ${filterStatus === status ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {status === 'all' ? `Tất Cả (${users.length})` : 
               status === 'pending' ? `Chờ Duyệt (${users.filter(u=>u.status==='pending').length})` : 
               `Chính Thức (${users.filter(u=>u.status==='active').length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Thành viên</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Vai trò (Role)</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Nhạc cụ / Vị trí</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50/50 transition">
                  {/* Cột 1: Info */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                        {user.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-gray-900">{user.fullName}</div>
                        <div className="text-xs text-gray-500">@{user.username}</div>
                      </div>
                    </div>
                  </td>

                  {/* Cột 2: Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.status === 'active' ? (
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 flex items-center gap-1 w-fit">
                        <CheckCircle size={12}/> Chính thức
                      </span>
                    ) : (
                      <span onClick={() => handleApprove(user._id, user.fullName)} className="cursor-pointer px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700 flex items-center gap-1 w-fit hover:bg-yellow-200">
                        <Clock size={12}/> Chờ duyệt
                      </span>
                    )}
                  </td>

                  {/* Cột 3: ROLE (Thay đổi là LƯU NGAY) */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select 
                      value={user.role} 
                      onChange={(e) => handleUpdate(user._id, 'role', e.target.value)}
                      className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none cursor-pointer hover:border-blue-400 transition"
                    >
                      <option value="member">Thành viên</option>
                      <option value="admin">Quản trị viên</option>
                      <option value="viewer">Khán giả</option>
                    </select>
                  </td>

                  {/* Cột 4: NHẠC CỤ (Gõ xong click ra ngoài là LƯU NGAY) */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                        <Music size={14} />
                      </div>
                      <input 
                        type="text" 
                        defaultValue={user.instrument}
                        // onBlur: Chỉ lưu khi người dùng nhập xong và click ra chỗ khác
                        onBlur={(e) => {
                          if (e.target.value !== user.instrument) {
                            handleUpdate(user._id, 'instrument', e.target.value);
                          }
                        }}
                        placeholder="Nhập vị trí..."
                        className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-9 p-2 outline-none transition"
                      />
                    </div>
                  </td>

                  {/* Cột 5: Delete */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                       {user.status === 'pending' && (
                          <button onClick={() => handleApprove(user._id, user.fullName)} className="text-green-500 hover:bg-green-50 p-2 rounded-lg" title="Duyệt">
                            <UserCheck size={18}/>
                          </button>
                       )}
                       <button onClick={() => handleDelete(user._id, user.fullName)} className="text-red-400 hover:bg-red-50 p-2 rounded-lg transition" title="Xóa">
                         <Trash2 size={18} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MemberManager;