"use client";

import React, { createContext, useState, useRef, useEffect, ReactNode } from "react";

export interface Track {
  url: string;
  title: string;
}

interface AudioContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  playTrack: (url: string, title: string) => void;
  togglePlay: () => void;
  closePlayer: () => void;
}

export const AudioContext = createContext<AudioContextType>({
  currentTrack: null,
  isPlaying: false,
  playTrack: () => {},
  togglePlay: () => {},
  closePlayer: () => {}
});

export const AudioProvider = ({ children }: { children: ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Khởi tạo đối tượng Audio chỉ chạy phía client
  useEffect(() => {
    audioRef.current = new Audio();
    
    const handleEnded = () => setIsPlaying(false);
    audioRef.current.addEventListener("ended", handleEnded);

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("ended", handleEnded);
        audioRef.current.pause();
      }
    };
  }, []);

  const playTrack = (url: string, title: string) => {
    if (!audioRef.current) return;

    const getBaseUrl = (): string => {
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return 'http://localhost:5000';
        }
      }
      return 'https://band-manager-s9tm.onrender.com';
    };

    const cleanedUrl = url.startsWith('/') ? url.substring(1) : url;
    const fullUrl = url.includes('http') ? url : `${getBaseUrl()}/${cleanedUrl}`;

    // Nếu bấm lại bài đang phát
    if (currentTrack?.url === fullUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(err => console.error("Lỗi chạy nhạc:", err));
        setIsPlaying(true);
      }
      return;
    }

    // Phát bài mới
    audioRef.current.src = fullUrl;
    audioRef.current.play().catch(err => console.error("Lỗi chạy nhạc:", err));
    setCurrentTrack({ url: fullUrl, title });
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (!currentTrack || !audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => console.error("Lỗi chạy nhạc:", err));
    }
    setIsPlaying(!isPlaying);
  };

  const closePlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setCurrentTrack(null);
    setIsPlaying(false);
  };

  return (
    <AudioContext.Provider value={{ currentTrack, isPlaying, playTrack, togglePlay, closePlayer }}>
      {children}
    </AudioContext.Provider>
  );
};
