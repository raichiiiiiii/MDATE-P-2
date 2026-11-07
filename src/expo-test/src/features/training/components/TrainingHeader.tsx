import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
          <Ionicons name="arrow-back" size={23} color="#172B4D" />
        </Pressable>
      ) : null}
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Switch language to ${language === "en" ? "Malay" : "English"}`}
        onPress={onToggleLanguage}
        style={styles.languageButton}
      >
        <Text style={styles.languageText}>{language.toUpperCase()}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DFE7F0",
  },
  eyebrow: {
    flex: 1,
    color: "#174EA6",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  languageButton: {
    minWidth: 48,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#B8C7D9",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  languageText: {
    color: "#174EA6",
    fontSize: 15,
    fontWeight: "800",
  },
});
