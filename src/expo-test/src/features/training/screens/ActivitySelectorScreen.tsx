import { useCallback, useEffect, useMemo, useState, type ComponentProps } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useAuth } from "../../auth/AuthProvider";
import TrainingHeader from "../components/TrainingHeader";
import TrainingStateCard from "../components/TrainingStateCard";
import {
  getModule,
  getSubmoduleQSets,
  localize,
  type Language,
  type ModuleDetails,
  type QSetSummary,
  type SubmoduleSummary,
} from "../trainingApi";

export default function ActivitySelectorScreen() {
  const { moduleId } = useLocalSearchParams<{ moduleId: string }>();
  const router = useRouter();
  const { getAuthHeaders } = useAuth();

  const [module, setModule] = useState<ModuleDetails | null>(null);
  const [activityIndex, setActivityIndex] = useState(0);
  const [practiceSets, setPracticeSets] = useState<QSetSummary[]>([]);
  const [language, setLanguage] = useState<Language>("en");
  const [loading, setLoading] = useState(true);
  const [setsLoading, setSetsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setsError, setSetsError] = useState<string | null>(null);

  const loadModule = useCallback(async () => {
    if (!moduleId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getModule(moduleId, getAuthHeaders);
      setModule(result);
      setActivityIndex(0);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "We couldn't load this module.");
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, moduleId]);

  useEffect(() => {
    void loadModule();
  }, [loadModule]);

  const activeActivity: SubmoduleSummary | undefined = module?.submodules[activityIndex];
  const activeActivityId = activeActivity?.id;

  const loadPracticeSets = useCallback(async (submoduleId: string) => {
    setSetsLoading(true);
    setSetsError(null);
    setPracticeSets([]);
    try {
      const result = await getSubmoduleQSets(submoduleId, getAuthHeaders);
      setPracticeSets(result?.qSets ?? []);
    } catch (loadError) {
      setSetsError(loadError instanceof Error
        ? loadError.message
        : "We couldn't load the practice sets.");
    } finally {
      setSetsLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    if (activeActivityId) void loadPracticeSets(activeActivityId);
  }, [activeActivityId, loadPracticeSets]);

  const activityTitle = activeActivity ? localize(activeActivity.name, language) : "";
  const activityDescription = activeActivity ? localize(activeActivity.instructions, language) : "";
  const moduleTitle = module ? localize(module.title, language) : "";

  const activityPosition = useMemo(
    () => `${activityIndex + 1} / ${module?.submodules.length ?? 0}`,
    [activityIndex, module?.submodules.length],
  );

  const move = (direction: -1 | 1) => {
    const count = module?.submodules.length ?? 0;
    if (count < 2) return;
    setActivityIndex((current) => (current + direction + count) % count);
  };

  const iconName = (activeActivity?.iconName || "puzzle") as ComponentProps<typeof MaterialCommunityIcons>["name"];

  return (
    <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <TrainingHeader
          eyebrow="CHOOSE AN ACTIVITY"
          language={language}
          onToggleLanguage={() => setLanguage((current) => current === "en" ? "ms" : "en")}
          onBack={() => router.back()}
          backLabel="Return to modules"
        />

        {loading ? (
          <TrainingStateCard title="Loading activities…" loading />
        ) : error ? (
          <TrainingStateCard
            title="Activities couldn't be loaded"
            message={error}
            actionLabel="Try again"
            onAction={() => void loadModule()}
          />
        ) : !module ? null : module.submodules.length === 0 ? (
          <TrainingStateCard
            title="No activities available"
            message="Exercise types will appear here when they are published for this module."
          />
        ) : activeActivity ? (
          <>
            <Text style={styles.moduleContext}>{moduleTitle}</Text>

            <View style={styles.hero}>
              <View style={styles.activityCircle}>
                <MaterialCommunityIcons name={iconName} size={59} color="#174EA6" />
              </View>
              <Text style={styles.supportingText}>
                {language === "ms"
                  ? "Pilih aktiviti untuk melihat set latihan."
                  : "Choose an activity to view its practice sets."}
              </Text>
            </View>

            <View style={styles.carousel}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Previous activity"
                disabled={module.submodules.length < 2}
                onPress={() => move(-1)}
                style={[styles.arrowButton, module.submodules.length < 2 && styles.disabled]}
              >
                <Ionicons name="chevron-back" size={27} color="#174EA6" />
              </Pressable>
              <View style={styles.titleBlock}>
                <Text accessibilityRole="header" style={styles.activityTitle}>
                  {activityTitle || activeActivity.slug}
                </Text>
                <Text style={styles.position}>{activityPosition}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Next activity"
                disabled={module.submodules.length < 2}
                onPress={() => move(1)}
                style={[styles.arrowButton, module.submodules.length < 2 && styles.disabled]}
              >
                <Ionicons name="chevron-forward" size={27} color="#174EA6" />
              </Pressable>
            </View>

            <View style={styles.instructionCard}>
              <Text style={styles.cardHeading}>
                {language === "ms" ? "Arahan aktiviti" : "Activity instructions"}
              </Text>
              <Text style={styles.instruction}>
                {activityDescription || (language === "ms"
                  ? "Tiada arahan disediakan."
                  : "No instructions are available for this activity yet.")}
              </Text>
            </View>

            <View style={styles.setSection}>
              <Text style={styles.sectionTitle}>
                {language === "ms" ? "Pilih set latihan" : "Choose a practice set"}
              </Text>
              {setsLoading ? (
                <TrainingStateCard title="Loading practice sets…" loading />
              ) : setsError ? (
                <TrainingStateCard
                  title="Practice sets couldn't be loaded"
                  message={setsError}
                  actionLabel="Try again"
                  onAction={() => activeActivityId && void loadPracticeSets(activeActivityId)}
                />
              ) : practiceSets.length === 0 ? (
                <Text style={styles.emptyText}>
                  {language === "ms"
                    ? "Tiada set latihan diterbitkan untuk aktiviti ini."
                    : "No practice sets have been published for this activity."}
                </Text>
              ) : practiceSets.map((set) => (
                <Pressable
                  key={set.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${localize(set.title, language) || `Set ${set.position + 1}`}`}
                  onPress={() => router.push(`/q-sets/${set.id}`)}
                  style={({ pressed }) => [styles.setCard, pressed && styles.pressed]}
                >
                  <View style={styles.setNumber}>
                    <Text style={styles.setNumberText}>{set.position + 1}</Text>
                  </View>
                  <View style={styles.setCopy}>
                    <Text style={styles.setTitle}>
                      {localize(set.title, language) || `Set ${set.position + 1}`}
                    </Text>
                    <Text style={styles.setMeta}>
                      {language === "ms" ? "Tahap" : "Difficulty"} {set.difficultyIndex + 1}
                      {" · "}
                      {set.questionCount} {language === "ms" ? "soalan" : set.questionCount === 1 ? "question" : "questions"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={23} color="#64748B" />
                </Pressable>
              ))}
            </View>
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 20,
    paddingBottom: 36,
    backgroundColor: "#F8FAFC",
  },
  content: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    gap: 16,
  },
  moduleContext: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    marginTop: -5,
  },
  hero: {
    alignItems: "center",
    gap: 13,
    paddingTop: 1,
  },
  activityCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: "#2D3748",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  supportingText: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  carousel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  arrowButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#B8C7D9",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.35 },
  titleBlock: { flex: 1, alignItems: "center", gap: 5 },
  activityTitle: {
    color: "#172B4D",
    fontSize: 22,
    lineHeight: 29,
    fontWeight: "800",
    textAlign: "center",
  },
  position: { color: "#64748B", fontSize: 13, fontWeight: "600" },
  instructionCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    padding: 17,
    gap: 8,
  },
  cardHeading: { color: "#172B4D", fontSize: 15, lineHeight: 21, fontWeight: "800" },
  instruction: { color: "#475569", fontSize: 15, lineHeight: 23 },
  setSection: { gap: 11, marginTop: 1 },
  sectionTitle: { color: "#172B4D", fontSize: 19, lineHeight: 26, fontWeight: "800" },
  emptyText: { color: "#64748B", fontSize: 15, lineHeight: 23 },
  setCard: {
    minHeight: 79,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderColor: "#DFE7F0",
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  setNumber: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#EAF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  setNumberText: { color: "#174EA6", fontSize: 18, fontWeight: "800" },
  setCopy: { flex: 1, gap: 4 },
  setTitle: { color: "#172B4D", fontSize: 16, lineHeight: 22, fontWeight: "800" },
  setMeta: { color: "#64748B", fontSize: 13, lineHeight: 19 },
  pressed: { opacity: 0.75 },
});
