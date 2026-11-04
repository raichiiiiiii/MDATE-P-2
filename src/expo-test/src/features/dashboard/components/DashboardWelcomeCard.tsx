import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type DashboardWelcomeCardProps = {
  displayName: string;
};

export default function DashboardWelcomeCard({ displayName }: DashboardWelcomeCardProps) {
  const firstName = displayName.trim().split(/\s+/)[0] || "there";

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="hand-right-outline" size={30} color="#174EA6" />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>Welcome back, {firstName}</Text>
        <Text style={styles.description}>
          Choose an option below to continue your therapy activities.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D5E5FF",
    backgroundColor: "#EAF2FF",
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  copy: {
    flex: 1,
    gap: 5,
  },
  title: {
    color: "#172B4D",
    fontSize: 19,
    lineHeight: 26,
    fontWeight: "800",
  },
  description: {
    color: "#435A73",
    fontSize: 15,
    lineHeight: 22,
  },
});
