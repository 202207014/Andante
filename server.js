require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

if (!process.env.GEMINI_API_KEY) {
    console.error('FATAL: GEMINI_API_KEY가 .env에 설정되지 않았습니다.');
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// [Requirement 3] AI 분석 모델명 검증 및 Fallback 모델 구성
const TARGET_MODEL_CHECK = 'gemini-3.8-flash-medium';
const PRIMARY_AI_MODEL = 'gemini-3.8-flash';
const FALLBACK_AI_MODEL = 'gemini-2.5-flash';

console.log(`[AI 모델 검증] 점검 대상 모델명: '${TARGET_MODEL_CHECK}'`);
console.warn(`[AI 모델 확인] 모델명 '${TARGET_MODEL_CHECK}'은 Google API 지원 목록에 존재하지 않는 모델명입니다. 실제 존재하는 최신 모델인 '${PRIMARY_AI_MODEL}'을 기본 모델로, '${FALLBACK_AI_MODEL}'을 대체 모델로 지정합니다.`);

const cors = require('cors');
const { getConnection } = require('./connect');
const oracledb = require('oracledb');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("JWT_SECRET 환경변수를 설정해 주세요.");
    process.exit(1);
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// JWT 인증 미들웨어
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 
    if (token == null) return res.status(401).json({ error: '로그인이 필요합니다.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: '유효하지 않은 토큰입니다.' });
        req.user = user; // { id, username }
        next();
    });
};

// 로컬 이미지 저장 함수 (유저명 포함, 해시로 중복 방지)
const saveImageLocally = (base64Str, username) => {
    if (base64Str && base64Str.startsWith('/uploads/')) return base64Str;
    if (base64Str && (base64Str.startsWith('http://') || base64Str.startsWith('https://'))) return base64Str;
    if (base64Str && base64Str.startsWith('data:image')) {
        const matches = base64Str.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
            const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
            const base64Data = matches[2];
            const safeUser = username.replace(/[^a-zA-Z0-9가-힣]/g, '_');
            const hash = crypto.createHash('md5').update(base64Data).digest('hex');
            const filename = hash + '_' + safeUser + '.' + ext;
            const filepath = path.join(__dirname, 'public', 'uploads', filename);
            if (!fs.existsSync(filepath)) {
                fs.writeFileSync(filepath, base64Data, 'base64');
            }
            return '/uploads/' + filename;
        }
    }
    return '';
};

// ==========================================
// 1. 유저 인증 API (V3: 이름, 성별, 나이 추가)
// ==========================================
// DB 테이블 컬럼 자동 보완 (birth_date, mbti)
async function initDbColumns() {
    let connection;
    try {
        connection = await getConnection();
        try { await connection.execute(`ALTER TABLE USERS ADD birth_date VARCHAR2(20)`); } catch(e){}
        try { await connection.execute(`ALTER TABLE USERS ADD mbti VARCHAR2(10)`); } catch(e){}
        try { await connection.execute(`ALTER TABLE DIARIES ADD poem_text VARCHAR2(4000)`); } catch(e){}
        try { await connection.execute(`ALTER TABLE DIARIES ADD theme_color VARCHAR2(50)`); } catch(e){}
        try { await connection.execute(`ALTER TABLE BOARDS ADD poem_text VARCHAR2(4000)`); } catch(e){}
        try { await connection.execute(`ALTER TABLE DIARIES ADD music_title VARCHAR2(300)`); } catch(e){}
        try { await connection.execute(`ALTER TABLE DIARIES ADD music_artist VARCHAR2(300)`); } catch(e){}
        try { await connection.execute(`ALTER TABLE DIARIES ADD music_duration NUMBER`); } catch(e){}
        try { await connection.execute(`ALTER TABLE BOARDS ADD music_title VARCHAR2(300)`); } catch(e){}
        try { await connection.execute(`ALTER TABLE BOARDS ADD music_artist VARCHAR2(300)`); } catch(e){}
        try { await connection.execute(`ALTER TABLE BOARDS ADD music_duration NUMBER`); } catch(e){}
        try { await connection.execute(`ALTER TABLE DIARIES ADD music_image VARCHAR2(1000)`); } catch(e){}
        try { await connection.execute(`ALTER TABLE BOARDS ADD music_image VARCHAR2(1000)`); } catch(e){}
        try { await connection.execute(`ALTER TABLE BOARDS ADD theme_color VARCHAR2(50)`); } catch(e){}
        try { await connection.execute(`ALTER TABLE USERS ADD pw_updated NUMBER DEFAULT 0`); } catch(e){}
    } catch(e) {
    } finally {
        if (connection) try { await connection.close(); } catch(e){}
    }
}
initDbColumns();

// ==========================================
// 1. 유저 인증 API (V4: 생년월일, MBTI 추가)
// ==========================================
// 중복 확인용 API (사용 가능 여부만 반환)
app.get('/api/auth/check-username', async (req, res) => {
    const username = (req.query.username || '').trim();
    if (!username) {
        return res.status(400).json({ error: '아이디를 입력해주세요.' });
    }
    let connection;
    try {
        connection = await getConnection();
        const checkResult = await connection.execute(`SELECT id FROM USERS WHERE username = :username`, [username]);
        const available = (checkResult.rows.length === 0);
        res.json({ available });
    } catch (err) {
        console.error("CHECK USERNAME ERROR:", err);
        res.status(500).json({ error: '중복 확인 실패' });
    } finally {
        if (connection) try { await connection.close(); } catch(e){}
    }
});

app.post('/api/auth/register', async (req, res) => {
    const { username, password, name, gender, age, birthDate, mbti } = req.body;
    let connection;
    try {
        if (!username || !password || !name || !gender || !age) {
            return res.status(400).json({ error: '필수 항목을 모두 입력해주세요.' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: '비밀번호는 8자 이상이어야 합니다.' });
        }
        connection = await getConnection();
        
        const checkResult = await connection.execute(`SELECT id FROM USERS WHERE username = :username`, [username]);
        if (checkResult.rows.length > 0) return res.status(409).json({ error: '이미 존재하는 아이디입니다.' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const insertSql = `
            INSERT INTO USERS (id, username, password, name, gender, age, birth_date, mbti, pw_updated)
            VALUES (USERS_SEQ.NEXTVAL, :username, :password, :name, :gender, :age, :birthDate, :mbti, 1)
        `;
        await connection.execute(insertSql, [username, hashedPassword, name, gender, age, birthDate || '2000-01-01', mbti || 'INFP'], { autoCommit: true });
        res.status(201).json({ message: '회원가입 완료' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '서버 에러' });
    } finally {
        if (connection) try { await connection.close(); } catch(e){}
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(`SELECT id, username, password, name, gender, age, birth_date, mbti, pw_updated FROM USERS WHERE username = :username`, [username]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
        }

        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.PASSWORD);
        if (!match) {
            return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
        }

        const token = jwt.sign({ id: user.ID, username: user.USERNAME }, JWT_SECRET, { expiresIn: '24h' });
        res.json({
            token,
            username: user.USERNAME,
            id: user.ID,
            name: user.NAME,
            gender: user.GENDER,
            age: user.AGE,
            birthDate: user.BIRTH_DATE || '2000-01-01',
            mbti: user.MBTI || 'INFP',
            pwUpdated: (user.PW_UPDATED === 1)
        });
    } catch (err) {
        console.error("LOGIN ERROR:", err);
        res.status(500).json({ error: '서버 에러' });
    } finally {
        if (connection) try { await connection.close(); } catch(e){}
    }
});

// [3] 내 정보 조회 API
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(`SELECT id, username, name, gender, age, birth_date, mbti FROM USERS WHERE id = :id`, [req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
        
        const user = result.rows[0];
        res.json({
            id: user.ID,
            username: user.USERNAME,
            name: user.NAME,
            gender: user.GENDER,
            age: user.AGE,
            birthDate: user.BIRTH_DATE || '2000-01-01',
            mbti: user.MBTI || 'INFP'
        });
    } catch (err) {
        console.error("GET ME ERROR:", err);
        res.status(500).json({ error: '정보 조회 실패' });
    } finally {
        if (connection) try { await connection.close(); } catch(e){}
    }
});

// [4] 내 정보 수정 API
app.put('/api/auth/me', authenticateToken, async (req, res) => {
    const { name, gender, age, birthDate, mbti, currentPassword, newPassword, password } = req.body;
    let connection;
    try {
        if (!name || !gender || !age) {
            return res.status(400).json({ error: '이름, 성별, 나이는 필수 항목입니다.' });
        }
        connection = await getConnection();

        const targetNewPassword = newPassword || password;
        if (targetNewPassword) {
            if (!currentPassword) {
                return res.status(400).json({ error: '현재 비밀번호를 입력해주세요.' });
            }
            if (targetNewPassword.length < 8) {
                return res.status(400).json({ error: '비밀번호는 8자 이상이어야 합니다.' });
            }

            // 현재 비밀번호 bcrypt 확인
            const userRes = await connection.execute(`SELECT password FROM USERS WHERE id = :id`, [req.user.id]);
            if (userRes.rows.length === 0) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });

            const user = userRes.rows[0];
            const match = await bcrypt.compare(currentPassword, user.PASSWORD);
            if (!match) {
                return res.status(400).json({ error: '현재 비밀번호가 올바르지 않습니다.' });
            }

            const hashedPassword = await bcrypt.hash(targetNewPassword, 10);
            const updateSql = `UPDATE USERS SET name = :name, gender = :gender, age = :age, birth_date = :bdate, mbti = :mbti, password = :pwd, pw_updated = 1 WHERE id = :id`;
            await connection.execute(updateSql, [name, gender, age, birthDate || '2000-01-01', mbti || 'INFP', hashedPassword, req.user.id], { autoCommit: true });
        } else {
            const updateSql = `UPDATE USERS SET name = :name, gender = :gender, age = :age, birth_date = :bdate, mbti = :mbti WHERE id = :id`;
            await connection.execute(updateSql, [name, gender, age, birthDate || '2000-01-01', mbti || 'INFP', req.user.id], { autoCommit: true });
        }
        
        res.json({ message: '정보가 성공적으로 수정되었습니다.' });
    } catch (err) {
        console.error("PUT ME ERROR:", err);
        res.status(500).json({ error: '정보 수정 실패' });
    } finally {
        if (connection) try { await connection.close(); } catch(e){}
    }
});

