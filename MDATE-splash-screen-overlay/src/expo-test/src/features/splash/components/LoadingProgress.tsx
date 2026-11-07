import { Animated, StyleSheet, Text, View } from "react-native";

type LoadingProgressProps = {
  progress: Animated.Value;
  percentage: number;
};

export default function LoadingProgress({ progress, percentage }: LoadingProgressProps) {
  const value = Math.max(0, Math.min(100, Math.round(percentage)));
  const fillWidth = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container}>
      <Text style={styles.percent}>{value}%</Text>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="MDATE loading progress"
        accessibilityValue={{ min: 0, max: 100, now: value }}
        style={styles.track}
      >
        <Animated.View style={[styles.fill, { width: fillWidth }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 7,
  },
  percent: {
    color: "#334155",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    textAlign: "right",
  },
  track: {
    width: "100%",
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#1E293B",
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: "#3B82F6",
  },
});
