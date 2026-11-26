import { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../../../../shared/ui/native";
import type { GameViewProps } from "../../core/gameTypes";
import type { FindThePairAction, FindThePairState } from "./findThePairEngine";

export default function FindThePairView({ questions, state, dispatch, recordResult, busy, totalPossibleCoins, earnedSoFarCoins }: GameViewProps<FindThePairState, FindThePairAction>) {
  const [selectedOutline, setSelectedOutline] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const outlines = useMemo(() => questions, [questions]);
  const colors = useMemo(() => [...questions].reverse(), [questions]);
  const matched = new Set(state.matchedQuestionIds);

  const selectColor = async (questionId: string) => {
    if (busy || !selectedOutline || matched.has(selectedOutline) || matched.has(questionId)) return;
    const sourceId = selectedOutline;
    setSelectedOutline(null);
    if (sourceId !== questionId) {
      dispatch({ type: "PAIR_ATTEMPTED", questionId: sourceId });
      setFeedback("Not the matching picture. Try another card.");
      return;
    }
    const attempts = (state.attemptsByQuestion[sourceId] ?? 0) + 1;
    try {
      await recordResult({ questionId: sourceId, correct: true, attempts, durationMs: 0 });
      setFeedback("Correct match.");
    } catch {
      setFeedback("The match could not be saved. Select the pair again.");
    }
  };

  return (
    <View style={styles.panel}>
      <View style={styles.scoreRow}>
        <Text style={styles.score}>Matched {state.matchedQuestionIds.length} / {questions.length}</Text>
        <Text style={styles.score}>Preview: {earnedSoFarCoins} / {totalPossibleCoins} coins</Text>
      </View>
      <Text style={styles.instructions}>Select an outline, then select the photograph that matches it.</Text>
      <View style={styles.board}>
        <View style={styles.column}>
          <Text style={styles.columnTitle}>OUTLINES</Text>
          {outlines.map((question) => (
            <Pressable key={`outline-${question.id}`} accessibilityRole="button" disabled={matched.has(question.id) || busy}
              accessibilityLabel={`Select outline for ${String(question.answerPayload.pairLabel ?? question.prompt ?? "item")}`}
              onPress={() => { setSelectedOutline(question.id); setFeedback(null); }}
              style={[styles.card, selectedOutline === question.id && styles.selected, matched.has(question.id) && styles.matched]}>
              {question.media?.outlineUrl ? <Image source={{ uri: question.media.outlineUrl }} style={styles.image} resizeMode="contain" /> : <Text style={styles.cardText}>{question.prompt || String(question.answerPayload.pairLabel ?? "Outline")}</Text>}
              {matched.has(question.id) ? <Ionicons name="checkmark-circle" size={22} color="#16734A" /> : null}
            </Pressable>
          ))}
        </View>
        <View style={styles.column}>
          <Text style={styles.columnTitle}>PHOTOGRAPHS</Text>
          {colors.map((question) => (
            <Pressable key={`color-${question.id}`} accessibilityRole="button" disabled={matched.has(question.id) || busy || !selectedOutline}
              accessibilityLabel={`Select photograph ${String(question.answerPayload.pairLabel ?? "item")}`}
              onPress={() => void selectColor(question.id)}
              style={[styles.card, matched.has(question.id) && styles.matched, (!selectedOutline || busy) && styles.dimmed]}>
              {question.media?.colorUrl ? <Image source={{ uri: question.media.colorUrl }} style={styles.image} resizeMode="cover" /> : <Text style={styles.cardText}>{String(question.answerPayload.pairLabel ?? question.prompt ?? "Photograph")}</Text>}
              {matched.has(question.id) ? <Ionicons name="checkmark-circle" size={22} color="#16734A" /> : null}
            </Pressable>
          ))}
        </View>
      </View>
      {feedback ? <Text accessibilityLiveRegion="polite" style={styles.feedback}>{feedback}</Text> : null}
      <Pressable accessibilityRole="button" disabled={busy || state.matchedQuestionIds.length === questions.length}
        onPress={() => {
          const next = questions.find((question) => !matched.has(question.id));
          if (next) dispatch({ type: "PAIR_HINTED", questionId: next.id });
          setFeedback(next ? `Hint: look for the picture of ${String(next.answerPayload.pairLabel ?? "the same item")}.` : "All pairs are matched.");
        }} style={styles.hintButton}>
        <Ionicons name="bulb-outline" size={20} color="#765600" />
        <Text style={styles.hintText}>Show a hint</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: 14, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: "#DCE6F1", backgroundColor: "#FFFFFF" },
  scoreRow: { flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
  score: { color: "#174EA6", fontSize: 15, fontWeight: "800" },
  instructions: { color: "#52657A", fontSize: 16, lineHeight: 23 },
  board: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  column: { flex: 1, gap: 8 },
  columnTitle: { color: "#52657A", fontSize: 13, fontWeight: "900", textAlign: "center" },
  card: { minHeight: 82, padding: 7, borderRadius: 12, borderWidth: 1.5, borderColor: "#CBD5E1", alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: "#FFFFFF" },
  selected: { borderColor: "#174EA6", backgroundColor: "#EAF2FF" },
  matched: { borderColor: "#7DC58F", backgroundColor: "#E8F6EC" },
  dimmed: { opacity: 0.65 },
  image: { width: "100%", height: 72 },
  cardText: { color: "#172B4D", fontSize: 14, fontWeight: "700", textAlign: "center" },
  feedback: { color: "#174EA6", fontSize: 15, lineHeight: 22, fontWeight: "700" },
  hintButton: { minHeight: 48, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, borderColor: "#E5B84C", backgroundColor: "#FFF8E1" },
  hintText: { color: "#765600", fontSize: 15, fontWeight: "800" },
});
