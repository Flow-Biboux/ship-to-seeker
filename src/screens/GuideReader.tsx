import React, { useRef, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import {
  canMarkModuleDone,
  moduleWebPath,
  panelsForModule,
  type GuideBlock,
} from "../buildPath/guidePanels";
import type { BuildModule } from "../buildPath/modules";

export function GuideReader({
  module,
  alreadyDone,
  onBack,
  onMarkDone,
}: {
  module: BuildModule;
  alreadyDone: boolean;
  onBack: () => void;
  onMarkDone: () => void;
}) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const panels = panelsForModule(module.id);
  const pageWidth = Math.max(width - 32, 1);
  const scroller = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const [seen, setSeen] = useState<ReadonlySet<number>>(() => new Set([0]));
  const codeColor = CODE_FG;
  const codeBackground = CODE_BG;
  const codeBorder = CODE_BORDER;
  const lastIndex = Math.max(panels.length - 1, 0);
  const onLast = index >= lastIndex;
  const doneAllowed = canMarkModuleDone(seen.size, panels.length);

  function remember(nextIndex: number) {
    const clamped = Math.min(Math.max(nextIndex, 0), lastIndex);
    setIndex(clamped);
    setSeen((current) => {
      if (current.has(clamped)) {
        return current;
      }
      const next = new Set(current);
      next.add(clamped);
      return next;
    });
  }

  function goTo(nextIndex: number) {
    remember(nextIndex);
    scroller.current?.scrollTo({ x: nextIndex * pageWidth, animated: true });
  }

  let actionLabel = "Next";
  if (onLast && alreadyDone) {
    actionLabel = "Back to the guides";
  } else if (onLast) {
    actionLabel = "Mark done";
  }

  return (
    <View style={styles.screen}>
      <Pressable onPress={onBack} accessibilityRole="button">
        <Text variant="labelLarge">Back to guides</Text>
      </Pressable>
      <Text variant="headlineSmall">
        {module.id} · {module.title}
      </Text>
      <Text variant="bodyMedium">
        {index + 1} / {panels.length}
      </Text>
      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        style={styles.pager}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          remember(
            Math.round(event.nativeEvent.contentOffset.x / pageWidth),
          );
        }}
      >
        {panels.map((panel) => (
          <ScrollView
            key={panel.title}
            style={{ width: pageWidth }}
            contentContainerStyle={styles.panel}
          >
            <Text variant="titleLarge" style={{ color: TITLE_PURPLE }}>
              {panel.title}
            </Text>
            {panel.blocks.map((block, blockIndex) => (
              <GuideBlockView
                key={`${panel.title}-${blockIndex}`}
                block={block}
                color={codeColor}
                backgroundColor={codeBackground}
                borderColor={codeBorder}
              />
            ))}
          </ScrollView>
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {panels.map((panel, panelIndex) => (
          <View
            key={panel.title}
            style={[
              styles.dot,
              {
                backgroundColor:
                  panelIndex === index
                    ? theme.colors.primary
                    : theme.colors.outline,
              },
            ]}
          />
        ))}
      </View>
      {onLast ? (
        <Button
          mode="text"
          onPress={() => {
            Linking.openURL(`${SITE}${moduleWebPath(module.id)}`).catch(
              (error: unknown) => {
                console.warn("Could not open full guide", error);
              },
            );
          }}
        >
          Full guide on the web
        </Button>
      ) : null}
      <Button
        mode="contained"
        disabled={onLast && !alreadyDone && !doneAllowed}
        onPress={() => {
          if (!onLast) {
            goTo(index + 1);
            return;
          }
          if (alreadyDone) {
            onBack();
            return;
          }
          onMarkDone();
        }}
      >
        {actionLabel}
      </Button>
    </View>
  );
}

function GuideBlockView({
  block,
  color,
  backgroundColor,
  borderColor,
}: {
  block: GuideBlock;
  color: string;
  backgroundColor: string;
  borderColor: string;
}) {
  if (block.kind === "text") {
    return <Text variant="bodyLarge">{block.text}</Text>;
  }
  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      style={[styles.codeWrap, { backgroundColor, borderColor }]}
      contentContainerStyle={styles.codeInner}
    >
      <Text selectable style={[styles.code, { color }]}>
        {block.code}
      </Text>
    </ScrollView>
  );
}

const SITE = "https://clock-in.biboux.com";
const CODE_BG = "#07051a";
const CODE_BORDER = "#9945ff";
const CODE_FG = "#f9fafb";
const TITLE_PURPLE = "#9945ff";

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  pager: {
    flex: 1,
  },
  panel: {
    paddingRight: 16,
    paddingBottom: 24,
    gap: 12,
  },
  codeWrap: {
    borderWidth: 1,
    borderRadius: 12,
    maxHeight: 220,
  },
  codeInner: {
    padding: 14,
  },
  code: {
    fontFamily: "monospace",
    fontSize: 13,
    lineHeight: 20,
  },
  dots: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
