import { NextResponse } from 'next/server';
import { EMOTION_VISUAL_STYLES } from '../../../constants/emotionVisualStyles';

const VALID_JAMENDO_TAGS = [
    'chillout', 'ambient', 'piano', 'guitar', 'acoustic', 'indie', 
    'electronic', 'pop', 'rock', 'hiphop', 'jazz', 'classical', 
    'sad', 'happy', 'relax', 'upbeat', 'groove', 'emotional', 
    'downtempo', 'meditation', 'relaxation', 'instrumental'
];

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { story, situationTag, primaryCategory, batteryLevel, weather = '맑음', userProfile } = body;

        const genderKor = userProfile?.gender || '남성';
        const gender = genderKor === '여성' ? 'young woman' : 'young man';
        const age = userProfile?.age || 24;

        const systemPrompt = `You are a therapeutic AI curator 'Andante'.
User Profile: ${age}-year-old ${genderKor} (${gender})
Emotion Context: "${situationTag || '일상'}" (Battery: ${batteryLevel ?? 100}%)
User Story: "${story || ''}"

[Crucial Image Direction: EXPANSIVE SCENERY & THERAPEUTIC LANDSCAPE]
- NEVER focus on a person's body, back, or shoulders. The person must NOT dominate the frame.
- Primary Subject: A vast, peaceful, breathtaking landscape or cozy architectural corner that gives an instant sense of breathing room and deep relaxation.
  - Examples: A tranquil misty lake with mountain reflections, a golden sunset spilling across a vast calm ocean, a wide quiet city skyline bathed in twilight, a sunlit forest trail with soft sunbeams.
- If a person is included: It must be an extremely tiny silhouette in the distant background (taking less than 5% of the frame) simply admiring the view.
- Camera: Cinematic ultra-wide angle view, expansive vista, spacious composition, warm soothing color palette, soft golden hour or tranquil dawn light.
- STRICT CONSTRAINTS: No close-ups, no large human figures, no gloomy or depressive vibes, no text.

Return JSON only:
{
    "poem": { "title": "...", "stanza1": "...", "stanza2": "..." },
    "imagePrompt": "Breathtaking ultra-wide panoramic landscape, serene calm lake reflecting a golden sunset, soft misty mountains in the distance, tiny distant silhouette of a ${gender} standing far away on the dock, expansive airy sky, comforting warm ambient glow, soothing aesthetic digital painting, no close-ups, no large human figures, no text",
    "structuredData": { "musicGenre": "...", "tempoBpm": "..." },
    "userGender": "${genderKor}"
}`;

        // 2. Fetch from Gemini
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY is missing");
        
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
        });
        const gData = await geminiRes.json();
        
        // 3. Clean Markdown & Parse JSON safely
        let rawText = gData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        rawText = rawText.replace(/^[\s\S]*?```json\s*/i, '').replace(/```\s*$/i, '').trim();
        const parsed = JSON.parse(rawText);

        // 4. Visual Style Mapping & Pollinations AI (Double Defense)
        const style = EMOTION_VISUAL_STYLES[primaryCategory] || EMOTION_VISUAL_STYLES.quiet_neutral;
        
        // 1차: 프롬프트 베이스라인 결합 (시각 스타일)
        const baselinePrompt = `${style.subject}, ${style.colorPalette}, ${style.lighting}, ${style.artStyle}`;
        const combinedPrompt = `pure landscape scenery, background art, no people, wide environmental shot, ${parsed.imagePrompt}, ${baselinePrompt}, masterpiece, high resolution, aesthetic, digital art`;
        
        // 2차: 강제 네거티브 제약 조건 (URL 파라미터 결합)
        const negativeConstraints = 'girl, woman, boy, man, human, person, people, face, portrait, close-up, character, anime face, nsfw, text, watermark, signature';

        const encodedPrompt = encodeURIComponent(combinedPrompt);
        const encodedNegative = encodeURIComponent(negativeConstraints);

        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&negative=${encodedNegative}`;

        return NextResponse.json({
            ...parsed,
            imageUrl
        });
    } catch (err: any) {
        console.error("[AI Analysis Error]", err.message);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
