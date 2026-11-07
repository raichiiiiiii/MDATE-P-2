import { StyleSheet, Text, View } from "react-native";

type LoadingMessageProps = {
  heading: string;
  message: string;
};

export default function LoadingMessage({ heading, message }: LoadingMessageProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>{heading}</Text>
      <Text style={styles.message} accessibilityLiveRegion="polite">
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    minHeight: 110,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 18,
    paddingVertical: 17,
    justifyContent: "center",
    gap: 9,
  },
  heading: {
    color: "#334155",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  message: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "400",
  },
});
