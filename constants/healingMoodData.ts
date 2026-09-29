export interface SubSituation {
  id: string;
  label: string;
  jamendoSafeTag: string;
  themeColor: string;
}

export interface HealingMood {
  id: string;
  title: string;
  jamendoTags: string[];
  subSituations: SubSituation[];
}

export const HEALING_MOOD_DATA: HealingMood[] = [
  {
    id: "love_romance",
    title: "설렘 & 사랑 ❤️",
    jamendoTags: ["indie", "happy", "acoustic"],
    subSituations: [
      { id: "lr1", label: "누군가를 떠올리면 자꾸 웃음이 나", jamendoSafeTag: "happy", themeColor: "#FFB3BA" },
      { id: "lr2", label: "오래된 연인과 사소한 다툼 후 속상함", jamendoSafeTag: "acoustic", themeColor: "#FFC8A2" },
      { id: "lr3", label: "짝사랑 중인데 마음을 전할 용기가 안 나", jamendoSafeTag: "indie", themeColor: "#FF9CEE" },
      { id: "lr4", label: "기념일인데 평소보다 더 특별하게 보내고 싶어", jamendoSafeTag: "happy", themeColor: "#FFDFBA" },
      { id: "lr5", label: "서로 바빠서 데이트를 미루게 되어 서운해", jamendoSafeTag: "acoustic", themeColor: "#E2B2D1" },
      { id: "lr6", label: "새로운 인연을 만날 생각에 가슴이 두근거려", jamendoSafeTag: "indie", themeColor: "#FFFFBA" }
    ]
  },
  {
    id: "emotional_down",
    title: "감정적 가라앉음 & 이별 🌧️",
    jamendoTags: ["emotional", "sad", "piano"],
    subSituations: [
      { id: "ed1", label: "아무 이유 없이 눈물이 핑 도는 날", jamendoSafeTag: "emotional", themeColor: "#B2CEFE" },
      { id: "ed2", label: "소중한 사람과 이별 후 공허함이 커", jamendoSafeTag: "sad", themeColor: "#A3B1C6" },
      { id: "ed3", label: "남들은 다 행복해 보이는데 나만 뒤처진 기분", jamendoSafeTag: "piano", themeColor: "#C5CBE3" },
      { id: "ed4", label: "과거의 내 선택이 자꾸 후회되고 원망스러워", jamendoSafeTag: "emotional", themeColor: "#8D9EAE" },
      { id: "ed5", label: "믿었던 사람에게 실망해서 마음이 닫혔어", jamendoSafeTag: "sad", themeColor: "#D1D3E0" },
      { id: "ed6", label: "계획했던 일이 무너져서 상실감이 들어", jamendoSafeTag: "piano", themeColor: "#A8B2C1" }
    ]
  },
  {
    id: "mental_overload",
    title: "과부하 & 관계 갈등 🌪️",
    jamendoTags: ["chillout", "downtempo", "ambient"],
    subSituations: [
      { id: "mo1", label: "해야 할 일이 너무 많아 머리가 터질 것 같아", jamendoSafeTag: "downtempo", themeColor: "#FFB347" },
      { id: "mo2", label: "직장/학교 사람들과의 감정 소모가 너무 심해", jamendoSafeTag: "chillout", themeColor: "#F49AC2" },
      { id: "mo3", label: "타인의 시선을 너무 의식해서 내 모습을 잃은 기분", jamendoSafeTag: "ambient", themeColor: "#E0BBE4" },
      { id: "mo4", label: "가까운 사람의 지나친 간섭 때문에 답답해", jamendoSafeTag: "chillout", themeColor: "#F0A6CA" },
      { id: "mo5", label: "정보가 너무 쏟아져서 뇌가 정지된 느낌이야", jamendoSafeTag: "ambient", themeColor: "#D7B9D5" },
      { id: "mo6", label: "여러 의견 사이에서 결정을 내리지 못해 괴로워", jamendoSafeTag: "downtempo", themeColor: "#FFDFD3" }
    ]
  },
  {
    id: "depleted_tired",
    title: "에너지 고갈 & 지침 🔋",
    jamendoTags: ["meditation", "relaxation", "ambient"],
    subSituations: [
      { id: "dt1", label: "충분히 잤는데도 온몸이 물먹은 솜처럼 무거워", jamendoSafeTag: "relaxation", themeColor: "#C1E1C1" },
      { id: "dt2", label: "번아웃이 온 것처럼 아무것도 하기 싫어", jamendoSafeTag: "meditation", themeColor: "#E8E5A7" },
      { id: "dt3", label: "바쁘게 달렸는데 결과가 없어서 허무해", jamendoSafeTag: "ambient", themeColor: "#D4E09B" },
      { id: "dt4", label: "매일 똑같이 반복되는 일상에 지쳐버렸어", jamendoSafeTag: "relaxation", themeColor: "#F6E8B1" },
      { id: "dt5", label: "감정을 숨기고 억지로 웃느라 너무 피곤해", jamendoSafeTag: "meditation", themeColor: "#E3CAA5" },
      { id: "dt6", label: "쉬고 있어도 불안해서 온전히 쉬지 못하겠어", jamendoSafeTag: "ambient", themeColor: "#F0E1B9" }
    ]
  },
  {
    id: "quiet_neutral",
    title: "잔잔함 & 고독 🌙",
    jamendoTags: ["ambient", "piano", "instrumental"],
    subSituations: [
      { id: "qn1", label: "비 오는 창밖을 보며 조용히 생각을 정리하고 싶어", jamendoSafeTag: "piano", themeColor: "#E2F0CB" },
      { id: "qn2", label: "새벽에 깨어 혼자만의 고독을 즐기고 있어", jamendoSafeTag: "ambient", themeColor: "#D3D9DF" },
      { id: "qn3", label: "크게 슬프지도 기쁘지도 않은 무미건조한 상태야", jamendoSafeTag: "instrumental", themeColor: "#F4F1DE" },
      { id: "qn4", label: "방안에 누워 천장만 멍하니 바라보고 있어", jamendoSafeTag: "ambient", themeColor: "#DFE7FD" },
      { id: "qn5", label: "오랜만에 혼자 있는 시간이 생겨서 차분해져", jamendoSafeTag: "piano", themeColor: "#EADEDB" },
      { id: "qn6", label: "누구와도 말 섞지 않고 묵언수행하고 싶은 날", jamendoSafeTag: "instrumental", themeColor: "#F1E6DA" }
    ]
  },
  {
    id: "energy_focus",
    title: "활력 & 성취 🔥",
    jamendoTags: ["upbeat", "electronic", "groove"],
    subSituations: [
      { id: "ef1", label: "어려운 과제를 드디어 끝내서 성취감이 솟아올라", jamendoSafeTag: "upbeat", themeColor: "#FF9AA2" },
      { id: "ef2", label: "운동을 마치고 아드레날린이 핑 도는 상쾌함", jamendoSafeTag: "electronic", themeColor: "#A0E8AF" },
      { id: "ef3", label: "새로운 목표가 생겨서 의욕이 불타오르고 있어", jamendoSafeTag: "groove", themeColor: "#FFDAC1" },
      { id: "ef4", label: "칭찬을 듣고 기분이 좋아져서 날아갈 것 같아", jamendoSafeTag: "upbeat", themeColor: "#FFB7B2" },
      { id: "ef5", label: "오랫동안 원하던 것을 얻어서 세상을 다 가진 기분", jamendoSafeTag: "electronic", themeColor: "#E2F0CB" },
      { id: "ef6", label: "중요한 일을 앞두고 극도의 집중력이 필요해", jamendoSafeTag: "groove", themeColor: "#F4D160" }
    ]
  }
];
