export const THRESHOLD = {
  warn: 0.8,
  hold: 0.9,
} as const

export const HOLD_POLICY: "ONCHAIN_RECORD" | "BLOCK_BEFORE_REGISTER" =
  "ONCHAIN_RECORD"

export const AI_POLICY = {
  model: "LAION-CLAP",
  embeddingDimensions: 512,
  metric: "Cosine Similarity",
  comparisonScope: "등록 음원 벡터 DB",
} as const

export const MOCK_NETWORK = {
  name: "Hardhat Local",
  chainId: 31337,
  currencySymbol: "ETH",
} as const
