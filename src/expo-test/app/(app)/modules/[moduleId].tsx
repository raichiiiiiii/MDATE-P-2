import { useCallback, useEffect, useState, type ComponentProps } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { useAuthFlow } from "../../../src/features/auth/AuthFlowProvider";
import { getModule, localize, type Language, type ModuleDetails } from "../../../src/features/training/trainingApi";

export default function ModuleDetailScreen() {
  const { moduleId } = useLocalSearchParams<{ moduleId: string }>();
  const router = useRouter();
  const { getAuthHeaders } = useAuthFlow();
  const [module, setModule] = useState<ModuleDetails | null>(null);
  const [language, setLanguage] = useState<Language>("en");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!moduleId) return;
    setLoading(true);
    setError(null);
    try { setModule(await getModule(moduleId, getAuthHeaders)); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : "We couldn't load this module."); }
    finally { setLoading(false); }
  }, [getAuthHeaders, moduleId]);
  useEffect(() => { void load(); }, [load]);

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#172B4D" />
          </Pressable>
          <Text style={styles.eyebrow}>TRAINING MODULE</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Switch language" onPress={() => setLanguage((current) => current === "en" ? "ms" : "en")} style={styles.languageBadge}>
            <Text style={styles.languageText}>{language.toUpperCase()}</Text>
          </Pressable>
        </View>
        {loading ? <Text style={styles.description}>Loading exercise types…</Text> : error ? (
          <View style={styles.stateCard}>
            <Text style={styles.cardTitle}>Module couldn't be loaded</Text><Text style={styles.description}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={() => void load()} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Try again</Text></Pressable>
          </View>
        ) : module ? <>
          <Text accessibilityRole="header" style={styles.title}>{localize(module.title, language)}</Text>
          <Text style={styles.description}>{localize(module.description, language)}</Text>
          <Text style={styles.sectionTitle}>Choose an exercise</Text>
          {module.submodules.map((submodule) => (
            <Pressable
              key={submodule.id}
              accessibilityRole="button"
              onPress={() => router.push(`/submodules/${submodule.id}`)}
              style={({ pressed }) => [styles.exerciseCard, pressed && styles.pressed]}
            >
              <View style={styles.exerciseIcon}>
                <MaterialCommunityIcons name={submodule.iconName as ComponentProps<typeof MaterialCommunityIcons>["name"]} size={32} color="#174EA6" />
              </View>
              <View style={styles.exerciseCopy}>
                <Text style={styles.cardTitle}>{localize(submodule.name, language)}</Text>
                <Text style={styles.cardText}>{localize(submodule.instructions, language)}</Text>
                <Text style={styles.metadata}>{submodule.qSetCount} practice {submodule.qSetCount === 1 ? "set" : "sets"}</Text>
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
  sectionTitle: { color: "#172B4D", fontSize: 21, lineHeight: 28, fontWeight: "800", marginTop: 10 },
  exerciseCard: { flexDirection: "row", alignItems: "center", gap: 13, backgroundColor: "#FFFFFF", borderColor: "#DFE7F0", borderWidth: 1, borderRadius: 18, padding: 15, minHeight: 110 },
  exerciseIcon: { width: 58, height: 58, borderRadius: 15, backgroundColor: "#EAF2FF", alignItems: "center", justifyContent: "center" },
  exerciseCopy: { flex: 1, gap: 4 },
  cardTitle: { color: "#172B4D", fontSize: 18, lineHeight: 25, fontWeight: "800" },
  cardText: { color: "#52657A", fontSize: 14, lineHeight: 21 },
  metadata: { color: "#174EA6", fontSize: 13, fontWeight: "700", marginTop: 2 },
  stateCard: { gap: 12, borderRadius: 16, borderWidth: 1, borderColor: "#DFE7F0", backgroundColor: "#FFFFFF", padding: 20 },
  primaryButton: { minHeight: 52, borderRadius: 12, backgroundColor: "#174EA6", alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  pressed: { opacity: 0.75 },
});
