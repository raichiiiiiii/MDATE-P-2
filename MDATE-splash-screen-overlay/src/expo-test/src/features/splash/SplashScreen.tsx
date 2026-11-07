import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { useAuth } from "../auth/AuthProvider";
import LoadingMessage from "./components/LoadingMessage";
import LoadingProgress from "./components/LoadingProgress";
import SplashIcon from "./components/SplashIcon";

const TIPS = [
  "Take your time. You can move at your own pace.",
  "A little practice each day can help build confidence.",
  "You can ask your therapist for help whenever you need it.",
  "It is okay to pause and rest between activities.",
];

function clampProgress(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export default function SplashScreen() {
  const router = useRouter();
  const {
    phase,
    errorMessage,
    loadingProgress,
    retrySession,
  } = useAuth();

  const animatedProgress = useRef(new Animated.Value(0)).current;
  const navigationStarted = useRef(false);
  const [percentage, setPercentage] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [progressComplete, setProgressComplete] = useState(false);

  const hasError = phase === "error";

  const switchMessage = useCallback(() => {
    setTipIndex((currentIndex) => (currentIndex + 1) % TIPS.length);
  }, []);

  // Rotate the aphasia-friendly loading tips every three seconds.
  useEffect(() => {
    if (hasError) return;
    const timer = setInterval(switchMessage, 3000);
    return () => clearInterval(timer);
  }, [hasError, switchMessage]);

  // Keep the numeric label in sync with the animated fill.
  useEffect(() => {
    const listenerId = animatedProgress.addListener(({ value }) => {
      setPercentage(Math.round(value));
    });
    return () => animatedProgress.removeListener(listenerId);
  }, [animatedProgress]);

  // Animate to the progress reported by AuthProvider. This avoids displaying a
  // fabricated 100% while MDATE is still restoring or validating a session.
  useEffect(() => {
    const target = clampProgress(loadingProgress);
    const animation = Animated.timing(animatedProgress, {
      toValue: target,
      duration: target >= 100 ? 700 : 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished && phase === "ready" && target === 100) {
        setProgressComplete(true);
      }
    });

    return () => animation.stop();
  }, [animatedProgress, loadingProgress, phase]);

  // Only a fully authenticated, setup-complete account enters the main stack.
  // Stack.Protected sends signed-out and setup-required accounts to their own
  // flows; they must never be routed directly to the dashboard.
  useEffect(() => {
    if (phase !== "ready" || !progressComplete || navigationStarted.current) return;
    navigationStarted.current = true;
    router.replace("/(app)/(main)/dashboard");
  }, [phase, progressComplete, router]);

  const handleRetry = () => {
    setProgressComplete(false);
    navigationStarted.current = false;
    void retrySession();
  };

  return (
    <View style={styles.page}>
      <View style={styles.topSection}>
        <SplashIcon />
        <Text style={styles.brand}>MDATE</Text>
        <Text style={styles.subtitle}>
          Mobile Digital Aphasia Therapy Environment
        </Text>
      </View>

      <View style={styles.middleSection}>
        <LoadingMessage
          heading={hasError ? "Connection problem" : "Tips Box"}
          message={hasError
            ? errorMessage ?? "Check your connection and try again."
            : TIPS[tipIndex]}
        />

        {hasError ? (
          <Pressable
            accessibilityRole="button"
            onPress={handleRetry}
            style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
          >
            <Text style={styles.retryButtonText}>Try again</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.bottomSection}>
        <LoadingProgress progress={animatedProgress} percentage={percentage} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    maxWidth: 430,
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    justifyContent: "space-between",
    alignItems: "center",
  },
  topSection: {
    width: "100%",
    alignItems: "center",
    gap: 8,
  },
  brand: {
    color: "#2D3748",
    fontSize: 19,
    lineHeight: 26,
    fontWeight: "800",
    letterSpacing: 2.2,
  },
  subtitle: {
    maxWidth: 290,
    color: "#64748B",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  middleSection: {
    width: "100%",
    gap: 14,
  },
  retryButton: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.78,
  },
  bottomSection: {
    width: "100%",
  },
});
