"use client";
// src/components/detail/AudioBriefPlayer.tsx
import { useState, useEffect } from "react";
import { isSpeechSupported, playAudioBrief, stopAudioBrief } from "@/lib/speech";

export default function AudioBriefPlayer({ spokenBrief }: { spokenBrief: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(isSpeechSupported());
    return () => stopAudioBrief();
  }, []);

  useEffect(() => {
    stopAudioBrief();
    setIsPlaying(false);
  }, [spokenBrief]);

  if (!supported || !spokenBrief) return null;

  const togglePlayback = () => {
    if (isPlaying) {
      stopAudioBrief();
      setIsPlaying(false);
    } else {
      playAudioBrief(
        spokenBrief,
        () => setIsPlaying(true),
        () => setIsPlaying(false),
        () => setIsPlaying(false)
      );
    }
  };

  return (
    <button
      onClick={togglePlayback}
      type="button"
      className={`h-7 w-7 rounded-full flex items-center justify-center transition shadow-2xs active:scale-95 ${
        isPlaying
          ? "bg-red-50 text-red-600 border border-red-200 animate-pulse"
          : "bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
      }`}
      title={isPlaying ? "Stop audio brief" : "Listen to 15-sec audio brief"}
    >
      {isPlaying ? (
        <span className="text-xs">⏹</span>
      ) : (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zm-2.5 9-4-4H4v6h3.5l4 4V3.23l-4 4zm4.5-.23c0-1.77-1.02-3.29-2.5-3.84v7.68c1.48-.55 2.5-2.07 2.5-3.84z" />
        </svg>
      )}
    </button>
  );
}
