import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../auth/AuthProvider";
import { usePatientPreferences } from "../../../shared/theme/PatientPreferencesContext";
import { Text } from "../../../shared/ui/native";
import TrainingStateCard from "../components/TrainingStateCard";
import { getQSet, localize, type QSetDetails } from "../trainingApi";
import { getSubmoduleRewardTree, toRewardedQuestions, type SubmoduleRewardResponse } from "../hierarchicalTrainingApi";
import { resolveGameMode } from "../core/gameRegistry";
import { useGameSessionRunner } from "../core/useGameSessionRunner";
import { useWallet } from "../../wallet/hooks/useWallet";

export default function SubmoduleGameHostScreen() {
  const { submoduleId } = useLocalSearchParams<{ submoduleId: string }>();
  const { apiRequest, getAuthHeaders } = useAuth();
  const { language } = usePatientPreferences();
  const [content, setContent] = useState<SubmoduleRewardResponse | null>(null);
  const [qSetDetails, setQSetDetails] = useState<QSetDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!submoduleId) return;
    setLoading(true);
    setError(null);
    try {
      const rewardTree = await getSubmoduleRewardTree(apiRequest, submoduleId);
      const details = await Promise.all(rewardTree.submodule.qSets.map((set) => getQSet(set.id, getAuthHeaders)));
      setContent(rewardTree);
      setQSetDetails(details);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The activity could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [apiRequest, getAuthHeaders, submoduleId]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <View style={styles.state}><TrainingStateCard title="Loading activity and reward allocation…" loading /></View>;
  if (error || !content) return <View style={styles.state}><TrainingStateCard title="Activity unavailable" message={error ?? "The activity was not found."} actionLabel="Try again" onAction={() => void load()} /></View>;

  return <ActiveGameRunner content={content} qSetDetails={qSetDetails} apiRequest={apiRequest} language={language} />;
}

type ActiveGameRunnerProps = {
  content: SubmoduleRewardResponse;
  qSetDetails: QSetDetails[];
  apiRequest: ReturnType<typeof useAuth>["apiRequest"];
  language: "ms" | "en";
};

