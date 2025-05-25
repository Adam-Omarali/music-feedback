"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";

interface AudioPlayerProps {
  url: string;
  title: string;
}

export function AudioPlayer({ url, title }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => setDuration(audio.duration);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, [url]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progress = duration ? Math.min(currentTime / duration, 1) : 0;

  return (
    <div className="w-full flex flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-2">
        {title}
      </h2>
      <div className="flex items-center justify-center w-full gap-6">
        <button
          onClick={togglePlay}
          className="rounded-full flex items-center justify-center transition hover:scale-105 focus:outline-none h-10 w-10 p-0"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4 text-blue-700" />
          ) : (
            <Play className="h-4 w-4 text-blue-700" />
          )}
        </button>
        <div className="w-full h-12 min-w-[220px] max-w-2xl flex items-center">
          <div className="relative w-full flex items-center">
            <div className="w-full h-1 rounded-full bg-blue-100" />
            <div
              className="absolute h-1 rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
        <audio ref={audioRef} src={url} preload="auto" />
      </div>
    </div>
  );
}
