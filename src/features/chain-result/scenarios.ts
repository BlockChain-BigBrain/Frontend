import { HOLD_POLICY } from "../../shared/config/constants"
import type { ChainResult } from "../../shared/types/domain"

export type ScenarioId =
  | "checking"
  | "success-pass"
  | "success-warn"
  | "confirming"
  | "hold"
  | "invalid-signature"
  | "duplicate-fingerprint"
  | "wallet-rejected"
  | "contract-revert"
  | "server-error"

const registrationTxHash =
  "0x7d2f34e9c2a81b47673f15ad1280d94e42bf1559ef77a422bd7314a8c921a91c"
const purchaseTxHash =
  "0x6b8d11a495af0c90e6d88ca498dba07ca2de4718060ef31fe17eb5bfa371db83"
const confirmingPurchaseTxHash =
  "0xc74a11e495af0c90e6d88ca498dba07ca2de4718060ef31fe17eb5bfa371ce52"
const holdIsRecorded = HOLD_POLICY === "ONCHAIN_RECORD"

export const SCENARIOS: Record<
  ScenarioId,
  { label: string; result: ChainResult }
> = {
  checking: {
    label: "분석 중 (CHECKING)",
    result: {
      aiStatus: "ANALYZING",
      eip712Status: "NOT_REQUESTED",
      registrationTxPhase: "PRE_SUBMISSION",
      registrationStatus: "NOT_SENT",
      purchaseTxPhase: "PRE_SUBMISSION",
      purchaseStatus: "NOT_SENT",
    },
  },
  "success-pass": {
    label: "등록·발급 성공 (PASS · 0.31)",
    result: {
      aiStatus: "PASS",
      eip712Status: "VERIFIED",
      registrationTxPhase: "POST_SUBMISSION",
      registrationStatus: "SUCCESS",
      purchaseTxPhase: "POST_SUBMISSION",
      purchaseStatus: "SUCCESS",
      registrationTxHash,
      purchaseTxHash,
      onchainTrackId: 1247,
      tokenId: 1247,
      similarityScore: 0.31,
    },
  },
  "success-warn": {
    label: "등록·발급 성공 (WARN · 0.84)",
    result: {
      aiStatus: "WARN",
      eip712Status: "VERIFIED",
      registrationTxPhase: "POST_SUBMISSION",
      registrationStatus: "SUCCESS",
      purchaseTxPhase: "POST_SUBMISSION",
      purchaseStatus: "SUCCESS",
      registrationTxHash:
        "0x83dfe4a495af0c90e6d88ca498dba07ca2de4718060ef31fe17eb5bfa371aa12",
      purchaseTxHash:
        "0x923b4fa9c2a81b47673f15ad1280d94e42bf1559ef77a422bd7314a8c921bc41",
      onchainTrackId: 1248,
      tokenId: 1248,
      similarityScore: 0.84,
    },
  },
  confirming: {
    label: "구매 확인 대기 (PASS)",
    result: {
      aiStatus: "PASS",
      eip712Status: "VERIFIED",
      registrationTxPhase: "POST_SUBMISSION",
      registrationStatus: "SUCCESS",
      purchaseTxPhase: "POST_SUBMISSION",
      purchaseStatus: "CONFIRMING",
      registrationTxHash,
      purchaseTxHash: confirmingPurchaseTxHash,
      onchainTrackId: 1247,
      similarityScore: 0.31,
    },
  },
  hold: {
    label: holdIsRecorded
      ? "HOLD 기록 완료 · 구매 제한 (0.93)"
      : "HOLD · 등록 보류 (0.93)",
    result: {
      aiStatus: "HOLD",
      eip712Status: holdIsRecorded ? "VERIFIED" : "NOT_REQUESTED",
      registrationTxPhase: holdIsRecorded
        ? "POST_SUBMISSION"
        : "PRE_SUBMISSION",
      registrationStatus: holdIsRecorded ? "SUCCESS" : "POLICY_BLOCKED",
      purchaseTxPhase: "PRE_SUBMISSION",
      purchaseStatus: "POLICY_BLOCKED",
      ...(holdIsRecorded
        ? {
            registrationTxHash:
              "0x4c19a7e0b2d85f36a1c7e92d0f4b8a6153ce07d9b2a8f41e6d305b9c7a12e4f8",
            onchainTrackId: 1249,
          }
        : {}),
      failureReason: "HOLD_PURCHASE_RESTRICTED",
      failureTarget: "PURCHASE",
      similarityScore: 0.93,
    },
  },
  "invalid-signature": {
    label: "검증 서버 서명 불일치",
    result: {
      aiStatus: "PASS",
      eip712Status: "FAILED",
      registrationTxPhase: "PRE_SUBMISSION",
      registrationStatus: "NOT_SENT",
      purchaseTxPhase: "PRE_SUBMISSION",
      purchaseStatus: "NOT_SENT",
      failureReason: "AI_SIGNATURE_MISMATCH",
      failureTarget: "BOTH",
      similarityScore: 0.31,
    },
  },
  "duplicate-fingerprint": {
    label: "동일 지문 감지 (BLOCK)",
    result: {
      aiStatus: "BLOCK",
      eip712Status: "NOT_REQUESTED",
      registrationTxPhase: "PRE_SUBMISSION",
      registrationStatus: "POLICY_BLOCKED",
      purchaseTxPhase: "PRE_SUBMISSION",
      purchaseStatus: "POLICY_BLOCKED",
      failureReason: "DUPLICATE_FINGERPRINT",
      failureTarget: "REGISTER",
    },
  },
  "wallet-rejected": {
    label: "사용자 승인 취소",
    result: {
      aiStatus: "PASS",
      eip712Status: "VERIFIED",
      registrationTxPhase: "POST_SUBMISSION",
      registrationStatus: "SUCCESS",
      purchaseTxPhase: "PRE_SUBMISSION",
      purchaseStatus: "USER_CANCELLED",
      failureReason: "USER_CANCELLED",
      failureTarget: "PURCHASE",
      registrationTxHash,
      onchainTrackId: 1247,
      similarityScore: 0.31,
    },
  },
  "contract-revert": {
    label: "전송 후 결제 금액 불일치",
    result: {
      aiStatus: "PASS",
      eip712Status: "VERIFIED",
      registrationTxPhase: "POST_SUBMISSION",
      registrationStatus: "SUCCESS",
      purchaseTxPhase: "POST_SUBMISSION",
      purchaseStatus: "CONTRACT_REJECTED",
      failureReason: "PAYMENT_AMOUNT_MISMATCH",
      failureTarget: "PURCHASE",
      failureDetail:
        "execution reverted: IncorrectPayment(expected: 50000000000000000000, actual: 49000000000000000000)",
      registrationTxHash,
      purchaseTxHash:
        "0xa91be7e0b2d85f36a1c7e92d0f4b8a6153ce07d9b2a8f41e6d305b9c7a12d321",
      onchainTrackId: 1247,
      similarityScore: 0.31,
    },
  },
  "server-error": {
    label: "검증 서버 오류 (ERROR)",
    result: {
      aiStatus: "ERROR",
      eip712Status: "NOT_REQUESTED",
      registrationTxPhase: "PRE_SUBMISSION",
      registrationStatus: "ERROR",
      purchaseTxPhase: "PRE_SUBMISSION",
      purchaseStatus: "ERROR",
      failureReason: "SERVER_ERROR",
      failureTarget: "BOTH",
    },
  },
}

export function resolveConfirmingPurchase(result: ChainResult): ChainResult {
  if (result.purchaseStatus !== "CONFIRMING") return result

  return {
    ...result,
    purchaseStatus: "SUCCESS",
    tokenId: result.onchainTrackId,
  }
}
