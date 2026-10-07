import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Checkbox, List, Text } from "react-native-paper";
import { ScreenIntro } from "../components/ScreenIntro";
import {
  BUILD_MODULES,
  BUILD_PATH_STORAGE_KEY,
  parseCompletedIds,
  toggleCompletedId,
} from "../buildPath/modules";

const SCREEN_PADDING = 16;

export function BuildPathScreen() {
  const [completed, setCompleted] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(BUILD_PATH_STORAGE_KEY)
      .then((raw) => {
        if (!cancelled) {
          setCompleted(parseCompletedIds(raw));
          setReady(true);
        }
      })
      .catch((error: unknown) => {
        console.warn("Build path checklist did not load", error);
        if (!cancelled) {
          setReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = useCallback((id: string) => {
    setCompleted((current) => {
      const next = toggleCompletedId(current, id);
      AsyncStorage.setItem(BUILD_PATH_STORAGE_KEY, JSON.stringify(next)).catch(
        (error: unknown) => {
          console.warn("Build path checklist did not save", error);
        },
      );
      return next;
    });
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <ScreenIntro
        title="Build Path"
        subtitle="Modules 00–06, same list as clock-in.biboux.com"
      />
      {BUILD_MODULES.map((module) => (
        <List.Item
          key={module.id}
          title={`${module.id} · ${module.title}`}
          description={module.detail}
          descriptionNumberOfLines={4}
          onPress={() => toggle(module.id)}
          left={() => (
            <View style={styles.check}>
              <Checkbox
                status={
                  completed.includes(module.id) ? "checked" : "unchecked"
                }
                disabled={!ready}
                onPress={() => toggle(module.id)}
              />
            </View>
          )}
        />
      ))}
      <Text variant="bodySmall" style={styles.progress}>
        {completed.length} of {BUILD_MODULES.length} checked on this phone
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: SCREEN_PADDING,
    paddingBottom: 32,
  },
  check: {
    justifyContent: "center",
  },
  progress: {
    marginTop: 8,
  },
});
