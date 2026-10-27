// Andante Editorial Warm Minimalism & Soft Glassmorphism Components
// Browser Vanilla JS Version

const AndanteComponents = {
  /**
   * Render PoemCard HTML string (Editorial Warm Paper Page)
   */
  renderPoemCard: function ({ title = "마음의 안단테", stanza1 = "", stanza2 = "" }) {
    return `
      <div class="theme-transition mb-6" style="margin: 0 auto; max-width: 640px; background-color: #fdfbf7; border-radius: 2rem; padding: 48px 40px; box-shadow: 0 20px 45px -10px rgba(28, 25, 23, 0.08), 0 4px 16px -2px rgba(28, 25, 23, 0.04); border: 1px solid #E2DED9; text-align: center; position: relative; overflow: hidden;">
        <!-- 은은한 쿼트 장식 (Editorial Quote Accent) -->
        <div style="position: absolute; top: -10px; left: 32px; font-size: 90px; color: #f5f5f4; opacity: 0.8; font-family: 'Playfair Display', serif; line-height: 1; pointer-events: none;">“</div>
        
        <div style="position: relative; z-index: 1;">
            <!-- 메타 뱃지 -->
            <div style="margin-bottom: 28px;">
              <span style="padding: 5px 16px; font-size: 11px; font-weight: 600; border-radius: 999px; background: rgba(0,0,0,0.04); border: 1px solid #E2DED9; color: #44403c; letter-spacing: 0.2em; text-transform: uppercase;">
                AI Poetry · 마음의 여백
              </span>
            </div>
            
            <!-- 시 제목 (확실한 다크 톤) -->
            <h3 class="poem-title" style="font-size: 28px; font-weight: 700; color: #1c1917; margin-bottom: 32px; letter-spacing: 0.03em; font-family: 'Ownglyph_LeeSeoyun', 'Noto Serif KR', serif, cursive; word-break: keep-all;">
              ${title}
            </h3>
            
            <!-- 1절 (확실한 다크 톤) -->
            <p class="poem-content" style="white-space: pre-line; font-size: 21px; line-height: 2.3; color: #1c1917; font-weight: 500; font-family: 'Ownglyph_LeeSeoyun', 'Noto Serif KR', serif, cursive; word-break: keep-all; letter-spacing: 0.01em;">
              ${stanza1}
            </p>
            
            <!-- 섬세한 중앙 디바이더 선 (✦ Divider) -->
            <div style="display: flex; align-items: center; justify-content: center; gap: 16px; margin: 36px auto;">
                <span style="width: 44px; height: 1px; background-color: #d6d3d1;"></span>
                <span style="font-size: 13px; color: #78716c;">✦</span>
                <span style="width: 44px; height: 1px; background-color: #d6d3d1;"></span>
            </div>
            
            <!-- 2절 (확실한 다크 톤) -->
            <p class="poem-content" style="white-space: pre-line; font-size: 21px; line-height: 2.3; color: #1c1917; font-weight: 500; font-family: 'Ownglyph_LeeSeoyun', 'Noto Serif KR', serif, cursive; word-break: keep-all; letter-spacing: 0.01em;">
              ${stanza2}
            </p>
        </div>
      </div>
    `;
  },

  /**
   * Render MusicSticker HTML string (Floating Frosted Glass Audio Player)
   * References: Canva Emotional Wallpaper & Wedding Video Playlist Glass Card
   */
  renderMusicSticker: function ({ title = "Lo-Fi Dreams", artist = "Andante AI", image = "", tags = ["Lo-Fi", "72 BPM", "평온함"], isPlaying = false }) {
    const tagsHtml = tags.map((t) => {
      return `<span style="padding: 3px 10px; font-size: 10px; border-radius: 999px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.25); color: #ffffff; letter-spacing: 0.05em; font-weight: 500;">#${t}</span>`;
    }).join(' ');

    const coverHtml = image 
        ? `<img src="${image}" alt="Album Artwork" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;" />`
        : `<div style="width: 100%; height: 100%; border-radius: 12px; background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; font-size: 20px;">🎵</div>`;

    return `
      <div class="glass-player-card theme-transition mb-6" style="background: rgba(24, 24, 27, 0.88); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.22); border-radius: 1.5rem; padding: 22px 26px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.45); color: #ffffff;">
        
        <!-- 상단 무드 문구 (Emotional Playlist Header) -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.12); padding-bottom: 10px;">
          <span style="font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.85); font-family: 'Playfair Display', serif; font-style: italic; font-weight: 500;">
            [ andante healing playlist ]
          </span>
          <span style="font-size: 10px; color: rgba(255,255,255,0.7); letter-spacing: 0.1em; font-weight: 500;">
            BGM · FOCUSGUARD
          </span>
        </div>

        <!-- 메인 플레이어 트랙 영역 -->
        <div style="display: flex; align-items: center; gap: 18px;">
          <!-- 앨범 / 썸네일 아트 (둥근 사각 또는 회전) -->
          <div style="position: relative; width: 62px; height: 62px; flex-shrink: 0; border-radius: 14px; overflow: hidden; border: 1.5px solid rgba(255,255,255,0.3); box-shadow: 0 8px 20px rgba(0,0,0,0.4);">
            <div class="${isPlaying ? 'vinyl-spin' : ''}" style="width: 100%; height: 100%;">
              ${coverHtml}
            </div>
          </div>

          <!-- 곡 정보 & 태그 -->
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 11px; color: rgba(255,255,255,0.8); letter-spacing: 0.05em; font-weight: 500; margin-bottom: 2px;">
              ${artist}
            </div>
            <h4 style="font-size: 17px; font-weight: 600; color: #ffffff; letter-spacing: 0.02em; margin: 0 0 6px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: 'Playfair Display', 'Inter', sans-serif;">
              ${title}
            </h4>
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              ${tagsHtml}
            </div>
          </div>

          <!-- 미니멀 라인 컨트롤러 (Play/Pause Button) -->
          <button id="sticker-play-btn" class="active-press" style="width: 44px; height: 44px; flex-shrink: 0; border-radius: 50%; border: 1.5px solid rgba(255,255,255,0.35); background: rgba(255,255,255,0.2); backdrop-filter: blur(8px); color: #ffffff; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.25s ease; box-shadow: 0 4px 14px rgba(0,0,0,0.3);">
            ${isPlaying ? '❚❚' : '▶'}
          </button>
        </div>

        <!-- 초슬림 게이지 프로그레스 바 (Reference 2: h-[2px] Ultra-Thin Bar) -->
        <div style="margin-top: 18px;">
          <div style="height: 2px; width: 100%; background: rgba(255,255,255,0.25); border-radius: 999px; overflow: hidden; position: relative;">
            <div id="player-progress-bar" style="height: 100%; width: ${isPlaying ? '42%' : '0%'}; background: rgba(255,255,255,0.95); border-radius: 999px; transition: width 0.3s ease;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; font-size: 10px; color: rgba(255,255,255,0.7); letter-spacing: 0.08em; font-variant-numeric: tabular-nums; font-weight: 500;">
            <span id="player-current-time">00:00</span>
            <span id="player-total-time">03:20</span>
          </div>
        </div>

      </div>
    `;
  },

  /**
   * Render AICanvasCard HTML string (16:9 Wide Landscape Artwork View)
   */
  renderAICanvasCard: function ({ imageUrl = "", isLoading = false }) {
    let contentHtml = '';
    if (isLoading) {
      contentHtml = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; color: #44403c; height: 100%;">
          <div class="spinner" style="border-top-color: #1c1917;"></div>
          <p style="font-size: 13px; font-weight: 500; font-family: 'Noto Serif KR', serif; letter-spacing: 0.05em; color: #44403c;">
            AI 안단테가 당신의 마음을 캔버스에 담아내는 중입니다...
          </p>
        </div>
      `;
    } else if (imageUrl) {
      contentHtml = `<img src="${imageUrl}" alt="AI Artwork" style="width: 100%; height: 100%; object-fit: cover; display: block;" />`;
    } else {
      contentHtml = `
        <div style="text-align: center; color: #57534e; padding: 48px 20px;">
          <p style="font-size: 32px; margin-bottom: 12px; opacity: 0.8;">🎨</p>
          <p style="font-size: 13px; font-family: 'Noto Serif KR', serif; letter-spacing: 0.05em; color: #44403c; font-weight: 500;">
            화폭 생성 버튼을 누르면 인공지능이 그린 한 폭의 캔버스가 펼쳐집니다.
          </p>
        </div>
      `;
    }

    return `
      <div class="editorial-card theme-transition mb-6" style="padding: 24px; border: 1px solid #E2DED9; box-shadow: 0 20px 45px -10px rgba(28, 25, 23, 0.08);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <span style="padding: 5px 14px; font-size: 10px; font-weight: 600; border-radius: 999px; background: rgba(0,0,0,0.04); border: 1px solid #E2DED9; color: #44403c; letter-spacing: 0.2em; text-transform: uppercase;">
            🖼️ AI Digital Canvas (16:9)
          </span>
          <span style="font-size: 11px; color: #57534e; letter-spacing: 0.1em; font-family: 'Playfair Display', serif; font-style: italic; font-weight: 500;">
            a piece of art
          </span>
        </div>
        
        <!-- 16:9 Wide Landscape Artwork Container with Soft Shadow -->
        <div style="width: 100%; aspect-ratio: 16/9; border-radius: 1.25rem; background: #f5f5f4; border: 1px solid #E2DED9; overflow: hidden; display: flex; align-items: center; justify-content: center; box-shadow: 0 16px 36px -10px rgba(28, 25, 23, 0.1); position: relative;">
          ${contentHtml}
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
