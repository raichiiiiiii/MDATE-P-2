import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuthFlow } from "../auth/AuthFlowProvider";
import LoadingMessage from "./components/LoadingMessage";
import LoadingProgress from "./components/LoadingProgress";
import SplashIcon from "./components/SplashIcon";

const TIPS = [
  "Take your time. You can move at your own pace.",
  "Short, regular practice can help build confidence.",
  "You can ask your therapist for help whenever you need it.",
];

export default function SplashScreen() {
  const {
    phase,
    errorMessage,
    loadingProgress,
    loadingMessage,
    retrySession,
  } = useAuthFlow();

  const [tipIndex, setTipIndex] = useState(0);

  // Tips are decorative and never block authentication or navigation.
  useEffect(() => {
    const timer = setInterval(() => {
      setTipIndex((index) => (index + 1) % TIPS.length);
    }, 6000);

    return () => clearInterval(timer);
  }, []);

  const hasError = phase === "error";

  return (
    <View style={styles.page}>
      <View style={styles.content}>
        <SplashIcon />

        <Text style={styles.brand}>MDATE</Text>
        <Text style={styles.subtitle}>
          Mobile Digital Aphasia Therapy Environment
        </Text>

        {hasError ? (
          <View style={styles.errorArea}>
            <Text accessibilityRole="header" style={styles.errorTitle}>
              We couldn't finish loading
            </Text>
            <Text style={styles.errorMessage} accessibilityRole="alert">
              {errorMessage ?? "Check your connection and try again."}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void retrySession()}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.loadingArea}>
            <ActivityIndicator
              size="small"
              color="#1D4ED8"
              style={styles.spinner}
            />
            <LoadingMessage
              message={loadingMessage}
              tip={TIPS[tipIndex]}
            />
            <LoadingProgress progress={loadingProgress} />
          </View>
        )}
      </View>

      <Text style={styles.footer}>One step at a time.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 24,
    paddingVertical: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
  },
  brand: {
    fontSize: 18,
    lineHeight: 26,
    letterSpacing: 2.5,
    fontWeight: "800",
    color: "#1D4ED8",
    marginBottom: 8,
  },
  subtitle: {
    maxWidth: 300,
    color: "#64748B",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 44,
  },
  loadingArea: {
    width: "100%",
    alignItems: "center",
    gap: 22,
  },
  spinner: {
    marginBottom: -8,
  },
  errorArea: {
    width: "100%",
    alignItems: "center",
    gap: 16,
  },
  errorTitle: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  errorMessage: {
    maxWidth: 340,
    fontSize: 15,
    lineHeight: 23,
    color: "#475569",
    textAlign: "center",
  },
  retryButton: {
    minHeight: 54,
    minWidth: 160,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "#1D4ED8",
    alignItems: "center",
    justifyContent: "center",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "700",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    color: "#64748B",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
});
