import { StyleSheet, Text, View } from "react-native";

/** Visual placeholder for the future dashboard carousel/data widget. */
export default function DashboardCarouselPlaceholder() {
  return (
    <View style={styles.widgetBox}>
      <Text style={styles.widgetPlaceholderText}>async loadData(dynamic, critical)</Text>
      <Text style={styles.widgetSubText}>{"<carousel />"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  widgetBox: {
    height: 180,
    borderWidth: 1.5,
    borderColor: "#ccc",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#FAFAFA",
    padding: 12,
  },
  widgetPlaceholderText: {
    fontSize: 14,
    color: "#444",
    textAlign: "center",
    marginBottom: 6,
  },
  widgetSubText: {
    fontSize: 14,
    color: "#666",
    fontFamily: "monospace",
  },
});