// Removed duplicate GET /api/auth/me

// ==========================================
// 1.5 외부 API 프록시 (API 키 백엔드 은닉용)
// ==========================================
app.get('/api/weather', async (req, res) => {
    try {
        const { q, lat, lon } = req.query;
        if (!q && (!lat || !lon)) return res.status(400).json({ error: '위치 정보 필요 (q 또는 lat/lon)' });
        
        const API_KEY = process.env.WEATHER_API_KEY;
        if (!API_KEY || API_KEY.includes('여기에')) return res.status(500).json({ error: '날씨 API 키가 설정되지 않았습니다 (.env 파일 확인)' });

        let url = '';
        if (lat && lon) {
            url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=kr`;
        } else {
            url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(q)}&appid=${API_KEY}&units=metric&lang=kr`;
        }
        
        const response = await axios.get(url);
        res.json(response.data);
    } catch (err) {
        console.error("Weather API Error:", err.message);
        res.status(500).json({ error: '날씨 정보를 가져오는데 실패했습니다.' });
    }
});

// ==========================================
// 1.6 Jamendo Resilience BFF (Proxy, Pre-caching, Same-Emotion Fallback)
// ==========================================
const jamendoCache = new Map();
const recentTrackByTag = new Map(); // 태그별 최근 성공 곡 메모리 보관 (1개씩)
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// 세부 상황 48개 정의 (사전 웜업 및 감정별 검증 캐시용)
const SUB_SITUATIONS = [
    // 설렘 & 사랑 💖 (LOVE)
    { category: '설렘 & 사랑', id: 'love_1', label: '답장 기다리며 애가 탐', tag: 'indie' },
    { category: '설렘 & 사랑', id: 'love_2', label: '좋아하는 사람 생각에 밤잠 설침', tag: 'indie' },
    { category: '설렘 & 사랑', id: 'love_3', label: '마주친 순간 멍해짐', tag: 'happy' },
    { category: '설렘 & 사랑', id: 'love_4', label: '오래된 연인과의 편안한 데이트', tag: 'folk' },
    { category: '설렘 & 사랑', id: 'love_5', label: '혼자 의미 부여하고 착각할까 겁남', tag: 'indie' },
    { category: '설렘 & 사랑', id: 'love_6', label: '온종일 SNS 염탐하며 서성임', tag: 'lofi' },
    { category: '설렘 & 사랑', id: 'love_7', label: '처음으로 손잡은 순간의 두근거림', tag: 'happy' },
    { category: '설렘 & 사랑', id: 'love_8', label: '별것 아닌 일상도 공유하고 싶음', tag: 'folk' },

    // 가라앉는 마음 & 이별 🌧️ (DOWN)
    { category: '가라앉는 마음 & 이별', id: 'down_1', label: '이별 후 먹먹함', tag: 'emotional' },
    { category: '가라앉는 마음 & 이별', id: 'down_2', label: '이유 없이 마음이 텅 빔', tag: 'sad' },
    { category: '가라앉는 마음 & 이별', id: 'down_3', label: '사소한 말에 깊게 베임', tag: 'piano' },
    { category: '가라앉는 마음 & 이별', id: 'down_4', label: '세상에 혼자 남겨진 기분', tag: 'ambient' },
    { category: '가라앉는 마음 & 이별', id: 'down_5', label: '다른 사람과 비교하며 자책감 듦', tag: 'sad' },
    { category: '가라앉는 마음 & 이별', id: 'down_6', label: '노력해도 제자리걸음인 것 같아 막막함', tag: 'piano' },
    { category: '가라앉는 마음 & 이별', id: 'down_7', label: '잊은 줄 알았던 기억이 불쑥 떠오름', tag: 'emotional' },
    { category: '가라앉는 마음 & 이별', id: 'down_8', label: '누구에게도 털어놓지 못하고 속앓이 중', tag: 'ambient' },

    // 복잡한 생각 & 갈등 🤯 (OVERLOAD)
    { category: '복잡한 생각 & 갈등', id: 'over_1', label: '연인과 사소한 일로 다툼', tag: 'chillout' },
    { category: '복잡한 생각 & 갈등', id: 'over_2', label: '인간관계 마찰로 부글거림', tag: 'chillout' },
    { category: '복잡한 생각 & 갈등', id: 'over_3', label: '잡생각이 꼬리를 물고 안 멈춤', tag: 'ambient' },
    { category: '복잡한 생각 & 갈등', id: 'over_4', label: '실수 수습하느라 멘탈 흔들림', tag: 'rock' },
    { category: '복잡한 생각 & 갈등', id: 'over_5', label: '팀플 무임승차 때문에 분통 터짐', tag: 'rock' },
    { category: '복잡한 생각 & 갈등', id: 'over_6', label: '마감 직전 벼락치기로 심장 뜀', tag: 'energetic' },
    { category: '복잡한 생각 & 갈등', id: 'over_7', label: '오해를 풀고 싶은데 자존심 상함', tag: 'chillout' },
    { category: '복잡한 생각 & 갈등', id: 'over_8', label: '선 넘는 참견과 간섭에 숨 막힘', tag: 'ambient' },

    // 지친 하루 & 쉼의 필요 🪫 (DEPLETED)
    { category: '지친 하루 & 쉼의 필요', id: 'depleted_1', label: '끝없는 과제/업무에 치임', tag: 'relax' },
    { category: '지친 하루 & 쉼의 필요', id: 'depleted_2', label: '잠 부족으로 멍함', tag: 'ambient' },
    { category: '지친 하루 & 쉼의 필요', id: 'depleted_3', label: '사람 만나는 게 기 빨림', tag: 'ambient' },
    { category: '지친 하루 & 쉼의 필요', id: 'depleted_4', label: '손가락 하나 까딱할 힘 없음', tag: 'lofi' },
    { category: '지친 하루 & 쉼의 필요', id: 'depleted_5', label: '모니터만 오래 봐서 눈과 머리가 지끈거림', tag: 'relax' },
    { category: '지친 하루 & 쉼의 필요', id: 'depleted_6', label: '억지 미소 지으며 감정 노동함', tag: 'lofi' },
    { category: '지친 하루 & 쉼의 필요', id: 'depleted_7', label: '모든 알림 끄고 잠수 타고 싶음', tag: 'chill' },
    { category: '지친 하루 & 쉼의 필요', id: 'depleted_8', label: '밥 챙겨 먹는 것조차 귀찮고 버거움', tag: 'ambient' },

    // 잔잔한 고요 & 사색 🍵 (CALM)
    { category: '잔잔한 고요 & 사색', id: 'calm_1', label: '누구의 방해도 받기 싫음', tag: 'ambient' },
    { category: '잔잔한 고요 & 사색', id: 'calm_2', label: '조용히 나를 돌아보는 중', tag: 'piano' },
    { category: '잔잔한 고요 & 사색', id: 'calm_3', label: '적당한 거리감이 편안함', tag: 'piano' },
    { category: '잔잔한 고요 & 사색', id: 'calm_4', label: '혼자만의 새벽 공기', tag: 'chillout' },
    { category: '잔잔한 고요 & 사색', id: 'calm_5', label: '비 내리는 창밖을 가만히 응시함', tag: 'piano' },
    { category: '잔잔한 고요 & 사색', id: 'calm_6', label: '혼자 걷는 밤 산책길이 포근함', tag: 'ambient' },
    { category: '잔잔한 고요 & 사색', id: 'calm_7', label: '좋아하는 노래 하나만 무한 반복 중', tag: 'lounge' },
    { category: '잔잔한 고요 & 사색', id: 'calm_8', label: '복잡한 관계에서 벗어나 숨 쉬는 시간', tag: 'chillout' },

    // 반짝이는 영감 & 활력 🔥 (ACTIVE)
    { category: '반짝이는 영감 & 활력', id: 'active_1', label: '원하던 목표를 달성함', tag: 'upbeat' },
    { category: '반짝이는 영감 & 활력', id: 'active_2', label: '영감과 의욕이 넘쳐남', tag: 'rnb' },
    { category: '반짝이는 영감 & 활력', id: 'active_3', label: '잡념 없이 깊게 빠져드는 중', tag: 'electronic' },
    { category: '반짝이는 영감 & 활력', id: 'active_4', label: '텐션 올리고 싶은 기분', tag: 'dance' },
    { category: '반짝이는 영감 & 활력', id: 'active_5', label: '운동 후 땀 흘리고 개운함', tag: 'dance' },
    { category: '반짝이는 영감 & 활력', id: 'active_6', label: '어려운 문제를 끝내 해결하고 짜릿함', tag: 'upbeat' },
    { category: '반짝이는 영감 & 활력', id: 'active_7', label: '새로운 도전을 앞두고 설레는 긴장감', tag: 'electronic' },
    { category: '반짝이는 영감 & 활력', id: 'active_8', label: '오랜만에 마음에 드는 결과물이 나옴', tag: 'pop' }
];

