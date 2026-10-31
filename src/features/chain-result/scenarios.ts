import type { ChainResult } from "../../shared/types/domain"

export type ScenarioId = "checking" | "success-pass" | "success-warn" | "hold" | "invalid-signature" | "duplicate-fingerprint" | "wallet-rejected" | "contract-revert" | "server-error"

export const SCENARIOS: Record<ScenarioId, { label: string; result: ChainResult }> = {
  checking: {
    label: "검증 중 (CHECKING)",
    result: {
      signatureVerified: null,
      mintStatus: "verifying",
      isHold: false,
      riskVerdict: "CHECKING",
    },
  },
  "success-pass": {
    label: "민팅 성공 (PASS · 0.31)",
    result: {
      signatureVerified: true,
      mintStatus: "success",
      txHash:
        "0x7d2f34e9c2a81b47673f15ad1280d94e42bf1559ef77a422bd7314a8c921a91c",
      tokenId: 3891,
      similarityScore: 0.31,
      isHold: false,
      riskVerdict: "PASS",
    },
  },
  "success-warn": {
    label: "민팅 성공 (WARN · 0.84)",
    result: {
      signatureVerified: true,
      mintStatus: "success",
      txHash:
        "0x6b8d11a495af0c90e6d88ca498dba07ca2de4718060ef31fe17eb5bfa371db83",
      tokenId: 3892,
      similarityScore: 0.84,
      isHold: false,
      riskVerdict: "WARN",
    },
  },
  hold: {
    label: "HOLD · 정산 보류 (0.93)",
    result: {
      signatureVerified: true,
      mintStatus: "success",
      txHash:
        "0x4c19a7e0b2d85f36a1c7e92d0f4b8a6153ce07d9b2a8f41e6d305b9c7a12e4f8",
      tokenId: 3893,
      similarityScore: 0.93,
      isHold: true,
      riskVerdict: "HOLD",
    },
  },
  "invalid-signature": {
    label: "Invalid AI Verification Signature",
    result: {
      signatureVerified: false,
      mintStatus: "rejected",
      rejectReason: "INVALID_AI_SIGNATURE",
      similarityScore: 0.31,
      isHold: false,
      riskVerdict: "PASS",
    },
  },
  "duplicate-fingerprint": {
    label: "동일 지문 감지 (BLOCK)",
    result: {
      signatureVerified: true,
      mintStatus: "rejected",
      rejectReason: "DUPLICATE_FINGERPRINT",
      isHold: false,
      riskVerdict: "BLOCK",
    },
  },
  "wallet-rejected": {
    label: "지갑 거부",
    result: {
      signatureVerified: true,
      mintStatus: "rejected",
      rejectReason: "WALLET_REJECTED",
      similarityScore: 0.31,
      isHold: false,
      riskVerdict: "PASS",
    },
  },
  "contract-revert": {
    label: "컨트랙트 revert",
    result: {
      signatureVerified: true,
      mintStatus: "rejected",
      rejectReason: "CONTRACT_REVERT",
      rejectDetail:
        "execution reverted: TrackLicense__SettlementTransferFailed()",
      similarityScore: 0.31,
      isHold: false,
      riskVerdict: "PASS",
    },
  },
  "server-error": {
    label: "검증 서버 오류 (ERROR)",
    result: {
      signatureVerified: null,
      mintStatus: "idle",
      isHold: false,
      riskVerdict: "ERROR",
    },
  },
}
