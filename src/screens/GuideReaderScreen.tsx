import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import React from "react";
import { BUILD_MODULES } from "../buildPath/modules";
import { useProgress } from "../xp/ProgressContext";
import { GuideReader } from "./GuideReader";

type GuideParams = { Guide: { moduleId: string } };

export function GuideReaderScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<GuideParams, "Guide">>();
  const moduleId = route.params?.moduleId ?? "00";
  const meta = BUILD_MODULES.find((module) => module.id === moduleId);
  const { completeGuide, progress } = useProgress();
  const alreadyDone = progress.completedGuideIds.includes(moduleId);

  if (!meta) {
    return null;
  }

  return (
    <GuideReader
      module={meta}
      alreadyDone={alreadyDone}
      onBack={() => navigation.goBack()}
      onMarkDone={() => {
        completeGuide(moduleId);
        navigation.goBack();
      }}
    />
  );
}
