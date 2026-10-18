import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type LoadingBarProps = {
  progress?: number;
  percentage?: number;
  label?: string;
  message?: string;
  style?: StyleProp<ViewStyle>;
  [key: string]: unknown;
};

export default function LoadingBar({
  progress,
  percentage,
  label,
  message,
  style,
}: LoadingBarProps) {
  const rawValue = progress ?? percentage ?? 0;
  const percent = Math.max(0, Math.min(100, rawValue <= 1 ? rawValue * 100 : rawValue));

  return (
    <View style={[styles.container, style]}>
      {label || message ? <Text style={styles.label}>{label ?? message}</Text> : null}
      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(percent) }}
        style={styles.track}
      >
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", gap: 8 },
  label: { color: "#475569", fontSize: 14, lineHeight: 20 },
  track: {
    height: 10,
    width: "100%",
    overflow: "hidden",
    borderRadius: 5,
    backgroundColor: "#E2E8F0",
  },
  fill: { height: "100%", borderRadius: 5, backgroundColor: "#1D4ED8" },
});
