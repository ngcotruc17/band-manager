"use client";

import React, { useContext, useState } from "react";
import { AudioContext } from "../context/AudioContext";
import { 
  Play, Pause, X, Music, RotateCcw, RotateCw, 
  Volume2, VolumeX, Disc3, Radio, Sparkles 
} from "lucide-react";

export default function GlobalAudioPlayer() {
  const { 
    currentTrack, 
    isPlaying, 
    currentTime, 
    duration, 
    volume, 
    togglePlay, 
    seek, 
    skipTime, 
    setVolume, 
    closePlayer, 
    formatTime 
  } = useContext(AudioContext);

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(Number(e.target.value));
  };

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 px-3 sm:px-6 pointer-events-none">
      {/* 🍏 Apple Dynamic Island / iOS Liquid Glass Floating Player */}
      <div className="max-w-2xl mx-auto bg-slate-950/85 backdrop-blur-3xl rounded-3xl p-3.5 sm:px-5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] border border-white/15 pointer-events-auto transition-all">
        
        {/* Top Progress Scrub Bar */}
        <div className="w-full flex items-center gap-2.5 mb-2 px-1">
          <span className="text-[10px] font-mono text-slate-400 font-semibold w-8 text-right shrink-0">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1 flex items-center group">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeekChange}
              className="w-full h-1.5 bg-white/15 rounded-full appearance-none cursor-pointer accent-indigo-400 hover:h-2 transition-all"
            />
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full pointer-events-none group-hover:h-2 transition-all"
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-slate-400 font-semibold w-8 shrink-0">
            {formatTime(duration)}
          </span>
        </div>

        {/* Player Controls & Track Info */}
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          
          {/* Track Info & Vinyl Art */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-900 to-slate-900 flex items-center justify-center shrink-0 border border-white/20 shadow-md ${isPlaying ? "ring-2 ring-indigo-500/40" : ""}`}>
              <div className={`w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white ${isPlaying ? "animate-spin" : ""}`} style={{ animationDuration: "6s" }}>
                <Music size={10} />
              </div>
            </div>

            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="flex items-end gap-0.5 h-2.5">
                  <span className={`w-0.5 bg-indigo-400 rounded-full ${isPlaying ? "equalizer-bar-1" : "h-1"}`} />
                  <span className={`w-0.5 bg-indigo-400 rounded-full ${isPlaying ? "equalizer-bar-2" : "h-2"}`} />
                  <span className={`w-0.5 bg-indigo-400 rounded-full ${isPlaying ? "equalizer-bar-3" : "h-1.5"}`} />
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300">
                  BEAT AUDIO
                </span>
                {currentTrack.tone && (
                  <span className="px-1.5 py-0.2 text-[8px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full">
                    Tone {currentTrack.tone}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-bold text-white truncate mt-0.5 tracking-tight">
                {currentTrack.title}
              </p>
            </div>
          </div>

          {/* Core Transport Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <button
              onClick={() => skipTime(-10)}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
              title="Lùi 10 giây"
            >
              <RotateCcw size={15} />
            </button>

            <button 
              onClick={togglePlay} 
              className="w-9 h-9 rounded-2xl bg-white text-slate-900 flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer font-black"
            >
              {isPlaying ? <Pause size={16} className="fill-slate-900" /> : <Play size={16} className="fill-slate-900 ml-0.5" />}
            </button>

            <button
              onClick={() => skipTime(10)}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
              title="Tới 10 giây"
            >
              <RotateCw size={15} />
            </button>
          </div>

          {/* Volume & Close */}
          <div className="flex items-center gap-1 shrink-0">
            <div className="relative">
              <button
                onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                title="Âm lượng"
              >
                {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>

              {showVolumeSlider && (
                <div className="absolute bottom-full mb-3 right-0 bg-slate-900/90 backdrop-blur-2xl border border-white/20 p-3 rounded-2xl shadow-2xl flex items-center gap-2 z-50">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-20 accent-indigo-400 h-1.5 bg-slate-700 rounded-full cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-slate-300 w-6">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
              )}
            </div>

            <button 
              onClick={closePlayer} 
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              aria-label="Đóng trình phát"
            >
              <X size={16} />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
