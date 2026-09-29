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
        const { story, situationTag, primaryCategory, batteryLevel, gender } = await req.json();

        // 1. Build prompt based on specifications
        const bpmGuidance = batteryLevel <= 30 ? "60-75 BPM (Comforting)" : batteryLevel >= 70 ? "106-130 BPM (Dynamic Energy)" : "80-100 BPM (Moderate)";
        
        const systemPrompt = `You are a therapeutic AI curator. 
User context: Gender=${gender}, Energy=${batteryLevel}%, Emotion Axis=${primaryCategory}, Trigger=${situationTag}.
User Story: "${story}"

[Instructions]
1. Sympathize with the user's current situation.
2. Provide a 2-stanza poem (stanza1: empathy, stanza2: healing/positivity).
3. Recommend 1 music tag from this EXACT list: [${VALID_JAMENDO_TAGS.join(', ')}].
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
        "tempoBpm": "suggested BPM"
    },
    "empathyMessage": "Short comforting message",
    "theme": "Core healing theme"
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

        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&negative=${encodedNegative}`;

        return NextResponse.json({
            ...parsed,
            imageUrl
        });
    } catch (err: any) {
        console.error("[AI Analysis Error]", err.message);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
