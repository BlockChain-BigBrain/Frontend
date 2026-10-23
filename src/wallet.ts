export interface WalletProvider {
  request(args: { method: string; params?: unknown[] }): Promise<any>
}
export interface ChainTransaction {
  chainId: string
  from: string
  to: string
  data: string
  value: string
}
export function browserWallet(): WalletProvider {
  const provider = (window as Window & { ethereum?: WalletProvider }).ethereum
  if (!provider)
    throw new Error("MetaMask 등 지갑 확장 프로그램을 설치해 주세요.")
  return provider
}
export async function sendTransaction(
  tx: ChainTransaction,
  provider = browserWallet(),
): Promise<string> {
  if (tx.chainId !== "31337")
    throw new Error("로컬 Hardhat 네트워크만 지원합니다.")
  const chainId = "0x7a69"
  if ((await provider.request({ method: "eth_chainId" })) !== chainId) {
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId }],
      })
    } catch (e: any) {
      if (e.code !== 4902) throw e
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId,
            chainName: "Hardhat localhost",
            nativeCurrency: { name: "Local ETH", symbol: "ETH", decimals: 18 },
            rpcUrls: ["http://127.0.0.1:8545"],
          },
        ],
      })
    }
  }
  if ((await provider.request({ method: "eth_chainId" })) !== chainId)
    throw new Error("Hardhat 네트워크로 전환해 주세요.")
  const accounts = await provider.request({ method: "eth_requestAccounts" })
  if (accounts[0]?.toLowerCase() !== tx.from.toLowerCase())
    throw new Error("계정에 연결한 지갑을 선택해 주세요.")
  const hash = await provider.request({
    method: "eth_sendTransaction",
    params: [
      {
        from: tx.from,
        to: tx.to,
        data: tx.data,
        value: "0x" + BigInt(tx.value).toString(16),
      },
    ],
  })
  if (typeof hash !== "string" || !/^0x[0-9a-f]{64}$/i.test(hash))
    throw new Error("트랜잭션 해시가 올바르지 않습니다.")
  return hash
}
export async function waitForReceipt(
  hash: string,
  provider = browserWallet(),
  timeoutMs = 120000,
) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const receipt = await provider.request({
      method: "eth_getTransactionReceipt",
      params: [hash],
    })
    if (receipt) {
      if (BigInt(receipt.status) !== 1n)
        throw new Error("트랜잭션이 실패했습니다.")
      return receipt
    }
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error(
    "확인을 기다리는 중입니다. 아래 전송 내역에서 다시 확인해 주세요.",
  )
}
