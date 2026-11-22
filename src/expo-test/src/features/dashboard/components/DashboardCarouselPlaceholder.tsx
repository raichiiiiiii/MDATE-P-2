import { StyleSheet, View } from "react-native";
import { Text } from "../../../shared/ui/native";

/** Visual placeholder for the future dashboard carousel/data widget. */
export default function DashboardCarouselPlaceholder() {
  return (
    <View style={styles.widgetBox}>
      <Text style={styles.widgetPlaceholderText}>Therapy Activities Overview</Text>
      <Text style={styles.widgetSubText}>{"Interactive modules & practice sets"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  widgetBox: {
    minHeight: 140,
    borderWidth: 1.5,
    borderColor: "#DFE7F0",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    backgroundColor: "#F8FAFC",
    padding: 16,
    gap: 6,
  },
  widgetPlaceholderText: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: "#172B4D",
    textAlign: "center",
  },
  widgetSubText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#64748B",
    textAlign: "center",
  },
});
