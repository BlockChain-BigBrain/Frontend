import { useState } from "react"
import { HOLD_POLICY, MOCK_NETWORK } from "../../shared/config/constants"
import type {
  ChainResult,
  FailureReason,
  TransactionStatus,
} from "../../shared/types/domain"

export type ChainResultMode = "REGISTER" | "PURCHASE"

const FAILURE_MESSAGES: Record<
  FailureReason,
  { title: string; message: string }
> = {
  USER_CANCELLED: {
    title: "사용자 승인 취소",
    message: "지갑 승인 전에 사용자가 요청을 취소했습니다. 거래 해시는 없습니다.",
  },
  AI_SIGNATURE_MISMATCH: {
    title: "검증 서버 서명 불일치",
    message:
      "EIP-712 검증 서명이 일치하지 않아 거래를 전송하지 않았습니다.",
  },
  SIGNATURE_EXPIRED: {
    title: "서명 만료",
    message: "검증 서명의 유효 시간이 지나 거래를 전송하지 않았습니다.",
  },
  HOLD_PURCHASE_RESTRICTED: {
    title: "HOLD 구매 제한",
    message: "HOLD 음원은 목업 정책상 라이선스 구매·발급을 진행하지 않습니다.",
  },
  PAYMENT_AMOUNT_MISMATCH: {
    title: "결제 금액 불일치",
    message: "요청 금액과 계약의 라이선스 가격이 일치하지 않습니다.",
  },
  DUPLICATE_FINGERPRINT: {
    title: "동일 지문 감지",
    message: "이미 등록된 음원과 같은 지문이 확인되어 등록을 진행하지 않습니다.",
  },
  CONTRACT_REVERT: {
    title: "기타 계약 실행 오류",
    message: "전송된 거래가 계약 실행 중 거부되었습니다.",
  },
  SERVER_ERROR: {
    title: "검증 서버 오류",
    message: "분석 결과를 확정하지 못했습니다. 잠시 후 다시 시도해 주세요.",
  },
}

const AI_LABELS = {
  NOT_ANALYZED: "미분석",
  ANALYZING: "분석 중",
  PASS: "PASS",
  WARN: "WARN",
  HOLD: "HOLD",
  BLOCK: "BLOCK",
  ERROR: "분석 오류",
} as const

const SIGNATURE_LABELS = {
  NOT_REQUESTED: "미요청",
  RECEIVED: "서명 수신",
  VERIFIED: "검증 확인 · 목업",
  FAILED: "검증 실패",
} as const

