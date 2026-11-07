import { useCallback, useEffect, useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../auth/AuthProvider";
import {
  getAccountPreferences,
  type AccountPreferences,
} from "./settingsApi";

type TextSize = AccountPreferences["accessibilityPreferences"]["textSize"];
type Contrast = AccountPreferences["accessibilityPreferences"]["contrast"];

const DEFAULT_PREFERENCES: AccountPreferences = {
  preferredLanguage: "en-MY",
  accessibilityPreferences: {
    textSize: "medium",
    contrast: "normal",
    alternativeInputOn: false,
  },
  voicePreferences: {
    preferredVoiceId: null,
    audioRate: 1,
    audioVolume: 1,
    voiceDisabled: false,
  },
};

const LANGUAGES = [
  { label: "English", value: "en-MY" },
  { label: "Bahasa Melayu", value: "ms-MY" },
] as const;
const TEXT_SIZES: { label: string; value: TextSize }[] = [
  { label: "Small", value: "small" },
  { label: "Medium", value: "medium" },
  { label: "Large", value: "large" },
];
const CONTRASTS: { label: string; value: Contrast }[] = [
  { label: "Normal", value: "normal" },
  { label: "High", value: "high" },
];

export default function SettingsScreen() {
  const { apiRequest, updatePreferences, user } = useAuth();
  const [preferences, setPreferences] = useState<AccountPreferences>(() => ({
    ...DEFAULT_PREFERENCES,
    preferredLanguage: user?.preferredLanguage ?? DEFAULT_PREFERENCES.preferredLanguage,
    accessibilityPreferences: user?.accessibilityPreferences ?? DEFAULT_PREFERENCES.accessibilityPreferences,
    voicePreferences: user?.voicePreferences ?? DEFAULT_PREFERENCES.voicePreferences,
  }));
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const loadPreferences = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const saved = await getAccountPreferences(apiRequest);
      setPreferences(saved);
      setHasLoaded(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "We couldn't load your settings.");
    } finally {
      setIsLoading(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    void loadPreferences();
  }, [loadPreferences]);

  const updateAccessibility = <K extends keyof AccountPreferences["accessibilityPreferences"]>(
    key: K,
    value: AccountPreferences["accessibilityPreferences"][K],
  ) => {
    setPreferences((current) => ({
      ...current,
      accessibilityPreferences: { ...current.accessibilityPreferences, [key]: value },
    }));
    setSavedMessage(null);
  };

  const updateVoice = <K extends keyof AccountPreferences["voicePreferences"]>(
    key: K,
    value: AccountPreferences["voicePreferences"][K],
  ) => {
    setPreferences((current) => ({
      ...current,
      voicePreferences: { ...current.voicePreferences, [key]: value },
    }));
    setSavedMessage(null);
  };

  const save = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSavedMessage(null);
    try {
      const saved = await updatePreferences(preferences);
      setPreferences(saved);
      setSavedMessage("Your settings have been saved.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "We couldn't save your settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const adjustRate = (delta: number) => {
    const next = Math.min(2, Math.max(0.5, Math.round((preferences.voicePreferences.audioRate + delta) * 10) / 10));
    updateVoice("audioRate", next);
  };

  const adjustVolume = (delta: number) => {
    const next = Math.min(1, Math.max(0, Math.round((preferences.voicePreferences.audioVolume + delta) * 10) / 10));
    updateVoice("audioVolume", next);
  };

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        <View style={styles.headingRow}>
          <View style={styles.headingCopy}>
            <Text style={styles.eyebrow}>MDATE PREFERENCES</Text>
            <Text accessibilityRole="header" style={styles.title}>Settings</Text>
            <Text style={styles.description}>Choose how MDATE looks, sounds and responds to you.</Text>
          </View>
          <View style={styles.headingIcon}>
            <Ionicons name="settings-outline" size={30} color="#174EA6" />
          </View>
        </View>

        {isLoading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color="#174EA6" size="large" />
            <Text style={styles.stateText}>Loading your settings…</Text>
          </View>
        ) : !hasLoaded ? (
          <View style={styles.stateCard}>
            <Ionicons name="cloud-offline-outline" size={30} color="#174EA6" />
            <Text style={styles.stateText}>{errorMessage ?? "We couldn't load your settings."}</Text>
            <Pressable accessibilityRole="button" onPress={() => void loadPreferences()} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeading}>
                <Ionicons name="globe-outline" size={22} color="#174EA6" />
                <Text style={styles.sectionTitle}>Language</Text>
              </View>
              <Text style={styles.helper}>Choose your preferred language.</Text>
              <ChoiceGroup
                label="Preferred language"
                value={preferences.preferredLanguage}
                options={LANGUAGES.map((item) => ({ label: item.label, value: item.value }))}
                onChange={(value) => {
                  setPreferences((current) => ({ ...current, preferredLanguage: value }));
                  setSavedMessage(null);
                }}
                disabled={isSaving}
              />
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeading}>
                <Ionicons name="eye-outline" size={22} color="#174EA6" />
                <Text style={styles.sectionTitle}>Accessibility</Text>
              </View>
              <Text style={styles.label}>Text size</Text>
              <ChoiceGroup
                label="Text size"
                value={preferences.accessibilityPreferences.textSize}
                options={TEXT_SIZES}
                onChange={(value) => updateAccessibility("textSize", value)}
                disabled={isSaving}
              />
              <Text style={styles.label}>Contrast</Text>
              <ChoiceGroup
                label="Contrast"
                value={preferences.accessibilityPreferences.contrast}
                options={CONTRASTS}
                onChange={(value) => updateAccessibility("contrast", value)}
                disabled={isSaving}
              />
              <SettingSwitch
                title="Alternative input"
                description="Enable alternative ways to interact with exercises when available."
                value={preferences.accessibilityPreferences.alternativeInputOn}
                onValueChange={(value) => updateAccessibility("alternativeInputOn", value)}
                disabled={isSaving}
              />
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeading}>
                <Ionicons name="volume-high-outline" size={22} color="#174EA6" />
                <Text style={styles.sectionTitle}>Voice preferences</Text>
              </View>
              <Text style={styles.label}>Preferred voice ID (optional)</Text>
              <TextInput
                accessibilityLabel="Preferred voice ID"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={100}
                onChangeText={(value) => updateVoice("preferredVoiceId", value.trim() || null)}
                placeholder="Use the default voice"
                placeholderTextColor="#718096"
                style={styles.input}
                value={preferences.voicePreferences.preferredVoiceId ?? ""}
                editable={!isSaving}
              />
              <Text style={styles.helper}>Leave blank to use the default voice. Available voices depend on the configured speech service.</Text>

              <StepperControl
                label="Speech rate"
                description="0.5 is slower; 2.0 is faster."
                value={preferences.voicePreferences.audioRate.toFixed(1)}
                decreaseLabel="Decrease speech rate"
                increaseLabel="Increase speech rate"
                onDecrease={() => adjustRate(-0.1)}
                onIncrease={() => adjustRate(0.1)}
                decreaseDisabled={preferences.voicePreferences.audioRate <= 0.5}
                increaseDisabled={preferences.voicePreferences.audioRate >= 2}
                disabled={isSaving}
              />
              <StepperControl
                label="Voice volume"
                description="Adjust spoken instruction volume."
                value={`${Math.round(preferences.voicePreferences.audioVolume * 100)}%`}
                decreaseLabel="Decrease voice volume"
                increaseLabel="Increase voice volume"
                onDecrease={() => adjustVolume(-0.1)}
                onIncrease={() => adjustVolume(0.1)}
                decreaseDisabled={preferences.voicePreferences.audioVolume <= 0}
                increaseDisabled={preferences.voicePreferences.audioVolume >= 1}
                disabled={isSaving}
              />
              <SettingSwitch
                title="Disable voice output"
                description="Turn off spoken audio while keeping written instructions available."
                value={preferences.voicePreferences.voiceDisabled}
                onValueChange={(value) => updateVoice("voiceDisabled", value)}
                disabled={isSaving}
              />
            </View>

            {errorMessage ? <Text accessibilityRole="alert" style={styles.error}>{errorMessage}</Text> : null}
            {savedMessage ? <Text accessibilityLiveRegion="polite" style={styles.success}>{savedMessage}</Text> : null}

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ busy: isSaving, disabled: isSaving }}
              disabled={isSaving}
              onPress={() => void save()}
              style={[styles.saveButton, isSaving && styles.disabled]}
            >
              {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Save settings</Text>}
            </Pressable>
          </>
        )}
      </View>
    </ScrollView>
  );
}

function ChoiceGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: T;
  options: readonly { label: string; value: T }[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <View accessibilityLabel={label} style={styles.choiceGroup}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${option.label}`}
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            onPress={() => onChange(option.value)}
            style={[styles.choice, selected && styles.choiceSelected]}
          >
            <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SettingSwitch({
  title,
  description,
  value,
  onValueChange,
  disabled = false,
}: {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchCopy}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.helper}>{description}</Text>
      </View>
      <Switch
        accessibilityLabel={title}
        disabled={disabled}
        onValueChange={onValueChange}
        value={value}
        trackColor={{ false: "#CBD5E1", true: "#93B4E8" }}
        thumbColor={value ? "#174EA6" : "#FFFFFF"}
      />
    </View>
  );
}

function StepperControl({
  label,
  description,
  value,
  decreaseLabel,
  increaseLabel,
  onDecrease,
  onIncrease,
  decreaseDisabled,
  increaseDisabled,
  disabled = false,
}: {
  label: string;
  description: string;
  value: string;
  decreaseLabel: string;
  increaseLabel: string;
  onDecrease: () => void;
  onIncrease: () => void;
  decreaseDisabled: boolean;
  increaseDisabled: boolean;
  disabled?: boolean;
}) {
  return (
    <View style={styles.stepperBlock}>
      <View style={styles.stepperHeader}>
        <View style={styles.stepperCopy}>
          <Text style={styles.settingTitle}>{label}</Text>
          <Text style={styles.helper}>{description}</Text>
        </View>
        <Text style={styles.stepperValue}>{value}</Text>
      </View>
      <View style={styles.stepperControls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={decreaseLabel}
          accessibilityState={{ disabled: decreaseDisabled || disabled }}
          disabled={decreaseDisabled || disabled}
          onPress={onDecrease}
          style={[styles.stepperButton, (decreaseDisabled || disabled) && styles.disabledControl]}
        >
          <Ionicons name="remove" size={22} color="#174EA6" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={increaseLabel}
          accessibilityState={{ disabled: increaseDisabled || disabled }}
          disabled={increaseDisabled || disabled}
          onPress={onIncrease}
          style={[styles.stepperButton, (increaseDisabled || disabled) && styles.disabledControl]}
        >
          <Ionicons name="add" size={22} color="#174EA6" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, backgroundColor: "#F8FAFC", paddingHorizontal: 20, paddingTop: 28, paddingBottom: 40 },
  content: { width: "100%", maxWidth: 580, alignSelf: "center", gap: 15 },
  headingRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 3 },
  headingCopy: { flex: 1, gap: 5 },
  eyebrow: { color: "#174EA6", fontSize: 12, fontWeight: "800", letterSpacing: 1.3 },
  title: { color: "#172B4D", fontSize: 29, lineHeight: 37, fontWeight: "800" },
  description: { color: "#52657A", fontSize: 15, lineHeight: 22 },
  headingIcon: { width: 58, height: 58, borderRadius: 17, backgroundColor: "#EAF2FF", alignItems: "center", justifyContent: "center" },
  section: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DFE7F0", borderRadius: 17, padding: 17, gap: 12 },
  sectionHeading: { flexDirection: "row", alignItems: "center", gap: 9 },
  sectionTitle: { color: "#172B4D", fontSize: 19, lineHeight: 26, fontWeight: "800" },
  label: { color: "#243B53", fontSize: 15, lineHeight: 22, fontWeight: "800", marginTop: 2 },
  settingTitle: { color: "#243B53", fontSize: 15, lineHeight: 22, fontWeight: "700" },
  helper: { color: "#65788D", fontSize: 13, lineHeight: 19 },
  choiceGroup: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: { minHeight: 45, flexGrow: 1, minWidth: 90, borderWidth: 1.5, borderColor: "#CBD7E4", borderRadius: 11, paddingHorizontal: 12, paddingVertical: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  choiceSelected: { borderColor: "#174EA6", backgroundColor: "#EFF6FF" },
  choiceText: { color: "#334B63", fontSize: 14, lineHeight: 20, fontWeight: "600", textAlign: "center" },
  choiceTextSelected: { color: "#174EA6", fontWeight: "800" },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 8, paddingBottom: 2 },
  switchCopy: { flex: 1, gap: 3 },
  input: { minHeight: 50, borderWidth: 1.5, borderColor: "#B8C7D9", borderRadius: 11, paddingHorizontal: 13, backgroundColor: "#FFFFFF", color: "#172B4D", fontSize: 16 },
  stepperBlock: { borderTopWidth: 1, borderTopColor: "#E6EDF5", paddingTop: 12, gap: 9 },
  stepperHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepperCopy: { flex: 1, gap: 3 },
  stepperValue: { minWidth: 55, textAlign: "right", color: "#174EA6", fontSize: 17, fontWeight: "800", fontVariant: ["tabular-nums"] },
  stepperControls: { flexDirection: "row", gap: 8 },
  stepperButton: { minHeight: 43, flex: 1, borderWidth: 1.5, borderColor: "#B8C7D9", borderRadius: 10, backgroundColor: "#F8FAFC", alignItems: "center", justifyContent: "center" },
  disabledControl: { opacity: 0.35 },
  stateCard: { minHeight: 150, borderWidth: 1, borderColor: "#DFE7F0", borderRadius: 16, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", gap: 12, padding: 22 },
  stateText: { color: "#52657A", fontSize: 15, lineHeight: 22 },
  error: { color: "#B42318", fontSize: 14, lineHeight: 21 },
  success: { color: "#18794E", fontSize: 14, lineHeight: 21, fontWeight: "700" },
  saveButton: { minHeight: 56, borderRadius: 13, backgroundColor: "#174EA6", alignItems: "center", justifyContent: "center", paddingHorizontal: 18, marginTop: 2 },
  saveButtonText: { color: "#FFFFFF", fontSize: 17, lineHeight: 24, fontWeight: "800" },
  disabled: { opacity: 0.65 },
});
