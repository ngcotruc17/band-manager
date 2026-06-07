"use client";

import React, { useContext } from "react";
import { AudioContext } from "../context/AudioContext";
import { Play, Pause, X, Music } from "lucide-react";

export default function GlobalAudioPlayer() {
  const { currentTrack, isPlaying, togglePlay, closePlayer } = useContext(AudioContext);

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 w-full z-50 animate-slide-up">
      {/* Thanh viền gradient trang trí */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
      
      <div className="bg-white/95 backdrop-blur-md border-t border-slate-200/50 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] px-6 py-3.5 flex items-center justify-between">
        
        {/* Info Box */}
        <div className="flex items-center gap-3.5 flex-1 overflow-hidden">
          <div 
            style={{ animation: isPlaying ? 'spin 8s linear infinite' : 'none' }}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-tr from-purple-500 to-blue-500 text-white shadow-md"
          >
            <Music size={18} />
          </div>
          <div className="truncate">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mb-0.5">Đang phát Beat</p>
            <p className="text-xs font-black text-slate-800 truncate">{currentTrack.title}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button 
            onClick={togglePlay} 
            className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-black transition shadow-lg hover:scale-105 active:scale-95"
          >
            {isPlaying ? <Pause size={20} className="fill-white" /> : <Play size={20} className="fill-white ml-0.5" />}
          </button>
          
          <button 
            onClick={closePlayer} 
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
