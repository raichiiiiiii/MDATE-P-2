import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useAuth } from "../../auth/AuthProvider";
import TrainingHeader from "../components/TrainingHeader";
import TrainingStateCard from "../components/TrainingStateCard";
import { listModules, localize, type Language, type ModuleSummary } from "../trainingApi";

export default function ModuleSelectorScreen() {
  const router = useRouter();
  const { getAuthHeaders } = useAuth();
  const [modules, setModules] = useState<ModuleSummary[]>([]);
  const [moduleIndex, setModuleIndex] = useState(0);
  const [language, setLanguage] = useState<Language>("en");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadModules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listModules(getAuthHeaders);
      setModules(result);
      setModuleIndex((current) => Math.min(current, Math.max(0, result.length - 1)));
    } catch (loadError) {
      setError(loadError instanceof Error
        ? loadError.message
        : "We couldn't load the training modules.");
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    void loadModules();
  }, [loadModules]);

  const activeModule = modules[moduleIndex];
  const moduleTitle = activeModule ? localize(activeModule.title, language) : "";
  const moduleDescription = activeModule ? localize(activeModule.description, language) : "";

  const moduleLabel = useMemo(
    () => `M${activeModule?.versionNumber ?? moduleIndex + 1}`,
    [activeModule?.versionNumber, moduleIndex],
  );

  const move = (direction: -1 | 1) => {
    if (modules.length < 2) return;
    setModuleIndex((current) => (current + direction + modules.length) % modules.length);
  };

  return (
    <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <TrainingHeader
          eyebrow="CHOOSE A MODULE"
          language={language}
          onToggleLanguage={() => setLanguage((current) => current === "en" ? "ms" : "en")}
        />

        {loading ? (
          <TrainingStateCard title="Loading modules…" loading />
        ) : error ? (
          <TrainingStateCard
            title="Modules couldn't be loaded"
            message={error}
            actionLabel="Try again"
            onAction={() => void loadModules()}
          />
        ) : modules.length === 0 ? (
          <TrainingStateCard
            title="No modules available"
            message="Published training modules will appear here when they are ready."
          />
        ) : activeModule ? (
          <>
            <View style={styles.hero}>
              <View style={styles.moduleCircle}>
                <MaterialCommunityIcons
                  name="book-open-page-variant"
                  size={58}
                  color="#174EA6"
                />
                <View style={styles.moduleTag}>
                  <Text style={styles.moduleTagText}>{moduleLabel}</Text>
                </View>
              </View>
              <Text style={styles.supportingText}>
                {language === "ms"
                  ? "Pilih modul latihan untuk bermula."
                  : "Choose a training module to get started."}
              </Text>
            </View>

            <View style={styles.carousel}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Previous module"
                disabled={modules.length < 2}
                onPress={() => move(-1)}
                style={[styles.arrowButton, modules.length < 2 && styles.disabled]}
              >
                <Ionicons name="chevron-back" size={28} color="#174EA6" />
              </Pressable>
              <View style={styles.titleBlock}>
                <Text accessibilityRole="header" style={styles.moduleTitle}>
                  {moduleTitle || activeModule.slug}
                </Text>
                <Text style={styles.modulePosition}>
                  {moduleIndex + 1} {language === "ms" ? "daripada" : "of"} {modules.length}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Next module"
                disabled={modules.length < 2}
                onPress={() => move(1)}
                style={[styles.arrowButton, modules.length < 2 && styles.disabled]}
              >
                <Ionicons name="chevron-forward" size={28} color="#174EA6" />
              </Pressable>
            </View>

            <View style={styles.descriptionCard}>
              <Text style={styles.cardHeading}>
                {language === "ms" ? "Penerangan modul" : "About this module"}
              </Text>
              <Text style={styles.description}>
                {moduleDescription || (language === "ms"
                  ? "Tiada penerangan disediakan."
                  : "No description is available for this module yet.")}
              </Text>
              <View style={styles.metadataRow}>
                <Ionicons name="layers-outline" size={17} color="#174EA6" />
                <Text style={styles.metadata}>
                  {activeModule.submoduleCount} {language === "ms" ? "jenis latihan" : "exercise types"}
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${language === "ms" ? "Pilih modul" : "Choose module"} ${moduleTitle}`}
              onPress={() => router.push(`/modules/${activeModule.id}`)}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.primaryButtonText}>
                {language === "ms" ? "Pilih modul ini" : "Choose this module"}
              </Text>
              <Ionicons name="arrow-forward" size={21} color="#FFFFFF" />
            </Pressable>
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
    paddingTop: 22,
    paddingBottom: 36,
    backgroundColor: "#F8FAFC",
  },
  content: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    gap: 18,
  },
  hero: {
    alignItems: "center",
    gap: 13,
    paddingTop: 8,
  },
  moduleCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: "#2D3748",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  moduleTag: {
    position: "absolute",
    bottom: -5,
    minWidth: 42,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#174EA6",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 9,
  },
  moduleTagText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
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
    marginTop: 3,
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
  disabled: {
    opacity: 0.35,
  },
  titleBlock: {
    flex: 1,
    alignItems: "center",
    gap: 5,
  },
  moduleTitle: {
    color: "#172B4D",
    fontSize: 23,
    lineHeight: 30,
    fontWeight: "800",
    textAlign: "center",
  },
  modulePosition: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },
  descriptionCard: {
    minHeight: 125,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    padding: 17,
    gap: 9,
  },
  cardHeading: {
    color: "#172B4D",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "800",
  },
  description: {
    color: "#475569",
    fontSize: 15,
    lineHeight: 23,
  },
  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 2,
  },
  metadata: {
    color: "#174EA6",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: "#174EA6",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.78,
  },
});
