import { StyleSheet, Text, View } from "react-native";

export default function ModulesScreen() {
  return (
    <View style={styles.page}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>TRAINING</Text>
        <Text accessibilityRole="header" style={styles.title}>
          Training modules
        </Text>
        <Text style={styles.description}>
          Your assigned speech practice activities will appear here.
        </Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Modules are not connected yet</Text>
          <Text style={styles.cardText}>
            This screen is ready for the module API. No training data has been loaded yet.
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
