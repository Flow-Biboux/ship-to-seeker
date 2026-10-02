import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

const INTRO_GAP = 4;

export function ScreenIntro({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.intro}>
      <Text variant="headlineMedium">{title}</Text>
      <Text variant="bodyLarge">{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: {
    gap: INTRO_GAP,
    marginBottom: 20,
  },
});