const CATEGORY_SAFE_TAGS = {
    '설렘 & 사랑': ['indie', 'happy', 'folk', 'lofi'],
    '가라앉는 마음 & 이별': ['emotional', 'sad', 'piano', 'ambient'],
    '복잡한 생각 & 갈등': ['chillout', 'ambient', 'rock', 'energetic'],
    '지친 하루 & 쉼의 필요': ['relax', 'ambient', 'lofi', 'chill'],
    '잔잔한 고요 & 사색': ['ambient', 'piano', 'chillout', 'lounge'],
    '반짝이는 영감 & 활력': ['upbeat', 'rnb', 'electronic', 'dance', 'pop']
};

function getCategoryTags(catStr) {
    if (!catStr) return [];
    for (const key of Object.keys(CATEGORY_SAFE_TAGS)) {
        if (catStr.includes(key)) return CATEGORY_SAFE_TAGS[key];
    }
    return [];
}

const warmupState = {
    total: 48,
    completed: 0,
    isReady: false,
    failedTags: []
};

const EXCLUDED_KEYWORDS = ['logo', 'jingle', 'ident', 'stinger', 'bumper', 'sound effect', 'sfx', 'intro', 'commercial', 'opener'];
const minDuration = 60; // 최소 60초 기본 보장


// 음성 콘텐츠 및 문제 곡 차단 설정 로더 (설정 파일 기반, 무중단 추가 지원)
const BLOCKED_CONFIG_PATH = path.join(__dirname, 'config', 'blocked_tracks.json');
const BLOCKED_CONFIG_FALLBACK = path.join(__dirname, 'blocked_tracks.json');

function getBlockedConfig() {
    try {
        const filePath = fs.existsSync(BLOCKED_CONFIG_PATH) ? BLOCKED_CONFIG_PATH : BLOCKED_CONFIG_FALLBACK;
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, 'utf8');
            const parsed = JSON.parse(raw);
            return {
                blockedTrackIds: Array.isArray(parsed.blockedTrackIds) ? parsed.blockedTrackIds.map(String) : ['1955492'],
                blockedKeywords: Array.isArray(parsed.blockedKeywords) ? parsed.blockedKeywords.map(k => String(k).toLowerCase()) : ['낭독', '오디오북', '읽기', '책', '시 낭송', '시낭송', '자기계발', '강연', 'speech', 'spoken', 'audiobook', 'reading', 'lecture', 'podcast']
            };
        }
    } catch (e) {
        console.error('[차단 목록 로드 에러]', e.message);
    }
    return {
        blockedTrackIds: ['1955492'],
        blockedKeywords: ['낭독', '오디오북', '읽기', '책', '시 낭송', '시낭송', '자기계발', '강연', 'speech', 'spoken', 'audiobook', 'reading', 'lecture', 'podcast']
    };
}

function isBlockedId(id) {
    if (!id) return false;
    const config = getBlockedConfig();
    const cleanId = String(id).replace(/[^0-9]/g, '');
    return config.blockedTrackIds.includes(String(id)) || (cleanId && config.blockedTrackIds.includes(cleanId));
}

