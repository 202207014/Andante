import { NextResponse } from "next/server";
import { resolveThemeByEnv } from "@/lib/theme-mapping";

// 바이오리듬 계산 함수 (신체 23일, 감성 28일, 지성 33일 주기)
function calculateBiorhythm(birthDateStr: string) {
  if (!birthDateStr) return { physical: 50, emotional: 50, intellectual: 50 };
  
  const birthDate = new Date(birthDateStr);
  const today = new Date();
  
  const diffTime = Math.abs(today.getTime() - birthDate.getTime());
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  const physical = Math.round(Math.sin((2 * Math.PI * days) / 23) * 100);
  const emotional = Math.round(Math.sin((2 * Math.PI * days) / 28) * 100);
  const intellectual = Math.round(Math.sin((2 * Math.PI * days) / 33) * 100);
  
  return { physical, emotional, intellectual };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { moodPrompt, weather = "Sunny", location = "Seoul", userProfile } = body;

    const hour = new Date().getHours();
    const resolvedTheme = resolveThemeByEnv(hour, weather);
    const biorhythm = calculateBiorhythm(userProfile?.birthDate || "2000-01-01");

    const provider = process.env.LLM_PROVIDER || "gemini";
    const systemPrompt = `당신은 사용자의 기분, 날씨, 바이오리듬(신체:${biorhythm.physical}%, 감성:${biorhythm.emotional}%, 지성:${biorhythm.intellectual}%), MBTI(${userProfile?.mbti || 'INFP'})를 종합 분석하는 AI 힐링 시인이자 음악 큐레이터입니다.

반드시 오직 아래 JSON 형식으로만 응답하세요. 다른 어떠한 서론이나 설명 텍스트도 포함하지 마세요:
{
  "poem": {
    "title": "서정적이고 포근한 힐링 시 제목",
    "stanza1": "1절 내용 (3~4줄 분량, 바이오리듬과 날씨 반영)",
    "stanza2": "2절 내용 (3~4줄 분량, 감정 치유와 조용한 응원)"
  },
  "structuredData": {
    "primaryEmotion": "대표 감정 1단어 (예: 잔잔한 평온 / 아련함 / 차분함)",
    "musicGenre": "추천 음악 장르 (예: Lo-Fi Chill / Acoustic Guitar / Jazz Piano)",
    "tempoBpm": "추천 템포 (예: 72 BPM)",
    "aiMusicTags": ["장르태그", "BPM태그", "감정태그", "힐링태그"]
  },
  "themeColor": "${resolvedTheme.background}",
  "imagePrompt": "An artistic, tranquil painting prompt for AI image generation representing: [theme and mood], warm pastel atmosphere, masterpiece, detailed, high quality, comma-separated English keywords."
}`;

    let parsedResult;

    if (provider === "gemini") {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey.includes("여기에")) {
        // Fallback static structure when API Key is missing
        parsedResult = getFallbackResponse(moodPrompt, resolvedTheme, biorhythm);
      } else {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n사용자 입력: ${moodPrompt}` }] }],
            }),
          }
        );
        const gData = await geminiRes.json();
        const rawText = gData.candidates[0].content.parts[0].text;
        const cleanedText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        parsedResult = JSON.parse(cleanedText);
      }
    } else {
      // Ollama
      const model = process.env.OLLAMA_MODEL || "qwen3.6";
      const ollamaRes = await fetch("http://127.0.0.1:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt: `${systemPrompt}\n\n사용자 입력: ${moodPrompt}`,
          stream: false,
        }),
      });
      const oData = await ollamaRes.json();
      const cleanedText = oData.response.replace(/```json/g, "").replace(/```/g, "").trim();
      parsedResult = JSON.parse(cleanedText);
    }

    // Ensure themeColor fallback
    if (!parsedResult.themeColor) {
      parsedResult.themeColor = resolvedTheme.background;
    }

    return NextResponse.json(parsedResult);
  } catch (error: any) {
    console.error("AI Analyze Route Error:", error);
    return NextResponse.json(
      { error: "AI 감성 분석 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

function getFallbackResponse(prompt: string, theme: any, bio: any) {
  return {
    poem: {
      title: "안단테: 마음의 여백",
      stanza1: `바람이 살며시 귓가를 스치고\n온종일 바빴던 마음의 태엽이 차츰 느려집니다.\n오늘 그대가 품은 짧은 숨결 하나까지도.`,
      stanza2: `고요한 밤하늘 은하수 물결 타고\n살포시 피어나는 쉼표의 노래,\n내일은 조금 더 부드러운 햇살이 찾아올 테니.`
    },
    structuredData: {
      primaryEmotion: "평온함",
      musicGenre: "Lo-Fi Acoustic",
      tempoBpm: "68 BPM",
      aiMusicTags: ["Acoustic", "68 BPM", "평온함", "안단테 힐링"]
    },
    themeColor: theme.background,
    imagePrompt: `artistic peaceful watercolor illustration, tranquil atmosphere, soft pastel lighting, aesthetic digital painting`
  };
}