const TRANSACTION_LABELS: Record<TransactionStatus, string> = {
  NOT_SENT: "미전송",
  AWAITING_APPROVAL: "승인 대기",
  SUBMITTED: "전송됨",
  CONFIRMING: "확인 대기",
  SUCCESS: "성공",
  POLICY_BLOCKED: "정책상 진행 제한",
  USER_CANCELLED: "사용자 취소",
  CONTRACT_REJECTED: "계약 거부",
  ERROR: "오류",
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
      className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-medium font-mono ${styles[tone]}`}
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
  mode,
  compact = false,
  onRetry,
  onRecheck,
  onAppeal,
}: {
  result: ChainResult
  mode: ChainResultMode
  compact?: boolean
  onRetry?: () => void
  onRecheck?: () => void
  onAppeal?: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [showTransaction, setShowTransaction] = useState(false)
  const isHold = result.aiStatus === "HOLD"
  const transactionStatus =
    mode === "REGISTER" ? result.registrationStatus : result.purchaseStatus
  const transactionPhase =
    mode === "REGISTER"
      ? result.registrationTxPhase
      : result.purchaseTxPhase
  const hasPreviousRegistration =
    mode === "PURCHASE" &&
    result.registrationStatus === "SUCCESS" &&
    result.registrationTxPhase === "POST_SUBMISSION" &&
    result.registrationTxHash !== undefined &&
    result.onchainTrackId !== undefined
  const failureReason =
    result.failureTarget === "BOTH" || result.failureTarget === mode
      ? result.failureReason
      : undefined
  const reason = failureReason ? FAILURE_MESSAGES[failureReason] : null
  const modeHash =
    mode === "REGISTER" ? result.registrationTxHash : result.purchaseTxHash
  const hash = transactionPhase === "POST_SUBMISSION" ? modeHash : undefined
  const shortenedHash = hash ? `${hash.slice(0, 10)}…${hash.slice(-8)}` : "—"
  const score =
    result.similarityScore === undefined
      ? null
      : Math.max(0, Math.min(1, result.similarityScore))
  const aiTone =
    result.aiStatus === "PASS"
      ? "green"
      : result.aiStatus === "WARN" || result.aiStatus === "HOLD"
        ? "orange"
        : result.aiStatus === "BLOCK" || result.aiStatus === "ERROR"
          ? "red"
          : "blue"
  const transactionTone =
    transactionStatus === "SUCCESS"
      ? "green"
      : transactionStatus === "CONTRACT_REJECTED" ||
          transactionStatus === "ERROR"
        ? "red"
        : transactionStatus === "POLICY_BLOCKED"
          ? "orange"
        : transactionStatus === "USER_CANCELLED"
          ? "gray"
          : "blue"

  const copyHash = async () => {
    if (!hash) return
    await navigator.clipboard?.writeText(hash)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  return (
    <>
      <section
        className={`overflow-hidden rounded-xl border border-[#30363d] bg-[#0d1117] ${
          compact ? "" : "shadow-xl shadow-black/10"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#30363d] bg-[#1c2128] px-4 py-3">
          <div>
            <h3 className="text-xs font-semibold text-white">
              {mode === "REGISTER" ? "음원 등록 결과" : "라이선스 발급 결과"}
            </h3>
            <p className="mt-0.5 text-[9px] font-mono text-[#6B7280]">
              {MOCK_NETWORK.name} · Chain ID {MOCK_NETWORK.chainId} ·{" "}
              {MOCK_NETWORK.currencySymbol}
            </p>
          </div>
          <ValueBadge tone={aiTone}>{AI_LABELS[result.aiStatus]}</ValueBadge>
        </div>
        <div className="border-b border-blue-500/20 bg-blue-500/5 px-4 py-2 text-[9px] text-blue-300">
          시나리오 미리보기 · 실제 거래 아님
        </div>

        <PanelRow label="AI 판정" description="모델 분석 결과">
          <ValueBadge tone={aiTone}>{AI_LABELS[result.aiStatus]}</ValueBadge>
        </PanelRow>
        <PanelRow label="서명 상태" description="EIP-712 검증 단계">
          <ValueBadge
            tone={
              result.eip712Status === "VERIFIED"
                ? "green"
                : result.eip712Status === "FAILED"
                  ? "red"
                  : "gray"
            }
          >
            {SIGNATURE_LABELS[result.eip712Status]}
          </ValueBadge>
        </PanelRow>
        <PanelRow
          label={mode === "REGISTER" ? "등록 거래 상태" : "구매 거래 상태"}
          description={
            transactionPhase === "PRE_SUBMISSION" ? "전송 전 단계" : "전송 후 단계"
          }
        >
          <div className="flex items-center gap-2">
            <ValueBadge tone={transactionTone}>
              {TRANSACTION_LABELS[transactionStatus]}
            </ValueBadge>
            {transactionStatus === "CONFIRMING" && (
              <button
                type="button"
                onClick={onRecheck}
                className="rounded border border-blue-500/30 px-2 py-1 text-[9px] text-blue-400 hover:bg-blue-500/10"
              >
                목업 결과 재확인 (실제 조회 아님)
              </button>
            )}
          </div>
        </PanelRow>

        {mode === "PURCHASE" && (
          <PanelRow
            label="Mint Success"
            description="ERC-1155 라이선스 발급 결과"
          >
            <ValueBadge
              tone={
                transactionStatus === "SUCCESS"
                  ? "green"
                  : transactionStatus === "CONTRACT_REJECTED"
                    ? "red"
                    : transactionStatus === "POLICY_BLOCKED"
                      ? "orange"
                    : "gray"
              }
            >
              {transactionStatus === "SUCCESS"
                ? "✓ Mint Success"
                : transactionStatus === "CONTRACT_REJECTED"
                  ? "× Mint Rejected"
                  : transactionStatus === "POLICY_BLOCKED"
                    ? "정책상 발급 제한"
                  : "미확정"}
            </ValueBadge>
          </PanelRow>
        )}

        {hasPreviousRegistration && (
          <PanelRow
            label="기존 음원 등록"
            description="현재 구매 요청과 분리된 이전 등록 성공 기록"
          >
            <div className="text-right">
              <div className="text-[10px] font-mono text-emerald-400">
                TRACK #{result.onchainTrackId}
              </div>
              <code className="mt-0.5 block text-[9px] text-[#9CA3AF]">
                {result.registrationTxHash?.slice(0, 10)}…
                {result.registrationTxHash?.slice(-8)}
              </code>
            </div>
          </PanelRow>
        )}

        {reason && (
          <PanelRow label="실패·취소 사유" description="현재 요청이 중단된 이유">
            <div className="w-full rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-left">
              <div className="text-xs font-semibold text-red-400">
                {reason.title}
              </div>
              <p className="mt-1 text-[10px] leading-relaxed text-[#9CA3AF]">
                {reason.message}
              </p>
              {result.failureDetail && (
                <code className="mt-2 block break-all rounded border border-[#30363d] bg-[#0d1117] p-2 text-[9px] text-red-300">
                  {result.failureDetail}
                </code>
              )}
              {failureReason !== "HOLD_PURCHASE_RESTRICTED" && (
                <button
                  type="button"
                  onClick={
                    failureReason === "DUPLICATE_FINGERPRINT"
                      ? onAppeal
                      : onRetry
                  }
                  className="mt-2 rounded border border-[#30363d] bg-[#1c2128] px-2 py-1 text-[10px] font-medium text-white hover:border-[#484f58]"
                >
                  {failureReason === "DUPLICATE_FINGERPRINT"
                    ? "이의 제기"
                    : transactionStatus === "CONFIRMING"
                      ? "결과 재확인"
                      : "다시 시도"}
                </button>
              )}
            </div>
          </PanelRow>
        )}

        <PanelRow
          label={mode === "REGISTER" ? "등록 트랜잭션 해시" : "구매 트랜잭션 해시"}
          description={
            hash ? "전송된 목업 거래 식별자" : "해당 거래가 전송되지 않아 해시 없음"
          }
        >
          {hash ? (
            <div className="flex min-w-0 items-center gap-1.5">
              <code className="truncate text-[10px] text-blue-400">
                {shortenedHash}
              </code>
              <button
                type="button"
                onClick={copyHash}
                className="rounded border border-[#30363d] px-1.5 py-1 text-[9px] text-[#9CA3AF] hover:text-white"
              >
                {copied ? "복사됨" : "복사"}
              </button>
              <button
                type="button"
                onClick={() => setShowTransaction(true)}
                className="rounded border border-blue-500/30 px-1.5 py-1 text-[9px] text-blue-400 hover:bg-blue-500/10"
              >
                거래 상세
              </button>
            </div>
          ) : (
            <span className="text-xs font-mono text-[#6B7280]">—</span>
          )}
        </PanelRow>

        {mode === "REGISTER" ? (
          <PanelRow label="온체인 음원 ID" description="등록된 음원 레코드 ID">
            {result.onchainTrackId !== undefined ? (
              <span className="text-xs font-mono text-white">
                TRACK #{result.onchainTrackId}
              </span>
            ) : (
              <span className="text-xs font-mono text-[#6B7280]">—</span>
            )}
          </PanelRow>
        ) : (
          <PanelRow label="Token ID" description="발급된 ERC-1155 라이선스 ID">
            {result.tokenId !== undefined &&
            transactionStatus === "SUCCESS" ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-white">
                  #{result.tokenId}
                </span>
                <ValueBadge>양도 불가</ValueBadge>
              </div>
            ) : (
              <span className="text-xs font-mono text-[#6B7280]">—</span>
            )}
          </PanelRow>
        )}

        <PanelRow
          label="Similarity Score"
          description="이 값은 단일 유사도 점수입니다. WARN(query-level)과 HOLD(pairwise temporal)는 서로 다른 지표이므로 하나의 임계값 막대로 비교하지 않습니다."
        >
          {score !== null ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono text-white">{score.toFixed(2)}</span>
              <ValueBadge tone={aiTone}>{AI_LABELS[result.aiStatus]}</ValueBadge>
              <span className="text-[10px] text-[#9CA3AF]">서버 판정 기준 적용</span>
            </div>
          ) : (
            <span className="text-xs font-mono text-[#6B7280]">점수 미산출 —</span>
          )}
        </PanelRow>

        {isHold && (
          <div className="border-t border-amber-500/20 bg-amber-500/5 p-4">
            <div className="text-xs font-semibold text-amber-400">
              {HOLD_POLICY === "ONCHAIN_RECORD"
                ? "HOLD 기록 완료 · 구매 제한"
                : "HOLD · 등록 보류"}
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-[#9CA3AF]">
              {HOLD_POLICY === "ONCHAIN_RECORD"
                ? "등록 결과는 온체인에 기록되지만 라이선스 구매·발급은 진행되지 않습니다."
                : "등록용 서명 발급과 온체인 등록이 진행되지 않습니다."}
            </p>
            <p className="mt-2 text-[9px] text-amber-300/80">
              목표 정책 미리보기 · 현재 백엔드 등록 경로와 다를 수 있음
            </p>
          </div>
        )}
      </section>

      {showTransaction && hash && (
        <div
          className="fixed inset-0 z-[140] flex items-center justify-center bg-black/75 p-6 backdrop-blur-sm"
          onClick={() => setShowTransaction(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg rounded-2xl border border-[#30363d] bg-[#161b22] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  목업 거래 상세
                </h3>
                <p className="mt-1 text-[10px] text-[#9CA3AF]">
                  공개 탐색기가 없는 로컬 네트워크입니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTransaction(false)}
                className="text-xs text-[#9CA3AF] hover:text-white"
              >
                닫기
              </button>
            </div>
            <div className="mt-5 space-y-3 rounded-xl border border-[#21262d] bg-[#0d1117] p-4">
              {[
                ["유형", mode === "REGISTER" ? "음원 등록" : "라이선스 구매"],
                ["네트워크", `${MOCK_NETWORK.name} (${MOCK_NETWORK.chainId})`],
                ["상태", TRANSACTION_LABELS[transactionStatus]],
                ["통화", MOCK_NETWORK.currencySymbol],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 text-xs">
                  <span className="text-[#6B7280]">{label}</span>
                  <span className="font-mono text-white">{value}</span>
                </div>
              ))}
              <div className="border-t border-[#21262d] pt-3">
                <div className="text-[10px] text-[#6B7280]">거래 해시</div>
                <code className="mt-1 block break-all text-[10px] text-blue-400">
                  {hash}
                </code>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
