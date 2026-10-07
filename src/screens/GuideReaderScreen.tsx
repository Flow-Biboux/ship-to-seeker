import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button, Text } from "react-native-paper";
import {
  BUILD_MODULES,
} from "../buildPath/modules";
import {
  GUIDE_PANEL_COUNT,
  canMarkDone,
  moduleWebPath,
  panelsForModule,
} from "../buildPath/guidePanels";
import { useProgress } from "../xp/ProgressContext";

const SLACK = 24;
const SITE = "https://clock-in.biboux.com";

type GuideParams = { Guide: { moduleId: string } };

export function GuideReaderScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<GuideParams, "Guide">>();
  const moduleId = route.params?.moduleId ?? "00";
  const panels = panelsForModule(moduleId);
  const meta = BUILD_MODULES.find((module) => module.id === moduleId);
  const { completeGuide, progress } = useProgress();
  const alreadyDone = progress.completedGuideIds.includes(moduleId);
  const width = Dimensions.get("window").width;
  const [pageIndex, setPageIndex] = useState(0);
  const [lastPanelScrolledToEnd, setLastPanelScrolledToEnd] = useState(
    false,
  );

  const enableMark = useMemo(
    () =>
      alreadyDone ||
      canMarkDone({ pageIndex, lastPanelScrolledToEnd }),
    [alreadyDone, pageIndex, lastPanelScrolledToEnd],
  );

  const onHorizontal = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x;
    const next = Math.round(x / width);
    setPageIndex(next);
    if (next === GUIDE_PANEL_COUNT - 1) {
      const last = panels[GUIDE_PANEL_COUNT - 1];
      if (last && last.body.length < 80) {
        setLastPanelScrolledToEnd(true);
      }
    }
  };

  const onLastVertical = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const atEnd =
      contentOffset.y + layoutMeasurement.height >= contentSize.height - SLACK;
    if (atEnd || contentSize.height <= layoutMeasurement.height + SLACK) {
      setLastPanelScrolledToEnd(true);
    }
  };

  const onMark = () => {
    completeGuide(moduleId);
    navigation.goBack();
  };

  return (
    <View style={styles.root}>
      <Text variant="titleMedium" style={styles.kicker}>
        {meta ? `${meta.id} · ${meta.title}` : moduleId}
      </Text>
      <Text variant="bodySmall" style={styles.pager}>
        {pageIndex + 1} / {GUIDE_PANEL_COUNT}
      </Text>
      <ScrollView
        horizontal
        pagingEnabled
        onScroll={onHorizontal}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
      >
        {panels.map((panel, index) => (
          <ScrollView
            key={panel.title}
            style={{ width }}
            contentContainerStyle={styles.panel}
            onScroll={index === GUIDE_PANEL_COUNT - 1 ? onLastVertical : undefined}
            scrollEventThrottle={16}
            onContentSizeChange={(_w, h) => {
              if (index === GUIDE_PANEL_COUNT - 1 && h < 400) {
                setLastPanelScrolledToEnd(true);
              }
            }}
          >
            <Text variant="headlineSmall">{panel.title}</Text>
            <Text variant="bodyLarge" style={styles.body}>
              {panel.body}
            </Text>
            {index === GUIDE_PANEL_COUNT - 1 ? (
              <Button
                mode="text"
                onPress={() => {
                  Linking.openURL(`${SITE}${moduleWebPath(moduleId)}`).catch(
                    (error: unknown) => {
                      console.warn("Could not open full guide", error);
                    },
                  );
                }}
              >
                Full guide on the web
              </Button>
            ) : null}
          </ScrollView>
        ))}
      </ScrollView>
      <Button
        mode="contained"
        disabled={!enableMark && !alreadyDone}
        onPress={onMark}
        style={styles.mark}
      >
        {alreadyDone ? "Done — close" : "Mark done"}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: 16 },
  kicker: { paddingHorizontal: 16 },
  pager: { paddingHorizontal: 16, marginBottom: 8, opacity: 0.7 },
  panel: { padding: 16, paddingBottom: 48, minHeight: 320 },
  body: { marginTop: 12, lineHeight: 24 },
  mark: { margin: 16 },
});
