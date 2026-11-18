// Healing Mode Interactive Animations
let healingSubtitleTimer = null;
let healingAnimFrame = null;
let healingResizeHandler = null;

function stopHealingAnimations() {
    if (healingSubtitleTimer) clearInterval(healingSubtitleTimer);
    if (healingAnimFrame) cancelAnimationFrame(healingAnimFrame);
    healingSubtitleTimer = null;
    healingAnimFrame = null;
    
    const subtitleEl = document.getElementById('healing-subtitle-text');
    if (subtitleEl) {
        subtitleEl.classList.add('opacity-0');
        subtitleEl.textContent = '';
    }

    const canvas = document.getElementById('healing-particle-canvas');
    if (canvas && healingResizeHandler) {
        window.removeEventListener('resize', healingResizeHandler);
        healingResizeHandler = null;
    }
}

function startHealingAnimations(pageEl, analysisObj) {
    stopHealingAnimations();

    // 1. Extract Poem (Support multiple formats: structured object, diary DB record, or DOM element)
    let poemLines = [];
    if (analysisObj && analysisObj.poem) {
        const p = analysisObj.poem;
        const fullPoem = (p.stanza1 || '') + '\n' + (p.stanza2 || '');
        poemLines = fullPoem.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    } else if (analysisObj && (analysisObj.POEM_TEXT || analysisObj.poem_text)) {
        const text = analysisObj.POEM_TEXT || analysisObj.poem_text || '';
        poemLines = text.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    } else if (pageEl) {
        const poemEl = pageEl.querySelector('.poem-content');
        if (poemEl) {
            poemLines = poemEl.innerText.split('\n').map(s => s.trim()).filter(s => s.length > 0);
        }
    }

    if (poemLines.length === 0) {
        const docPoem = document.querySelector('.poem-content');
        if (docPoem) {
            poemLines = docPoem.innerText.split('\n').map(s => s.trim()).filter(s => s.length > 0);
        }
    }

    if (poemLines.length === 0 && window.currentAnalysis && window.currentAnalysis.poem) {
        const p = window.currentAnalysis.poem;
        const fullPoem = (p.stanza1 || '') + '\n' + (p.stanza2 || '');
        poemLines = fullPoem.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    }

    if (poemLines.length === 0) {
        poemLines = [
            "잠시 마음의 숨을 고르고",
            "느리게 흐르는 음악에 귀를 기울여보세요",
            "오늘의 모든 감정은 그대로 온전합니다"
        ];
    }

    // Subtitle Player with LeeSeoyun font
    const subtitleEl = document.getElementById('healing-subtitle-text');
    if (subtitleEl && poemLines.length > 0) {
        let lineIdx = 0;
        subtitleEl.textContent = poemLines[lineIdx];
        subtitleEl.style.fontFamily = "'Ownglyph_LeeSeoyun', 'KoPub Batang', serif, cursive";
        subtitleEl.classList.remove('opacity-0');
        
        healingSubtitleTimer = setInterval(() => {
            subtitleEl.classList.add('opacity-0'); // fade out
            setTimeout(() => {
                lineIdx = (lineIdx + 1) % poemLines.length;
                subtitleEl.textContent = poemLines[lineIdx];
                subtitleEl.classList.remove('opacity-0'); // fade in
            }, 1000); // Wait 1s for fade out transition
        }, 6000); // Change line every 6s
    }

    // 2. Ambient Particles
    const canvas = document.getElementById('healing-particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    resizeCanvas();
    healingResizeHandler = resizeCanvas;
    window.addEventListener('resize', healingResizeHandler);

    const particles = [];
    const numParticles = 60;
    for (let i = 0; i < numParticles; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3 + 1.5,
            speedX: (Math.random() - 0.5) * 0.4,
            speedY: (Math.random() - 0.5) * 0.4 - 0.15,
            opacity: Math.random() * 0.6 + 0.3
        });
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
            ctx.fill();
        });
        healingAnimFrame = requestAnimationFrame(animateParticles);
    }
    animateParticles();
}



window.GlobalAudio = {
    activeAudios: new Set(),
    create: function(url) {
        const audio = new window.Audio(url);
        this.activeAudios.add(audio);
        return audio;
    },
    stopAll: function() {
        this.activeAudios.forEach(audio => {
            try { audio.pause(); audio.currentTime = 0; } catch(e) {}
        });
        
        document.querySelectorAll('audio').forEach(audio => {
            try { audio.pause(); audio.currentTime = 0;  } catch(e) {}
        });
    }
};

window.stopAllAudios = function() {
    if (window.GlobalAudio) {
        window.GlobalAudio.stopAll();
    }
};

