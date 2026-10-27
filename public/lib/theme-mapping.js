// Andante Theme Mapping Engine (Browser JS Version)
// 16가지 시간대(Morning, Afternoon, Evening, Night) x 날씨(Sunny, Cloudy, Rainy, Snowy) UI 테마 판별기

const THEME_MATRIX = {
  Morning: {
    Sunny: {
      themeId: "morning-sunny",
      background: "linear-gradient(135deg, #FFF9ED 0%, #FFF1D6 50%, #FDEED9 100%)", // Warm Sunrise Peach/Amber
      accentColor: "var(--pastel-yellow)",
      concept: "햇살 가득한 첫인사"
    },
    Cloudy: {
      themeId: "morning-cloudy",
      background: "linear-gradient(135deg, #F4F6F9 0%, #E9EFF5 50%, #E2EBF2 100%)", // Gentle Mist Grey-Blue
      accentColor: "var(--pastel-sky)",
      concept: "잔잔한 안개 아침"
    },
    Rainy: {
      themeId: "morning-rainy",
      background: "linear-gradient(135deg, #EDF2F7 0%, #DEE7F0 50%, #D4E1EC 100%)", // Dewy Morning Rain
      accentColor: "var(--pastel-sky)",
      concept: "빗소리로 깨어나는 아침"
    },
    Snowy: {
      themeId: "morning-snowy",
      background: "linear-gradient(135deg, #F8FAFC 0%, #EFF4F8 50%, #E5EFF5 100%)", // Pure Snow Frost
      accentColor: "var(--pastel-mint)",
      concept: "하얀 설원의 깨끗함"
    }
  },
  Afternoon: {
    Sunny: {
      themeId: "afternoon-sunny",
      background: "linear-gradient(135deg, #F4F8F4 0%, #E8F2E8 50%, #DEF0DF 100%)", // Fresh Sage Garden
      accentColor: "var(--pastel-mint)",
      concept: "따스한 오후의 정원"
    },
    Cloudy: {
      themeId: "afternoon-cloudy",
      background: "linear-gradient(135deg, #F5F4F8 0%, #EBE8F3 50%, #E3E0EE 100%)", // Soft Lilac Cloud
      accentColor: "var(--pastel-lilac)",
      concept: "구름 한 조각의 휴식"
    },
    Rainy: {
      themeId: "afternoon-rainy",
      background: "linear-gradient(135deg, #EBF1F5 0%, #DCE7EE 50%, #CFDEE7 100%)", // Rainy Window Café
      accentColor: "var(--pastel-sky)",
      concept: "소나기 지나가는 카페"
    },
    Snowy: {
      themeId: "afternoon-snowy",
      background: "linear-gradient(135deg, #F8F4F6 0%, #EFE8ED 50%, #E8DFE6 100%)", // Soft Cozy Snow Rose
      accentColor: "var(--pastel-pink)",
      concept: "소복이 쌓이는 오후"
    }
  },
  Evening: {
    Sunny: {
      themeId: "evening-sunny",
      background: "linear-gradient(135deg, #FFF0E6 0%, #FFE2D4 50%, #F5D3E9 100%)", // Golden Hour Apricot-Lilac
      accentColor: "var(--pastel-pink)",
      concept: "황금빛 노을 캔버스"
    },
    Cloudy: {
      themeId: "evening-cloudy",
      background: "linear-gradient(135deg, #FBF1EB 0%, #F3E5DF 50%, #E8DCDE 100%)", // Warm Dusk Amber
      accentColor: "var(--pastel-yellow)",
      concept: "해질녘의 서정적인 바람"
    },
    Rainy: {
      themeId: "evening-rainy",
      background: "linear-gradient(135deg, #EDEAF2 0%, #DDD6E5 50%, #D1CADB 100%)", // Twilight Rain Lavender
      accentColor: "var(--pastel-lilac)",
      concept: "비에 젖은 노을빛"
    },
    Snowy: {
      themeId: "evening-snowy",
      background: "linear-gradient(135deg, #FBF2F4 0%, #F3E3E7 50%, #E9D5DC 100%)", // Silent Rose Dust
      accentColor: "var(--pastel-pink)",
      concept: "분홍빛 정적의 저녁"
    }
  },
  Night: {
    Sunny: {
      themeId: "night-sunny",
      background: "linear-gradient(135deg, #F3EFF8 0%, #E6DFEE 50%, #D9D2E5 100%)", // Starry Night Soft Lilac
      accentColor: "var(--pastel-lilac)",
      concept: "맑은 별밤 아래 나"
    },
    Cloudy: {
      themeId: "night-cloudy",
      background: "linear-gradient(135deg, #F0EEF5 0%, #E3E0EB 50%, #D7D3E2 100%)", // Cozy Ambient Charcoal Mist
      accentColor: "var(--pastel-lilac)",
      concept: "은은한 밤공기와 온기"
    },
    Rainy: {
      themeId: "night-rainy",
      background: "linear-gradient(135deg, #E6EDF5 0%, #D5DFEC 50%, #C7D3E2 100%)", // Deep Midnight Rain
      accentColor: "var(--pastel-sky)",
      concept: "깊은 밤 빗소리 속 몰입"
    },
    Snowy: {
      themeId: "night-snowy",
      background: "linear-gradient(135deg, #EDEAF2 0%, #DFDAE7 50%, #D2CDDC 100%)", // Quiet Snow Night
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
    background: "linear-gradient(135deg, #F4F8F4 0%, #E8F2E8 50%, #DEF0DF 100%)",
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
