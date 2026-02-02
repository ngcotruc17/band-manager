import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import {
  Users,
  Search,
  Key,
  Trash2,
  CheckCircle,
  XCircle,
  Shield,
  User,
  Mail,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

const MemberManager = () => {
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useContext(AuthContext);

  const BASE_URL = "https://band-manager-s9tm.onrender.com/api/auth";
  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const fetchMembers = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/users`, getHeaders());
      setMembers(res.data);
    } catch (err) {
      toast.error("Lỗi tải danh sách");
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // --- CÁC HÀNH ĐỘNG ---

  // 1. Duyệt thành viên
  const handleApprove = async (id, name) => {
    try {
      await axios.put(`${BASE_URL}/users/${id}/approve`, {}, getHeaders());
      toast.success(`Đã duyệt: ${name} 🎉`);
      fetchMembers();
    } catch (err) {
      toast.error("Lỗi duyệt");
    }
  };

  // 2. Reset mật khẩu
  const handleResetPassword = async (id, name) => {
    if (!window.confirm(`Reset mật khẩu của "${name}" về 123456?`)) return;
    try {
      await axios.put(
        `${BASE_URL}/users/${id}/reset-password`,
        {},
        getHeaders(),
      );
      toast.success(`Đã reset pass cho ${name}`);
      fetchMembers();
    } catch (err) {
      toast.error("Lỗi reset pass");
    }
  };

  // 3. Xóa thành viên
  const handleDelete = async (id, name) => {
    if (
      !window.confirm(
        `⚠️ CẢNH BÁO: Bạn có chắc muốn XÓA VĨNH VIỄN thành viên "${name}" không?`,
      )
    )
      return;
    try {
      await axios.delete(`${BASE_URL}/users/${id}`, getHeaders());
      toast.success(`Đã xóa: ${name}`);
      fetchMembers();
    } catch (err) {
      toast.error("Lỗi xóa user");
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      (m.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.email || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3">
              <span className="bg-purple-600 text-white p-2 rounded-xl shadow-lg shadow-purple-300">
                <Users size={28} />
              </span>
              Quản Lý Nhân Sự
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Phân quyền & Kiểm duyệt thành viên
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              className="w-full pl-10 pr-4 py-3 rounded-xl border-none shadow-sm focus:ring-2 ring-purple-500"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

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
                {filteredMembers.map((m) => (
                  <tr
                    key={m._id}
                    className="hover:bg-purple-50/50 transition duration-200 group"
                  >
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm ${m.isApproved ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-500"}`}
                        >
                          {m.fullName?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">
                            {m.fullName}
                          </p>
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Mail size={10} /> {m.email || m.username}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-5">
                      {m.role === "admin" ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600 border border-red-200">
                          <Shield size={12} /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-600 border border-blue-200">
                          <User size={12} /> Member
                        </span>
                      )}
                    </td>

                    <td className="p-5">
                      {/* Logic hiển thị trạng thái phức tạp */}
                      {!m.isApproved && m.role !== "admin" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded border bg-yellow-100 text-yellow-700 border-yellow-200 text-xs font-bold animate-pulse">
                          <AlertTriangle size={12} /> Chờ duyệt
                        </span>
                      ) : m.mustChangePassword ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded border bg-orange-50 text-orange-600 border-orange-200 text-xs font-bold">
                          ⚠️ Cần đổi pass
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded border bg-green-50 text-green-600 border-green-200 text-xs font-bold">
                          ✅ Ổn định
                        </span>
                      )}
                    </td>

                    <td className="p-5 text-center">
                      {user._id !== m._id && (
                        <div className="flex items-center justify-center gap-2">
                          {/* 1. Nút DUYỆT (Chỉ hiện khi chưa duyệt) */}
                          {!m.isApproved && (
                            <button
                              onClick={() => handleApprove(m._id, m.fullName)}
                              className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-600 hover:text-white transition shadow-sm"
                              title="Duyệt thành viên"
                            >
                              <CheckCircle size={18} />
                            </button>
                          )}

                          {/* 2. Nút RESET PASS (Chỉ hiện khi đã duyệt) */}
                          {m.isApproved && (
                            <button
                              onClick={() =>
                                handleResetPassword(m._id, m.fullName)
                              }
                              className="p-2 rounded-lg bg-yellow-100 text-yellow-600 hover:bg-yellow-500 hover:text-white transition shadow-sm"
                              title="Reset Mật khẩu"
                            >
                              <Key size={18} />
                            </button>
                          )}

                          {/* 3. Nút XÓA (Luôn hiện) */}
                          <button
                            onClick={() => handleDelete(m._id, m.fullName)}
                            className="p-2 rounded-lg bg-gray-100 text-gray-400 hover:bg-red-500 hover:text-white transition shadow-sm"
                            title="Xóa thành viên"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberManager;