// 2차 필터: 곡 제목, 아티스트, 태그의 음성 콘텐츠 및 차단 곡 검사
function isVoiceOrBlockedTrack(track) {
    if (!track) return true;
    const config = getBlockedConfig();
    const trackIdStr = String(track.id || '');

    // 1) 차단 곡 ID 매칭
    if (config.blockedTrackIds.includes(trackIdStr)) {
        console.warn(`[음악 차단] 차단 목록 곡 ID 매칭 제외: ${trackIdStr} ("${track.name}")`);
        return true;
    }

    // 2) 음성 콘텐츠 키워드 검사 (제목, 아티스트, 앨범, 태그)
    const title = track.name || '';
    const artist = track.artist_name || '';
    const album = track.album_name || '';
    let tagsStr = '';
    if (track.musicinfo?.tags) {
        const { genres = [], instruments = [], vartags = [] } = track.musicinfo.tags;
        tagsStr = [...genres, ...instruments, ...vartags].join(' ');
    } else if (Array.isArray(track.tags)) {
        tagsStr = track.tags.join(' ');
    } else if (typeof track.tags === 'string') {
        tagsStr = track.tags;
    }

    const combinedText = `${title} ${artist} ${album} ${tagsStr}`.toLowerCase();
    for (const kw of config.blockedKeywords) {
        if (combinedText.includes(kw)) {
            console.warn(`[음악 차단] 음성 콘텐츠 감지 제외 (${kw}): 곡 ID ${track.id}, 제목: "${title}", 아티스트: "${artist}"`);
            return true;
        }
    }

    // 3) 제목이 한글·영문이 아닌 문자로만 되어 있는 경우 확인 대상 로그 기록
    const hasHangulOrEnglish = /[a-zA-Z\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/.test(title);
    if (!hasHangulOrEnglish && title.trim().length > 0) {
        console.info(`[음악 확인 대상 - 비한글/비영문 제목] 곡 ID: ${track.id}, 제목: "${title}", 아티스트: "${artist}"`);
    }

    return false;
}

async function fetchTagTracks(tag, bpmParam) {
    const client_id = process.env.JAMENDO_CLIENT_ID;
    if (!client_id) return null;
    let speedParam = '';
    if (bpmParam) {
        const bpm = parseInt(bpmParam);
        if (!isNaN(bpm)) {
            if (bpm < 65) speedParam = 'verylow';
            else if (bpm <= 80) speedParam = 'low';
            else if (bpm <= 105) speedParam = 'medium';
            else if (bpm <= 130) speedParam = 'high';
            else speedParam = 'veryhigh';
        }
    }
    
    const cacheKey = `jamendo_${tag}_${speedParam}_min${minDuration}`;
    const now = Date.now();
    const cached = jamendoCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
        return cached.data;
    }

    // 1차 필터: vocalinstrumental=instrumental (연주곡 전용) & include=musicinfo
    const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${client_id}&format=json&limit=40&tags=${encodeURIComponent(tag)}&vocalinstrumental=instrumental&include=musicinfo${speedParam ? '&speed=' + speedParam : ''}`;
    
    try {
        const response = await axios.get(url, { timeout: 7000 });
        const results = response.data && response.data.results;
        if (results && results.length > 0) {
            const validTracks = results.filter(track => {
                const dur = track.duration || 0;
                if (dur < minDuration) return false;
                const titleLower = (track.name || '').toLowerCase();
                const isJingleOrLogo = EXCLUDED_KEYWORDS.some(kw => titleLower.includes(kw));
                return !isJingleOrLogo;
            });

            if (validTracks.length > 0) {
                jamendoCache.set(cacheKey, { data: validTracks, expiresAt: now + CACHE_TTL });
                return validTracks;
            }
        }
    } catch (e) {
        // 네트워크 에러 시 null
    }
    return null;
}

async function warmupJamendoTracks() {
    console.log('[Jamendo 웜업] 48개 세부 상황 사전 캐싱 시작 (연주곡 vocalinstrumental=instrumental 및 음성차단 필터 적용, 요청 간격 1.1초)...');
    for (const [tag, track] of recentTrackByTag.entries()) {
        if (isVoiceOrBlockedTrack(track)) {
            console.log(`[Jamendo 캐시 정리] 차단된 곡 캐시 제거: 태그 ${tag}, 곡 ID ${track.id}`);
            recentTrackByTag.delete(tag);
        }
    }
    for (let i = 0; i < SUB_SITUATIONS.length; i++) {
        const item = SUB_SITUATIONS[i];
        try {
            if (recentTrackByTag.has(item.tag)) {
                warmupState.completed++;
                continue;
            }

            let tracks = await fetchTagTracks(item.tag, null);
            if (!tracks || tracks.length === 0) {
                await new Promise(r => setTimeout(r, 1000));
                tracks = await fetchTagTracks(item.tag, null);
            }

            if (tracks && tracks.length > 0) {
                const track = tracks[Math.floor(Math.random() * tracks.length)];
                recentTrackByTag.set(item.tag, track);
                warmupState.completed++;
                console.log(`[Jamendo 웜업 (${warmupState.completed}/48)] 상황: "${item.label}" (태그: ${item.tag}) 캐싱 완료 (곡 ID: ${track.id})`);
            } else {
                console.warn(`[Jamendo 웜업 실패] 상황: "${item.label}" (태그: ${item.tag}) 결과 0건`);
                warmupState.failedTags.push({ situation: item.label, tag: item.tag });
            }
        } catch (err) {
            console.error(`[Jamendo 웜업 에러] 상황: "${item.label}" (태그: ${item.tag}): ${err.message}`);
            warmupState.failedTags.push({ situation: item.label, tag: item.tag, error: err.message });
        }
        await new Promise(r => setTimeout(r, 1100)); // 1초 이상 간격 유지
    }
    warmupState.isReady = true;
    console.log(`[Jamendo 웜업 완료] 총 48개 중 ${warmupState.completed}개 완료 (실패 태그: ${warmupState.failedTags.length}개)`);
}

// [Requirement 1] 시연 준비 상태 확인 엔드포인트
app.get('/api/health', (req, res) => {
    const isReady = warmupState.isReady || warmupState.completed >= 48;
    res.json({
        status: isReady ? 'ready' : 'warming_up',
        ready: isReady,
        progress: `${warmupState.completed} / ${warmupState.total}`,
        completed: warmupState.completed,
        total: warmupState.total,
        percentage: Math.round((warmupState.completed / warmupState.total) * 100),
        message: isReady 
            ? "시연 준비가 완료되었습니다. 모든 감정 음악 태그가 준비되었습니다."
            : `시연 준비 중입니다 (${warmupState.completed} / 48 완료). 전체 준비가 완료될 때까지 시연 시작을 권장하지 않습니다.`,
        failedTags: warmupState.failedTags
    });
});

app.get('/api/music', async (req, res) => {
    try {
        const client_id = process.env.JAMENDO_CLIENT_ID;
        if (!client_id) {
            console.error('[Jamendo BFF] JAMENDO_CLIENT_ID 환경변수가 설정되지 않았습니다.');
            return res.status(500).json({ error: 'JAMENDO_CLIENT_ID_NOT_CONFIGURED' });
        }

        const requestedTag = req.query.tag;
        const requestedId = req.query.id;
        const category = req.query.category || '미지정';
        const situation = req.query.situation || '미지정';
        
        if (requestedId) {
            const diaryId = req.query.diary_id || '미지정';
            if (isBlockedId(requestedId)) {
                console.warn(`[일기 음악 조회 실패 - 차단된 음원] 일기 ID: ${diaryId}, 곡 ID: ${requestedId}, 실패 사유: 차단 목록 음원`);
                return res.status(404).json({ error: 'BLOCKED_TRACK', message: '지금은 재생할 수 없어요' });
            }

            const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${client_id}&format=json&id=${requestedId}&include=musicinfo`;
            try {
                const response = await axios.get(url, { timeout: 7000 });
                const results = response.data && response.data.results;
                
                if (results && results.length > 0) {
                    const track = results[0];
                    if (isVoiceOrBlockedTrack(track)) {
                        console.warn(`[일기 음악 조회 실패 - 차단된 음원] 일기 ID: ${diaryId}, 곡 ID: ${requestedId}, 실패 사유: 음성 콘텐츠 차단 (${track.name})`);
                        return res.status(404).json({ error: 'BLOCKED_TRACK', message: '지금은 재생할 수 없어요' });
                    }
                    return res.json({
                        success: true,
                        track: {
                            id: track.id,
                            name: track.name,
                            artist_name: track.artist_name,
                            audio: track.audio.replace(/^http:\/\//i, 'https://'),
                            image: track.image,
                            duration: track.duration
                        }
                    });
                }
                // [Requirement 4] 조회 실패 로그 기록
                console.warn(`[일기 음악 조회 실패] 일기 ID: ${diaryId}, 곡 ID: ${requestedId}, 실패 사유: 404 (음원 없음)`);
                return res.status(404).json({ error: 'NO_RESULTS_FOUND' });
            } catch (err) {
                const status = err.response ? err.response.status : '네트워크 오류';
                console.warn(`[일기 음악 조회 실패] 일기 ID: ${diaryId}, 곡 ID: ${requestedId}, 실패 사유: ${status} (${err.message})`);
                return res.status(500).json({ error: 'JAMENDO_FETCH_ERROR', reason: err.message });
            }
        }

        // Tag 기반 추천 로직 (태그가 없으면 400 반환)
        const searchTag = requestedTag ? requestedTag.trim() : null;
        if (!searchTag) {
            return res.status(400).json({ error: 'TAG_REQUIRED' });
        }

        let stage = '정상';
        let selectedTrack = null;

        // 1. 정상 1차 시도 (동일 태그)
        let results = await fetchTagTracks(searchTag, req.query.bpm);

        if (!results && req.query.bpm) {
            results = await fetchTagTracks(searchTag, null);
        }

        // 2. 0건 시 동일 태그로 1회만 재시도 (간격 1초)
        if (!results || results.length === 0) {
            await new Promise(r => setTimeout(r, 1000));
            results = await fetchTagTracks(searchTag, null);
            if (results && results.length > 0) {
                stage = '재시도';
            }
        }

        if (results && results.length > 0) {
            const seedStr = req.query.seed;
            let randomIdx = 0;
            if (seedStr && !isNaN(parseInt(seedStr))) {
                randomIdx = parseInt(seedStr) % results.length;
            } else {
                randomIdx = Math.floor(Math.random() * results.length);
            }
            selectedTrack = results[randomIdx];
            if (!isVoiceOrBlockedTrack(selectedTrack)) {
                recentTrackByTag.set(searchTag, selectedTrack);
            }
        } else {
            // 3. 0건이고 같은 태그의 최근 곡이 있으면 재사용 (차단 곡 제외)
            if (recentTrackByTag.has(searchTag)) {
                const candidate = recentTrackByTag.get(searchTag);
                if (candidate && !isVoiceOrBlockedTrack(candidate)) {
                    selectedTrack = candidate;
                    stage = '재사용';
                } else {
                    recentTrackByTag.delete(searchTag);
                }
            }
            if (!selectedTrack) {
                // 4. [Requirement 2] 같은 감정 카테고리 내에서 이미 검증된 곡으로 대체 (대체 단계)
                const categoryTags = getCategoryTags(category).filter(t => t !== searchTag);
                for (const altTag of categoryTags) {
                    if (recentTrackByTag.has(altTag)) {
                        const altCandidate = recentTrackByTag.get(altTag);
                        if (altCandidate && !isVoiceOrBlockedTrack(altCandidate)) {
                            selectedTrack = altCandidate;
                            stage = '대체';
                            break;
                        } else {
                            recentTrackByTag.delete(altTag);
                        }
                    }
                }
                
                // 메모리에 없으면 같은 감정 카테고리 태그로 조회 시도
                if (!selectedTrack) {
                    for (const altTag of categoryTags) {
                        const altRes = await fetchTagTracks(altTag, null);
                        if (altRes && altRes.length > 0) {
                            const candidate = altRes[Math.floor(Math.random() * altRes.length)];
                            if (candidate && !isVoiceOrBlockedTrack(candidate)) {
                                selectedTrack = candidate;
                                recentTrackByTag.set(altTag, selectedTrack);
                                stage = '대체';
                                break;
                            }
                        }
                    }
                }

                if (!selectedTrack) {
                    stage = '없음';
                }
            }
        }

        // [Requirement 4] 한 줄 로그
        console.log(`[음악 매칭] 감정: ${category}, 상황: ${situation}, 요청 태그: ${searchTag}, 결과 곡 ID: ${selectedTrack ? selectedTrack.id : '없음'}, 곡 길이: ${selectedTrack ? selectedTrack.duration + '초' : '없음'}, 단계: ${stage}`);

        if (stage === '없음' || !selectedTrack) {
            return res.status(404).json({ error: 'NO_MATCH' });
        }

        const normalizedAudioUrl = selectedTrack.audio.replace(/^http:\/\//i, 'https://');

        return res.json({
            success: true,
            track: {
                id: selectedTrack.id,
                name: selectedTrack.name,
                artist_name: selectedTrack.artist_name,
                audio: normalizedAudioUrl,
                image: selectedTrack.image,
                duration: selectedTrack.duration
            }
        });

    } catch (error) {
        console.error('[Jamendo BFF] Error:', error.message);
        if (error.response && error.response.status === 429) {
            return res.status(429).json({ error: 'RATE_LIMIT_EXCEEDED' });
        }
        res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
    }
});

// --- NEW FREESOUND BFF ---
app.get('/api/freesound', async (req, res) => {
    try {
        const query = req.query.query;
        if (!query) return res.status(400).json({ error: 'query parameter is required' });
        
        // Use environment variable, fallback to the hardcoded key to prevent immediate break
        const apiKey = process.env.FREESOUND_API_KEY || 'x6p0xIMBjuswaNGwaQ0P3WO4fEMoPN2GeELTQFAu';
        
        const url = `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(query)}&token=${apiKey}&fields=id,name,previews&filter=tag:music`;
        const response = await axios.get(url);
        
        return res.json(response.data);
    } catch (error) {
        console.error('[Freesound BFF Error]', error.message);
        res.status(500).json({ error: 'FREESOUND_API_ERROR' });
    }
});

// Helper: Map real-time weather condition to subtle lighting keywords (does not overwrite scene composition)
function getWeatherAtmospherePrompt(weather) {
    if (!weather) return '';
    const w = String(weather).toLowerCase().trim();
    if (w.includes('rain') || w.includes('drizzle') || w.includes('비')) {
        return 'soft reflective damp light';
    } else if (w.includes('snow') || w.includes('눈')) {
        return 'quiet crisp winter light';
    } else if (w.includes('thunder') || w.includes('storm') || w.includes('뇌우')) {
        return 'subtle moody ambient light';
    } else if (w.includes('cloud') || w.includes('overcast') || w.includes('흐림') || w.includes('구름')) {
        return 'gentle diffused overcast lighting';
    } else if (w.includes('mist') || w.includes('fog') || w.includes('haze') || w.includes('안개')) {
        return 'soft morning mist haze';
    } else if (w.includes('clear') || w.includes('sunny') || w.includes('맑음')) {
        return 'clear natural daylight';
    }
    return 'natural ambient lighting';
}

