import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import React, { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { BUILD_MODULES, SKR_MODULES, type BuildModule } from "../buildPath/modules";
import { fetchSkrBalance, formatSkr } from "../skr/skr";
import { CARD_RADIUS, GREEN, MUTED, PANEL, PURPLE, SCREEN_PADDING } from "../theme";
import { useAuthorization } from "../utils/useAuthorization";
import { levelForXp } from "../xp/progress";
import { useProgress } from "../xp/ProgressContext";

type BuildTabs = {
  Diagnostics: undefined;
  "Build Path": undefined;
  Explainer: undefined;
  Profile: undefined;
};

export function BuildPathScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<BuildTabs>>();
  const { progress, xp, ready } = useProgress();
  const level = levelForXp(xp);
  const { selectedAccount } = useAuthorization();
  const owner = selectedAccount?.publicKey.toBase58() ?? null;
  const [skr, setSkr] = useState<
    { state: "idle" | "checking" | "error" } | { state: "done"; raw: bigint }
  >({ state: "idle" });
  const unlocked = skr.state === "done" && skr.raw > 0n;
  const next = BUILD_MODULES.find(
    (module) => !progress.completedGuideIds.includes(module.id),
  );

  useEffect(() => {
    if (owner == null) {
      setSkr({ state: "idle" });
      return;
    }
    let cancelled = false;
    setSkr({ state: "checking" });
    fetchSkrBalance(owner)
      .then((raw) => {
        if (!cancelled) setSkr({ state: "done", raw });
      })
      .catch((error: unknown) => {
        console.warn("SKR balance check failed", error);
        if (!cancelled) setSkr({ state: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [owner]);

  const skrStatus =
    owner == null
      ? "Connect your wallet in Diagnostics to check your SKR."
      : skr.state === "checking"
        ? "Checking your SKR on mainnet…"
        : skr.state === "error"
          ? "Could not reach mainnet to check SKR. Try again later."
          : unlocked && skr.state === "done"
            ? `Unlocked: you hold ${formatSkr(skr.raw)} SKR.`
            : "Hold any amount of SKR in this wallet to unlock these guides.";

  function openGuide(moduleId: string) {
    navigation.getParent()?.navigate("Guide", { moduleId });
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Pressable onPress={() => navigation.navigate("Profile")}>
        <Text variant="labelLarge" style={styles.level}>
          {level.name} · {xp} XP{ready ? "" : " …"}
        </Text>
      </Pressable>
      {next ? (
        <Pressable style={styles.continue} onPress={() => openGuide(next.id)}>
          <Text variant="labelLarge" style={styles.continueLabel}>
            Continue
          </Text>
          <Text variant="headlineSmall" style={styles.continueTitle}>
            {next.id} · {next.title}
          </Text>
          <Text variant="bodyMedium" style={styles.continueDetail}>
            {next.detail}
          </Text>
        </Pressable>
      ) : (
        <View style={styles.continue}>
          <Text variant="headlineSmall">Path complete</Text>
          <Text variant="bodyMedium" style={styles.continueDetail}>
            {BUILD_MODULES.length} of {BUILD_MODULES.length} guides done.
          </Text>
        </View>
      )}
      {BUILD_MODULES.map((module) => (
        <PathNode
          key={module.id}
          module={module}
          done={progress.completedGuideIds.includes(module.id)}
          current={module.id === next?.id}
          onPress={() => openGuide(module.id)}
        />
      ))}
      <Text variant="titleMedium" style={styles.skrTitle}>
        {unlocked ? "Unlocked" : "Locked"} · SKR holder guides
      </Text>
      <Text variant="bodySmall" style={styles.skrStatus}>
        {skrStatus}
      </Text>
      {SKR_MODULES.map((module) => (
        <PathNode
          key={module.id}
          module={module}
          done={progress.completedGuideIds.includes(module.id)}
          current={false}
          locked={!unlocked}
          onPress={() => {
            if (unlocked) openGuide(module.id);
          }}
        />
      ))}
      <Button
        mode="outlined"
        textColor={PURPLE}
        style={styles.submission}
        onPress={() => {
          Linking.openURL("https://clock-in.biboux.com/bonus").catch(
            (error: unknown) => {
              console.warn("Could not open submission guide", error);
            },
          );
        }}
      >
        Submission guide
      </Button>
    </ScrollView>
  );
}

function PathNode({
  module,
  done,
  current,
  locked = false,
  onPress,
}: {
  module: BuildModule;
  done: boolean;
  current: boolean;
  locked?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={locked}
      style={[styles.node, locked ? styles.locked : null]}
    >
      <View
        style={[
          styles.dot,
          done ? styles.dotDone : null,
          current ? styles.dotCurrent : null,
        ]}
      />
      <View style={styles.nodeCopy}>
        <Text variant="titleSmall">
          {module.id} · {module.title}
        </Text>
        {current ? (
          <Text variant="bodySmall" style={styles.nodeDetail}>
            {module.detail}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const NODE_DOT = 14;

const styles = StyleSheet.create({
  screen: {
    padding: SCREEN_PADDING,
    paddingBottom: 32,
  },
  level: {
    color: GREEN,
    marginBottom: 12,
  },
  continue: {
    backgroundColor: PANEL,
    borderRadius: CARD_RADIUS,
    padding: SCREEN_PADDING,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: PURPLE,
  },
  continueLabel: {
    color: GREEN,
  },
  continueTitle: {
    marginTop: 4,
  },
  continueDetail: {
    marginTop: 8,
    color: MUTED,
  },
  node: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  locked: {
    opacity: 0.45,
  },
  dot: {
    width: NODE_DOT,
    height: NODE_DOT,
    borderRadius: NODE_DOT / 2,
    borderWidth: 2,
    borderColor: MUTED,
  },
  dotDone: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  dotCurrent: {
    borderColor: PURPLE,
    backgroundColor: PURPLE,
  },
  nodeCopy: {
    flex: 1,
  },
  nodeDetail: {
    color: MUTED,
  },
  skrTitle: {
    marginTop: 16,
  },
  skrStatus: {
    color: MUTED,
    marginBottom: 8,
  },
  submission: {
    marginTop: 16,
  },
});
