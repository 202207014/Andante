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
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Theme & Environment Setup
    const currentHour = new Date().getHours();
    const initialTheme = typeof resolveThemeByEnv === 'function' ? resolveThemeByEnv(currentHour, 'Sunny') : { background: 'linear-gradient(135deg, #F4F8F4 0%, #E8F2E8 50%, #DEF0DF 100%)', concept: '느리게 흐르는 민트빛 안단테' };
    
    document.body.classList.remove('bg-[#FAF8F5]');
    document.body.style.background = initialTheme.background;
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
        
        if (theme) {
            document.body.className = document.body.className.replace(/\bbg-\w+\b/g, '').replace('bg-[#FAF8F5]', '');
            document.body.style.background = theme.background;
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
        if (!rawString) return 'relax';
        const lower = rawString.toLowerCase();
        
        // 새로 적용된 프롬프트에 의해 정확한 태그가 들어온 경우
        for (const tag of VALID_JAMENDO_TAGS) {
            if (lower === tag || lower.includes(tag)) return tag;
        }
        
        if (lower.includes('lofi') || lower.includes('lo-fi')) return 'chill';
        
        // 매핑 실패 시 기본값
        return 'relax';
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

    async function loadJamendoTrack(tags, bpm) {

        // [Crucial Fix] Ignore AI's generated tag which often mismatches the context (e.g., suggesting 'chillout' for a lover's argument).
        // Strictly use the curated selectedSafeTag which is perfectly mapped to the user's chosen situation.
        let tagQuery = selectedSafeTag;
        let bpmQuery = '';
        if (bpm) {
            const bpmNum = parseInt(bpm.replace(/\D/g, ''));
            if (!isNaN(bpmNum)) {
                bpmQuery = `&bpm=${bpmNum}`;
            }
        }
        try {
            // [Phase 3] 클라이언트에서 직접 외부 도메인(api.jamendo.com)을 호출하지 않고, 내부 프록시(BFF) 라우트를 호출하여 애드블록 및 혼합 콘텐츠 에러 원천 차단
            const res = await fetch(`/api/music?tag=${encodeURIComponent(tagQuery)}${bpmQuery}`);
            
            if (!res.ok) {
                throw new Error(`BFF Request Failed: ${res.status}`);
            }
            
            const data = await res.json();
            if (data.success && data.track) {
                jamendoTrackInfo = data.track;
                window.jamendoAudio = window.GlobalAudio.create(jamendoTrackInfo.audio);
                window.jamendoAudio.volume = 0.8;
                attachAudioProgressSync(window.jamendoAudio);
                window.jamendoAudio.onended = () => { isPlayingMusic = false; renderResults(); };
            } else {
                throw new Error("Invalid response format from BFF");
            }
        } catch(e) {
            console.error("Jamendo Load Error:", e);
            // 1:1 Fallback Tracks Mapping for 18 Emotions
            const FALLBACK_TRACKS = {
                // LOVE
                '답장 기다리며 애가 탐': { name: "애타는 기다림 (Anxious Waiting)", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
                '좋아하는 사람 생각에 밤잠 설침': { name: "잠 못 이루는 새벽 (Sleepless Dawn)", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
                '마주친 순간 멍해짐': { name: "시간이 멈춘 순간 (Time Stood Still)", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
                '오래된 연인과의 편안한 데이트': { name: "익숙한 온기 (Familiar Warmth)", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
                
                // DOWN
                '이별 후 먹먹함': { name: "텅 빈 방안 (Empty Room)", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
                '이유 없이 마음이 텅 빔': { name: "공허한 울림 (Hollow Echo)", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
                '사소한 말에 깊게 베임': { name: "상처받은 영혼 (Fragile Soul)", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3" },
                '세상에 혼자 남겨진 기분': { name: "외딴섬의 등대 (Lonely Lighthouse)", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
                
                // OVERLOAD
                '연인과 사소한 일로 다툼': { name: "어긋난 주파수 (Mismatched Frequency)", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3" },
                '인간관계 마찰로 부글거림': { name: "가라앉는 불꽃 (Fading Flame)", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3" },
                '잡생각이 꼬리를 물고 안 멈춤': { name: "복잡한 회로 (Tangled Wires)", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3" },
                '실수 수습하느라 멘탈 흔들림': { name: "흔들리는 나침반 (Shaky Compass)", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3" },
                
                // DEPLETED
                '끝없는 과제/업무에 치임': { name: "과제를 넘기는 한숨 (Heavy Sigh)", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3" },
                '잠 부족으로 멍함': { name: "새벽녘 몽환의 숲 (Dreamy Dawn)", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3" },
                '사람 만나는 게 기 빨림': { name: "혼자만의 방 (Room of Own)", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3" },
                '손가락 하나 까딱할 힘 없음': { name: "녹아내리는 멘탈 (Melting Point)", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3" },
                
                // CALM
                '누구의 방해도 받기 싫음': { name: "침묵의 온기 (Warm Silence)", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
                '조용히 나를 돌아보는 중': { name: "내면의 거울 (Inner Mirror)", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
                '적당한 거리감이 편안함': { name: "평행선의 미학 (Parallel Lines)", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
                '혼자만의 새벽 공기': { name: "차분한 새벽별 (Calm Morning Star)", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
                
                // ACTIVE
                '원하던 목표를 달성함': { name: "작은 성취의 기쁨 (Joy of Achievement)", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
                '영감과 의욕이 넘쳐남': { name: "번뜩이는 스파크 (Brilliant Spark)", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
                '잡념 없이 깊게 빠져드는 중': { name: "무아지경의 흐름 (State of Flow)", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3" },
                '텐션 올리고 싶은 기분': { name: "끓어오르는 에너지 (Boiling Energy)", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" }
            };

            const fallback = FALLBACK_TRACKS[selectedMood] || { name: "마음을 다독이는 피아노 (Healing Piano)", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" };

            jamendoTrackInfo = {
                name: fallback.name,
                artist_name: "Andante AI",
                audio: fallback.audio,
                image: ""
            };
            window.jamendoAudio = window.GlobalAudio.create(jamendoTrackInfo.audio);
            window.jamendoAudio.volume = 0.5;
        }
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                try {
                    const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
                    const data = await res.json();
                    if (data.weather && data.weather.length > 0) {
                        updateThemeByTimeAndWeather(data.weather[0].main, Math.round(data.main.temp), data.name || '현위치');
                    }
                } catch (err) {}
            },
            () => {
                fetch(`/api/weather?q=Seoul`).then(res => res.json()).then(data => {
                    if(data.weather) updateThemeByTimeAndWeather(data.weather[0].main, Math.round(data.main.temp), data.name || 'Seoul');
                }).catch(()=>{});
            }
        );
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
        if (userInfoEl) userInfoEl.textContent = `👋 ${authName}님`;
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

    let energyLevel = 100;
    let expandedCategory = 'LOVE';

    function renderAccordion() {
        const energySlider = document.getElementById('energy-slider');
        const energyFill = document.getElementById('energy-fill');
        const energyText = document.getElementById('energy-percentage-text');
        const accordionContainer = document.getElementById('mood-accordion-container');
        
        if (!energySlider || !accordionContainer) return;

        energySlider.value = energyLevel;
        if(energyFill) {
            energyFill.style.width = `${energyLevel}%`;
        }
        if(energyText) {
            energyText.textContent = `${energyLevel}%`;
        }

        // Energy listener
        energySlider.oninput = (e) => {
            energyLevel = Number(e.target.value);
            if(energyFill) {
                energyFill.style.width = `${energyLevel}%`;
            }
            if(energyText) {
                energyText.textContent = `${energyLevel}%`;
            }
            
            // Auto routing
            if (energyLevel <= 30) {
                if (expandedCategory !== 'DEPLETED' && expandedCategory !== 'DOWN') {
                    expandedCategory = 'DEPLETED';
                }
            } else if (energyLevel >= 80) {
                if (expandedCategory !== 'ACTIVE' && expandedCategory !== 'PROUD') {
                    expandedCategory = 'ACTIVE';
                }
            }
            renderAccordionHTML(accordionContainer);
        };

        renderAccordionHTML(accordionContainer);
    }

    let selectedSafeTag = 'indie';
    let selectedThemeColor = '#FAF2F2';

    function renderAccordionHTML(container) {
        container.innerHTML = '';
        HEALING_MOOD_DATA.forEach(category => {
            const isExpanded = expandedCategory === category.id;
            
            const wrapper = document.createElement('div');
            wrapper.className = "flex flex-col mb-2.5";

            const card = document.createElement('div');
            card.className = "relative rounded-3xl overflow-hidden flex flex-col transition-all duration-300";
            card.style.backgroundColor = category.headerColor || '#FFFFFF';
            card.style.border = isExpanded ? `1.5px solid ${category.borderColor || '#78716c'}` : `1px solid ${category.borderColor || '#E2DED9'}`;
            card.style.boxShadow = isExpanded ? "0 12px 30px -8px rgba(28, 25, 23, 0.08)" : "0 2px 6px rgba(28, 25, 23, 0.02)";

            const btn = document.createElement('button');
            btn.className = "w-full py-4 px-6 flex justify-between items-center bg-transparent outline-none cursor-pointer";
            
            const textWrap = document.createElement('div');
            textWrap.className = "flex flex-col items-start text-left";
            textWrap.innerHTML = `<span class="font-medium text-base text-stone-900 font-editorial-serif tracking-tight">${category.title}</span>`;
            
            if (isExpanded) {
                const subEl = document.createElement('span');
                subEl.className = "text-xs font-normal text-stone-600 mt-1 break-keep font-editorial-serif";
                subEl.textContent = category.subtitle;
                textWrap.appendChild(subEl);
            }
            
            btn.appendChild(textWrap);
            
            const iconWrap = document.createElement('div');
            iconWrap.className = "flex items-center justify-center rounded-full flex-shrink-0 transition-colors";
            iconWrap.style.width = '28px';
            iconWrap.style.height = '28px';
            iconWrap.style.backgroundColor = isExpanded ? '#292524' : 'rgba(255,255,255,0.85)';
            iconWrap.style.color = isExpanded ? '#ffffff' : '#44403c';
            iconWrap.style.border = isExpanded ? '1px solid #292524' : `1px solid ${category.borderColor || '#E2DED9'}`;
            iconWrap.innerHTML = `<span class="text-sm font-light leading-none">${isExpanded ? '−' : '+'}</span>`;
            btn.appendChild(iconWrap);

            btn.onclick = (e) => {
                e.preventDefault();
                expandedCategory = isExpanded ? null : category.id;
                renderAccordionHTML(container);
            };
            card.appendChild(btn);

            if (isExpanded) {
                const chipArea = document.createElement('div');
                chipArea.className = "flex items-stretch gap-2 px-6 pb-6 pt-3 w-full border-t border-black/5 bg-white/40";
                
                // Flex Wrap Grid (Soft Pebble Chips)
                const chipScroll = document.createElement('div');
                chipScroll.className = "flex flex-wrap gap-2.5 flex-1 min-w-0";

                category.subSituations.forEach(sit => {
                    const tagBtn = document.createElement('button');
                    const isSelected = selectedMood === sit.label;
                    tagBtn.className = `px-4 py-2 rounded-full text-sm font-editorial-serif transition-all whitespace-normal text-left leading-relaxed cursor-pointer ${
                        isSelected 
                            ? 'bg-[#292524] text-white border border-[#292524] shadow-md scale-[1.02] font-medium' 
                            : 'bg-white border border-stone-300 text-stone-800 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:border-stone-500 hover:bg-stone-50'
                    }`;
                    tagBtn.textContent = sit.label;
                    
                    tagBtn.onclick = (e) => {
                        e.preventDefault();
                        selectedMood = sit.label;
                        selectedSafeTag = sit.jamendoSafeTag;
                        selectedThemeColor = sit.themeColor;
                        renderAccordionHTML(container);
                    };
                    chipScroll.appendChild(tagBtn);
                });
                chipArea.appendChild(chipScroll);
                card.appendChild(chipArea);
            }
            wrapper.appendChild(card);
            container.appendChild(wrapper);
        });
    }

    renderAccordion();

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

        if (currentWizardStep === 1 && s1) s1.classList.remove('hidden');
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
            const musicSlot = document.getElementById('music-sticker-slot');
            if (musicSlot) {
                const rawTempo = musicData.tempoBpm || '70';
                const formattedTempo = rawTempo.includes('BPM') ? rawTempo : `${rawTempo} BPM`;

                musicSlot.innerHTML = window.AndanteComponents.renderMusicSticker({
                    title: jamendoTrackInfo ? jamendoTrackInfo.name : (musicData.musicGenre || 'Lo-Fi Acoustic'),
                    artist: jamendoTrackInfo ? jamendoTrackInfo.artist_name : "Andante AI",
                    image: jamendoTrackInfo ? jamendoTrackInfo.image : "",
                    tags: [
                        selectedMood,
                        musicData.primaryEmotion || '평온함',
                        formattedTempo
                    ],
                    isPlaying: isPlayingMusic
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
            }

            const canvasSlot = document.getElementById('canvas-card-slot');
            if (canvasSlot) {
                if (generatedImageUrl) {
                    canvasSlot.innerHTML = window.AndanteComponents.renderAICanvasCard({
                        imageUrl: generatedImageUrl,
                        isLoading: false
                    });
                } else {
                    canvasSlot.innerHTML = `
                    <div class="editorial-card text-center py-14 px-8 flex flex-col items-center gap-6" style="margin: 0 auto; max-width: 640px;">
                        <div style="width: 52px; height: 52px; border-radius: 50%; background: #f5f5f4; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #78716c;">
                            🎨
                        </div>
                        <div>
                            <h3 class="font-normal font-editorial-serif text-stone-800 text-xl mb-2">나만의 힐링 감성 캔버스 그리기</h3>
                            <p class="text-xs text-stone-500 font-light max-w-sm mx-auto leading-relaxed">
                                AI가 분석된 기분과 시적 어조를 바탕으로 16:9 와이드 명화 화폭을 제작합니다.
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

            const finalSlot = document.getElementById('final-actions-slot');
            if (finalSlot && generatedImageUrl) {
                finalSlot.innerHTML = `
                    <div style="display: flex; gap: 1rem; margin-top: 2rem; flex-wrap: wrap; justify-content: center; max-width: 640px; margin-left: auto; margin-right: auto;">
                        <button id="start-healing-btn" class="active-press hover-lift start-healing-btn" style="flex: 1; min-width: 180px; padding: 14px 28px; border-radius: 9999px; border: none; background: #065f46; color: white; font-weight: 500; font-size: 0.85rem; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; box-shadow: 0 10px 25px -4px rgba(6,95,70,0.4);">
                            🌿 힐링 시작 (전체화면)
                        </button>
                        <button id="final-save-btn" class="active-press hover-lift" style="flex: 1; min-width: 150px; padding: 14px 28px; border-radius: 9999px; border: 1px solid #e7e5e4; background: #ffffff; color: #292524; font-weight: 500; font-size: 0.85rem; letter-spacing: 0.1em; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                            💾 일기장 저장
                        </button>
                        <button id="final-share-btn" class="active-press hover-lift" style="flex: 1; min-width: 150px; padding: 14px 28px; border-radius: 9999px; border: 1px solid #e7e5e4; background: #ffffff; color: #292524; font-weight: 500; font-size: 0.85rem; letter-spacing: 0.1em; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                            🌐 갤러리 공유
                        </button>
                    </div>
                `;
                finalSlot.querySelector('#final-save-btn').onclick = saveToDiary;
                finalSlot.querySelector('#final-share-btn').onclick = shareToBoard;
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

    bindBtn('btn-back-to-1', () => { currentWizardStep = 1; updateWizardView(); });
    bindBtn('btn-back-to-2', () => { currentWizardStep = 2; updateWizardView(); });
    bindBtn('btn-next-to-3', () => { currentWizardStep = 3; updateWizardView(); });
    bindBtn('btn-restart', () => {
        currentWizardStep = 1;
        currentAnalysis = null;
        window.currentAnalysis = null;
        generatedImageUrl = null;
        window.generatedImageUrl = null;
        const moodInput = document.getElementById('mood-input');
        if (moodInput) moodInput.value = '';
        if (window.jamendoAudio) {
            window.jamendoAudio.pause();
        }
        isPlayingMusic = false;
        
        const currentHour = new Date().getHours();
        if (typeof resolveThemeByEnv === 'function') {
            const initialTheme = resolveThemeByEnv(currentHour, currentWeatherVal || 'Sunny');
            document.body.style.backgroundColor = initialTheme.background;
            const conceptEl = document.getElementById('theme-concept-text');
            if (conceptEl) conceptEl.textContent = initialTheme.concept;
        }

        updateWizardView();
    });

    // AI Analysis Execution (/api/ai/analyze)
    const analyzeBtn = document.getElementById('analyze-btn');
    const loader = document.getElementById('loader');

    if (analyzeBtn) {
        analyzeBtn.onclick = async () => {
            if (!token) {
                showToast('로그인이 필요한 서비스입니다. 로그인 화면으로 이동합니다.');
                setTimeout(() => { location.href = '/login.html'; }, 1200);
                return;
            }

            const moodPrompt = document.getElementById('mood-input') ? document.getElementById('mood-input').value.trim() : '';

            if (!moodPrompt && document.getElementById('mood-input')) {
                return showToast('오늘의 솔직한 기분을 입력해주세요.');
            }

            if (loader) {
                loader.classList.remove('hidden');
                // Allow a reflow before changing opacity
                requestAnimationFrame(() => {
                    loader.classList.remove('opacity-0', 'pointer-events-none');
                    loader.classList.add('opacity-100', 'pointer-events-auto');
                });
            }
            document.getElementById('step-1-input').classList.add('hidden'); // hide input during load
            analyzeBtn.disabled = true;

            const loaderPercentage = document.getElementById('loader-percentage');
            const loaderBar = document.getElementById('loader-bar');
            const loaderText = document.getElementById('loader-text');
            
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
                const res = await fetch('/api/ai/analyze', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        story: moodPrompt,
                        situationTag: selectedMood,
                        primaryCategory: HEALING_MOOD_DATA.find(c => c.id === expandedCategory)?.title || '미지정',
                        batteryLevel: energyLevel,
                        weather: currentWeatherVal,
                        location: currentLocationVal,
                        userProfile: {
                            gender: sessionStorage.getItem('authGender') || '남성',
                            age: sessionStorage.getItem('authAge') || 24
                        }
                    })
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || '분석 실패');

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
                const tags = data.structuredData?.aiMusicTags || [];
                const bpm = data.structuredData?.tempoBpm || '';
                await loadJamendoTrack(tags, bpm);

                // Dynamic Background Color Transition using selectedThemeColor
                if (selectedThemeColor) {
                    data.themeColor = selectedThemeColor;
                    document.body.style.backgroundColor = selectedThemeColor;
                    document.body.style.transition = "background-color 2s ease";
                }

                clearInterval(progressInterval);
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
                clearInterval(progressInterval);
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

        // Show Loading inside Canvas Slot
        const canvasSlot = document.getElementById('canvas-card-slot');
        if (canvasSlot) {
            canvasSlot.innerHTML = window.AndanteComponents.renderAICanvasCard({
                imageUrl: null,
                isLoading: true
            });
        }

        try {
            const res = await fetch('/api/ai/image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ prompt: promptStr, userGender: currentAnalysis.userGender || sessionStorage.getItem('authGender') || '남성',
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

    // Save to Diary (/api/diaries)
    async function saveToDiary() {
    window.stopAllAudios();
        if (!currentAnalysis || !generatedImageUrl) return;
        if (!token) return location.href = '/login.html';
        if (isSubmitting) return;

        isSubmitting = true;
        const btn = document.getElementById('final-save-btn');
        const oldText = btn ? btn.innerHTML : '';
        if (btn) btn.innerHTML = '저장 중...';

        try {
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
                    music_mood: jamendoTrackInfo ? 'ID:' + jamendoTrackInfo.id : (currentAnalysis.structuredData?.musicGenre || currentAnalysis.music_mood),
                    image_base64: generatedImageUrl,
                    poem_text: (currentAnalysis.poem?.stanza1 || '') + '\n\n' + (currentAnalysis.poem?.stanza2 || ''),
                    theme_color: currentAnalysis.themeColor || ''
                })
            });
            if (res.ok) {
                showToast('💾 내 일기장에 저장되었습니다!');
                if (btn) btn.innerHTML = '저장 완료!';
            } else {
                showToast('저장 실패');
                if (btn) btn.innerHTML = oldText;
            }
        } catch (e) {
            showToast('오류 발생');
            if (btn) btn.innerHTML = oldText;
        } finally {
            isSubmitting = false;
        }
    }

    // Share to Board (/api/boards)
    async function shareToBoard() {
        if (!currentAnalysis || !generatedImageUrl) return;
        if (!token) return location.href = '/login.html';
        if (isSubmitting) return;

        const title = await NeoModal.prompt('공유할 제목을 입력하세요:', currentAnalysis.poem?.title || currentAnalysis.theme);
        if (!title) return;

        isSubmitting = true;
        const btn = document.getElementById('final-share-btn');
        const oldText = btn ? btn.innerHTML : '';
        if (btn) btn.innerHTML = '공유 중...';

        const moodPrompt = document.getElementById('mood-input').value.trim();

        try {
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
                    music_mood: jamendoTrackInfo ? 'ID:' + jamendoTrackInfo.id : (currentAnalysis.structuredData?.musicGenre || currentAnalysis.music_mood),
                    image_base64: generatedImageUrl,
                    poem_text: (currentAnalysis.poem?.stanza1 || '') + '\n\n' + (currentAnalysis.poem?.stanza2 || '')
                })
            });
            if (res.ok) {
                showToast('🌐 공유 갤러리에 등록되었습니다!');
                if (btn) btn.innerHTML = '공유 완료!';
            } else {
                showToast('공유 실패');
                if (btn) btn.innerHTML = oldText;
            }
        } catch (e) {
            showToast('오류 발생');
            if (btn) btn.innerHTML = oldText;
        } finally {
            isSubmitting = false;
        }
    }

    // Modal Events (Diary Modal)
    if (diaryBtn) {
        diaryBtn.onclick = async () => {
            if (!token) return showToast('로그인이 필요합니다.');
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

    async function loadDiaryMusicPlayer(musicMood) {
        const playerContainer = document.getElementById('diary-music-player-container');
        if (!playerContainer) return;
        
        playerContainer.style.opacity = '0';
        playerContainer.innerHTML = '';

        try {
            let track = null;
            let displayTag = musicMood;

            if (musicMood && musicMood.startsWith('ID:')) {
                const trackId = musicMood.split(':')[1];
                const jamendoRes = await fetch(`/api/music?id=${trackId}`);
                const jamendoData = await jamendoRes.json();
                if (jamendoData.success && jamendoData.track) {
                    track = jamendoData.track;
                    displayTag = '저장된 추천 곡';
                }
            }
            
            if (!track) {
                const safeTag = mapToValidJamendoTag(musicMood);
                displayTag = safeTag;
                const jamendoRes = await fetch(`/api/music?tag=${safeTag}&seed=${d.ID}`);
                const jamendoData = await jamendoRes.json();
                if (jamendoData.success && jamendoData.track) {
                    track = jamendoData.track;
                }
            }

            if (!track) {
                console.warn('Jamendo API returned 0 results or failed. Using fallback track.');
                track = {
                    name: "마음을 다독이는 피아노 (Healing Piano)",
                    artist_name: "Andante AI",
                    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                    image: ""
                };
                displayTag = '기본 힐링 곡';
            }

            playerContainer.innerHTML = `
                <div class="glass-panel p-4 flex items-center justify-between rounded-2xl mx-auto border border-stone-200/80 bg-white/85 backdrop-blur-md shadow-sm" style="width: 100%; box-sizing: border-box;">
                    <div class="flex items-center gap-4">
                        <div style="width: 50px; height: 50px; border-radius: 12px; overflow: hidden; border: 1px solid rgba(0,0,0,0.06); flex-shrink: 0; background-color: #f5f5f4; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.04);">
                            ${track.image ? `<img src="${track.image}" style="width: 100%; height: 100%; object-fit: cover;">` : `<span class="text-xl">🎵</span>`}
                        </div>
                        <div>
                            <p class="text-[11px] font-medium text-stone-500 mb-0.5 tracking-wider font-editorial-sub">🎧 힐링 트랙 · ${displayTag.replace('ID:','')}</p>
                            <h4 class="text-sm font-medium text-stone-800 break-all line-clamp-1 font-editorial-serif" style="margin: 0;">${track.name}</h4>
                        </div>
                    </div>
                    <audio controls src="${track.audio}" style="height: 36px; max-width: 280px;"></audio>
                </div>
            `;
            const audioEl = playerContainer.querySelector('audio');
            if (audioEl) {
                audioEl.addEventListener('play', pauseBGM);
            }
            setTimeout(() => { playerContainer.style.opacity = '1'; }, 100);
        } catch (err) {
            console.error('Failed to load diary music', err);
        }
    }

    function renderDiaryBook() {
        const diaries = window.cachedDiaries;
        const idx = window.currentDiaryIndex;
        const postsContainer = document.getElementById('posts-container');
        if (!diaries || !diaries[idx]) return;

        const d = diaries[idx];
        let themeColor = d.THEME_COLOR;
        
        // Fix for old faulty AI generation
        if (themeColor && themeColor.includes('oklch') && !/\d/.test(themeColor)) {
            themeColor = null; 
        }
        if (themeColor) {
            const lowerColor = themeColor.toLowerCase();
            if (lowerColor === 'blue' || lowerColor === '#0000ff' || lowerColor === '푸른빛') themeColor = '#ccf2ff';
            if (lowerColor === 'red' || lowerColor === '#ff0000' || lowerColor === '붉은빛') themeColor = '#ffcccc';
            if (lowerColor === 'yellow' || lowerColor === '#ffff00' || lowerColor === '노란빛') themeColor = '#fff5cc';
            if (lowerColor === 'green' || lowerColor === '#00ff00' || lowerColor === '초록빛') themeColor = '#ccffcc';
        }

        // 동적 배경색 적용 (기본값 설정 후 유효한 색상으로 덮어씌움)
        document.body.style.transition = 'background-color 1s ease';
        document.body.style.backgroundColor = 'var(--background)'; // Default reset
        
        if (themeColor) {
            // setTimeout ensures the browser processes the default reset first, 
            // then transitions smoothly to the new theme color if valid.
            setTimeout(() => {
                document.body.style.backgroundColor = themeColor;
            }, 50);
        }

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
                            <div class="mood-weather">
                                <span>🔆</span>
                                <span>${d.WEATHER} · ${d.MOOD}</span>
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
        loadDiaryMusicPlayer(d.MUSIC_MOOD);
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
            
            // Restore original background if themeColor exists, else default
            if (currentAnalysis && currentAnalysis.themeColor) {
                document.body.style.backgroundColor = currentAnalysis.themeColor;
            } else {
                document.body.style.backgroundColor = 'var(--background)';
            }
        };
    }
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

    // 3. 오디오 재생 제어
    window.stopAllAudios();
    const audioPlayer = document.querySelector('#diary-music-player-container audio') || document.querySelector('audio');
    if (audioPlayer && audioPlayer.src) {
        audioPlayer.currentTime = 0;
        try {
            await audioPlayer.play();
        } catch (err) {
            console.log('Audio autoplay prevented by browser', err);
        }
    } else if (window.jamendoAudio) {
        window.jamendoAudio.currentTime = 0;
        try {
            await window.jamendoAudio.play();
            if (typeof isPlayingMusic !== 'undefined') isPlayingMusic = true;
            if (typeof updateWizardView === 'function') updateWizardView();
        } catch (err) {
            console.log('Audio autoplay prevented by browser', err);
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