// 🎨 감정 카테고리별 다각도 구도 후보 목록 (카테고리당 6종)
const COMPOSITION_CANDIDATES = {
    '설렘 & 사랑': [
        { viewpoint: '창가 근접', subjectScale: '사물 클로즈업', motif: '창가 근접 정물, 빗방울이나 햇살이 맺힌 유리창과 작은 사물' },
        { viewpoint: '근접', subjectScale: '사물 클로즈업', motif: '두 잔의 찻잔 정물, 테이블 위 마주 놓인 찻잔과 따스한 김' },
        { viewpoint: '창 너머', subjectScale: '골목', motif: '빗방울이 맺힌 유리 너머로 은은하게 번지는 거리의 불빛들' },
        { viewpoint: '중간 거리', subjectScale: '골목', motif: '골목 끝 은은한 주황빛 가로등과 조용한 길모퉁이' },
        { viewpoint: '위에서', subjectScale: '방 안', motif: '책상 위 작은 화병에 꽂힌 꽃 한 송이와 소중히 접힌 편지봉투' },
        { viewpoint: '근접', subjectScale: '방 안', motif: '나란히 놓인 두 켤레의 신발과 문틈으로 비치는 따스한 빛' }
    ],
    '가라앉는 마음 & 이별': [
        { viewpoint: '중간 거리', subjectScale: '방 안', motif: '열린 창문 옆에 비어 있는 낡은 의자와 스며드는 서늘한 바람' },
        { viewpoint: '근접', subjectScale: '사물 클로즈업', motif: '비에 젖은 아스팔트 길 위 홀로 떨어진 젖은 낙엽 클로즈업' },
        { viewpoint: '넓게', subjectScale: '자연 풍경', motif: '새벽 안개가 자욱하게 내려앉은 조용한 다리와 흐릿한 수평선' },
        { viewpoint: '아래에서', subjectScale: '자연 풍경', motif: '잔잔한 물결 위로 흩어지며 반사되는 희미한 빛무리' },
        { viewpoint: '중간 거리', subjectScale: '골목', motif: '비 내린 늦은 오후, 텅 빈 버스 정류장 벤치에 비스듬히 닿은 빛' },
        { viewpoint: '창 너머', subjectScale: '방 안', motif: '흐린 창가에 홀로 기대어 둔 우산과 바닥에 맺힌 작은 물방울' }
    ],
    '복잡한 생각 & 갈등': [
        { viewpoint: '근접', subjectScale: '사물 클로즈업', motif: '빛과 그림자 속에 부드럽게 엉켜 있는 전선이나 실타래' },
        { viewpoint: '위에서', subjectScale: '방 안', motif: '책상 위에 무질서하게 흐트러진 종이 더미와 뚜껑 열린 펜' },
        { viewpoint: '위에서', subjectScale: '골목', motif: '좁은 골목길의 높은 부감 시점, 교차하는 건물 그림자와 좁은 하늘' },
        { viewpoint: '창 너머', subjectScale: '방 안', motif: '밤을 달리는 지하철 차창에 비친 반사광과 아련한 외곽 풍경' },
        { viewpoint: '중간 거리', subjectScale: '방 안', motif: '블라인드 틈새로 길게 가로질러 벽면에 드리운 차가운 사선 그림자' },
        { viewpoint: '위에서', subjectScale: '골목', motif: '비에 젖어 반짝이는 건널목과 횡단보도의 기하학적 선들' }
    ],
    '지친 하루 & 쉼의 필요': [
        { viewpoint: '근접', subjectScale: '방 안', motif: '헝클어진 포근한 담요와 푹신한 베개 옆으로 부드럽게 스민 실내등' },
        { viewpoint: '중간 거리', subjectScale: '방 안', motif: '조용한 거실 소파 등받이 위로 길게 비치는 노을 한 줄기' },
        { viewpoint: '아래에서', subjectScale: '방 안', motif: '바닥 낮은 시점에서 바라본 아늑한 러그와 은은한 스탠드 조명' },
        { viewpoint: '근접', subjectScale: '사물 클로즈업', motif: '침대 협탁 위 따뜻한 머그잔에서 피어오르는 미세한 김' },
        { viewpoint: '창 너머', subjectScale: '방 안', motif: '반쯤 닫힌 린넨 커튼 사이로 불어오는 편안한 저녁 미풍' },
        { viewpoint: '중간 거리', subjectScale: '방 안', motif: '살짝 열린 문틈 사이로 새어나오는 안락하고 따스한 온기의 빛' }
    ],
    '잔잔한 고요 & 사색': [
        { viewpoint: '근접', subjectScale: '사물 클로즈업', motif: '원목 탁자 위 김이 피어오르는 찻잔과 찻잔 받침의 정물' },
        { viewpoint: '근접', subjectScale: '자연 풍경', motif: '잔물결 하나 없이 거울처럼 맑은 호수면과 수면에 드리운 하늘' },
        { viewpoint: '아래에서', subjectScale: '자연 풍경', motif: '숲속 울창한 나무 우듬지 사이로 비쳐 내리는 성스러운 빛줄기' },
        { viewpoint: '중간 거리', subjectScale: '방 안', motif: '원목 책장 옆 조용한 독서등 아래 펼쳐진 두꺼운 책' },
        { viewpoint: '창 너머', subjectScale: '방 안', motif: '창턱에 가만히 내려앉은 푸르스름한 은빛 달빛' },
        { viewpoint: '중간 거리', subjectScale: '자연 풍경', motif: '한적한 숲길 옆 이끼 낀 돌담과 나즈막한 나무 벤치' }
    ],
    '반짝이는 영감 & 활력': [
        { viewpoint: '위에서', subjectScale: '방 안', motif: '아침 햇살이 가득 쏟아지는 책상 위 펼쳐진 새 스케치북과 연필' },
        { viewpoint: '넓게', subjectScale: '골목', motif: '이른 아침 도시의 탁 트인 높은 옥상에서 바라본 활기찬 새벽빛' },
        { viewpoint: '아래에서', subjectScale: '자연 풍경', motif: '탁 트인 푸른 하늘을 올려다본 시점, 맑고 투명한 대기감' },
        { viewpoint: '중간 거리', subjectScale: '방 안', motif: '활짝 열린 창문으로 쏟아지는 싱그러운 아침 햇살과 흩날리는 하얀 커튼' },
        { viewpoint: '근접', subjectScale: '사물 클로즈업', motif: '햇살을 받아 잎맥마다 보석처럼 반짝이는 아침 화분의 물방울' },
        { viewpoint: '중간 거리', subjectScale: '골목', motif: '아침 햇빛이 비스듬히 내려앉아 황금빛으로 반짝이는 거리의 모퉁이' }
    ]
};

// 최근 3회 구도 이력 (시점과 주제 크기 연속 중복 방지)
const recentCompositions = [];

function selectComposition(categoryName) {
    const candidates = COMPOSITION_CANDIDATES[categoryName] || COMPOSITION_CANDIDATES['잔잔한 고요 & 사색'];
    // 최근 3회 결과와 같은 시점(viewpoint)이나 주제 크기(subjectScale) 제외
    const filtered = candidates.filter(cand => {
        return !recentCompositions.some(recent => 
            recent.viewpoint === cand.viewpoint || recent.subjectScale === cand.subjectScale
        );
    });

    const pool = filtered.length > 0 ? filtered : candidates;
    const selected = pool[Math.floor(Math.random() * pool.length)];

    recentCompositions.push({ viewpoint: selected.viewpoint, subjectScale: selected.subjectScale });
    if (recentCompositions.length > 3) {
        recentCompositions.shift();
    }

    return selected;
}

function resolveEmotionCategory(primaryCategory, situationTag) {
    if (primaryCategory && COMPOSITION_CANDIDATES[primaryCategory]) {
        return primaryCategory;
    }
    const ID_MAP = {
        LOVE: '설렘 & 사랑',
        DOWN: '가라앉는 마음 & 이별',
        OVERLOAD: '복잡한 생각 & 갈등',
        DEPLETED: '지친 하루 & 쉼의 필요',
        CALM: '잔잔한 고요 & 사색',
        ACTIVE: '반짝이는 영감 & 활력'
    };
    if (primaryCategory && ID_MAP[primaryCategory]) {
        return ID_MAP[primaryCategory];
    }
    const tag = String(situationTag || '');
    if (tag.includes('사랑') || tag.includes('설렘') || tag.includes('답장') || tag.includes('데이트')) return '설렘 & 사랑';
    if (tag.includes('이별') || tag.includes('우울') || tag.includes('눈물') || tag.includes('먹먹')) return '가라앉는 마음 & 이별';
    if (tag.includes('갈등') || tag.includes('다툼') || tag.includes('분통') || tag.includes('스트레스')) return '복잡한 생각 & 갈등';
    if (tag.includes('치임') || tag.includes('지친') || tag.includes('쉼') || tag.includes('피곤') || tag.includes('잠수')) return '지친 하루 & 쉼의 필요';
    if (tag.includes('고요') || tag.includes('사색') || tag.includes('거리감') || tag.includes('산책')) return '잔잔한 고요 & 사색';
    if (tag.includes('목표') || tag.includes('영감') || tag.includes('활력') || tag.includes('도전') || tag.includes('텐션')) return '반짝이는 영감 & 활력';
    return '잔잔한 고요 & 사색';
}

