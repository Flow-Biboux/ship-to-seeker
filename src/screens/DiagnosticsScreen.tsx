import React, { useCallback, useEffect, useState } from "react";
import { Linking, ScrollView, StyleSheet } from "react-native";
import { Button, Card, Chip, Text } from "react-native-paper";
import { ScreenIntro } from "../components/ScreenIntro";
import {
  RPC_UNREACHABLE_HINT,
  checkDevnetRpcHealth,
  type DevnetRpcChip,
} from "../diagnostics/devnetRpc";
import {
  DEVNET_FAUCET_URL,
  ensureDevnetBalance,
  explorerTxUrl,
  sendSelfTransfer,
} from "../diagnostics/devnetTx";
import { findSgtMint } from "../diagnostics/sgt";
import { useConnection } from "../utils/ConnectionProvider";
import { ellipsify } from "../utils/ellipsify";
import { useAuthorization } from "../utils/useAuthorization";
import { useMobileWallet } from "../utils/useMobileWallet";
import { useProgress } from "../xp/ProgressContext";

type Status = "idle" | "checking" | "pass" | "fail" | "absent";

const SCREEN_PADDING = 16;
const CARD_GAP = 12;
const CHIP_PASS = "#1B7F3A";
const CHIP_FAIL = "#B42318";
const CHIP_NEUTRAL = "#5C6570";
const CHIP_LABEL = "#FFFFFF";

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function StatusChip({
  status,
  pass,
  fail,
  absent = "Not on this wallet",
}: {
  status: Status;
  pass: string;
  fail: string;
  absent?: string;
}) {
  const label =
    status === "checking"
      ? "Checking"
      : status === "pass"
        ? pass
        : status === "fail"
          ? fail
          : status === "absent"
            ? absent
            : "Not run";
  const color = status === "pass" ? CHIP_PASS : status === "fail" ? CHIP_FAIL : CHIP_NEUTRAL;
  return (
    <Chip style={[styles.chip, { backgroundColor: color }]} textStyle={styles.chipText}>
      {label}
    </Chip>
  );
}

