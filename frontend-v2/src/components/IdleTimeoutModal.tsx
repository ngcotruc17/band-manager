"use client";

import React from "react";
import { Clock, AlertTriangle, RefreshCw, LogOut } from "lucide-react";

export interface IdleTimeoutModalProps {
  isOpen: boolean;
  countdown: number;
  onContinue: () => void;
  onLogout: () => void;
}

export default function IdleTimeoutModal({
  isOpen,
  countdown,
  onContinue,
  onLogout,
}: IdleTimeoutModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="idle-timeout-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in"
    >
      {/* 🍏 iOS / OneUI Fluid Frosted Glass Modal Container */}
      <div className="w-full max-w-md bg-white/95 backdrop-blur-3xl border border-white/80 shadow-[0_25px_60px_-15px_rgba(242,112,36,0.3)] rounded-3xl sm:rounded-[2rem] p-6 text-center animate-slide-up relative overflow-hidden transition-all">
        
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-b from-orange-400/20 via-amber-300/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        {/* Header Icon Badge with Pulse Animation */}
        <div className="relative mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-50 to-orange-100 border border-orange-200/80 flex items-center justify-center text-[#F27024] shadow-sm">
          <Clock size={32} className="animate-pulse" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center text-white">
            <AlertTriangle size={12} />
          </div>
        </div>

        {/* Modal Title */}
        <h3
          id="idle-timeout-title"
          className="text-xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2"
        >
          Cảnh Báo Hết Hạn Phiên
        </h3>

        {/* Modal Description with Exact Required Text */}
        <p className="text-sm text-slate-600 font-medium leading-relaxed mt-3">
          Bạn đã không thao tác trong 15 phút. Phiên đăng nhập sẽ tự đóng sau{" "}
          <span className="inline-block px-2.5 py-0.5 font-black text-rose-600 bg-rose-50 border border-rose-200 rounded-lg text-base tabular-nums shadow-2xs">
            {countdown}s
          </span>
          . Bấm Tiếp tục để duy trì phiên.
        </p>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onLogout}
            className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl font-bold text-xs text-slate-500 bg-slate-100 hover:bg-slate-200/80 transition cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl font-extrabold text-xs bg-gradient-to-tr from-[#F27024] via-[#FA8C16] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white shadow-md shadow-[#F27024]/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} />
            Tiếp tục
          </button>
        </div>
      </div>
    </div>
  );
}
