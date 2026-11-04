import { StyleSheet, Text, View } from "react-native";

/** Coin balance and secondary metric remain visual placeholders for later work. */
export default function DashboardMetricsRow() {
  return (
    <View style={styles.wideBoxesRow}>
      <View style={styles.coinBox} accessibilityLabel="Coin balance placeholder">
        <View style={styles.coinIconContainer}>
          <Text style={styles.coinSymbol}>$</Text>
        </View>
        <Text style={styles.coinValue}>—</Text>
      </View>

      <View style={styles.undecidedBox}>
        <Text style={styles.placeholderLabel}>TBD / Metric</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wideBoxesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  coinBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#ccc",
    borderRadius: 16,
    padding: 16,
    marginRight: 8,
    backgroundColor: "#FFF",
  },
  coinIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFD700",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CCAC00",
    marginRight: 12,
  },
  coinSymbol: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  coinValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
  },
  undecidedBox: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#ccc",
    borderRadius: 16,
    padding: 16,
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  placeholderLabel: {
    fontSize: 13,
    color: "#999",
  },
});