export function DiagnosticsScreen() {
  const { setRpcVerified, setTxVerified, setSgtVerified } = useProgress();
  const { selectedAccount } = useAuthorization();
  const { connect, disconnect, signAndSendTransaction } = useMobileWallet();
  const { connection } = useConnection();

  const [rpcAttempt, setRpcAttempt] = useState(0);
  const [rpc, setRpc] = useState<Status>("checking");

  const [wallet, setWallet] = useState<Status>("idle");
  const [walletHint, setWalletHint] = useState<string | null>(null);

  const [tx, setTx] = useState<Status>("idle");
  const [txHint, setTxHint] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [needsFaucet, setNeedsFaucet] = useState(false);

  const [sgt, setSgt] = useState<Status>("idle");
  const [sgtHint, setSgtHint] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRpc("checking");
    checkDevnetRpcHealth()
      .then((next: DevnetRpcChip) => {
        if (cancelled) return;
        setRpc(next === "connected" ? "pass" : "fail");
        setRpcVerified(next === "connected");
      })
      .catch((error: unknown) => {
        console.warn("Devnet RPC check did not settle", error);
        if (cancelled) return;
        setRpc("fail");
        setRpcVerified(false);
      });
    return () => {
      cancelled = true;
    };
  }, [rpcAttempt]);

  useEffect(() => {
    if (selectedAccount) {
      setWallet("pass");
      setWalletHint(null);
    }
  }, [selectedAccount]);

  const connectWallet = useCallback(async () => {
    setWallet("checking");
    setWalletHint(null);
    try {
      await connect();
      setWallet("pass");
    } catch (error: unknown) {
      setWallet("fail");
      const message = errorText(error);
      setWalletHint(
        /not ?found|no wallet|ActivityNotFound/i.test(message)
          ? "No Mobile Wallet Adapter wallet on this device. On an emulator, install an MWA wallet APK. On Seeker, use Seed Vault Wallet."
          : /declin|reject|cancel/i.test(message)
            ? "The wallet request was declined. Tap Connect again and approve it."
            : `The wallet didn't connect: ${message}. If you opened this in Expo Go, use a development build instead.`,
      );
    }
  }, [connect]);

  const disconnectWallet = useCallback(async () => {
    setWallet("checking");
    setWalletHint(null);
    try {
      await disconnect();
      setWallet("idle");
    } catch (error: unknown) {
      setWallet(selectedAccount ? "pass" : "fail");
      setWalletHint(`The wallet didn't disconnect: ${errorText(error)}.`);
    }
  }, [disconnect, selectedAccount]);

  const runTx = useCallback(async () => {
    if (!selectedAccount) return;
    setTx("checking");
    setTxHint(null);
    setTxSignature(null);
    setNeedsFaucet(false);
    try {
      const funded = await ensureDevnetBalance(connection, selectedAccount.publicKey);
      if (!funded) {
        setTx("fail");
        setNeedsFaucet(true);
        setTxHint(
          "The devnet airdrop was refused, usually because of rate limiting. Get devnet SOL from the faucet, then try again.",
        );
        setTxVerified(false);
        return;
      }
      const signature = await sendSelfTransfer(
        connection,
        selectedAccount.publicKey,
        signAndSendTransaction,
      );
      setTxSignature(signature);
      setTx("pass");
      setTxVerified(true);
    } catch (error: unknown) {
      const message = errorText(error);
      setTx("fail");
      setTxVerified(false);
      setTxHint(
        /blockhash/i.test(message)
          ? "The transaction expired before it was signed. Approve it faster in the wallet, then retry."
          : /insufficient|0x1\b/i.test(message)
            ? "Not enough devnet SOL. Use the faucet, then retry."
            : /declin|reject|cancel/i.test(message)
              ? "The transaction was declined in the wallet. Retry and approve it."
              : `The transaction failed: ${message}`,
      );
    }
  }, [connection, selectedAccount, signAndSendTransaction]);

  const runSgt = useCallback(async () => {
    if (!selectedAccount) return;
    setSgt("checking");
    setSgtHint(null);
    try {
      const mint = await findSgtMint(selectedAccount.publicKey.toBase58());
      if (mint) {
        setSgt("pass");
        setSgtHint(`Seeker Genesis Token ${ellipsify(mint, 4)} found.`);
        setSgtVerified(true);
      } else {
        setSgt("absent");
        setSgtHint(
          "No Seeker Genesis Token on this wallet. It sits in the Seed Vault primary account.",
        );
        setSgtVerified(false);
      }
    } catch (error: unknown) {
      setSgt("fail");
      setSgtHint(`Couldn't read mainnet right now (${errorText(error)}). Try again in a minute.`);
    }
  }, [selectedAccount]);

  const walletLabel = selectedAccount ? ellipsify(selectedAccount.publicKey.toBase58(), 4) : null;

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <ScreenIntro title="Diagnostics" subtitle="Check your Solana Mobile setup" />

      <Card mode="outlined">
        <Card.Title title="Devnet RPC" subtitle="getHealth on api.devnet.solana.com" />
        <Card.Content>
          <StatusChip status={rpc} pass="Connected" fail="Unreachable" />
          {rpc === "fail" ? (
            <Text variant="bodyMedium" style={styles.hint}>
              {RPC_UNREACHABLE_HINT}
            </Text>
          ) : null}
        </Card.Content>
        <Card.Actions>
          <Button
            mode="contained-tonal"
            onPress={() => setRpcAttempt((n) => n + 1)}
            disabled={rpc === "checking"}
            loading={rpc === "checking"}
          >
            Retry
          </Button>
        </Card.Actions>
      </Card>

      <Card mode="outlined">
        <Card.Title title="Wallet" subtitle="Mobile Wallet Adapter (Seed Vault on Seeker)" />
        <Card.Content>
          <StatusChip status={wallet} pass="Connected" fail="Not connected" />
          {walletLabel ? (
            <Text variant="bodyMedium" style={styles.hint}>
              {walletLabel}
            </Text>
          ) : null}
          {walletHint ? (
            <Text variant="bodyMedium" style={styles.hint}>
              {walletHint}
            </Text>
          ) : null}
        </Card.Content>
        <Card.Actions>
          <Button
            mode="contained-tonal"
            onPress={() => {
              const action = selectedAccount ? disconnectWallet() : connectWallet();
              action.catch((e: unknown) => console.warn("Wallet action failed", e));
            }}
            loading={wallet === "checking"}
            disabled={wallet === "checking"}
          >
            {selectedAccount ? "Disconnect" : "Connect"}
          </Button>
        </Card.Actions>
      </Card>

      <Card mode="outlined">
        <Card.Title title="Devnet transaction" subtitle="Airdrop if needed, then 0.001 SOL to yourself" />
        <Card.Content>
          <StatusChip status={tx} pass="Confirmed" fail="Failed" />
          {!selectedAccount ? (
            <Text variant="bodyMedium" style={styles.hint}>
              Connect a wallet first.
            </Text>
          ) : null}
          {txHint ? (
            <Text variant="bodyMedium" style={styles.hint}>
              {txHint}
            </Text>
          ) : null}
        </Card.Content>
        <Card.Actions>
          {txSignature ? (
            <Button onPress={() => Linking.openURL(explorerTxUrl(txSignature))}>Explorer</Button>
          ) : null}
          {needsFaucet ? (
            <Button onPress={() => Linking.openURL(DEVNET_FAUCET_URL)}>Faucet</Button>
          ) : null}
          <Button
            mode="contained-tonal"
            onPress={() => {
              runTx().catch((e: unknown) => console.warn("Transaction check failed", e));
            }}
            loading={tx === "checking"}
            disabled={!selectedAccount || tx === "checking"}
          >
            Send
          </Button>
        </Card.Actions>
      </Card>

      <Card mode="outlined">
        <Card.Title title="Seeker Genesis Token" subtitle="Mainnet read for the connected wallet" />
        <Card.Content>
          <StatusChip status={sgt} pass="Verified" fail="Couldn't check" absent="Not on this wallet" />
          {!selectedAccount ? (
            <Text variant="bodyMedium" style={styles.hint}>
              Connect a wallet first.
            </Text>
          ) : null}
          {sgtHint ? (
            <Text variant="bodyMedium" style={styles.hint}>
              {sgtHint}
            </Text>
          ) : null}
        </Card.Content>
        <Card.Actions>
          <Button
            mode="contained-tonal"
            onPress={() => {
              runSgt().catch((e: unknown) => console.warn("SGT check failed", e));
            }}
            loading={sgt === "checking"}
            disabled={!selectedAccount || sgt === "checking"}
          >
            Check
          </Button>
        </Card.Actions>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: SCREEN_PADDING,
    paddingBottom: 32,
    gap: CARD_GAP,
  },
  chip: {
    alignSelf: "flex-start",
  },
  chipText: {
    color: CHIP_LABEL,
  },
  hint: {
    marginTop: 12,
  },
});
