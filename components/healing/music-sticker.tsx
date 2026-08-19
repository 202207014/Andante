import React, { useState } from "react";

interface MusicStickerProps {
  title?: string;
  tags?: string[];
  genre?: string;
  bpm?: string;
  moodTag?: string;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  audioUrl?: string;
  className?: string;
}

export const MusicSticker: React.FC<MusicStickerProps> = ({
  title = "Lo-Fi Dreams",
  tags = ["Chill Hop", "70 BPM", "평온함", "Healing"],
  genre = "Lo-Fi / Acoustic",
  bpm = "72 BPM",
  moodTag = "평온함",
  isPlaying: externalIsPlaying,
  onTogglePlay,
  audioUrl,
  className = "",
}) => {
  const [internalIsPlaying, setInternalIsPlaying] = useState(false);
  const isPlaying = externalIsPlaying ?? internalIsPlaying;

  const handlePlayClick = () => {
    if (onTogglePlay) {
      onTogglePlay();
    } else {
      setInternalIsPlaying(!internalIsPlaying);
    }
  };

  const displayTags = tags.length > 0 ? tags : [genre, bpm, moodTag];

  return (
    <div
      className={`rounded-3xl border-2 border-black bg-card shadow-brutal p-5 text-foreground theme-transition relative ${className}`}
    >
      {/* Top Chips (Genre, BPM, Mood Tags) */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {displayTags.map((tag, idx) => (
          <span
            key={idx}
            className={`inline-block px-3 py-1 text-xs font-bold rounded-full border border-black shadow-brutal-sm text-black ${
              idx % 3 === 0
                ? "bg-[var(--pastel-sky)]"
                : idx % 3 === 1
                ? "bg-[var(--pastel-yellow)]"
                : "bg-[var(--pastel-mint)]"
            }`}
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Main Music Sticker Player Content */}
      <div className="flex items-center gap-4 bg-[var(--pastel-lilac)]/40 p-4 rounded-2xl border-2 border-black shadow-brutal-sm">
        {/* Animated Spinning Vinyl LP Disc */}
        <div className="relative w-16 h-16 flex-shrink-0">
          <div
            className={`w-16 h-16 rounded-full bg-slate-900 border-2 border-black shadow-md flex items-center justify-center relative overflow-hidden ${
              isPlaying ? "vinyl-spin" : ""
            }`}
          >
            {/* Vinyl Grooves Effect */}
            <div className="absolute inset-1 rounded-full border border-slate-700 opacity-60"></div>
            <div className="absolute inset-3 rounded-full border border-slate-700 opacity-60"></div>
            {/* Center Label */}
            <div className="w-6 h-6 rounded-full bg-[var(--pastel-pink)] border border-black flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-black"></div>
            </div>
          </div>
        </div>

        {/* Info & Play Controls */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-black/60 uppercase tracking-wide">
            🎵 AI Music Sticker
          </div>
          <h4 className="text-base font-bold text-black truncate">{title}</h4>
          <p className="text-xs text-slate-700 truncate">{genre} · {bpm}</p>
        </div>

        {/* Interactive Play/Pause Button */}
        <button
          onClick={handlePlayClick}
          className="w-11 h-11 rounded-full border-2 border-black bg-[var(--pastel-mint)] shadow-brutal-sm active-press flex items-center justify-center text-black font-extrabold text-lg flex-shrink-0"
          aria-label={isPlaying ? "Pause music" : "Play music"}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>
      </div>
    </div>
  );
};

export default MusicSticker;