// 🎵 전역 단일 Audio 인스턴스 싱글톤 참조 (Single Source of Truth)
function getActiveAudioInstance() {
    return window.currentHealingAudio || window.jamendoAudio || document.querySelector('#diary-music-player-container audio') || null;
}
window.getActiveAudioInstance = getActiveAudioInstance;
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Theme & Environment Setup
    const currentHour = new Date().getHours();
    const initialTheme = typeof resolveThemeByEnv === 'function' ? resolveThemeByEnv(currentHour, 'Sunny') : { background: 'linear-gradient(135deg, #F4F8F4 0%, #E8F2E8 50%, #DEF0DF 100%)', concept: '느리게 흐르는 민트빛 안단테' };
    
    document.body.classList.remove('bg-[#FAF8F5]');
    // Dual crossfade overlay drives background on Step 1
    // body background handled via var(--bg)
    const conceptEl = document.getElementById('theme-concept-text');
    if (conceptEl) conceptEl.textContent = initialTheme.concept;

    let currentLocationVal = 'Seoul';
    let currentWeatherVal = 'Sunny';

    const weatherBadge = document.getElementById('weather-badge');
    const locationText = document.getElementById('current-location-text');

    function updateThemeByTimeAndWeather(weatherMain, temp, locName) {
        currentWeatherVal = weatherMain;
        currentLocationVal = locName;
        
        if (locationText) locationText.textContent = locName;
        
        const currentHour = new Date().getHours();
        const theme = typeof resolveThemeByEnv === 'function' ? resolveThemeByEnv(currentHour, weatherMain) : null;
        
        let emoji = '☁️';
        if (weatherMain.includes('Rain') || weatherMain.includes('Drizzle')) emoji = '🌧️';
        else if (weatherMain.includes('Thunderstorm')) emoji = '⛈️';
        else if (weatherMain.includes('Snow')) emoji = '❄️';
        else if (weatherMain.includes('Clear')) emoji = '☀️';
        else if (weatherMain.includes('Mist') || weatherMain.includes('Fog')) emoji = '🌫️';

        if (weatherBadge) weatherBadge.innerHTML = emoji;
        if (typeof syncWeatherState === 'function') {
            syncWeatherState(weatherMain);
        }
        
        if (theme) {
            document.body.className = document.body.className.replace(/\bbg-\w+\b/g, '').replace('bg-[#FAF8F5]', '');
            if (typeof currentWizardStep !== 'undefined' && currentWizardStep === 1 && typeof updateAdaptiveBackground === 'function') {
                updateAdaptiveBackground();
            } else {
                /* background handled solely by applyEmotionPalette via --bg */
            }
            if (conceptEl) conceptEl.textContent = theme.concept;
        }

        initBGM(weatherMain, currentHour);
    }

    // FreeSound BGM Logic
    
    let isBgmPlaying = false;
    let isBgmInitialized = false;

    function pauseBGM() {
        if (window.bgmAudio && isBgmPlaying) {
            window.bgmAudio.pause();
            isBgmPlaying = false;
            const btn = document.getElementById('bgm-toggle-btn');
            if (btn) btn.innerHTML = `<span>🎵 BGM: OFF</span>`;
        }
    }

    async function initBGM(weather, hour) {
        if (isBgmInitialized) return;
        isBgmInitialized = true;

        const timeOfDay = (hour >= 5 && hour < 17) ? 'morning' : 'night';
        let query = `${timeOfDay} ${weather} relaxing`;
        try {
            let res = await fetch(`/api/freesound?query=${encodeURIComponent(query)}`);
            let data = await res.json();
            
            // Fallback to broader query if 0 results
            if (!data.results || data.results.length === 0) {
                query = 'relaxing piano ambient';
                res = await fetch(`/api/freesound?query=${encodeURIComponent(query)}`);
                data = await res.json();
            }

            if (data.results && data.results.length > 0) {
                const randomIdx = Math.floor(Math.random() * Math.min(5, data.results.length));
                const track = data.results[randomIdx];
                const previewUrl = track.previews['preview-hq-mp3'];
                
                window.bgmAudio = window.GlobalAudio.create(previewUrl);
            } else {
                // Final fallback if API completely fails or returns empty
                window.bgmAudio = window.GlobalAudio.create("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3");
            }
            
            window.bgmAudio.loop = true;
            window.bgmAudio.volume = 0.2;
            renderBgmUI();
            
        } catch(e) {
            console.error("BGM Load Error:", e);
            // Render UI anyway with a fallback track on network error
            window.bgmAudio = window.GlobalAudio.create("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3");
            window.bgmAudio.loop = true;
            window.bgmAudio.volume = 0.2;
            renderBgmUI();
        }
    }

    function renderBgmUI() {
        const btn = document.createElement('button');
        btn.id = 'bgm-toggle-btn';
        btn.className = 'brutal-btn bg-white text-xs shadow-brutal-sm relative-z flex items-center gap-2';
        btn.style.position = 'fixed';
        btn.style.bottom = '1rem';
        btn.style.left = '1rem';
        btn.style.zIndex = '50';
        btn.style.padding = '0.4rem 0.8rem';
        btn.style.borderRadius = '8px';
        btn.innerHTML = `<span>🎵 BGM: OFF</span>`;
        
        btn.onclick = () => {
            if (!window.bgmAudio) return;
            if (isBgmPlaying) {
                window.bgmAudio.pause();
                btn.innerHTML = `<span>🎵 BGM: OFF</span>`;
            } else {
                window.bgmAudio.play().catch(e => console.log("Autoplay blocked", e));
                btn.innerHTML = `<span>🎵 BGM: ON</span>`;
            }
            isBgmPlaying = !isBgmPlaying;
        };
        
        // Auto play policy handling
        document.body.addEventListener('click', function unlockAudio(e) {
            if (e.target.closest('#bgm-toggle-btn')) return; // let button handler do it
            
            if (window.bgmAudio && !isBgmPlaying) {
                window.bgmAudio.play().then(() => {
                    isBgmPlaying = true;
                    btn.innerHTML = `<span>🎵 BGM: ON</span>`;
                }).catch(e => {});
            }
            document.body.removeEventListener('click', unlockAudio);
        }, { once: true });

        document.body.appendChild(btn);
    }

    // Jamendo API Logic
    
    let jamendoTrackInfo = null;
    
    // 유효성이 검증된(항상 결과가 있는) Jamendo 태그 목록
    const VALID_JAMENDO_TAGS = ['pop', 'happy', 'rock', 'emotional', 'electronic', 'hiphop', 'jazz', 'indie', 'filmscore', 'classical', 'dark', 'dance', 'chillout', 'ambient', 'folk', 'metal', 'latin', 'rnb', 'reggae', 'punk', 'country', 'house', 'blues', 'energetic', 'sad', 'lofi', 'chill', 'relax', 'piano', 'upbeat', 'lounge'];
    
    function mapToValidJamendoTag(rawString) {
        if (!rawString) return null;
        const lower = rawString.toLowerCase().trim();
        
        if (lower.includes('lo-fi') || lower.includes('lofi')) {
            return 'lofi';
        }
        
        // 허용 목록 31개 중 일치 여부 확인
        for (const tag of VALID_JAMENDO_TAGS) {
            if (lower === tag || lower.includes(tag)) {
                return tag;
            }
        }
        
        // relax 기본값 반환 제거: 매핑이 안 되면 null 반환
        return null;
    }
    
    function getSelectedJamendoSafeTag() {
        const targetLabel = sit || selectedMood;
        if (!targetLabel) return null;
        if (typeof HEALING_MOOD_DATA !== 'undefined' && Array.isArray(HEALING_MOOD_DATA)) {
            for (const hCat of HEALING_MOOD_DATA) {
                if (hCat.subSituations) {
                    const found = hCat.subSituations.find(s => s.label === targetLabel || (s.label && s.label.trim() === targetLabel.trim()));
                    if (found && found.jamendoSafeTag) {
                        return found.jamendoSafeTag;
                    }
                }
            }
        }
        return null;
    }
    
    function attachAudioProgressSync(audio) {
        if (!audio) return;
        audio.ontimeupdate = () => {
            const progressBar = document.getElementById('player-progress-bar');
            const curTime = document.getElementById('player-current-time');
            const totalTime = document.getElementById('player-total-time');
            if (progressBar && audio.duration) {
                const pct = (audio.currentTime / audio.duration) * 100;
                progressBar.style.width = `${pct}%`;
            }
            if (curTime) {
                const m = Math.floor(audio.currentTime / 60);
                const s = Math.floor(audio.currentTime % 60);
                curTime.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
            }
            if (totalTime && audio.duration) {
                const m = Math.floor(audio.duration / 60);
                const s = Math.floor(audio.duration % 60);
                totalTime.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
            }
        };
    }
    
    function getCategorySafeTags(categoryName) {
        if (!categoryName) return [];
        if (typeof HEALING_MOOD_DATA === 'undefined') return [];
        for (const hCat of HEALING_MOOD_DATA) {
            if (categoryName.includes(hCat.title) || hCat.title.includes(categoryName) || categoryName.includes(hCat.id)) {
                const tags = [];
                if (hCat.subSituations) {
                    for (const sub of hCat.subSituations) {
                        if (sub.jamendoSafeTag && !tags.includes(sub.jamendoSafeTag)) {
                            tags.push(sub.jamendoSafeTag);
                        }
                    }
                }
                return tags;
            }
        }
        return [];
    }

    function handleNoMusicNotice() {
        console.warn('[음악 안내] 같은 감정 내에서도 음악을 찾지 못해 안내 카드를 표시합니다.');
        jamendoTrackInfo = null;
        if (window.jamendoAudio) {
            window.jamendoAudio.pause();
            window.jamendoAudio = null;
        }
        if (typeof updateWizardView === 'function') updateWizardView();
    }

    async function trySameEmotionFallback(failedTag, categoryName, situationName) {
        const siblingTags = getCategorySafeTags(categoryName).filter(t => t !== failedTag);
        console.info(`[같은 감정 대체] 카테고리 "${categoryName}" 내 대체 가능 태그 후보:`, siblingTags);

        for (const altTag of siblingTags) {
            try {
                console.info(`[같은 감정 대체] "${altTag}" 태그로 대체 요청 시도`);
                const catQuery = categoryName ? `&category=${encodeURIComponent(categoryName)}` : '';
                const sitQuery = situationName ? `&situation=${encodeURIComponent(situationName)}` : '';
                const res = await fetch(`/api/music?tag=${encodeURIComponent(altTag)}${catQuery}${sitQuery}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.track) {
                        jamendoTrackInfo = data.track;
                        console.info(`[같은 감정 대체 성공] 트랙 "${jamendoTrackInfo.name}" 로드됨 (태그: ${altTag})`);
                        window.jamendoAudio = window.GlobalAudio.create(jamendoTrackInfo.audio);
                        window.jamendoAudio.volume = 0.8;
                        window.currentHealingAudio = window.jamendoAudio;
                        attachAudioProgressSync(window.jamendoAudio);
                        window.jamendoAudio.onerror = () => handleNoMusicNotice();
                        window.jamendoAudio.onended = () => {
                            isPlayingMusic = false;
                            if (typeof updateWizardView === 'function') updateWizardView();
                        };
                        if (typeof updateWizardView === 'function') updateWizardView();
                        return true;
                    }
                }
            } catch (e) {
                // 다음 대체 태그 시도
            }
        }

        handleNoMusicNotice();
        return false;
    }

    async function loadJamendoTrack(tag, bpm, categoryName, situationName, isFallbackAttempt = false) {
        console.group('[음악 로드 파이프라인]');
        console.info('1. 음악 요청 파라미터:', { tag, bpm, categoryName, situationName, isFallbackAttempt });
        
        if (!tag) {
            console.warn('[음악 태그 진단] 유효한 음악 태그가 없어 음악을 요청하지 않습니다.');
            jamendoTrackInfo = null;
            if (window.jamendoAudio) {
                window.jamendoAudio.pause();
                window.jamendoAudio = null;
            }
            console.groupEnd();
            return;
        }
        
        const tagQuery = encodeURIComponent(tag);
        let bpmQuery = '';
        if (bpm) {
            const bpmNum = parseInt(String(bpm).replace(/\D/g, ''));
            if (!isNaN(bpmNum)) {
                bpmQuery = `&bpm=${bpmNum}`;
            }
        }
        const catQuery = categoryName ? `&category=${encodeURIComponent(categoryName)}` : '';
        const sitQuery = situationName ? `&situation=${encodeURIComponent(situationName)}` : '';
        
        const url = `/api/music?tag=${tagQuery}${bpmQuery}${catQuery}${sitQuery}`;
        console.info(`2. Jamendo BFF 요청 URL: ${url}`);
        
        try {
            const res = await fetch(url);
            if (!res.ok) {
                throw new Error(`BFF Request Failed: HTTP ${res.status}`);
            }
            
            const data = await res.json();
            if (data.success && data.track) {
                jamendoTrackInfo = data.track;
                console.info('3. Jamendo 트랙 로드 성공:', jamendoTrackInfo.name, `(ID: ${jamendoTrackInfo.id})`);
                console.groupEnd();
                window.jamendoAudio = window.GlobalAudio.create(jamendoTrackInfo.audio);
                window.jamendoAudio.volume = 0.8;
                window.currentHealingAudio = window.jamendoAudio;
                attachAudioProgressSync(window.jamendoAudio);
                
                // [Requirement 2] 재생 실패 시 같은 감정 카테고리 대체 곡 시도
                window.jamendoAudio.onerror = async () => {
                    console.warn('[오디오 재생 실패] 트랙 재생 오류. 같은 감정 카테고리 대체 곡 시도');
                    if (!isFallbackAttempt) {
                        await trySameEmotionFallback(tag, categoryName, situationName);
                    } else {
                        handleNoMusicNotice();
                    }
                };
                
                window.jamendoAudio.onended = () => {
                    isPlayingMusic = false;
                    if (typeof updateWizardView === 'function') updateWizardView();
                };
                if (typeof updateWizardView === 'function') updateWizardView();
            } else {
                throw new Error(data.error || "BFF 응답에 트랙 데이터가 없습니다.");
            }
        } catch(e) {
            console.warn(`[음악 로드 파이프라인] "${tag}" 실패 (${e.message}). 같은 감정 카테고리 내 대체 곡 시도`);
            console.groupEnd();
            if (!isFallbackAttempt) {
                await trySameEmotionFallback(tag, categoryName, situationName);
            } else {
                handleNoMusicNotice();
            }
        }
    }

    // OpenWeatherMap 기반 실시간 날씨 연동 (호출 순서: Geolocation 4초 타임아웃 -> 부천 기본 좌표 폴백)
    initWeather();


    // [Requirement 5] 기존 계정 권장 안내 (로그인 직후 1회 팝업)
    if (sessionStorage.getItem('showPwSecurityNotice') === 'true') {
        sessionStorage.removeItem('showPwSecurityNotice');
        if (window.NeoModal && typeof window.NeoModal.alert === 'function') {
            window.NeoModal.alert('보안을 위해 비밀번호를 8자 이상으로 바꿔 주세요.');
        } else {
            showToast('보안을 위해 비밀번호를 8자 이상으로 바꿔 주세요.');
        }
    }

    // State Variables
    let selectedMbti = 'INFP';
    let selectedMood = '답장 기다리며 애가 탐';
    let currentAnalysis = null;
    let generatedImageUrl = null;
    window.currentAnalysis = null;
    window.generatedImageUrl = null;
    let isPlayingMusic = false;

    // Auth State Check & Auto Populate
    const token = sessionStorage.getItem('authToken');
    if (!token) {
        window.location.replace('/login.html');
        return;
    }
    const authName = sessionStorage.getItem('authName') || sessionStorage.getItem('authUsername');
    const authBirthDate = sessionStorage.getItem('authBirthDate');
    const authMbti = sessionStorage.getItem('authMbti');
    
    if (authBirthDate) {
        const birthInput = document.getElementById('birthdate-input');
        if (birthInput) birthInput.value = authBirthDate;
    }
    if (authMbti) {
        selectedMbti = authMbti;
    }

    const userInfoEl = document.getElementById('user-info');
    const loginNavBtn = document.getElementById('login-nav-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const diaryBtn = document.getElementById('diary-btn');
    const mypageBtn = document.getElementById('mypage-btn');

    if (token && authName) {
        if (userInfoEl) userInfoEl.textContent = `${authName}님`;
        if (loginNavBtn) loginNavBtn.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.remove('hidden');
        if (diaryBtn) diaryBtn.classList.remove('hidden');
        if (mypageBtn) mypageBtn.classList.remove('hidden');
    } else {
        if (userInfoEl) userInfoEl.textContent = '';
        if (loginNavBtn) {
            loginNavBtn.classList.remove('hidden');
            loginNavBtn.onclick = () => location.href = '/login.html';
        }
        if (logoutBtn) logoutBtn.classList.add('hidden');
        if (diaryBtn) diaryBtn.classList.add('hidden');
        if (mypageBtn) mypageBtn.classList.add('hidden');
    }

    if (logoutBtn) {
        logoutBtn.onclick = () => {
            ['authToken', 'authUsername', 'authName', 'authGender', 'authAge'].forEach(k => sessionStorage.removeItem(k));
            location.reload();
        };
    }

    const HEALING_MOOD_DATA = [
      {
        id: "LOVE",
        hue: 345,
        title: "설렘 & 사랑 💖",
        subtitle: "새로운 시작, 몽글몽글한 애정, 또는 짝사랑의 떨림",
        headerColor: "#FFCCD5", // 달콤한 딸기우유 핑크
        borderColor: "#FFA3B1",
        subSituations: [
          { id: "love_1", label: "답장 기다리며 애가 탐", jamendoSafeTag: "indie", themeColor: "#FBF2F2" },
          { id: "love_2", label: "좋아하는 사람 생각에 밤잠 설침", jamendoSafeTag: "indie", themeColor: "#FCF5F7" },
          { id: "love_3", label: "마주친 순간 멍해짐", jamendoSafeTag: "happy", themeColor: "#FAF0F2" },
          { id: "love_4", label: "오래된 연인과의 편안한 데이트", jamendoSafeTag: "folk", themeColor: "#F7ECEC" },
          { id: "love_5", label: "혼자 의미 부여하고 착각할까 겁남", jamendoSafeTag: "indie", themeColor: "#FAF2F5" },
          { id: "love_6", label: "온종일 SNS 염탐하며 서성임", jamendoSafeTag: "lofi", themeColor: "#F7EEF2" },
          { id: "love_7", label: "처음으로 손잡은 순간의 두근거림", jamendoSafeTag: "happy", themeColor: "#F9EDF1" },
          { id: "love_8", label: "별것 아닌 일상도 공유하고 싶음", jamendoSafeTag: "folk", themeColor: "#F5EBF0" }
        ]
      },
      {
        id: "DOWN",
        hue: 210,
        title: "가라앉는 마음 & 이별 🌧️",
        subtitle: "먹먹한 우울감, 서운함, 그리고 조용한 위로가 필요한 때",
        headerColor: "#C6DCF2", // 차분하고 깊은 라벤더 블루
        borderColor: "#96C0E6",
        subSituations: [
          { id: "down_1", label: "이별 후 먹먹함", jamendoSafeTag: "emotional", themeColor: "#EEF2F6" },
          { id: "down_2", label: "이유 없이 마음이 텅 빔", jamendoSafeTag: "sad", themeColor: "#F0EFF2" },
          { id: "down_3", label: "사소한 말에 깊게 베임", jamendoSafeTag: "piano", themeColor: "#EFF1F4" },
          { id: "down_4", label: "세상에 혼자 남겨진 기분", jamendoSafeTag: "ambient", themeColor: "#EBF0F7" },
          { id: "down_5", label: "다른 사람과 비교하며 자책감 듦", jamendoSafeTag: "sad", themeColor: "#F2F3F8" },
          { id: "down_6", label: "노력해도 제자리걸음인 것 같아 막막함", jamendoSafeTag: "piano", themeColor: "#EDEFF7" },
          { id: "down_7", label: "잊은 줄 알았던 기억이 불쑥 떠오름", jamendoSafeTag: "emotional", themeColor: "#E8EAF4" },
          { id: "down_8", label: "누구에게도 털어놓지 못하고 속앓이 중", jamendoSafeTag: "ambient", themeColor: "#E4E6F2" }
        ]
      },
      {
        id: "OVERLOAD",
        hue: 15,
        title: "복잡한 생각 & 갈등 🤯",
        subtitle: "스트레스와 관계 마찰로 머릿속이 엉켜 숨이 가쁜 상태",
        headerColor: "#FFD4C2", // 산뜻한 로즈 피치
        borderColor: "#FFAE91",
        subSituations: [
          { id: "over_1", label: "연인과 사소한 일로 다툼", jamendoSafeTag: "chillout", themeColor: "#FAECEE" },
          { id: "over_2", label: "인간관계 마찰로 부글거림", jamendoSafeTag: "chillout", themeColor: "#FAEDE8" },
          { id: "over_3", label: "잡생각이 꼬리를 물고 안 멈춤", jamendoSafeTag: "ambient", themeColor: "#FAEEF0" },
          { id: "over_4", label: "실수 수습하느라 멘탈 흔들림", jamendoSafeTag: "rock", themeColor: "#FAF0F2" },
          { id: "over_5", label: "팀플 무임승차 때문에 분통 터짐", jamendoSafeTag: "rock", themeColor: "#FAF2F3" },
          { id: "over_6", label: "마감 직전 벼락치기로 심장 뜀", jamendoSafeTag: "energetic", themeColor: "#FAEEF0" },
          { id: "over_7", label: "오해를 풀고 싶은데 자존심 상함", jamendoSafeTag: "chillout", themeColor: "#F7E8E8" },
          { id: "over_8", label: "선 넘는 참견과 간섭에 숨 막힘", jamendoSafeTag: "ambient", themeColor: "#F5E4E4" }
        ]
      },
      {
        id: "DEPLETED",
        hue: 35,
        title: "지친 하루 & 쉼의 필요 🪫",
        subtitle: "모든 기운이 소진되어 가만히 기대어 쉬고 싶은 상태",
        headerColor: "#FCE2BE", // 포근하고 아늑한 카멜 베이지
        borderColor: "#F7C683",
        subSituations: [
          { id: "dep_1", label: "끝없는 과제/업무에 치임", jamendoSafeTag: "relax", themeColor: "#FAF3E8" },
          { id: "dep_2", label: "잠 부족으로 멍함", jamendoSafeTag: "ambient", themeColor: "#F7F3EC" },
          { id: "dep_3", label: "사람 만나는 게 기 빨림", jamendoSafeTag: "ambient", themeColor: "#FAF0EE" },
          { id: "dep_4", label: "손가락 하나 까딱할 힘 없음", jamendoSafeTag: "lofi", themeColor: "#F2F6F2" },
          { id: "dep_5", label: "모니터만 오래 봐서 눈과 머리가 지끈거림", jamendoSafeTag: "relax", themeColor: "#FAF5ED" },
          { id: "dep_6", label: "억지 미소 지으며 감정 노동함", jamendoSafeTag: "lofi", themeColor: "#FAF2E6" },
          { id: "dep_7", label: "모든 알림 끄고 잠수 타고 싶음", jamendoSafeTag: "chill", themeColor: "#FAF0E3" },
          { id: "dep_8", label: "밥 챙겨 먹는 것조차 귀찮고 버거움", jamendoSafeTag: "ambient", themeColor: "#F7ECE0" }
        ]
      },
      {
        id: "CALM",
        hue: 130,
        title: "잔잔한 고요 & 사색 🍵",
        subtitle: "차 한 잔과 함께 나를 온전히 마주하는 평온한 시간",
        headerColor: "#CEEACE", // 마음이 편안해지는 말차 그린
        borderColor: "#A1D6A1",
        subSituations: [
          { id: "calm_1", label: "누구의 방해도 받기 싫음", jamendoSafeTag: "ambient", themeColor: "#F3EEF5" },
          { id: "calm_2", label: "조용히 나를 돌아보는 중", jamendoSafeTag: "piano", themeColor: "#EDF2F7" },
          { id: "calm_3", label: "적당한 거리감이 편안함", jamendoSafeTag: "piano", themeColor: "#FAF6EA" },
          { id: "calm_4", label: "혼자만의 새벽 공기", jamendoSafeTag: "chillout", themeColor: "#F4F1EC" },
          { id: "calm_5", label: "비 내리는 창밖을 가만히 응시함", jamendoSafeTag: "piano", themeColor: "#F6F0F7" },
          { id: "calm_6", label: "혼자 걷는 밤 산책길이 포근함", jamendoSafeTag: "ambient", themeColor: "#F4ECF7" },
          { id: "calm_7", label: "좋아하는 노래 하나만 무한 반복 중", jamendoSafeTag: "lounge", themeColor: "#F0E7F5" },
          { id: "calm_8", label: "복잡한 관계에서 벗어나 숨 쉬는 시간", jamendoSafeTag: "chillout", themeColor: "#ECE2F2" }
        ]
      },
      {
        id: "ACTIVE",
        hue: 190,
        title: "반짝이는 영감 & 활력 🔥",
        subtitle: "기분 좋은 몰입, 설레는 의욕, 그리고 성취의 기쁨",
        headerColor: "#C1ECF4", // 시원하고 청량한 스카이 블루
        borderColor: "#8BD9E8",
        subSituations: [
          { id: "act_1", label: "원하던 목표를 달성함", jamendoSafeTag: "upbeat", themeColor: "#EDF4F7" },
          { id: "act_2", label: "영감과 의욕이 넘쳐남", jamendoSafeTag: "rnb", themeColor: "#EEF3FA" },
          { id: "act_3", label: "잡념 없이 깊게 빠져드는 중", jamendoSafeTag: "electronic", themeColor: "#EFF2F7" },
          { id: "act_4", label: "텐션 올리고 싶은 기분", jamendoSafeTag: "dance", themeColor: "#F2F1F4" },
          { id: "act_5", label: "운동 후 땀 흘리고 개운함", jamendoSafeTag: "dance", themeColor: "#EEF8F9" },
          { id: "act_6", label: "어려운 문제를 끝내 해결하고 짜릿함", jamendoSafeTag: "upbeat", themeColor: "#E7F6F8" },
          { id: "act_7", label: "새로운 도전을 앞두고 설레는 긴장감", jamendoSafeTag: "electronic", themeColor: "#E0F2F5" },
          { id: "act_8", label: "오랜만에 마음에 드는 결과물이 나옴", jamendoSafeTag: "pop", themeColor: "#DAEFF2" }
        ]
      }
    ];

    // =========================================================================
    // 신규 감정·배터리 컬러 팔레트 & 동적 배경 시스템 (Contrast 강화)
    // =========================================================================

    // 1. 배터리 단독 구간별 그라데이션 (대비 강화)
    function getBatteryOnlyGradient(battery) {
      if (battery <= 25) return 'linear-gradient(135deg, #D0D3E3 0%, #BDC3D4 100%)';
      if (battery <= 50) return 'linear-gradient(135deg, #EEDCCB 0%, #E1CEBD 100%)';
      if (battery <= 75) return 'linear-gradient(135deg, #D4E5D6 0%, #BFD9C1 100%)';
      return 'linear-gradient(135deg, #F8CAD3 0%, #F2B2C0 100%)';
    }

    // 2. 감정 대분류 6종 결합 팔레트
    const MOOD_GRADIENT_BASES = {
      LOVE:     { high: ['#F8CAD3', '#F2B2C0'], low: ['#E6BAC3', '#D6A6B1'] },
      DOWN:     { high: ['#C5D5E8', '#ADC4DC'], low: ['#D0D3E3', '#BDC3D4'] },
      OVERLOAD: { high: ['#F5D8CF', '#E8C2B6'], low: ['#EEDCCB', '#E1CEBD'] },
      DEPLETED: { high: ['#EADBC9', '#DCBFA4'], low: ['#D9D3CE', '#C7BFB9'] },
      CALM:     { high: ['#D4E5D6', '#BFD9C1'], low: ['#CCD6CD', '#B5C4B7'] },
      ACTIVE:   { high: ['#BEE4ED', '#A4D5E0'], low: ['#CFDFE3', '#BACCD1'] }
    };

    let isCrossfadeFrontActive = false;
    let currentAppliedGradient = '';

    // 3. 듀얼 오버레이 크로스페이드 배경 갱신 실행 함수 (Dual Overlay Cross-fade, 60fps)
    function applyGradientWithCrossfade(gradientStr) {
      /* Background handled solely by applyEmotionPalette via --bg */
    }

    function updateAdaptiveBackground() {
        if (typeof applyEmotionPalette === 'function') {
            const catName = (typeof cat !== 'undefined' && cat && cat.n) ? cat.n : null;
            applyEmotionPalette(catName);
        }
    }

    window.getBatteryOnlyGradient = getBatteryOnlyGradient;
    window.MOOD_GRADIENT_BASES = MOOD_GRADIENT_BASES;
    window.updateAdaptiveBackground = updateAdaptiveBackground;
    window.applyGradientWithCrossfade = applyGradientWithCrossfade;

    let energyLevel = 50;
    let isBatteryInteracted = false;
    let expandedCategory = 'LOVE';
    window.currentSelectedCategory = 'LOVE';

    function getBatteryInfo(level) {
        const v = Math.max(0, Math.min(100, Math.round(Number(level) || 0)));
        let text = '가득 차 있어요';
        if (v < 20) text = '쉼이 필요해요';
        else if (v < 45) text = '조금 남았어요';
        else if (v < 75) text = '충분해요';

        return {
            value: v,
            num: `${v}%`,
            text: text,
            summary: `${text} · ${v}%`
        };
    }

    function getBatteryText(level) {
        return getBatteryInfo(level).text;
    }

    // =========================================================================
    // 🎨 Andante 메인 프로토타입 통합 코어 시스템 (날씨, 아치, 감정, 배경 단일화)
    // =========================================================================

    const CATS = [
      {
        n: '설렘 & 사랑',
        h: 345,
        d: '새로운 시작, 몽글몽글한 애정, 또는 짝사랑의 떨림',
        hl: '두근거리는 마음을,<br>한 장의 그림으로.',
        s: ['답장 기다리며 애가 탐', '좋아하는 사람 생각에 밤잠 설침', '마주친 순간 멍해짐', '오래된 연인과의 편안한 데이트', '혼자 의미 부여하고 착각할까 겁남', '온종일 SNS 염탐하며 서성임', '처음으로 손잡은 순간의 두근거림', '별것 아닌 일상도 공유하고 싶음']
      },
      {
        n: '가라앉는 마음 & 이별',
        h: 210,
        d: '먹먹한 우울감, 서운함, 그리고 조용한 위로가 필요한 때',
        hl: '가라앉은 마음에도,<br>고요한 빛이 들어요.',
        s: ['이별 후 먹먹함', '이유 없이 마음이 텅 빔', '사소한 말에 깊게 베임', '세상에 혼자 남겨진 기분', '다른 사람과 비교하며 자책감 듦', '노력해도 제자리걸음인 것 같아 막막함', '잊은 줄 알았던 기억이 불쑥 떠오름', '누구에게도 털어놓지 못하고 속앓이 중']
      },
      {
        n: '복잡한 생각 & 갈등',
        h: 15,
        d: '스트레스와 관계 마찰로 머릿속이 엉켜 숨이 가쁜 상태',
        hl: '엉킨 마음을 잠시,<br>내려놓아 보세요.',
        s: ['연인과 사소한 일로 다툼', '인간관계 마찰로 부글거림', '잡생각이 꼬리를 물고 안 멈춤', '실수 수습하느라 멘탈 흔들림', '팀플 무임승차 때문에 분통 터짐', '마감 직전 벼락치기로 심장 뜀', '오해를 풀고 싶은데 자존심 상함', '선 넘는 참견과 간섭에 숨 막힘']
      },
      {
        n: '지친 하루 & 쉼의 필요',
        h: 35,
        d: '모든 기운이 소진되어 가만히 기대어 쉬고 싶은 상태',
        hl: '오늘은 충분히 애썼어요,<br>이제 쉬어 가요.',
        s: ['끝없는 과제/업무에 치임', '잠 부족으로 멍함', '사람 만나는 게 기 빨림', '손가락 하나 까딱할 힘 없음', '모니터만 오래 봐서 눈과 머리가 지끈거림', '억지 미소 지으며 감정 노동함', '모든 알림 끄고 잠수 타고 싶음', '밥 챙겨 먹는 것조차 귀찮고 버거움']
      },
      {
        n: '잔잔한 고요 & 사색',
        h: 130,
        d: '차 한 잔과 함께 나를 온전히 마주하는 평온한 시간',
        hl: '고요한 마음을,<br>오래 곁에 머물게 해요.',
        s: ['누구의 방해도 받기 싫음', '조용히 나를 돌아보는 중', '적당한 거리감이 편안함', '혼자만의 새벽 공기', '비 내리는 창밖을 가만히 응시함', '혼자 걷는 밤 산책길이 포근함', '좋아하는 노래 하나만 무한 반복 중', '복잡한 관계에서 벗어나 숨 쉬는 시간']
      },
      {
        n: '반짝이는 영감 & 활력',
        h: 190,
        d: '기분 좋은 몰입, 설레는 의욕, 그리고 성취의 기쁨',
        hl: '반짝이는 마음을,<br>놓치지 않게요.',
        s: ['원하던 목표를 달성함', '영감과 의욕이 넘쳐남', '잡념 없이 깊게 빠져드는 중', '텐션 올리고 싶은 기분', '운동 후 땀 흘리고 개운함', '어려운 문제를 끝내 해결하고 짜릿함', '새로운 도전을 앞두고 설레는 긴장감', '오랜만에 마음에 드는 결과물이 나옴']
      }
    ];

    const WORD = getBatteryText;
    const DEFAULT_H1 = '오늘의 마음을,<br>한 장의 그림으로.';
    const BUCHEON_COORDS = { lat: 37.5034, lon: 126.766 };

    // 상태 변수
    let H = 25;
    let W = '맑음'; // 맑음, 흐림, 비, 눈
    let rawWeatherMain = ''; // weather[0].main (영문 원본: Clear, Rain, Clouds, etc.)
    let weatherDesc = ''; // weather[0].description
    let weatherTemp = null; // main.temp
    let weatherLocationName = ''; // name
    let isWeatherFailed = false; // API 실패 또는 알 수 없는 날씨 여부 (중립 상태)
    let cat = null; // 선택된 감정 카테고리
    let sit = ''; // 선택된 구체적 상황
        const EMOTION_PALETTES = {
        DEFAULT:  { bg: '#FDFBD4', sel: '#4B6E48', selHue: 115 },
        '설렘 & 사랑': { bg: '#F2C7C7', sel: '#FFB7C5', selHue: 348 },
        '가라앉는 마음 & 이별': { bg: '#BDDDFC', sel: '#6A89A7', selHue: 210 },
        '복잡한 생각 & 갈등': { bg: '#B5C7EB', sel: '#9A8BBF', selHue: 257 },
        '지친 하루 & 쉼의 필요': { bg: '#fccbac', sel: '#C99A6E', selHue: 29 },
        '잔잔한 고요 & 사색': { bg: '#c4f5c9', sel: '#7FB5A3', selHue: 160 },
        '반짝이는 영감 & 활력': { bg: '#EFD9AA', sel: '#C09E7C', selHue: 30 }
    };

    function applyEmotionPalette(catName) {
        const palette = (catName && EMOTION_PALETTES[catName]) ? EMOTION_PALETTES[catName] : EMOTION_PALETTES.DEFAULT;
        document.documentElement.style.setProperty('--bg', palette.bg);
        document.documentElement.style.setProperty('--sel', palette.sel);
        return palette;
    }

    // 2. 날씨 분류 함수 (weather[0].main 기준 단일 함수)
    function classifyWeather(mainVal) {
        if (!mainVal) return { category: '흐림', isUnknown: true };
        const m = String(mainVal).trim().toLowerCase();

        if (m === 'clear') {
            return { category: '맑음', isUnknown: false };
        }
        if (m === 'rain' || m === 'drizzle' || m === 'thunderstorm') {
            return { category: '비', isUnknown: false };
        }
        if (m === 'snow') {
            return { category: '눈', isUnknown: false };
        }
        if (['clouds', 'haze', 'mist', 'fog', 'smoke', 'dust', 'sand', 'ash', 'squall', 'tornado'].includes(m)) {
            return { category: '흐림', isUnknown: false };
        }

        // 알 수 없는 값: 흐림 (채도 최저)
        return { category: '흐림', isUnknown: true };
    }

    // 아치 그림 SVG 채움색(채도 25~35%, 명도 60~80%) 및 글로우 계산
    function computeThemeColors(selHue) {
        return {
            arch: {
                k0: `hsl(${selHue} 28% 78%)`,
                k2: `hsl(${(selHue + 25) % 360} 34% 75%)`,
                k3: `hsl(${selHue} 30% 70%)`,
                k4: `hsl(${selHue} 32% 64%)`,
                k5: `hsl(${(selHue + 15) % 360} 27% 68%)`,
                k6: `hsl(${selHue} 30% 62%)`
            },
            glow: {
                h: selHue,
                s: '30%',
                l: '70%'
            }
        };
    }

    // 아치 및 감정 팔레트 렌더링 함수
    function paintTheme() {
        const catName = cat ? cat.n : null;
        const palette = applyEmotionPalette(catName);
        const selHue = palette.selHue;
        const colors = computeThemeColors(selHue);

        const archEl = document.getElementById('arch');
        if (archEl) {
            archEl.style.setProperty('--k0', colors.arch.k0);
            archEl.style.setProperty('--k2', colors.arch.k2);
            archEl.style.setProperty('--k3', colors.arch.k3);
            archEl.style.setProperty('--k4', colors.arch.k4);
            archEl.style.setProperty('--k5', colors.arch.k5);
            archEl.style.setProperty('--k6', colors.arch.k6);
            archEl.dataset.w = W;
        }

        const glowEl = document.getElementById('glow');
        if (glowEl) {
            glowEl.style.setProperty('--gh', colors.glow.h);
            glowEl.style.setProperty('--gs', colors.glow.s);
            glowEl.style.setProperty('--gl', colors.glow.l);
        }

        document.documentElement.style.setProperty('--gh', selHue);
    }
    window.paintTheme = paintTheme;

    function pulseGlow() {
        const glowEl = document.getElementById('glow');
        if (!glowEl) return;
        glowEl.classList.remove('pulse');
        void glowEl.offsetWidth;
        glowEl.classList.add('pulse');
    }

    // 4. 캡션 포맷팅 함수 (예: "비 내리는 부천, 16°C. 이별 후 먹먹함의 마음을 담았어요.")
    function updateCaption() {
        const capEl = document.getElementById('cap');
        if (!capEl) return;

        if (isWeatherFailed) {
            capEl.textContent = '날씨를 가져오지 못했어요. 마음의 결만으로 그림을 그릴게요.';
            return;
        }

        const weatherPrefix = {
            '맑음': '맑은',
            '흐림': '흐린',
            '비': '비 내리는',
            '눈': '눈 내리는'
        }[W] || '맑은';

        let locPart = weatherLocationName ? weatherLocationName : '';
        if (locPart.toLowerCase() === 'bucheon-si' || locPart.toLowerCase() === 'bucheon') locPart = '부천';
        if (locPart.toLowerCase() === 'seoul') locPart = '서울';

        const placeText = locPart ? `${locPart}` : '하늘';
        const tempText = weatherTemp !== null ? `, ${weatherTemp}°C` : '';
        const prefix = `${weatherPrefix} ${placeText}${tempText}.`;

        if (sit) {
            capEl.textContent = `${prefix} ${sit}의 마음을 담았어요.`;
        } else if (cat) {
            capEl.textContent = `${prefix} ${cat.n}의 마음을 담을 준비가 됐어요.`;
        } else {
            capEl.textContent = `${prefix} 오늘의 마음을 담을 준비가 됐어요.`;
        }
    }

    function swapTitle(html) {
        const h = document.getElementById('h1');
        if (!h || h.innerHTML === html) return;
        h.classList.add('swap');
        setTimeout(() => {
            h.innerHTML = html;
            h.classList.remove('swap');
        }, 400);
    }

    // 빗줄기와 눈송이 SVG 엘리먼트 생성
    function buildSnow() {
        const rainG = document.getElementById('rainG');
        const snowG = document.getElementById('snowG');
        if (rainG) rainG.innerHTML = Array.from({length:30},(_,i)=>`<line x1="${(i*37)%400}" y1="${(i*53)%420}" x2="${(i*37)%400-10}" y2="${(i*53)%420+30}"/>`).join('');
        if (snowG) snowG.innerHTML = Array.from({length:30},(_,i)=>`<circle cx="${(i*97)%400}" cy="${(i*61)%460}" r="${2+i%3}" fill="#fff" opacity=".85"/>`).join('');
    }

    // 3. 날씨 호출 순서 및 실패 처리 (Geolocation 4초 제한 -> 부천 기본 좌표 -> 단 1회 호출)
    async function fetchWeatherByCoords(lat, lon) {
        try {
            const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
            const data = await res.json();

            if (data.error || !data.weather || data.weather.length === 0) {
                handleWeatherFailure();
                return;
            }

            const w0 = data.weather[0];
            rawWeatherMain = w0.main || 'Clear';
            weatherDesc = w0.description || '';
            weatherTemp = data.main && typeof data.main.temp === 'number' ? Math.round(data.main.temp) : null;
            weatherLocationName = data.name || '';

            const classified = classifyWeather(rawWeatherMain);
            W = classified.category;
            isWeatherFailed = classified.isUnknown;

            paintTheme();
            updateCaption();

            // 백그라운드 BGM 초기화 연동
            const curHour = new Date().getHours();
            if (typeof initBGM === 'function') initBGM(rawWeatherMain, curHour);
        } catch (err) {
            handleWeatherFailure();
        }
    }

    function handleWeatherFailure() {
        isWeatherFailed = true;
        W = '흐림';
        rawWeatherMain = 'Clouds';
        paintTheme();
        const capEl = document.getElementById('cap');
        if (capEl) {
            capEl.textContent = '날씨를 가져오지 못했어요. 마음의 결만으로 그림을 그릴게요.';
        }
    }

    function initWeather() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
                },
                () => {
                    // 위치 거부 또는 실패 시 부천시 기본 좌표 사용 (?q=Seoul 폴백 제거)
                    fetchWeatherByCoords(BUCHEON_COORDS.lat, BUCHEON_COORDS.lon);
                },
                { timeout: 4000 }
            );
        } else {
            fetchWeatherByCoords(BUCHEON_COORDS.lat, BUCHEON_COORDS.lon);
        }
    }

    // Step 1 프로토타입 인터랙션 초기화 (온기, 감정 카드, 상황 칩, 이야기)
    function initPrototypeInteractions() {
        buildSnow();

        // 1. 온기 캡슐 슬라이더
        const warm = document.getElementById('warm');
        const track = document.getElementById('track');
        const warmWord = document.getElementById('warmWord');

        const syncWarm = () => {
            if (!warm) return;
            const v = +warm.value;
            energyLevel = v;
            isBatteryInteracted = true;
            const info = getBatteryInfo(v);
            if (track) track.style.setProperty('--p', v + '%');
            if (warmWord) warmWord.textContent = info.text;
            const warmNum = document.getElementById('warmNum');
            if (warmNum) warmNum.textContent = info.num;
            warm.setAttribute('aria-valuetext', `${info.text} (${info.num})`);
        };

        if (warm) {
            warm.oninput = syncWarm;
            syncWarm();
        }

        // 2. 6대 감정 카드 렌더링
        const catsBox = document.getElementById('cats');
        const chipsBox = document.getElementById('chips');
        const subHint = document.getElementById('subHint');

        if (catsBox) {
            catsBox.innerHTML = '';
            CATS.forEach(c => {
                const palette = EMOTION_PALETTES[c.n] || EMOTION_PALETTES.DEFAULT;
                const dotColor = palette.bg;
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'main-emotion-card cat';
                b.setAttribute('aria-pressed', 'false');
                b.innerHTML = `<span class="main-card-header n"><span class="main-card-dot dot" style="background:${dotColor}"></span>${c.n}</span><small class="main-card-desc">${c.d}</small>`;

                b.onclick = () => {
                    cat = c;
                    sit = '';
                    H = c.h;
                    selectedMood = '';

                    catsBox.querySelectorAll('.main-emotion-card, .cat').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));

                    if (chipsBox) {
                        chipsBox.replaceChildren();
                        chipsBox.hidden = false;
                        if (subHint) subHint.hidden = false;

                        c.s.forEach(t => {
                            const p = document.createElement('button');
                            p.type = 'button';
                            p.className = 'main-situation-chip chip';
                            p.textContent = t;
                            p.setAttribute('aria-pressed', 'false');

                            p.onclick = () => {
                                sit = t;
                                selectedMood = t;
                                chipsBox.querySelectorAll('.main-situation-chip, .chip').forEach(x => x.setAttribute('aria-pressed', x === p ? 'true' : 'false'));
                                updateCaption();
                            };

                            chipsBox.appendChild(p);
                        });
                    }

                    paintTheme();
                    updateCaption();
                    pulseGlow();
                    swapTitle(c.hl);
                };

                catsBox.appendChild(b);
            });
        }

        // 초기 화면 페인팅 (감정 선택 전에는 베이지만 표시)
        paintTheme();
        updateCaption();
    }

    // 돔 로드 시 프로토타입 인터랙션 즉시 초기화
    initPrototypeInteractions();

    // Toast Utility
    const showToast = (msg) => {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);
    };

    // 3. Wizard State & UI Controller
    let currentWizardStep = 1;
    let miniWizardStep = '1a'; // '1a': 마음/상황 선택, '1b': 이야기 작성

    function updateMiniWizardView() {
        const s1a = document.getElementById('wizard-step-1a');
        const s1b = document.getElementById('wizard-step-1b');
        if (!s1a || !s1b) return;

        if (miniWizardStep === '1a') {
            s1a.classList.remove('hidden');
            s1b.classList.add('hidden');
        } else {
            s1a.classList.add('hidden');
            s1b.classList.remove('hidden');

            // 선택된 감정/상황/온기 요약 카드 갱신
            const sumDot = document.getElementById('summary-dot-1b');
            const sumCat = document.getElementById('summary-cat-1b');
            const sumSit = document.getElementById('summary-sit-1b');
            const sumWarm = document.getElementById('summary-warm-1b');

            if (cat) {
                const p = (typeof EMOTION_PALETTES !== 'undefined' && EMOTION_PALETTES[cat.n]) 
                    ? EMOTION_PALETTES[cat.n] 
                    : (EMOTION_PALETTES?.DEFAULT || { bg: '#FDFBD4', sel: '#4B6E48' });
                if (sumDot) sumDot.style.background = p.bg || p.sel;
                if (sumCat) sumCat.textContent = cat.n;
            } else {
                if (sumCat) sumCat.textContent = '기본 감정';
            }

            if (sumSit) {
                sumSit.textContent = sit ? `# ${sit}` : '# 자유로운 이야기';
            }

            const warmSlider = document.getElementById('warm');
            const warmVal = warmSlider ? warmSlider.value : '50';
            const batteryInfo = getBatteryInfo(warmVal);
            if (sumWarm) {
                sumWarm.textContent = `🌿 ${batteryInfo.summary}`;
            }
        }
    }
    
    // Initial Render
    updateWizardView();

    function updateWizardView() {
        const s1 = document.getElementById('step-1-input');
        const s2 = document.getElementById('step-2-poem');
        const s3 = document.getElementById('step-3-canvas');
        const loader = document.getElementById('loader');

        [s1, s2, s3].forEach(el => {
            if (el) {
                el.classList.add('hidden');
                el.style.display = '';
            }
        });
        if (loader) {
            loader.classList.add('hidden');
        }

        if (currentWizardStep === 1 && s1) { 
            s1.classList.remove('hidden'); 
            updateMiniWizardView();
            updateAdaptiveBackground(); 
        }
        if (currentWizardStep === 2 && s2) s2.classList.remove('hidden');
        if (currentWizardStep === 3 && s3) s3.classList.remove('hidden');

        // Step 2 & 3 content population
        if (currentWizardStep >= 2 && currentAnalysis) {
            const poemData = currentAnalysis.poem || {};
            const poemSlot = document.getElementById('poem-card-slot');
            if (poemSlot) {
                poemSlot.innerHTML = window.AndanteComponents.renderPoemCard({
                    title: poemData.title || currentAnalysis.theme || '안단테: 마음의 여백',
                    stanza1: poemData.stanza1 || `오늘 그대의 마음 호수 위에\n${currentAnalysis.mood || '잔잔한'} 바람 하나 지나쳐 가고...`,
                    stanza2: poemData.stanza2 || `느리게 피어나는 가락 타고\n포근히 안아주는 안단테의 그늘.`
                });
            }
        }
        
        if (currentWizardStep === 3 && currentAnalysis) {
            const musicData = currentAnalysis.structuredData || {};

            // 6종 감정별 파스텔 매핑 토큰 (Glow & Accent Colors)
            const MOOD_PASTEL_COLORS = {
                LOVE:     '#F8CAD3', // 로즈 핑크
                DOWN:     '#C5D5E8', // 스카이 라벤더
                OVERLOAD: '#F5D8CF', // 웜 피치
                DEPLETED: '#EADBC9', // 웜 오렌지 베이지
                CALM:     '#D4E5D6', // 세이지 민트
                ACTIVE:   '#BEE4ED'  // 아쿠아 블루
            };
            const currentCategory = (currentAnalysis && currentAnalysis.category) || window.currentSelectedCategory || 'CALM';
            const moodColor = MOOD_PASTEL_COLORS[currentCategory] || '#D4E5D6';

            // 1. 캔버스 액자 뒤 감정별 파스텔 글로우 백드롭 적용
            const glowEl = document.getElementById('canvas-backdrop-glow');
            if (glowEl) {
                glowEl.style.backgroundColor = moodColor;
            }

            // 2. 음악 플레이어의 보더, 프로그레스 바, 배지 컬러 동적 업데이트
            const musicSlot = document.getElementById('music-sticker-slot');
            if (musicSlot) {
                if (jamendoTrackInfo) {
                    const rawTempo = musicData.tempoBpm || '70';
                    const formattedTempo = rawTempo.includes('BPM') ? rawTempo : `${rawTempo} BPM`;

                    musicSlot.innerHTML = window.AndanteComponents.renderMusicSticker({
                        title: jamendoTrackInfo.name,
                        artist: jamendoTrackInfo.artist_name || "Andante AI",
                        image: jamendoTrackInfo.image || "",
                        tags: [
                            selectedMood,
                            musicData.primaryEmotion || '평온함',
                            formattedTempo
                        ],
                        isPlaying: isPlayingMusic,
                        themeColor: moodColor
                    });
                    const stickerBtn = musicSlot.querySelector('#sticker-play-btn');
                    if (stickerBtn) {
                        stickerBtn.onclick = () => {
                            if (window.jamendoAudio) {
                                if (isPlayingMusic) {
                                    window.jamendoAudio.pause();
                                }
                                else {
                                    pauseBGM();
                                    window.jamendoAudio.play();
                                }
                            }
                            isPlayingMusic = !isPlayingMusic;
                            updateWizardView();
                        };
                    }
                } else {
                    // 최근 곡도 없으면 404 NO_MATCH를 반환하고, 클라이언트는 플레이어를 숨기고 "지금은 이 마음에 맞는 음악을 찾지 못했어요."만 표시
                    musicSlot.innerHTML = `
                    <div class="max-w-2xl mx-auto rounded-3xl bg-white/85 backdrop-blur-md border border-stone-200/90 p-6 shadow-sm text-center text-stone-500 font-serif text-sm">
                        지금은 이 마음에 맞는 음악을 찾지 못했어요.
                    </div>`;
                }
            }
            const canvasSlot = document.getElementById('canvas-card-slot');
            if (canvasSlot) {
                const targetWeather = currentAnalysis?.weather || currentWeatherVal;
                if (currentAnalysis?.isAiFallback) {
                    canvasSlot.innerHTML = `
                    <div class="editorial-card text-center py-14 px-8 flex flex-col items-center gap-6" style="margin: 0 auto; max-width: 640px; background-color: #ffffff; border-radius: 1.5rem; border: 1px solid #E2DED9; box-shadow: 0 16px 36px -10px rgba(28, 25, 23, 0.06);">
                        <div style="width: 52px; height: 52px; border-radius: 50%; background: #fef3c7; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #d97706;">
                            ⏳
                        </div>
                        <div>
                            <p class="font-editorial-serif text-lg text-stone-800 font-medium mb-1">지금 그림과 시를 만드는 데 시간이 걸려요, 잠시 후 다시 시도해 주세요.</p>
                            <p class="text-xs text-stone-400 font-sans tracking-wide">선택하신 감정에 맞춘 힐링 음악은 정상적으로 재생되고 있습니다.</p>
                        </div>
                    </div>`;
                } else if (generatedImageUrl) {
                    canvasSlot.innerHTML = window.AndanteComponents.renderAICanvasCard({
                        imageUrl: generatedImageUrl,
                        isLoading: false,
                        weather: targetWeather
                    });
                } else {
                    canvasSlot.innerHTML = `
                    <div class="editorial-card text-center py-14 px-8 flex flex-col items-center gap-6" style="margin: 0 auto; max-width: 640px; background-color: #ffffff; border-radius: 1.5rem; border: 1px solid #E2DED9; box-shadow: 0 16px 36px -10px rgba(28, 25, 23, 0.06);">
                        <div style="width: 52px; height: 52px; border-radius: 50%; background: #f5f5f4; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #78716c;">
                            🎨
                        </div>
                        <div>
                            <h3 class="font-normal font-editorial-serif text-stone-800 text-xl mb-2">나만의 힐링 감성 캔버스 그리기</h3>
                            <p class="text-xs text-stone-500 font-light max-w-sm mx-auto leading-relaxed font-editorial-serif">
                                AI가 분석된 감정과 실시간 날씨(${targetWeather || '주변 환경'})를 담아 16:9 와이드 명화 화폭을 제작합니다.
                            </p>
                        </div>
                        <button id="draw-image-btn" class="active-press hover-lift" style="padding: 14px 32px; border-radius: 9999px; border: none; background: #1c1917; color: white; font-size: 0.8rem; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; display: inline-flex; align-items: center; gap: 0.5rem; cursor: pointer; box-shadow: 0 8px 20px -4px rgba(0,0,0,0.25);">
                            <span>🖼️</span><span>AI 캔버스 화폭 생성</span>
                        </button>
                    </div>
                    `;
                    const drawBtn = canvasSlot.querySelector('#draw-image-btn');
                    if (drawBtn) drawBtn.onclick = generateImage;
                }
            }

            // 3. 에디토리얼 글래스 감성에 맞게 리스타일링된 액션 버튼 (텍스트 줄바꿈 방지 및 한 줄 시원한 출력)
            const finalSlot = document.getElementById('final-actions-slot');
            if (finalSlot && generatedImageUrl) {
                finalSlot.innerHTML = `
                    <div class="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-8 max-w-2xl mx-auto w-full px-2">
                        <button id="start-healing-btn" class="active-press hover-lift start-healing-btn w-full sm:w-auto px-7 py-3.5 rounded-full border border-stone-800/80 bg-stone-900 text-white font-medium text-sm tracking-wider uppercase shadow-lg shadow-stone-900/10 transition-all duration-300 flex items-center justify-center gap-2.5 whitespace-nowrap flex-shrink-0 cursor-pointer">
                            <span style="font-size: 13px; color: ${moodColor}; filter: drop-shadow(0 0 6px ${moodColor});">✦</span>
                            <span class="font-editorial-serif tracking-wider whitespace-nowrap">힐링 모드 시작 (전체화면)</span>
                        </button>
                        <div class="flex items-center gap-3 w-full sm:w-auto justify-center">
                            <button id="final-save-btn" class="active-press hover-lift flex-1 sm:flex-none px-6 py-3.5 rounded-full border border-stone-200/90 bg-white/90 backdrop-blur-md text-stone-800 font-medium text-sm tracking-wide shadow-sm hover:border-stone-400 transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer">
                                <span>💾</span> <span class="font-editorial-serif">일기장 저장</span>
                            </button>
                            <button id="final-share-btn" class="active-press hover-lift flex-1 sm:flex-none px-6 py-3.5 rounded-full border border-stone-200/90 bg-white/90 backdrop-blur-md text-stone-800 font-medium text-sm tracking-wide shadow-sm hover:border-stone-400 transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer">
                                <span>🌐</span> <span class="font-editorial-serif">갤러리 공유</span>
                            </button>
                        </div>
                    </div>
                `;
                const saveBtn = finalSlot.querySelector('#final-save-btn');
                const shareBtn = finalSlot.querySelector('#final-share-btn');
                if (saveBtn) {
                    saveBtn.onclick = saveToDiary;
                    if (isDiarySavedForCurrentSession) {
                        saveBtn.disabled = true;
                        saveBtn.style.pointerEvents = 'none';
                        saveBtn.style.opacity = '0.75';
                        saveBtn.innerHTML = '<span>✅</span> <span class="font-editorial-serif">저장 완료</span>';
                    }
                }
                if (shareBtn) {
                    shareBtn.onclick = shareToBoard;
                    if (isBoardSharedForCurrentSession) {
                        shareBtn.disabled = true;
                        shareBtn.style.pointerEvents = 'none';
                        shareBtn.style.opacity = '0.75';
                        shareBtn.innerHTML = '<span>✅</span> <span class="font-editorial-serif">공유 완료</span>';
                    }
                }
            } else if (finalSlot) {
                finalSlot.innerHTML = '';
            }
        }
    }

    // Wiring Wizard Navigation
    const bindBtn = (id, action) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', action);
    };

    // Step 1 Mini-Wizard Buttons (Progressive Disclosure)
    const btnTo1b = document.getElementById('btn-to-1b');
    if (btnTo1b) {
        btnTo1b.addEventListener('click', () => {
            if (!cat) {
                showToast('마음의 큰 결을 먼저 골라주세요.');
                const catsBox = document.getElementById('cats');
                if (catsBox) catsBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }
            miniWizardStep = '1b';
            updateMiniWizardView();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => {
                const storyEl = document.getElementById('story');
                if (storyEl) storyEl.focus();
            }, 150);
        });
    }

    const btnBackTo1a = document.getElementById('btn-back-to-1a');
    if (btnBackTo1a) {
        btnBackTo1a.addEventListener('click', () => {
            miniWizardStep = '1a';
            updateMiniWizardView();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    bindBtn('btn-back-to-1', () => { 
        currentWizardStep = 1; 
        miniWizardStep = '1b';
        updateWizardView(); 
    });
    bindBtn('btn-back-to-2', () => { currentWizardStep = 2; updateWizardView(); });
    bindBtn('btn-next-to-3', () => { currentWizardStep = 3; updateWizardView(); });
    bindBtn('btn-restart', () => {
        currentWizardStep = 1;
        miniWizardStep = '1a';
        currentAnalysis = null;
        window.currentAnalysis = null;
        generatedImageUrl = null;
        window.generatedImageUrl = null;
        cat = null;
        sit = '';
        selectedMood = '';
        isDiarySavedForCurrentSession = false;
        isBoardSharedForCurrentSession = false;
        energyLevel = 50;
        isBatteryInteracted = false;
        const warmEl = document.getElementById('warm');
        if (warmEl) {
            warmEl.value = '50';
            const trackEl = document.getElementById('track');
            if (trackEl) trackEl.style.setProperty('--p', '50%');
            const info = getBatteryInfo(50);
            const warmWordEl = document.getElementById('warmWord');
            if (warmWordEl) warmWordEl.textContent = info.text;
            const warmNumEl = document.getElementById('warmNum');
            if (warmNumEl) warmNumEl.textContent = info.num;
        }
        const moodInput = document.getElementById('story') || document.getElementById('mood-input');
        if (moodInput) moodInput.value = '';
        if (window.jamendoAudio) {
            window.jamendoAudio.pause();
        }
        isPlayingMusic = false;
        
        applyEmotionPalette(null);
        paintTheme();
        updateCaption();
        swapTitle(DEFAULT_H1);

        const subHint = document.getElementById('subHint');
        const chipsBox = document.getElementById('chips');
        if (subHint) subHint.hidden = true;
        if (chipsBox) chipsBox.hidden = true;
        const catsBox = document.getElementById('cats');
        if (catsBox) {
            catsBox.querySelectorAll('.main-emotion-card, .cat').forEach(x => x.setAttribute('aria-pressed', 'false'));
        }

        updateWizardView();
    });

    // AI Analysis Execution (/api/ai/analyze)
    const analyzeBtn = document.getElementById('next') || document.getElementById('analyze-btn');
    const loader = document.getElementById('loader');

    if (analyzeBtn) {
        analyzeBtn.onclick = async () => {
            if (!token) {
                showToast('로그인이 필요한 서비스입니다. 로그인 화면으로 이동합니다.');
                setTimeout(() => { location.href = '/login.html'; }, 1200);
                return;
            }

            isDiarySavedForCurrentSession = false;
            isBoardSharedForCurrentSession = false;

            const storyEl = document.getElementById('story') || document.getElementById('mood-input');
            const moodPrompt = storyEl ? storyEl.value.trim() : '';

            if (!moodPrompt) {
                return showToast('오늘의 솔직한 기분을 입력해주세요.');
            }

            if (loader) {
                loader.classList.remove('hidden');
                requestAnimationFrame(() => {
                    loader.classList.remove('opacity-0', 'pointer-events-none');
                    loader.classList.add('opacity-100', 'pointer-events-auto');
                });
            }
            document.getElementById('step-1-input').classList.add('hidden');
            const heroSec = document.getElementById('hero-section');
            if (heroSec) heroSec.classList.add('hidden');
            analyzeBtn.disabled = true;

            const loaderPercentage = document.getElementById('loader-percentage');
            const loaderBar = document.getElementById('loader-bar');
            const loaderText = document.getElementById('loader-text');
            const loaderOrb = document.getElementById('loader-orb');
            const loaderBreath = document.getElementById('loader-breath');

            if (loaderOrb) {
                loaderOrb.style.setProperty('--h', H);
            }

            let breathCount = 0;
            if (loaderBreath) loaderBreath.textContent = '들이쉬고…';
            const breathInterval = setInterval(() => {
                breathCount++;
                if (loaderBreath) {
                    loaderBreath.textContent = breathCount % 2 === 0 ? '들이쉬고…' : '내쉬고…';
                }
            }, 2800);
            
            let currentProgress = 0;
            if (loaderPercentage) loaderPercentage.textContent = '0';
            if (loaderBar) { loaderBar.style.width = '0%'; loaderBar.style.opacity = '1'; }
            if (loaderText) loaderText.textContent = '적어주신 이야기 속 감정과 에너지 분석 중...';

            // Asymptotic timer interval
            const progressInterval = setInterval(() => {
                let next = currentProgress;
                if (currentProgress < 20) {
                    next = currentProgress + Math.random() * 5 + 2;
                } else if (currentProgress < 45) {
                    next = currentProgress + Math.random() * 3 + 1;
                } else if (currentProgress < 75) {
                    next = currentProgress + Math.random() * 2 + 0.5;
                } else if (currentProgress < 92) {
                    next = currentProgress + Math.random() * 1 + 0.2;
                } else if (currentProgress < 99) {
                    next = currentProgress + 0.1;
                }

                if (next >= 20 && currentProgress < 20 && loaderText) loaderText.textContent = '마음을 다독이는 시 한 편을 짓는 중...';
                if (next >= 45 && currentProgress < 45 && loaderText) loaderText.textContent = '기분과 호흡에 맞는 힐링 음악 탐색 중...';
                if (next >= 75 && currentProgress < 75 && loaderText) loaderText.textContent = '안단테의 맞춤 힐링 처방을 정리하는 중...';

                currentProgress = Math.min(next, 99);
                if (loaderPercentage) loaderPercentage.textContent = Math.floor(currentProgress).toString();
                if (loaderBar) loaderBar.style.width = `${currentProgress}%`;
            }, 300);

            try {
                let data = null;
                try {
                const res = await fetch('/api/ai/analyze', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        story: moodPrompt,
                        situationTag: sit || selectedMood || (cat ? cat.s[0] : '일상'),
                        primaryCategory: cat ? cat.n : '미지정',
                        batteryLevel: isBatteryInteracted ? energyLevel : null,
                        weather: rawWeatherMain || 'Clear',
                        location: currentLocationVal,
                        userProfile: {
                            gender: sessionStorage.getItem('authGender') || '남성',
                            age: sessionStorage.getItem('authAge') || 24
                        }
                    })
                });

                if (res.ok) {
                    data = await res.json();
                } else {
                    const errData = await res.json().catch(() => ({}));
                    const fallbackNotice = errData.notice || errData.message || "지금 그림과 시를 만드는 데 시간이 걸려요, 잠시 후 다시 시도해 주세요.";
                    showToast(fallbackNotice);
                    data = {
                        isAiFallback: true,
                        notice: fallbackNotice,
                        poem: {
                            title: "마음의 쉼표",
                            stanza1: "복잡한 생각 잠시 내려놓고\n조용히 머무는 시간",
                            stanza2: "나를 감싸는 온기 속에서\n천천히 숨을 고릅니다"
                        },
                        primaryCategory: cat ? cat.n : '미지정',
                        situationTag: sit || selectedMood || '일상'
                    };
                }
            } catch (netErr) {
                console.warn('[AI 분석 네트워크 에러] 안전 Fallback 모드로 전환:', netErr.message);
                const fallbackNotice = "지금 그림과 시를 만드는 데 시간이 걸려요, 잠시 후 다시 시도해 주세요.";
                showToast(fallbackNotice);
                data = {
                    isAiFallback: true,
                    notice: fallbackNotice,
                    poem: {
                        title: "마음의 쉼표",
                        stanza1: "복잡한 생각 잠시 내려놓고\n조용히 머무는 시간",
                        stanza2: "나를 감싸는 온기 속에서\n천천히 숨을 고릅니다"
                    },
                    primaryCategory: cat ? cat.n : '미지정',
                    situationTag: sit || selectedMood || '일상'
                };
            }

            if (data.isAiFallback && data.notice) {
                showToast(data.notice);
            }

            currentAnalysis = data;
            window.currentAnalysis = data;
            generatedImageUrl = null;
            window.generatedImageUrl = null;
                
                // Fetch Jamendo Track
                jamendoTrackInfo = null;
                if (window.jamendoAudio) {
                    window.jamendoAudio.pause();
                    window.jamendoAudio = null;
                }
                // 1) 선택된 세부 상황 객체의 jamendoSafeTag를 찾음
                let targetTag = getSelectedJamendoSafeTag();

                // 2) jamendoSafeTag가 없을 때만 aiMusicTags를 참고하고, 허용 목록에 있는 값만 사용
                if (!targetTag && data.structuredData?.aiMusicTags && Array.isArray(data.structuredData.aiMusicTags)) {
                    for (const rawTag of data.structuredData.aiMusicTags) {
                        const mapped = mapToValidJamendoTag(rawTag);
                        if (mapped) {
                            targetTag = mapped;
                            break;
                        }
                    }
                }

                const catName = cat ? cat.n : (currentAnalysis?.primaryCategory || '');
                const sitName = sit || selectedMood || '';
                const bpm = data.structuredData?.tempoBpm || '';

                if (targetTag) {
                    await loadJamendoTrack(targetTag, bpm, catName, sitName);
                } else {
                    // jamendoSafeTag가 없으면 음악을 요청하지 않고 플레이어를 숨김
                    jamendoTrackInfo = null;
                }

                // Set themeColor for analysis and diary from currently selected emotion palette
                const currentPalette = (cat && EMOTION_PALETTES[cat.n]) ? EMOTION_PALETTES[cat.n] : EMOTION_PALETTES.DEFAULT;
                data.themeColor = currentPalette.bg;

                clearInterval(progressInterval); clearInterval(breathInterval);
                currentProgress = 100;
                if (loaderPercentage) loaderPercentage.textContent = '100';
                if (loaderBar) loaderBar.style.width = '100%';
                if (loaderText) loaderText.textContent = '처방 완료!';
                
                const loaderCard = document.getElementById('loader-card');
                if (loaderCard) loaderCard.style.transform = 'scale(1.05)';

                await new Promise(r => setTimeout(r, 800));

                currentWizardStep = 2; // Move to Step 2
                updateWizardView();

            } catch (err) {
                clearInterval(progressInterval); clearInterval(breathInterval);
                showToast(err.message);
                currentWizardStep = 1; // back to step 1 on fail
                updateWizardView();
            } finally {
                if (loader) {
                    loader.classList.replace('opacity-100', 'opacity-0');
                    loader.classList.replace('pointer-events-auto', 'pointer-events-none');
                    setTimeout(() => {
                        loader.classList.add('hidden');
                        const loaderCard = document.getElementById('loader-card');
                        if (loaderCard) loaderCard.style.transform = 'scale(1)';
                    }, 300);
                }
                analyzeBtn.disabled = false;
            }
        };
    }

    // Image Generation Request (/api/ai/image)
    async function generateImage() {
        if (!currentAnalysis) return;
        const promptStr = currentAnalysis.imagePrompt || currentAnalysis.english_prompt || 'artistic tranquil painting';
        const weatherVal = currentAnalysis.weather || currentWeatherVal || 'Clear';

        // Show Loading inside Canvas Slot
        const canvasSlot = document.getElementById('canvas-card-slot');
        if (canvasSlot) {
            canvasSlot.innerHTML = window.AndanteComponents.renderAICanvasCard({
                imageUrl: null,
                isLoading: true,
                weather: weatherVal
            });
        }

        try {
            const res = await fetch('/api/ai/image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    prompt: promptStr, 
                    weather: weatherVal,
                    userGender: currentAnalysis.userGender || sessionStorage.getItem('authGender') || '남성',
                    primaryCategory: currentAnalysis.primaryCategory 
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '그림 생성 실패');

            generatedImageUrl = data.image_base64;
            window.generatedImageUrl = data.image_base64;
            updateWizardView();
        } catch (err) {
            showToast(err.message);
            updateWizardView(); // restore draw button
        }
    }

    let isSubmitting = false;
    let isDiarySavedForCurrentSession = false;
    let isBoardSharedForCurrentSession = false;

    // Save to Diary (/api/diaries)
    async function saveToDiary() {
        window.stopAllAudios();
        if (!currentAnalysis || !generatedImageUrl) return;
        if (!token) return location.href = '/login.html';

        if (isDiarySavedForCurrentSession) {
            showToast('이미 일기장에 저장된 기록입니다.');
            return;
        }

        if (isSubmitting) return;
        isSubmitting = true;

        const btn = document.getElementById('final-save-btn');
        const oldText = btn ? btn.innerHTML : '';
        if (btn) {
            btn.disabled = true;
            btn.style.pointerEvents = 'none';
            btn.innerHTML = '<span>⏳</span> <span class="font-editorial-serif">저장 중...</span>';
        }

        try {
            // [Requirement 1] 저장 시점에 실제 Jamendo 곡이 재생/준비 중이었을 때만 곡 정보 채우기
            const isRealJamendoTrack = Boolean(
                jamendoTrackInfo && 
                jamendoTrackInfo.id && 
                jamendoTrackInfo.name && 
                jamendoTrackInfo.artist_name && 
                jamendoTrackInfo.artist_name !== "Andante AI" &&
                (!jamendoTrackInfo.audio || !jamendoTrackInfo.audio.includes('soundhelix.com'))
            );
            const musicPayload = isRealJamendoTrack ? {
                music_mood: 'ID:' + jamendoTrackInfo.id,
                music_title: jamendoTrackInfo.name,
                music_artist: jamendoTrackInfo.artist_name,
                music_duration: jamendoTrackInfo.duration || null,
                music_image: jamendoTrackInfo.image || null
            } : {
                music_mood: null,
                music_title: null,
                music_artist: null,
                music_duration: null,
                music_image: null
            };

            const res = await fetch('/api/diaries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    weather: currentAnalysis.weather || 'Sunny',
                    mood: selectedMood,
                    theme: currentAnalysis.poem?.title || currentAnalysis.theme,
                    image_base64: generatedImageUrl,
                    poem_text: (currentAnalysis.poem?.stanza1 || '') + '\n\n' + (currentAnalysis.poem?.stanza2 || ''),
                    theme_color: currentAnalysis.themeColor || '',
                    ...musicPayload
                })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                isDiarySavedForCurrentSession = true;
                if (data.alreadySaved) {
                    showToast('이미 일기장에 저장된 기록입니다.');
                } else {
                    showToast('💾 내 일기장에 저장되었습니다!');
                }
                if (btn) {
                    btn.disabled = true;
                    btn.style.pointerEvents = 'none';
                    btn.style.opacity = '0.75';
                    btn.innerHTML = '<span>✅</span> <span class="font-editorial-serif">저장 완료</span>';
                }
            } else {
                showToast('저장 실패: ' + (data.error || '잠시 후 다시 시도해 주세요.'));
                if (btn) {
                    btn.disabled = false;
                    btn.style.pointerEvents = 'auto';
                    btn.innerHTML = oldText;
                }
            }
        } catch (e) {
            showToast('오류가 발생했습니다.');
            if (btn) {
                btn.disabled = false;
                btn.style.pointerEvents = 'auto';
                btn.innerHTML = oldText;
            }
        } finally {
            isSubmitting = false;
        }
    }

    // Share to Board (/api/boards)
    async function shareToBoard() {
        if (!currentAnalysis || !generatedImageUrl) return;
        if (!token) return location.href = '/login.html';

        if (isBoardSharedForCurrentSession) {
            showToast('이미 갤러리에 공유된 기록입니다.');
            return;
        }

        if (isSubmitting) return;

        const defaultTitle = currentAnalysis.poem?.title || currentAnalysis.theme || '나의 오늘';
        const title = await NeoModal.prompt('공유할 제목을 입력하세요:', defaultTitle);
        if (!title || !title.trim()) return;

        isSubmitting = true;
        const btn = document.getElementById('final-share-btn');
        const oldText = btn ? btn.innerHTML : '';
        if (btn) {
            btn.disabled = true;
            btn.style.pointerEvents = 'none';
            btn.innerHTML = '<span>⏳</span> <span class="font-editorial-serif">공유 중...</span>';
        }

        const moodPrompt = (document.getElementById('story') || document.getElementById('mood-input'))?.value.trim() || '';

        try {
            // [Requirement 1] 저장 시점에 실제 Jamendo 곡 정보 보관
            const isRealJamendoTrack = Boolean(
                jamendoTrackInfo && 
                jamendoTrackInfo.id && 
                jamendoTrackInfo.name && 
                jamendoTrackInfo.artist_name && 
                jamendoTrackInfo.artist_name !== "Andante AI" &&
                (!jamendoTrackInfo.audio || !jamendoTrackInfo.audio.includes('soundhelix.com'))
            );
            const musicPayload = isRealJamendoTrack ? {
                music_mood: 'ID:' + jamendoTrackInfo.id,
                music_title: jamendoTrackInfo.name,
                music_artist: jamendoTrackInfo.artist_name,
                music_duration: jamendoTrackInfo.duration || null,
                music_image: jamendoTrackInfo.image || null
            } : {
                music_mood: null,
                music_title: null,
                music_artist: null,
                music_duration: null,
                music_image: null
            };

            const res = await fetch('/api/boards', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title,
                    content: moodPrompt,
                    weather: currentAnalysis.weather || 'Sunny',
                    mood: selectedMood,
                    theme: currentAnalysis.poem?.title || currentAnalysis.theme,
                    image_base64: generatedImageUrl,
                    poem_text: (currentAnalysis.poem?.stanza1 || '') + '\n\n' + (currentAnalysis.poem?.stanza2 || ''),
                    theme_color: currentAnalysis.themeColor || (cat && typeof EMOTION_PALETTES !== 'undefined' && EMOTION_PALETTES[cat.n] ? EMOTION_PALETTES[cat.n].bg : '#FDFBD4'),
                    ...musicPayload
                })
            });
            if (res.ok) {
                isBoardSharedForCurrentSession = true;
                showToast('🌐 공유 갤러리에 등록되었습니다!');
                if (btn) {
                    btn.disabled = true;
                    btn.style.pointerEvents = 'none';
                    btn.style.opacity = '0.75';
                    btn.innerHTML = '<span>✅</span> <span class="font-editorial-serif">공유 완료</span>';
                }
            } else {
                const errData = await res.json().catch(() => ({})); showToast('공유 실패: ' + (errData.error || '잠시 후 다시 시도해 주세요.'));
                if (btn) {
                    btn.disabled = false;
                    btn.style.pointerEvents = 'auto';
                    btn.innerHTML = oldText;
                }
            }
        } catch (e) {
            console.error('shareToBoard error:', e);
            showToast('오류가 발생했습니다.');
            if (btn) {
                btn.disabled = false;
                btn.style.pointerEvents = 'auto';
                btn.innerHTML = oldText;
            }
        } finally {
            isSubmitting = false;
        }
    }

    // Modal Events (Diary Modal)
    if (diaryBtn) {
        diaryBtn.onclick = async () => {
            if (!token) return showToast('로그인이 필요합니다.');
            if (window.history && window.history.replaceState && !window.location.search.includes('view=diary')) {
                window.history.replaceState({ view: 'diary' }, '', '/?view=diary');
            }
            const diarySection = document.getElementById('diary-section');
            const mainContent = document.getElementById('main-content');
            const postsContainer = document.getElementById('posts-container');
            const postsLoader = document.getElementById('posts-loader');
            
            if (diarySection) diarySection.classList.remove('hidden');
            if (mainContent) mainContent.classList.add('hidden');
            if (postsLoader) postsLoader.classList.remove('hidden');

            try {
                const res = await fetch('/api/diaries', { headers: { 'Authorization': `Bearer ${token}` } });
                const diaries = await res.json();
                if (postsLoader) postsLoader.classList.add('hidden');
                postsContainer.innerHTML = '';

                if (!diaries || diaries.length === 0) {
                    postsContainer.innerHTML = '<p style="text-align:center; color:#fff;">저장된 일기가 없습니다.</p>';
                    return;
                }

                window.cachedDiaries = diaries;
                window.currentDiaryIndex = 0;
                renderDiaryBook();
            } catch (e) {
                if (postsLoader) postsLoader.classList.add('hidden');
                postsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:red;">일기 불러오기 실패</p>';
            }
        };
    }

    window.flipDiary = (dir) => {
        window.stopAllAudios();
        if (!window.cachedDiaries) return;
        window.currentDiaryIndex += dir;
        renderDiaryBook();
    };

    window.deleteDiary = async (id) => {
        if (!(await NeoModal.confirm('정말 삭제하시겠습니까?'))) return;
        try {
            const res = await fetch(`/api/diaries/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                showToast('삭제되었습니다.');
                document.getElementById('diary-btn').click(); // reload
            }
        } catch (e) { }
    };

    window.shareDiary = async (idx) => {
        const d = window.cachedDiaries[idx];
        if (!d) return;
        if (!(await NeoModal.confirm('이 일기를 공유게시판에 올리시겠습니까?'))) return;
        const title = await NeoModal.prompt('공유할 제목을 입력하세요:', d.THEME);
        if (!title) return;

        try {
            const res = await fetch('/api/boards/share', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    diary_id: d.ID,
                    title: title,
                    content: d.THEME
                })
            });
            if (res.ok) {
                showToast('🌐 공유 게시판에 등록되었습니다!');
            } else {
                const data = await res.json();
                showToast(data.error || '공유 실패');
            }
        } catch (e) {
            showToast('오류 발생');
        }
    };

    function setupDiaryCustomPlayer(audioEl, diaryId, trackDuration) {
        if (!audioEl) return;
        const playBtn = document.getElementById(`diary-custom-play-btn-${diaryId}`);
        const vinylWrapper = document.getElementById(`diary-vinyl-wrapper-${diaryId}`);
        const playIcon = document.getElementById(`diary-play-icon-${diaryId}`);
        const pauseIcon = document.getElementById(`diary-pause-icon-${diaryId}`);
        const vinylDisc = document.getElementById(`diary-vinyl-disc-${diaryId}`);
        const progressContainer = document.getElementById(`diary-progress-container-${diaryId}`);
        const progressFill = document.getElementById(`diary-progress-fill-${diaryId}`);
        const curTimeEl = document.getElementById(`diary-audio-cur-time-${diaryId}`);
        const totalTimeEl = document.getElementById(`diary-audio-total-time-${diaryId}`);

        function formatTime(sec) {
            if (!sec || isNaN(sec)) return '0:00';
            const m = Math.floor(sec / 60);
            const s = Math.floor(sec % 60);
            return `${m}:${s < 10 ? '0' : ''}${s}`;
        }

        if (trackDuration && totalTimeEl) {
            totalTimeEl.textContent = formatTime(trackDuration);
        }

        audioEl.addEventListener('loadedmetadata', () => {
            if (totalTimeEl) totalTimeEl.textContent = formatTime(audioEl.duration);
        });

        audioEl.addEventListener('timeupdate', () => {
            if (!audioEl.duration) return;
            const pct = (audioEl.currentTime / audioEl.duration) * 100;
            if (progressFill) progressFill.style.width = `${pct}%`;
            if (curTimeEl) curTimeEl.textContent = formatTime(audioEl.currentTime);
            if (totalTimeEl && (!trackDuration || totalTimeEl.textContent === '--:--')) {
                totalTimeEl.textContent = formatTime(audioEl.duration);
            }
        });

        audioEl.addEventListener('play', () => {
            pauseBGM();
            if (playIcon) playIcon.classList.add('hidden');
            if (pauseIcon) pauseIcon.classList.remove('hidden');
            if (vinylDisc) vinylDisc.classList.add('vinyl-spin');
        });

        audioEl.addEventListener('pause', () => {
            if (playIcon) playIcon.classList.remove('hidden');
            if (pauseIcon) pauseIcon.classList.add('hidden');
            if (vinylDisc) vinylDisc.classList.remove('vinyl-spin');
        });

        audioEl.addEventListener('ended', () => {
            if (playIcon) playIcon.classList.remove('hidden');
            if (pauseIcon) pauseIcon.classList.add('hidden');
            if (vinylDisc) vinylDisc.classList.remove('vinyl-spin');
            if (progressFill) progressFill.style.width = '0%';
            if (curTimeEl) curTimeEl.textContent = '0:00';
        });

        const togglePlay = () => {
            if (audioEl.paused) {
                audioEl.play().catch(e => console.warn('Audio play error:', e.message));
            } else {
                audioEl.pause();
            }
        };

        if (playBtn) playBtn.onclick = togglePlay;
        if (vinylWrapper) vinylWrapper.onclick = togglePlay;

        if (progressContainer) {
            progressContainer.onclick = (e) => {
                const rect = progressContainer.getBoundingClientRect();
                const clickPos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                if (audioEl.duration) {
                    audioEl.currentTime = clickPos * audioEl.duration;
                }
            };
        }
    }

    async function loadDiaryMusicPlayer(diary) {
        const playerContainer = document.getElementById('diary-music-player-container');
        if (!playerContainer) return;
        
        let musicTitle = (diary && (diary.MUSIC_TITLE || diary.music_title)) ? String(diary.MUSIC_TITLE || diary.music_title).trim() : '';
        let musicArtist = (diary && (diary.MUSIC_ARTIST || diary.music_artist)) ? String(diary.MUSIC_ARTIST || diary.music_artist).trim() : '';
        let musicImage = (diary && (diary.MUSIC_IMAGE || diary.music_image)) ? String(diary.MUSIC_IMAGE || diary.music_image).trim() : '';
        let musicDuration = (diary && (diary.MUSIC_DURATION || diary.music_duration)) ? parseInt(diary.MUSIC_DURATION || diary.music_duration) : null;
        const musicMood = (diary && (diary.MUSIC_MOOD || diary.music_mood)) ? String(diary.MUSIC_MOOD || diary.music_mood).trim() : '';
        const diaryId = (diary && (diary.ID || diary.id)) || '미지정';

        let trackId = null;
        if (musicMood && musicMood.startsWith('ID:')) {
            trackId = musicMood.split(':')[1];
        }

        // 곡 제목도 없고 유효한 Jamendo ID도 없으면 완전히 숨김
        if (!musicTitle && !trackId) {
            playerContainer.style.display = 'none';
            playerContainer.style.opacity = '0';
            playerContainer.innerHTML = '';
            return;
        }

        // 1) 신규 일기 (곡 이름이 저장되어 있는 경우)
        if (musicTitle) {
            playerContainer.style.display = 'block';
            playerContainer.innerHTML = `
                <div class="glass-panel p-3.5 sm:p-4 px-4 sm:px-6 flex items-center justify-between rounded-2xl mx-auto border border-stone-200/80 bg-white/90 backdrop-blur-md shadow-sm gap-3 sm:gap-4 transition-all duration-300" style="width: 100%; box-sizing: border-box;">
                    <!-- Left: Vinyl Album Art + Track Info -->
                    <div class="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                        <div class="relative w-11 h-11 sm:w-12 sm:h-12 flex-shrink-0 cursor-pointer group" id="diary-vinyl-wrapper-${diaryId}" title="재생 / 일시정지">
                            <div id="diary-vinyl-disc-${diaryId}" class="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden shadow-md border-2 border-stone-800/10 relative flex items-center justify-center bg-stone-900 transition-transform duration-300 group-hover:scale-105">
                                ${musicImage ? `<img id="diary-cover-img-${diaryId}" src="${musicImage}" alt="Album Art" class="w-full h-full object-cover" />` : `<span id="diary-cover-emoji-${diaryId}" class="text-lg">🎵</span>`}
                                <div class="absolute w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-white/95 border border-stone-300 shadow-sm flex items-center justify-center pointer-events-none">
                                    <div class="w-1 h-1 rounded-full bg-stone-800"></div>
                                </div>
                            </div>
                        </div>
                        <div class="min-w-0 flex-1 pr-1 sm:pr-2">
                            <div class="flex items-center gap-2 flex-wrap">
                                <h4 class="text-xs sm:text-sm font-medium text-stone-800 truncate font-editorial-serif tracking-tight" style="margin: 0;">${musicTitle}</h4>
                                <span id="diary-music-unavailable-${diaryId}" class="text-[10px] sm:text-[11px] text-stone-400 font-sans tracking-tight hidden">지금은 재생할 수 없어요</span>
                            </div>
                            ${musicArtist ? `<p class="text-[10px] sm:text-[11px] font-medium text-stone-500 mt-0.5 truncate font-editorial-sub">by ${musicArtist}</p>` : ''}
                        </div>
                    </div>

                    <!-- Right: Minimalist Controls -->
                    <div id="diary-audio-slot-${diaryId}" class="flex-shrink-0 flex items-center gap-2 sm:gap-3">
                        <span class="text-xs text-stone-300 font-mono">음원 연결 중...</span>
                    </div>
                </div>
            `;
            setTimeout(() => { playerContainer.style.opacity = '1'; }, 50);

            const audioSlot = document.getElementById(`diary-audio-slot-${diaryId}`);
            const unavailableNotice = document.getElementById(`diary-music-unavailable-${diaryId}`);
            const vinylDisc = document.getElementById(`diary-vinyl-disc-${diaryId}`);

            if (!trackId) {
                console.warn(`[일기 음악 조회 실패] 일기 ID: ${diaryId}, 곡 ID: 없음, 실패 사유: 트랙 ID 없음`);
                if (audioSlot) audioSlot.innerHTML = '';
                if (unavailableNotice) unavailableNotice.classList.remove('hidden');
                return;
            }

            try {
                const res = await fetch(`/api/music?id=${encodeURIComponent(trackId)}&diary_id=${encodeURIComponent(diaryId)}`);
                if (!res.ok) {
                    const reason = res.status === 404 ? '404 (음원 없음)' : `HTTP ${res.status}`;
                    console.warn(`[일기 음악 조회 실패] 일기 ID: ${diaryId}, 곡 ID: ${trackId}, 실패 사유: ${reason}`);
                    if (audioSlot) audioSlot.innerHTML = '';
                    if (unavailableNotice) unavailableNotice.classList.remove('hidden');
                    return;
                }

                const data = await res.json();
                if (data.success && data.track && data.track.audio) {
                    const track = data.track;
                    // 커버 이미지 갱신
                    if (track.image && vinylDisc) {
                        const coverImg = document.getElementById(`diary-cover-img-${diaryId}`);
                        if (coverImg) {
                            coverImg.src = track.image;
                        } else {
                            vinylDisc.innerHTML = `
                                <img id="diary-cover-img-${diaryId}" src="${track.image}" alt="Album Art" class="w-full h-full object-cover" />
                                <div class="absolute w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-white/95 border border-stone-300 shadow-sm flex items-center justify-center pointer-events-none">
                                    <div class="w-1 h-1 rounded-full bg-stone-800"></div>
                                </div>
                            `;
                        }
                    }

                    if (audioSlot) {
                        audioSlot.innerHTML = `
                            <audio id="diary-native-audio-${diaryId}" src="${track.audio}" preload="metadata"></audio>
                            <span id="diary-audio-cur-time-${diaryId}" class="text-[10px] sm:text-[11px] font-mono text-stone-400 w-7 sm:w-8 text-right select-none">0:00</span>
                            <div id="diary-progress-container-${diaryId}" class="relative w-20 sm:w-40 h-1.5 hover:h-2 bg-stone-200/80 rounded-full cursor-pointer transition-all duration-150 overflow-hidden flex items-center group">
                                <div id="diary-progress-fill-${diaryId}" class="h-full bg-stone-800 rounded-full w-0 transition-all duration-75"></div>
                            </div>
                            <span id="diary-audio-total-time-${diaryId}" class="text-[10px] sm:text-[11px] font-mono text-stone-400 w-7 sm:w-8 select-none">--:--</span>
                            <button id="diary-custom-play-btn-${diaryId}" class="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-stone-900 hover:bg-stone-800 text-white flex items-center justify-center shadow-md transition-all active:scale-95 flex-shrink-0 cursor-pointer ml-1" title="재생">
                                <svg id="diary-play-icon-${diaryId}" class="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                <svg id="diary-pause-icon-${diaryId}" class="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current hidden" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                            </button>
                        `;
                        const audioEl = document.getElementById(`diary-native-audio-${diaryId}`);
                        setupDiaryCustomPlayer(audioEl, diaryId, track.duration || musicDuration);
                    }
                } else {
                    console.warn(`[일기 음악 조회 실패] 일기 ID: ${diaryId}, 곡 ID: ${trackId}, 실패 사유: 응답에 오디오 URL 없음`);
                    if (audioSlot) audioSlot.innerHTML = '';
                    if (unavailableNotice) unavailableNotice.classList.remove('hidden');
                }
            } catch (err) {
                console.warn(`[일기 음악 조회 실패] 일기 ID: ${diaryId}, 곡 ID: ${trackId}, 실패 사유: 네트워크 오류 (${err.message})`);
                if (audioSlot) audioSlot.innerHTML = '';
                if (unavailableNotice) unavailableNotice.classList.remove('hidden');
            }
            return;
        }

        // 2) 기존 일기 (곡 이름 컬럼은 비어있으나 trackId는 있는 경우: Jamendo에서 복원 로드)
        if (!musicTitle && trackId) {
            try {
                const res = await fetch(`/api/music?id=${encodeURIComponent(trackId)}&diary_id=${encodeURIComponent(diaryId)}`);
                if (!res.ok) {
                    playerContainer.style.display = 'none';
                    playerContainer.style.opacity = '0';
                    playerContainer.innerHTML = '';
                    return;
                }
                const data = await res.json();
                if (data.success && data.track && data.track.audio) {
                    const track = data.track;
                    musicTitle = track.name || '추천 음악';
                    musicArtist = track.artist_name || '';
                    musicImage = track.image || '';
                    musicDuration = track.duration || null;
                    if (diary) {
                        diary.MUSIC_TITLE = musicTitle;
                        diary.MUSIC_ARTIST = musicArtist;
                        diary.MUSIC_IMAGE = musicImage;
                        diary.MUSIC_DURATION = musicDuration;
                    }

                    playerContainer.style.display = 'block';
                    playerContainer.innerHTML = `
                        <div class="glass-panel p-3.5 sm:p-4 px-4 sm:px-6 flex items-center justify-between rounded-2xl mx-auto border border-stone-200/80 bg-white/90 backdrop-blur-md shadow-sm gap-3 sm:gap-4 transition-all duration-300" style="width: 100%; box-sizing: border-box;">
                            <!-- Left: Vinyl Album Art + Track Info -->
                            <div class="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                                <div class="relative w-11 h-11 sm:w-12 sm:h-12 flex-shrink-0 cursor-pointer group" id="diary-vinyl-wrapper-${diaryId}" title="재생 / 일시정지">
                                    <div id="diary-vinyl-disc-${diaryId}" class="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden shadow-md border-2 border-stone-800/10 relative flex items-center justify-center bg-stone-900 transition-transform duration-300 group-hover:scale-105">
                                        ${musicImage ? `<img id="diary-cover-img-${diaryId}" src="${musicImage}" alt="Album Art" class="w-full h-full object-cover" />` : `<span id="diary-cover-emoji-${diaryId}" class="text-lg">🎵</span>`}
                                        <div class="absolute w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-white/95 border border-stone-300 shadow-sm flex items-center justify-center pointer-events-none">
                                            <div class="w-1 h-1 rounded-full bg-stone-800"></div>
                                        </div>
                                    </div>
                                </div>
                                <div class="min-w-0 flex-1 pr-1 sm:pr-2">
                                    <h4 class="text-xs sm:text-sm font-medium text-stone-800 truncate font-editorial-serif tracking-tight" style="margin: 0;">${musicTitle}</h4>
                                    ${musicArtist ? `<p class="text-[10px] sm:text-[11px] font-medium text-stone-500 mt-0.5 truncate font-editorial-sub">by ${musicArtist}</p>` : ''}
                                </div>
                            </div>

                            <!-- Right: Minimalist Controls -->
                            <div id="diary-audio-slot-${diaryId}" class="flex-shrink-0 flex items-center gap-2 sm:gap-3">
                                <audio id="diary-native-audio-${diaryId}" src="${track.audio}" preload="metadata"></audio>
                                <span id="diary-audio-cur-time-${diaryId}" class="text-[10px] sm:text-[11px] font-mono text-stone-400 w-7 sm:w-8 text-right select-none">0:00</span>
                                <div id="diary-progress-container-${diaryId}" class="relative w-20 sm:w-40 h-1.5 hover:h-2 bg-stone-200/80 rounded-full cursor-pointer transition-all duration-150 overflow-hidden flex items-center group">
                                    <div id="diary-progress-fill-${diaryId}" class="h-full bg-stone-800 rounded-full w-0 transition-all duration-75"></div>
                                </div>
                                <span id="diary-audio-total-time-${diaryId}" class="text-[10px] sm:text-[11px] font-mono text-stone-400 w-7 sm:w-8 select-none">--:--</span>
                                <button id="diary-custom-play-btn-${diaryId}" class="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-stone-900 hover:bg-stone-800 text-white flex items-center justify-center shadow-md transition-all active:scale-95 flex-shrink-0 cursor-pointer ml-1" title="재생">
                                    <svg id="diary-play-icon-${diaryId}" class="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                    <svg id="diary-pause-icon-${diaryId}" class="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current hidden" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                                </button>
                            </div>
                        </div>
                    `;
                    setTimeout(() => { playerContainer.style.opacity = '1'; }, 50);
                    const audioEl = document.getElementById(`diary-native-audio-${diaryId}`);
                    setupDiaryCustomPlayer(audioEl, diaryId, track.duration || musicDuration);
                } else {
                    playerContainer.style.display = 'none';
                    playerContainer.style.opacity = '0';
                    playerContainer.innerHTML = '';
                }
            } catch (err) {
                playerContainer.style.display = 'none';
                playerContainer.style.opacity = '0';
                playerContainer.innerHTML = '';
            }
        }
    }

    // 🌿 일기장에 저장된 감정 및 상황에 따른 테마/그라데이션 분석 함수
    function getDiaryThemeAndGradient(d) {
        if (!d) return { gradient: 'linear-gradient(135deg, #F8CAD3 0%, #F2B2C0 100%)', color: '#F8CAD3', cat: null, sit: null };

        const moodStr = String(d.MOOD || '').trim();
        let matchedCat = null;
        let matchedSit = null;

        // 1. 세부 상황 48종 라벨과 직접 매칭
        for (const cat of HEALING_MOOD_DATA) {
            const sit = cat.subSituations.find(s => 
                s.label === moodStr || 
                (moodStr && s.label.includes(moodStr)) || 
                (moodStr && moodStr.includes(s.label))
            );
            if (sit) {
                matchedCat = cat;
                matchedSit = sit;
                break;
            }
        }

        // 2. 대분류 감정 ID 또는 한글 타이틀 매칭
        if (!matchedCat) {
            for (const cat of HEALING_MOOD_DATA) {
                const cleanTitle = cat.title.replace(/[^\uAC00-\uD7AFa-zA-Z]/g, '');
                const cleanMood = moodStr.replace(/[^\uAC00-\uD7AFa-zA-Z]/g, '');
                if (cat.id === moodStr || (cleanMood && (cleanTitle.includes(cleanMood) || cleanMood.includes(cleanTitle)))) {
                    matchedCat = cat;
                    break;
                }
            }
        }

        // 3. 키워드 기반 자연어 감정 탐색 (Mood, Theme, PoemText)
        if (!matchedCat) {
            const textToSearch = `${moodStr} ${d.THEME || ''} ${d.POEM_TEXT || ''}`;
            const keywordMap = {
                LOVE: ['사랑', '설렘', '두근', '연인', '짝사랑', '호감', '마음', '고백'],
                DOWN: ['가라앉', '이별', '우울', '슬픔', '눈물', '외로', '먹먹', '상처', '지침', '아픔'],
                OVERLOAD: ['복잡', '갈등', '스트레스', '생각', '화', '다툼', '마찰', '불안', '혼란', '분통'],
                DEPLETED: ['쉼', '휴식', '피곤', '소진', '기운', '번아웃', '무기력', '방전', '지친'],
                CALM: ['고요', '사색', '평온', '차분', '산책', '새벽', '달빛', '밤하늘', '바람'],
                ACTIVE: ['영감', '활력', '열정', '성취', '도전', '텐션', '의욕', '희망', '에너지']
            };
            for (const [catId, words] of Object.entries(keywordMap)) {
                if (words.some(w => textToSearch.includes(w))) {
                    matchedCat = HEALING_MOOD_DATA.find(c => c.id === catId);
                    break;
                }
            }
        }

        // 4. 감정 카테고리에 매칭된 경우 고유 그라데이션 및 악센트 컬러 추출
        if (matchedCat && MOOD_GRADIENT_BASES[matchedCat.id]) {
            const palette = MOOD_GRADIENT_BASES[matchedCat.id].high;
            const gradient = `linear-gradient(135deg, ${palette[0]} 0%, ${palette[1]} 100%)`;
            const baseColor = matchedSit?.themeColor || palette[0];
            return { gradient, color: baseColor, cat: matchedCat, sit: matchedSit };
        }

        // 5. 저장된 THEME_COLOR 가 존재하는 경우
        let rawColor = d.THEME_COLOR;
        if (rawColor && !rawColor.includes('oklch') && (rawColor.startsWith('#') || rawColor.startsWith('rgb'))) {
            return {
                gradient: `linear-gradient(135deg, ${rawColor} 0%, rgba(255, 255, 255, 0.85) 100%)`,
                color: rawColor,
                cat: null,
                sit: null
            };
        }

        // 기본값: 설렘 & 사랑 핑크
        return {
            gradient: 'linear-gradient(135deg, #F8CAD3 0%, #F2B2C0 100%)',
            color: '#F8CAD3',
            cat: HEALING_MOOD_DATA[0],
            sit: null
        };
    }
    window.getDiaryThemeAndGradient = getDiaryThemeAndGradient;

    // 🌿 일기장의 감정 태그 및 테마를 분석하여 전역 팔레트 매핑
    function getDiaryPalette(d) {
        if (!d) return EMOTION_PALETTES.DEFAULT;
        const moodStr = String(d.MOOD || '').trim();

        // 1. 대분류 감정명 직접 매칭 (예: "설렘 & 사랑")
        if (EMOTION_PALETTES[moodStr]) {
            return EMOTION_PALETTES[moodStr];
        }

        // 2. CATS 세부 상황 태그 매칭
        if (typeof CATS !== 'undefined') {
            for (const catItem of CATS) {
                if (catItem.s && catItem.s.some(s => s === moodStr || (moodStr && s.includes(moodStr)) || (moodStr && moodStr.includes(s)))) {
                    if (EMOTION_PALETTES[catItem.n]) return EMOTION_PALETTES[catItem.n];
                }
            }
        }

        // 3. HEALING_MOOD_DATA 세부 상황 및 ID 매칭
        const ID_TO_CAT_NAME = {
            LOVE: '설렘 & 사랑',
            DOWN: '가라앉는 마음 & 이별',
            OVERLOAD: '복잡한 생각 & 갈등',
            DEPLETED: '지친 하루 & 쉼의 필요',
            CALM: '잔잔한 고요 & 사색',
            ACTIVE: '반짝이는 영감 & 활력'
        };
        if (typeof HEALING_MOOD_DATA !== 'undefined') {
            for (const hCat of HEALING_MOOD_DATA) {
                const hasSit = hCat.subSituations && hCat.subSituations.some(s => 
                    s.label === moodStr || 
                    (moodStr && s.label.includes(moodStr)) || 
                    (moodStr && moodStr.includes(s.label))
                );
                if (hasSit || hCat.id === moodStr) {
                    const catName = ID_TO_CAT_NAME[hCat.id];
                    if (catName && EMOTION_PALETTES[catName]) return EMOTION_PALETTES[catName];
                }
            }
        }

        // 4. 영문 ID 매칭
        if (ID_TO_CAT_NAME[moodStr]) {
            return EMOTION_PALETTES[ID_TO_CAT_NAME[moodStr]];
        }

        // 5. 저장된 THEME_COLOR 헥사코드 매칭
        const rawColor = String(d.THEME_COLOR || '').trim().toLowerCase();
        if (rawColor) {
            for (const pal of Object.values(EMOTION_PALETTES)) {
                if (pal.bg && pal.bg.toLowerCase() === rawColor) return pal;
            }
            if (rawColor === '#fcaf7e' || rawColor === '#ffcc80') return EMOTION_PALETTES['지친 하루 & 쉼의 필요'];
            if (rawColor === '#b3fcbb' || rawColor === '#c4f5c9') return EMOTION_PALETTES['잔잔한 고요 & 사색'];
            if (rawColor === '#f2c7c7' || rawColor === '#ffccd5') return EMOTION_PALETTES['설렘 & 사랑'];
            if (rawColor === '#bdddfc' || rawColor === '#c6dcf2') return EMOTION_PALETTES['가라앉는 마음 & 이별'];
            if (rawColor === '#b5c7eb' || rawColor === '#d6c6e1') return EMOTION_PALETTES['복잡한 생각 & 갈등'];
            if (rawColor === '#efd9aa' || rawColor === '#ffe8b3') return EMOTION_PALETTES['반짝이는 영감 & 활력'];
        }

        // 6. 자연어 키워드 매칭
        const textToSearch = `${moodStr} ${d.THEME || ''} ${d.POEM_TEXT || ''}`;
        const keywordMap = {
            '설렘 & 사랑': ['사랑', '설렘', '두근', '연인', '짝사랑', '호감', '고백'],
            '가라앉는 마음 & 이별': ['가라앉', '이별', '우울', '슬픔', '눈물', '외로', '먹먹', '상처', '아픔'],
            '복잡한 생각 & 갈등': ['복잡', '갈등', '스트레스', '화', '다툼', '마찰', '불안', '혼란', '분통', '잡생각', '자존심'],
            '지친 하루 & 쉼의 필요': ['쉼', '휴식', '피곤', '소진', '기운', '번아웃', '무기력', '방전', '지친', '잠수'],
            '잔잔한 고요 & 사색': ['고요', '사색', '평온', '차분', '산책', '새벽', '달빛', '밤하늘', '바람', '거리감'],
            '반짝이는 영감 & 활력': ['영감', '활력', '열정', '성취', '도전', '텐션', '의욕', '희망', '에너지', '목표', '개운']
        };
        for (const [catName, words] of Object.entries(keywordMap)) {
            if (words.some(w => textToSearch.includes(w))) {
                return EMOTION_PALETTES[catName];
            }
        }

        // 7. 직접 지정된 커스텀 컬러인 경우
        if (rawColor && !rawColor.includes('oklch') && (rawColor.startsWith('#') || rawColor.startsWith('rgb'))) {
            return { bg: d.THEME_COLOR, sel: d.THEME_COLOR };
        }

        return EMOTION_PALETTES.DEFAULT;
    }
    window.getDiaryPalette = getDiaryPalette;

    function applyDiaryEmotion(d) {
        const pal = getDiaryPalette(d);
        document.documentElement.style.setProperty('--bg', pal.bg);
        if (pal.sel) {
            document.documentElement.style.setProperty('--sel', pal.sel);
        }
        return pal;
    }
    window.applyDiaryEmotion = applyDiaryEmotion;

    function renderDiaryBook() {
        const diaries = window.cachedDiaries;
        const idx = window.currentDiaryIndex;
        const postsContainer = document.getElementById('posts-container');
        if (!diaries || !diaries[idx]) return;

        const d = diaries[idx];

        // 🌿 일기장에 저장된 감정 태그에 맞춰 배경색(--bg) 및 테마 동적 적용
        const diaryPalette = applyDiaryEmotion(d);

        let weatherEmoji = '☀️';
        const wStr = String(d.WEATHER || '').toLowerCase();
        if (wStr.includes('rain') || wStr.includes('drizzle') || wStr.includes('비')) weatherEmoji = '🌧️';
        else if (wStr.includes('snow') || wStr.includes('눈')) weatherEmoji = '❄️';
        else if (wStr.includes('cloud') || wStr.includes('overcast') || wStr.includes('흐림')) weatherEmoji = '☁️';
        else if (wStr.includes('thunder') || wStr.includes('천둥')) weatherEmoji = '⛈️';

        const dateStr = new Date(d.CREATED_AT).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\.$/, '');
        const isFirst = idx === 0;
        const isLast = idx === diaries.length - 1;
        const currentNum = idx + 1;
        const totalNum = diaries.length;

        const pageLeftNum = String(currentNum * 2 - 1).padStart(2, '0');
        const pageRightNum = String(currentNum * 2).padStart(2, '0');

        postsContainer.innerHTML = `
            <div class="diary-book-wrapper">
                <button class="book-nav prev-btn" ${isFirst ? 'disabled' : ''} onclick="window.flipDiary(-1)">◀</button>
                <div class="book-spread wide-book">
                    <!-- 책 중앙 쉐도우 (접히는 부분) -->
                    <div class="book-crease"></div>
                    
                    <!-- Left Page -->
                    <div class="book-page left-page">
                        <div class="page-header">
                            <span class="page-date">🗓 ${dateStr}</span>
                            <span class="page-badge">${(d.MUSIC_MOOD || 'DREAMY CANVAS').toUpperCase()}</span>
                        </div>
                        
                        <div class="canvas-image-container">
                            <img src="${d.IMAGE_BASE64}" class="canvas-image" />
                            <div class="canvas-overlay"></div>
                            <div class="canvas-text">
                                <p class="canvas-subtitle">SISEON AI DIGITAL CANVAS</p>
                                <h3 class="canvas-title">${d.THEME}</h3>
                                <p class="canvas-desc">마음의 여백을 그리는 신비로운 감성 캔버스</p>
                            </div>
                        </div>
                        
                        <div class="page-footer left-footer">
                            PAGE ${pageLeftNum}
                        </div>
                    </div>

                    <!-- Right Page -->
                    <div class="book-page right-page">
                        <div class="page-header right-header">
                            <div class="mood-weather flex items-center gap-2">
                                <span>${weatherEmoji}</span>
                                <span class="font-medium">${d.WEATHER || '맑음'}</span>
                                <span class="text-stone-300">·</span>
                                <span class="diary-mood-badge px-2.5 py-0.5 rounded-full text-xs font-serif font-medium border border-black/5" style="background-color: ${diaryPalette.bg}; color: #111111;">${d.MOOD || '기록된 감정'}</span>
                            </div>
                            <div class="page-pagination">
                                ${currentNum} / ${totalNum}
                            </div>
                        </div>
                        
                        <div class="poem-container">
                            <div class="poem-quote">“</div>
                            <h3 class="poem-title">${d.THEME}</h3>
                            <p class="poem-content">${d.POEM_TEXT || '기록된 시가 없습니다.'}</p>
                        </div>
                        
                        <div class="page-footer right-footer" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                            <div style="display: flex; gap: 15px; align-items: center;">
                                <button class="start-healing-btn" style="color: #10b981; font-weight: bold; font-size: 12px; cursor: pointer; background: none; border: none; padding: 0; transition: color 0.2s;" onmouseover="this.style.color='#059669'" onmouseout="this.style.color='#10b981'">🌿 힐링 시작</button>
                                <button onclick="window.deleteDiary(${d.ID})" class="delete-btn">🗑 삭제</button>
                                <button onclick="window.shareDiary(${idx})" style="color: #60a5fa; font-weight: bold; font-size: 12px; cursor: pointer; background: none; border: none; padding: 0; transition: color 0.2s;" onmouseover="this.style.color='#3b82f6'" onmouseout="this.style.color='#60a5fa'">🌐 공유</button>
                            </div>
                            <span>PAGE ${pageRightNum}</span>
                        </div>
                    </div>
                </div>
                <button class="book-nav next-btn" ${isLast ? 'disabled' : ''} onclick="window.flipDiary(1)">▶</button>
            </div>
        `;

        // Load music player for this diary entry
        loadDiaryMusicPlayer(d);
    }

    const closePostsBtn = document.getElementById('close-posts-btn');
    if (closePostsBtn) {
        closePostsBtn.onclick = () => {
            window.stopAllAudios();
            const diarySection = document.getElementById('diary-section');
            const mainContent = document.getElementById('main-content');
            
            if (diarySection) diarySection.classList.add('hidden');
            if (mainContent) mainContent.classList.remove('hidden');
            
            const playerContainer = document.getElementById('diary-music-player-container');
            if (playerContainer) {
                playerContainer.innerHTML = ''; // Stop music playback
            }
            
            // 메인 화면으로 복귀 시 현재 메인에서 선택된 감정 배경 복원
            applyEmotionPalette(cat ? cat.n : null);
            if (window.history && window.history.replaceState) {
                window.history.replaceState(null, '', window.location.pathname);
            }
        };
    }

    // URL 파라미터 체크 (?view=diary 또는 ?diary=true 또는 #diary) -> 자동으로 내 일기장 서가 열기
    const checkUrlForDiaryView = () => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('view') === 'diary' || urlParams.get('diary') === 'true' || window.location.hash === '#diary') {
            if (diaryBtn) {
                diaryBtn.click();
            }
        }
    };
    checkUrlForDiaryView();

    window.addEventListener('popstate', () => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('view') === 'diary' || window.location.hash === '#diary') {
            if (diaryBtn) diaryBtn.click();
        } else {
            const closeBtn = document.getElementById('close-posts-btn');
            if (closeBtn) closeBtn.click();
        }
    });
});


// 🌿 힐링 시작 전체화면 (Event Delegation & Global Handlers)
let isHealingModeActive = false;
let hideCursorTimeout = null;
let overlayExitTimeout = null;

window.openHealingFullscreen = async function(btn) {
    if (isHealingModeActive) return;

    // 1. DOM 역추적 및 이미지/시 데이터 추출
    const diaryWrapper = btn ? (btn.closest('.diary-book-wrapper') || btn.closest('.book-wrapper')) : null;
    let imgSrc = '';
    let analysisObj = null;
    let pageEl = diaryWrapper;

    if (diaryWrapper) {
        // 일기장 뷰 모드
        const img = diaryWrapper.querySelector('.canvas-image') || diaryWrapper.querySelector('img.diary-image') || diaryWrapper.querySelector('img');
        if (img) imgSrc = img.src;
        if (window.cachedDiaries && window.currentDiaryIndex !== undefined) {
            analysisObj = window.cachedDiaries[window.currentDiaryIndex];
            if (!imgSrc && analysisObj && analysisObj.IMAGE_BASE64) {
                imgSrc = analysisObj.IMAGE_BASE64;
            }
        }
    } else {
        // 위저드 3단계 모드
        imgSrc = window.generatedImageUrl || '';
        if (!imgSrc) {
            const canvasImg = document.querySelector('#canvas-card-slot img');
            if (canvasImg) imgSrc = canvasImg.src;
        }
        analysisObj = window.currentAnalysis || null;
    }

    // 전역 폴백 탐색
    if (!imgSrc) {
        const fallbackImg = document.querySelector('#canvas-card-slot img') ||
                              document.querySelector('.canvas-image') ||
                              document.querySelector('img[src*="/uploads/"]') ||
                              document.querySelector('img[src^="data:image"]');
        if (fallbackImg) imgSrc = fallbackImg.src;
    }

    if (!imgSrc) {
        if (typeof showToast === 'function') {
            showToast('힐링 캔버스 이미지를 찾을 수 없습니다.');
        } else {
            alert('힐링 캔버스 이미지를 찾을 수 없습니다.');
        }
        return;
    }

    // 2. 오버레이 자동 생성 방어 (DOM에 없으면 주입)
    let overlay = document.getElementById('healing-fullscreen-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'healing-fullscreen-overlay';
        overlay.className = 'hidden fixed inset-0 z-[9999] bg-black transition-opacity duration-1000 opacity-0 cursor-default flex items-center justify-center overflow-hidden select-none';
        overlay.innerHTML = `
            <!-- 1. 메인 힐링 이미지 (16:9 와이드) -->
            <img id="healing-fullscreen-bg" class="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 transition-opacity duration-[2000ms]" src="" alt="">
            <img id="healing-fullscreen-image" class="relative z-10 object-cover w-full h-full opacity-0 transition-opacity duration-[2000ms]" src="" alt="Healing Artwork">

            <!-- 2. 은은한 비네팅 그라데이션 (자막 가독성 확보) -->
            <div class="absolute inset-0 z-20 pointer-events-none bg-gradient-to-t from-black/70 via-transparent to-black/30"></div>

            <!-- 3. 초경량 앰비언트 파티클 캔버스 -->
            <canvas id="healing-particle-canvas" class="absolute inset-0 z-30 pointer-events-none w-full h-full"></canvas>

            <!-- 4. 시(Poem) 자막 오버레이 -->
            <div id="healing-subtitle-container" class="absolute bottom-16 inset-x-0 z-40 flex flex-col items-center justify-center px-6 text-center pointer-events-none">
                <p id="healing-subtitle-text" class="text-white/95 text-xl md:text-2xl font-normal drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] opacity-0 transition-opacity duration-1000 font-leeseoyun break-keep max-w-2xl">
                </p>
            </div>

            <!-- 5. 닫기 버튼 -->
            <div id="healing-fullscreen-controls" class="absolute top-6 right-6 z-50 transition-opacity duration-500">
                <button id="close-healing-btn" class="px-4 py-2 bg-black/50 hover:bg-black/80 text-white/90 text-sm rounded-full backdrop-blur-md border border-white/20 transition-all duration-500">
                    ✕ 힐링 종료 (ESC)
                </button>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    const image = document.getElementById('healing-fullscreen-image');
    const bgImage = document.getElementById('healing-fullscreen-bg');
    if (image) image.src = imgSrc;
    if (bgImage) bgImage.src = imgSrc;

    if (overlayExitTimeout) {
        clearTimeout(overlayExitTimeout);
        overlayExitTimeout = null;
    }

    isHealingModeActive = true;

    // 3. 🎵 싱글톤 오디오 상태 관리 및 전체화면 연동 (Seamless Continuity & Zero Overlap)
    const audio = getActiveAudioInstance();
    if (audio) {
        // 백그라운드 BGM(자연의 소리)은 정지하여 힐링 트랙에 집중
        if (typeof pauseBGM === 'function') {
            pauseBGM();
        }

        if (audio.paused) {
            // 멈춰있는 상태였다면 현재 위치에서 자연스럽게 재생 시작 (중복 Audio 생성 없음)
            try {
                await audio.play();
                if (typeof isPlayingMusic !== 'undefined') isPlayingMusic = true;
                if (typeof updateWizardView === 'function') updateWizardView();
            } catch (err) {
                console.warn('Audio autoplay blocked, requires user interaction:', err);
            }
        } else {
            // 이미 재생 중이라면 상태와 currentTime을 그대로 유지 (끊김 및 재시작 방지)
            console.log('Audio is already playing seamlessly at:', audio.currentTime);
            if (typeof isPlayingMusic !== 'undefined') isPlayingMusic = true;
        }
    }

    // 4. 전체화면 전환 및 애니메이션 시작
    overlay.classList.remove('hidden');
    requestAnimationFrame(() => {
        overlay.classList.remove('opacity-0');
        if (image) image.classList.remove('opacity-0');
        if (bgImage) bgImage.classList.remove('opacity-0');
    });

    startHealingAnimations(pageEl, analysisObj);

    // 전체화면 API 호출
    const docEl = document.documentElement;
    try {
        if (docEl.requestFullscreen) {
            await docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
            await docEl.webkitRequestFullscreen();
        }
    } catch(err) {
        console.log('Fullscreen failed or denied:', err);
    }

    // 진입 직후 캔버스 해상도 재동기화
    setTimeout(() => {
        const canvas = document.getElementById('healing-particle-canvas');
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    }, 200);

    resetHealingCursorTimer();
};

// 전체화면 함수 별칭 매핑 (호환성 보장)
window.startFullscreenHealing = function(btn) { return window.openHealingFullscreen(btn); };
window.openFullscreenHealing = function(btn) { return window.openHealingFullscreen(btn); };
window.closeFullscreenHealing = function() { return window.exitHealingFullscreen(); };
window.exitFullscreenHealing = function() { return window.exitHealingFullscreen(); };

window.exitHealingFullscreen = function() {
    if (!isHealingModeActive) return;
    isHealingModeActive = false;

    const overlay = document.getElementById('healing-fullscreen-overlay');
    const image = document.getElementById('healing-fullscreen-image');
    const bgImage = document.getElementById('healing-fullscreen-bg');

    if (overlay) overlay.classList.add('opacity-0');
    if (image) image.classList.add('opacity-0');
    if (bgImage) bgImage.classList.add('opacity-0');

    if (hideCursorTimeout) {
        clearTimeout(hideCursorTimeout);
        hideCursorTimeout = null;
    }

    overlayExitTimeout = setTimeout(() => {
        if (overlay) overlay.classList.add('hidden');
        if (image) image.src = '';
        if (bgImage) bgImage.src = '';
        stopHealingAnimations();
    }, 800);

    if (document.fullscreenElement || document.webkitFullscreenElement) {
        try {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen().catch(() => {});
            }
        } catch (e) {}
    }
};

function hideHealingControls() {
    const overlay = document.getElementById('healing-fullscreen-overlay');
    if (overlay && isHealingModeActive) {
        overlay.classList.add('cursor-none');
        document.getElementById('healing-fullscreen-controls')?.classList.add('opacity-0');
    }
}

function resetHealingCursorTimer() {
    const overlay = document.getElementById('healing-fullscreen-overlay');
    if (overlay) {
        overlay.classList.remove('cursor-none');
        document.getElementById('healing-fullscreen-controls')?.classList.remove('opacity-0');
    }
    if (hideCursorTimeout) clearTimeout(hideCursorTimeout);
    if (isHealingModeActive) {
        hideCursorTimeout = setTimeout(hideHealingControls, 2500);
    }
}

// 이벤트 리스너 등록 (중복 없이 1회만 등록)
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.start-healing-btn');
    if (btn) {
        window.openHealingFullscreen(btn);
        return;
    }
    const closeBtn = e.target.closest('#close-healing-btn');
    if (closeBtn) {
        window.exitHealingFullscreen();
        return;
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isHealingModeActive) {
        window.exitHealingFullscreen();
    }
});

const onHealingFullscreenChange = () => {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (isHealingModeActive) {
            window.exitHealingFullscreen();
        }
    } else {
        const canvas = document.getElementById('healing-particle-canvas');
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    }
};

document.addEventListener('fullscreenchange', onHealingFullscreenChange);
document.addEventListener('webkitfullscreenchange', onHealingFullscreenChange);

document.addEventListener('mousemove', () => {
    if (isHealingModeActive) {
        resetHealingCursorTimer();
    }
});
