import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, ProgressBar, Text, TextInput } from "react-native-paper";
import { ScreenIntro } from "../components/ScreenIntro";
import { BUILD_MODULES } from "../buildPath/modules";
import {
  CLOCK_IN_CLOSE_LABEL,
  EMPTY_SUBMISSION_URLS,
  SUBMISSION_URLS_KEY,
  buildChecklist,
  parseSubmissionUrls,
  probeHttpsUrl,
  type ChecklistReport,
  type ProbeMap,
  type SubmissionUrls,
} from "../submission/checklist";
import { useAuthorization } from "../utils/useAuthorization";
import { ellipsify } from "../utils/ellipsify";
import { DIAGNOSTIC_CHECKS, levelForXp, summarizeProgress } from "../xp/progress";
import { useProgress } from "../xp/ProgressContext";

const SCREEN_PADDING = 16;
const CARD_GAP = 12;
const ACCENT = "#9945ff";
const DONE = "#00ffbd";
const WARN = "#f5c16c";
const PANEL = "#12101c";
const MUTED = "rgba(249,250,251,0.72)";

const TONE_COLOR = {
  present: DONE,
  missing: "#ff6b6b",
  unproven: WARN,
  allowed: MUTED,
} as const;

const TONE_LABEL = {
  present: "In",
  missing: "Missing",
  unproven: "Unproven",
  allowed: "Allowed",
} as const;

function persistUrls(next: SubmissionUrls) {
  AsyncStorage.setItem(SUBMISSION_URLS_KEY, JSON.stringify(next)).catch((error: unknown) => {
    console.warn("Submission URLs did not save", error);
  });
}

export function ProfileScreen() {
  const { selectedAccount } = useAuthorization();
  const { progress, xp } = useProgress();
  const [urls, setUrls] = useState<SubmissionUrls>(EMPTY_SUBMISSION_URLS);
  const [checking, setChecking] = useState(false);
  const [report, setReport] = useState<ChecklistReport | null>(null);
  const level = levelForXp(xp);
  const summary = summarizeProgress(progress);
  const progressRatio = level.span <= 0 ? 1 : level.intoLevel / level.span;
  const address = selectedAccount
    ? ellipsify(selectedAccount.publicKey.toBase58(), 4)
    : null;

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(SUBMISSION_URLS_KEY)
      .then((raw) => {
        if (!cancelled) setUrls(parseSubmissionUrls(raw));
      })
      .catch((error: unknown) => {
        console.warn("Submission URLs did not load", error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setField = (key: keyof SubmissionUrls, value: string) => {
    setUrls((current) => {
      const next = { ...current, [key]: value };
      persistUrls(next);
      return next;
    });
    setReport(null);
  };

  const check = async () => {
    setChecking(true);
    const probes: ProbeMap = {
      github: "skipped",
      video: "skipped",
      deck: "skipped",
      submission: "skipped",
    };
    const keys = ["github", "video", "deck", "submission"] as const;
    try {
      await Promise.all(
        keys.map(async (key) => {
          const value = urls[key].trim();
          if (!value.startsWith("https://")) return;
          probes[key] = await probeHttpsUrl(value);
        }),
      );
      setReport(buildChecklist({ urls, probes, progress }));
    } catch (error: unknown) {
      console.warn("Submission check failed", error);
      setReport(
        buildChecklist({
          urls,
          probes,
          progress,
        }),
      );
    } finally {
      setChecking(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.screen}
      keyboardShouldPersistTaps="handled"
    >
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

      <Card mode="outlined" style={styles.card}>
        <Card.Title
          title="CLOCK IN packet"
          subtitle={`Close ${CLOCK_IN_CLOSE_LABEL}. Devnet is allowed.`}
        />
        <Card.Content style={styles.list}>
          <Text variant="bodyMedium">
            Paste the links you will submit. Check tells you what is on this phone and what this app cannot prove. dApp Store KYC is separate and is not on this list.
          </Text>
          <TextInput
            mode="outlined"
            label="GitHub repo URL"
            placeholder="https://github.com/owner/repo"
            value={urls.github}
            onChangeText={(value) => setField("github", value)}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            mode="outlined"
            label="Demo video URL"
            placeholder="YouTube, Loom, or any https link"
            value={urls.video}
            onChangeText={(value) => setField("video", value)}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            mode="outlined"
            label="Pitch deck URL"
            placeholder="Google Slides, Pitch, or a PDF link"
            value={urls.deck}
            onChangeText={(value) => setField("deck", value)}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            mode="outlined"
            label="Radiants submission URL"
            placeholder="https://solanamobile.radiant.nexus/…"
            value={urls.submission}
            onChangeText={(value) => setField("submission", value)}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Button
            mode="contained"
            onPress={() => {
              check().catch((error: unknown) => {
                console.warn("Submission check failed", error);
              });
            }}
            loading={checking}
            disabled={checking}
          >
            Check
          </Button>
          {report != null
            ? report.rows.map((item) => (
                <View key={item.id} style={styles.row}>
                  <Text style={[styles.packetMark, { color: TONE_COLOR[item.tone] }]}>
                    {TONE_LABEL[item.tone]}
                  </Text>
                  <View style={styles.rowLabel}>
                    <Text variant="bodyMedium">{item.title}</Text>
                    <Text variant="bodySmall" style={styles.meta}>
                      {item.detail}
                    </Text>
                  </View>
                </View>
              ))
            : null}
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
  packetMark: { width: 78, fontWeight: "700" },
  rowLabel: { flex: 1 },
});
