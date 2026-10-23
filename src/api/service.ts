import { browserWallet, waitForReceipt, type WalletProvider } from "../wallet"
export { sendTransaction } from "../wallet"
export type { ChainTransaction } from "../wallet"
import { auth } from "./index"
export const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"
).replace(/\/$/, "")
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}
export async function api(
  path: string,
  data?: unknown,
  method = data === undefined ? "GET" : "POST",
) {
  const res = await auth.apiFetch(path, {
    method,
    ...(data === undefined
      ? {}
      : data instanceof FormData
        ? { body: data }
        : {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }),
  })
  const value = await res.json()
  if (!res.ok)
    throw new ApiError(
      value.error || value.message || `요청 실패 (${res.status})`,
      res.status,
    )
  return value
}
export async function publicApi(path: string) {
  const res = await fetch(API_BASE + path)
  const value = await res.json()
  if (!res.ok)
    throw new ApiError(value.error || "서버 연결을 확인해 주세요.", res.status)
  return value
}
export async function passwordAuth(
  mode: "login" | "signup",
  email: string,
  password: string,
  nickname: string,
) {
  const response = await fetch(
    `${API_BASE}/api/v1/auth/${mode}?target=frontend`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        ...(mode === "signup" ? { nickname } : {}),
      }),
    },
  )
  const value = await response.json()
  if (!response.ok) throw new Error(value.message || "인증에 실패했습니다.")
}
export async function connectWallet(
  provider = browserWallet(),
): Promise<string> {
  const accounts = await provider.request({ method: "eth_requestAccounts" })
  if (!Array.isArray(accounts) || !/^0x[0-9a-f]{40}$/i.test(accounts[0]))
    throw new Error("지갑 계정을 확인해 주세요.")
  const address = accounts[0]
  const challenge = await api("/api/users/me/wallet/challenge", {
    walletAddress: address,
  })
  const messageHex =
    "0x" +
    Array.from(new TextEncoder().encode(challenge.message))
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
  const signature = await provider.request({
    method: "personal_sign",
    params: [messageHex, address],
  })
  await api("/api/users/me/wallet", { signature })
  return address
}
export interface PendingTransaction {
  hash: string
  endpoint: string
  body: Record<string, unknown>
  label: string
}
export const pendingKey = (userId: number) => `track-ai-pending:${userId}`
export function readPending(userId: number): PendingTransaction[] {
  try {
    const value = JSON.parse(localStorage.getItem(pendingKey(userId)) || "[]")
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}
export function savePending(userId: number, item: PendingTransaction) {
  const items = readPending(userId)
  localStorage.setItem(
    pendingKey(userId),
    JSON.stringify([...items.filter((x) => x.hash !== item.hash), item]),
  )
}
export async function confirmPending(
  userId: number,
  pending: PendingTransaction,
) {
  await waitForReceipt(pending.hash)
  const result = await api(pending.endpoint, {
    ...pending.body,
    txHash: pending.hash,
  })
  localStorage.setItem(
    pendingKey(userId),
    JSON.stringify(readPending(userId).filter((x) => x.hash !== pending.hash)),
  )
  return result
}
