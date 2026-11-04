export const THRESHOLD = {
  // Legacy UI fallback only. Do not use these to classify live AI results.
  warn: 0.8,
  hold: 0.85,
} as const

export const HOLD_POLICY: "ONCHAIN_RECORD" | "BLOCK_BEFORE_REGISTER" =
  "ONCHAIN_RECORD"

export const AI_POLICY = {
  model: "laion/clap-htsat-unfused",
  embeddingDimensions: 512,
  metric: "CLAP 후보 검색 + temporal verifier",
  scoreVersion: "hybrid_query_top3_pairwise_hold-v5",
  decisionPolicyVersion: "track-ai-balanced-policy-v5-20261102",
  comparisonScope: "등록 음원 벡터 DB",
} as const

export const MOCK_NETWORK = {
  name: "Hardhat Local",
  chainId: 31337,
  currencySymbol: "ETH",
} as const
