import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Html5QrcodeScanner } from "html5-qrcode";
import api from "../services/api";
import { Camera, RefreshCw, CheckCircle, XCircle, AlertTriangle, ArrowLeft, Loader, HelpCircle } from "lucide-react";
import toast from "react-hot-toast";

const CheckIn = () => {
  const { rehearsalId } = useParams();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token");
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { success: boolean, message: string, status?: string, fine?: number }
  const [scanning, setScanning] = useState(!rehearsalId);
  const [availableRehearsals, setAvailableRehearsals] = useState([]);
  const [selectedRehearsal, setSelectedRehearsal] = useState("");
  const [manualToken, setManualToken] = useState("");
  const scannerRef = useRef(null);

  // 1. Nếu có token và rehearsalId từ URL, gọi API check-in trực tiếp
  useEffect(() => {
    if (rehearsalId && tokenFromUrl) {
      handleAutoCheckIn(rehearsalId, tokenFromUrl);
    } else {
      fetchRehearsals();
    }
  }, [rehearsalId, tokenFromUrl]);

  // Khởi động Camera quét QR
  useEffect(() => {
    if (scanning && !rehearsalId && !result) {
      // Đợi DOM render qr-reader
      const timer = setTimeout(() => {
        startScanner();
      }, 500);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    }
  }, [scanning, rehearsalId, result]);

  const fetchRehearsals = async () => {
    try {
      const res = await api.get("/rehearsals");
      setAvailableRehearsals(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedRehearsal(res.data[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAutoCheckIn = async (rId, token) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post(`/rehearsals/${rId}/checkin`, { token });
      setResult({
        success: true,
        message: res.data.message,
        status: res.data.status,
        fine: res.data.fine
      });
      toast.success("Điểm danh thành công! 🎉");
    } catch (err) {
      setResult({
        success: false,
        message: err.response?.data?.message || "Lỗi điểm danh. Vui lòng quét lại mã QR mới!"
      });
      toast.error("Điểm danh thất bại 😢");
    } finally {
      setLoading(false);
    }
  };

  const startScanner = () => {
    if (scannerRef.current) return;

    try {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true
        },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          // Xử lý chuỗi QR code nhận được
          // URL có dạng: http://localhost:3000/checkin/REHEARSAL_ID?token=JWT_TOKEN
          try {
            const url = new URL(decodedText);
            const pathParts = url.pathname.split("/");
            const checkinIndex = pathParts.indexOf("checkin");
            if (checkinIndex !== -1 && pathParts[checkinIndex + 1]) {
              const rId = pathParts[checkinIndex + 1];
              const token = url.searchParams.get("token");
              if (rId && token) {
                scanner.clear();
                scannerRef.current = null;
                setScanning(false);
                handleAutoCheckIn(rId, token);
              } else {
                toast.error("Mã QR thiếu tham số điểm danh!");
              }
            } else {
              toast.error("Mã QR không đúng định dạng check-in!");
            }
          } catch (e) {
            // Không phải là URL, thử kiểm tra xem có phải token thuần túy không
            toast.error("Định dạng QR không đúng. Vui lòng quét mã QR từ admin.");
          }
        },
        (error) => {
          // Lỗi quét (xảy ra liên tục khi chưa thấy QR) - không cần báo toast
        }
      );

      scannerRef.current = scanner;
    } catch (err) {
      console.error("Camera error:", err);
      toast.error("Không thể khởi chạy camera");
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch (e) {
        console.error(e);
      }
      scannerRef.current = null;
    }
  };

  // Check-in thủ công (bằng cách paste token/nhập mã)
  const handleManualCheckIn = (e) => {
    e.preventDefault();
    if (!selectedRehearsal) return toast.error("Vui lòng chọn buổi tập");
    if (!manualToken) return toast.error("Vui lòng nhập token");
    handleAutoCheckIn(selectedRehearsal, manualToken);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 pt-6">
      <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
        
        {/* Nút quay lại */}
        <button 
          onClick={() => navigate("/rehearsals")}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm transition"
        >
          <ArrowLeft size={16}/> Quay lại danh sách tập
        </button>

        {/* TIÊU ĐỀ CHÍNH */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/50 shadow-sm text-center">
          <h1 className="text-2xl font-black text-slate-850 tracking-tight">
            ĐIỂM DANH BUỔI TẬP RÁP
          </h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1.5">
            Check-in nhanh bằng mã QR
          </p>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="bg-white rounded-3xl p-12 border border-slate-200/50 shadow-sm flex flex-col items-center justify-center space-y-4">
            <Loader className="animate-spin text-indigo-650" size={40} />
            <p className="text-xs text-slate-500 font-black uppercase tracking-wider animate-pulse">
              Đang xác thực thông tin check-in...
            </p>
          </div>
        )}

        {/* RESULT STATE */}
        {!loading && result && (
          <div className={`bg-white rounded-3xl p-8 border border-slate-200/50 shadow-sm text-center flex flex-col items-center ${result.success ? 'bg-gradient-to-br from-emerald-50/15 to-white' : 'bg-gradient-to-br from-rose-50/15 to-white'}`}>
            {result.success ? (
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4 border border-emerald-250">
                <CheckCircle size={36} />
              </div>
            ) : (
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-4 border border-rose-250">
                <XCircle size={36} />
              </div>
            )}
            
            <h2 className={`text-lg font-black ${result.success ? 'text-emerald-700' : 'text-rose-600'}`}>
              {result.success ? "Điểm Danh Thành Công" : "Điểm Danh Thất Bại"}
            </h2>
            <p className="text-sm font-bold text-slate-750 mt-3 max-w-sm">
              {result.message}
            </p>

            {result.success && result.fine > 0 && (
              <div className="mt-4 px-4 py-2 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl font-bold text-xs">
                💸 Phát sinh tiền phạt: {result.fine.toLocaleString()}đ (Vui lòng đóng phạt đúng hạn)
              </div>
            )}

            <div className="mt-8 flex gap-3 w-full">
              <button 
                onClick={() => {
                  setResult(null);
                  setScanning(true);
                  if (rehearsalId) {
                    navigate("/checkin");
                  }
                }}
                className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-black transition uppercase tracking-wider"
              >
                Tiếp tục quét
              </button>
              <button 
                onClick={() => navigate("/rehearsals")}
                className="flex-1 py-3 bg-slate-100 border border-slate-250 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition uppercase tracking-wider"
              >
                Về lịch tập
              </button>
            </div>
          </div>
        )}

        {/* SCANNER CONTAINER */}
        {!loading && !result && scanning && (
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/50 shadow-sm space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
               <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                 <Camera size={18} className="text-indigo-600" /> Quét bằng Camera thiết bị
               </h3>
               <button 
                 onClick={() => {
                   stopScanner();
                   setScanning(false);
                 }}
                 className="text-xs font-bold text-indigo-650 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition"
               >
                 Nhập thủ công
               </button>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-black aspect-square max-w-sm mx-auto shadow-inner border border-slate-800">
              <div id="qr-reader" className="w-full h-full border-none"></div>
              {/* Neon scanner overlay line */}
              <div className="absolute left-0 right-0 h-0.5 bg-indigo-500/80 animate-bounce top-1/2 shadow-[0_0_8px_#6366f1]"></div>
            </div>

            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center">
              Đặt mã QR điểm danh của Admin vào chính giữa khung hình
            </p>
          </div>
        )}

        {/* MANUAL INPUT FORM */}
        {!loading && !result && !scanning && (
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/50 shadow-sm space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
               <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                 <HelpCircle size={18} className="text-indigo-600" /> Điểm danh thủ công
               </h3>
               <button 
                 onClick={() => setScanning(true)}
                 className="text-xs font-bold text-indigo-650 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition flex items-center gap-1"
               >
                 <Camera size={13}/> Mở Camera quét
               </button>
            </div>

            <form onSubmit={handleManualCheckIn} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Buổi tập cần điểm danh</label>
                <select
                  value={selectedRehearsal}
                  onChange={(e) => setSelectedRehearsal(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ring-indigo-500/20 outline-none text-xs font-bold text-slate-800 transition"
                >
                  {availableRehearsals.map((r) => (
                    <option key={r._id} value={r._id}>
                      {new Date(r.date).toLocaleDateString('vi-VN')} - {r.time} ({r.location})
                    </option>
                  ))}
                  {availableRehearsals.length === 0 && (
                    <option value="">Không tìm thấy buổi tập nào</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Mã Token Check-In</label>
                <input
                  type="text"
                  placeholder="Dán token nhận được từ Admin vào đây..."
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 ring-indigo-500/20 outline-none text-xs text-slate-700 transition"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs transition uppercase tracking-wider shadow-md"
              >
                Gửi mã điểm danh
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckIn;
