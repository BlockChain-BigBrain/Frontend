import { useEffect, useState } from "react"
import ChainResultPanel from "../chain-result/ChainResultPanel"
import Badge from "../../shared/components/Badge"
import Waveform from "../../shared/components/Waveform"
import type { ChainResult } from "../../shared/types/domain"
import { NETWORK } from "../../shared/config/network"

type UploadStage = "idle" | "ai_checking" | "ai_pass" | "ai_fail" | "signing" | "done"

// ─── AI Checking View ───────────────────────────────────────────────────────────
function AICheckingView({
  fileName,
  failMode,
  onDone,
}: {
  fileName: string
  failMode: boolean
  onDone: (r: "pass" | "fail") => void
}) {
  const [checkStep, setCheckStep] = useState(0)
  const [compareCount, setCompareCount] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setCheckStep(1), 500)
    const t2 = setTimeout(() => setCheckStep(2), 1400)
    const t3 = setTimeout(() => setCheckStep(3), 2500)
    const tCount = setTimeout(() => {
      let c = 0
      const iv = setInterval(() => {
        c = Math.min(c + 52, 1247)
        setCompareCount(c)
        if (c >= 1247) clearInterval(iv)
      }, 80)
    }, 2300)
    const t4 = setTimeout(() => onDone(failMode ? "fail" : "pass"), 4200)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(tCount)
      clearTimeout(t4)
    }
  }, [])

  const steps = [
    {
      label: "오디오 특징 추출",
      sub: "20 MFCC · 128 mel bands · 44.1kHz",
      done: checkStep >= 1,
    },
    {
      label: "LAION-CLAP 임베딩",
      sub: "512-dim 오디오-텍스트 벡터 생성",
      done: checkStep >= 2,
    },
    {
      label: "벡터 DB 코사인 유사도 비교",
      sub: `${compareCount.toLocaleString()} / 1,247건`,
      done: checkStep >= 3,
    },
  ]

  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin mx-auto mb-5"
            style={{ animationDuration: "1s" }}
          ></div>
          <h2 className="text-xl font-bold text-white mb-2">
            AI 유사도 검증 중
          </h2>
          <p className="text-sm text-[#9CA3AF]">
            <span className="font-mono text-blue-400">{fileName}</span> 분석
            중입니다
          </p>
        </div>
        <div className="bg-[#161b22] border border-[#21262d] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#21262d] bg-[#1c2128]">
            <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider font-mono">
              gatekeeper-v2.1 · LAION-CLAP
            </span>
          </div>
          <div className="p-6 space-y-4">
            {steps.map((step, i) => (
              <div key={step.label} className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-1 flex-shrink-0 w-8">
                  <div
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                      step.done
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : checkStep === i
                          ? "border-blue-500/50 bg-blue-500/5"
                          : "border-[#30363d] bg-[#1c2128]"
                    }`}
                  >
                    {step.done ? (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d="M2.5 6.5L5 9L9.5 3.5"
                          stroke="#10b981"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : checkStep === i ? (
                      <div
                        className="w-3 h-3 rounded-full border border-blue-400 border-t-transparent animate-spin"
                        style={{ animationDuration: "0.8s" }}
                      ></div>
                    ) : (
                      <span className="text-[10px] font-mono text-[#484f58]">
                        {i + 1}
                      </span>
                    )}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-px h-4 bg-[#21262d]"></div>
                  )}
                </div>
                <div className="flex-1 pt-1">
                  <div
                    className={`text-sm font-medium transition-colors ${
                      step.done
                        ? "text-white"
                        : checkStep === i
                          ? "text-blue-400"
                          : "text-[#9CA3AF]"
                    }`}
                  >
                    {step.label}
                  </div>
                  <div className="text-xs font-mono text-[#9CA3AF] mt-0.5">
                    {step.sub}
                  </div>
                  {i === 2 && checkStep >= 2 && (
                    <div className="mt-2">
                      <div className="h-1 rounded-full bg-[#30363d] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all"
                          style={{ width: `${(compareCount / 1247) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                {step.done && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex-shrink-0">
                    DONE
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── AI Pass View ────────────────────────────────────────────────────────────────
function AIPassView({
  onSign,
  onReset,
}: {
  onSign: () => void
  onReset: () => void
}) {
  const top3 = [
    { title: "Ambient Drift 01", similarity: 0.08, model: "Udio v2" },
    { title: "Stellar Haze", similarity: 0.05, model: "Suno v4.5" },
    { title: "Crystal Shore", similarity: 0.03, model: "MusicGen" },
  ]
  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="bg-[#161b22] border border-emerald-500/40 rounded-2xl overflow-hidden mb-5">
          <div className="px-6 py-4 bg-emerald-500/5 border-b border-emerald-500/20 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 8.5L6.5 12L13 5"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-emerald-400">
                PASS — 독창성 검증 완료
              </div>
              <div className="text-xs text-[#9CA3AF] font-mono">
                gatekeeper-v2.1 · 2026-01-13 09:21:44 UTC
              </div>
            </div>
            <Badge variant="verified">PASS · 유사도 0.08</Badge>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="flex-1 h-2 rounded-full bg-[#30363d] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: "8%" }}
                  ></div>
                </div>
                <span className="text-xl font-black font-mono text-emerald-400">
                  8%
                </span>
              </div>
              <div className="text-[10px] text-[#9CA3AF] font-mono">
                최고 코사인 유사도 · PASS 구간 · 유사도 리스크 낮음
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-[#9CA3AF] mb-2">
                최근접 Top-3 음원
              </div>
              <div className="space-y-2">
                {top3.map((t, i) => (
                  <div
                    key={t.title}
                    className="flex items-center gap-3 bg-[#1c2128] rounded-lg px-3 py-2 border border-[#30363d]"
                  >
                    <span className="text-[10px] font-mono text-[#9CA3AF] w-3">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <span className="text-xs font-medium text-white">
                        {t.title}
                      </span>
                      <span className="text-[10px] text-[#9CA3AF] font-mono ml-2">
                        {t.model}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 rounded-full bg-[#30363d] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${t.similarity * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-mono text-emerald-400 w-8 text-right">
                        {t.similarity.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onReset}
            className="px-4 py-2.5 rounded-xl bg-[#161b22] border border-[#21262d] hover:border-[#30363d] text-sm text-[#9CA3AF] hover:text-white transition-colors"
          >
            돌아가기
          </button>
          <button
            onClick={onSign}
            className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <span>🦊</span> MetaMask에서 서명 후 Mint →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── AI Fail View ────────────────────────────────────────────────────────────────
function AIFailView({ onReset }: { onReset: () => void }) {
  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="bg-[#161b22] border border-red-500/40 rounded-2xl overflow-hidden mb-5">
          <div className="px-6 py-4 bg-red-500/5 border-b border-red-500/20 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M4 4L12 12M12 4L4 12"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-red-400">
                BLOCK — 동일 지문 감지
              </div>
              <div className="text-xs text-[#9CA3AF] font-mono">
                gatekeeper-v2.1 · 2026-01-13 09:21:44 UTC
              </div>
            </div>
            <Badge variant="danger">BLOCK · 민팅 거부</Badge>
          </div>
          <div className="p-6 space-y-5">
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
              <div className="text-sm font-semibold text-orange-400 mb-1">
                동일 지문 1.00 — 등록된 음원과 일치
              </div>
              <div className="text-xs text-[#9CA3AF]">
                최근접 음원{" "}
                <span className="text-white font-mono">
                  "Solar Wind" (Suno v4.5)
                </span>
                과 동일한 오디오 지문이 확인되어 민팅이 거부되었습니다.
                원작자이거나 사용 허가를 받은 경우 증빙과 함께 이의를 제기할 수
                있습니다.
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-[#9CA3AF] mb-2">
                최근접 Top-3 음원
              </div>
              <div className="space-y-2">
                {[
                  {
                    title: "Solar Wind",
                    similarity: 1,
                    model: "Suno v4.5",
                    flag: true,
                  },
                  {
                    title: "Neon Cascade",
                    similarity: 0.12,
                    model: "Suno v4.5",
                    flag: false,
                  },
                  {
                    title: "Cosmic Drift",
                    similarity: 0.08,
                    model: "Udio v2",
                    flag: false,
                  },
                ].map((t, i) => (
                  <div
                    key={t.title}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 border ${
                      t.flag
                        ? "bg-red-500/5 border-red-500/30"
                        : "bg-[#1c2128] border-[#30363d]"
                    }`}
                  >
                    <span className="text-[10px] font-mono text-[#9CA3AF] w-3">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <span
                        className={`text-xs font-medium ${
                          t.flag ? "text-red-400" : "text-white"
                        }`}
                      >
                        {t.title}
                      </span>
                      <span className="text-[10px] text-[#9CA3AF] font-mono ml-2">
                        {t.model}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 rounded-full bg-[#30363d] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${t.similarity * 100}%`,
                            background: t.flag ? "#ef4444" : "#10b981",
                          }}
                        ></div>
                      </div>
                      <span
                        className={`text-xs font-mono w-8 text-right ${
                          t.flag ? "text-red-400" : "text-emerald-400"
                        }`}
                      >
                        {t.similarity.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-xs text-[#9CA3AF] bg-[#1c2128] border border-[#30363d] rounded-lg p-3">
              <span className="text-amber-400 font-medium">안내:</span> 생성
              기록이나 사용 허가 증빙을 첨부해 이의를 제기할 수 있습니다.
            </div>
          </div>
        </div>
        <button
          onClick={onReset}
          className="w-full py-2.5 rounded-xl bg-[#161b22] border border-[#21262d] hover:border-[#30363d] text-sm text-white font-medium transition-colors"
        >
          이의 제기 또는 다시 업로드
        </button>
      </div>
    </div>
  )
}

// ─── Upload Screen ──────────────────────────────────────────────────────────────
export default function UploadScreen({ chainResult }: { chainResult: ChainResult }) {
  const [stage, setStage] = useState<UploadStage>("idle")
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState("")
  const [prompt, setPrompt] = useState(
    "Pulsing neon synth with driving 4/4 beat, hypnotic arpeggios, and late-night Tokyo cityscape vibes for a commercial trailer",
  )
  const [platform, setPlatform] = useState("Suno v4.5")
  const [promptWeight, setPromptWeight] = useState(70)
  const [voiceWeight, setVoiceWeight] = useState(20)
  const [voiceAddress, setVoiceAddress] = useState("")
  const [voiceInvited, setVoiceInvited] = useState(false)
  const [voiceSigned, setVoiceSigned] = useState(false)
  const [projectFile, setProjectFile] = useState("")
  const [failDemo, setFailDemo] = useState(false)

  const editWeight = 100 - promptWeight - voiceWeight

  const handleInvite = () => {
    setVoiceInvited(true)
    setTimeout(() => setVoiceSigned(true), 4000)
  }

  const handleAIDone = (result: "pass" | "fail") =>
    setStage(result === "pass" ? "ai_pass" : "ai_fail")

  const handleSign = () => {
    setStage("signing")
    setTimeout(() => setStage("done"), 2200)
  }

  const handleReset = () => {
    setStage("idle")
    setFileName("")
    setVoiceInvited(false)
    setVoiceSigned(false)
    setVoiceAddress("")
    setFailDemo(false)
  }

  if (stage === "ai_checking")
    return (
      <AICheckingView
        fileName={fileName}
        failMode={failDemo}
        onDone={handleAIDone}
      />
    )
  if (stage === "ai_pass")
    return <AIPassView onSign={handleSign} onReset={() => setStage("idle")} />
  if (stage === "ai_fail") return <AIFailView onReset={handleReset} />

  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-7">
          <h2 className="text-xl font-bold text-white mb-1">
            음원 업로드 & AI 검증
          </h2>
          <p className="text-sm text-[#9CA3AF]">
            AI 유사도 분석 후 블록체인에 창작 이력을 영구 기록합니다
          </p>
        </div>
        <div className="flex items-center mb-8">
          {["파일 업로드", "AI 유사도 검증", "온체인 Mint"].map((step, i) => (
            <div key={step} className="flex items-center flex-1">
              {i > 0 && <div className="flex-1 h-px bg-[#21262d]"></div>}
              <div className="flex items-center gap-2 px-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0
                      ? "bg-blue-500 text-white"
                      : "bg-[#21262d] text-[#484f58]"
                  }`}
                >
                  {i + 1}
                </div>
                <span
                  className={`text-xs font-medium ${
                    i === 0 ? "text-white" : "text-[#484f58]"
                  }`}
                >
                  {step}
                </span>
              </div>
              {i < 2 && <div className="flex-1 h-px bg-[#21262d]"></div>}
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              const f = e.dataTransfer.files[0]
              if (f) setFileName(f.name)
            }}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              dragging
                ? "border-blue-500 bg-blue-500/5"
                : fileName
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : "border-[#30363d] hover:border-[#484f58]"
            }`}
            onClick={() => !fileName && setFileName("neon_cascade_v3.wav")}
          >
            {fileName ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path
                      d="M9 12V4M5 8L9 4L13 8"
                      stroke="#10b981"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M3 14h12"
                      stroke="#10b981"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-emerald-400">
                    {fileName}
                  </div>
                  <div className="text-xs text-[#9CA3AF] font-mono mt-0.5">
                    44.1kHz · 16-bit · WAV · 4.2MB · 3:42
                  </div>
                </div>
                <Waveform seed={42} color="#10b981" />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setFileName("")
                  }}
                  className="text-xs text-[#9CA3AF] hover:text-white underline"
                >
                  파일 제거
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#1c2128] border border-[#30363d] flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M10 13V5M6 9L10 5L14 9"
                      stroke="#9CA3AF"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M3 15h14"
                      stroke="#9CA3AF"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-[#e6edf3]">
                    WAV, MP3 파일을 업로드하세요
                  </div>
                  <div className="text-xs text-[#9CA3AF] mt-1">
                    드래그 & 드롭 또는 클릭하여 선택 · 최대 100MB
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5 space-y-5">
            <h3 className="text-sm font-semibold text-white">
              창작 이력 (온체인 기록)
            </h3>
            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">
                사용된 프롬프트 <span className="text-blue-400">*</span>
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg bg-[#1c2128] border border-[#30363d] text-sm text-white placeholder-[#484f58] focus:outline-none focus:border-blue-500 resize-none font-mono text-xs leading-relaxed transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">
                  AI 플랫폼
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#1c2128] border border-[#30363d] text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  {[
                    "Suno v4.5",
                    "Suno",
                    "Udio v2",
                    "Stable Audio 2.0",
                    "MusicGen",
                  ].map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">
                  라이선스 유형
                </label>
                <select className="w-full px-3 py-2.5 rounded-lg bg-[#1c2128] border border-[#30363d] text-sm text-white focus:outline-none focus:border-blue-500 transition-colors">
                  <option>Standard BGM</option>
                  <option>Exclusive</option>
                  <option>Creative Commons</option>
                </select>
              </div>
            </div>

            {/* Contributor split */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-medium text-[#9CA3AF]">
                  기여도 설정 (수익 분배 비율)
                </label>
                <span className="text-xs font-mono font-semibold text-emerald-400">
                  합계: 100% ✓
                </span>
              </div>
              <div className="space-y-3">
                {[
                  {
                    label: "프롬프트 엔지니어",
                    value: promptWeight,
                    onChange: (v: number) =>
                      setPromptWeight(Math.min(v, 100 - voiceWeight)),
                    color: "#2f80ed",
                  },
                  {
                    label: "보이스 제공자",
                    value: voiceWeight,
                    onChange: (v: number) =>
                      setVoiceWeight(Math.min(v, 100 - promptWeight)),
                    color: "#7c3aed",
                  },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-3">
                    <span className="text-xs text-[#e6edf3] w-32">
                      {s.label}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={s.value}
                      onChange={(e) => s.onChange(+e.target.value)}
                      className="flex-1 accent-blue-500"
                    />
                    <span
                      className="text-xs font-mono w-8 text-right"
                      style={{ color: s.color }}
                    >
                      {s.value}%
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#e6edf3] w-32">
                    편집 기여자
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-[#30363d]">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${editWeight}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 w-8 text-right">
                    {editWeight}%
                  </span>
                </div>
              </div>
            </div>

            {/* Voice contributor invite */}
            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">
                보이스 제공자 지갑 / 이메일 초대
              </label>
              <div className="flex gap-2">
                <input
                  value={voiceAddress}
                  onChange={(e) => setVoiceAddress(e.target.value)}
                  placeholder="0x... 또는 이메일 주소"
                  className="flex-1 px-3 py-2 rounded-lg bg-[#1c2128] border border-[#30363d] text-sm text-white placeholder-[#9CA3AF] focus:outline-none focus:border-blue-500 font-mono text-xs transition-colors"
                />
                <button
                  onClick={handleInvite}
                  disabled={!voiceAddress || voiceInvited}
                  className="px-3 py-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  합의 서명 초대
                </button>
              </div>
              {voiceInvited && (
                <div
                  className={`mt-2 flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg border transition-all ${
                    voiceSigned
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                      : "bg-amber-500/5 border-amber-500/20 text-amber-400"
                  }`}
                >
                  {voiceSigned
                    ? "✓ 서명 완료 — 보이스 제공자가 기여도에 동의했습니다"
                    : "⏳ 서명 대기 중 — 상대방의 합의 서명을 기다리고 있습니다"}
                </div>
              )}
            </div>

            {/* Smart contract deploy notice */}
            <p className="text-[10px] leading-relaxed text-[#6B7280] border-l-2 border-purple-500/30 pl-2.5 -mt-1">
              💡 모든 기여자의 지갑 서명(동의)이 완료되어야 스마트 컨트랙트가
              배포됩니다.
            </p>

            {/* Optional project file */}
            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">
                프로젝트 파일{" "}
                <span className="text-[#9CA3AF] font-normal">
                  (선택) — DAW 세션, 작업 로그
                </span>
              </label>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border border-dashed cursor-pointer transition-colors ${
                  projectFile
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-[#30363d] hover:border-[#484f58]"
                }`}
                onClick={() =>
                  !projectFile && setProjectFile("neon_cascade_project.als")
                }
              >
                {projectFile ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect
                        x="2"
                        y="1"
                        width="10"
                        height="12"
                        rx="1.5"
                        stroke="#10b981"
                        strokeWidth="1.2"
                      />
                      <path
                        d="M4 5h6M4 7.5h4"
                        stroke="#10b981"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="text-xs font-mono text-emerald-400 flex-1">
                      {projectFile}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setProjectFile("")
                      }}
                      className="text-[10px] text-[#9CA3AF] hover:text-white"
                    >
                      제거
                    </button>
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect
                        x="2"
                        y="1"
                        width="10"
                        height="12"
                        rx="1.5"
                        stroke="#9CA3AF"
                        strokeWidth="1.2"
                      />
                      <path
                        d="M7 4v6M4 7h6"
                        stroke="#9CA3AF"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="text-xs text-[#9CA3AF]">
                      .als, .flp, .logic, .zip 파일 업로드
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Verification pipeline preview */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  검증·민팅 파이프라인
                </h3>
                <p className="text-[10px] text-[#9CA3AF] mt-0.5">
                  제출 후 단계별 상태와 온체인 확정을 실시간으로 확인합니다.
                </p>
              </div>
              <div className="flex rounded-lg border border-[#30363d] p-0.5 text-[10px]">
                {["정상 샘플", "변형 샘플", "중복 샘플", "서명 위조"].map(
                  (item, i) => (
                    <button
                      key={item}
                      className={`px-2 py-1 rounded ${
                        i === 0 ? "bg-blue-500 text-white" : "text-[#9CA3AF]"
                      }`}
                    >
                      {item}
                    </button>
                  ),
                )}
              </div>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {[
                "업로드",
                "L1 핑거프린트",
                "L2 CLAP",
                "EIP-712 서명",
                "컨트랙트 검증",
                "민팅 · IPFS",
              ].map((item, i) => (
                <div
                  key={item}
                  className="relative rounded-lg border border-[#30363d] bg-[#1c2128] p-2.5 min-h-[78px]"
                >
                  <span className="text-[9px] font-mono text-blue-400">
                    0{i + 1}
                  </span>
                  <div className="text-[10px] font-medium text-white mt-1">
                    {item}
                  </div>
                  <div className="text-[9px] text-[#6B7280] mt-2">
                    대기 · -- ms
                  </div>
                </div>
              ))}
            </div>
            <details className="mt-3 rounded-lg border border-[#30363d] bg-[#1c2128] px-3 py-2">
              <summary className="cursor-pointer text-[10px] text-[#9CA3AF]">
                서명 Payload 미리보기
              </summary>
              <div className="grid grid-cols-2 gap-1 mt-2 text-[9px] font-mono text-[#6B7280]">
                <span>signer: 0x3a7f...c4d2</span>
                <span>audioHash: 업로드 후 생성</span>
                <span>score / zone: 분석 후 생성</span>
                <span>nonce: 004892</span>
              </div>
            </details>
            <p className="text-[10px] text-[#6B7280] mt-3">
              서명 확인은 검증 서버가 낸 판정이라는 의미이며 판정의 정확도를
              보증하지 않습니다.
            </p>
          </div>

          {/* Creation history and rights */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">
              창작 이력 및 권리 확인
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-[#9CA3AF]">
                생성 서비스
                <select className="mt-1.5 w-full px-3 py-2 rounded-lg bg-[#1c2128] border border-[#30363d] text-white">
                  <option>Suno</option>
                  <option>Udio</option>
                  <option>Stable Audio</option>
                  <option>기타</option>
                </select>
              </label>
              <label className="text-xs text-[#9CA3AF]">
                이용 플랜
                <select className="mt-1.5 w-full px-3 py-2 rounded-lg bg-[#1c2128] border border-[#30363d] text-white">
                  <option>유료</option>
                  <option>무료</option>
                </select>
              </label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                "공식 다운로드 경로로 받은 곡입니다",
                "Remix 기능으로 만든 곡이 아닙니다",
                "상업적 이용이 허용된 플랜입니다",
              ].map((label) => (
                <label
                  key={label}
                  className="flex gap-2 rounded-lg border border-[#30363d] p-2.5 text-[10px] text-[#9CA3AF]"
                >
                  <input
                    type="checkbox"
                    className="accent-blue-500"
                    defaultChecked
                  />
                  {label}
                </label>
              ))}
            </div>
            <div className="rounded-lg border border-dashed border-[#30363d] px-3 py-2.5 text-xs text-[#9CA3AF]">
              창작 이력 파일 (프롬프트·작업 로그, 선택) · 클릭하여 업로드
            </div>
            <p className="text-[10px] leading-relaxed text-[#6B7280]">
              프롬프트·로그 해시는 그 시점에 파일이 존재했음을 증명하며 창작자
              여부까지 보증하지 않습니다. 정산 비율은 AI가 측정한 값이 아니라
              공동 작업자가 합의하고 서명한 비율입니다.
            </p>
          </div>

          {/* Fail demo toggle */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="#f59e0b" strokeWidth="1.2" />
              <path
                d="M7 4v3.5M7 9.5v.5"
                stroke="#f59e0b"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-xs text-amber-400 flex-1">
              데모 시뮬레이션: 동일 지문 BLOCK 케이스 보기
            </span>
            <button
              onClick={() => setFailDemo(!failDemo)}
              className={`relative w-9 h-5 rounded-full transition-colors ${
                failDemo ? "bg-red-500" : "bg-[#30363d]"
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                  failDemo ? "left-4" : "left-0.5"
                }`}
              ></div>
            </button>
          </div>

          <button
            onClick={() => setStage("ai_checking")}
            disabled={!fileName}
            className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
          >
            {failDemo
              ? "AI 검증 시작 (동일 지문 BLOCK 시뮬레이션)"
              : "AI 검증 후 온체인 Mint"}
          </button>
        </div>
      </div>

      {stage === "signing" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8 w-[380px] text-center">
            <div className="w-14 h-14 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-4 text-2xl">
              🦊
            </div>
            <h3 className="text-base font-semibold text-white mb-2">
              MetaMask 서명 대기 중
            </h3>
            <p className="text-sm text-[#9CA3AF]">
              지갑에서 트랜잭션을 승인하면 음원이 {NETWORK.name}에 영구
              기록됩니다.
            </p>
          </div>
        </div>
      )}

      {stage === "done" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="max-h-[88vh] w-[700px] overflow-y-auto rounded-2xl border border-[#30363d] bg-[#161b22] p-6 shadow-2xl">
            <div
              className={`w-14 h-14 rounded-full border flex items-center justify-center mx-auto mb-4 ${
                chainResult.mintStatus === "rejected"
                  ? "bg-red-500/10 border-red-500/20"
                  : chainResult.isHold
                    ? "bg-amber-500/10 border-amber-500/20"
                    : "bg-emerald-500/10 border-emerald-500/20"
              }`}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 13L9 17L19 7"
                  stroke={
                    chainResult.mintStatus === "rejected"
                      ? "#ef4444"
                      : chainResult.isHold
                        ? "#f59e0b"
                        : "#10b981"
                  }
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="mb-5 text-center">
              <h3 className="text-base font-semibold text-white">
                {chainResult.mintStatus === "rejected"
                  ? "음원 등록 실패"
                  : chainResult.isHold
                    ? "등록 완료 (정산 대기 중)"
                    : "음원 등록 완료"}
              </h3>
              <p className="mt-1 text-sm text-[#9CA3AF]">
                {NETWORK.name} ERC-1155 민팅 상태를 확인하세요.
              </p>
            </div>
            <ChainResultPanel result={chainResult} />
            <button
              onClick={handleReset}
              className="mt-5 w-full py-2.5 rounded-xl bg-[#1c2128] hover:bg-[#21262d] border border-[#30363d] text-white text-sm font-medium transition-colors"
            >
              새 음원 업로드
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
