import { StyleSheet, Text, View } from "react-native";

export default function ProgressScreen() {
  return (
    <View style={styles.page}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>YOUR JOURNEY</Text>
        <Text accessibilityRole="header" style={styles.title}>
          Your progress
        </Text>
        <Text style={styles.description}>
          This space will show your practice history and progress over time.
        </Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Progress reports are not connected yet</Text>
          <Text style={styles.cardText}>
            Once the reporting API is connected, you will be able to review your completed sessions here.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 24, paddingTop: 36, backgroundColor: "#F8FAFC" },
  content: { width: "100%", maxWidth: 640, alignSelf: "center" },
  eyebrow: { color: "#1D4ED8", fontSize: 13, fontWeight: "800", letterSpacing: 1.5, marginBottom: 16 },
  title: { color: "#0F172A", fontSize: 28, lineHeight: 36, fontWeight: "800", marginBottom: 12 },
  description: { color: "#475569", fontSize: 17, lineHeight: 26, marginBottom: 24 },
  card: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 16, padding: 20 },
  cardTitle: { color: "#0F172A", fontSize: 19, lineHeight: 27, fontWeight: "800", marginBottom: 8 },
  cardText: { color: "#475569", fontSize: 16, lineHeight: 25 },
});
