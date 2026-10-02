import React from "react";
import { StyleSheet, View } from "react-native";
import { ScreenIntro } from "../components/ScreenIntro";

const SCREEN_PADDING = 16;

export function ExplainerScreen() {
  return (
    <View style={styles.screen}>
      <ScreenIntro title="Explainer" subtitle="Paste an error, get a fix" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: SCREEN_PADDING,
  },
});
