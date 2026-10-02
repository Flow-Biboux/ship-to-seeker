import React from "react";
import { StyleSheet, View } from "react-native";
import { ScreenIntro } from "../components/ScreenIntro";

const SCREEN_PADDING = 16;

export function BuildPathScreen() {
  return (
    <View style={styles.screen}>
      <ScreenIntro title="Build Path" subtitle="Your 7-step build journey" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: SCREEN_PADDING,
  },
});
