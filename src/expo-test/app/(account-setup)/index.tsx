import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth0 } from "react-native-auth0";
import { useAuthFlow } from "../../src/features/auth/AuthFlowProvider";
import type { AccountSetupInput } from "../../src/features/auth/accountApi";

type TextSize = AccountSetupInput["accessibilityPreferences"]["textSize"];
type Contrast = AccountSetupInput["accessibilityPreferences"]["contrast"];

const LANGUAGES = [
  { label: "English (Malaysia)", value: "en-MY" },
  { label: "Bahasa Melayu", value: "ms-MY" },
];
const TEXT_SIZES: { label: string; value: TextSize }[] = [
  { label: "Small", value: "small" },
  { label: "Medium", value: "medium" },
  { label: "Large", value: "large" },
  { label: "Extra large", value: "extra-large" },
];
const CONTRASTS: { label: string; value: Contrast }[] = [
  { label: "Normal", value: "normal" },
  { label: "High contrast", value: "high" },
];

export default function AccountSetupScreen() {
  const { user } = useAuth0();
  const { completeSetup } = useAuthFlow();
  const [displayName, setDisplayName] = useState(
    typeof user?.name === "string" ? user.name : ""
  );
  const [preferredLanguage, setPreferredLanguage] = useState("en-MY");
  const [textSize, setTextSize] = useState<TextSize>("medium");
  const [contrast, setContrast] = useState<Contrast>("normal");
  const [alternativeInputOn, setAlternativeInputOn] = useState(false);
  const [preferredVoiceId, setPreferredVoiceId] = useState("");
  const [audioRateText, setAudioRateText] = useState("1.00");
  const [audioVolumeText, setAudioVolumeText] = useState("1.00");
  const [voiceDisabled, setVoiceDisabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const audioRate = Number(audioRateText);
    const audioVolume = Number(audioVolumeText);

    if (!displayName.trim()) {
      setErrorMessage("Please enter the name you want us to use.");
      return;
    }
    if (!Number.isFinite(audioRate) || audioRate < 0.5 || audioRate > 2) {
      setErrorMessage("Speech rate must be between 0.5 and 2.0.");
      return;
    }
    if (!Number.isFinite(audioVolume) || audioVolume < 0 || audioVolume > 1) {
      setErrorMessage("Volume must be between 0 and 1.0.");
      return;
    }

    const input: AccountSetupInput = {
      displayName: displayName.trim(),
      preferredLanguage,
      accessibilityPreferences: {
        textSize,
        contrast,
        alternativeInputOn,
      },
      voicePreferences: {
        preferredVoiceId: preferredVoiceId.trim() || null,
        audioRate,
        audioVolume,
        voiceDisabled,
      },
    };

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await completeSetup(input);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We couldn't save your details. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        <Text style={styles.eyebrow}>FIRST-TIME SETUP</Text>
        <Text accessibilityRole="header" style={styles.title}>Make MDATE yours</Text>
        <Text style={styles.description}>
          Set up your profile and choose how MDATE should look and sound. You can change these choices later in Settings.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account details</Text>
          <Text style={styles.label}>Email address (from Auth0)</Text>
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyText}>{user?.email || "Email supplied by your sign-in provider"}</Text>
          </View>
          <Text style={styles.helper}>Your email and verification status are managed by your secure sign-in provider.</Text>

          <Text style={styles.label}>Display name</Text>
          <TextInput
            accessibilityLabel="Display name"
            autoCapitalize="words"
            autoCorrect={false}
            editable={!isSubmitting}
            maxLength={80}
            onChangeText={setDisplayName}
            placeholder="What should we call you?"
            placeholderTextColor="#718096"
            style={styles.input}
            value={displayName}
          />

          <Text style={styles.label}>Preferred language</Text>
          <View style={styles.optionList}>
            {LANGUAGES.map((item) => (
              <Choice key={item.value} label={item.label} selected={preferredLanguage === item.value} onPress={() => setPreferredLanguage(item.value)} disabled={isSubmitting} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accessibility</Text>
          <Text style={styles.label}>Text size</Text>
          <View style={styles.optionList}>
            {TEXT_SIZES.map((item) => (
              <Choice key={item.value} label={item.label} selected={textSize === item.value} onPress={() => setTextSize(item.value)} disabled={isSubmitting} />
            ))}
          </View>
          <Text style={styles.label}>Contrast</Text>
          <View style={styles.optionList}>
            {CONTRASTS.map((item) => (
              <Choice key={item.value} label={item.label} selected={contrast === item.value} onPress={() => setContrast(item.value)} disabled={isSubmitting} />
            ))}
          </View>
          <ToggleRow title="Alternative input" description="Enable alternative ways to interact with exercises when available." value={alternativeInputOn} onValueChange={setAlternativeInputOn} disabled={isSubmitting} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voice preferences</Text>
          <Text style={styles.label}>Preferred voice ID (optional)</Text>
          <TextInput
            accessibilityLabel="Preferred voice ID"
            autoCapitalize="none"
            editable={!isSubmitting}
            onChangeText={setPreferredVoiceId}
            placeholder="Use the default voice"
            placeholderTextColor="#718096"
            style={styles.input}
            value={preferredVoiceId}
          />
          <Text style={styles.helper}>Leave blank to use the default voice. Available voices can be selected later in Settings.</Text>
          <Text style={styles.label}>Speech rate (0.5–2.0)</Text>
          <TextInput accessibilityLabel="Speech rate" editable={!isSubmitting} keyboardType="decimal-pad" onChangeText={setAudioRateText} style={styles.input} value={audioRateText} />
          <Text style={styles.label}>Volume (0–1.0)</Text>
          <TextInput accessibilityLabel="Voice volume" editable={!isSubmitting} keyboardType="decimal-pad" onChangeText={setAudioVolumeText} style={styles.input} value={audioVolumeText} />
          <ToggleRow title="Disable voice output" description="Turn off spoken audio. You can still review written instructions." value={voiceDisabled} onValueChange={setVoiceDisabled} disabled={isSubmitting} />
        </View>

        {errorMessage ? <Text accessibilityRole="alert" style={styles.error}>{errorMessage}</Text> : null}
        <Pressable accessibilityRole="button" accessibilityState={{ busy: isSubmitting, disabled: isSubmitting }} disabled={isSubmitting} onPress={() => void handleSubmit()} style={[styles.saveButton, isSubmitting && styles.disabled]}>
          {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Save and continue</Text>}
        </Pressable>
        <Text style={styles.footer}>Account status, roles, provider links and timestamps are handled securely by MDATE’s backend.</Text>
      </View>
    </ScrollView>
  );
}

function Choice({ label, selected, onPress, disabled }: { label: string; selected: boolean; onPress: () => void; disabled: boolean }) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onPress} style={[styles.choice, selected && styles.choiceSelected]}>
      <Text style={[styles.choiceLabel, selected && styles.choiceLabelSelected]}>{label}</Text>
      <Text style={[styles.choiceState, selected && styles.choiceLabelSelected]}>{selected ? "Selected" : "Choose"}</Text>
    </Pressable>
  );
}

