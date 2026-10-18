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

import { useAuthFlow } from "./AuthFlowProvider";

export default function AuthEntryScreen() {
  const { signIn } = useAuthFlow();
  const [email, setEmail] = useState("");
  const [activeMode, setActiveMode] = useState<"sign-in" | "sign-up" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startAuthentication = async (mode: "sign-in" | "sign-up") => {
    setErrorMessage(null);
    setActiveMode(mode);
    try {
      await signIn(mode, email.trim());
    } catch (error) {
      console.error("Authentication failed:", error);
      setErrorMessage(
        error instanceof Error && error.message
          ? error.message
          : "We couldn't open secure sign-in. Please try again."
      );
      setActiveMode(null);
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
            <View style={styles.brandMark}><Text style={styles.brandInitial}>M</Text></View>
            <View>
              <Text style={styles.brandName}>MDATE</Text>
              <Text style={styles.brandSubtitle}>Speech therapy, at your pace</Text>
            </View>
          </View>

          <Text accessibilityRole="header" style={styles.heading}>Welcome</Text>
          <Text style={styles.intro}>
            Sign in to continue your practice, or create an account to get started.
          </Text>

          <View style={styles.credentialCard}>
            <Text style={styles.cardTitle}>Your sign-in details</Text>
            <Text style={styles.fieldLabel}>Email address</Text>
            <TextInput
              accessibilityLabel="Email address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              editable={activeMode === null}
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#718096"
              returnKeyType="done"
              style={styles.input}
              textContentType="emailAddress"
              value={email}
            />
            <View style={styles.secureNote}>
              <Text style={styles.lockIcon}>●</Text>
              <View style={styles.secureTextWrap}>
                <Text style={styles.secureTitle}>Password stays secure</Text>
                <Text style={styles.secureDescription}>
                  You’ll enter your password on Auth0’s secure sign-in page. MDATE never handles or stores your password.
                </Text>
              </View>
            </View>
          </View>

          {errorMessage ? (
            <Text accessibilityRole="alert" style={styles.errorText}>{errorMessage}</Text>
          ) : null}
        </View>

        <View style={styles.bottomActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: activeMode !== null, busy: activeMode === "sign-in" }}
            disabled={activeMode !== null}
            onPress={() => void startAuthentication("sign-in")}
            style={[styles.primaryButton, activeMode !== null && styles.disabledButton]}
          >
            {activeMode === "sign-in" ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Sign in</Text>}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: activeMode !== null, busy: activeMode === "sign-up" }}
            disabled={activeMode !== null}
            onPress={() => void startAuthentication("sign-up")}
            style={[styles.secondaryButton, activeMode !== null && styles.disabledButton]}
          >
            {activeMode === "sign-up" ? <ActivityIndicator color="#174EA6" /> : <Text style={styles.secondaryButtonText}>Sign up</Text>}
          </Pressable>
          <Text style={styles.footerNote}>Your account and therapy information are protected.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardRoot: { flex: 1, backgroundColor: "#F4F7FB" },
  page: { flexGrow: 1, minHeight: "100%", paddingHorizontal: 24, paddingTop: 30, paddingBottom: 22, justifyContent: "space-between" },
  main: { width: "100%", maxWidth: 480, alignSelf: "center" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 13, marginBottom: 34 },
  brandMark: { width: 54, height: 54, borderRadius: 17, backgroundColor: "#DCEAFE", alignItems: "center", justifyContent: "center" },
  brandInitial: { color: "#174EA6", fontSize: 29, fontWeight: "800" },
  brandName: { color: "#17365D", fontSize: 18, fontWeight: "800", letterSpacing: 1.5 },
  brandSubtitle: { color: "#5C6F85", fontSize: 13, marginTop: 3 },
  heading: { color: "#172B4D", fontSize: 31, lineHeight: 39, fontWeight: "800", marginBottom: 8 },
  intro: { color: "#52657A", fontSize: 17, lineHeight: 26, marginBottom: 24 },
  credentialCard: { backgroundColor: "#FFFFFF", borderColor: "#DFE7F0", borderWidth: 1, borderRadius: 20, padding: 20, gap: 12 },
  cardTitle: { color: "#172B4D", fontSize: 19, fontWeight: "800", marginBottom: 4 },
  fieldLabel: { color: "#243B53", fontSize: 16, lineHeight: 23, fontWeight: "700" },
  input: { minHeight: 56, borderWidth: 1.5, borderColor: "#B8C7D9", borderRadius: 12, paddingHorizontal: 15, backgroundColor: "#FFFFFF", color: "#172B4D", fontSize: 17 },
  secureNote: { flexDirection: "row", alignItems: "flex-start", gap: 11, backgroundColor: "#F0F6FF", borderRadius: 12, padding: 13, marginTop: 3 },
  lockIcon: { color: "#174EA6", fontSize: 15, marginTop: 2 },
  secureTextWrap: { flex: 1, gap: 4 },
  secureTitle: { color: "#174EA6", fontSize: 15, fontWeight: "800" },
  secureDescription: { color: "#425B76", fontSize: 14, lineHeight: 21 },
  errorText: { color: "#B42318", fontSize: 15, lineHeight: 22, marginTop: 14 },
  bottomActions: { width: "100%", maxWidth: 480, alignSelf: "center", gap: 12, marginTop: 28 },
  primaryButton: { minHeight: 58, borderRadius: 14, backgroundColor: "#174EA6", alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
  secondaryButton: { minHeight: 58, borderRadius: 14, backgroundColor: "#FFFFFF", borderWidth: 2, borderColor: "#174EA6", alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  secondaryButtonText: { color: "#174EA6", fontSize: 18, fontWeight: "800" },
  disabledButton: { opacity: 0.65 },
  footerNote: { color: "#687B90", fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 4 },
});
