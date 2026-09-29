"use client";

import React, { useState, useEffect, useRef } from "react";
import { resolveThemeByEnv } from "@/lib/theme-mapping";
import { PoemCard } from "@/components/healing/poem-card";
import { MusicSticker } from "@/components/healing/music-sticker";
import { AICanvasCard } from "@/components/healing/ai-canvas-card";

const MBTI_LIST = [
  "INFJ", "INFP", "ENFJ", "ENFP",
  "INTJ", "INTP", "ENTJ", "ENTP",
  "ISFJ", "ISFP", "ESFJ", "ESFP",
  "ISTJ", "ISTP", "ESTJ", "ESTP"
];

const MOOD_LIST = [
  "🌧️ 울적함", "🌿 평온함", "☕ 잔잔한 고독",
  "✨ 지침 & 힐링필요", "🔥 열정적", "⛅ 피곤함"
];

interface AnalysisResponse {
  poem: {
    title: string;
    stanza1: string;
    stanza2: string;
  };
  structuredData: {
    primaryEmotion: string;
    musicGenre: string;
    tempoBpm: string;
    aiMusicTags: string[];
  };
  themeColor: string;
  imagePrompt: string;
}

// Jamendo Logic
const VALID_JAMENDO_TAGS = ['lofi', 'chill', 'ambient', 'relax', 'piano', 'classical', 'sad', 'happy', 'electronic'];
function mapToValidJamendoTag(rawString: string) {
    if (!rawString) return 'relax';
    const lower = rawString.toLowerCase();
    for (const tag of VALID_JAMENDO_TAGS) {
        if (lower === tag || lower.includes(tag)) return tag;
    }
    if (lower.includes('lo-fi')) return 'lofi';
    if (lower.includes('acoustic') || lower.includes('guitar')) return 'relax';
    if (lower.includes('jazz')) return 'chill';
    if (lower.includes('pop') || lower.includes('upbeat')) return 'happy';
    return 'relax';
}

