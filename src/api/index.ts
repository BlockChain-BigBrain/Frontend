import { createAuthClient } from "../auth";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

export const auth = createAuthClient(BASE_URL, fetch, `${import.meta.env.BASE_URL}?login=success`);

export interface TrackData {
  id: number;
  title: string;
  model: string;
  price: string;
  genre: string;
  status: "verified" | "pending" | "rejected";
  plays: string;
  contributors: number;
  date: string;
  similarity?: number;
  rejectReason?: string;
}

export async function fetchTracks(): Promise<TrackData[]> {
  const response = await fetch(`${BASE_URL}/api/tracks`);
  if (!response.ok) throw new Error(`트랙 목록을 불러오지 못했습니다. (${response.status})`);
  const data: unknown = await response.json();
  if (!Array.isArray(data)) throw new Error("트랙 목록 응답 형식이 올바르지 않습니다.");
  return data as TrackData[];
}

export async function uploadTrackApi(formData: FormData) {
  const response = await auth.apiFetch("/api/tracks", {
    method: "POST",
    body: formData,
  });
  if (!response.ok) throw new Error(`트랙 업로드에 실패했습니다. (${response.status})`);
  return await response.json();
}

export async function inviteVoiceContributor(address: string) {
  const response = await fetch(`${BASE_URL}/api/invitations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });
  if (!response.ok) throw new Error(`보이스 제공자 초대에 실패했습니다. (${response.status})`);
  return await response.json();
}