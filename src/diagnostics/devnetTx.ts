import {
  type Connection,
  LAMPORTS_PER_SOL,
  type PublicKey,
  SystemProgram,
  TransactionMessage,
  type TransactionSignature,
  VersionedTransaction,
} from "@solana/web3.js";

export const SELF_TRANSFER_SOL = 0.001;
export const AIRDROP_SOL = 1;
// Enough for the transfer plus fees; below this we ask for an airdrop first.
export const MIN_BALANCE_LAMPORTS = 0.01 * LAMPORTS_PER_SOL;
export const DEVNET_FAUCET_URL = "https://faucet.solana.com";

export function explorerTxUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

/** Airdrops devnet SOL if the balance is low. Returns false when the faucet refuses (often rate-limited). */
export async function ensureDevnetBalance(
  connection: Connection,
  owner: PublicKey,
): Promise<boolean> {
  const balance = await connection.getBalance(owner, "confirmed");
  if (balance >= MIN_BALANCE_LAMPORTS) return true;
  try {
    const latest = await connection.getLatestBlockhash();
    const signature = await connection.requestAirdrop(owner, AIRDROP_SOL * LAMPORTS_PER_SOL);
    await connection.confirmTransaction({ signature, ...latest }, "confirmed");
    return true;
  } catch (error: unknown) {
    console.warn("Devnet airdrop failed", error);
    return false;
  }
}

/** Builds 0.001 SOL to self, has the wallet sign and send it over MWA, then waits for confirmation. */
export async function sendSelfTransfer(
  connection: Connection,
  owner: PublicKey,
  signAndSend: (tx: VersionedTransaction, minContextSlot: number) => Promise<TransactionSignature>,
): Promise<TransactionSignature> {
  const {
    context: { slot: minContextSlot },
    value: latest,
  } = await connection.getLatestBlockhashAndContext();
  const message = new TransactionMessage({
    payerKey: owner,
    recentBlockhash: latest.blockhash,
    instructions: [
      SystemProgram.transfer({
        fromPubkey: owner,
        toPubkey: owner,
        lamports: SELF_TRANSFER_SOL * LAMPORTS_PER_SOL,
      }),
    ],
  }).compileToLegacyMessage();
  const signature = await signAndSend(new VersionedTransaction(message), minContextSlot);
  const result = await connection.confirmTransaction({ signature, ...latest }, "confirmed");
  if (result.value.err) {
    throw new Error(`Transaction failed on-chain: ${JSON.stringify(result.value.err)}`);
  }
  return signature;
}