export default function AndanteDashboard() {
  const [currentStep, setCurrentStep] = useState(0); // 0: 진입, 1: 입력, 2: 시, 3: 완성

  const [moodPrompt, setMoodPrompt] = useState("");
  const [location, setLocation] = useState("Seoul");
  const [selectedMbti, setSelectedMbti] = useState("INFP");
  const [selectedMood, setSelectedMood] = useState("🌿 평온함");
  const [birthDate, setBirthDate] = useState("2000-01-01");
  
  // Dynamic Background Theme Color
  const [themeColor, setThemeColor] = useState("oklch(0.93 0.08 155)");
  const [themeConcept, setThemeConcept] = useState("느리게 흐르는 민트빛 안단테");
  const [user, setUser] = useState({ name: "여행자", username: "guest" });

  // AI Loading States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Audio State
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [jamendoTrackInfo, setJamendoTrackInfo] = useState<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Analysis Response State
  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    // Current Time & Initial Theme Calculation
    const currentHour = new Date().getHours();
    const initialTheme = resolveThemeByEnv(currentHour, "Sunny");
    setThemeColor(initialTheme.background);
    setThemeConcept(initialTheme.concept);

    // Local Storage Auth Token & Profile Auto Populate
    const authName = localStorage.getItem("authName") || "여행자";
    const authUsername = localStorage.getItem("authUsername") || "guest";
    const savedBirthDate = localStorage.getItem("authBirthDate");
    const savedMbti = localStorage.getItem("authMbti");

    if (savedBirthDate) setBirthDate(savedBirthDate);
    if (savedMbti) setSelectedMbti(savedMbti);

    setUser({ name: authName, username: authUsername });
  }, []);

  // Audio lifecycle management
  useEffect(() => {
    if (jamendoTrackInfo?.audio && !audioRef.current) {
       audioRef.current = new Audio(jamendoTrackInfo.audio);
       audioRef.current.volume = 0.8;
       audioRef.current.onended = () => setIsPlayingMusic(false);
    } else if (audioRef.current && jamendoTrackInfo?.audio) {
       if (audioRef.current.src !== jamendoTrackInfo.audio) {
           audioRef.current.pause();
           audioRef.current = new Audio(jamendoTrackInfo.audio);
           audioRef.current.volume = 0.8;
           audioRef.current.onended = () => setIsPlayingMusic(false);
       }
    }
  }, [jamendoTrackInfo]);

  useEffect(() => {
     if (audioRef.current) {
         if (isPlayingMusic) {
            audioRef.current.play().catch(e => console.log("Audio play failed:", e));
         } else {
            audioRef.current.pause();
         }
     }
  }, [isPlayingMusic]);

  const loadJamendoTrack = async (rawTag: string) => {
      const tagQuery = mapToValidJamendoTag(rawTag);
      try {
          const res = await fetch(`/api/music?tag=${encodeURIComponent(tagQuery)}`);
          const jamData = await res.json();
          if (jamData.success && jamData.track) {
              setJamendoTrackInfo(jamData.track);
          } else {
              throw new Error("No Jamendo results");
          }
      } catch (err) {
          setJamendoTrackInfo({
              name: "Healing Piano (Network Fallback)",
              artist_name: "Andante AI",
              audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
              image: ""
          });
      }
  };

  // AI Analysis Execution
  const handleAnalyze = async () => {
    if (!moodPrompt.trim()) {
      alert("오늘의 감정과 하루 이야기를 살포시 적어주세요.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisData(null);
    setImageUrl(null);
    setJamendoTrackInfo(null);
    setIsPlayingMusic(false);
    if (audioRef.current) {
        audioRef.current.pause();
    }

    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          moodPrompt: `[MBTI: ${selectedMbti}] [기분: ${selectedMood}] ${moodPrompt}`,
          weather: "Sunny",
          location: location,
          userProfile: {
            mbti: selectedMbti,
            birthDate: birthDate,
          },
        }),
      });

      if (!res.ok) {
        throw new Error("AI 분석에 실패했습니다.");
      }

      const data: AnalysisResponse = await res.json();
      setAnalysisData(data);

      // Update Dynamic Background Theme Color
      if (data.themeColor) {
        setThemeColor(data.themeColor);
      }
      
      // Navigate to Step 2
      setCurrentStep(2);

      // Fetch Music in background
      loadJamendoTrack(data.structuredData?.aiMusicTags?.[0] || data.structuredData?.musicGenre || 'relax');

    } catch (err: any) {
      alert(err.message || "분석 실패");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Image Generation
  const handleGenerateImage = async () => {
    if (!analysisData?.imagePrompt) return;
    setIsGeneratingImage(true);

    try {
      const res = await fetch("/api/ai/image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: analysisData.imagePrompt }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "이미지 생성 실패");

      setImageUrl(data.image_base64);
    } catch (err: any) {
      alert(err.message || "그림 생성 실패");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Save to Diary
  const handleSaveDiary = async () => {
    if (!analysisData || !imageUrl) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch("/api/diaries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          weather: "Sunny",
          mood: selectedMood,
          theme: analysisData.poem.title,
          music_mood: analysisData.structuredData.musicGenre,
          image_base64: imageUrl,
        }),
      });
      if (res.ok) {
        alert("💾 내 일기장에 안단테 작품이 성공적으로 저장되었습니다!");
      } else {
        alert("저장에 실패했습니다.");
      }
    } catch (e) {
      alert("오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // Share to Board
  const handleShareBoard = async () => {
    if (!analysisData || !imageUrl) return;
    const title = prompt("게시판에 공유할 제목을 입력하세요:", analysisData.poem.title);
    if (!title) return;
    const content = prompt("공유하고 싶은 이야기:", moodPrompt);

    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content: content || moodPrompt,
          weather: "Sunny",
          mood: selectedMood,
          theme: analysisData.poem.title,
          music_mood: analysisData.structuredData.musicGenre,
          image_base64: imageUrl,
        }),
      });
      if (res.ok) {
        alert("🌐 공유 게시판에 등록되었습니다!");
      }
    } catch (e) {
      alert("공유 실패");
    }
  };

  const handleRestart = () => {
      setCurrentStep(0);
      setAnalysisData(null);
      setImageUrl(null);
      setMoodPrompt("");
      if (audioRef.current) { 
          audioRef.current.pause(); 
      }
      setIsPlayingMusic(false);
      
      const currentHour = new Date().getHours();
      const initialTheme = resolveThemeByEnv(currentHour, "Sunny");
      setThemeColor(initialTheme.background);
      setThemeConcept(initialTheme.concept);
  };

  return (
    <div
      className="min-h-screen transition-colors duration-700 p-4 md:p-8 flex flex-col"
      style={{ backgroundColor: themeColor }}
    >
      {/* App Header & Brand */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between p-4 mb-8 rounded-3xl border-2 border-black bg-card shadow-brutal flex-shrink-0">
        <div className="flex items-center gap-3 cursor-pointer" onClick={handleRestart}>
          <div className="w-10 h-10 rounded-2xl border-2 border-black bg-[var(--pastel-pink)] shadow-brutal-sm flex items-center justify-center text-xl font-bold">
            🎹
          </div>
          <div>
            <h1 className="text-xl font-black text-black leading-tight">
              안단테 (Andante)
            </h1>
            <p className="text-xs text-slate-600 font-medium">{themeConcept}</p>
          </div>
        </div>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:block text-right">
            <div className="text-xs font-bold text-black">{user.name}님</div>
            <div className="text-[10px] text-slate-500 font-mono">Andante Healing</div>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-black bg-[var(--pastel-yellow)] shadow-brutal-sm flex items-center justify-center font-bold text-black">
            👤
          </div>
        </div>
      </header>

      {/* Main Container - Wizard Flow */}
      <main className="max-w-4xl w-full mx-auto flex-1 flex flex-col">
        {currentStep === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-10 animate-fadeIn fade-in-up">
            <h2 className="text-3xl md:text-4xl font-black text-black leading-snug">
               지금, 당신의 마음에<br/>필요한 박자로 걸어볼까요?
            </h2>
            <button
               onClick={() => setCurrentStep(1)}
               className="brutal-btn bg-[var(--pastel-pink)] text-black font-black text-xl px-12 py-6 rounded-full shadow-brutal active-press hover:scale-105 transition-all flex items-center gap-3"
            >
               <span>🔊</span> 안단테 시작하기
            </button>
          </div>
        )}

        {currentStep === 1 && (
          <section className="animate-fadeIn fade-in-up w-full">
            <div className="mb-6 text-center">
               <span className="text-sm font-bold text-black/60 tracking-widest">● ○ ○ (1/3 - 마음 비우기)</span>
            </div>
            
            <div className="rounded-3xl border-2 border-black bg-card shadow-brutal p-6 space-y-6">
              <div className="flex items-center justify-between border-b-2 border-black/10 pb-4">
                <h2 className="text-lg font-bold text-black flex items-center gap-2">
                  <span>💭</span>
                  <span>오늘의 마음 상태 진단</span>
                </h2>
                <span className="text-xs font-bold px-3 py-1 rounded-full border border-black bg-[var(--pastel-sky)] shadow-brutal-sm text-black">
                  📍 {location}
                </span>
              </div>

              {/* User Profile Input (BirthDate & MBTI) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    🎂 생년월일 (바이오리듬 계산용)
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full p-3 rounded-2xl border-2 border-black bg-slate-50 text-slate-900 font-medium text-xs focus:outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    📍 현재 위치 (도시명)
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Seoul"
                    className="w-full p-3 rounded-2xl border-2 border-black bg-slate-50 text-slate-900 font-medium text-xs focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              {/* MBTI Select Chips */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  🏷️ 나의 MBTI 선택
                </label>
                <div className="flex flex-wrap gap-2">
                  {MBTI_LIST.map((mbti) => (
                    <button
                      key={mbti}
                      onClick={() => setSelectedMbti(mbti)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold border border-black transition-all active-press ${
                        selectedMbti === mbti
                          ? "bg-[var(--pastel-pink)] shadow-brutal-sm text-black scale-105"
                          : "bg-white text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {mbti}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mood Select Cards */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  🎭 지금 느끼는 기분 (Mood)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MOOD_LIST.map((m) => (
                    <button
                      key={m}
                      onClick={() => setSelectedMood(m)}
                      className={`p-3 rounded-2xl border-2 border-black text-xs font-bold text-left transition-all active-press ${
                        selectedMood === m
                          ? "bg-[var(--pastel-yellow)] shadow-brutal-sm text-black"
                          : "bg-white text-slate-700"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* User Prompt Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  ✍️ 이야기 적기 (오늘 하루 또는 느끼는 솔직한 기분)
                </label>
                <textarea
                  value={moodPrompt}
                  onChange={(e) => setMoodPrompt(e.target.value)}
                  placeholder="예: 오늘 비가 촉촉하게 내리는데 피곤하지만 커피 한 잔 마시며 혼자만의 쉼을 얻고 싶어..."
                  rows={4}
                  className="w-full p-4 rounded-2xl border-2 border-black bg-slate-50 text-slate-900 font-medium text-sm focus:outline-none focus:bg-white focus:shadow-brutal-sm transition-all resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full py-5 mt-8 rounded-full border-2 border-black bg-[var(--pastel-mint)] shadow-brutal active-press font-black text-black text-lg flex items-center justify-center gap-2 hover:brightness-105 transition-all disabled:opacity-50"
            >
              <span>🎼</span>
              <span>{isAnalyzing ? "AI 안단테가 당신의 마음을 가만히 보듬는 중입니다..." : "안단테에게 마음 보내기 ✦"}</span>
            </button>
          </section>
        )}

        {currentStep === 2 && analysisData && (
          <section className="animate-fadeIn fade-in-up w-full max-w-2xl mx-auto flex flex-col justify-center min-h-[60vh]">
            <div className="mb-8 flex justify-between items-center w-full">
               <button onClick={() => setCurrentStep(1)} className="px-5 py-2 text-sm font-bold bg-white border-2 border-black rounded-full shadow-brutal-sm active-press hover:bg-slate-50">⬅ 이전 단계</button>
               <span className="text-sm font-bold text-black/60 tracking-widest hidden sm:block">○ ● ○ (2/3 - 마음 채우기)</span>
               <div className="w-[100px] hidden sm:block"></div>
            </div>
            
            <PoemCard
              title={analysisData.poem.title}
              stanza1={analysisData.poem.stanza1}
              stanza2={analysisData.poem.stanza2}
            />

            <div className="mt-12 flex justify-center w-full">
               <button onClick={() => setCurrentStep(3)} className="brutal-btn bg-[var(--pastel-yellow)] text-black font-bold text-base px-8 py-5 rounded-full shadow-brutal active-press w-full">다음: 나의 마음이 그려진 캔버스 보기 ➔</button>
            </div>
          </section>
        )}

        {currentStep === 3 && analysisData && (
          <section className="animate-fadeIn fade-in-up w-full">
            <div className="mb-8 flex justify-between items-center w-full">
               <button onClick={() => setCurrentStep(2)} className="px-5 py-2 text-sm font-bold bg-white border-2 border-black rounded-full shadow-brutal-sm active-press hover:bg-slate-50">⬅ 이전 단계</button>
               <span className="text-sm font-bold text-black/60 tracking-widest hidden sm:block">○ ○ ● (3/3 - 마음 완성하기)</span>
               <div className="w-[100px] hidden sm:block"></div>
            </div>

            <div className="space-y-8">
                <MusicSticker
                  title={jamendoTrackInfo ? jamendoTrackInfo.name : analysisData.structuredData.musicGenre}
                  tags={analysisData.structuredData.aiMusicTags}
                  genre={analysisData.structuredData.musicGenre}
                  bpm={analysisData.structuredData.tempoBpm}
                  moodTag={analysisData.structuredData.primaryEmotion}
                  isPlaying={isPlayingMusic}
                  onTogglePlay={() => setIsPlayingMusic(!isPlayingMusic)}
                />

                {!imageUrl && (
                  <div className="rounded-3xl border-2 border-black bg-card shadow-brutal p-8 text-center space-y-6">
                    <h3 className="font-black text-black text-xl">
                      🎨 나만의 힐링 감성 캔버스 그리기
                    </h3>
                    <p className="text-sm text-slate-600 font-medium max-w-md mx-auto">
                      AI가 당신의 분석된 기분과 시적 어조를 바탕으로 눈앞에 한 폭의 캔버스 그림을 제작합니다.
                    </p>
                    <button
                      onClick={handleGenerateImage}
                      disabled={isGeneratingImage}
                      className="py-4 px-8 rounded-full border-2 border-black bg-[var(--pastel-sky)] shadow-brutal active-press font-bold text-black text-base inline-flex items-center gap-2 hover:brightness-105"
                    >
                      <span>🖼️</span>
                      <span>{isGeneratingImage ? "그림 그리는 중..." : "AI 캔버스 화폭 생성"}</span>
                    </button>
                  </div>
                )}

                <AICanvasCard
                  imageUrl={imageUrl || undefined}
                  isLoading={isGeneratingImage}
                  isSaving={isSaving}
                  onSaveDiary={handleSaveDiary}
                  onShareBoard={handleShareBoard}
                />

                <div className="flex gap-4 mt-12 flex-wrap sm:flex-nowrap justify-center pt-8 border-t-2 border-black/10">
                    <button onClick={handleSaveDiary} className="active-press w-full sm:w-auto flex-1 px-8 py-5 rounded-full border-2 border-black bg-[var(--pastel-pink)] shadow-brutal font-bold text-base hover:brightness-105">
                        💾 내 일기장에 보관하기
                    </button>
                    <button onClick={handleShareBoard} className="active-press w-full sm:w-auto flex-1 px-8 py-5 rounded-full border-2 border-black bg-[var(--pastel-yellow)] shadow-brutal font-bold text-base hover:brightness-105">
                        🌐 공유 게시판에 나누기
                    </button>
                </div>
                
                <div className="mt-8 pb-8 flex justify-center">
                    <button onClick={handleRestart} className="text-sm font-bold text-slate-500 underline underline-offset-4 hover:text-black">
                        🔄 처음부터 다시 하기
                    </button>
                </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
