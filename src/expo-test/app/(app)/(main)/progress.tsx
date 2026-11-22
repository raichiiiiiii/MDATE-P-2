import { StyleSheet, View } from "react-native";
import { Text } from "../../../src/shared/ui/native";

export default function ProgressScreen() {
  return (
    <View style={styles.page}>
      <View style={styles.content}>
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
  card: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 16, padding: 20 },
  cardTitle: { color: "#0F172A", fontSize: 20, lineHeight: 28, fontWeight: "800", marginBottom: 8 },
  cardText: { color: "#475569", fontSize: 16, lineHeight: 25 },
});
