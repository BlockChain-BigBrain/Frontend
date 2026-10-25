import { useState } from "react"
import { THRESHOLD } from "../../shared/config/constants"
import type { ChainResult, RejectReason } from "../../shared/types/domain"
import { NETWORK } from "../../shared/config/network"

const REJECT_MESSAGES: Record<RejectReason, {
  title: string
  message: string
  tone: "red" | "orange" | "gray"
}> = {
  INVALID_AI_SIGNATURE: {
    title: "Invalid AI Verification Signature",
    message:
      "AI 검증자 서명이 올바르지 않아 민팅이 거부되었습니다. 서명이 위조되었거나 변조되었을 수 있습니다.",
    tone: "red",
  },
  SIGNATURE_EXPIRED: {
    title: "서명 만료",
    message: "검증 서명의 유효 시간이 지났습니다. 다시 검증을 요청해 주세요.",
    tone: "orange",
  },
  NONCE_ALREADY_USED: {
    title: "중복 요청",
    message: "이미 사용된 요청입니다.",
    tone: "orange",
  },
  DUPLICATE_FINGERPRINT: {
    title: "동일 지문 감지",
    message: "이미 등록된 음원과 같은 지문입니다.",
    tone: "red",
  },
  WALLET_REJECTED: {
    title: "지갑에서 거부됨",
    message: "사용자가 지갑에서 트랜잭션을 거부했습니다.",
    tone: "gray",
  },
  WRONG_NETWORK: {
    title: "네트워크 불일치",
    message: "올바른 네트워크로 전환해 주세요.",
    tone: "orange",
  },
  CONTRACT_REVERT: {
    title: "컨트랙트 실행 실패",
    message: "컨트랙트에서 거부되었습니다.",
    tone: "red",
  },
}

