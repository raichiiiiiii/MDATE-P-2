import { useMemo, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../../../../shared/ui/native";
import type { GameViewProps, QuestionAttemptResult } from "../../core/gameTypes";
import type { StoryTellingAction, StoryTellingState } from "./storyTellingModel";

export default function StoryTellingView({ questions, state, dispatch, recordResult, busy, totalPossibleCoins, earnedSoFarCoins }: GameViewProps<StoryTellingState, StoryTellingAction>) {
  const [narrative, setNarrative] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const current = useMemo(() => questions.find((question) => !state.results[question.id]), [questions, state.results]);

  const submit = async () => {
    if (!current || !narrative.trim() || busy) return;
    const content = narrative.trim();
    const result: QuestionAttemptResult = { questionId: current.id, correct: content.split(/\s+/).length >= 3, attempts: 1, durationMs: 0, narrativeText: content };
    try {
      await recordResult(result);
      setNarrative("");
      setFeedback("Your description has been recorded.");
    } catch { setFeedback("Your description could not be saved. Please try again."); }
  };

  return (
    <View style={styles.panel}>
      <Text style={styles.counter}>Story prompt {Object.keys(state.results).length + (current ? 1 : 0)} / {questions.length}</Text>
      <Text style={styles.prompt}>{current?.prompt ?? "All story prompts have been completed."}</Text>
      <Text style={styles.helper}>Describe what is happening, or tell a short story related to the prompt.</Text>
      <TextInput value={narrative} onChangeText={setNarrative} multiline placeholder="Tell your story here…" style={styles.input} editable={!busy && Boolean(current)} />
      <Pressable accessibilityRole="button" onPress={() => void submit()} disabled={busy || !current || !narrative.trim()} style={[styles.button, (busy || !current || !narrative.trim()) && styles.disabled]}>
        <Ionicons name="book-outline" size={21} color="#FFFFFF" />
        <Text style={styles.buttonText}>Save story response</Text>
      </Pressable>
      {feedback ? <Text accessibilityLiveRegion="polite" style={styles.feedback}>{feedback}</Text> : null}
      <Text style={styles.preview}>Reward preview: {earnedSoFarCoins} / {totalPossibleCoins} coins</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: 14, padding: 18, borderRadius: 18, borderWidth: 1, borderColor: "#DCE6F1", backgroundColor: "#FFFFFF" },
  counter: { color: "#174EA6", fontSize: 15, fontWeight: "800" },
  prompt: { color: "#172B4D", fontSize: 21, lineHeight: 30, fontWeight: "800" },
  helper: { color: "#52657A", fontSize: 16, lineHeight: 23 },
  input: { minHeight: 145, borderWidth: 1.5, borderColor: "#B8C7D9", borderRadius: 13, padding: 13, color: "#172B4D", fontSize: 17, textAlignVertical: "top" },
  button: { minHeight: 52, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, borderRadius: 13, backgroundColor: "#174EA6" },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  disabled: { opacity: 0.5 },
  feedback: { color: "#174EA6", fontSize: 15, lineHeight: 22, fontWeight: "700" },
  preview: { color: "#8A6500", fontSize: 14, fontWeight: "700" },
});
