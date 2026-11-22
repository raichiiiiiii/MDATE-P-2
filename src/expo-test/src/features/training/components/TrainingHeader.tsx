import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../../../shared/ui/native";
import type { Language } from "../trainingApi";

type TrainingHeaderProps = {
  eyebrow: string;
  language: Language;
  onToggleLanguage: () => void;
  onBack?: () => void;
  backLabel?: string;
};

export default function TrainingHeader({
  eyebrow,
  language,
  onToggleLanguage,
  onBack,
  backLabel = "Go back",
}: TrainingHeaderProps) {
  return (
    <View style={styles.row}>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={backLabel}
          onPress={onBack}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#172B4D" />
        </Pressable>
      ) : null}
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      {/* <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Switch language to ${language === "en" ? "Malay" : "English"}`}
        onPress={onToggleLanguage}
        style={styles.languageButton}
      >
        <Text style={styles.languageText}>{language.toUpperCase()}</Text>
      </Pressable> */}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#DFE7F0",
  },
  eyebrow: {
    flex: 1,
    color: "#174EA6",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  /* languageButton: {
    minWidth: 54,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#B8C7D9",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
  },
  languageText: {
    color: "#174EA6",
    fontSize: 16,
    fontWeight: "800",
  }, */
});