function ToggleRow({ title, description, value, onValueChange, disabled }: { title: string; description: string; value: boolean; onValueChange: (value: boolean) => void; disabled: boolean }) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleCopy}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.helper}>{description}</Text>
      </View>
      <Switch accessibilityLabel={title} disabled={disabled} onValueChange={onValueChange} value={value} trackColor={{ false: "#C7D2DF", true: "#83AEEA" }} thumbColor={value ? "#174EA6" : "#FFFFFF"} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, backgroundColor: "#F4F7FB", paddingHorizontal: 20, paddingVertical: 28 },
  content: { width: "100%", maxWidth: 560, alignSelf: "center", gap: 13 },
  eyebrow: { alignSelf: "flex-start", color: "#174EA6", backgroundColor: "#DCEAFE", borderRadius: 8, paddingHorizontal: 11, paddingVertical: 7, fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  title: { color: "#172B4D", fontSize: 30, lineHeight: 38, fontWeight: "800", marginTop: 3 },
  description: { color: "#52657A", fontSize: 16, lineHeight: 24, marginBottom: 5 },
  section: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DFE7F0", borderRadius: 18, padding: 17, gap: 10, marginTop: 4 },
  sectionTitle: { color: "#172B4D", fontSize: 20, fontWeight: "800", marginBottom: 2 },
  label: { color: "#243B53", fontSize: 16, lineHeight: 23, fontWeight: "700", marginTop: 5 },
  input: { minHeight: 52, borderWidth: 1.5, borderColor: "#B8C7D9", borderRadius: 11, paddingHorizontal: 13, backgroundColor: "#FFFFFF", color: "#172B4D", fontSize: 16 },
  readOnlyField: { minHeight: 50, borderWidth: 1, borderColor: "#D8E1EC", borderRadius: 11, paddingHorizontal: 13, justifyContent: "center", backgroundColor: "#F3F6FA" },
  readOnlyText: { color: "#52657A", fontSize: 16 },
  helper: { color: "#65788D", fontSize: 13, lineHeight: 19 },
  optionList: { gap: 8 },
  choice: { minHeight: 48, borderWidth: 1.5, borderColor: "#CBD7E4", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  choiceSelected: { borderColor: "#174EA6", backgroundColor: "#EFF6FF" },
  choiceLabel: { flex: 1, color: "#334B63", fontSize: 15, lineHeight: 21, fontWeight: "600" },
  choiceLabelSelected: { color: "#174EA6", fontWeight: "800" },
  choiceState: { color: "#73869A", fontSize: 12, fontWeight: "700" },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 10, paddingBottom: 4 },
  toggleCopy: { flex: 1, gap: 3 },
  toggleTitle: { color: "#243B53", fontSize: 16, lineHeight: 22, fontWeight: "700" },
  error: { color: "#B42318", fontSize: 15, lineHeight: 22, marginTop: 4 },
  saveButton: { minHeight: 58, borderRadius: 14, backgroundColor: "#174EA6", alignItems: "center", justifyContent: "center", paddingHorizontal: 18, marginTop: 6 },
  saveButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
  disabled: { opacity: 0.65 },
  footer: { textAlign: "center", color: "#687B90", fontSize: 12, lineHeight: 18, marginTop: 3, marginBottom: 8 },
});
