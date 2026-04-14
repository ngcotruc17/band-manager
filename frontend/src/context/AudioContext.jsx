import { createContext, useState, useRef, useEffect } from "react";

export const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null); // { url, title }
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(new Audio());

  // Lắng nghe sự kiện kết thúc bài hát
  useEffect(() => {
    const audio = audioRef.current;
    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, []);

  const playTrack = (url, title) => {
    const fullUrl = url.includes('http') ? url : `https://band-manager-s9tm.onrender.com/${url}`;
    
    // Nếu bấm lại bài đang phát
    if (currentTrack?.url === fullUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

    // Phát bài mới
    audioRef.current.src = fullUrl;
    audioRef.current.play();
    setCurrentTrack({ url: fullUrl, title });
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (!currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const closePlayer = () => {
    audioRef.current.pause();
    setCurrentTrack(null);
    setIsPlaying(false);
  };

  return (
    <AudioContext.Provider value={{ currentTrack, isPlaying, playTrack, togglePlay, closePlayer }}>
      {children}
    </AudioContext.Provider>
  );
};