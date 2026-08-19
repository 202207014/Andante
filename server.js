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

app.post('/api/ai/analyze', authenticateToken, async (req, res) => {
    try {
        const { moodPrompt, rawData, weather = 'Sunny', location = 'Seoul', userProfile } = req.body;
        const inputPrompt = moodPrompt || rawData || '';
        const provider = process.env.LLM_PROVIDER || 'gemini';
        
        // Biorhythm calculation
        let bio = { physical: 50, emotional: 50, intellectual: 50 };
        if (userProfile && userProfile.birthDate) {
            const days = Math.floor(Math.abs(Date.now() - new Date(userProfile.birthDate).getTime()) / (1000 * 60 * 60 * 24));
            bio.physical = Math.round(Math.sin((2 * Math.PI * days) / 23) * 100);
            bio.emotional = Math.round(Math.sin((2 * Math.PI * days) / 28) * 100);
            bio.intellectual = Math.round(Math.sin((2 * Math.PI * days) / 33) * 100);
        }

        const systemPrompt = `당신은 사용자의 기분, 날씨, 바이오리듬(신체:${bio.physical}%, 감성:${bio.emotional}%, 지성:${bio.intellectual}%)을 종합 분석하는 안단테(Andante) AI 시인이자 음악 큐레이터입니다.

오직 아래 JSON 형식으로만 응답하며 다른 어떠한 텍스트도 포함하지 마세요:
{
    "poem": {
        "title": "사용자의 기분과 입력에 완전히 어울리는 감각적인 시 제목 (예: 활기차면 역동적으로, 우울하면 차분하게)",
        "stanza1": "1절 내용 (3~4줄 분량, 사용자의 현재 감정과 상태에 깊이 공감하고 동기화되는 어조)",
        "stanza2": "2절 내용 (3~4줄 분량, 사용자의 기분을 증폭시키거나 위로해주는 감성적인 메시지)"
    },
    "structuredData": {
        "primaryEmotion": "대표 감정 (예: 뜨거운 열정 / 잔잔한 평온 / 깊은 슬픔 등)",
        "musicGenre": "추천 음악 태그 (아래 목록에서 감정에 맞는 1개만 신중히 선택, 기본값으로 lofi를 남용하지 말 것)",
        "tempoBpm": "추천 템포 (예: 120 BPM 또는 72 BPM)",
        "aiMusicTags": ["위에서 선택한 태그 1개"]
    },
    "themeColor": "사용자 기분에 맞는 배경 컬러의 HEX 코드 (예: 열정적이면 #ffcccc, 평온하면 #ccf2ff, 우울하면 #e6e6fa)",
    "imagePrompt": "An artistic and detailed image generation prompt representing the user's emotion and poem. Crucial: adapt the color palette and mood to the user's input (e.g. vibrant colors and dynamic mood for passion; pastel colors and peaceful mood for calm; dark and moody for sadness), high quality, digital painting, comma-separated English keywords.",
    "weather": "날씨",
    "mood": "사용자의 감정 (예: 열정, 우울, 평온)",
    "theme": "시의 핵심 주제"
}

[필수 사항]
musicGenre와 aiMusicTags 배열 안에는 오직 아래의 허용된 태그 목록 중 단 1개만 선택해서 동일하게 적어주세요. 사용자의 감정에 가장 잘 어울리는 것을 고르세요.
허용된 태그: chill, ambient, relax, piano, classical, sad, happy, electronic, energetic, upbeat, pop, jazz, rock, lounge`;

        if (provider === 'gemini') {
            const API_KEY = process.env.GEMINI_API_KEY;
            if (!API_KEY || API_KEY.includes('여기에')) return res.status(500).json({ error: 'Gemini API 키가 설정되지 않았습니다 (.env 파일 확인)' });
            
            const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
                contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n입력 데이터: ${inputPrompt}` }] }]
            });
            const rawText = response.data.candidates[0].content.parts[0].text;
            const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            res.json(JSON.parse(cleanedText));
        } else {
            // Ollama (로컬)
            const model = process.env.OLLAMA_MODEL || 'qwen3';
            const response = await axios.post('http://127.0.0.1:11434/api/generate', {
                model: model,
                prompt: `${systemPrompt}\n\n입력 데이터: ${inputPrompt}`,
                stream: false
            });
            let rawText = response.data.response || '';
            // Remove think blocks if any
            rawText = rawText.replace(/<think>[\s\S]*?<\/think>/g, '');
            // Extract json block
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            const cleanedText = jsonMatch ? jsonMatch[0] : rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            
            res.json(JSON.parse(cleanedText));
        }
    } catch (err) {
        console.error("AI Analyze Error:", err.response ? err.response.data : err.message, err.stack);
        res.status(500).json({ error: 'AI 분석 실패: ' + (err.message || '') });
    }
});

app.post('/api/ai/image', authenticateToken, async (req, res) => {
    try {
        const { prompt } = req.body;
        const API_KEY = process.env.HF_API_KEY;
        if (!API_KEY || API_KEY.includes('여기에')) return res.status(500).json({ error: 'HuggingFace API 키가 설정되지 않았습니다 (.env 파일 확인)' });

        const response = await axios.post('https://router.huggingface.co/together/v1/images/generations', 
            { 
                model: 'black-forest-labs/FLUX.1-schnell', 
                prompt: prompt,
                response_format: 'b64_json'
            },
            { 
                headers: { 
                    'Authorization': `Bearer ${API_KEY}`, 
                    'Content-Type': 'application/json'
                }
            }
        );

        const b64Data = response.data.data[0].b64_json;
        res.json({ image_base64: `data:image/jpeg;base64,${b64Data}` });
    } catch (err) {
        console.error("Image Gen Error:", err.response ? err.response.data : err.message);
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
