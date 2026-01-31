import { useState, useEffect } from "react";
import axios from "axios";
import { Trash2, UserCheck, Shield, Music, Search, CheckCircle, Clock } from "lucide-react";
import toast from 'react-hot-toast';

const MemberManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all"); // all, pending, active

  // URL API Local (Đổi lại khi deploy)
  const API_URL = "https://band-manager-s9tm.onrender.com/api/users";

  // Lấy token để xác thực Admin
  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // 1. Tải danh sách user
  const fetchUsers = async () => {
    try {
      const res = await axios.get(API_URL, getAuthHeader());
      setUsers(res.data);
    } catch (error) {
      toast.error("Không thể tải danh sách thành viên!");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 2. Hàm DUYỆT thành viên
  const handleApprove = async (userId, currentName) => {
    if(!window.confirm(`Bạn có chắc muốn duyệt thành viên "${currentName}"?`)) return;
    
    const toastId = toast.loading("Đang xử lý...");
    try {
      // Gọi API update status thành 'active'
      await axios.put(`${API_URL}/${userId}`, { status: 'active' }, getAuthHeader());
      
      toast.success(`Đã duyệt "${currentName}" thành công! 🎉`, { id: toastId });
      fetchUsers(); // Tải lại danh sách
    } catch (error) {
      toast.error("Lỗi khi duyệt thành viên", { id: toastId });
    }
  };

  // 3. Hàm XÓA/KICK thành viên
  const handleDelete = async (userId, currentName) => {
    if(!window.confirm(`CẢNH BÁO: Bạn có chắc muốn xóa vĩnh viễn "${currentName}"?`)) return;

    const toastId = toast.loading("Đang xóa...");
    try {
      await axios.delete(`${API_URL}/${userId}`, getAuthHeader());
      
      toast.success("Đã xóa thành viên khỏi hệ thống", { id: toastId });
      setUsers(users.filter(u => u._id !== userId));
    } catch (error) {
      toast.error("Lỗi khi xóa thành viên", { id: toastId });
    }
  };

  // 4. Lọc danh sách hiển thị
  const filteredUsers = users.filter(user => {
    if (filterStatus === "all") return true;
    return user.status === filterStatus;
  });

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải danh sách nhân sự...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Shield className="text-blue-600" /> Quản Lý Nhân Sự
          </h1>
          <p className="text-gray-500 text-sm mt-1">Phê duyệt thành viên & Phân công vai trò</p>
        </div>
        
        {/* Bộ lọc Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-xl mt-4 md:mt-0">
          <button 
            onClick={() => setFilterStatus("all")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${filterStatus === 'all' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Tất Cả ({users.length})
          </button>
          <button 
            onClick={() => setFilterStatus("pending")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition flex items-center gap-1 ${filterStatus === 'pending' ? 'bg-white shadow-sm text-yellow-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Clock size={14}/> Chờ Duyệt ({users.filter(u => u.status === 'pending').length})
          </button>
          <button 
            onClick={() => setFilterStatus("active")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition flex items-center gap-1 ${filterStatus === 'active' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <CheckCircle size={14}/> Chính Thức ({users.filter(u => u.status === 'active').length})
          </button>
        </div>
      </div>

      {/* Danh sách User */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Thành viên</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vai trò (Role)</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vị trí (Nhạc cụ)</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-400 italic">
                    Không tìm thấy thành viên nào.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50/50 transition duration-150">
                    {/* Cột 1: Thông tin */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-gray-900">{user.fullName}</div>
                          <div className="text-xs text-gray-500">@{user.username}</div>
                        </div>
                      </div>
                    </td>

                    {/* Cột 2: Trạng thái */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.status === 'active' ? (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-700 items-center gap-1">
                          <CheckCircle size={12}/> Chính thức
                        </span>
                      ) : user.status === 'pending' ? (
                        <span onClick={() => handleApprove(user._id, user.fullName)} className="cursor-pointer px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-700 items-center gap-1 hover:bg-yellow-200 transition">
                          <Clock size={12}/> Chờ duyệt (Bấm để duyệt)
                        </span>
                      ) : (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-700">
                          Đã khóa
                        </span>
                      )}
                    </td>

                    {/* Cột 3: Role (Chưa làm chức năng edit, hiển thị text trước) */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <select className="bg-transparent border border-gray-200 rounded px-2 py-1 text-sm outline-none focus:border-blue-500" defaultValue={user.role}>
                        <option value="admin">Quản trị viên</option>
                        <option value="member">Thành viên</option>
                        <option value="viewer">Khán giả</option>
                      </select>
                    </td>

                    {/* Cột 4: Nhạc cụ */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2 border border-gray-200 rounded px-2 py-1 w-fit">
                        <Music size={14} className="text-gray-400"/>
                        <input type="text" defaultValue={user.instrument || "Chưa phân công"} className="bg-transparent outline-none w-28 text-sm"/>
                      </div>
                    </td>

                    {/* Cột 5: Hành động */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        {user.status === 'pending' && (
                          <button 
                            onClick={() => handleApprove(user._id, user.fullName)}
                            className="text-green-600 hover:text-green-900 bg-green-50 p-2 rounded-lg transition"
                            title="Duyệt thành viên"
                          >
                            <UserCheck size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(user._id, user.fullName)}
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition"
                          title="Xóa thành viên"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MemberManager;