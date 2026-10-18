import { StyleSheet, Text, View } from "react-native";

type LoadingProgressProps = {
  progress: number;
};

export default function LoadingProgress({ progress }: LoadingProgressProps) {
  const value = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <View style={styles.container}>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="MDATE initialization progress"
        accessibilityValue={{ min: 0, max: 100, now: value }}
        style={styles.track}
      >
        <View style={[styles.fill, { width: `${value}%` }]} />
      </View>
      <Text style={styles.percent}>{value}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    gap: 10,
  },
  track: {
    width: "100%",
    height: 8,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
  },
  fill: {
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#1D4ED8",
  },
  percent: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
});
