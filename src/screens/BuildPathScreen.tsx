import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, Chip, List, ProgressBar, Text } from "react-native-paper";
import { ScreenIntro } from "../components/ScreenIntro";
import { BUILD_MODULES } from "../buildPath/modules";
import { Linking } from "react-native";
import { levelForXp } from "../xp/progress";
import { useProgress } from "../xp/ProgressContext";

const SCREEN_PADDING = 16;
const CHECK_SIZE = 24;
const CHECK_BORDER = 2;

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
  const ratio = level.span <= 0 ? 1 : level.intoLevel / level.span;

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Pressable
        onPress={() => navigation.navigate("Profile")}
      >
        <Chip compact>{level.name}</Chip>
        <ProgressBar progress={ratio} style={styles.bar} />
        <Text variant="bodySmall" style={styles.xp}>
          {xp} XP
        </Text>
      </Pressable>
      <ScreenIntro
        title="Build Path"
        subtitle="Open a module. Mark done only after Next reaches the last panel."
      />
      {BUILD_MODULES.map((module) => {
        const done = progress.completedGuideIds.includes(module.id);
        return (
          <List.Item
            key={module.id}
            title={`${module.id} · ${module.title}`}
            description={module.detail}
            descriptionNumberOfLines={4}
            onPress={() =>
              navigation.getParent()?.navigate("Guide", { moduleId: module.id })
            }
            left={() => (
              <View style={styles.check}>
                <View
                  style={[
                    styles.tick,
                    { opacity: done ? 1 : 0.35 },
                  ]}
                >
                  {done ? <Text>✓</Text> : null}
                </View>
              </View>
            )}
          />
        );
      })}
      <Button
        mode="outlined"
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
      <Text variant="bodySmall" style={styles.progress}>
        {progress.completedGuideIds.length} of {BUILD_MODULES.length} guides
        done{ready ? "" : " …"}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: SCREEN_PADDING,
    paddingBottom: 32,
  },
  bar: { marginTop: 8, marginBottom: 4 },
  xp: { marginBottom: 12 },
  check: {
    justifyContent: "center",
  },
  tick: {
    width: CHECK_SIZE,
    height: CHECK_SIZE,
    borderWidth: CHECK_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  progress: {
    marginTop: 8,
  },
});
