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
const STATUS_POLL_MS = 1000;
const CONFIRM_DEADLINE_MS = 90_000;

export class SignatureNeverLandedError extends Error {
  readonly signature: string;

  constructor(signature: string) {
    super(`Signature ${signature} never landed before the blockhash expired.`);
    this.name = "SignatureNeverLandedError";
    this.signature = signature;
  }
}

type SignatureStatusReader = {
  getSignatureStatuses: Connection["getSignatureStatuses"];
  getTransaction: Connection["getTransaction"];
  getBlockHeight: Connection["getBlockHeight"];
};

type Landing = "landed" | "failed" | "missing";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** confirmed/finalized with no on-chain error. `processed` is not enough. */
export function isLandedStatus(status: {
  confirmationStatus?: string | null;
  err: unknown;
} | null): boolean {
  if (!status || status.err) return false;
  return status.confirmationStatus === "confirmed" || status.confirmationStatus === "finalized";
}

export async function readSignatureLanding(
  connection: Pick<SignatureStatusReader, "getSignatureStatuses" | "getTransaction">,
  signature: string,
): Promise<{ landing: Landing; err: unknown }> {
  const statuses = await connection.getSignatureStatuses([signature], {
    searchTransactionHistory: true,
  });
  const status = statuses.value[0] ?? null;
  if (status?.err) return { landing: "failed", err: status.err };
  if (isLandedStatus(status)) return { landing: "landed", err: null };

  const tx = await connection.getTransaction(signature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });
  if (!tx) return { landing: "missing", err: null };
  if (tx.meta?.err) return { landing: "failed", err: tx.meta.err };
  return { landing: "landed", err: null };
}

/**
 * Polls signature status until confirmed/finalized.
 * A lastValidBlockHeight that has already passed is not a failure if the signature is on-chain.
 */
export async function confirmSignatureLanded(
  connection: SignatureStatusReader,
  signature: string,
  lastValidBlockHeight: number,
  now: () => number = Date.now,
): Promise<void> {
  const deadline = now() + CONFIRM_DEADLINE_MS;
  for (;;) {
    const reading = await readSignatureLanding(connection, signature);
    if (reading.landing === "landed") return;
    if (reading.landing === "failed") {
      throw new Error(`Transaction failed on-chain: ${JSON.stringify(reading.err)}`);
    }

    let blockHeight = -1;
    try {
      blockHeight = await connection.getBlockHeight("confirmed");
    } catch (error: unknown) {
      console.warn("getBlockHeight failed while confirming", error);
    }

    const expired = blockHeight > lastValidBlockHeight || now() >= deadline;
    if (expired) {
      const again = await readSignatureLanding(connection, signature);
      if (again.landing === "landed") return;
      if (again.landing === "failed") {
        throw new Error(`Transaction failed on-chain: ${JSON.stringify(again.err)}`);
      }
      throw new SignatureNeverLandedError(signature);
    }

    await sleep(STATUS_POLL_MS);
  }
}

export function devnetTxFailureHint(message: string): string {
  if (/never landed/i.test(message)) {
    return "The transaction was sent, but it never landed before the blockhash expired. Retry the send.";
  }
  if (/blockhash/i.test(message)) {
    return "The transaction expired before it was signed. Approve it faster in the wallet, then retry.";
  }
  if (/insufficient|0x1\b/i.test(message)) {
    return "Not enough devnet SOL. Use the faucet, then retry.";
  }
  if (/declin|reject|cancel/i.test(message)) {
    return "The transaction was declined in the wallet. Retry and approve it.";
  }
  return `The transaction failed: ${message}`;
}

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
    await confirmSignatureLanded(connection, signature, latest.lastValidBlockHeight);
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
  await confirmSignatureLanded(connection, signature, latest.lastValidBlockHeight);
  return signature;
}
