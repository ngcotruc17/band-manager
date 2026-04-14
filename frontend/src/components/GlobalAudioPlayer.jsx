import { useContext } from "react";
import { AudioContext } from "../context/AudioContext";
import { Play, Pause, X, Music } from "lucide-react";

const GlobalAudioPlayer = () => {
  const { currentTrack, isPlaying, togglePlay, closePlayer } = useContext(AudioContext);

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 w-full z-50 animate-slide-up">
      {/* Thanh viền gradient trang trí */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
      
      <div className="bg-white/90 backdrop-blur-md border-t border-gray-200 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] px-4 py-3 flex items-center justify-between">
        
        {/* Info Box */}
        <div className="flex items-center gap-3 flex-1 overflow-hidden">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-tr from-purple-500 to-blue-500 text-white shadow-md ${isPlaying ? 'animate-spin-slow' : ''}`}>
            <Music size={18} />
          </div>
          <div className="truncate">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-0.5">Đang phát Beat</p>
            <p className="text-sm font-extrabold text-gray-800 truncate">{currentTrack.title}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button 
            onClick={togglePlay} 
            className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-black transition shadow-lg hover:scale-105 active:scale-95"
          >
            {isPlaying ? <Pause size={24} className="fill-white" /> : <Play size={24} className="fill-white ml-1" />}
          </button>
          
          <button 
            onClick={closePlayer} 
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalAudioPlayer;