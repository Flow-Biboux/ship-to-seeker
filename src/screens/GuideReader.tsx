import * as Clipboard from "expo-clipboard";
import React, { useRef, useState } from "react";
import {
  Image,
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
  splitGuideText,
  type DiagramName,
  type GuideBlock,
} from "../buildPath/guidePanels";
import { GUIDE_DIAGRAMS } from "../buildPath/extraGuides";
import type { BuildModule } from "../buildPath/modules";
import { isRecallCorrect, recallFor } from "../buildPath/recall";
import { CARD_RADIUS, GREEN, MUTED, PANEL, PURPLE } from "../theme";

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
  const [picked, setPicked] = useState<string | null>(null);
  const recall = recallFor(module.id);
  const recallOk = isRecallCorrect(module.id, picked);
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
            {orderedBlocks(panel.blocks).map((block, blockIndex) => (
              <GuideBlockView
                key={`${panel.title}-${blockIndex}`}
                block={block}
                color={codeColor}
                backgroundColor={codeBackground}
                borderColor={codeBorder}
              />
            ))}
            {onLast && panel.title === panels[lastIndex]?.title && recall ? (
              <Recall
                prompt={recall.prompt}
                choices={recall.choices}
                picked={picked}
                correct={recall.answer}
                wrongHint={recall.wrongHint}
                onPick={setPicked}
              />
            ) : null}
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
      {onLast && moduleWebPath(module.id) != null ? (
        <Button
          mode="text"
          onPress={() => {
            const path = moduleWebPath(module.id);
            if (path == null) return;
            Linking.openURL(`${SITE}${path}`).catch(
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
        disabled={onLast && !alreadyDone && (!doneAllowed || !recallOk)}
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

const BLOCK_RANK: Record<GuideBlock["kind"], number> = {
  diagram: 0,
  text: 1,
  code: 2,
};

function orderedBlocks(blocks: readonly GuideBlock[]): GuideBlock[] {
  return blocks
    .map((block, index) => ({ block, index }))
    .sort(
      (left, right) =>
        BLOCK_RANK[left.block.kind] - BLOCK_RANK[right.block.kind] ||
        left.index - right.index,
    )
    .map((entry) => entry.block);
}

function Recall({
  prompt,
  choices,
  picked,
  correct,
  wrongHint,
  onPick,
}: {
  prompt: string;
  choices: readonly string[];
  picked: string | null;
  correct: string;
  wrongHint: string;
  onPick: (choice: string) => void;
}) {
  return (
    <View style={styles.recall}>
      <Text variant="titleMedium">{prompt}</Text>
      {choices.map((choice) => {
        const selected = picked === choice;
        const right = selected && choice === correct;
        const wrong = selected && choice !== correct;
        return (
          <Pressable
            key={choice}
            onPress={() => onPick(choice)}
            style={[
              styles.choice,
              right ? styles.choiceRight : null,
              wrong ? styles.choiceWrong : null,
            ]}
          >
            <Text variant="bodyLarge">{choice}</Text>
          </Pressable>
        );
      })}
      {picked != null && picked !== correct ? (
        <Text variant="bodyMedium" style={styles.wrongHint}>
          {wrongHint}
        </Text>
      ) : null}
    </View>
  );
}

const COPIED_VISIBLE_MS = 1500;

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
    return <GuideProse text={block.text} />;
  }
  if (block.kind === "diagram") {
    return <GuideDiagram name={block.diagram} />;
  }
  return (
    <CodeBlock
      code={block.code}
      color={color}
      backgroundColor={backgroundColor}
      borderColor={borderColor}
    />
  );
}

function GuideDiagram({ name }: { name: DiagramName }) {
  const rows = GUIDE_DIAGRAMS[name];
  return (
    <View style={styles.diagram}>
      {name === "listing" ? (
        <Image
          source={require("../../screenshots/screenshot1.png")}
          style={styles.shot}
          accessibilityLabel="Ship to Seeker screen"
        />
      ) : null}
      {rows.flat().map((cell, cellIndex) => (
        <View key={`${cell}-${cellIndex}`} style={styles.diagramCell}>
          <Text variant="labelLarge" style={styles.diagramLabel}>
            {cell}
          </Text>
        </View>
      ))}
    </View>
  );
}

function GuideProse({ text }: { text: string }) {
  const parts = splitGuideText(text);
  return (
    <Text variant="bodyLarge">
      {parts.map((part, index) =>
        part.kind === "plain" ? (
          <Text key={index} variant="bodyLarge">
            {part.text}
          </Text>
        ) : (
          <Text
            key={index}
            variant="bodyLarge"
            style={styles.link}
            onPress={() => {
              Linking.openURL(part.url).catch((error: unknown) => {
                console.warn("Could not open guide link", error);
              });
            }}
          >
            {part.text}
          </Text>
        ),
      )}
    </Text>
  );
}

function CodeBlock({
  code,
  color,
  backgroundColor,
  borderColor,
}: {
  code: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
}) {
  const [copied, setCopied] = useState(false);

  function copyCode() {
    Clipboard.setStringAsync(code)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), COPIED_VISIBLE_MS);
      })
      .catch((error: unknown) => {
        console.warn("Could not copy guide code", error);
      });
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Copy code"
      onPress={copyCode}
      style={[styles.codeWrap, { backgroundColor, borderColor }]}
    >
      <ScrollView
        horizontal
        nestedScrollEnabled
        contentContainerStyle={styles.codeInner}
      >
        <Text onPress={copyCode} style={[styles.code, { color }]}>
          {code}
        </Text>
      </ScrollView>
      {copied ? (
        <Text variant="labelMedium" style={[styles.copied, { color }]}>
          Copied
        </Text>
      ) : null}
    </Pressable>
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
  copied: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  link: {
    color: TITLE_PURPLE,
    textDecorationLine: "underline",
  },
  diagram: {
    gap: 8,
    backgroundColor: "#07051a",
    borderColor: TITLE_PURPLE,
    borderWidth: 1,
    borderRadius: CARD_RADIUS,
    padding: 12,
  },
  diagramCell: {
    backgroundColor: PANEL,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  diagramLabel: {
    color: "#00ffbd",
    textAlign: "center",
  },
  shot: {
    width: "100%",
    height: 220,
    resizeMode: "contain",
    borderRadius: 8,
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
  recall: {
    gap: 8,
    marginTop: 8,
  },
  choice: {
    backgroundColor: PANEL,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: PURPLE,
    padding: 12,
  },
  choiceRight: {
    borderColor: GREEN,
  },
  choiceWrong: {
    borderColor: "#ff5c7a",
  },
  wrongHint: {
    color: MUTED,
  },
});
