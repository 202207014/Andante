import React from "react";

interface PoemCardProps {
  title?: string;
  stanza1: string;
  stanza2: string;
  className?: string;
}

export const PoemCard: React.FC<PoemCardProps> = ({
  title = "마음의 안단테",
  stanza1,
  stanza2,
  className = "",
}) => {
  return (
    <div
      className={`rounded-3xl border-2 border-black bg-card shadow-brutal p-6 text-foreground theme-transition relative overflow-hidden ${className}`}
    >
      {/* Header Accent Badge */}
      <div className="flex items-center justify-between mb-4">
        <span className="inline-block px-3 py-1 text-xs font-bold rounded-full border border-black bg-[var(--pastel-pink)] shadow-brutal-sm text-black">
          📜 AI 힐링 시 (Poem)
        </span>
        <span className="text-xs text-muted-foreground font-mono">Andante Verse</span>
      </div>

      {/* Poem Title */}
      <h3 className="text-xl font-bold text-center mb-6 tracking-tight text-black">
        {title}
      </h3>

      {/* Stanzas Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stanza 1 */}
        <div className="rounded-2xl border-2 border-black bg-[var(--pastel-yellow)]/50 p-4 shadow-brutal-sm flex flex-col justify-between">
          <div className="text-xs font-bold text-black/60 mb-2 uppercase tracking-wider">
            [ 1절 ]
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-900 font-medium">
            {stanza1 || "바람이 지나간 자리에\n느린 마음 하나 보듬어 두고"}
          </p>
        </div>

        {/* Stanza 2 */}
        <div className="rounded-2xl border-2 border-black bg-[var(--pastel-lilac)]/50 p-4 shadow-brutal-sm flex flex-col justify-between">
          <div className="text-xs font-bold text-black/60 mb-2 uppercase tracking-wider">
            [ 2절 ]
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-900 font-medium">
            {stanza2 || "고요한 쉼표 하나 찍어줄 때\n비로소 피어나는 평온함."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PoemCard;
