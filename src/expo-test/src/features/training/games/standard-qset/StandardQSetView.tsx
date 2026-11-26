import { useMemo, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../../../../shared/ui/native";
import type { GameViewProps, QuestionAttemptResult } from "../../core/gameTypes";
import type { StandardQSetAction, StandardQSetState } from "./standardQSetModel";

function normalize(value: string): string { return value.trim().toLocaleLowerCase().replace(/[.!?,]/g, ""); }

export default function StandardQSetView({ questions, state, dispatch, recordResult, busy, totalPossibleCoins, earnedSoFarCoins }: GameViewProps<StandardQSetState, StandardQSetAction>) {
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const current = useMemo(() => questions.find((question) => !state.results[question.id]), [questions, state.results]);

  const submit = async () => {
    if (!current || !answer.trim() || busy) return;
    const accepted = Array.isArray(current.answerPayload.answers) ? current.answerPayload.answers as string[] : [];
    const correct = accepted.some((item) => normalize(item) === normalize(answer));
    const result: QuestionAttemptResult = { questionId: current.id, correct, attempts: 1, durationMs: 0, responseText: answer.trim() };
    try {
      await recordResult(result);
      setAnswer("");
      setFeedback(correct ? "Correct answer." : "Answer recorded. Continue to the next question.");
    } catch { setFeedback("Your answer could not be saved. Please try again."); }
  };

  return (
    <View style={styles.panel}>
      <Text style={styles.counter}>Question {Object.keys(state.results).length + (current ? 1 : 0)} / {questions.length}</Text>
      <Text style={styles.prompt}>{current?.prompt ?? "All questions have been completed."}</Text>
      <TextInput value={answer} onChangeText={setAnswer} placeholder="Enter your answer…" style={styles.input} editable={!busy && Boolean(current)} />
      <Pressable accessibilityRole="button" onPress={() => void submit()} disabled={busy || !current || !answer.trim()} style={[styles.button, (busy || !current || !answer.trim()) && styles.disabled]}>
        <Ionicons name="checkmark" size={21} color="#FFFFFF" />
        <Text style={styles.buttonText}>Submit answer</Text>
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
  input: { minHeight: 58, borderWidth: 1.5, borderColor: "#B8C7D9", borderRadius: 13, padding: 13, color: "#172B4D", fontSize: 17 },
  button: { minHeight: 52, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, borderRadius: 13, backgroundColor: "#174EA6" },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  disabled: { opacity: 0.5 },
  feedback: { color: "#174EA6", fontSize: 15, lineHeight: 22, fontWeight: "700" },
  preview: { color: "#8A6500", fontSize: 14, fontWeight: "700" },
});
