const fs = require('fs');

let js = fs.readFileSync('c:/Users/SHIN/Desktop/AI/server.js', 'utf8');

const regexAnalyze = /app\.post\('\/api\/ai\/analyze', authenticateToken, async \(req, res\) => \{[\s\S]*?\}\);/;
const regexImage = /app\.post\('\/api\/ai\/image', authenticateToken, async \(req, res\) => \{[\s\S]*?\}\);/;

const visualStylesStr = `const EMOTION_VISUAL_STYLES = {
    love_romance: { colorPalette: 'warm pastels, soft pink, peach', lighting: 'golden hour, soft glowing light', subject: 'blooming flowers, two intertwined objects', artStyle: 'watercolor, dreamy illustration' },
    emotional_down: { colorPalette: 'slate blue, deep gray, muted indigo', lighting: 'dim, overcast, rainy atmosphere', subject: 'raindrops on window, lone silhouette', artStyle: 'oil painting, melancholic expressionism' },
    mental_overload: { colorPalette: 'high contrast, neon red, deep black', lighting: 'flickering neon, harsh shadows', subject: 'tangled threads, fractured mirrors', artStyle: 'rough acrylic, chaotic abstract' },
    depleted_tired: { colorPalette: 'faded sepia, pale beige, dusty rose', lighting: 'soft twilight, muted fading light', subject: 'empty chair, wilting leaf, calm sea', artStyle: 'minimalism, soft pastel' },
    quiet_neutral: { colorPalette: 'monochrome, soft gray, pale blue', lighting: 'diffused morning light', subject: 'still water, single rock, empty room', artStyle: 'zen illustration, flat vector' },
    energy_focus: { colorPalette: 'vibrant orange, electric blue, neon green', lighting: 'bright cinematic lighting, glowing aura', subject: 'geometric shapes, ascending stairs', artStyle: 'cyberpunk, sharp digital art' }
};`;

const newAnalyze = `app.post('/api/ai/analyze', authenticateToken, async (req, res) => {
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
        
        const inputPrompt = \`에너지: \${user.batteryLevel}%, 상황: \${user.situationTag}\\n일기: \${user.story}\`;

        const systemPrompt = \`You are a therapeutic AI curator 'Andante'.
User context: Gender=\${user.gender}, Energy=\${user.batteryLevel}%, Emotion Axis=\${user.primaryCategory}, Trigger=\${user.situationTag}. Weather=\${weather}.
User Story: "\${user.story}"

[Instructions]
1. Sympathize with the user's current situation.
2. Provide a 2-stanza poem (stanza1: empathy, stanza2: healing/positivity).
3. Recommend 1 music tag from this EXACT list: [pop, happy, rock, emotional, electronic, hiphop, jazz, indie, filmscore, classical, dark, dance, chillout, ambient, folk, metal, latin, rnb, reggae, punk, country, house, blues, energetic, sad, lofi, chill, relax, piano, upbeat, lounge].
4. Consider energy: \${bpmGuidance}.

Return ONLY a valid JSON object. Do NOT include markdown backticks like \\\`\\\`\\\`json.
Format:
{
    "poem": {
        "title": "Poem title",
        "stanza1": "Stanza 1 content (empathy)",
        "stanza2": "Stanza 2 content (healing)"
    },
    "visualDirection": {
        "sceneSetting": "Specific physical space (NEVER use indoor room with window. e.g., midnight beach, rainy alley, dark library)",
        "keySubject": "Key subject (object or silhouette)",
        "lighting": "Lighting",
        "colorTone": "Color palette"
    },
    "imagePrompt": "An English prompt combining sceneSetting, keySubject, lighting, and colorTone. No text, no human faces, cinematic digital painting",
    "structuredData": {
        "musicGenre": "one_tag_from_list",
        "tempoBpm": "suggested BPM",
        "aiMusicTags": ["same tag as musicGenre"]
    },
    "empathyMessage": "Short comforting message",
    "weather": "\${weather}",
    "mood": "\${user.primaryCategory}",
    "theme": "Core healing theme"
}\`;

        if (provider === 'gemini') {
            const API_KEY = process.env.GEMINI_API_KEY;
            if (!API_KEY || API_KEY.includes('여기에')) return res.status(500).json({ error: 'Gemini API 키 오류' });
            
            const response = await axios.post(\`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=\${API_KEY}\`, {
                contents: [{ role: 'user', parts: [{ text: systemPrompt }] }]
            });
            const rawText = response.data.candidates[0].content.parts[0].text;
            const cleanedText = rawText.replace(/^\\s*\`\`\`json\\s*/im, '').replace(/\`\`\`\\s*$/im, '').trim();
            const parsed = JSON.parse(cleanedText);
            
            // Inject primaryCategory for the next step (image generation)
            parsed.primaryCategory = user.primaryCategory;
            
            res.json(parsed);
        } else {
            res.status(500).json({ error: 'Only Gemini supported in this architecture' });
        }
    } catch (err) {
        console.error('AI Analyze Error:', err.message);
        res.status(500).json({ error: 'AI 분석 실패' });
    }
});`;

const newImage = `app.post('/api/ai/image', authenticateToken, async (req, res) => {
    try {
        const { prompt, primaryCategory } = req.body;
        const API_KEY = process.env.HF_API_KEY;
        if (!API_KEY || API_KEY.includes('여기에')) return res.status(500).json({ error: 'HF API 키 오류' });

        const style = EMOTION_VISUAL_STYLES[primaryCategory] || EMOTION_VISUAL_STYLES.quiet_neutral;
        
        // 1차: 프롬프트 베이스라인 결합 (시각 스타일)
        const baselinePrompt = \`\${style.subject}, \${style.colorPalette}, \${style.lighting}, \${style.artStyle}\`;
        const combinedPrompt = \`\${prompt}, \${baselinePrompt}, masterpiece, high quality, aesthetic, digital art\`;
        
        // 2차: 강제 네거티브 제약 조건 (URL 파라미터 결합)
        const negativeConstraints = 'nsfw, nudity, suggestive, cleavage, blood, violence, weapon, grotesque, blurry, text, watermark, signature, face close-up, human faces';
        
        const encodedPrompt = encodeURIComponent(combinedPrompt);
        const encodedNegative = encodeURIComponent(negativeConstraints);
        
        const url = \`https://image.pollinations.ai/prompt/\${encodedPrompt}?width=1024&height=1024&nologo=true&negative=\${encodedNegative}\`;
        
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const b64Data = Buffer.from(response.data).toString('base64');
        res.json({ image_base64: \`data:image/jpeg;base64,\${b64Data}\` });
    } catch (err) {
        console.error('AI Image Error:', err.message);
        res.status(500).json({ error: '이미지 생성 실패' });
    }
});`;

js = js.replace(regexAnalyze, visualStylesStr + '\n\n' + newAnalyze);
js = js.replace(regexImage, newImage);
fs.writeFileSync('c:/Users/SHIN/Desktop/AI/server.js', js);
