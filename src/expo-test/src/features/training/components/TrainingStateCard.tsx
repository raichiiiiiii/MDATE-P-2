import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type TrainingStateCardProps = {
  title: string;
  message?: string;
  loading?: boolean;
  actionLabel?: string;
  onAction?: () => void;
};

export default function TrainingStateCard({
  title,
  message,
  loading = false,
  actionLabel,
  onAction,
}: TrainingStateCardProps) {
  return (
    <View style={styles.card}>
      {loading ? (
        <ActivityIndicator size="large" color="#174EA6" />
      ) : (
        <Ionicons
          name="book-outline"
          size={34}
          color="#174EA6"
        />
      )}
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} style={styles.button}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 170,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderColor: "#DFE7F0",
    borderWidth: 1,
    borderRadius: 18,
    padding: 22,
  },
  title: {
    color: "#172B4D",
    fontSize: 19,
    lineHeight: 26,
    fontWeight: "800",
    textAlign: "center",
  },
  message: {
    color: "#52657A",
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
  },
  button: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: "#174EA6",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    marginTop: 3,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
