import { StyleSheet, Text, View } from "react-native";

export default function SettingsScreen() {
  return (
    <View style={styles.page}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>PREFERENCES</Text>
        <Text accessibilityRole="header" style={styles.title}>
          Settings
        </Text>
        <Text style={styles.description}>
          Personalize how MDATE works for you.
        </Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Preferences are not connected yet</Text>
          <Text style={styles.cardText}>
            Account details, accessibility settings, and voice preferences will be added here.
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
