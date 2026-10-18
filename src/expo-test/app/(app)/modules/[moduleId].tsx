import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function ModuleDetailScreen() {
  const { moduleId } = useLocalSearchParams<{ moduleId: string }>();
  const router = useRouter();

  return (
    <View style={styles.page}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>TRAINING MODULE</Text>
        <Text accessibilityRole="header" style={styles.title}>
          Module details
        </Text>
        <Text style={styles.description}>
          Module identifier: {moduleId ?? "Unknown"}
        </Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Exercise content is not connected yet</Text>
          <Text style={styles.cardText}>
            This route is in place. The module details and exercises will be loaded when the training API is integrated.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Go back</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#F8FAFC" },
  content: { width: "100%", maxWidth: 640, alignSelf: "center" },
  eyebrow: { color: "#1D4ED8", fontSize: 13, fontWeight: "800", letterSpacing: 1.5, marginBottom: 16 },
  title: { color: "#0F172A", fontSize: 28, lineHeight: 36, fontWeight: "800", marginBottom: 12 },
  description: { color: "#475569", fontSize: 16, lineHeight: 25, marginBottom: 24 },
  card: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 16, padding: 20, marginBottom: 24 },
  cardTitle: { color: "#0F172A", fontSize: 19, lineHeight: 27, fontWeight: "800", marginBottom: 8 },
  cardText: { color: "#475569", fontSize: 16, lineHeight: 25 },
  button: { minHeight: 54, alignItems: "center", justifyContent: "center", paddingHorizontal: 20, borderRadius: 12, backgroundColor: "#1D4ED8" },
  buttonText: { color: "#FFFFFF", fontSize: 17, lineHeight: 24, fontWeight: "700" },
});
