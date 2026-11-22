import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useAuth } from "../../auth/AuthProvider";
import { usePatientPreferences } from "../../../shared/theme/PatientPreferencesContext";
import { Text } from "../../../shared/ui/native";
import TrainingHeader from "../components/TrainingHeader";
import TrainingStateCard from "../components/TrainingStateCard";
import { listModules, localize, type ModuleSummary } from "../trainingApi";
import { getSpeechHealth, warmupSpeechModel, type SpeechHealthResponse } from "../speechApi";

export default function ModuleSelectorScreen() {
  const router = useRouter();
  const { getAuthHeaders } = useAuth();
  const { language, setLanguage } = usePatientPreferences();
  const [modules, setModules] = useState<ModuleSummary[]>([]);
  const [moduleIndex, setModuleIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [speechStatus, setSpeechStatus] = useState<SpeechHealthResponse | null>(null);
  const [warmingUp, setWarmingUp] = useState(false);
  const [warmupError, setWarmupError] = useState<string | null>(null);

  const checkSpeechEngine = useCallback(async () => {
    try {
      const health = await getSpeechHealth(getAuthHeaders);
      setSpeechStatus(health);
    } catch {
      // health check failure tolerated when offline/starting
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    void checkSpeechEngine();
  }, [checkSpeechEngine]);

  const handleWarmup = async () => {
    setWarmingUp(true);
    setWarmupError(null);
    try {
      const result = await warmupSpeechModel(getAuthHeaders);
      setSpeechStatus(result);
    } catch (err) {
      setWarmupError(err instanceof Error ? err.message : "Failed to load local Whisper model.");
      void checkSpeechEngine();
    } finally {
      setWarmingUp(false);
    }
  };

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
          onToggleLanguage={() => setLanguage(language === "en" ? "ms" : "en")}
          onBack={() => router.push("/dashboard")}
          backLabel="Return to dashboard"
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

            {/* Local Whisper Speech Model Status & Pre-load Action */}
            {/* <View style={styles.speechModelCard}>
              <View style={styles.speechHeaderRow}>
                <Ionicons
                  name={
                    speechStatus?.ready
                      ? "checkmark-circle"
                      : warmingUp || speechStatus?.status === "starting"
                        ? "sync-outline"
                        : "mic-circle-outline"
                  }
                  size={26}
                  color={speechStatus?.ready ? "#16734A" : "#174EA6"}
                />
                <Text style={styles.speechCardTitle}>
                  {language === "ms" ? "Model Pertuturan (Whisper)" : "Local Speech Model (Whisper)"}
                </Text>
              </View>

              <Text style={styles.speechCardDesc}>
                {speechStatus?.ready
                  ? (language === "ms"
                    ? "Model pertuturan sedia untuk input suara."
                    : "The speech model is loaded and ready for voice input.")
                  : warmingUp || speechStatus?.status === "starting"
                    ? (language === "ms"
                      ? "Sedang memuatkan model Whisper ke dalam memori…"
                      : "Loading local Whisper model into memory…")
                    : (language === "ms"
                      ? "Muatkan model pertuturan tempatan sekarang untuk mengelakkan kelewatan semasa latihan."
                      : "Load the local speech model now to prevent delays during voice exercises.")}
              </Text>

              {warmupError ? (
                <Text style={styles.speechErrorText}>{warmupError}</Text>
              ) : null}

              {!speechStatus?.ready && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={language === "ms" ? "Muat Model Pertuturan" : "Load Speech Model"}
                  disabled={warmingUp || speechStatus?.status === "starting"}
                  onPress={() => void handleWarmup()}
                  style={({ pressed }) => [
                    styles.loadModelButton,
                    (warmingUp || speechStatus?.status === "starting") && styles.disabled,
                    pressed && styles.pressed,
                  ]}
                >
                  {warmingUp || speechStatus?.status === "starting" ? (
                    <ActivityIndicator size="small" color="#174EA6" />
                  ) : (
                    <Ionicons name="cloud-download-outline" size={22} color="#174EA6" />
                  )}
                  <Text style={styles.loadModelButtonText}>
                    {warmingUp || speechStatus?.status === "starting"
                      ? (language === "ms" ? "Memuatkan model…" : "Loading model…")
                      : (language === "ms" ? "Muat Model Pertuturan" : "Load Speech Model")}
                  </Text>
                </Pressable>
              )}
            </View> */}

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
    fontSize: 16,
    fontWeight: "800",
  },
  supportingText: {
    color: "#64748B",
    fontSize: 16,
    lineHeight: 23,
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
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "800",
    textAlign: "center",
  },
  modulePosition: {
    color: "#64748B",
    fontSize: 16,
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
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
  },
  description: {
    color: "#475569",
    fontSize: 16,
    lineHeight: 24,
  },
  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 2,
  },
  metadata: {
    color: "#174EA6",
    fontSize: 16,
    lineHeight: 22,
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
  speechModelCard: {
    minHeight: 100,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    padding: 16,
    gap: 10,
  },
  speechHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  speechCardTitle: {
    color: "#172B4D",
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "800",
  },
  speechCardDesc: {
    color: "#475569",
    fontSize: 16,
    lineHeight: 23,
  },
  speechErrorText: {
    color: "#B42318",
    fontSize: 16,
    lineHeight: 22,
  },
  loadModelButton: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#174EA6",
    backgroundColor: "#F0F4FA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  loadModelButtonText: {
    color: "#174EA6",
    fontSize: 16,
    fontWeight: "800",
  },
});