function ActiveGameRunner({ content, qSetDetails, apiRequest, language }: ActiveGameRunnerProps) {
  const router = useRouter();
  const { submodule, module } = content;
  const mode = useMemo(() => resolveGameMode(submodule.gameMode), [submodule.gameMode]);
  const engineQuestions = useMemo(() => toRewardedQuestions(submodule, qSetDetails, language), [language, qSetDetails, submodule]);
  const { refreshWallet } = useWallet(apiRequest);
  const runner = useGameSessionRunner(mode.engine, submodule.id, engineQuestions, apiRequest, refreshWallet);
  const GameView = mode.Component;
  const isPairMode = mode.modeId === "find_the_pair";
  const title = localize(submodule.name, language) || submodule.slug;

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.content}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color="#174EA6" />
          <Text style={styles.backText}>{language === "ms" ? "Kembali" : "Back"}</Text>
        </Pressable>
        <Text style={styles.eyebrow}>GAME MODE</Text>
        <Text accessibilityRole="header" style={styles.title}>{title}</Text>
        <Text style={styles.mode}>{mode.displayName}</Text>
        <Text style={styles.instructions}>{localize(submodule.instructions, language) || mode.description}</Text>

        <View style={styles.rewardCard}>
          <Text style={styles.rewardLabel}>Module reward pool</Text>
          <Text style={styles.rewardAmount}>🪙 {module.rewardCoins}</Text>
          <Text style={styles.rewardMeta}>This activity share: {submodule.inheritedRewardCoins} coins · {submodule.questionCount} active questions</Text>
        </View>

        <Text style={styles.section}>Difficulty and Q-Set allocation</Text>
        {submodule.qSets.map((set) => (
          <View key={set.id} style={styles.qSet}>
            <View style={styles.qSetBody}>
              <Text style={styles.qSetTitle}>{localize(set.title, language) || `Set ${set.position + 1}`}</Text>
              <Text style={styles.qSetMeta}>Difficulty {set.difficulty} · Fibonacci weight {set.fibonacciWeight} · {set.questionCount} questions</Text>
              <Text style={styles.qSetReward}>🪙 {set.inheritedRewardCoins} coins</Text>
            </View>
          </View>
        ))}

        {!runner.session ? (
          <Pressable accessibilityRole="button" disabled={runner.busy || engineQuestions.length === 0} onPress={() => void runner.start()} style={[styles.primaryButton, (runner.busy || engineQuestions.length === 0) && styles.disabled]}>
            <Text style={styles.primaryButtonText}>{language === "ms" ? "Mulakan latihan" : "Start activity"}</Text>
            <Ionicons name="play" size={20} color="#FFFFFF" />
          </Pressable>
        ) : (
          <>
            <View style={styles.sessionCard}>
              <Text style={styles.sessionTitle}>{language === "ms" ? "Sesi sedang berjalan" : "Session in progress"}</Text>
              <Text style={styles.sessionMeta}>{runner.session.completedQuestions} / {runner.session.expectedQuestions} {language === "ms" ? "soalan selesai" : "questions recorded"}</Text>
              <Text style={styles.sessionMeta}>{language === "ms" ? "Masa berlalu" : "Elapsed time"}: {Math.floor(runner.elapsedSeconds / 60)}:{String(runner.elapsedSeconds % 60).padStart(2, "0")}</Text>
              <Text style={styles.sessionMeta}>Reward preview: {runner.earnedPreviewCoins} / {runner.totalPossibleCoins} coins</Text>
            </View>
            {runner.session.status === "IN_PROGRESS" ? (
              <GameView
                questions={engineQuestions}
                state={runner.state}
                dispatch={runner.dispatch}
                recordResult={runner.recordResult}
                onFinish={runner.complete}
                busy={runner.busy}
                totalPossibleCoins={runner.totalPossibleCoins}
                earnedSoFarCoins={runner.earnedPreviewCoins}
              />
            ) : null}
            {!isPairMode && runner.isComplete && runner.session.status === "IN_PROGRESS" ? (
              <Pressable accessibilityRole="button" disabled={runner.busy} onPress={() => void runner.complete()} style={[styles.primaryButton, runner.busy && styles.disabled]}>
                <Text style={styles.primaryButtonText}>{language === "ms" ? "Tamatkan dan simpan" : "Finish and settle reward"}</Text>
                <Ionicons name="checkmark-circle" size={21} color="#FFFFFF" />
              </Pressable>
            ) : null}
            {runner.settlement ? (
              <View style={styles.settlementCard}>
                <Text style={styles.settlementTitle}>{language === "ms" ? "Latihan selesai" : "Activity complete"}</Text>
                <Text style={styles.settlementAmount}>+{runner.settlement.rewardCoins} coins</Text>
                <Text style={styles.sessionMeta}>Wallet balance: {runner.settlement.walletBalance}</Text>
                <Text style={styles.sessionMeta}>{runner.settlement.duplicate ? "Existing settlement returned safely." : "Reward settled by the server."}</Text>
                <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.secondaryButton}><Text style={styles.secondaryText}>Return to activities</Text></Pressable>
              </View>
            ) : null}
          </>
        )}
        {runner.error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{runner.error}</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  state: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#F8FAFC" },
  page: { flexGrow: 1, backgroundColor: "#F8FAFC", padding: 20, paddingBottom: 36 },
  content: { width: "100%", maxWidth: 720, alignSelf: "center", gap: 14 },
  back: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8 },
  backText: { color: "#174EA6", fontSize: 16, fontWeight: "700" },
  eyebrow: { color: "#174EA6", fontSize: 14, fontWeight: "800", letterSpacing: 1 },
  title: { color: "#172B4D", fontSize: 27, lineHeight: 35, fontWeight: "800" },
  mode: { color: "#36536F", fontSize: 18, fontWeight: "700" },
  instructions: { color: "#52657A", fontSize: 16, lineHeight: 24 },
  rewardCard: { borderRadius: 18, borderWidth: 1.5, borderColor: "#E0BF63", backgroundColor: "#FFF8E4", padding: 18, gap: 6 },
  rewardLabel: { color: "#765600", fontSize: 15, fontWeight: "700" },
  rewardAmount: { color: "#4A3908", fontSize: 28, fontWeight: "900" },
  rewardMeta: { color: "#765600", fontSize: 14, lineHeight: 20 },
  section: { color: "#172B4D", fontSize: 19, fontWeight: "800", marginTop: 6 },
  qSet: { flexDirection: "row", alignItems: "center", borderRadius: 14, padding: 15, borderWidth: 1, borderColor: "#DCE6F1", backgroundColor: "#FFFFFF" },
  qSetBody: { flex: 1, gap: 5 },
  qSetTitle: { color: "#172B4D", fontSize: 17, fontWeight: "800" },
  qSetMeta: { color: "#52657A", fontSize: 14, lineHeight: 20 },
  qSetReward: { color: "#8A6500", fontSize: 15, fontWeight: "800" },
  primaryButton: { minHeight: 54, borderRadius: 14, backgroundColor: "#174EA6", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10, paddingHorizontal: 18 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  disabled: { opacity: 0.5 },
  sessionCard: { borderRadius: 14, borderWidth: 1, borderColor: "#B8CBE5", backgroundColor: "#EAF2FF", padding: 14, gap: 5 },
  sessionTitle: { color: "#174EA6", fontSize: 16, fontWeight: "800" },
  sessionMeta: { color: "#52657A", fontSize: 14, lineHeight: 20 },
  settlementCard: { borderRadius: 16, borderWidth: 1.5, borderColor: "#7DC58F", backgroundColor: "#E8F6EC", padding: 18, gap: 8 },
  settlementTitle: { color: "#145C3C", fontSize: 20, fontWeight: "900" },
  settlementAmount: { color: "#145C3C", fontSize: 29, fontWeight: "900" },
  secondaryButton: { minHeight: 46, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#B8C7D9", marginTop: 6 },
  secondaryText: { color: "#174EA6", fontSize: 15, fontWeight: "800" },
  error: { color: "#B42318", fontSize: 14, lineHeight: 20 },
});
