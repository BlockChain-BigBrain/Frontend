export interface TrackData {
  id: number
  title: string
  model: string
  price: number
  genre?: string
  status: "pass" | "warn" | "hold" | "checking"
  plays?: string
  contributors: number
  date: string
  similarity: number
  note?: string
}

export const tracks: TrackData[] = [
  {
    id: 1,
    title: "Neon Cascade",
    model: "Suno v4.5",
    price: 50,
    genre: "Electronic",
    status: "pass",
    plays: "2.4k",
    contributors: 2,
    date: "2025-11-03",
    similarity: 0.31,
  },
  {
    id: 2,
    title: "Ambient Drift 01",
    model: "Udio v2",
    price: 30,
    genre: "Ambient",
    status: "pass",
    plays: "1.8k",
    contributors: 1,
    date: "2025-10-14",
    similarity: 0.24,
  },
  {
    id: 3,
    title: "Lo-Fi Morning",
    model: "Suno v4.5",
    price: 80,
    genre: "Lo-Fi",
    status: "pass",
    plays: "5.1k",
    contributors: 2,
    date: "2025-09-22",
    similarity: 0.42,
  },
  {
    id: 4,
    title: "Synthetic Pulse",
    model: "Stable Audio 2.0",
    price: 60,
    genre: "Techno",
    status: "checking",
    contributors: 1,
    date: "2026-01-05",
    similarity: 0,
  },
  {
    id: 5,
    title: "Void Echoes",
    model: "Udio v2",
    price: 40,
    genre: "Dark Ambient",
    status: "warn",
    plays: "920",
    contributors: 3,
    date: "2025-12-08",
    similarity: 0.84,
    note: "구매 전 유사도 리스크를 확인하세요",
  },
  {
    id: 6,
    title: "Solar Wind",
    model: "Suno v4.5",
    price: 120,
    genre: "Cinematic",
    status: "hold",
    contributors: 2,
    date: "2026-01-11",
    similarity: 0.93,
    note: "'Orion Drift'와 음향적으로 유사합니다. 정산이 보류되어 검토 중입니다.",
  },
]
