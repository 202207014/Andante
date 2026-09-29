export interface SubSituation {
  id: string;
  label: string;
  jamendoSafeTag: string;
  themeColor: string;
}

export interface HealingCategory {
  categoryId: string;
  categoryTitle: string;
  icon: string;
  subtitle: string;
  headerColor: string;
  subSituations: SubSituation[];
}

export const VALID_JAMENDO_TAGS: string[] = [
  'pop', 'happy', 'rock', 'emotional', 'electronic', 'hiphop', 'jazz', 'indie', 
  'filmscore', 'classical', 'dark', 'dance', 'chillout', 'ambient', 'folk', 
  'metal', 'latin', 'rnb', 'reggae', 'punk', 'country', 'house', 'blues', 
  'energetic', 'sad', 'lofi', 'chill', 'relax', 'piano', 'upbeat', 'lounge'
];

export const healingMoodData: HealingCategory[] = [
  {
    categoryId: "love_romance",
    categoryTitle: "설렘 & 사랑",
    icon: "💖",
    subtitle: "사랑에 빠졌거나 두근거리는 마음을 안고 있는 상태",
    headerColor: "#FFD1DC",
    subSituations: [
      { id: "love_1", label: "답장 기다리며 애가 탐", jamendoSafeTag: "indie", themeColor: "#FFE4E1" },
      { id: "love_2", label: "좋아하는 사람 생각에 밤잠 설침", jamendoSafeTag: "indie", themeColor: "#FFF0F5" },
      { id: "love_3", label: "마주친 순간 멍해짐", jamendoSafeTag: "happy", themeColor: "#FADADD" },
      { id: "love_4", label: "오래된 연인과의 편안한 데이트", jamendoSafeTag: "folk", themeColor: "#F4C2C2" },
      { id: "love_5", label: "혼자 의미 부여하고 착각할까 겁남", jamendoSafeTag: "indie", themeColor: "#FCE4EC" },
      { id: "love_6", label: "온종일 SNS 염탐하며 서성임", jamendoSafeTag: "lofi", themeColor: "#F8BBD0" },
      { id: "love_7", label: "처음으로 손잡은 순간의 두근거림", jamendoSafeTag: "happy", themeColor: "#F48FB1" },
      { id: "love_8", label: "별것 아닌 일상도 공유하고 싶음", jamendoSafeTag: "folk", themeColor: "#F06292" }
    ]
  },
  {
    categoryId: "emotional_down",
    categoryTitle: "감정적 가라앉음 & 이별",
    icon: "🌧️",
    subtitle: "상실감, 우울함, 혹은 눈물이 날 것 같은 상태",
    headerColor: "#C5CAE9",
    subSituations: [
      { id: "down_1", label: "이별 후 먹먹함", jamendoSafeTag: "emotional", themeColor: "#D4DAF0" },
      { id: "down_2", label: "이유 없이 마음이 텅 빔", jamendoSafeTag: "sad", themeColor: "#DBD3D8" },
      { id: "down_3", label: "사소한 말에 깊게 베임", jamendoSafeTag: "piano", themeColor: "#DFE2E6" },
      { id: "down_4", label: "세상에 혼자 남겨진 기분", jamendoSafeTag: "ambient", themeColor: "#C9DAF8" },
      { id: "down_5", label: "다른 사람과 비교하며 자책감 듦", jamendoSafeTag: "sad", themeColor: "#E8EAF6" },
      { id: "down_6", label: "노력해도 제자리걸음인 것 같아 막막함", jamendoSafeTag: "piano", themeColor: "#C5CAE9" },
      { id: "down_7", label: "잊은 줄 알았던 기억이 불쑥 떠오름", jamendoSafeTag: "emotional", themeColor: "#9FA8DA" },
      { id: "down_8", label: "누구에게도 털어놓지 못하고 속앓이 중", jamendoSafeTag: "ambient", themeColor: "#7986CB" }
    ]
  },
  {
    categoryId: "mental_overload",
    categoryTitle: "과부하 & 관계 갈등",
    icon: "🌋",
    subtitle: "스트레스, 다툼, 분노로 인해 머리가 복잡한 상태",
    headerColor: "#FFD5D2",
    subSituations: [
      { id: "over_1", label: "연인과 사소한 일로 다툼", jamendoSafeTag: "chillout", themeColor: "#F8C8DC" },
      { id: "over_2", label: "인간관계 마찰로 부글거림", jamendoSafeTag: "chillout", themeColor: "#FFBCAa" },
      { id: "over_3", label: "잡생각이 꼬리를 물고 안 멈춤", jamendoSafeTag: "ambient", themeColor: "#FFC0CB" },
      { id: "over_4", label: "실수 수습하느라 멘탈 흔들림", jamendoSafeTag: "rock", themeColor: "#FADADD" },
      { id: "over_5", label: "팀플 무임승차 때문에 분통 터짐", jamendoSafeTag: "rock", themeColor: "#FFEBEE" },
      { id: "over_6", label: "마감 직전 벼락치기로 심장 뜀", jamendoSafeTag: "energetic", themeColor: "#FFCDD2" },
      { id: "over_7", label: "오해를 풀고 싶은데 자존심 상함", jamendoSafeTag: "chillout", themeColor: "#EF9A9A" },
      { id: "over_8", label: "선 넘는 참견과 간섭에 숨 막힘", jamendoSafeTag: "ambient", themeColor: "#E57373" }
    ]
  },
  {
    categoryId: "depleted_tired",
    categoryTitle: "에너지 고갈 & 지침",
    icon: "🔋",
    subtitle: "모든 에너지가 바닥나 아무것도 할 수 없는 상태",
    headerColor: "#FFE0B2",
    subSituations: [
      { id: "dep_1", label: "끝없는 과제/업무에 치임", jamendoSafeTag: "relax", themeColor: "#FFD8B1" },
      { id: "dep_2", label: "잠 부족으로 멍함", jamendoSafeTag: "ambient", themeColor: "#E8DDCB" },
      { id: "dep_3", label: "사람 만나는 게 기 빨림", jamendoSafeTag: "ambient", themeColor: "#F3C1CE" },
      { id: "dep_4", label: "손가락 하나 까딱할 힘 없음", jamendoSafeTag: "lofi", themeColor: "#D5E8D4" },
      { id: "dep_5", label: "모니터만 오래 봐서 눈과 머리가 지끈거림", jamendoSafeTag: "relax", themeColor: "#FFF3E0" },
      { id: "dep_6", label: "억지 미소 지으며 감정 노동함", jamendoSafeTag: "lofi", themeColor: "#FFE0B2" },
      { id: "dep_7", label: "모든 알림 끄고 잠수 타고 싶음", jamendoSafeTag: "chill", themeColor: "#FFCC80" },
      { id: "dep_8", label: "밥 챙겨 먹는 것조차 귀찮고 버거움", jamendoSafeTag: "ambient", themeColor: "#FFB74D" }
    ]
  },
  {
    categoryId: "quiet_neutral",
    categoryTitle: "잔잔함 & 고독",
    icon: "🍵",
    subtitle: "감정의 파동이 적고 고요한 혼자만의 상태",
    headerColor: "#E1BEE7",
    subSituations: [
      { id: "calm_1", label: "누구의 방해도 받기 싫음", jamendoSafeTag: "ambient", themeColor: "#E1D5E7" },
      { id: "calm_2", label: "조용히 나를 돌아보는 중", jamendoSafeTag: "piano", themeColor: "#CDE4F7" },
      { id: "calm_3", label: "적당한 거리감이 편안함", jamendoSafeTag: "piano", themeColor: "#FFF2B2" },
      { id: "calm_4", label: "혼자만의 새벽 공기", jamendoSafeTag: "chillout", themeColor: "#E8DDCB" },
      { id: "calm_5", label: "비 내리는 창밖을 가만히 응시함", jamendoSafeTag: "piano", themeColor: "#F3E5F5" },
      { id: "calm_6", label: "혼자 걷는 밤 산책길이 포근함", jamendoSafeTag: "ambient", themeColor: "#E1BEE7" },
      { id: "calm_7", label: "좋아하는 노래 하나만 무한 반복 중", jamendoSafeTag: "lounge", themeColor: "#CE93D8" },
      { id: "calm_8", label: "복잡한 관계에서 벗어나 숨 쉬는 시간", jamendoSafeTag: "chillout", themeColor: "#BA68C8" }
    ]
  },
  {
    categoryId: "energy_focus",
    categoryTitle: "활력 & 성취",
    icon: "🔥",
    subtitle: "에너지가 차오르고 무언가에 집중/성취한 상태",
    headerColor: "#C2E2EC",
    subSituations: [
      { id: "act_1", label: "원하던 목표를 달성함", jamendoSafeTag: "upbeat", themeColor: "#C2E2EC" },
      { id: "act_2", label: "영감과 의욕이 넘쳐남", jamendoSafeTag: "rnb", themeColor: "#C9DAF8" },
      { id: "act_3", label: "잡념 없이 깊게 빠져드는 중", jamendoSafeTag: "electronic", themeColor: "#D4DAF0" },
      { id: "act_4", label: "텐션 올리고 싶은 기분", jamendoSafeTag: "dance", themeColor: "#DBD3D8" },
      { id: "act_5", label: "운동 후 땀 흘리고 개운함", jamendoSafeTag: "dance", themeColor: "#E0F7FA" },
      { id: "act_6", label: "어려운 문제를 끝내 해결하고 짜릿함", jamendoSafeTag: "upbeat", themeColor: "#B2EBF2" },
      { id: "act_7", label: "새로운 도전을 앞두고 설레는 긴장감", jamendoSafeTag: "electronic", themeColor: "#80DEEA" },
      { id: "act_8", label: "오랜만에 마음에 드는 결과물이 나옴", jamendoSafeTag: "pop", themeColor: "#4DD0E1" }
    ]
  }
];
