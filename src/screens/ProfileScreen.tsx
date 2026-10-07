import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Chip, ProgressBar, Text } from "react-native-paper";
import { ScreenIntro } from "../components/ScreenIntro";
import { BUILD_MODULES } from "../buildPath/modules";
import { useAuthorization } from "../utils/useAuthorization";
import { ellipsify } from "../utils/ellipsify";
import { fetchRemoteXp } from "../xp/syncXp";
import { computeXp, levelForXp } from "../xp/progress";
import { useProgress } from "../xp/ProgressContext";

const SCREEN_PADDING = 16;

export function ProfileScreen() {
  const { selectedAccount } = useAuthorization();
  const { progress, xp } = useProgress();
  const level = levelForXp(xp);
  const [remote, setRemote] = useState<number | null>(null);
  const progressRatio = level.span <= 0 ? 1 : level.intoLevel / level.span;

  useEffect(() => {
    if (!selectedAccount) {
      setRemote(null);
      return;
    }
    let cancelled = false;
    fetchRemoteXp(selectedAccount.publicKey.toBase58()).then((value) => {
      if (!cancelled) setRemote(value);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedAccount, xp]);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <ScreenIntro title="Profile" subtitle="On this phone, plus a demo XP board" />
      <Text variant="headlineSmall">{level.name}</Text>
      <Text variant="bodyMedium" style={styles.meta}>
        {xp} XP
        {level.nextMin != null ? ` · next ${level.nextMin}` : " · max"}
      </Text>
      <ProgressBar progress={progressRatio} style={styles.bar} />
      <Text variant="titleMedium" style={styles.block}>
        Wallet
      </Text>
      <Text variant="bodyLarge">
        {selectedAccount
          ? ellipsify(selectedAccount.publicKey.toBase58(), 4)
          : "Connect on Diagnostics"}
      </Text>
      {selectedAccount && remote != null && remote !== xp ? (
        <Text variant="bodySmall" style={styles.meta}>
          Board has {remote} XP (local {xp})
        </Text>
      ) : null}
      <Text variant="titleMedium" style={styles.block}>
        Verified checks
      </Text>
      <View style={styles.chips}>
        <Chip selected={progress.rpcVerified}>Devnet RPC</Chip>
        <Chip selected={progress.walletVerified}>Wallet</Chip>
        <Chip selected={progress.txVerified}>Devnet tx</Chip>
        <Chip selected={progress.sgtVerified}>SGT</Chip>
      </View>
      <Text variant="titleMedium" style={styles.block}>
        Guides done
      </Text>
      {BUILD_MODULES.map((module) => (
        <Text key={module.id} variant="bodyMedium">
          {progress.completedGuideIds.includes(module.id) ? "✓" : "○"} {module.id}{" "}
          {module.title}
        </Text>
      ))}
      <Text variant="bodySmall" style={styles.meta}>
        Local total {computeXp(progress)} XP. No SOL payouts in this app.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: SCREEN_PADDING, paddingBottom: 40 },
  meta: { marginTop: 6, opacity: 0.75 },
  bar: { marginTop: 12, height: 8, borderRadius: 4 },
  block: { marginTop: 20, marginBottom: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
