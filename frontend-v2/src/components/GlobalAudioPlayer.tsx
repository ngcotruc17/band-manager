"use client";

import React, { useContext, useState } from "react";
import { AudioContext } from "../context/AudioContext";
import { 
  Play, Pause, X, Music, RotateCcw, RotateCw, 
  Volume2, VolumeX, Disc3, Radio 
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
    <div className="fixed bottom-3 left-0 right-0 z-50 px-3 sm:px-6 pointer-events-none">
      <div className="max-w-4xl mx-auto ui-glass-dark rounded-2xl p-3 sm:px-5 shadow-2xl shadow-black/40 border border-slate-700/60 pointer-events-auto backdrop-blur-xl">
        
        {/* Top Progress Scrub Bar */}
        <div className="w-full flex items-center gap-3 mb-2 px-1">
          <span className="text-[10px] font-mono text-slate-400 font-semibold w-9 text-right shrink-0">
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
              className="w-full h-1.5 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:h-2 transition-all"
            />
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-lg pointer-events-none group-hover:h-2 transition-all"
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-slate-400 font-semibold w-9 shrink-0">
            {formatTime(duration)}
          </span>
        </div>

        {/* Player Controls & Track Info */}
        <div className="flex items-center justify-between gap-4">
          
          {/* Track Info & Vinyl Art */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`w-11 h-11 rounded-full vinyl-disc flex items-center justify-center shrink-0 border border-white/20 ${isPlaying ? "spin-slow" : ""}`}>
              <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                <Music size={9} />
              </div>
            </div>

            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
                  <span className="flex items-end gap-0.5 h-2.5">
                    <span className={`w-0.5 bg-indigo-400 rounded-full ${isPlaying ? "equalizer-bar-1" : "h-1"}`} />
                    <span className={`w-0.5 bg-indigo-400 rounded-full ${isPlaying ? "equalizer-bar-2" : "h-2"}`} />
                    <span className={`w-0.5 bg-indigo-400 rounded-full ${isPlaying ? "equalizer-bar-3" : "h-1.5"}`} />
                  </span>
                  <span>ĐANG PHÁT BEAT SÂN KHẤU</span>
                </span>
                {currentTrack.tone && (
                  <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                    Tone {currentTrack.tone}
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-white truncate mt-0.5">
                {currentTrack.title}
              </p>
            </div>
          </div>

          {/* Core Transport Controls */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={() => skipTime(-10)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Lùi 10 giây"
            >
              <RotateCcw size={16} />
            </button>

            <button 
              onClick={togglePlay} 
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white flex items-center justify-center transition-all shadow-lg shadow-indigo-600/30 active:scale-95 cursor-pointer"
            >
              {isPlaying ? <Pause size={18} className="fill-white" /> : <Play size={18} className="fill-white ml-0.5" />}
            </button>

            <button
              onClick={() => skipTime(10)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Tới 10 giây"
            >
              <RotateCw size={16} />
            </button>
          </div>

          {/* Volume & Close */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <button
                onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                title="Âm lượng"
              >
                {volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
              </button>

              {showVolumeSlider && (
                <div className="absolute bottom-full mb-2 right-0 bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl flex items-center gap-2 z-50">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-20 accent-indigo-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-slate-300 w-6">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
              )}
            </div>

            <button 
              onClick={closePlayer} 
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              aria-label="Đóng trình phát"
            >
              <X size={17} />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
