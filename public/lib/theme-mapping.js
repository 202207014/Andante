// Andante Theme Mapping Engine (Browser JS Version)
// 16가지 시간대(Morning, Afternoon, Evening, Night) x 날씨(Sunny, Cloudy, Rainy, Snowy) UI 테마 판별기

const THEME_MATRIX = {
  Morning: {
    Sunny: {
      themeId: "morning-sunny",
      background: "oklch(0.94 0.11 100)", // Bright Morning Yellow
      accentColor: "var(--pastel-yellow)",
      concept: "햇살 가득한 첫인사"
    },
    Cloudy: {
      themeId: "morning-cloudy",
      background: "oklch(0.9 0.04 250)",  // Grey-Blue
      accentColor: "var(--pastel-sky)",
      concept: "잔잔한 안개 아침"
    },
    Rainy: {
      themeId: "morning-rainy",
      background: "oklch(0.87 0.06 230)",
      accentColor: "var(--pastel-sky)",
      concept: "빗소리로 깨어나는 아침"
    },
    Snowy: {
      themeId: "morning-snowy",
      background: "oklch(0.95 0.02 200)",
      accentColor: "var(--pastel-mint)",
      concept: "하얀 설원의 깨끗함"
    }
  },
  Afternoon: {
    Sunny: {
      themeId: "afternoon-sunny",
      background: "oklch(0.93 0.08 155)", // Mint
      accentColor: "var(--pastel-mint)",
      concept: "따스한 오후의 정원"
    },
    Cloudy: {
      themeId: "afternoon-cloudy",
      background: "oklch(0.9 0.04 250)",  // Grey-Blue
      accentColor: "var(--pastel-lilac)",
      concept: "구름 한 조각의 휴식"
    },
    Rainy: {
      themeId: "afternoon-rainy",
      background: "oklch(0.85 0.07 240)",
      accentColor: "var(--pastel-sky)",
      concept: "소나기 지나가는 카페"
    },
    Snowy: {
      themeId: "afternoon-snowy",
      background: "oklch(0.92 0.05 280)",
      accentColor: "var(--pastel-pink)",
      concept: "소복이 쌓이는 오후"
    }
  },
  Evening: {
    Sunny: {
      themeId: "evening-sunny",
      background: "oklch(0.88 0.1 45)",   // Sunset Amber
      accentColor: "var(--pastel-pink)",
      concept: "황금빛 노을 캔버스"
    },
    Cloudy: {
      themeId: "evening-cloudy",
      background: "oklch(0.88 0.1 45)",   // Sunset Amber
      accentColor: "var(--pastel-yellow)",
      concept: "해질녘의 서정적인 바람"
    },
    Rainy: {
      themeId: "evening-rainy",
      background: "oklch(0.83 0.06 270)",
      accentColor: "var(--pastel-lilac)",
      concept: "비에 젖은 노을빛"
    },
    Snowy: {
      themeId: "evening-snowy",
      background: "oklch(0.87 0.08 20)",
      accentColor: "var(--pastel-pink)",
      concept: "분홍빛 정적의 저녁"
    }
  },
  Night: {
    Sunny: {
      themeId: "night-sunny",
      background: "oklch(0.84 0.05 300)", // Cozy Night Lilac
      accentColor: "var(--pastel-lilac)",
      concept: "맑은 별밤 아래 나"
    },
    Cloudy: {
      themeId: "night-cloudy",
      background: "oklch(0.84 0.05 300)", // Cozy Night Lilac
      accentColor: "var(--pastel-lilac)",
      concept: "은은한 밤공기와 온기"
    },
    Rainy: {
      themeId: "night-rainy",
      background: "oklch(0.82 0.06 260)", // Midnight Blue-Purple
      accentColor: "var(--pastel-sky)",
      concept: "깊은 밤 빗소리 속 몰입"
    },
    Snowy: {
      themeId: "night-snowy",
      background: "oklch(0.82 0.06 260)", // Midnight Blue-Purple
      accentColor: "var(--pastel-pink)",
      concept: "고요히 눈 내리는 밤"
    }
  }
};

function getTimeOfDay(hour) {
  if (hour >= 5 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 21) return "Evening";
  return "Night";
}

function normalizeWeather(weatherInput) {
  const w = (weatherInput || "").toLowerCase();
  if (w.includes("rain") || w.includes("drizzle") || w.includes("shower") || w.includes("비")) {
    return "Rainy";
  }
  if (w.includes("snow") || w.includes("flurry") || w.includes("눈")) {
    return "Snowy";
  }
  if (w.includes("cloud") || w.includes("overcast") || w.includes("fog") || w.includes("mist") || w.includes("흐림")) {
    return "Cloudy";
  }
  return "Sunny";
}

function resolveThemeByEnv(hour, weather) {
  const timeCat = getTimeOfDay(hour);
  const weatherCat = normalizeWeather(weather);
  const theme = THEME_MATRIX[timeCat] && THEME_MATRIX[timeCat][weatherCat];

  return theme || {
    themeId: "default-mint",
    background: "oklch(0.93 0.08 155)",
    accentColor: "var(--pastel-mint)",
    concept: "느리게 흐르는 민트빛 안단테"
  };
}

// Global Browser Export
if (typeof window !== 'undefined') {
  window.resolveThemeByEnv = resolveThemeByEnv;
  window.getTimeOfDay = getTimeOfDay;
  window.normalizeWeather = normalizeWeather;
  window.THEME_MATRIX = THEME_MATRIX;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    resolveThemeByEnv,
    getTimeOfDay,
    normalizeWeather,
    THEME_MATRIX
  };
}