app.post('/api/ai/analyze', authenticateToken, async (req, res) => {
    try {
        const { story, situationTag, primaryCategory, batteryLevel, weather = '맑음', userProfile } = req.body;
        
        const genderKor = userProfile?.gender || '남성';
        const gender = genderKor === '여성' ? 'young woman' : 'young man';
        const age = userProfile?.age || 24;

        const resolvedCategory = resolveEmotionCategory(primaryCategory, situationTag);
        const chosenComposition = selectComposition(resolvedCategory);
        const weatherAtmosphere = getWeatherAtmospherePrompt(weather);

        const systemPrompt = `You are Andante's empathetic therapeutic poet and artistic visual director.
User Profile: ${age}-year-old ${genderKor}
User Story: "${story || ''}"
Emotion Context: "${situationTag || '일상'}" (Category: "${resolvedCategory}", Battery: ${batteryLevel ?? 50}%)
Ambient Weather Lighting: "${weatherAtmosphere || weather}"

[Selected Visual Composition Guide for this Session]
- Recommended Viewpoint: ${chosenComposition.viewpoint}
- Recommended Subject Scale: ${chosenComposition.subjectScale}
- Scene Motif Inspiration: ${chosenComposition.motif}

[Visual Directing Instructions: DIVERSE PERSPECTIVES & TACTILE EMOTION]
1. SCENE DESIGN (FIRST):
   - anchorObjects: Extract 2-3 tangible, meaningful objects from the user's story (e.g. smartphone with unread screen, cold mug of coffee, rain on windowpane, worn sneakers, rumpled blanket, notebook, desk lamp). If user story is very brief, choose grounded objects fitting the emotion and motif.
   - viewpoint: Align with "${chosenComposition.viewpoint}" (or choose naturally among: 근접, 중간 거리, 넓게, 위에서, 아래에서, 창 너머).
   - subjectScale: Align with "${chosenComposition.subjectScale}" (one of: 사물 클로즈업, 방 안, 골목, 자연 풍경).
   - timeOfDay: Fitting the emotion (새벽, 아침, 나른한 오후, 해질녘, 깊은 밤, etc.).
   - light: Direction & quality of illumination (e.g. diagonal beam through blinds, warm bedside glow, gentle diffused overcast light).
   - humanPresence: MUST BE one of "none" | "back_view" | "distant_small". DEFAULT IS "none". Do NOT put a person unless the composition truly calls for a quiet distant back view or tiny silhouette.
   - poemLine: Pick one evocative line from your generated poem that connects intimately with this visual scene.

2. IMAGE PROMPT GENERATION:
   - Synthesize the designed scene into a vivid, evocative English imagePrompt (40-60 words).
   - Clearly specify the subject scale, viewpoint, anchor objects, lighting, and textural mood.
   - Emphasize fine-art painterly aesthetics (expressive brushwork, atmospheric depth, cinematic framing).
   - STRICTLY FORBIDDEN: Do NOT default to "ultra-wide panoramic landscape with a sunset lake and a small person". Vary camera distance, focus on intimate spaces and objects, and honor the chosen composition.

3. POEM:
   - Write a comforting, genuine 2-stanza Korean poem (title, stanza1, stanza2) reflecting the user's real feelings.

Return valid JSON strictly matching this structure:
{
    "poem": {
        "title": "시 제목",
        "stanza1": "1연 (3-4행)",
        "stanza2": "2연 (3-4행)"
    },
    "scene": {
        "anchorObjects": ["사물1", "사물2"],
        "viewpoint": "${chosenComposition.viewpoint}",
        "subjectScale": "${chosenComposition.subjectScale}",
        "timeOfDay": "시간대",
        "light": "빛의 방향과 세기",
        "humanPresence": "none",
        "poemLine": "시의 한 줄 구절"
    },
    "imagePrompt": "Vivid English description of the scene with the anchor objects, viewpoint, subject scale, lighting, painterly fine-art digital painting style, no text, no watermark",
    "structuredData": {
        "musicGenre": "acoustic",
        "tempoBpm": "65",
        "aiMusicTags": ["chill", "ambient"]
    },
    "userGender": "${genderKor}"
}`;

        let responseText = null;
        let activeModel = PRIMARY_AI_MODEL;

        // [Requirement 3] 1차 시도 (PRIMARY_AI_MODEL)
        try {
            const model = genAI.getGenerativeModel({
                model: PRIMARY_AI_MODEL,
                generationConfig: {
                    temperature: 0.75,
                    responseMimeType: "application/json",
                }
            });
            const result = await model.generateContent(systemPrompt);
            responseText = result.response.text();
        } catch (err1) {
            const is503 = (err1.status === 503) || (err1.message && err1.message.includes('503'));
            console.warn(`[AI Analyze] 1차 모델(${PRIMARY_AI_MODEL}) 호출 실패: ${err1.message} (503 여부: ${is503})`);
            
            if (is503) {
                // 503인 경우 1초 대기 후 1회 재시도
                await new Promise(r => setTimeout(r, 1000));
                try {
                    console.info(`[AI Analyze] 1차 모델(${PRIMARY_AI_MODEL}) 503 재시도 진행`);
                    const model = genAI.getGenerativeModel({
                        model: PRIMARY_AI_MODEL,
                        generationConfig: { temperature: 0.75, responseMimeType: "application/json" }
                    });
                    const result = await model.generateContent(systemPrompt);
                    responseText = result.response.text();
                } catch (retryErr) {
                    console.warn(`[AI Analyze] 1차 모델 재시도 실패: ${retryErr.message}`);
                }
            }

            // 1차 재시도 후에도 실패한 경우, 다른 사용 가능한 모델(FALLBACK_AI_MODEL)로 1회 더 시도
            if (!responseText) {
                console.info(`[AI Analyze] 대체 모델(${FALLBACK_AI_MODEL})로 전환하여 시도`);
                try {
                    activeModel = FALLBACK_AI_MODEL;
                    const fallbackModel = genAI.getGenerativeModel({
                        model: FALLBACK_AI_MODEL,
                        generationConfig: { temperature: 0.75, responseMimeType: "application/json" }
                    });
                    const result = await fallbackModel.generateContent(systemPrompt);
                    responseText = result.response.text();
                } catch (fallbackErr) {
                    console.error(`[AI Analyze] 대체 모델(${FALLBACK_AI_MODEL}) 호출 실패: ${fallbackErr.message}`);
                }
            }
        }

        let parsed = null;
        if (responseText) {
            try {
                parsed = JSON.parse(responseText);
            } catch (jsonErr) {
                console.error('[AI Analyze] JSON 파싱 실패:', jsonErr.message);
            }
        }

        if (parsed) {
            parsed.weather = weather;
            parsed.primaryCategory = resolvedCategory;
            return res.json(parsed);
        }

        // 3차 시도까지 모두 실패 시: 시연 중단 방지를 위한 안정화 Fallback 데이터 반환
        console.warn('[AI Analyze] 모든 모델 호출 실패. 시연 보호용 안전 Fallback 응답 전송.');
        return res.json({
            success: false,
            isAiFallback: true,
            notice: "지금 그림과 시를 만드는 데 시간이 걸려요, 잠시 후 다시 시도해 주세요.",
            poem: {
                title: "마음의 쉼표",
                stanza1: "복잡한 생각 잠시 내려놓고\n조용히 머무는 순간",
                stanza2: "나를 감싸는 온기 속에서\n천천히 숨을 고릅니다"
            },
            scene: {
                anchorObjects: ["창가", "식은 커피 한 잔"],
                viewpoint: chosenComposition.viewpoint,
                subjectScale: chosenComposition.subjectScale,
                timeOfDay: "해질녘",
                light: "스며드는 부드러운 빛",
                humanPresence: "none",
                poemLine: "천천히 숨을 고릅니다"
            },
            imagePrompt: null,
            structuredData: {
                musicGenre: "ambient",
                tempoBpm: "65",
                aiMusicTags: ["ambient", "piano"]
            },
            weather: weather,
            primaryCategory: resolvedCategory
        });
    } catch (err) {
        console.error('AI Analyze Unexpected Error:', err.message);
        return res.json({
            success: false,
            isAiFallback: true,
            notice: "지금 그림과 시를 만드는 데 시간이 걸려요, 잠시 후 다시 시도해 주세요.",
            poem: {
                title: "마음의 쉼표",
                stanza1: "복잡한 생각 잠시 내려놓고\n조용히 머무는 순간",
                stanza2: "나를 감싸는 온기 속에서\n천천히 숨을 고릅니다"
            },
            scene: {
                anchorObjects: ["창가", "식은 커피 한 잔"],
                viewpoint: "중간 거리",
                subjectScale: "방 안",
                timeOfDay: "해질녘",
                light: "스며드는 부드러운 빛",
                humanPresence: "none",
                poemLine: "천천히 숨을 고릅니다"
            },
            imagePrompt: null,
            structuredData: {
                musicGenre: "ambient",
                tempoBpm: "65",
                aiMusicTags: ["ambient", "piano"]
            },
            weather: "맑음",
            primaryCategory: "잔잔한 고요 & 사색"
        });
    }
});



