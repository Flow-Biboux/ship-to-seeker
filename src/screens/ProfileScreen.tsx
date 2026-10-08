import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Card, ProgressBar, Text } from "react-native-paper";
import { ScreenIntro } from "../components/ScreenIntro";
import { BUILD_MODULES } from "../buildPath/modules";
import { useAuthorization } from "../utils/useAuthorization";
import { ellipsify } from "../utils/ellipsify";
import { DIAGNOSTIC_CHECKS, levelForXp, summarizeProgress } from "../xp/progress";
import { useProgress } from "../xp/ProgressContext";

const SCREEN_PADDING = 16;
const CARD_GAP = 12;
const ACCENT = "#9945ff";
const DONE = "#00ffbd";
const PANEL = "#12101c";
const MUTED = "rgba(249,250,251,0.72)";

export function ProfileScreen() {
  const { selectedAccount } = useAuthorization();
  const { progress, xp } = useProgress();
  const level = levelForXp(xp);
  const summary = summarizeProgress(progress);
  const progressRatio = level.span <= 0 ? 1 : level.intoLevel / level.span;
  const address = selectedAccount
    ? ellipsify(selectedAccount.publicKey.toBase58(), 4)
    : null;

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <ScreenIntro
        title="Profile"
        subtitle="This phone's wallet and what you've finished"
      />

      <Card mode="outlined" style={styles.card}>
        <Card.Title title="Wallet" subtitle="Connected on Diagnostics" />
        <Card.Content>
          {address ? (
            <Text variant="headlineSmall">{address}</Text>
          ) : (
            <Text variant="bodyLarge">
              No wallet yet. Open Diagnostics and connect so this profile knows who is building.
            </Text>
          )}
        </Card.Content>
      </Card>

      <Card mode="outlined" style={styles.card}>
        <Card.Title title={level.name} subtitle={`${xp} XP on this phone`} />
        <Card.Content>
          <ProgressBar
            progress={progressRatio}
            color={ACCENT}
            style={styles.bar}
          />
          <Text variant="bodyMedium" style={styles.meta}>
            {level.nextMin != null
              ? `${xp} of ${level.nextMin} XP to the next level`
              : "Highest level in this app"}
          </Text>
          <Text variant="bodyLarge" style={styles.meaning}>
            {summary.meaning}
          </Text>
          <Text variant="bodySmall" style={styles.meta}>
            XP is stored on this phone. Finishing a module or verifying a check is what raises it.
          </Text>
        </Card.Content>
      </Card>

      <Card mode="outlined" style={styles.card}>
        <Card.Title
          title="Build path"
          subtitle={`${summary.modulesDone} of ${summary.modulesTotal} modules`}
        />
        <Card.Content style={styles.list}>
          {BUILD_MODULES.map((module) => {
            const done = progress.completedGuideIds.includes(module.id);
            return (
              <View key={module.id} style={styles.row}>
                <Text style={[styles.mark, { color: done ? DONE : MUTED }]}>
                  {done ? "Done" : "Left"}
                </Text>
                <Text variant="bodyMedium" style={styles.rowLabel}>
                  {module.id} {module.title}
                </Text>
              </View>
            );
          })}
        </Card.Content>
      </Card>

      <Card mode="outlined" style={styles.card}>
        <Card.Title
          title="Diagnostics"
          subtitle={`${summary.checksDone} of ${summary.checksTotal} checks verified`}
        />
        <Card.Content style={styles.list}>
          {DIAGNOSTIC_CHECKS.map((check) => {
            const done = progress[check.key] === true;
            return (
              <View key={check.key} style={styles.row}>
                <Text style={[styles.mark, { color: done ? DONE : MUTED }]}>
                  {done ? "Done" : "Left"}
                </Text>
                <Text variant="bodyMedium" style={styles.rowLabel}>
                  {check.label}
                </Text>
              </View>
            );
          })}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: SCREEN_PADDING, paddingBottom: 40, gap: CARD_GAP },
  card: { backgroundColor: PANEL },
  meta: { marginTop: 8, color: MUTED },
  meaning: { marginTop: 12 },
  bar: { marginTop: 4, height: 8, borderRadius: 4 },
  list: { gap: 10 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  mark: { width: 44, fontWeight: "700" },
  rowLabel: { flex: 1 },
});