function ValueBadge({
  children,
  tone = "gray",
}: {
  children: React.ReactNode
  tone?: "green" | "red" | "orange" | "blue" | "gray"
}) {
  const styles = {
    green: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    red: "border-red-500/30 bg-red-500/10 text-red-400",
    orange: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    blue: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    gray: "border-[#30363d] bg-[#161b22] text-[#9CA3AF]",
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-medium font-mono ${styles[tone]}`}
    >
      {children}
    </span>
  )
}

function PanelRow({
  label,
  description,
  children,
}: {
  label: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[minmax(190px,1fr)_minmax(230px,1.25fr)] gap-4 border-b border-[#21262d] px-4 py-3 last:border-0">
      <div>
        <div className="text-xs font-medium text-white">{label}</div>
        <div className="mt-0.5 text-[10px] text-[#6B7280]">{description}</div>
      </div>
      <div className="flex min-w-0 items-center justify-end">{children}</div>
    </div>
  )
}

export default function ChainResultPanel({
  result,
  compact = false,
  onRetry,
  onAppeal,
}: {
  result: ChainResult
  compact?: boolean
  onRetry?: () => void
  onAppeal?: () => void
}) {
  const [copied, setCopied] = useState(false)
  const reason = result.rejectReason
    ? REJECT_MESSAGES[result.rejectReason]
    : null
  const hash =
    result.mintStatus === "success" && result.txHash ? result.txHash : undefined
  const shortenedHash = hash ? `${hash.slice(0, 10)}…${hash.slice(-8)}` : "—"
  const scoreHidden = result.rejectReason === "DUPLICATE_FINGERPRINT"
  const score =
    result.similarityScore === undefined
      ? null
      : Math.max(0, Math.min(1, result.similarityScore))
  const verdictTone =
    result.riskVerdict === "PASS"
      ? "green"
      : result.riskVerdict === "WARN"
        ? "orange"
        : result.riskVerdict === "HOLD"
          ? "orange"
          : result.riskVerdict === "BLOCK"
            ? "red"
          : result.riskVerdict === "CHECKING"
            ? "blue"
            : "gray"

  const copyHash = async () => {
    if (!hash) return
    await navigator.clipboard?.writeText(hash)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  return (
    <section
      className={`overflow-hidden rounded-xl border border-[#30363d] bg-[#0d1117] ${
        compact ? "" : "shadow-xl shadow-black/10"
      }`}
    >
      <div className="flex items-center justify-between border-b border-[#30363d] bg-[#1c2128] px-4 py-3">
        <div>
          <h3 className="text-xs font-semibold text-white">
            온체인 검증 · 민팅 결과
          </h3>
          <p className="mt-0.5 text-[9px] font-mono text-[#6B7280]">
            EIP-712 · ERC-1155 · {NETWORK.name}
          </p>
        </div>
        <ValueBadge tone={verdictTone}>
          {result.riskVerdict === "CHECKING" && (
            <span className="h-2.5 w-2.5 animate-spin rounded-full border border-blue-400 border-t-transparent" />
          )}
          {result.riskVerdict === "HOLD"
            ? "HOLD · 정산 보류"
            : result.riskVerdict === "BLOCK"
              ? "BLOCK · 동일 지문"
              : result.riskVerdict === "ERROR"
                ? "검증 오류, 재시도"
                : result.riskVerdict === "CHECKING"
                  ? "검증 중"
                  : result.riskVerdict}
        </ValueBadge>
      </div>

      <PanelRow
        label="EIP-712 Signature Verified"
        description="정상 AI 검증자 서명 확인"
      >
        {result.signatureVerified === true ? (
          <ValueBadge tone="green">✓ Verified</ValueBadge>
        ) : result.signatureVerified === false ? (
          <ValueBadge tone="red">× Not Verified</ValueBadge>
        ) : (
          <ValueBadge>대기 중</ValueBadge>
        )}
      </PanelRow>
      <PanelRow label="Mint Success" description="민팅 성공">
        <ValueBadge tone={result.mintStatus === "success" ? "green" : "gray"}>
          {result.mintStatus === "success" ? "✓ Mint Success" : "비활성"}
        </ValueBadge>
      </PanelRow>
      <PanelRow label="Mint Rejected" description="민팅 거부">
        <ValueBadge tone={result.mintStatus === "rejected" ? "red" : "gray"}>
          {result.mintStatus === "rejected" ? "× Mint Rejected" : "비활성"}
        </ValueBadge>
      </PanelRow>
      <PanelRow
        label="Invalid AI Verification Signature"
        description="가짜 서명 실패 사유"
      >
        {reason ? (
          <div
            className={`w-full rounded-lg border p-3 text-left ${
              reason.tone === "red"
                ? "border-red-500/30 bg-red-500/5"
                : reason.tone === "orange"
                  ? "border-amber-500/30 bg-amber-500/5"
                  : "border-[#30363d] bg-[#161b22]"
            }`}
          >
            <div
              className={`text-xs font-semibold ${
                reason.tone === "red"
                  ? "text-red-400"
                  : reason.tone === "orange"
                    ? "text-amber-400"
                    : "text-[#9CA3AF]"
              }`}
            >
              {reason.title}
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-[#9CA3AF]">
              {reason.message}
            </p>
            {result.rejectReason === "CONTRACT_REVERT" &&
              result.rejectDetail && (
                <details className="mt-2 rounded border border-[#30363d] bg-[#0d1117] px-2 py-1.5">
                  <summary className="cursor-pointer text-[9px] text-[#9CA3AF]">
                    컨트랙트 원문 보기
                  </summary>
                  <code className="mt-1 block break-all text-[9px] text-red-300">
                    {result.rejectDetail}
                  </code>
                </details>
              )}
            <button
              onClick={
                result.rejectReason === "DUPLICATE_FINGERPRINT"
                  ? onAppeal
                  : onRetry
              }
              className="mt-2 rounded border border-[#30363d] bg-[#1c2128] px-2 py-1 text-[10px] font-medium text-white hover:border-[#484f58]"
            >
              {result.rejectReason === "DUPLICATE_FINGERPRINT"
                ? "이의 제기"
                : "다시 시도"}
            </button>
          </div>
        ) : (
          <span className="text-xs font-mono text-[#6B7280]">—</span>
        )}
      </PanelRow>
      <PanelRow label="Transaction Hash" description="민팅 성공 트랜잭션 해시">
        {hash ? (
          <div className="flex min-w-0 items-center gap-1.5">
            <code className="truncate text-[10px] text-blue-400">
              {shortenedHash}
            </code>
            <button
              onClick={copyHash}
              className="rounded border border-[#30363d] px-1.5 py-1 text-[9px] text-[#9CA3AF] hover:text-white"
              title="트랜잭션 해시 복사"
            >
              {copied ? "복사됨" : "복사"}
            </button>
            {NETWORK.explorerTxUrl ? (
              <a
                href={NETWORK.explorerTxUrl(hash)}
                target="_blank"
                rel="noreferrer"
                className="rounded border border-blue-500/30 px-1.5 py-1 text-[9px] text-blue-400 hover:bg-blue-500/10"
              >
                탐색기 ↗
              </a>
            ) : (
              <button
                disabled
                title="로컬 네트워크는 탐색기가 없습니다"
                className="cursor-not-allowed rounded border border-[#30363d] px-1.5 py-1 text-[9px] text-[#484f58]"
              >
                탐색기
              </button>
            )}
          </div>
        ) : (
          <span className="text-xs font-mono text-[#6B7280]">—</span>
        )}
      </PanelRow>
      <PanelRow label="Token ID" description="발급된 ERC-1155 토큰 ID">
        {result.tokenId !== undefined ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-white">
              #{result.tokenId}
            </span>
            <ValueBadge>양도 불가</ValueBadge>
            <span
              title="구매자별 1개"
              className="cursor-help text-[10px] text-[#6B7280]"
            >
              ⓘ
            </span>
          </div>
        ) : (
          <span className="text-xs font-mono text-[#6B7280]">—</span>
        )}
      </PanelRow>
      <PanelRow label="Similarity Score" description="AI 유사도 리스크 점수">
        {scoreHidden ? (
          <ValueBadge tone="red">동일 지문 감지</ValueBadge>
        ) : score !== null ? (
          <div className="w-full max-w-[230px]">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-white">
                {score.toFixed(2)}
              </span>
              <ValueBadge tone={verdictTone}>{result.riskVerdict}</ValueBadge>
            </div>
            <div className="relative flex h-1.5 overflow-visible rounded-full">
              <div
                className="rounded-l-full bg-emerald-500"
                style={{ width: `${THRESHOLD.warn * 100}%` }}
              />
              <div
                className="bg-amber-500"
                style={{
                  width: `${(THRESHOLD.hold - THRESHOLD.warn) * 100}%`,
                }}
              />
              <div
                className="rounded-r-full bg-red-500"
                style={{ width: `${(1 - THRESHOLD.hold) * 100}%` }}
              />
              {[THRESHOLD.warn, THRESHOLD.hold].map((threshold) => (
                <span
                  key={threshold}
                  className="absolute top-[-3px] h-3 w-px bg-white/80"
                  style={{ left: `${threshold * 100}%` }}
                />
              ))}
              <span
                className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0d1117] bg-white"
                style={{ left: `${score * 100}%` }}
              />
            </div>
            <div className="mt-1 flex justify-end gap-4 text-[8px] font-mono text-[#6B7280]">
              <span>{THRESHOLD.warn.toFixed(2)}</span>
              <span>{THRESHOLD.hold.toFixed(2)}</span>
            </div>
          </div>
        ) : (
          <span className="text-xs font-mono text-[#6B7280]">—</span>
        )}
      </PanelRow>
      <PanelRow label="Hold Status" description="isHold 상태">
        <ValueBadge tone={result.isHold ? "orange" : "green"}>
          {result.isHold ? "정산 보류 (에스크로)" : "정산 정상"}
        </ValueBadge>
      </PanelRow>
      {result.isHold && result.mintStatus === "success" && (
        <div className="border-t border-amber-500/20 bg-amber-500/5 p-4">
          <div className="text-xs font-semibold text-amber-400">
            정산 보류 중 (검토 중)
          </div>
          <p className="mt-1 text-[10px] leading-relaxed text-[#9CA3AF]">
            라이선스 NFT는 정상 발급되었습니다. 유사도가 높아 판매 대금은
            검토가 끝날 때까지 에스크로에 보관되며, 창작자에게 즉시
            분배되지 않습니다.
          </p>
          <div className="mt-3 flex gap-2">
            <button className="rounded border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[10px] font-medium text-amber-400">
              근거 보기
            </button>
            <button
              onClick={onAppeal}
              className="rounded border border-[#30363d] bg-[#1c2128] px-2.5 py-1.5 text-[10px] font-medium text-white hover:border-[#484f58]"
            >
              이의 제기
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
