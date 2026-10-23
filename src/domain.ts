export interface TrackView {
  id: number; title: string; model: string; price: string; genre: string;
  status: "pass" | "warn" | "hold" | "checking"; plays: string; contributors: number | null;
  date: string; similarity?: number; note?: string; listing?: any; raw: any;
}
export function trackView(track: any, listing?: any): TrackView {
  const v = track.verifications?.[0] ?? track.verification;
  const verdict = v?.duplicate ? "BLOCK" : v?.evidence?.decision ?? v?.riskStatus;
  const status = !v || v.status === "PENDING" ? "checking" : verdict === "PASS" ? "pass" : verdict === "WARN" ? "warn" : "hold";
  const score = v?.evidence?.similarityScore ?? v?.riskScore;
  return { id: track.id, title: track.title, model: v?.modelVersion || "미검증", price: listing ? `${listing.price} ${listing.currency}` : "미판매", genre: "미분류", status,
    plays: "—", contributors: Array.isArray(track.contributions) ? new Set(track.contributions.map((x: any) => x.userId)).size : null,
    date: track.createdAt?.slice(0, 10) || "—", similarity: score == null || verdict === "BLOCK" ? undefined : Number(score) * 100,
    note: v?.duplicate ? "동일 지문 감지" : v?.evidence?.reviewRequired ? "검토가 필요한 음원입니다" : undefined, listing, raw: track };
}
export function creatorRows(userId: number, prompt: number, voice: number, voiceUser: string) {
  if (![prompt, voice].every(Number.isInteger) || prompt < 0 || voice < 0 || prompt + voice > 100) throw new Error("기여도는 정수이며 합계가 100이어야 합니다.");
  if (voice > 0 && (!/^[1-9]\d*$/.test(voiceUser) || !Number.isSafeInteger(Number(voiceUser)))) throw new Error("보이스 제공자의 가입 사용자 ID를 입력해 주세요.");
  return [{ userId, role: "PROMPT", percentage: prompt }, { userId, role: "EDIT", percentage: 100 - prompt - voice }, ...(voice ? [{ userId: Number(voiceUser), role: "VOCAL", percentage: voice }] : [])].filter(x => x.percentage > 0);
}
