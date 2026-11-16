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
  renderMusicSticker: function ({ title = "Lo-Fi Dreams", artist = "Andante AI", image = "", tags = ["Lo-Fi", "72 BPM", "평온함"], isPlaying = false, themeColor = "#D4E5D6" }) {
    const safeThemeColor = themeColor || "#D4E5D6";
    const tagsHtml = tags.map((t) => {
      return `<span class="px-2.5 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-stone-700 text-xs font-serif font-medium">#${t}</span>`;
    }).join(' ');

    const coverHtml = image 
        ? `<img id="player-album-cover" src="${image}" alt="Album Artwork" class="w-16 h-16 rounded-2xl object-cover shadow-sm border border-stone-200" />`
        : `<div class="w-16 h-16 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-xl shadow-sm text-stone-600">🎵</div>`;

    const playIconSvg = isPlaying
        ? `<svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`
        : `<svg class="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;

    return `
      <!-- 라이트 글래스모피즘 감성 음악 플레이어 -->
      <div class="relative max-w-2xl mx-auto rounded-3xl bg-white/85 backdrop-blur-md border border-stone-200/90 p-5 shadow-xl shadow-stone-900/5 text-stone-800 transition-all duration-500 mb-6" style="box-shadow: 0 20px 45px -10px rgba(28, 25, 23, 0.05), 0 0 35px -10px ${safeThemeColor}40;">
        
        <!-- 상단 헤더 -->
        <div class="flex items-center justify-between pb-3 border-b border-stone-100 mb-4 text-xs tracking-widest text-stone-500 font-serif">
          <span>[ ANDANTE HEALING PLAYLIST ]</span>
          <span class="flex items-center gap-1.5 font-sans font-medium text-stone-600 text-[10px]">
            <span class="w-2 h-2 rounded-full" style="background-color: ${safeThemeColor}; box-shadow: 0 0 6px ${safeThemeColor};"></span> BGM · FOCUSGUARD
          </span>
        </div>

        <!-- 메인 트랙 정보 & 컨트롤러 -->
        <div class="flex items-center gap-4">
          <div class="relative w-16 h-16 flex-shrink-0">
            <div class="${isPlaying ? 'vinyl-spin' : ''}" style="width: 100%; height: 100%;">
              ${coverHtml}
            </div>
          </div>
          
          <div class="flex-1 min-w-0">
            <p id="player-artist" class="text-xs text-stone-500 truncate mb-0.5">${artist}</p>
            <h4 id="player-title" class="text-base font-serif font-medium text-stone-900 truncate mb-2">${title}</h4>
            <div class="flex flex-wrap gap-1.5 text-xs">
              ${tagsHtml}
            </div>
          </div>

          <!-- 재생/정지 버튼 -->
          <button id="sticker-play-btn" class="w-12 h-12 rounded-full bg-stone-900 hover:bg-stone-800 text-white flex items-center justify-center shadow-md transition-transform active:scale-95 flex-shrink-0 cursor-pointer" title="${isPlaying ? '일시 정지' : '재생'}">
            ${playIconSvg}
          </button>
        </div>

        <!-- 프로그레스 게이지 바 -->
        <div class="mt-4 pt-2">
          <div class="w-full bg-stone-200/80 rounded-full h-1.5 overflow-hidden">
            <div id="player-progress-bar" class="h-full rounded-full transition-all duration-300" style="width: ${isPlaying ? '38%' : '0%'}; background-color: ${safeThemeColor}; box-shadow: 0 0 10px ${safeThemeColor}88;"></div>
          </div>
          <div class="flex justify-between text-[11px] text-stone-500 font-mono mt-1.5">
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
  renderAICanvasCard: function ({ imageUrl = "", isLoading = false, weather = "" }) {
    let weatherBadgeHtml = '';
    if (weather) {
      let icon = '🌤️';
      let weatherKo = weather;
      const w = String(weather).toLowerCase();
      if (w.includes('rain') || w.includes('drizzle') || w.includes('비')) { icon = '🌧️'; weatherKo = '비'; }
      else if (w.includes('snow') || w.includes('눈')) { icon = '❄️'; weatherKo = '눈'; }
      else if (w.includes('cloud') || w.includes('흐림') || w.includes('구름')) { icon = '☁️'; weatherKo = '흐림'; }
      else if (w.includes('mist') || w.includes('fog') || w.includes('안개')) { icon = '🌫️'; weatherKo = '안개'; }
      else if (w.includes('clear') || w.includes('sunny') || w.includes('맑음')) { icon = '☀️'; weatherKo = '맑음'; }

      weatherBadgeHtml = `
        <span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; font-size: 10px; font-weight: 500; border-radius: 999px; background: rgba(0,0,0,0.04); border: 1px solid #E2DED9; color: #57534e;">
          <span>${icon}</span>
          <span>날씨 반영: ${weatherKo}</span>
        </span>
      `;
    }

    let contentHtml = '';
    if (isLoading) {
      contentHtml = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; color: #44403c; height: 100%;">
          <div class="spinner" style="border-top-color: #1c1917;"></div>
          <p style="font-size: 13px; font-weight: 500; font-family: 'Noto Serif KR', serif; letter-spacing: 0.05em; color: #44403c;">
            ${weather ? `실시간 날씨(${weather})와 ` : ''}당신의 마음을 캔버스에 담아내는 중입니다...
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
            화폭 생성 버튼을 누르면 ${weather ? `실시간 날씨(${weather})가 ` : ''}담긴 한 폭의 캔버스가 펼쳐집니다.
          </p>
        </div>
      `;
    }

    return `
      <div class="editorial-card theme-transition mb-6" style="padding: 24px; border: 1px solid #E2DED9; box-shadow: 0 20px 45px -10px rgba(28, 25, 23, 0.08);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="padding: 5px 14px; font-size: 10px; font-weight: 600; border-radius: 999px; background: rgba(0,0,0,0.04); border: 1px solid #E2DED9; color: #44403c; letter-spacing: 0.2em; text-transform: uppercase;">
              🖼️ AI Digital Canvas (16:9)
            </span>
            ${weatherBadgeHtml}
          </div>
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
