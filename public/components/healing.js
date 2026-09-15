// Andante Neo-Brutalism Healing Components (Browser Vanilla JS Version)

const AndanteComponents = {
  /**
   * Render PoemCard HTML string
   */
  renderPoemCard: function ({ title = "마음의 안단테", stanza1 = "", stanza2 = "" }) {
    return `
      <div class="brutal-card theme-transition text-foreground mb-6">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <span style="padding:4px 12px; font-size:12px; font-weight:bold; border-radius:999px; border:2px solid #000; background:var(--pastel-pink); box-shadow:2px 2px 0px #000; color:#000;">
            📜 AI 힐링 시 (Poem)
          </span>
          <span style="font-size:12px; color:#555; font-family:monospace;">Andante Verse</span>
        </div>
        <h3 style="font-size:18px; font-weight:bold; text-align:center; margin-bottom:16px; color:#000;">
          ${title}
        </h3>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:12px;">
          <div style="border-radius:16px; border:2px solid #000; background:rgba(247, 240, 190, 0.7); padding:14px; box-shadow:2px 2px 0px #000;">
            <div style="font-size:11px; font-weight:bold; color:rgba(0,0,0,0.6); margin-bottom:6px;">[ 1절 ]</div>
            <p style="white-space:pre-line; font-size:14px; line-height:1.6; color:#111; font-weight:500;">${stanza1}</p>
          </div>
          <div style="border-radius:16px; border:2px solid #000; background:rgba(235, 215, 255, 0.7); padding:14px; box-shadow:2px 2px 0px #000;">
            <div style="font-size:11px; font-weight:bold; color:rgba(0,0,0,0.6); margin-bottom:6px;">[ 2절 ]</div>
            <p style="white-space:pre-line; font-size:14px; line-height:1.6; color:#111; font-weight:500;">${stanza2}</p>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Render MusicSticker HTML string
   */
  renderMusicSticker: function ({ title = "Lo-Fi Dreams", artist = "Andante AI", image = "", tags = ["Lo-Fi", "72 BPM", "평온함"], isPlaying = false }) {
    const tagsHtml = tags.map((t, idx) => {
      const bg = idx % 3 === 0 ? "var(--pastel-sky)" : idx % 3 === 1 ? "var(--pastel-yellow)" : "var(--pastel-mint)";
      return `<span style="padding:4px 10px; font-size:11px; font-weight:bold; border-radius:999px; border:1px solid #000; background:${bg}; box-shadow:2px 2px 0px #000; color:#000; margin-right:6px;">#${t}</span>`;
    }).join('');

    const coverHtml = image 
        ? `<img src="${image}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />`
        : `<div style="width:20px; height:20px; border-radius:50%; background:var(--pastel-pink); border:1px solid #000; display:flex; align-items:center; justify-content:center;"><div style="width:6px; height:6px; border-radius:50%; background:#000;"></div></div>`;

    return `
      <div class="brutal-card theme-transition text-foreground mb-6">
        <div style="margin-bottom:12px; display:flex; flex-wrap:wrap; gap:4px;">
          ${tagsHtml}
        </div>
        <div style="display:flex; align-items:center; gap:16px; background:rgba(230, 215, 255, 0.4); padding:14px; border-radius:16px; border:2px solid #000; box-shadow:2px 2px 0px #000;">
          <div style="position:relative; width:56px; height:56px; flex-shrink:0;">
            <div class="${isPlaying ? 'vinyl-spin' : ''}" style="width:56px; height:56px; border-radius:50%; background:#1e293b; border:2px solid #000; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden;">
              ${coverHtml}
            </div>
          </div>
          <div style="flex:1; min-width:0;">
            <div style="font-size:11px; font-weight:bold; color:rgba(0,0,0,0.6);">🎵 ${artist}</div>
            <h4 style="font-size:16px; font-weight:bold; color:#000; margin:2px 0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${title}</h4>
          </div>
          <button id="sticker-play-btn" class="active-press" style="width:42px; height:42px; flex-shrink:0; border-radius:50%; border:2px solid #000; background:var(--pastel-mint); box-shadow:2px 2px 0px #000; font-size:16px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center;">
            ${isPlaying ? '⏸' : '▶'}
          </button>
        </div>
      </div>
    `;
  },

  /**
   * Render AICanvasCard HTML string
   */
  renderAICanvasCard: function ({ imageUrl = "", isLoading = false, isSaving = false }) {
    let contentHtml = '';
    if (isLoading) {
      contentHtml = `
        <div style="display:flex; flex-direction:column; align-items:center; gap:12px; color:white;">
          <div class="spinner"></div>
          <p style="font-size:14px; font-weight:bold;">AI가 그림을 그리는 중입니다...</p>
        </div>
      `;
    } else if (imageUrl) {
      contentHtml = `<img src="${imageUrl}" alt="AI Artwork" style="width:100%; height:100%; object-fit:cover; border-radius:12px;">`;
    } else {
      contentHtml = `<div style="text-align:center; color:#94a3b8;"><p style="font-size:32px; margin-bottom:8px;">🎨</p><p style="font-size:13px;">그림 표현하기 버튼을 누르면 인공지능 작품이 생성됩니다.</p></div>`;
    }

    return `
      <div class="brutal-card theme-transition text-foreground mb-6">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <span style="padding:4px 12px; font-size:12px; font-weight:bold; border-radius:999px; border:2px solid #000; background:var(--pastel-sky); box-shadow:2px 2px 0px #000; color:#000;">
            🖼️ AI 감성 캔버스 (Artwork)
          </span>
        </div>
        <div style="width:100%; aspect-ratio:4/3; border-radius:16px; border:2px solid #000; background:#0f172a; overflow:hidden; display:flex; align-items:center; justify-content:center; box-shadow:2px 2px 0px #000; margin-bottom:16px;">
          ${contentHtml}
        </div>
        </div>
      </div>
    `;
  }
};

if (typeof window !== 'undefined') {
  window.AndanteComponents = AndanteComponents;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AndanteComponents;
}
