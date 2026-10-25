import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAuthFlow } from "../../../src/features/auth/AuthFlowProvider";
import { getSubmoduleQSets, localize, type Language, type SubmoduleQSets } from "../../../src/features/training/trainingApi";

export default function SubmoduleScreen() {
  const { submoduleId } = useLocalSearchParams<{ submoduleId: string }>();
  const router = useRouter();
  const { getAuthHeaders } = useAuthFlow();
  const [content, setContent] = useState<SubmoduleQSets | null>(null);
  const [language, setLanguage] = useState<Language>("en");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!submoduleId) return;
    setLoading(true);
    setError(null);
    try { setContent(await getSubmoduleQSets(submoduleId, getAuthHeaders)); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : "We couldn't load the practice sets."); }
    finally { setLoading(false); }
  }, [getAuthHeaders, submoduleId]);
  useEffect(() => { void load(); }, [load]);

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backButton}><Ionicons name="arrow-back" size={24} color="#172B4D" /></Pressable>
          <Text style={styles.eyebrow}>PRACTICE SETS</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Switch language" onPress={() => setLanguage((current) => current === "en" ? "ms" : "en")} style={styles.languageBadge}><Text style={styles.languageText}>{language.toUpperCase()}</Text></Pressable>
        </View>
        {loading ? <Text style={styles.description}>Loading practice sets…</Text> : error ? (
          <View style={styles.card}><Text style={styles.cardTitle}>Practice sets couldn't be loaded</Text><Text style={styles.description}>{error}</Text><Pressable accessibilityRole="button" onPress={() => void load()} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Try again</Text></Pressable></View>
        ) : content ? <>
          <Text accessibilityRole="header" style={styles.title}>{localize(content.submodule.name, language)}</Text>
          <Text style={styles.description}>{localize(content.submodule.instructions, language)}</Text>
          {content.qSets.length === 0 ? <View style={styles.card}><Text style={styles.cardTitle}>No practice sets yet</Text><Text style={styles.description}>Practice sets will appear here when they are published.</Text></View> : content.qSets.map((qSet) => (
            <Pressable key={qSet.id} accessibilityRole="button" onPress={() => router.push(`/q-sets/${qSet.id}`)} style={({ pressed }) => [styles.qSetCard, pressed && styles.pressed]}>
              <View style={styles.numberBadge}><Text style={styles.numberText}>{qSet.position + 1}</Text></View>
              <View style={styles.qSetCopy}>
                <Text style={styles.cardTitle}>{localize(qSet.title, language) || `Set ${qSet.position + 1}`}</Text>
                <Text style={styles.cardText}>Difficulty {qSet.difficultyIndex + 1} · {qSet.questionCount} {qSet.questionCount === 1 ? "question" : "questions"}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#64748B" />
            </Pressable>
          ))}
        </> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: 24, paddingTop: 24, paddingBottom: 32, backgroundColor: "#F8FAFC" },
  content: { width: "100%", maxWidth: 640, alignSelf: "center", gap: 14 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 7 },
  backButton: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DFE7F0" },
  eyebrow: { flex: 1, color: "#174EA6", fontSize: 12, fontWeight: "800", letterSpacing: 1.2 },
  languageBadge: { minWidth: 48, height: 40, borderRadius: 12, borderWidth: 1, borderColor: "#B8C7D9", alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  languageText: { color: "#174EA6", fontSize: 15, fontWeight: "800" },
  title: { color: "#172B4D", fontSize: 28, lineHeight: 36, fontWeight: "800" },
  description: { color: "#52657A", fontSize: 16, lineHeight: 25 },
  qSetCard: { flexDirection: "row", alignItems: "center", gap: 13, backgroundColor: "#FFFFFF", borderColor: "#DFE7F0", borderWidth: 1, borderRadius: 16, padding: 16, minHeight: 84 },
  numberBadge: { width: 46, height: 46, borderRadius: 14, backgroundColor: "#EAF2FF", alignItems: "center", justifyContent: "center" },
  numberText: { color: "#174EA6", fontSize: 19, fontWeight: "800" },
  qSetCopy: { flex: 1, gap: 4 },
  card: { gap: 12, borderRadius: 16, borderWidth: 1, borderColor: "#DFE7F0", backgroundColor: "#FFFFFF", padding: 20 },
  cardTitle: { color: "#172B4D", fontSize: 18, lineHeight: 25, fontWeight: "800" },
  cardText: { color: "#52657A", fontSize: 15, lineHeight: 22 },
  primaryButton: { minHeight: 52, borderRadius: 12, backgroundColor: "#174EA6", alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  pressed: { opacity: 0.75 },
});
