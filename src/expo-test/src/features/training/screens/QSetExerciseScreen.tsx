import { useCallback, useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { useAuth } from "../../auth/AuthProvider";
import { usePatientPreferences } from "../../../shared/theme/PatientPreferencesContext";
import TrainingStateCard from "../components/TrainingStateCard";
import { getQSet, type QSetDetails } from "../trainingApi";
import { resolveGameMode } from "../core/gameRegistry";
import ChallengeScreen from "./ChallengeScreen";
import FindThePairSessionScreen from "./FindThePairSessionScreen";

export default function QSetExerciseScreen() {
  const { qSetId, gameMode } = useLocalSearchParams<{ qSetId: string; gameMode?: string }>();
  const { getAuthHeaders } = useAuth();
  const { language } = usePatientPreferences();
  const [initialQSet, setInitialQSet] = useState<QSetDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!qSetId) {
      setError("The practice-set identifier is missing.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setInitialQSet(await getQSet(qSetId, getAuthHeaders));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "We couldn't load this practice set.");
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, qSetId]);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return <View style={styles.statePage}><TrainingStateCard title={language === "ms" ? "Memuatkan latihan…" : "Loading practice…"} loading /></View>;
  }
  if (error || !initialQSet) {
    return (
      <View style={styles.statePage}>
        <TrainingStateCard
          title={language === "ms" ? "Latihan tidak dapat dimuatkan" : "This practice couldn't be loaded"}
          message={error ?? "The practice set was not found."}
          actionLabel={language === "ms" ? "Cuba lagi" : "Try again"}
          onAction={() => void load()}
        />
      </View>
    );
  }

  const inferredMode = gameMode || (
    initialQSet.submodule.exerciseType === "find_the_pair" ? "find_the_pair" : "challenge"
  );
  const mode = resolveGameMode(inferredMode);

  if (mode.modeId === "find_the_pair") {
    return <FindThePairSessionScreen initialQSet={initialQSet} />;
  }

  // Challenge currently provides the live voice/keyboard interaction surface.
  // The registered story_telling and standard_qset engines have independent
  // state adapters and can be bound to dedicated views without changing routing.
  return <ChallengeScreen />;
}

const styles = StyleSheet.create({
  statePage: { flexGrow: 1, justifyContent: "center", padding: 20, backgroundColor: "#F8FAFC" },
});
