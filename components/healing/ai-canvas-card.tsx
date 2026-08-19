import React from "react";

interface AICanvasCardProps {
  imageUrl?: string;
  onSaveDiary?: () => void;
  onShareBoard?: () => void;
  isSaving?: boolean;
  isLoading?: boolean;
  className?: string;
}

export const AICanvasCard: React.FC<AICanvasCardProps> = ({
  imageUrl,
  onSaveDiary,
  onShareBoard,
  isSaving = false,
  isLoading = false,
  className = "",
}) => {
  return (
    <div
      className={`rounded-3xl border-2 border-black bg-card shadow-brutal p-6 text-foreground theme-transition relative ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="inline-block px-3 py-1 text-xs font-bold rounded-full border border-black bg-[var(--pastel-sky)] shadow-brutal-sm text-black">
          🖼️ AI 감성 캔버스 (Artwork)
        </span>
        <span className="text-xs text-muted-foreground font-mono">FLUX.1 Art</span>
      </div>

      {/* Image Output Area */}
      <div className="relative w-full aspect-square md:aspect-[4/3] rounded-2xl border-2 border-black bg-slate-900 overflow-hidden flex items-center justify-center shadow-brutal-sm mb-5">
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 p-4 text-center">
            <div className="w-10 h-10 border-4 border-[var(--pastel-pink)] border-t-black rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-white">
              AI가 감성을 화폭에 담는 중입니다...
            </p>
          </div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt="AI Generated Artwork"
            className="w-full h-full object-cover transition-all duration-500 hover:scale-105"
          />
        ) : (
          <div className="text-center p-6 text-slate-400">
            <p className="text-3xl mb-2">🎨</p>
            <p className="text-sm font-medium">
              감성 분석 후 맞춤형 그림이 이곳에 그려집니다.
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons: Save & Share */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onSaveDiary}
          disabled={!imageUrl || isSaving || isLoading}
          className="flex-1 py-3 px-4 rounded-2xl border-2 border-black bg-[var(--pastel-pink)] shadow-brutal-sm active-press font-bold text-black text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>💾</span>
          <span>{isSaving ? "저장 중..." : "내 일기장에 저장"}</span>
        </button>

        <button
          onClick={onShareBoard}
          disabled={!imageUrl || isLoading}
          className="flex-1 py-3 px-4 rounded-2xl border-2 border-black bg-[var(--pastel-yellow)] shadow-brutal-sm active-press font-bold text-black text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>🌐</span>
          <span>공유 게시판 공유</span>
        </button>
      </div>
    </div>
  );
};

export default AICanvasCard;
