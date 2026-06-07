"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import api from "../../services/api";
import {
  Camera, CheckCircle, XCircle, Loader, RefreshCw,
  QrCode, Music, KeyRound, SwitchCamera, Flashlight
} from "lucide-react";
import toast from "react-hot-toast";
import jsQR from "jsqr";

interface RehearsalItem {
  _id: string;
  date: string;
  time: string;
  location: string;
  content?: string;
}

type Mode = "camera" | "manual";

export default function CheckIn() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlRehearsalId = params?.rehearsalId as string | undefined;
  const tokenFromUrl = searchParams?.get("token") || "";

  // Nếu URL đã có token sẵn (từ QR link), auto-submit luôn
  const [autoSubmitting, setAutoSubmitting] = useState(!!tokenFromUrl);
  const [mode, setMode] = useState<Mode>(tokenFromUrl ? "manual" : "camera");

  const [loading, setLoading] = useState<boolean>(false);
  const [availableRehearsals, setAvailableRehearsals] = useState<RehearsalItem[]>([]);
  const [selectedRehearsal, setSelectedRehearsal] = useState<string>("");
  const [manualToken, setManualToken] = useState<string>(tokenFromUrl);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    status?: string;
    fine?: number;
  } | null>(null);

  // Camera QR scanner refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [scanning, setScanning] = useState(false);

  // Nạp danh sách buổi tập
  useEffect(() => {
    if (urlRehearsalId) {
      setSelectedRehearsal(urlRehearsalId);
      return;
    }
    const fetchRehearsals = async () => {
      try {
        const res = await api.get("/rehearsals");
        setAvailableRehearsals(res.data || []);
        if (res.data?.length > 0) setSelectedRehearsal(res.data[0]._id);
      } catch {
        console.error("Lỗi nạp danh sách tập");
      }
    };
    fetchRehearsals();
  }, [urlRehearsalId]);

  // Auto-submit nếu có token từ URL
  useEffect(() => {
    if (tokenFromUrl && selectedRehearsal) {
      handleCheckInWithToken(tokenFromUrl, selectedRehearsal);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenFromUrl, selectedRehearsal]);

  // Khởi động camera
  const startCamera = useCallback(async () => {
    setCameraError("");
    setCameraReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraReady(true);
          setScanning(true);
        };
      }
    } catch (err: any) {
      setCameraError(
        err.name === "NotAllowedError"
          ? "Bạn chưa cấp quyền truy cập camera. Vui lòng cho phép quyền camera và thử lại."
          : "Không thể mở camera. Vui lòng kiểm tra thiết bị hoặc dùng tab Nhập Mã."
      );
    }
  }, []);

  // Dừng camera
  const stopCamera = useCallback(() => {
    if (scanLoopRef.current) cancelAnimationFrame(scanLoopRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraReady(false);
    setScanning(false);
  }, []);

  // Vòng lặp scan QR từ frame camera
  useEffect(() => {
    if (!scanning || !cameraReady) return;

    const scan = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        scanLoopRef.current = requestAnimationFrame(scan);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert"
      });

      if (code?.data) {
        handleQRDetected(code.data);
        return; // Dừng scan sau khi phát hiện
      }

      scanLoopRef.current = requestAnimationFrame(scan);
    };

    scanLoopRef.current = requestAnimationFrame(scan);
    return () => { if (scanLoopRef.current) cancelAnimationFrame(scanLoopRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning, cameraReady]);

  // Khởi động camera khi chuyển sang tab camera
  useEffect(() => {
    if (mode === "camera" && !result) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, result]);

  // Xử lý khi phát hiện QR
  const handleQRDetected = (data: string) => {
    setScanning(false);
    stopCamera();
    toast.success("Đã quét được mã QR! 📸");

    // Trích xuất token từ URL trong QR
    let token = data;
    try {
      const url = new URL(data);
      const t = url.searchParams.get("token");
      const rId = url.pathname.split("/checkin/")[1];
      if (t) token = t;
      if (rId && !selectedRehearsal) setSelectedRehearsal(rId);
    } catch {
      // data có thể là token thô
    }

    const rehearsalId = selectedRehearsal || urlRehearsalId || "";
    if (rehearsalId) {
      handleCheckInWithToken(token, rehearsalId);
    } else {
      // Không biết buổi tập, chuyển sang manual mode với token đã điền
      setManualToken(token);
      setMode("manual");
    }
  };

  // API điểm danh
  const handleCheckInWithToken = async (token: string, rehearsalId: string) => {
    if (!rehearsalId) { toast.error("Không xác định được buổi tập!"); return; }
    if (!token) { toast.error("Token không hợp lệ!"); return; }

    setLoading(true);
    setAutoSubmitting(false);
    try {
      const res = await api.post(`/rehearsals/${rehearsalId}/checkin`, { token: token.trim() });
      setResult({
        success: true,
        message: res.data.message || "Điểm danh thành công!",
        status: res.data.status,
        fine: res.data.fine
      });
      toast.success("Điểm danh thành công! 🎉");
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Mã QR hết hạn hoặc không hợp lệ. Vui lòng thử lại!";
      setResult({ success: false, message: errMsg });
      toast.error("Điểm danh thất bại");
    } finally {
      setLoading(false);
    }
  };

  // Submit từ form nhập tay
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rehearsalId = selectedRehearsal || urlRehearsalId || "";
    handleCheckInWithToken(manualToken, rehearsalId);
  };

  const resetAll = () => {
    setManualToken("");
    setResult(null);
    setMode("camera");
    if (urlRehearsalId) router.push("/checkin");
  };

  // ─── RENDER ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-50" />
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-indigo-200/30 rounded-full filter blur-[100px]" />
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-fuchsia-200/20 rounded-full filter blur-[100px]" />

      <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-[36px] border border-slate-200 shadow-2xl shadow-slate-200/25 relative z-10 overflow-hidden">

        {/* Header */}
        <div className="px-7 pt-7 pb-5 text-center space-y-2 border-b border-slate-100">
          <div className="bg-gradient-to-tr from-indigo-600 to-fuchsia-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20 mb-3">
            <Camera size={26} />
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-slate-800">Điểm Danh Tập Ráp</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Quét mã QR hoặc nhập token từ Admin
          </p>
        </div>

        {/* Auto-submitting loader */}
        {autoSubmitting && (
          <div className="px-7 py-12 flex flex-col items-center gap-3">
            <Loader className="animate-spin text-indigo-600" size={32} />
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Đang xác thực điểm danh...</p>
          </div>
        )}

        {/* Loading */}
        {loading && !autoSubmitting && (
          <div className="px-7 py-12 flex flex-col items-center gap-3">
            <Loader className="animate-spin text-indigo-600" size={32} />
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Đang gửi điểm danh...</p>
          </div>
        )}

        {/* KẾT QUẢ */}
        {result && !loading && (
          <div className="px-7 py-8 space-y-5 text-center animate-fade-in">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto border-2 ${
              result.success
                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                : "bg-rose-50 text-rose-600 border-rose-200"
            }`}>
              {result.success ? <CheckCircle size={38} /> : <XCircle size={38} />}
            </div>
            <div>
              <h3 className={`font-black text-base mb-1 ${result.success ? "text-emerald-700" : "text-rose-600"}`}>
                {result.success ? "Điểm Danh Thành Công!" : "Điểm Danh Thất Bại"}
              </h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">{result.message}</p>
            </div>

            {result.success && result.status && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2.5 text-xs font-bold">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 uppercase text-[9px] tracking-wider">Trạng thái</span>
                  <span className={`uppercase font-black px-2.5 py-1 rounded-lg text-[10px] ${
                    result.status === "present"
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      : "bg-amber-50 text-amber-600 border border-amber-200"
                  }`}>
                    {result.status === "present" ? "✅ Đúng giờ" : "⏰ Đi muộn"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 uppercase text-[9px] tracking-wider">Phạt đi trễ</span>
                  <span className={result.fine ? "text-rose-600 font-black" : "text-emerald-600"}>
                    {result.fine ? `${result.fine.toLocaleString("vi-VN")}đ` : "Không có"}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={resetAll}
              className="w-full py-3.5 bg-slate-900 hover:bg-black text-white font-black rounded-2xl shadow-md transition active:scale-[0.98] flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
            >
              <RefreshCw size={14} /> Điểm Danh Lại
            </button>
          </div>
        )}

        {/* FORM CHÍNH */}
        {!result && !loading && !autoSubmitting && (
          <div className="p-5 sm:p-7 space-y-5">

            {/* Chọn buổi tập */}
            {!urlRehearsalId && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Buổi Tập Ráp *
                </label>
                {availableRehearsals.length === 0 ? (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400">
                    <Music size={18} className="shrink-0" />
                    <span className="text-xs font-semibold italic">Chưa có lịch tập nào</span>
                  </div>
                ) : (
                  <select
                    value={selectedRehearsal}
                    onChange={(e) => setSelectedRehearsal(e.target.value)}
                    className="w-full p-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-2xl outline-none font-bold text-slate-800 text-sm transition focus:ring-2 ring-indigo-500/25 cursor-pointer"
                  >
                    {availableRehearsals.map((r) => (
                      <option key={r._id} value={r._id}>
                        {new Date(r.date).toLocaleDateString("vi-VN")} — {r.time} · {r.location}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Mode Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 gap-1">
              <button
                onClick={() => setMode("camera")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wide transition ${
                  mode === "camera"
                    ? "bg-white text-indigo-650 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Camera size={14} /> Quét QR
              </button>
              <button
                onClick={() => setMode("manual")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wide transition ${
                  mode === "manual"
                    ? "bg-white text-indigo-650 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <KeyRound size={14} /> Nhập Mã
              </button>
            </div>

            {/* ── TAB CAMERA ── */}
            {mode === "camera" && (
              <div className="space-y-4">
                <div className="relative w-full aspect-square bg-slate-900 rounded-3xl overflow-hidden border-2 border-slate-800 shadow-inner">
                  {/* Video feed */}
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  {/* Hidden canvas for jsQR */}
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Overlay scanner frame */}
                  {cameraReady && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      {/* Dimmed border */}
                      <div className="absolute inset-0 bg-black/30" />
                      {/* Scanner box */}
                      <div className="relative w-56 h-56 z-10">
                        {/* Corner marks */}
                        {[
                          "top-0 left-0 border-t-4 border-l-4 rounded-tl-xl",
                          "top-0 right-0 border-t-4 border-r-4 rounded-tr-xl",
                          "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-xl",
                          "bottom-0 right-0 border-b-4 border-r-4 rounded-br-xl"
                        ].map((cls, i) => (
                          <div key={i} className={`absolute w-10 h-10 border-indigo-400 ${cls}`} />
                        ))}
                        {/* Scanning line */}
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent animate-[moveDown_2s_linear_infinite]" />
                      </div>
                      <p className="absolute bottom-4 left-0 right-0 text-center text-[10px] font-black text-white/80 uppercase tracking-widest z-10">
                        Hướng camera vào mã QR
                      </p>
                    </div>
                  )}

                  {/* Camera loading */}
                  {!cameraReady && !cameraError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900">
                      <Loader className="animate-spin text-indigo-400" size={28} />
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Đang mở camera...</p>
                    </div>
                  )}

                  {/* Camera error */}
                  {cameraError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900 p-6 text-center">
                      <XCircle className="text-rose-500" size={32} />
                      <p className="text-xs text-slate-400 font-semibold leading-relaxed">{cameraError}</p>
                      <button
                        onClick={startCamera}
                        className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs transition hover:bg-indigo-700"
                      >
                        Thử lại
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-center text-[10px] text-slate-400 font-medium">
                  Không quét được? Chuyển sang tab{" "}
                  <button onClick={() => setMode("manual")} className="text-indigo-600 font-black underline">
                    Nhập Mã
                  </button>{" "}
                  và dán token do Admin gửi.
                </p>
              </div>
            )}

            {/* ── TAB NHẬP MÃ ── */}
            {mode === "manual" && (
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Mã Token điểm danh *
                  </label>
                  <div className="relative">
                    <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      required
                      placeholder="Dán mã token do Admin sao chép & gửi..."
                      className="w-full pl-12 pr-4 py-4 border border-slate-200 bg-slate-50 focus:bg-white rounded-2xl outline-none font-bold text-slate-800 text-sm transition focus:ring-2 ring-indigo-500/25 shadow-inner"
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium pl-1">
                    Admin tạo mã từ: Lịch trình → Lịch Tập Ráp → nút <strong>Mã QR</strong> → <strong>Sao chép Token</strong>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!manualToken.trim() || !selectedRehearsal}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/15 transition active:scale-[0.98] flex items-center justify-center gap-2 text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle size={16} /> Xác Nhận Điểm Danh
                </button>
              </form>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest border-t border-slate-100 py-4">
          Sắc Band — Hệ thống điểm danh nội bộ
        </div>
      </div>

      {/* Scanning line animation */}
      <style>{`
        @keyframes moveDown {
          0% { top: 0; }
          100% { top: calc(100% - 2px); }
        }
      `}</style>
    </div>
  );
}
