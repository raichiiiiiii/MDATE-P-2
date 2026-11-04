import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuthFlow, type AuthMode } from "./AuthFlowProvider";

type Props = {
  initialMode?: AuthMode;
};

export default function AuthEntryScreen({ initialMode = "sign-in" }: Props) {
  const { signIn, requestPasswordReset } = useAuthFlow();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isWebLogin = Platform.OS === "web" && mode === "sign-in";

  const submit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    setErrorMessage(null);
    setNotice(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setErrorMessage("Enter a valid email address.");
      return;
    }
    if (!isWebLogin && !password) {
      setErrorMessage("Enter your password.");
      return;
    }
    if (mode === "sign-up" && password !== confirmPassword) {
      setErrorMessage("The passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signIn(mode, normalizedEmail, password);
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      // Keep sign-in errors generic to avoid disclosing whether an email exists.
      console.error("MDATE authentication failed:", error);
      setErrorMessage(
        mode === "sign-in"
          ? "We couldn't sign you in. Check your email and password, then try again."
          : "We couldn't create this account. Check the password requirements or sign in if you already have an account.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendPasswordReset = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setErrorMessage("Enter your email address first.");
      return;
    }
    setErrorMessage(null);
    setNotice(null);
    setIsResetting(true);
    try {
      await requestPasswordReset(normalizedEmail);
    } catch (error) {
      console.error("Password reset request failed:", error);
    } finally {
      // Keep the result neutral whether or not the address is registered.
      setNotice(
        "If an account uses this email, password reset instructions will be sent.",
      );
      setIsResetting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardRoot}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.main}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandInitial}>M</Text>
            </View>
            <View>
              <Text style={styles.brandName}>MDATE</Text>
              <Text style={styles.brandSubtitle}>
                Mobile Digital Aphasia Therapy Environment
              </Text>
            </View>
          </View>

          <Text accessibilityRole="header" style={styles.heading}>
            {mode === "sign-in" ? "Welcome back" : "Create your account"}
          </Text>
          <Text style={styles.intro}>
            {mode === "sign-in"
              ? "Sign in to continue your therapy journey."
              : "Create an account to get started with MDATE."}
          </Text>

          <View style={styles.credentialCard}>
            <Text style={styles.cardTitle}>
              {mode === "sign-in" ? "Your account" : "New account details"}
            </Text>
            <Text style={styles.fieldLabel}>Email address</Text>
            <TextInput
              accessibilityLabel="Email address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              editable={!isSubmitting}
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="name@example.com"
              placeholderTextColor="#718096"
              returnKeyType="next"
              style={styles.input}
              textContentType="emailAddress"
              value={email}
            />

            {isWebLogin ? (
              <View style={styles.webNote}>
                <Text style={styles.webNoteTitle}>Secure sign-in</Text>
              </View>
            ) : (
              <>
                <Text style={styles.fieldLabel}>Password</Text>
                <TextInput
                  accessibilityLabel="Password"
                  autoCapitalize="none"
                  autoComplete={
                    mode === "sign-up" ? "new-password" : "current-password"
                  }
                  editable={!isSubmitting}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#718096"
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  textContentType={
                    mode === "sign-up" ? "newPassword" : "password"
                  }
                  value={password}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    showPassword ? "Hide password" : "Show password"
                  }
                  onPress={() => setShowPassword((value) => !value)}
                  style={styles.textAction}
                >
                  <Text style={styles.textActionLabel}>
                    {showPassword ? "Hide password" : "Show password"}
                  </Text>
                </Pressable>
              </>
            )}

            {mode === "sign-up" ? (
              <>
                <Text style={styles.fieldLabel}>Confirm password</Text>
                <TextInput
                  accessibilityLabel="Confirm password"
                  autoCapitalize="none"
                  autoComplete="new-password"
                  editable={!isSubmitting}
                  onChangeText={setConfirmPassword}
                  placeholder="Enter your password again"
                  placeholderTextColor="#718096"
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  textContentType="newPassword"
                  value={confirmPassword}
                />
                <Text style={styles.helper}>
                  Email verification is optional. You can continue without verifying your email address.
                </Text>
              </>
            ) : null}
          </View>

          {errorMessage ? (
            <Text accessibilityRole="alert" style={styles.errorText}>
              {errorMessage}
            </Text>
          ) : null}
          {notice ? (
            <Text style={styles.noticeText}>
              {notice}
            </Text>
          ) : null}

          {mode === "sign-in" ? (
            <Pressable
              accessibilityRole="button"
              disabled={isResetting || isSubmitting}
              onPress={() => void sendPasswordReset()}
              style={styles.textAction}
            >
              {isResetting ? (
                <ActivityIndicator size="small" color="#174EA6" />
              ) : (
                <Text style={styles.textActionLabel}>Forgot password?</Text>
              )}
            </Pressable>
          ) : null}
        </View>

        <View style={styles.bottomActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
            disabled={isSubmitting}
            onPress={() => void submit()}
            style={[styles.primaryButton, isSubmitting && styles.disabledButton]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {mode === "sign-in" ? "Sign in" : "Create account"}
              </Text>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={() => {
              setMode((value) =>
                value === "sign-in" ? "sign-up" : "sign-in",
              );
              setPassword("");
              setConfirmPassword("");
              setErrorMessage(null);
              setNotice(null);
            }}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>
              {mode === "sign-in"
                ? "Create an account"
                : "I already have an account"}
            </Text>
          </Pressable>
          <Text style={styles.footerNote}>
            Your password is handled by Auth0. MDATE stores your application profile and therapy data, not your password.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardRoot: { flex: 1, backgroundColor: "#F4F7FB" },
  page: {
    flexGrow: 1,
    minHeight: "100%",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
  },
  main: { width: "100%", maxWidth: 480, alignSelf: "center" },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginBottom: 34,
  },
  brandMark: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: "#DCEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  brandInitial: { color: "#174EA6", fontSize: 29, fontWeight: "800" },
  brandName: {
    color: "#17365D",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  brandSubtitle: { color: "#5C6F85", fontSize: 13, marginTop: 3 },
  heading: {
    color: "#172B4D",
    fontSize: 31,
    lineHeight: 39,
    fontWeight: "800",
    marginBottom: 8,
  },
  intro: {
    color: "#52657A",
    fontSize: 17,
    lineHeight: 26,
    marginBottom: 24,
  },
  credentialCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DFE7F0",
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  cardTitle: {
    color: "#172B4D",
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 4,
  },
  fieldLabel: { color: "#243B53", fontSize: 16, lineHeight: 23, fontWeight: "700" },
  input: {
    minHeight: 56,
    borderWidth: 1.5,
    borderColor: "#B8C7D9",
    borderRadius: 12,
    paddingHorizontal: 15,
    backgroundColor: "#FFFFFF",
    color: "#172B4D",
    fontSize: 17,
  },
  helper: { color: "#65788D", fontSize: 14, lineHeight: 21 },
  webNote: { backgroundColor: "#F0F6FF", borderRadius: 12, padding: 14, gap: 5 },
  webNoteTitle: { color: "#174EA6", fontSize: 15, fontWeight: "800" },
  webNoteText: { color: "#425B76", fontSize: 14, lineHeight: 21 },
  errorText: { color: "#B42318", fontSize: 15, lineHeight: 22, marginTop: 14 },
  noticeText: { color: "#176B45", fontSize: 14, lineHeight: 21, marginTop: 14 },
  textAction: {
    alignSelf: "flex-end",
    minHeight: 38,
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  textActionLabel: { color: "#174EA6", fontSize: 15, fontWeight: "700" },
  bottomActions: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    gap: 12,
    marginTop: 28,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 14,
    backgroundColor: "#174EA6",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
  secondaryButton: {
    minHeight: 58,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#174EA6",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  secondaryButtonText: { color: "#174EA6", fontSize: 17, fontWeight: "800" },
  disabledButton: { opacity: 0.65 },
  footerNote: {
    color: "#687B90",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 4,
  },
});
