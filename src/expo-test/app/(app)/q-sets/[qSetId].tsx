import { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAuthFlow } from "../../../src/features/auth/AuthFlowProvider";
import { getQSet, localize, localizeList, type Language, type QSetDetails } from "../../../src/features/training/trainingApi";

export default function QSetScreen() {
  const { qSetId } = useLocalSearchParams<{ qSetId: string }>();
  const router = useRouter();
  const { getAuthHeaders } = useAuthFlow();
  const [content, setContent] = useState<QSetDetails | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [language, setLanguage] = useState<Language>("en");
  const [answer, setAnswer] = useState("");
  const [showHints, setShowHints] = useState(false);
  const [failedMediaIds, setFailedMediaIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!qSetId) return;
    setLoading(true);
    setError(null);
    try {
      setContent(await getQSet(qSetId, getAuthHeaders));
      setQuestionIndex(0);
      setAnswer("");
      setShowHints(false);
      setFailedMediaIds([]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "We couldn't load this practice set.");
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, qSetId]);
  useEffect(() => { void load(); }, [load]);

  const question = content?.questions[questionIndex];
  const prompt = localize(question?.content.prompt, language);
  const hints = useMemo(() => localizeList(question?.content.hints, language), [question, language]);
  const media = question?.media.filter((item) => item.mimeType.startsWith("image/")) ?? [];

  const changeQuestion = (nextIndex: number) => {
    setQuestionIndex(nextIndex);
    setAnswer("");
    setShowHints(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backButton}><Ionicons name="arrow-back" size={24} color="#172B4D" /></Pressable>
          <Text style={styles.eyebrow}>PRACTICE</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Switch language" onPress={() => setLanguage((current) => current === "en" ? "ms" : "en")} style={styles.languageBadge}><Text style={styles.languageText}>{language.toUpperCase()}</Text></Pressable>
        </View>
        {loading ? <Text style={styles.description}>Loading your question…</Text> : error ? (
          <View style={styles.card}><Text style={styles.cardTitle}>Question couldn't be loaded</Text><Text style={styles.description}>{error}</Text><Pressable accessibilityRole="button" onPress={() => void load()} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Try again</Text></Pressable></View>
        ) : content && question ? <>
          <Text accessibilityRole="header" style={styles.title}>{localize(content.submodule.name, language)}</Text>
          <View style={styles.promptCard}>
            <Text style={styles.prompt}>{prompt || "Look at the picture and take your time."}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Read prompt aloud" onPress={() => Alert.alert("Read aloud", "Text-to-speech will be connected in the next activity step.")} style={styles.speakerButton}><Ionicons name="volume-high-outline" size={25} color="#FFFFFF" /></Pressable>
          </View>
          <Text style={styles.questionCount}>Question {questionIndex + 1} of {content.questions.length}</Text>
          <View style={styles.mediaStage}>
            {media.length === 0 ? <View style={styles.noMedia}><Ionicons name="image-outline" size={42} color="#8AA0B8" /><Text style={styles.noMediaText}>No picture is attached to this question.</Text></View> : (
              <View style={styles.mediaRow}>
                {media.map((item) => failedMediaIds.includes(item.id) ? (
                  <View key={item.id} style={styles.imageFallback}><Ionicons name="image-outline" size={32} color="#8AA0B8" /><Text style={styles.noMediaText}>Image unavailable</Text></View>
                ) : (
                  <View key={item.id} style={styles.mediaItem}>
                    <Image accessibilityLabel={localize(item.altText, language)} source={{ uri: item.url }} resizeMode="contain" style={styles.mediaImage} onError={() => setFailedMediaIds((current) => current.includes(item.id) ? current : [...current, item.id])} />
                    {media.length > 1 ? <Text style={styles.mediaLabel}>{item.role === "outline_image" ? (language === "ms" ? "Hitam putih" : "Black and white") : item.role === "color_image" ? (language === "ms" ? "Berwarna" : "Colour") : localize(item.altText, language)}</Text> : null}
                  </View>
                ))}
              </View>
            )}
          </View>
          <Text style={styles.fieldLabel}>{language === "ms" ? "Jawapan anda" : "Your answer"}</Text>
          <TextInput accessibilityLabel={language === "ms" ? "Jawapan anda" : "Your answer"} value={answer} onChangeText={setAnswer} placeholder={language === "ms" ? "Taip jawapan di sini" : "Type your answer here"} placeholderTextColor="#718096" style={styles.answerInput} returnKeyType="done" />
          <View style={styles.actionRow}>
            <Pressable accessibilityRole="button" onPress={() => setShowHints((shown) => !shown)} style={styles.secondaryButton}>
              <Ionicons name="bulb-outline" size={20} color="#174EA6" /><Text style={styles.secondaryButtonText}>{showHints ? (language === "ms" ? "Sembunyikan petunjuk" : "Hide hints") : (language === "ms" ? "Petunjuk" : "Hint")}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => Alert.alert(language === "ms" ? "Input suara" : "Voice input", language === "ms" ? "Rakaman suara akan disambungkan dalam langkah aktiviti seterusnya." : "Speech recording will be connected in the next activity step.")} style={styles.secondaryButton}>
              <Ionicons name="mic-outline" size={20} color="#174EA6" /><Text style={styles.secondaryButtonText}>{language === "ms" ? "Bercakap" : "Speak"}</Text>
            </Pressable>
          </View>
          {showHints ? <View style={styles.hintCard}><Text style={styles.hintTitle}>{language === "ms" ? "Petunjuk" : "Hints"}</Text>{hints.length ? hints.map((hint, index) => <Text key={`${question.id}-hint-${index}`} style={styles.hintText}>{index + 1}. {hint}</Text>) : <Text style={styles.hintText}>{language === "ms" ? "Tiada petunjuk tersedia." : "No hints are available."}</Text>}</View> : null}
          <Text style={styles.note}>{language === "ms" ? "Jawapan belum dinilai atau disimpan. Penilaian dan kemajuan akan disambungkan kemudian." : "Answers are not evaluated or saved yet. Assessment and progress will be connected later."}</Text>
          {content.questions.length > 1 ? <View style={styles.pager}>
            <Pressable accessibilityRole="button" disabled={questionIndex === 0} onPress={() => changeQuestion(questionIndex - 1)} style={[styles.pageButton, questionIndex === 0 && styles.disabledButton]}><Ionicons name="chevron-back" size={20} color="#174EA6" /><Text style={styles.pageButtonText}>{language === "ms" ? "Sebelumnya" : "Previous"}</Text></Pressable>
            <Pressable accessibilityRole="button" disabled={questionIndex === content.questions.length - 1} onPress={() => changeQuestion(questionIndex + 1)} style={[styles.pageButton, questionIndex === content.questions.length - 1 && styles.disabledButton]}><Text style={styles.pageButtonText}>{language === "ms" ? "Seterusnya" : "Next"}</Text><Ionicons name="chevron-forward" size={20} color="#174EA6" /></Pressable>
          </View> : null}
        </> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: 20, paddingTop: 18, paddingBottom: 32, backgroundColor: "#F8FAFC" },
  content: { width: "100%", maxWidth: 640, alignSelf: "center", gap: 14 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 2 },
  backButton: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DFE7F0" },
  eyebrow: { flex: 1, color: "#174EA6", fontSize: 12, fontWeight: "800", letterSpacing: 1.2 },
  languageBadge: { minWidth: 48, height: 40, borderRadius: 12, borderWidth: 1, borderColor: "#B8C7D9", alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  languageText: { color: "#174EA6", fontSize: 15, fontWeight: "800" },
  title: { color: "#172B4D", fontSize: 25, lineHeight: 33, fontWeight: "800" },
  description: { color: "#52657A", fontSize: 16, lineHeight: 25 },
  promptCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DFE7F0", borderRadius: 16, padding: 16 },
  prompt: { flex: 1, color: "#172B4D", fontSize: 20, lineHeight: 29, fontWeight: "700" },
  speakerButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#174EA6", alignItems: "center", justifyContent: "center" },
  questionCount: { color: "#52657A", fontSize: 14, lineHeight: 20, fontWeight: "700" },
  mediaStage: { minHeight: 220, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DFE7F0", borderRadius: 18, padding: 12, alignItems: "center", justifyContent: "center" },
  mediaRow: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap" },
  mediaItem: { flex: 1, minWidth: 120, alignItems: "center", justifyContent: "center", gap: 6 },
  mediaImage: { width: "100%", height: 220 },
  mediaLabel: { color: "#52657A", fontSize: 13, lineHeight: 18, fontWeight: "700", textAlign: "center" },
  noMedia: { alignItems: "center", gap: 8, padding: 30 },
  imageFallback: { minWidth: 120, minHeight: 140, flex: 1, alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#F1F5F9", borderRadius: 12 },
  noMediaText: { color: "#64748B", fontSize: 14, lineHeight: 20, textAlign: "center" },
  fieldLabel: { color: "#243B53", fontSize: 16, lineHeight: 23, fontWeight: "800", marginTop: 2 },
  answerInput: { minHeight: 56, borderWidth: 1.5, borderColor: "#B8C7D9", borderRadius: 12, paddingHorizontal: 15, backgroundColor: "#FFFFFF", color: "#172B4D", fontSize: 18 },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  secondaryButton: { flex: 1, minWidth: 130, minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: "#B8C7D9", borderRadius: 12, paddingHorizontal: 12 },
  secondaryButtonText: { color: "#174EA6", fontSize: 15, fontWeight: "800" },
  hintCard: { padding: 16, backgroundColor: "#EFF6FF", borderRadius: 14, gap: 7 },
  hintTitle: { color: "#174EA6", fontSize: 17, fontWeight: "800" },
  hintText: { color: "#334B63", fontSize: 15, lineHeight: 23 },
  note: { color: "#64748B", fontSize: 13, lineHeight: 20 },
  pager: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginTop: 4 },
  pageButton: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 14, borderRadius: 12, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#B8C7D9" },
  pageButtonText: { color: "#174EA6", fontSize: 15, fontWeight: "800" },
  disabledButton: { opacity: 0.35 },
  card: { gap: 12, borderRadius: 16, borderWidth: 1, borderColor: "#DFE7F0", backgroundColor: "#FFFFFF", padding: 20 },
  cardTitle: { color: "#172B4D", fontSize: 18, lineHeight: 25, fontWeight: "800" },
  primaryButton: { minHeight: 52, borderRadius: 12, backgroundColor: "#174EA6", alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
});
