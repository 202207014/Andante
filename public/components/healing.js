// Andante Neo-Brutalism Healing Components (Browser Vanilla JS Version)

const AndanteComponents = {
  /**
   * Render PoemCard HTML string
   */
  renderPoemCard: function ({ title = "마음의 안단테", stanza1 = "", stanza2 = "" }) {
    return `
      <div class="theme-transition mb-6" style="margin: 0 auto; max-width: 600px; background-color: #fdfbf7; border-radius: 24px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; text-align: center; position: relative; overflow: hidden;">
        <!-- 은은한 쿼트 장식 -->
        <div style="position: absolute; top: -10px; left: 24px; font-size: 80px; color: #e7e5e4; opacity: 0.5; font-family: serif; line-height: 1; pointer-events: none;">"</div>
        
        <div style="position: relative; z-index: 1;">
            <!-- 메타 뱃지 (옵션) -->
            <div style="margin-bottom: 24px;">
              <span style="padding: 4px 12px; font-size: 11px; font-weight: bold; border-radius: 999px; background: rgba(0,0,0,0.05); color: #78716c; letter-spacing: 0.5px;">
                AI 힐링 시 (Poem)
              </span>
            </div>
            
            <!-- 시 제목 -->
            <h3 style="font-size: 26px; font-weight: 700; color: #292524; margin-bottom: 32px; letter-spacing: 0.03em; font-family: 'Ownglyph_LeeSeoyun', 'KoPub Batang', serif, cursive; word-break: keep-all;">
              ${title}
            </h3>
            
            <!-- 1절 -->
            <p class="poem-content" style="white-space: pre-line; font-size: 20px; line-height: 2.2; color: #44403c; font-weight: 400; font-family: 'Ownglyph_LeeSeoyun', 'KoPub Batang', serif, cursive; word-break: keep-all; letter-spacing: 0.01em;">
              ${stanza1}
            </p>
            
            <!-- 구분 여백 -->
            <div style="width: 40px; height: 1px; background-color: #d6d3d1; margin: 32px auto;"></div>
            
            <!-- 2절 -->
            <p class="poem-content" style="white-space: pre-line; font-size: 20px; line-height: 2.2; color: #44403c; font-weight: 400; font-family: 'Ownglyph_LeeSeoyun', 'KoPub Batang', serif, cursive; word-break: keep-all; letter-spacing: 0.01em;">
              ${stanza2}
            </p>
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
