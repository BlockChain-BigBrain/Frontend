import { test } from "node:test"
import assert from "node:assert/strict"
import {
  sendTransaction,
  waitForReceipt,
  type WalletProvider,
} from "../src/wallet.ts"
const from = "0x" + "1".repeat(40),
  hash = "0x" + "a".repeat(64),
  tx = {
    chainId: "31337",
    from,
    to: "0x" + "2".repeat(40),
    data: "0x1234",
    value: "101",
  }
test("wallet submits exact backend calldata/from/value only on expected chain", async () => {
  const sent: any[] = []
  const wallet: WalletProvider = {
    request: async (a) => {
      sent.push(a)
      if (a.method === "eth_chainId") return "0x7a69"
      if (a.method === "eth_requestAccounts") return [from]
      return hash
    },
  }
  assert.equal(await sendTransaction(tx, wallet), hash)
  assert.deepEqual(sent.at(-1), {
    method: "eth_sendTransaction",
    params: [{ from, to: tx.to, data: tx.data, value: "0x65" }],
  })
})
test("wrong account or nonlocal network never sends a transaction", async () => {
  let sent = false
  const wallet: WalletProvider = {
    request: async (a) => {
      if (a.method === "eth_chainId") return "0x7a69"
      if (a.method === "eth_requestAccounts") return ["0x" + "3".repeat(40)]
      sent = true
    },
  }
  await assert.rejects(sendTransaction(tx, wallet), /지갑/)
  await assert.rejects(
    sendTransaction({ ...tx, chainId: "80002" }, wallet),
    /Hardhat/,
  )
  assert.equal(sent, false)
})
test("wallet rejection propagates instead of faking completion", async () => {
  const wallet: WalletProvider = {
    request: async (a) => {
      if (a.method === "eth_chainId") return "0x1"
      throw Object.assign(new Error("rejected"), { code: 4001 })
    },
  }
  await assert.rejects(sendTransaction(tx, wallet), /rejected/)
})
test("adding a local chain still verifies the selected chain before sending", async () => {
  let chain = "0x1",
    sent = false
  const wallet: WalletProvider = {
    request: async (a) => {
      if (a.method === "eth_chainId") return chain
      if (a.method === "wallet_switchEthereumChain")
        throw Object.assign(new Error(), { code: 4902 })
      if (a.method === "wallet_addEthereumChain") return
      sent = true
    },
  }
  await assert.rejects(sendTransaction(tx, wallet), /전환/)
  assert.equal(sent, false)
})
test("only successful mined receipts complete; reverted receipts and timeout fail", async () => {
  assert.equal(
    (
      await waitForReceipt(hash, {
        request: async () => ({ status: "0x1", transactionHash: hash }),
      })
    ).status,
    "0x1",
  )
  await assert.rejects(
    waitForReceipt(hash, { request: async () => ({ status: "0x0" }) }),
    /실패/,
  )
  await assert.rejects(
    waitForReceipt(hash, { request: async () => null }, 0),
    /기다리는/,
  )
})
