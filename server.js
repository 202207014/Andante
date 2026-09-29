require('dotenv').config();
const express = require('express');
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
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-dev-secret';

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
    } catch(e) {
    } finally {
        if (connection) try { await connection.close(); } catch(e){}
    }
}
initDbColumns();

// ==========================================
// 1. 유저 인증 API (V4: 생년월일, MBTI 추가)
// ==========================================
app.post('/api/auth/register', async (req, res) => {
    const { username, password, name, gender, age, birthDate, mbti } = req.body;
    let connection;
    try {
        if (!username || !password || !name || !gender || !age) {
            return res.status(400).json({ error: '필수 항목을 모두 입력해주세요.' });
        }
        connection = await getConnection();
        
        const checkResult = await connection.execute(`SELECT id FROM USERS WHERE username = :username`, [username]);
        if (checkResult.rows.length > 0) return res.status(409).json({ error: '이미 존재하는 아이디입니다.' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const insertSql = `
            INSERT INTO USERS (id, username, password, name, gender, age, birth_date, mbti)
            VALUES (USERS_SEQ.NEXTVAL, :username, :password, :name, :gender, :age, :birthDate, :mbti)
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
        const result = await connection.execute(`SELECT id, username, password, name, gender, age, birth_date, mbti FROM USERS WHERE username = :username`, [username]);
        if (result.rows.length === 0) return res.status(401).json({ error: '존재하지 않는 아이디입니다.' });

        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.PASSWORD);
        if (!match) return res.status(401).json({ error: '비밀번호 불일치' });

        const token = jwt.sign({ id: user.ID, username: user.USERNAME }, JWT_SECRET, { expiresIn: '24h' });
        res.json({
            token,
            username: user.USERNAME,
            id: user.ID,
            name: user.NAME,
            gender: user.GENDER,
            age: user.AGE,
            birthDate: user.BIRTH_DATE || '2000-01-01',
            mbti: user.MBTI || 'INFP'
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
    const { name, gender, age, birthDate, mbti, password } = req.body;
    let connection;
    try {
        if (!name || !gender || !age) {
            return res.status(400).json({ error: '이름, 성별, 나이는 필수 항목입니다.' });
        }
        connection = await getConnection();
        
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            const updateSql = `UPDATE USERS SET name = :name, gender = :gender, age = :age, birth_date = :bdate, mbti = :mbti, password = :pwd WHERE id = :id`;
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
// 1.6 Jamendo Resilience BFF (Proxy, Cache, Fallback Chain)
// ==========================================
const TAG_FALLBACK_CHAIN = {
    'dark': 'chillout',
    'metal': 'rock',
    'filmscore': 'ambient',
    'reggae': 'chill',
    'latin': 'pop',
    'sad': 'piano',
    'emotional': 'piano',
    'downtempo': 'piano',
};

const jamendoCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

app.get('/api/music', async (req, res) => {
    try {
        // 백엔드 환경 변수에서 가져옵니다 (없으면 Fallback)
        const client_id = process.env.JAMENDO_CLIENT_ID || '39d0c23d';
        const requestedTag = req.query.tag;
        const requestedId = req.query.id;
        
        if (requestedId) {
            // ID로 직접 검색 (Freesound 대신 Jamendo 트랙 재생 등에서 사용됨)
            const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${client_id}&format=json&id[]=${requestedId}`;
            const response = await axios.get(url);
            const results = response.data.results;
            
            if (results && results.length > 0) {
                const track = results[0];
                return res.json({
                    success: true,
                    track: {
                        id: track.id,
                        name: track.name,
                        artist_name: track.artist_name,
                        audio: track.audio.replace(/^http:\/\//i, 'https://'),
                        image: track.image
                    }
                });
            }
            return res.status(404).json({ error: 'NO_RESULTS_FOUND' });
        }

        // Tag 기반 추천 로직
        const searchTag = requestedTag || 'chill';
        
        async function attemptFetch(tag) {
            const cacheKey = `jamendo_${tag}`;
            const now = Date.now();
            const cached = jamendoCache.get(cacheKey);
            if (cached && cached.expiresAt > now) {
                return cached.data;
            }

            const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${client_id}&format=json&limit=30&tags=${encodeURIComponent(tag)}`;
            const response = await axios.get(url);
            const results = response.data.results;
            
            if (results && results.length > 0) {
                jamendoCache.set(cacheKey, { data: results, expiresAt: now + CACHE_TTL });
                return results;
            }
            return null;
        }

        let results = await attemptFetch(searchTag);

        // [Phase 2] 0 Results 시 상위 호환 태그로 1회 재시도 (Safe Fallback Chain)
        if (!results) {
            const safeTag = TAG_FALLBACK_CHAIN[searchTag] || 'chill';
            console.warn(`[Jamendo BFF] 0 results for ${searchTag}, retrying with safe tag: ${safeTag}`);
            results = await attemptFetch(safeTag);
        }

        if (!results) {
            return res.status(404).json({ error: 'NO_RESULTS_FOUND' });
        }

        // [Phase 2] HTTPS Protocol Normalization
        const randomIdx = Math.floor(Math.random() * results.length);
        const track = results[randomIdx];
        const normalizedAudioUrl = track.audio.replace(/^http:\/\//i, 'https://');

        return res.json({
            success: true,
            track: {
                id: track.id,
                name: track.name,
                artist_name: track.artist_name,
                audio: normalizedAudioUrl,
                image: track.image
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

const EMOTION_VISUAL_STYLES = {
    love_romance: { colorPalette: 'warm pastels, soft pink, peach', lighting: 'golden hour, soft glowing light', subject: 'blooming flowers, two intertwined objects', artStyle: 'watercolor, dreamy illustration' },
    emotional_down: { colorPalette: 'slate blue, deep gray, muted indigo', lighting: 'dim, overcast, rainy atmosphere', subject: 'raindrops on window, lone silhouette', artStyle: 'oil painting, melancholic expressionism' },
    mental_overload: { colorPalette: 'high contrast, neon red, deep black', lighting: 'flickering neon, harsh shadows', subject: 'tangled threads, fractured mirrors', artStyle: 'rough acrylic, chaotic abstract' },
    depleted_tired: { colorPalette: 'faded sepia, pale beige, dusty rose', lighting: 'soft twilight, muted fading light', subject: 'empty chair, wilting leaf, calm sea', artStyle: 'minimalism, soft pastel' },
    quiet_neutral: { colorPalette: 'monochrome, soft gray, pale blue', lighting: 'diffused morning light', subject: 'still water, single rock, empty room', artStyle: 'zen illustration, flat vector' },
    energy_focus: { colorPalette: 'vibrant orange, electric blue, neon green', lighting: 'bright cinematic lighting, glowing aura', subject: 'geometric shapes, ascending stairs', artStyle: 'cyberpunk, sharp digital art' }
};

app.post('/api/ai/analyze', authenticateToken, async (req, res) => {
    try {
        const { story, situationTag, primaryCategory, batteryLevel, weather = '맑음', userProfile } = req.body;
        const provider = process.env.LLM_PROVIDER || 'gemini';
        
        const user = {
            gender: userProfile?.gender || '미지정',
            batteryLevel: batteryLevel ?? 100,
            primaryCategory: primaryCategory || 'quiet_neutral',
            situationTag: situationTag || '미지정',
            story: story || '내용 없음'
        };

        const bpmGuidance = user.batteryLevel <= 30 ? '60-75 BPM (Comforting)' : user.batteryLevel >= 70 ? '106-130 BPM (Dynamic Energy)' : '80-100 BPM (Moderate)';
        
        const inputPrompt = `에너지: ${user.batteryLevel}%, 상황: ${user.situationTag}\n일기: ${user.story}`;

        const systemPrompt = `You are a therapeutic AI curator 'Andante'.
User context: Gender=${user.gender}, Energy=${user.batteryLevel}%, Emotion Axis=${user.primaryCategory}, Trigger=${user.situationTag}. Weather=${weather}.
User Story: "${user.story}"

[Instructions]
1. Sympathize with the user's current situation.
2. Provide a 2-stanza poem (stanza1: empathy, stanza2: healing/positivity).
3. Recommend 1 music tag from this EXACT list: [pop, happy, rock, emotional, electronic, hiphop, jazz, indie, filmscore, classical, dark, dance, chillout, ambient, folk, metal, latin, rnb, reggae, punk, country, house, blues, energetic, sad, lofi, chill, relax, piano, upbeat, lounge].
4. Consider energy: ${bpmGuidance}.

Return ONLY a valid JSON object. Do NOT include markdown backticks like \`\`\`json.
Format:
{
    "poem": {
        "title": "Poem title",
        "stanza1": "Stanza 1 content (empathy)",
        "stanza2": "Stanza 2 content (healing)"
    },
    "visualDirection": {
        "sceneSetting": "Specific physical space (NEVER use indoor room with window. e.g., midnight beach, rainy alley, dark library)",
        "keySubject": "MUST BE scenery, landscape, or inanimate objects (e.g., empty study desk, night city lights, quiet road). NO humans, NO girls, NO characters.",
        "lighting": "Lighting",
        "colorTone": "Color palette"
    },
    "imagePrompt": "A pure landscape or still-life digital painting. Specify wide angle or environmental shot. EXCLUDE any human presence, no girls, no portraits.",
    "structuredData": {
        "musicGenre": "one_tag_from_list",
        "tempoBpm": "suggested BPM",
        "aiMusicTags": ["same tag as musicGenre"]
    },
    "empathyMessage": "Short comforting message",
    "weather": "${weather}",
    "mood": "${user.primaryCategory}",
    "theme": "Core healing theme"
}`;

        if (provider === 'gemini') {
            const API_KEY = process.env.GEMINI_API_KEY;
            if (!API_KEY || API_KEY.includes('여기에')) return res.status(500).json({ error: 'Gemini API 키 오류' });
            
            const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
                contents: [{ role: 'user', parts: [{ text: systemPrompt }] }]
            });
            const rawText = response.data.candidates[0].content.parts[0].text;
            const cleanedText = rawText.replace(/^\s*```json\s*/im, '').replace(/```\s*$/im, '').trim();
            const parsed = JSON.parse(cleanedText);
            
            // Inject primaryCategory for the next step (image generation)
            parsed.primaryCategory = user.primaryCategory;
            
            res.json(parsed);
        } else {
            // Ollama (로컬)
            const model = process.env.OLLAMA_MODEL || 'qwen3';
            const response = await axios.post('http://127.0.0.1:11434/api/generate', {
                model: model,
                prompt: systemPrompt,
                stream: false
            });
            let rawText = response.data.response || '';
            // Remove think blocks if any
            rawText = rawText.replace(/<think>[\s\S]*?<\/think>/g, '');
            // Extract json block
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            const cleanedText = jsonMatch ? jsonMatch[0] : rawText.replace(/^\s*```json\s*/im, '').replace(/```\s*$/im, '').trim();
            
            const parsed = JSON.parse(cleanedText);
            parsed.primaryCategory = user.primaryCategory;
            res.json(parsed);
        }
    } catch (err) {
        console.error('AI Analyze Error:', err.message);
        res.status(500).json({ error: 'AI 분석 실패' });
    }
});


app.post('/api/ai/image', authenticateToken, async (req, res) => {
    try {
        const { prompt, primaryCategory } = req.body;
        const API_KEY = process.env.HF_API_KEY;
        if (!API_KEY || API_KEY.includes('여기에')) return res.status(500).json({ error: 'HF API 키 오류' });

        const style = EMOTION_VISUAL_STYLES[primaryCategory] || EMOTION_VISUAL_STYLES.quiet_neutral;
        
        // 1차: 프롬프트 베이스라인 결합 (시각 스타일)
        const baselinePrompt = `${style.subject}, ${style.colorPalette}, ${style.lighting}, ${style.artStyle}`;
        const combinedPrompt = `pure landscape scenery, background art, no people, wide environmental shot, ${prompt}, ${baselinePrompt}, masterpiece, high quality, aesthetic, digital art`;
        
        // 2차: 강제 네거티브 제약 조건 (URL 파라미터 결합)
        const negativeConstraints = 'girl, woman, boy, man, human, person, people, face, portrait, close-up, character, anime face, nsfw, text, watermark, signature';
        
        const encodedPrompt = encodeURIComponent(combinedPrompt);
        const encodedNegative = encodeURIComponent(negativeConstraints);
        
        const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&negative=${encodedNegative}`;
        
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const b64Data = Buffer.from(response.data).toString('base64');
        res.json({ image_base64: `data:image/jpeg;base64,${b64Data}` });
    } catch (err) {
        console.error('AI Image Error:', err.message);
        res.status(500).json({ error: '이미지 생성 실패' });
    }
});



// ==========================================
// 2. 일기장 API (V3: 이미지 저장 방식 변경)
// ==========================================
app.post('/api/diaries', authenticateToken, async (req, res) => {
    const { weather, mood, theme, music_mood, image_base64 } = req.body;
    let connection;
    try {
        const imageUrl = saveImageLocally(image_base64, req.user.username);
        connection = await getConnection();
        const sql = `
            INSERT INTO DIARIES (id, user_id, weather, mood, theme, music_mood, image_base64, poem_text, theme_color)
            VALUES (DIARIES_SEQ.NEXTVAL, :user_id, :weather, :mood, :theme, :music_mood, :image_url, :poem_text, :theme_color)
        `;
        const binds = { 
            user_id: req.user.id, weather, mood, theme, music_mood, 
            image_url: imageUrl, poem_text: req.body.poem_text || '',
            theme_color: req.body.theme_color || ''
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
        const sql = `SELECT id, weather, mood, theme, music_mood, image_base64, poem_text, theme_color, created_at FROM DIARIES WHERE user_id = :user_id ORDER BY created_at DESC`;
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
    const { title, content, weather, mood, theme, music_mood, image_base64 } = req.body;
    let connection;
    try {
        const imageUrl = saveImageLocally(image_base64, req.user.username);
        connection = await getConnection();
        const sql = `
            INSERT INTO BOARDS (id, user_id, title, content, weather, mood, theme, music_mood, image_base64, poem_text)
            VALUES (BOARDS_SEQ.NEXTVAL, :user_id, :title, :content, :weather, :mood, :theme, :music_mood, :image_url, :poem_text)
        `;
        const binds = { user_id: req.user.id, title: title||theme, content: content||theme, weather, mood, theme, music_mood, image_url: imageUrl, poem_text: req.body.poem_text || '' };
        await connection.execute(sql, binds, { autoCommit: true });
        res.status(201).json({ message: '게시판 등록 완료' });
    } catch (err) {
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
        const selSql = `SELECT weather, mood, theme, music_mood, image_base64, poem_text FROM DIARIES WHERE id = :id AND user_id = :user_id`;
        const selRes = await connection.execute(selSql, [diary_id, req.user.id]);
        if (selRes.rows.length === 0) return res.status(404).json({ error: '일기를 찾을 수 없습니다.' });

        const d = selRes.rows[0];
        // image_base64가 URL(uploads/...) 형태로 되어있으므로, 그대로 사용. (파일 복사는 생략, 경로만 공유)
        const insSql = `
            INSERT INTO BOARDS (id, user_id, title, content, weather, mood, theme, music_mood, image_base64, poem_text)
            VALUES (BOARDS_SEQ.NEXTVAL, :user_id, :title, :content, :weather, :mood, :theme, :music_mood, :img, :poem_text)
        `;
        const binds = { user_id: req.user.id, title, content, weather: d.WEATHER, mood: d.MOOD, theme: d.THEME, music_mood: d.MUSIC_MOOD, img: d.IMAGE_BASE64, poem_text: d.POEM_TEXT || '' };
        await connection.execute(insSql, binds, { autoCommit: true });
        res.status(201).json({ message: '게시판으로 공유되었습니다!' });
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
                   (SELECT COUNT(*) FROM LIKES l WHERE l.board_id = b.id) as like_count
            FROM BOARDS b
            JOIN USERS u ON b.user_id = u.id
            ORDER BY b.created_at DESC
            OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
        `;
        const result = await connection.execute(sql, { offset, limit });
        res.json({ items: result.rows, currentPage: page, totalPages, totalItems });
    } catch (err) {
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
            SELECT b.id, b.title, b.content, b.weather, b.mood, b.theme, b.music_mood, b.image_base64, b.poem_text, b.created_at, u.username, b.user_id,
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

app.listen(PORT, () => { console.log(`🚀 V3 서버가 http://localhost:${PORT} 에서 실행 중입니다.`); });
