export type MintStatus = "idle" | "verifying" | "success" | "rejected"

export type RejectReason = "INVALID_AI_SIGNATURE" | "SIGNATURE_EXPIRED" | "NONCE_ALREADY_USED" | "DUPLICATE_FINGERPRINT" | "WALLET_REJECTED" | "WRONG_NETWORK" | "CONTRACT_REVERT"

export interface ChainResult {
  signatureVerified: boolean | null
  mintStatus: MintStatus
  rejectReason?: RejectReason
  rejectDetail?: string
  txHash?: string
  tokenId?: number
  similarityScore?: number
  isHold: boolean
  riskVerdict: "PASS" | "WARN" | "HOLD" | "BLOCK" | "ERROR" | "CHECKING"
}

export type Screen = "marketplace" | "upload" | "detail" | "dashboard" | "checkout" | "certificate"
export type LicenseType = "standard" | "exclusive"
