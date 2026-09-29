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
Recommend 1 single music genre/tag from this EXACT list: [${VALID_JAMENDO_TAGS.join(', ')}].
Consider the energy: ${bpmGuidance}.
Return ONLY a valid JSON object. Do NOT include markdown backticks like \`\`\`json.
Format:
{
  "musicGenre": "one_tag_from_list",
  "aiMusicTags": "one_tag_from_list",
  "empathyMessage": "A short comforting message (max 2 sentences)",
  "poemTitle": "Title of the short poem",
  "poemContent": "A 4-line comforting poem"
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
        
        // 3. Clean Markdown & Parse JSON
        let rawText = gData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(rawText);

        // 4. Visual Style Mapping & Pollinations AI
        const style = EMOTION_VISUAL_STYLES[primaryCategory] || EMOTION_VISUAL_STYLES.quiet_neutral;
        const imagePrompt = `${style.subject}, ${style.colorPalette}, ${style.lighting}, ${style.artStyle}, masterpiece, high resolution, aesthetic`;
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1024&height=1024&nologo=true`;

        return NextResponse.json({
            ...parsed,
            imageUrl
        });
    } catch (err: any) {
        console.error("[AI Analysis Error]", err.message);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
