import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuthFlow } from "./AuthFlowProvider";

export default function AuthGateScreen() {
  const { phase, errorMessage, retrySession } = useAuthFlow();

  if (phase === "error") {
    return (
      <View style={styles.container}>
        <Text accessibilityRole="header" style={styles.title}>
          We couldn't load your account
        </Text>
        <Text style={styles.description}>
          {errorMessage ?? "Please check your connection and try again."}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => void retrySession()}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>M</Text>
      </View>
      <Text style={styles.brand}>MDATE</Text>
      <ActivityIndicator size="large" color="#1D4ED8" />
      <Text style={styles.description}>Preparing your account. Please wait.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    backgroundColor: "#F8FAFC",
  },
  logo: {
    height: 68,
    width: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DBEAFE",
    marginBottom: 12,
  },
  logoText: { fontSize: 34, fontWeight: "800", color: "#1D4ED8" },
  brand: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 2,
    color: "#1D4ED8",
    marginBottom: 32,
  },
  title: {
    fontSize: 25,
    lineHeight: 34,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    maxWidth: 340,
    marginTop: 20,
    fontSize: 16,
    lineHeight: 25,
    color: "#475569",
    textAlign: "center",
  },
  button: {
    minHeight: 54,
    minWidth: 180,
    borderRadius: 12,
    marginTop: 24,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1D4ED8",
  },
  buttonText: { fontSize: 17, lineHeight: 24, fontWeight: "700", color: "#FFFFFF" },
});
