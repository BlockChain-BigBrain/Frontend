import { useEffect, useRef, useState, type FormEvent } from "react"
import { auth } from "../api"
import { type User } from "../auth"
import {
  API_BASE,
  api,
  publicApi,
  passwordAuth,
  connectWallet,
  sendTransaction,
  savePending,
  readPending,
  confirmPending,
  type ChainTransaction,
  type PendingTransaction,
} from "../api/service"
import logo from "../assets/track-ai-logo.svg"

type Tab = "market" | "studio" | "library"
const panel = "rounded-2xl border border-[#30363d] bg-[#161b22] p-6"
const button =
  "rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
const input =
  "w-full rounded-lg border border-[#30363d] bg-[#0d1117] p-3 text-sm"
const message = (e: unknown) =>
  e instanceof Error ? e.message : "요청을 완료하지 못했습니다."
export default function App() {
  const [user, setUser] = useState<User | null>(null),
    [tab, setTab] = useState<Tab>("market")
  const [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("")
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [nickname, setNickname] = useState("")
  const [signup, setSignup] = useState(false),
    [wallet, setWallet] = useState("")
  const [market, setMarket] = useState<any[]>([]),
    [tracks, setTracks] = useState<any[]>([]),
    [licenses, setLicenses] = useState<any[]>([]),
    [revenue, setRevenue] = useState<any>(null)
  const [title, setTitle] = useState(""),
    [file, setFile] = useState<File | null>(null),
    [contributors, setContributors] = useState("")
  const [selected, setSelected] = useState<any>(null),
    [verification, setVerification] = useState<any>(null),
    [chain, setChain] = useState<any>(null),
    [price, setPrice] = useState("0.001"),
    [health, setHealth] = useState<any>(null)
  const [pending, setPending] = useState<PendingTransaction[]>([])
  const lock = useRef(false)
  const refresh = async (who: User | null = user) => {
    const list = await publicApi("/api/market/tracks?limit=100")
    setMarket(list.items)
    if (who) {
      const [mine, owned, bound] = await Promise.all([
        api("/api/tracks?scope=mine&limit=100"),
        api("/api/users/me/licenses?limit=100"),
        api("/api/users/me/wallet"),
      ])
      const balance = bound.walletAddress
        ? await api("/api/users/me/revenue").catch(() => null)
        : null
      setTracks(Array.isArray(mine) ? mine : mine.items)
      setLicenses(owned.items)
      setRevenue(balance)
      setWallet(bound.walletAddress || "")
      setPending(readPending(who.id))
    }
  }
  useEffect(() => {
    let active = true
    publicApi("/api/blockchain/health")
      .then((v) => active && setHealth(v))
      .catch((e) => active && setError(message(e)))
    publicApi("/api/market/tracks?limit=100")
      .then((v) => active && setMarket(v.items))
      .catch((e) => active && setError(message(e)))
    auth
      .me()
      .then(async (who) => {
        if (active) {
          setUser(who)
          await refresh(who)
        }
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [])
  const run = async (label: string, action: () => Promise<void>) => {
    if (lock.current) return
    lock.current = true
    setBusy(label)
    setError("")
    setNotice("")
    try {
      await action()
    } catch (e) {
      setError(message(e))
    } finally {
      setBusy("")
      lock.current = false
      if (user) setPending(readPending(user.id))
    }
  }
  const select = async (id: number) => {
    const track = await api(`/api/tracks/${id}`)
    setSelected(track)
    setVerification(track.verifications?.[0] || null)
    setChain(await api(`/api/tracks/${id}/blockchain`))
  }
  const transact = async (
    tx: ChainTransaction,
    endpoint: string,
    body: Record<string, unknown>,
    label: string,
  ) => {
    if (!user) throw new Error("로그인이 필요합니다.")
    if (
      readPending(user.id).some(
        (item) =>
          item.endpoint === endpoint &&
          JSON.stringify(item.body) === JSON.stringify(body),
      )
    )
      throw new Error(
        "이미 전송한 거래가 있습니다. 전송 내역에서 확인해 주세요.",
      )
    const hash = await sendTransaction(tx)
    const item = { hash, endpoint, body, label }
    savePending(user.id, item)
    setPending(readPending(user.id))
    return confirmPending(user.id, item)
  }
  const login = (event: FormEvent) => {
    event.preventDefault()
    void run("로그인 중", async () => {
      if (signup) await passwordAuth("signup", email, password, nickname)
      await passwordAuth("login", email, password, nickname)
      const who = await auth.me()
      setUser(who)
      setPassword("")
      await refresh(who)
    })
  }
  const upload = (event: FormEvent) => {
    event.preventDefault()
    void run("음원 업로드 중", async () => {
      if (!user || !file)
        throw new Error("로그인 후 WAV 또는 MP3 파일을 선택해 주세요.")
      const rows = contributors.trim()
        ? JSON.parse(contributors)
        : [{ userId: user.id, role: "COMPOSER", percentage: 100 }]
      if (
        !Array.isArray(rows) ||
        rows.some((x) => !Number.isInteger(x.percentage)) ||
        rows.reduce((sum, x) => sum + x.percentage, 0) !== 100
      )
        throw new Error("기여도는 정수 퍼센트로 합계 100이어야 합니다.")
      const form = new FormData()
      form.set("title", title)
      form.set("audio", file)
      form.set("isPublic", "true")
      form.set("contributors", JSON.stringify(rows))
      const track = await api("/api/tracks", form)
      await select(track.id)
      await refresh()
      setNotice("업로드 완료. 기여도를 확정한 뒤 AI 검증을 실행해 주세요.")
    })
  }
  const verify = () =>
    selected &&
    run("AI가 음원을 분석하고 있어요. 몇 분 걸릴 수 있어요.", async () => {
      const latest = await api(`/api/tracks/${selected.id}`)
      const retry = latest.verifications?.some(
        (v: any) => v.status === "VERIFIED",
      )
      const result = await api(
        `/api/tracks/${selected.id}/${retry ? "reverify" : "verify"}`,
        {},
      )
      setVerification(result)
      if (result.status !== "VERIFIED")
        throw new Error(
          `AI 검증 실패 (${result.errorCode || "서버를 확인해 주세요"})`,
        )
      setNotice("AI 분석 결과를 받았어요. 아래 판정과 근거를 확인해 주세요.")
      await select(selected.id)
    })
  const register = () =>
    selected &&
    run("IPFS 저장 및 지갑 등록을 준비하고 있어요", async () => {
      const current = await api(`/api/tracks/${selected.id}/blockchain`)
      if (current.registrationStatus === "REGISTERED") {
        await select(selected.id)
        return
      }
      let packet
      if (current.registrationStatus === "PENDING")
        packet = await api(
          `/api/tracks/${selected.id}/registration-payload`,
          {},
        )
      else {
        if (
          verification?.evidence?.reviewRequired ||
          verification?.duplicate ||
          verification?.riskStatus === "HOLD"
        )
          throw new Error(
            "이 음원은 검토 또는 차단 상태여서 등록을 진행할 수 없습니다.",
          )
        await api(`/api/tracks/${selected.id}/metadata/prepare`, {})
        await api(`/api/tracks/${selected.id}/metadata/upload`, {})
        packet = await api(
          `/api/tracks/${selected.id}/registration-payload`,
          {},
        )
      }
      if (!packet.ready || !packet.transaction)
        throw new Error(
          `등록 준비가 필요해요: ${(packet.missing || []).join(", ")}`,
        )
      await transact(
        packet.transaction,
        `/api/tracks/${selected.id}/registration/confirm`,
        {},
        `음원 ${selected.id} 등록`,
      )
      await select(selected.id)
      await refresh()
      setNotice("온체인 등록과 DB 반영이 완료됐어요.")
    })
  const list = () =>
    selected &&
    run("판매 가격 설정을 위해 지갑 승인을 기다려요", async () => {
      const mine = await api("/api/market/tracks?scope=mine&limit=100")
      let listing = mine.items.find(
        (x: any) => x.trackId === selected.id && x.status !== "INACTIVE",
      )
      if (!listing)
        listing = await api("/api/market/tracks", {
          trackId: selected.id,
          price,
          currency: "ETH",
          licenseType: "COMMERCIAL",
        })
      const packet = await api(
        `/api/market/tracks/${listing.id}/price-payload`,
        { price },
      )
      await transact(
        packet.transaction,
        `/api/market/tracks/${listing.id}/price/confirm`,
        {},
        `음원 ${selected.id} 판매 가격`,
      )
      await refresh()
      setNotice("판매가가 확인되어 마켓에 반영됐어요.")
    })
  const buy = (listing: any) =>
    run("구매 트랜잭션을 준비하고 있어요", async () => {
      if (!user) throw new Error("로그인과 지갑 연결이 필요해요.")
      const key = `track-ai-buy:${user.id}:${listing.trackId}`
      let idempotencyKey = localStorage.getItem(key)
      if (!idempotencyKey) {
        idempotencyKey = crypto.randomUUID()
        localStorage.setItem(key, idempotencyKey)
      }
      const packet = await api("/api/licenses/purchase", {
        trackId: listing.trackId,
        idempotencyKey,
      })
      await transact(
        packet.transaction,
        "/api/licenses/purchase/confirm",
        { requestId: packet.id },
        `음원 ${listing.trackId} 구매`,
      )
      await refresh()
      setTab("library")
      setNotice("구매 영수증과 NFT 민팅을 확인했어요.")
    })
  const report = verification?.evidence
  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3]">
      <header className="border-b border-[#30363d] bg-[#161b22] px-6 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-6">
          <img src={logo} alt="Track-AI" className="h-10 w-10" />
          <strong className="text-xl">Track-AI</strong>
          <nav className="flex flex-1 gap-4">
            {([
              ["market", "마켓플레이스"],
              ["studio", "내 스튜디오"],
              ["library", "라이선스 · 수익"],
            ] as const).map(([id, name]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={tab === id ? "text-blue-400" : "text-slate-400"}
              >
                {name}
              </button>
            ))}
          </nav>
          <span className="text-xs text-slate-400">Hardhat · 로컬 ETH</span>
          {user && (
            <button
              disabled={!!busy}
              onClick={() =>
                void run("로그아웃 중", async () => {
                  await auth.logout()
                  setUser(null)
                  setWallet("")
                  setTracks([])
                  setLicenses([])
                  setRevenue(null)
                  setSelected(null)
                  setPending([])
                })
              }
            >
              로그아웃
            </button>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        {health && !health.connected && (
          <p
            role="alert"
            className="rounded-lg border border-amber-500/40 p-4 text-amber-300"
          >
            블록체인 연결을 확인해 주세요: {health.error}
          </p>
        )}
        {busy && (
          <p role="status" aria-live="polite" className="text-blue-300">
            ◌ {busy}
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-red-500/40 p-4 text-red-300"
          >
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="text-emerald-300">
            {notice}
          </p>
        )}
        {!user ? (
          <section className={panel}>
            <h1 className="mb-4 text-xl font-semibold">
              음원 등록과 구매를 시작해 보세요
            </h1>
            <form onSubmit={login} className="grid gap-3 sm:grid-cols-3">
              <label>
                이메일
                <input
                  className={input}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label>
                비밀번호
                <input
                  className={input}
                  type="password"
                  minLength={8}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              {signup && (
                <label>
                  닉네임
                  <input
                    className={input}
                    required
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                  />
                </label>
              )}
              <button className={button} disabled={!!busy}>
                {signup ? "가입 후 로그인" : "로그인"}
              </button>
              <button type="button" onClick={() => setSignup(!signup)}>
                {signup ? "기존 계정 로그인" : "새 계정 만들기"}
              </button>
              <a className="p-2 text-blue-300" href={auth.loginUrl}>
                Google로 로그인
              </a>
            </form>
          </section>
        ) : (
          <section className="flex flex-wrap items-center gap-4 text-sm">
            <span>
              {user.nickname || user.email} · 사용자 ID {user.id}
            </span>
            <button
              className={button}
              disabled={!!busy}
              onClick={() =>
                void run("지갑 소유 확인 서명을 기다려요", async () => {
                  setWallet(await connectWallet())
                  setNotice("지갑 소유 확인을 완료했어요.")
                })
              }
            >
              {wallet ? "지갑 다시 확인" : "지갑 연결"}
            </button>
            {wallet && (
              <code className="break-all text-xs text-slate-400">{wallet}</code>
            )}
            <button
              disabled={!!busy}
              onClick={() =>
                void run("새로고침 중", async () => {
                  setHealth(await publicApi("/api/blockchain/health"))
                  await refresh()
                })
              }
            >
              새로고침
            </button>
          </section>
        )}
        {pending.length > 0 && (
          <section className={panel}>
            <h2 className="mb-3 font-semibold">전송 내역 · 확인 대기</h2>
            {pending.map((item) => (
              <div key={item.hash} className="mb-3 space-y-2">
                <p>{item.label}</p>
                <code className="block break-all text-xs">{item.hash}</code>
                <button
                  className={button}
                  disabled={!!busy}
                  onClick={() =>
                    void run("영수증과 DB 반영 확인 중", async () => {
                      await confirmPending(user!.id, item)
                      setPending(readPending(user!.id))
                      await refresh()
                      if (selected) await select(selected.id)
                      setNotice("확인 완료")
                    })
                  }
                >
                  다시 전송하지 않고 결과 확인
                </button>
              </div>
            ))}
          </section>
        )}
        {tab === "market" && (
          <>
            <div>
              <h1 className="text-3xl font-semibold">
                검증된 음악, 투명한 라이선스.
              </h1>
              <p className="mt-3 text-slate-400">
                구매가 확인되면 내 지갑으로 상업 이용권이 발급됩니다.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {market.length === 0 && (
                <p className="text-slate-400">아직 판매 중인 음원이 없어요.</p>
              )}
              {market.map((item) => (
                <article className={panel} key={item.id}>
                  <span className="text-xs text-emerald-400">
                    {item.track.verification?.riskStatus} ·{" "}
                    {item.track.verification?.source}
                  </span>
                  <h2 className="my-3 text-xl">{item.track.title}</h2>
                  <p className="mb-4 text-sm text-slate-400">
                    {item.track.creator.name} · COMMERCIAL
                  </p>
                  <audio
                    controls
                    preload="none"
                    src={`${API_BASE}/api/tracks/${item.trackId}/audio`}
                    className="mb-4 w-full"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <span>{item.price} ETH</span>
                    <button
                      disabled={!!busy || !user || !wallet || !item.purchasable}
                      className={button}
                      onClick={() => void buy(item)}
                    >
                      라이선스 구매
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
        {tab === "studio" && user && (
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <section className={panel}>
                <h1 className="mb-4 text-xl font-semibold">새 음원 업로드</h1>
                <form onSubmit={upload} className="space-y-4">
                  <label className="block">
                    제목
                    <input
                      className={input}
                      required
                      maxLength={191}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </label>
                  <label className="block">
                    WAV / MP3
                    <input
                      className="mt-2 block w-full"
                      type="file"
                      accept=".wav,.mp3"
                      required
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  <label className="block">
                    공동 창작자 (선택)
                    <textarea
                      className={input}
                      rows={3}
                      placeholder={
                        '[{"userId":1,"role":"COMPOSER","percentage":70},{"userId":2,"role":"PRODUCER","percentage":30}]'
                      }
                      value={contributors}
                      onChange={(e) => setContributors(e.target.value)}
                    />
                  </label>
                  <p className="text-xs text-slate-400">
                    비워 두면 본인 100%로 등록해요. 공동 창작자는 각자 가입 후
                    지갑을 연결해야 해요. 등록할 음원과 메타데이터는 공개 IPFS에
                    저장됩니다.
                  </p>
                  <button disabled={!!busy || !wallet} className={button}>
                    업로드
                  </button>
                </form>
              </section>
              <section className={panel}>
                <h2 className="mb-4 font-semibold">내 음원</h2>
                {tracks.map((track) => (
                  <button
                    className="mb-2 flex w-full justify-between rounded-lg border border-[#30363d] p-3 text-left"
                    key={track.id}
                    disabled={!!busy}
                    onClick={() =>
                      void run("음원 조회 중", () => select(track.id))
                    }
                  >
                    <span>{track.title}</span>
                    <span className="text-xs text-slate-400">
                      #{track.id} · {track.registrationStatus}
                    </span>
                  </button>
                ))}
              </section>
            </div>
            <section className={panel}>
              {!selected ? (
                <p className="text-slate-400">
                  음원을 선택하면 검증과 등록을 진행할 수 있어요.
                </p>
              ) : (
                <div className="space-y-5">
                  <h2 className="text-xl font-semibold">{selected.title}</h2>
                  <p className="text-sm text-slate-400">
                    온체인 상태: {chain?.registrationStatus}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      className={button}
                      disabled={!!busy || !!selected.contributionsFinalizedAt}
                      onClick={() =>
                        void run("기여도 확정 중", async () => {
                          await api(
                            `/api/tracks/${selected.id}/contributors/finalize`,
                            {},
                          )
                          await select(selected.id)
                        })
                      }
                    >
                      1. 기여도 확정
                    </button>
                    <button
                      className={button}
                      disabled={
                        !!busy ||
                        ["PENDING", "REGISTERED"].includes(
                          chain?.registrationStatus,
                        )
                      }
                      onClick={() => void verify()}
                    >
                      2. AI 검증
                    </button>
                    <button
                      className={button}
                      disabled={
                        !!busy ||
                        !wallet ||
                        !verification ||
                        verification.status !== "VERIFIED" ||
                        !!verification.duplicate ||
                        !!report?.reviewRequired ||
                        verification.riskStatus === "HOLD" ||
                        chain?.registrationStatus === "REGISTERED"
                      }
                      onClick={() => void register()}
                    >
                      3. IPFS 저장 · 등록
                    </button>
                  </div>
                  {verification && (
                    <div className="space-y-3 rounded-xl border border-[#30363d] p-4">
                      <h3 className="font-semibold">
                        AI 검증 결과:{" "}
                        {report?.decision ||
                          verification.riskStatus ||
                          verification.status}
                      </h3>
                      <p>
                        유사도{" "}
                        {report?.similarityScore === null
                          ? "산출하지 않음 (지문 중복)"
                          : `${((report?.similarityScore ?? Number(verification.riskScore)) * 100).toFixed(2)}%`}
                      </p>
                      <p className="text-sm text-slate-400">
                        {report?.reviewRequired
                          ? "사람의 검토가 필요하여 등록이 보류됐어요."
                          : verification.duplicate
                            ? "동일 지문이 감지되어 등록이 차단됐어요."
                            : "유사도 분석은 법적 표절 여부나 권리 보유를 보증하지 않습니다."}
                      </p>
                      {report?.provisional && (
                        <p className="text-xs text-amber-300">
                          잠정 판정 기준이 사용됐어요.
                        </p>
                      )}
                      <details>
                        <summary>모델 · 비교 구간 · 판정 근거 보기</summary>
                        <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-all text-xs">
                          {JSON.stringify(report || verification, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                  {chain?.registrationStatus === "REGISTERED" && (
                    <>
                      <dl className="space-y-2 break-all text-xs">
                        <dt>등록 트랜잭션</dt>
                        <dd>{chain.txHash}</dd>
                        <dt>음원 ID</dt>
                        <dd>{chain.blockchainTrackId}</dd>
                      </dl>
                      <label className="block">
                        판매 가격 (로컬 ETH)
                        <input
                          className={input}
                          inputMode="decimal"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                        />
                      </label>
                      <button
                        className={button}
                        disabled={!!busy || !wallet}
                        onClick={() => void list()}
                      >
                        판매 가격 설정 · 마켓 공개
                      </button>
                    </>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
        {tab === "library" && user && (
          <div className="grid gap-6 md:grid-cols-2">
            <section className={panel}>
              <h1 className="mb-4 text-xl font-semibold">보유 라이선스</h1>
              {licenses.length === 0 && (
                <p className="text-slate-400">
                  아직 발급받은 라이선스가 없어요.
                </p>
              )}
              {licenses.map((item) => (
                <article
                  className="mb-4 rounded-xl border border-[#30363d] p-4"
                  key={item.id}
                >
                  <h2>{item.track?.title || `음원 #${item.trackId}`}</h2>
                  <p className="my-2 text-sm">
                    {item.licenseStatus} · {item.type}
                  </p>
                  <p className="break-all text-xs">
                    Token ID: {item.tokenId || "미발급"}
                  </p>
                  <p className="mt-2 break-all text-xs">
                    TX: {item.purchaseTxHash || "미확인"}
                  </p>
                </article>
              ))}
            </section>
            <section className={panel}>
              <h2 className="mb-4 text-xl font-semibold">내 수익</h2>
              <p className="mb-4">출금 가능: {revenue?.available || "0"} ETH</p>
              <button
                className={button}
                disabled={
                  !!busy ||
                  !wallet ||
                  !revenue ||
                  BigInt(revenue.availableWei || "0") === 0n
                }
                onClick={() =>
                  void run("수익 출금 지갑 승인을 기다려요", async () => {
                    const packet = await api("/api/revenue/withdraw", {
                      idempotencyKey: crypto.randomUUID(),
                    })
                    await transact(
                      packet.transaction,
                      "/api/revenue/withdraw/confirm",
                      { requestId: packet.id },
                      "수익 출금",
                    )
                    await refresh()
                    setNotice("출금과 DB 반영이 완료됐어요.")
                  })
                }
              >
                지갑으로 출금
              </button>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
