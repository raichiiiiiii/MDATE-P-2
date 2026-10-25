import { useCallback, useEffect, useState, type ComponentProps } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { useAuthFlow } from "../../../src/features/auth/AuthFlowProvider";
import { listModules, localize, type ModuleSummary } from "../../../src/features/training/trainingApi";

export default function ModulesScreen() {
  const router = useRouter();
  const { getAuthHeaders } = useAuthFlow();
  const [modules, setModules] = useState<ModuleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadModules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setModules(await listModules(getAuthHeaders));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "We couldn't load the training modules.");
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => { void loadModules(); }, [loadModules]);

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>TRAINING</Text>
        <Text accessibilityRole="header" style={styles.title}>Training modules</Text>
        <Text style={styles.description}>Choose a program to practise. Take your time.</Text>

        {loading ? (
          <View style={styles.messageCard}><Text style={styles.messageText}>Loading your training modules…</Text></View>
        ) : error ? (
          <View style={styles.messageCard}>
            <Ionicons name="cloud-offline-outline" size={30} color="#174EA6" />
            <Text style={styles.cardTitle}>Modules couldn't be loaded</Text>
            <Text style={styles.cardText}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={() => void loadModules()} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : modules.length === 0 ? (
          <View style={styles.messageCard}>
            <MaterialCommunityIcons name="book-open-page-variant" size={38} color="#174EA6" />
            <Text style={styles.cardTitle}>No training modules yet</Text>
            <Text style={styles.cardText}>Published training programs will appear here.</Text>
          </View>
        ) : modules.map((module) => (
          <Pressable
            key={module.id}
            accessibilityRole="button"
            accessibilityLabel={`Open ${localize(module.title, "en")}`}
            onPress={() => router.push(`/modules/${module.id}`)}
            style={({ pressed }) => [styles.moduleCard, pressed && styles.pressed]}
          >
            <View style={styles.moduleIcon}>
              <MaterialCommunityIcons name={"book-open-page-variant" as ComponentProps<typeof MaterialCommunityIcons>["name"]} size={34} color="#174EA6" />
            </View>
            <View style={styles.moduleCopy}>
              <Text style={styles.cardTitle}>{localize(module.title, "en") || module.slug}</Text>
              <Text style={styles.cardText}>{localize(module.description, "en")}</Text>
              <Text style={styles.metadata}>{module.submoduleCount} exercise types · {module.supportedLanguages.map((lang) => lang === "ms" ? "Malay" : lang === "en" ? "English" : lang).join(" · ")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#64748B" />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: 24, paddingTop: 36, paddingBottom: 32, backgroundColor: "#F8FAFC" },
  content: { width: "100%", maxWidth: 640, alignSelf: "center", gap: 14 },
  eyebrow: { color: "#174EA6", fontSize: 13, fontWeight: "800", letterSpacing: 1.5 },
  title: { color: "#172B4D", fontSize: 29, lineHeight: 38, fontWeight: "800" },
  description: { color: "#52657A", fontSize: 17, lineHeight: 26, marginBottom: 7 },
  moduleCard: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#FFFFFF", borderColor: "#DFE7F0", borderWidth: 1, borderRadius: 18, padding: 16, minHeight: 112 },
  moduleIcon: { width: 62, height: 62, borderRadius: 15, backgroundColor: "#EAF2FF", alignItems: "center", justifyContent: "center" },
  moduleCopy: { flex: 1, gap: 5 },
  cardTitle: { color: "#172B4D", fontSize: 18, lineHeight: 25, fontWeight: "800" },
  cardText: { color: "#52657A", fontSize: 15, lineHeight: 22 },
  metadata: { color: "#174EA6", fontSize: 13, lineHeight: 19, fontWeight: "600", marginTop: 2 },
  messageCard: { alignItems: "center", gap: 10, backgroundColor: "#FFFFFF", borderColor: "#DFE7F0", borderWidth: 1, borderRadius: 18, padding: 24 },
  messageText: { color: "#52657A", fontSize: 16, lineHeight: 24, textAlign: "center" },
  actionButton: { minHeight: 48, borderRadius: 12, backgroundColor: "#174EA6", paddingHorizontal: 18, alignItems: "center", justifyContent: "center", marginTop: 5 },
  actionButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  pressed: { opacity: 0.75 },
});
