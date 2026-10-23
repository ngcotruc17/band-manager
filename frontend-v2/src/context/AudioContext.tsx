"use client";

import React, { createContext, useState, useRef, useEffect, ReactNode } from "react";

export interface Track {
  url: string;
  title: string;
  artist?: string;
  tone?: string;
}

interface AudioContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playTrack: (url: string, title: string, artist?: string, tone?: string) => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  skipTime: (seconds: number) => void;
  setVolume: (vol: number) => void;
  closePlayer: () => void;
  formatTime: (seconds: number) => string;
}

export const AudioContext = createContext<AudioContextType>({
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  playTrack: () => {},
  togglePlay: () => {},
  seek: () => {},
  skipTime: () => {},
  setVolume: () => {},
  closePlayer: () => {},
  formatTime: () => "00:00"
});

export const AudioProvider = ({ children }: { children: ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleTimeUpdate = () => {
      if (audio) {
        setCurrentTime(audio.currentTime || 0);
      }
    };

    const handleLoadedMetadata = () => {
      if (audio) {
        setDuration(audio.duration || 0);
      }
    };

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.pause();
    };
  }, []);

  const getBaseUrl = (): string => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      const isLocal = hostname === "localhost" || hostname === "127.0.0.1" || /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
      if (isLocal) {
        return `http://${hostname}:5000`;
      }
    }
    return "https://band-manager-s9tm.onrender.com";
  };

  const playTrack = (url: string, title: string, artist?: string, tone?: string) => {
    if (!audioRef.current) return;

    const cleanedUrl = url.startsWith("/") ? url.substring(1) : url;
    const fullUrl = url.includes("http") ? url : `${getBaseUrl()}/${cleanedUrl}`;

    // Nếu bấm lại bài đang phát thì toggle
    if (currentTrack?.url === fullUrl) {
      togglePlay();
      return;
    }

    // Phát bài mới
    audioRef.current.src = fullUrl;
    audioRef.current.volume = volume;
    audioRef.current.play().catch(err => console.error("Lỗi chạy nhạc:", err));
    setCurrentTrack({ url: fullUrl, title, artist, tone });
    setIsPlaying(true);
    setCurrentTime(0);
  };

  const togglePlay = () => {
    if (!currentTrack || !audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => console.error("Lỗi chạy nhạc:", err));
      setIsPlaying(true);
    }
  };

  const seek = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(seconds, duration));
    setCurrentTime(audioRef.current.currentTime);
  };

  const skipTime = (seconds: number) => {
    if (!audioRef.current) return;
    seek(audioRef.current.currentTime + seconds);
  };

  const setVolume = (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
  };

  const closePlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setCurrentTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds <= 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        playTrack,
        togglePlay,
        seek,
        skipTime,
        setVolume,
        closePlayer,
        formatTime
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};
