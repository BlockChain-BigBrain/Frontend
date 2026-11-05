import { auth } from "../../api"
import { AuthError } from "../../auth"
import { api, sendTransaction, savePending, readPending, confirmPending, connectWallet } from "../../api/service"
import { useEffect, useRef, useState } from "react"
import Badge from "../../shared/components/Badge"
import Waveform from "../../shared/components/Waveform"
import { NETWORK } from "../../shared/config/network"
import { switchToHardhat } from "../../wallet"
import VerificationNotice from "../verification/VerificationNotice"
import { latestVerification, verificationPolicy, missingText } from "../verification/policy"
import { readRegistration, prepareRegistration, registrationPacket, type RegistrationState } from "../verification/registration"

type UploadStage = "idle" | "signing"

// ─── Upload Screen ──────────────────────────────────────────────────────────────
export default function UploadScreen() {
  const [stage, setStage] = useState<UploadStage>("idle")
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState("")
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const audioInput = useRef<HTMLInputElement>(null)
  const uploadLock = useRef(false)
  const [title, setTitle] = useState("")
  const [workLog, setWorkLog] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [uploadedId, setUploadedId] = useState<number | null>(null)
  const [verificationBusy, setVerificationBusy] = useState(false)
  const [verificationMessage, setVerificationMessage] = useState("")
  const [verificationError, setVerificationError] = useState("")
  const [currentTrack, setCurrentTrack] = useState<any>(null)
  const [readiness, setReadiness] = useState<RegistrationState | null>(null)
  const [preparing, setPreparing] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const selectionVersion = useRef(0)
  const readinessVersion = useRef(0)
  const verificationLock = useRef(false)
  const preparationLock = useRef(false)
  const currentVerification = latestVerification(currentTrack?.verifications, uploadedId ?? undefined)
  const policy = verificationPolicy(currentVerification)
  const canPrepare = policy.eligible && !!currentTrack?.contributionsFinalizedAt && currentTrack?.registrationStatus !== 'REGISTERED'
  function invalidateVerification() {
    selectionVersion.current++; readinessVersion.current++
    setCurrentTrack(null); setReadiness(null)
    setVerificationMessage(""); setVerificationError("")
    setRegistrationTxHash(null); setRegistrationInfo(""); setRegistrationError("")
    setInvitations([]); setInviteInfo(""); setInviteError("")
  }
  async function refreshRegistration(id: number, version = selectionVersion.current) {
    const request = ++readinessVersion.current
    const state = await readRegistration(id)
    if (version === selectionVersion.current && request === readinessVersion.current) { setCurrentTrack(state.track); setReadiness(state) }
    return state
  }
  async function handleRealVerification() {
    if (!uploadedId || verificationLock.current || preparing || registrationBusy) return
    const id = uploadedId, version = selectionVersion.current
    verificationLock.current = true; readinessVersion.current++
    setVerificationBusy(true); setReadiness(null)
    setVerificationError(""); setCurrentTrack(null)
    setVerificationMessage("기여도 확정 상태를 확인하는 중…")
    try {
      const track = await api(`/api/tracks/${id}`)
      if (version !== selectionVersion.current) return
      if (!track.contributionsFinalizedAt) await api(`/api/tracks/${id}/contributors/finalize`, {})
      if (version !== selectionVersion.current) return
      setVerificationMessage("실제 AI 서버에서 음원을 검증하는 중…")
      const latest = await api(`/api/tracks/${id}`)
      if (version !== selectionVersion.current) return
      const verified = latest.verifications?.some((v: { status: string }) => v.status === "VERIFIED")
      const result = await api(`/api/tracks/${id}/${verified ? "reverify" : "verify"}`, {})
      if (version !== selectionVersion.current) return
      setCurrentTrack({ ...latest, verifications: [result, ...(latest.verifications || [])] })
      setVerificationMessage("")
      if (verificationPolicy(result).eligible) {
        try { await refreshRegistration(id, version) }
        catch (error) { if (version === selectionVersion.current) setRegistrationError(`등록 조건 확인 실패. ${error instanceof Error ? error.message : "잠시 후 새로고침해 주세요."}`) }
      }
    } catch (error) {
      if (version !== selectionVersion.current) return
      setReadiness(null); setVerificationMessage("")
      setVerificationError(`AI 검증 실패 · 재시도 필요. ${error instanceof Error ? error.message : "기여도 확정 또는 AI 검증에 실패했습니다."}`)
    } finally { verificationLock.current = false; setVerificationBusy(false) }
  }
  async function handlePrepare() {
    if (!uploadedId || !canPrepare || preparationLock.current) return
    const id = uploadedId, version = selectionVersion.current
    preparationLock.current = true; readinessVersion.current++; setPreparing(true); setReadiness(null); setRegistrationError("")
    try {
      await prepareRegistration(id, api, () => version === selectionVersion.current)
      if (version !== selectionVersion.current) return
      await refreshRegistration(id, version)
      if (version === selectionVersion.current) setRegistrationInfo("IPFS 업로드와 등록 준비 상태를 확인했습니다. 지갑·네트워크 조건 충족 후 MetaMask에서 등록해 주세요.")
    } catch (error) {
      if (version === selectionVersion.current) setRegistrationError(error instanceof Error ? error.message : "등록 준비에 실패했습니다.")
    } finally { preparationLock.current = false; setPreparing(false) }
  }
  async function handleRefresh(connect = false, switchNetwork = false) {
    if (!uploadedId || refreshing) return
    const version = selectionVersion.current, id = uploadedId
    readinessVersion.current++; setRefreshing(true); setReadiness(null); setRegistrationError("")
    try {
      if (switchNetwork) await switchToHardhat()
      if (connect) await connectWallet()
      if (version === selectionVersion.current) await refreshRegistration(id, version)
    } catch (error) { if (version === selectionVersion.current) setRegistrationError(error instanceof Error ? error.message : "등록 조건을 확인하지 못했습니다.") }
    finally { setRefreshing(false) }
  }
  useEffect(() => () => { selectionVersion.current++; readinessVersion.current++ }, [])
  useEffect(() => {
    const provider = (window as any).ethereum
    const changed = () => { setReadiness(null); if (uploadedId) void handleRefresh() }
    provider?.on?.('accountsChanged', changed); provider?.on?.('chainChanged', changed)
    return () => { provider?.removeListener?.('accountsChanged', changed); provider?.removeListener?.('chainChanged', changed) }
  }, [uploadedId])

  const [registrationBusy, setRegistrationBusy] = useState(false)
  const [registrationError, setRegistrationError] = useState("")
  const [registrationInfo, setRegistrationInfo] = useState("")
  const [registrationTxHash, setRegistrationTxHash] = useState<string | null>(null)
  const registrationLock = useRef(false)
  function selectAudio(file: File | undefined) {
    if (!file || uploadLock.current) return
    invalidateVerification()
    setUploadedId(null)
    setRegistrationTxHash(null)
    setRegistrationInfo("")
    setRegistrationError("")
    if (!/\.(mp3|wav|webm)$/i.test(file.name) || file.size > 100 * 1024 * 1024 || file.size === 0) {
      setUploadError("100MB 이하의 비어 있지 않은 MP3, WAV 또는 WebM 파일을 선택해 주세요.")
      return
    }
    setAudioFile(file)
    setFileName(file.name)
    setTitle(file.name.replace(/\.[^.]+$/, ""))
    setUploadError("")
  }
  async function handleUpload() {
    if (uploadLock.current) return
    if (!audioFile || !title.trim()) { setUploadError("음원 파일과 제목을 입력해 주세요."); return }
    if (!window.confirm("음원을 비공개 임시 저장할까요? 저장 후 보이스 제공자를 초대할 수 있으며, AI 검증 및 블록체인 등록은 별도로 진행됩니다.")) return
    uploadLock.current = true
    setUploading(true)
    setUploadError("")
    invalidateVerification()
    setUploadedId(null)
    try {
      const currentUser = await auth.me()
      const form = new FormData()
      form.set("audio", audioFile)
      form.set("title", title.trim())
      form.set("prompt", prompt)
      form.set("workLog", workLog)
      form.set("isPublic", "false")
      form.set("contributors", JSON.stringify([
        ...(promptWeight > 0 ? [{ userId: currentUser.id, role: "PROMPT", percentage: promptWeight }] : []),
        ...(editWeight > 0 ? [{ userId: currentUser.id, role: "EDIT", percentage: editWeight }] : []),
      ]))
      const track = await api("/api/tracks", form)
      if (!Number.isInteger(track.id) || track.id <= 0) throw new Error("서버의 업로드 응답을 확인해 주세요.")
      setUploadedId(track.id)
      setCurrentTrack(track)
      setRegistrationTxHash(null)
      setRegistrationInfo("")
      setRegistrationError("")
    } catch (error) {
      setUploadError(error instanceof AuthError ? "먼저 로그인해 주세요." : error instanceof Error ? error.message : "업로드에 실패했습니다.")
    } finally { uploadLock.current = false; setUploading(false) }
  }
  const [prompt, setPrompt] = useState(
    "Pulsing neon synth with driving 4/4 beat, hypnotic arpeggios, and late-night Tokyo cityscape vibes for a commercial trailer",
  )
  const [platform, setPlatform] = useState("Suno v4.5")
  const [promptWeight, setPromptWeight] = useState(70)
  const [voiceWeight, setVoiceWeight] = useState(20)
  const [voiceAddress, setVoiceAddress] = useState("")
  const [voicePercent, setVoicePercent] = useState(20)
  const [invitations, setInvitations] = useState<Array<{ id: number; email?: string | null; walletAddress?: string | null; percentage: string; status: string; delivery?: string }>>([])
  const [inbox, setInbox] = useState<Array<{ id: number; track: { title: string }; percentage: string }>>([])
  const [inviteBusy, setInviteBusy] = useState(false)
  const [inviteError, setInviteError] = useState("")
  const [inviteInfo, setInviteInfo] = useState("")
  const refreshInbox = async () => { try { setInbox(await api("/api/users/me/invitations")) } catch { /* unauthenticated */ } }
  useEffect(() => { void refreshInbox() }, [])
  useEffect(() => { if (uploadedId) void api(`/api/tracks/${uploadedId}/invitations`).then(setInvitations).catch(() => {}) }, [uploadedId])
  const [projectFile, setProjectFile] = useState("")
  

  const editWeight = 100 - promptWeight - voiceWeight

  const handleInvite = async () => {
    if (!uploadedId) { setInviteError("먼저 음원을 임시 업로드해 주세요."); return }
    setInviteBusy(true); setInviteError(""); setInviteInfo("")
    try {
      const address = voiceAddress.trim()
      const payload = address.includes("@")
        ? { email: address, role: "VOCAL", percentage: voicePercent }
        : { walletAddress: address, role: "VOCAL", percentage: voicePercent }
      const created = await api(`/api/tracks/${uploadedId}/invitations`, payload)
      setInvitations(items => [...items, created])
      setVoiceAddress("")
      setInviteInfo(created.delivery === "EMAIL_SUBMITTED" ? "이메일 발송 서비스에 접수되었습니다." : "지갑 초대함에 등록되었습니다. 상대방의 수락을 기다려 주세요.")
    } catch (error) { setInviteError(error instanceof Error ? error.message : "초대 실패") }
    finally { setInviteBusy(false) }
  }
  const respondInvite = async (id: number, action: "accept" | "reject") => {
    try { await api(`/api/invitations/${id}/${action}`, {}); await refreshInbox() }
    catch (error) { setInviteError(error instanceof Error ? error.message : "응답 실패") }
  }

  const handleSign = async () => {
    // Also guard the handler: disabled buttons alone are not a policy boundary.
    if (registrationLock.current || !uploadedId || !policy.eligible || !readiness?.ready || verificationBusy || preparing || refreshing) return
    const id = uploadedId, version = selectionVersion.current
    const isCurrent = () => version === selectionVersion.current
    registrationLock.current = true; setRegistrationBusy(true)
    setRegistrationError(""); setRegistrationInfo("")
    try {
      const packet = await registrationPacket(id, api, isCurrent)
      const user = await auth.me()
      if (!isCurrent()) return
      const endpoint = `/api/tracks/${id}/registration/confirm`
      const pending = readPending(user.id).find(item => item.endpoint === endpoint)
      if (pending) {
        setRegistrationTxHash(pending.hash)
        setRegistrationInfo("기존 트랜잭션을 확인하는 중입니다.")
        await confirmPending(user.id, pending)
      } else {
        setStage("signing")
        const hash = await sendTransaction(packet.transaction)
        setStage("idle")
        const record = { hash, endpoint, body: {}, label: "음원 온체인 등록" }
        savePending(user.id, record)
        if (isCurrent()) { setRegistrationTxHash(hash); setRegistrationInfo("거래가 전송되었습니다. 블록 확인과 DB 반영을 기다리는 중입니다.") }
        await confirmPending(user.id, record)
      }
      if (isCurrent()) { setRegistrationInfo("온체인 등록 및 Backend 확인이 완료되었습니다."); setReadiness(null) }
    } catch (error) {
      if (isCurrent()) {
        setReadiness(null); setRegistrationError(error instanceof Error ? error.message : "등록 중 오류가 발생했습니다.")
        // A newer BLOCK/failure may have arrived since the button was enabled.
        try { await refreshRegistration(id, version) } catch { /* keep registration disabled */ }
      }
    } finally { setStage("idle"); registrationLock.current = false; setRegistrationBusy(false) }
  }

  const handleReset = () => {
    invalidateVerification()
    setStage("idle")
    setUploadedId(null)
    setAudioFile(null)
    setRegistrationTxHash(null)
    setRegistrationInfo("")
    setRegistrationError("")
    setFileName("")
    setInvitations([])
    setInviteInfo("")
    setInviteError("")
    setVoiceAddress("")

  }

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
              selectAudio(f)
            }}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              dragging
                ? "border-blue-500 bg-blue-500/5"
                : fileName
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : "border-[#30363d] hover:border-[#484f58]"
            }`}
            onClick={() => { if (!uploading) audioInput.current?.click() }}
          >
            <input ref={audioInput} type="file" accept=".wav,.mp3,.webm" aria-label="음원 파일" className="hidden" disabled={uploading} onClick={e => e.stopPropagation()} onChange={e => { selectAudio(e.target.files?.[0]); e.target.value = "" }} />
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
                    {audioFile ? `${(audioFile.size / 1024 / 1024).toFixed(2)} MB` : ""}
                  </div>
                </div>
                <Waveform seed={42} color="#10b981" />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (uploading) return
                    invalidateVerification()
                    setFileName("")
                    setAudioFile(null)
                    setUploadedId(null)
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

          {/* Upload metadata */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5 space-y-3">
            <label className="block text-xs text-[#9CA3AF]">음원 제목 *<input aria-label="음원 제목" value={title} onChange={e => { invalidateVerification(); setTitle(e.target.value); setUploadedId(null) }} disabled={uploading} className="mt-2 w-full rounded-lg bg-[#1c2128] border border-[#30363d] p-2 text-white" /></label>
            <label className="block text-xs text-[#9CA3AF]">작업 로그 (선택)<textarea aria-label="작업 로그" value={workLog} onChange={e => setWorkLog(e.target.value)} disabled={uploading} className="mt-2 w-full rounded-lg bg-[#1c2128] border border-[#30363d] p-2 text-white" /></label>
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
                  소유자 {100 - voiceWeight}% · 보이스 초대 예정 {voiceWeight}%
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

            {/* Contributor invitations are real backend requests, never simulated signatures. */}
            <div className="space-y-3">
              <label className="block text-xs font-medium text-[#9CA3AF]">보이스 제공자 지갑 / 이메일 초대 (여러 명 가능)</label>
              <p className="text-xs text-[#9CA3AF]">먼저 음원을 임시 업로드한 후 초대하세요. 초대 수락 전에는 기여도가 확정되지 않습니다.</p>
              <div className="flex flex-wrap gap-2">
                <input value={voiceAddress} onChange={e => setVoiceAddress(e.target.value)}
                  placeholder="0x... 또는 이메일 주소" aria-label="초대 대상"
                  className="flex-1 min-w-[180px] px-3 py-2 rounded-lg bg-[#1c2128] border border-[#30363d] text-xs text-white" />
                <input type="number" min={0.01} max={100} step={0.01} value={voicePercent}
                  onChange={e => setVoicePercent(Number(e.target.value))} aria-label="제공자 기여도 퍼센트"
                  className="w-20 px-2 py-2 rounded-lg bg-[#1c2128] border border-[#30363d] text-xs text-white" />
                <button onClick={() => void handleInvite()} disabled={!voiceAddress.trim() || !uploadedId || inviteBusy}
                  className="px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs disabled:opacity-40">
                  {inviteBusy ? "초대 중…" : "초대 보내기"}
                </button>
              </div>
              {inviteInfo && <p role="status" className="text-xs text-emerald-400">{inviteInfo}</p>}
              {inviteError && <p role="alert" className="text-xs text-red-400">{inviteError}</p>}
              {invitations.reduce((sum, item) => sum + (item.status === "REJECTED" || item.status === "CANCELLED" ? 0 : Number(item.percentage)), 0) > voiceWeight && <p role="alert" className="text-xs text-red-400">보이스 기여도 배분을 초과했습니다.</p>}
              {invitations.map(item => <div key={item.id} className="flex justify-between text-xs text-[#e6edf3] bg-[#1c2128] p-2 rounded">
                <span>{item.email || item.walletAddress} · {item.percentage}%</span>
                <span>{item.status === "ACCEPTED" ? "수락 완료" : item.status === "PENDING" ? "수락 대기" : item.status}</span>
              </div>)}
              {uploadedId && <button className="text-xs text-blue-400 underline" onClick={() => void api(`/api/tracks/${uploadedId}/invitations`).then(setInvitations).catch(e => setInviteError(String(e)))}>초대 상태 새로고침</button>}
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-2">
              <div className="flex justify-between"><h3 className="text-xs font-semibold text-white">내가 받은 보이스 제공자 초대</h3>
                <button className="text-xs text-blue-400" onClick={() => void refreshInbox()}>새로고침</button></div>
              {inbox.length === 0 && <p className="text-xs text-[#9CA3AF]">대기 중인 초대가 없습니다.</p>}
              {inbox.map(item => <div key={item.id} className="flex items-center justify-between gap-2 text-xs text-white">
                <span>{item.track.title} · {item.percentage}%</span>
                <div className="flex gap-2">
                  <button className="text-emerald-400" onClick={() => void respondInvite(item.id, "accept")}>수락</button>
                  <button className="text-red-400" onClick={() => void respondInvite(item.id, "reject")}>거절</button>
                </div>
              </div>)}
            </div>
            <p className="text-[10px] text-[#9CA3AF]">음원 업로드는 임시 저장입니다. 제공자 수락, 기여도 확정, 실제 AI 검증 및 온체인 등록은 별도 단계입니다.</p>

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

          <button
            onClick={() => void handleUpload()}
            disabled={uploading || !audioFile || !title.trim() || uploadedId !== null}
            className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
          >
            {uploading ? "음원 업로드 중…" : uploadedId !== null ? "업로드 완료" : "음원 업로드"}
          </button>
          {uploadError && <p role="alert" className="text-sm text-red-400">{uploadError}</p>}
          {uploadedId !== null && <p role="status" className="text-sm text-emerald-400">비공개 임시 저장 완료 · ID: {uploadedId} (기여자 동의·AI 검증·온체인 등록 전)</p>}
          {uploadedId !== null && (
            <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-4 space-y-2">
              <button
                type="button"
                onClick={() => void handleRealVerification()}
                disabled={verificationBusy || preparing || registrationBusy || policy.pending}
                className="w-full rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {verificationBusy ? "기여도 확정 · 실제 AI 검증 중…" : "기여도 확정 · 실제 AI 검증"}
              </button>
              <p className="text-xs text-[#9CA3AF]">공동 창작자의 초대 수락과 지분 확정이 완료되어야 검증을 시작할 수 있습니다. 데모 판정은 사용하지 않습니다.</p>
              <VerificationNotice verification={currentVerification} />
              {verificationMessage && <p role="status" className="text-xs text-blue-300">{verificationMessage}</p>}
              {verificationError && <p role="alert" className="text-xs text-red-400">{verificationError}</p>}
              </div>
            )}
          {uploadedId !== null && (
            <div className="space-y-3 rounded-xl border border-[#30363d] bg-[#161b22] p-4">
              <p role="status" className="text-sm text-emerald-400">비공개 임시 저장 완료 · ID: {uploadedId}</p>
              <p className="text-xs text-[#9CA3AF]">
                IPFS 업로드·등록 준비와 실제 지갑 거래는 별도 단계입니다. Backend 준비 완료와 연결된 지갑·네트워크를 확인한 후에만 거래를 전송할 수 있습니다.
              </p>
              <button type="button" onClick={() => void handlePrepare()} disabled={!canPrepare || verificationBusy || preparing || registrationBusy || refreshing}
                className="w-full rounded-xl border border-blue-500/40 px-4 py-3 text-sm text-blue-300 disabled:opacity-40 disabled:cursor-not-allowed">
                {preparing ? "IPFS 업로드 · 등록 준비 중…" : "IPFS 업로드 · 등록 준비"}
              </button>
              <div className="flex gap-3 text-xs text-blue-300">
                <button type="button" disabled={refreshing || verificationBusy || preparing || registrationBusy} onClick={() => void handleRefresh()}>검증·등록 조건 새로고침</button>
                <button type="button" disabled={refreshing || verificationBusy || preparing || registrationBusy} onClick={() => void handleRefresh(true)}>지갑 연결</button>
                <button type="button" disabled={refreshing || verificationBusy || preparing || registrationBusy} onClick={() => void handleRefresh(false, true)}>Hardhat 네트워크로 전환</button>
              </div>
              {readiness && !readiness.ready && <p role="status" className="text-xs text-amber-300">등록 준비 필요: {missingText(readiness.missing)}</p>}
              <button type="button" onClick={() => void handleSign()} disabled={registrationBusy || !policy.eligible || !readiness?.ready || verificationBusy || preparing || refreshing}
                className="w-full rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50">
                {registrationBusy ? "등록 처리 중…" : registrationTxHash ? "온체인 등록 확인 / 재시도" : "실제 온체인 등록 (MetaMask)"}
              </button>
              {registrationTxHash && <p className="break-all text-xs text-blue-400">TX: {registrationTxHash}</p>}
              {registrationInfo && <p role="status" className="text-sm text-emerald-400">{registrationInfo}</p>}
              {registrationError && <p role="alert" className="text-sm text-red-400">{registrationError}</p>}
            </div>
          )}
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

    </div>
  )
}
