import { StyleSheet, Text, View } from "react-native";

type LoadingMessageProps = {
  message: string;
  tip: string;
};

export default function LoadingMessage({
  message,
  tip,
}: LoadingMessageProps) {
  return (
    <View style={styles.container}>
      <Text
        style={styles.message}
        accessibilityLiveRegion="polite"
      >
        {message}
      </Text>
      <Text style={styles.tip}>{tip}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    gap: 12,
  },
  message: {
    color: "#334155",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    textAlign: "center",
  },
  tip: {
    maxWidth: 320,
    color: "#64748B",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
});