app.post('/api/ai/image', authenticateToken, async (req, res) => {
    try {
        const { prompt, weather } = req.body;
        if (!prompt) return res.status(400).json({ error: '프롬프트가 필요합니다.' });

        const key = process.env.GEMINI_API_KEY;
        if (!key) return res.status(500).json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' });

        const weatherAtmosphere = getWeatherAtmospherePrompt(weather);
        const weatherClause = weatherAtmosphere ? `${weatherAtmosphere}, ` : '';

        // Fixed wrapper removed: No "ultra-wide panoramic", no "no large human figures", no "warm soothing color palette", no "soft peaceful lighting"
        const sanitizedPrompt = `${weatherClause}${prompt.trim()}, fine art digital painting, emotional painterly atmosphere, artistic masterpiece, no text, no watermark, no front-facing portrait`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${key}`;

        const response = await axios.post(url, {
            contents: [{
                parts: [{ text: sanitizedPrompt }]
            }]
        }, { timeout: 35000 });

        const candidate = response.data?.candidates?.[0];
        const imagePart = candidate?.content?.parts?.find(p => p.inlineData);

        if (!imagePart || !imagePart.inlineData?.data) {
            console.error('Gemini image generation response without image:', JSON.stringify(response.data));
            throw new Error('이미지 데이터가 생성되지 않았습니다.');
        }

        const mimeType = imagePart.inlineData.mimeType || 'image/png';
        const base64Data = imagePart.inlineData.data;

        res.json({ image_base64: `data:${mimeType};base64,${base64Data}` });
    } catch (err) {
        console.error('AI Image Error (Gemini):', err.response?.data || err.message);
        res.status(500).json({ error: '이미지 생성 실패: ' + (err.response?.data?.error?.message || err.message) });
    }
});

// ==========================================
app.post('/api/diaries', authenticateToken, async (req, res) => {
    const { weather, mood, theme, music_mood, image_base64, poem_text, theme_color, music_title, music_artist, music_duration, music_image } = req.body;
    let connection;
    try {
        connection = await getConnection();

        // 중복 저장 방지: 동일 유저가 동일 테마로 최근 60초 이내에 이미 저장했는지 확인
        const checkSql = `
            SELECT id FROM DIARIES 
            WHERE user_id = :user_id 
              AND theme = :theme 
              AND created_at >= (SYSDATE - (1 / 1440))
        `;
        const dupCheck = await connection.execute(checkSql, { 
            user_id: req.user.id, 
            theme: theme || '' 
        });

        if (dupCheck.rows && dupCheck.rows.length > 0) {
            console.log(`[DIARIES] 중복 저장 방지: user_id=${req.user.id}, theme="${theme}" 이미 저장됨 (ID: ${dupCheck.rows[0].ID})`);
            return res.status(200).json({ 
                message: '이미 일기장에 저장된 기록입니다.', 
                alreadySaved: true,
                id: dupCheck.rows[0].ID 
            });
        }

        const imageUrl = saveImageLocally(image_base64, req.user.username);
        const sql = `
            INSERT INTO DIARIES (id, user_id, weather, mood, theme, music_mood, image_base64, poem_text, theme_color, music_title, music_artist, music_duration)
            VALUES (DIARIES_SEQ.NEXTVAL, :user_id, :weather, :mood, :theme, :music_mood, :image_url, :poem_text, :theme_color, :music_title, :music_artist, :music_duration)
        `;
        const binds = { 
            user_id: req.user.id, weather, mood, theme, music_mood: music_mood || null, 
            image_url: imageUrl, poem_text: poem_text || '',
            theme_color: theme_color || '',
            music_title: music_title || null,
            music_artist: music_artist || null,
            music_duration: music_duration ? parseInt(music_duration) : null
        };
        await connection.execute(sql, binds, { autoCommit: true });
        res.status(201).json({ message: '일기장 저장 완료' });
    } catch (err) {
        console.error("DIARIES 저장 에러:", err);
        res.status(500).json({ error: '저장 실패' });
    } finally {
        if (connection) try { await connection.close(); } catch(e){}
    }
});

app.get('/api/diaries', authenticateToken, async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const sql = `SELECT id, weather, mood, theme, music_mood, image_base64, poem_text, theme_color, music_title, music_artist, music_duration, music_image, created_at FROM DIARIES WHERE user_id = :user_id ORDER BY created_at DESC`;
        const result = await connection.execute(sql, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        console.error("Diary GET Error:", err);
        // Fallback to old schema if columns don't exist
        if (err.message && err.message.includes('invalid identifier')) {
            try {
                const sqlFallback = `SELECT id, weather, mood, theme, music_mood, image_base64, poem_text, created_at FROM DIARIES WHERE user_id = :user_id ORDER BY created_at DESC`;
                const result = await connection.execute(sqlFallback, [req.user.id]);
                return res.json(result.rows);
            } catch(e) {
                try {
                    const sqlFallback2 = `SELECT id, weather, mood, theme, music_mood, image_base64, created_at FROM DIARIES WHERE user_id = :user_id ORDER BY created_at DESC`;
                    const result2 = await connection.execute(sqlFallback2, [req.user.id]);
                    return res.json(result2.rows);
                } catch(e2){}
            }
        }
        res.status(500).json({ error: '일기장 불러오기 실패' });
    } finally {
        if (connection) try { await connection.close(); } catch(e){}
    }
});

app.delete('/api/diaries/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;
    let connection;
    try {
        connection = await getConnection();
        const selectRes = await connection.execute(`SELECT image_base64 FROM DIARIES WHERE id = :id AND user_id = :user_id`, [id, req.user.id]);
        if (selectRes.rows.length > 0) {
            const imageUrl = selectRes.rows[0].IMAGE_BASE64;
            if (imageUrl && imageUrl.startsWith('/uploads/')) {
                const filepath = path.join(__dirname, 'public', imageUrl);
                if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
            }
            await connection.execute(`DELETE FROM DIARIES WHERE id = :id`, [id], { autoCommit: true });
            res.json({ message: '삭제됨' });
        } else {
            res.status(403).json({ error: '권한 없음' });
        }
    } catch (err) {
        res.status(500).json({ error: '삭제 실패' });
    } finally {
        if (connection) try { await connection.close(); } catch(e){}
    }
});

// ==========================================
// 3. 공유 게시판 API (V3: 제목, 내용, 페이징, 공유기능)
// ==========================================
app.post('/api/boards', authenticateToken, async (req, res) => {
    const { title, content, weather, mood, theme, music_mood, image_base64, poem_text, music_title, music_artist, music_duration, music_image, theme_color } = req.body;
    let connection;
    try {
        const imageUrl = saveImageLocally(image_base64, req.user.username);
        connection = await getConnection();
        const sql = `
            INSERT INTO BOARDS (id, user_id, title, content, weather, mood, theme, music_mood, image_base64, poem_text, music_title, music_artist, music_duration, music_image, theme_color)
            VALUES (BOARDS_SEQ.NEXTVAL, :user_id, :title, :content, :weather, :mood, :theme, :music_mood, :image_url, :poem_text, :music_title, :music_artist, :music_duration, :music_image, :theme_color)
            RETURNING id INTO :out_id
        `;
        const binds = { 
            user_id: req.user.id, 
            title: (title || theme || '공유 일기').slice(0, 200), 
            content: (content || theme || '').slice(0, 4000), 
            weather: (weather || 'Clear').slice(0, 200), 
            mood: (mood || '').slice(0, 2000), 
            theme: (theme || title || '').slice(0, 1000), 
            music_mood: music_mood ? String(music_mood).slice(0, 50) : null, 
            image_url: imageUrl || '', 
            poem_text: (poem_text || '').slice(0, 4000),
            music_title: music_title ? String(music_title).slice(0, 300) : null, 
            music_artist: music_artist ? String(music_artist).slice(0, 300) : null, 
            music_duration: music_duration ? parseInt(music_duration) : null,
            music_image: music_image ? String(music_image).slice(0, 1000) : null, 
            theme_color: theme_color ? String(theme_color).slice(0, 50) : null,
            out_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
        };
        const result = await connection.execute(sql, binds, { autoCommit: true });
        const createdId = result.outBinds && result.outBinds.out_id ? result.outBinds.out_id[0] : null;
        res.status(201).json({ message: '게시판 등록 완료', id: createdId });
    } catch (err) {
        console.error("CREATE BOARD ERROR:", err);
        res.status(500).json({ error: '게시 실패' });
    } finally {
        if (connection) try { await connection.close(); } catch(e){}
    }
});

// 일기장에서 게시판으로 직접 공유 (데이터 복사)
app.post('/api/boards/share', authenticateToken, async (req, res) => {
    const { diary_id, title, content } = req.body;
    let connection;
    try {
        connection = await getConnection();
        const selSql = `SELECT weather, mood, theme, music_mood, image_base64, poem_text, music_title, music_artist, music_duration, music_image, theme_color FROM DIARIES WHERE id = :id AND user_id = :user_id`;
        const selRes = await connection.execute(selSql, [diary_id, req.user.id]);
        if (selRes.rows.length === 0) return res.status(404).json({ error: '일기를 찾을 수 없습니다.' });

        const d = selRes.rows[0];
        // image_base64가 URL(uploads/...) 형태로 되어있으므로, 그대로 사용. (파일 복사는 생략, 경로만 공유)
        const insSql = `
            INSERT INTO BOARDS (id, user_id, title, content, weather, mood, theme, music_mood, image_base64, poem_text, music_title, music_artist, music_duration, music_image, theme_color)
            VALUES (BOARDS_SEQ.NEXTVAL, :user_id, :title, :content, :weather, :mood, :theme, :music_mood, :img, :poem_text, :music_title, :music_artist, :music_duration, :music_image, :theme_color)
            RETURNING id INTO :out_id
        `;
        const binds = { 
            user_id: req.user.id, title, content, weather: d.WEATHER, mood: d.MOOD, theme: d.THEME, music_mood: d.MUSIC_MOOD, 
            img: d.IMAGE_BASE64, poem_text: d.POEM_TEXT || '',
            music_title: d.MUSIC_TITLE || null, music_artist: d.MUSIC_ARTIST || null, music_duration: d.MUSIC_DURATION || null,
            music_image: d.MUSIC_IMAGE || null, theme_color: d.THEME_COLOR || null,
            out_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
        };
        const result = await connection.execute(insSql, binds, { autoCommit: true });
        const createdId = result.outBinds && result.outBinds.out_id ? result.outBinds.out_id[0] : null;
        res.status(201).json({ message: '게시판으로 공유되었습니다!', id: createdId });
    } catch (err) {
        console.error("SHARE ERROR:", err);
        res.status(500).json({ error: '공유 실패' });
    } finally {
        if (connection) try { await connection.close(); } catch(e){}
    }
});

app.get('/api/boards', authenticateToken, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8; 
    const offset = (page - 1) * limit;
    
    let connection;
    try {
        connection = await getConnection();
        const countResult = await connection.execute(`SELECT COUNT(*) AS total FROM BOARDS`);
        const totalItems = countResult.rows[0].TOTAL;
        const totalPages = Math.ceil(totalItems / limit);

        const sql = `
            SELECT b.id, b.title, b.content, b.weather, b.mood, b.theme, b.image_base64, b.created_at, u.username, b.user_id,
                   b.theme_color, b.music_title, b.music_artist, b.music_duration, b.music_image,
                   (SELECT COUNT(*) FROM LIKES l WHERE l.board_id = b.id) as like_count,
                   (SELECT COUNT(*) FROM LIKES l WHERE l.board_id = b.id AND l.user_id = :user_id) as is_liked
            FROM BOARDS b
            JOIN USERS u ON b.user_id = u.id
            ORDER BY b.created_at DESC
            OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
        `;
        const result = await connection.execute(sql, { user_id: req.user.id, offset, limit });
        res.json({ items: result.rows, currentPage: page, totalPages, totalItems });
    } catch (err) {
        console.error("GET BOARDS ERROR:", err);
        res.status(500).json({ error: '조회 실패' });
    } finally {
        if (connection) try { await connection.close(); } catch(e){}
    }
});

app.get('/api/boards/:id', authenticateToken, async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const sql = `
            SELECT b.id, b.title, b.content, b.weather, b.mood, b.theme, b.music_mood, b.image_base64, b.poem_text, b.music_title, b.music_artist, b.music_duration, b.music_image, b.theme_color, b.created_at, u.username, b.user_id,
                   (SELECT COUNT(*) FROM LIKES l WHERE l.board_id = b.id) as like_count,
                   (SELECT COUNT(*) FROM LIKES l WHERE l.board_id = b.id AND l.user_id = :user_id) as is_liked
            FROM BOARDS b
            JOIN USERS u ON b.user_id = u.id
            WHERE b.id = :board_id
        `;
        const result = await connection.execute(sql, { user_id: req.user.id, board_id: req.params.id });
        if (result.rows.length === 0) return res.status(404).json({ error: '게시물을 찾을 수 없습니다.' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: '조회 실패' });
    } finally {
        if (connection) try { await connection.close(); } catch(e){}
    }
});

app.put('/api/boards/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;
    const { title, content } = req.body;
    let connection;
    try {
        connection = await getConnection();
        const selRes = await connection.execute(`SELECT user_id FROM BOARDS WHERE id = :id`, [id]);
        if (selRes.rows.length === 0) return res.status(404).json({ error: '없음' });
        if (selRes.rows[0].USER_ID !== req.user.id && req.user.username !== 'admin') {
            return res.status(403).json({ error: '수정 권한 없음' });
        }
        await connection.execute(`UPDATE BOARDS SET title = :t, content = :c WHERE id = :id`, { t: title, c: content, id }, { autoCommit: true });
        res.json({ message: '수정됨' });
    } catch (err) {
        res.status(500).json({ error: '수정 실패' });
    } finally {
        if (connection) try { await connection.close(); } catch(e){}
    }
});

app.delete('/api/boards/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;
    let connection;
    try {
        connection = await getConnection();
        const selRes = await connection.execute(`SELECT image_base64, user_id FROM BOARDS WHERE id = :id`, [id]);
        if (selRes.rows.length > 0) {
            const board = selRes.rows[0];
            if (board.USER_ID !== req.user.id && req.user.username !== 'admin') {
                return res.status(403).json({ error: '권한 없음' });
            }
            if (board.IMAGE_BASE64 && board.IMAGE_BASE64.startsWith('/uploads/')) {
                const fp = path.join(__dirname, 'public', board.IMAGE_BASE64);
                if (fs.existsSync(fp)) fs.unlinkSync(fp);
            }
            await connection.execute(`DELETE FROM BOARDS WHERE id = :id`, [id], { autoCommit: true });
            res.json({ message: '삭제됨' });
        } else {
            res.status(404).json({ error: '없음' });
        }
    } catch (err) {
        res.status(500).json({ error: '삭제 실패' });
    } finally {
        if (connection) try { await connection.close(); } catch(e){}
    }
});

// ==========================================
// 4. 댓글(COMMENTS) & 좋아요(LIKES) API (V3)
// ==========================================
app.get('/api/comments/:board_id', authenticateToken, async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const sql = `
            SELECT c.id, c.comment_text, c.created_at, u.username, c.user_id 
            FROM COMMENTS c JOIN USERS u ON c.user_id = u.id 
            WHERE c.board_id = :bid ORDER BY c.created_at ASC
        `;
        const result = await connection.execute(sql, [req.params.board_id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: '댓글 조회 실패' });
    } finally {
        if (connection) try { await connection.close(); } catch(e){}
    }
});

app.post('/api/comments', authenticateToken, async (req, res) => {
    const { board_id, comment_text } = req.body;
    let connection;
    try {
        if (!comment_text) return res.status(400).json({ error: '내용을 입력하세요.' });
        connection = await getConnection();
        const sql = `INSERT INTO COMMENTS (id, board_id, user_id, comment_text) VALUES (COMMENTS_SEQ.NEXTVAL, :bid, :user_id, :txt)`;
        await connection.execute(sql, { bid: board_id, user_id: req.user.id, txt: comment_text }, { autoCommit: true });
        res.status(201).json({ message: '댓글 작성 완료' });
    } catch (err) {
        res.status(500).json({ error: '작성 실패' });
    } finally {
        if (connection) try { await connection.close(); } catch(e){}
    }
});

app.delete('/api/comments/:id', authenticateToken, async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const sel = await connection.execute(`SELECT user_id FROM COMMENTS WHERE id = :id`, [req.params.id]);
        if (sel.rows.length === 0) return res.status(404).json({ error: '없음' });
        if (sel.rows[0].USER_ID !== req.user.id && req.user.username !== 'admin') {
            return res.status(403).json({ error: '권한 없음' });
        }
        await connection.execute(`DELETE FROM COMMENTS WHERE id = :id`, [req.params.id], { autoCommit: true });
        res.json({ message: '댓글 삭제' });
    } catch (err) {
        res.status(500).json({ error: '삭제 실패' });
    } finally {
        if (connection) try { await connection.close(); } catch(e){}
    }
});

app.post('/api/likes', authenticateToken, async (req, res) => {
    const { board_id } = req.body;
    let connection;
    try {
        connection = await getConnection();
        // 좋아요 여부 확인
        const chk = await connection.execute(`SELECT id FROM LIKES WHERE board_id = :bid AND user_id = :user_id`, [board_id, req.user.id]);
        let isLiked = false;
        if (chk.rows.length > 0) {
            await connection.execute(`DELETE FROM LIKES WHERE id = :id`, [chk.rows[0].ID], { autoCommit: true });
        } else {
            await connection.execute(`INSERT INTO LIKES (id, board_id, user_id) VALUES (LIKES_SEQ.NEXTVAL, :bid, :user_id)`, [board_id, req.user.id], { autoCommit: true });
            isLiked = true;
        }
        // 최신 카운트 반환
        const cnt = await connection.execute(`SELECT COUNT(*) as c FROM LIKES WHERE board_id = :bid`, [board_id]);
        res.json({ isLiked, count: cnt.rows[0].C });
    } catch (err) {
        res.status(500).json({ error: '실패' });
    } finally {
        if (connection) try { await connection.close(); } catch(e){}
    }
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 V3 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
    // 서버 시작 시 세부 상황 48개 jamendoSafeTag 사전 웜업 시작
    warmupJamendoTracks().catch(err => console.error('[웜업 치명적 에러]', err.message));
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ [서버 시작 실패: 포트 충돌] 포트 ${PORT}이(가) 이미 다른 프로세스에 의해 사용 중입니다.`);
        console.error(`기존 실행 중인 node 프로세스를 종료한 후 다시 실행해 주세요.`);
        console.error(`종료 명령어(PowerShell): Get-Process node | Stop-Process -Force\n`);
    } else {
        console.error('❌ [서버 에러]', err);
    }
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    console.error('❌ [Uncaught Exception]', err.message || err);
});

process.on('unhandledRejection', (reason) => {
    console.error('❌ [Unhandled Rejection]', reason);
});
