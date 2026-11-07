import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useAuth } from "../../auth/AuthProvider";
import TrainingHeader from "../components/TrainingHeader";
import TrainingStateCard from "../components/TrainingStateCard";
import { getQSet, localize, localizeList, type Language, type QSetDetails } from "../trainingApi";

type InputMode = "keyboard" | "mic";

export default function ChallengeScreen() {
  const { qSetId } = useLocalSearchParams<{ qSetId: string }>();
  const router = useRouter();
  const { getAuthHeaders } = useAuth();

  const [content, setContent] = useState<QSetDetails | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [language, setLanguage] = useState<Language>("en");
  const [inputMode, setInputMode] = useState<InputMode>("keyboard");
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
      setInputMode("keyboard");
    } catch (loadError) {
      setError(loadError instanceof Error
        ? loadError.message
        : "We couldn't load this practice set.");
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, qSetId]);

  useEffect(() => {
    void load();
  }, [load]);

  const question = content?.questions[questionIndex];
  const prompt = localize(question?.content.prompt, language);
  const hints = useMemo(
    () => localizeList(question?.content.hints, language),
    [question, language],
  );
  const media = question?.media.filter((item) => item.mimeType.startsWith("image/")) ?? [];
  const progress = content?.questions.length
    ? ((questionIndex + 1) / content.questions.length) * 100
    : 0;

  const changeQuestion = (nextIndex: number) => {
    setQuestionIndex(nextIndex);
    setAnswer("");
    setShowHints(false);
    setInputMode("keyboard");
  };

  const toggleInputMode = (mode: InputMode) => {
    setInputMode(mode);
    if (mode === "mic") {
      Alert.alert(
        language === "ms" ? "Input suara belum tersedia" : "Speech input isn't available yet",
        language === "ms"
          ? "Rakaman dan penghantaran suara belum disambungkan pada skrin ini."
          : "Voice recording and submission are not connected to this screen yet.",
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        <TrainingHeader
          eyebrow="PRACTICE"
          language={language}
          onToggleLanguage={() => setLanguage((current) => current === "en" ? "ms" : "en")}
          onBack={() => router.back()}
          backLabel="Return to activities"
        />

        {loading ? (
          <TrainingStateCard title="Loading your challenge…" loading />
        ) : error ? (
          <TrainingStateCard
            title="This challenge couldn't be loaded"
            message={error}
            actionLabel="Try again"
            onAction={() => void load()}
          />
        ) : content && question ? (
          <>
            <Text accessibilityRole="header" style={styles.title}>
              {localize(content.submodule.name, language)}
            </Text>

            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>
                {language === "ms" ? "Kedudukan soalan" : "Question position"}
              </Text>
              <Text style={styles.progressCount}>
                {questionIndex + 1} / {content.questions.length}
              </Text>
            </View>
            <View
              accessible
              accessibilityRole="progressbar"
              accessibilityLabel="Question position"
              accessibilityValue={{ min: 0, max: 100, now: Math.round(progress) }}
              style={styles.progressTrack}
            >
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>

            <View style={styles.promptCard}>
              <Text style={styles.prompt}>
                {prompt || (language === "ms"
                  ? "Lihat gambar dan jawab apabila anda bersedia."
                  : "Look at the picture and respond when you're ready.")}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Read prompt aloud"
                onPress={() => Alert.alert(
                  language === "ms" ? "Bacaan audio" : "Read aloud",
                  language === "ms"
                    ? "Fungsi teks-ke-pertuturan belum disambungkan."
                    : "Text-to-speech isn't connected yet.",
                )}
                style={styles.speakerButton}
              >
                <Ionicons name="volume-high-outline" size={24} color="#FFFFFF" />
              </Pressable>
            </View>

            <View style={styles.mediaStage}>
              {media.length === 0 ? (
                <View style={styles.noMedia}>
                  <Ionicons name="image-outline" size={42} color="#8AA0B8" />
                  <Text style={styles.noMediaText}>
                    {language === "ms" ? "Tiada gambar untuk soalan ini." : "No picture is attached to this question."}
                  </Text>
                </View>
              ) : (
                <View style={styles.mediaRow}>
                  {media.map((item) => failedMediaIds.includes(item.id) ? (
                    <View key={item.id} style={styles.imageFallback}>
                      <Ionicons name="image-outline" size={32} color="#8AA0B8" />
                      <Text style={styles.noMediaText}>
                        {language === "ms" ? "Gambar tidak tersedia" : "Image unavailable"}
                      </Text>
                    </View>
                  ) : (
                    <View key={item.id} style={styles.mediaItem}>
                      <Image
                        accessibilityLabel={localize(item.altText, language)}
                        source={{ uri: item.url }}
                        resizeMode="contain"
                        style={styles.mediaImage}
                        onError={() => setFailedMediaIds((current) =>
                          current.includes(item.id) ? current : [...current, item.id])}
                      />
                      {media.length > 1 ? (
                        <Text style={styles.mediaLabel}>
                          {item.role === "outline_image"
                            ? (language === "ms" ? "Hitam putih" : "Black and white")
                            : item.role === "color_image"
                              ? (language === "ms" ? "Berwarna" : "Colour")
                              : localize(item.altText, language)}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              )}
            </View>

            <Text style={styles.fieldLabel}>
              {language === "ms" ? "Cara menjawab" : "How would you like to respond?"}
            </Text>
            <View style={styles.modeRow}>
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected: inputMode === "keyboard" }}
                onPress={() => toggleInputMode("keyboard")}
                style={[styles.modeButton, inputMode === "keyboard" && styles.modeButtonSelected]}
              >
                <Ionicons name="keyboard-outline" size={20} color="#174EA6" />
                <Text style={styles.modeText}>{language === "ms" ? "Papan kekunci" : "Keyboard"}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected: inputMode === "mic" }}
                onPress={() => toggleInputMode("mic")}
                style={[styles.modeButton, inputMode === "mic" && styles.modeButtonSelected]}
              >
                <Ionicons name="mic-outline" size={20} color="#174EA6" />
                <Text style={styles.modeText}>{language === "ms" ? "Suara" : "Speech"}</Text>
              </Pressable>
            </View>

            {inputMode === "keyboard" ? (
              <>
                <TextInput
                  accessibilityLabel={language === "ms" ? "Jawapan anda" : "Your answer"}
                  value={answer}
                  onChangeText={setAnswer}
                  placeholder={language === "ms" ? "Taip jawapan di sini" : "Type your answer here"}
                  placeholderTextColor="#718096"
                  style={styles.answerInput}
                  returnKeyType="done"
                />
                <Text style={styles.note}>
                  {language === "ms"
                    ? "Jawapan anda hanya disimpan pada skrin ini. Penilaian belum disambungkan."
                    : "Your response stays on this screen only. Assessment and submission are not connected yet."}
                </Text>
              </>
            ) : (
              <View style={styles.speechNotice}>
                <Ionicons name="mic-off-outline" size={25} color="#64748B" />
                <Text style={styles.note}>
                  {language === "ms"
                    ? "Input suara akan tersedia selepas integrasi rakaman dan penilaian selesai."
                    : "Speech input will be available after recording and assessment integration is complete."}
                </Text>
              </View>
            )}

            <Pressable
              accessibilityRole="button"
              onPress={() => setShowHints((shown) => !shown)}
              style={styles.hintButton}
            >
              <Ionicons name="bulb-outline" size={20} color="#174EA6" />
              <Text style={styles.hintButtonText}>
                {showHints
                  ? (language === "ms" ? "Sembunyikan petunjuk" : "Hide hints")
                  : (language === "ms" ? "Tunjukkan petunjuk" : "Show hints")}
              </Text>
            </Pressable>
            {showHints ? (
              <View style={styles.hintCard}>
                <Text style={styles.hintTitle}>{language === "ms" ? "Petunjuk" : "Hints"}</Text>
                {hints.length ? hints.map((hint, index) => (
                  <Text key={`${question.id}-hint-${index}`} style={styles.hintText}>
                    {index + 1}. {hint}
                  </Text>
                )) : (
                  <Text style={styles.hintText}>
                    {language === "ms" ? "Tiada petunjuk tersedia." : "No hints are available."}
                  </Text>
                )}
              </View>
            ) : null}

            <View style={styles.pager}>
              <Pressable
                accessibilityRole="button"
                disabled={questionIndex === 0}
                onPress={() => changeQuestion(questionIndex - 1)}
                style={[styles.pageButton, questionIndex === 0 && styles.disabledButton]}
              >
                <Ionicons name="chevron-back" size={20} color="#174EA6" />
                <Text style={styles.pageButtonText}>
                  {language === "ms" ? "Sebelumnya" : "Previous"}
                </Text>
              </Pressable>
              {questionIndex < content.questions.length - 1 ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => changeQuestion(questionIndex + 1)}
                  style={styles.nextButton}
                >
                  <Text style={styles.nextButtonText}>
                    {language === "ms" ? "Seterusnya" : "Next question"}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                </Pressable>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.back()}
                  style={styles.nextButton}
                >
                  <Text style={styles.nextButtonText}>
                    {language === "ms" ? "Tamat latihan" : "Finish practice"}
                  </Text>
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                </Pressable>
              )}
            </View>
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    padding: 18,
    paddingTop: 16,
    paddingBottom: 34,
    backgroundColor: "#F8FAFC",
  },
  content: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    gap: 14,
  },
  title: {
    color: "#172B4D",
    fontSize: 25,
    lineHeight: 33,
    fontWeight: "800",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: { color: "#52657A", fontSize: 13, fontWeight: "700" },
  progressCount: { color: "#174EA6", fontSize: 13, fontWeight: "800" },
  progressTrack: {
    width: "100%",
    height: 10,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  progressFill: { height: "100%", borderRadius: 6, backgroundColor: "#3B82F6" },
  promptCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DFE7F0",
    borderRadius: 16,
    padding: 15,
  },
  prompt: {
    flex: 1,
    color: "#172B4D",
    fontSize: 19,
    lineHeight: 28,
    fontWeight: "700",
  },
  speakerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#174EA6",
    alignItems: "center",
    justifyContent: "center",
  },
  mediaStage: {
    minHeight: 220,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DFE7F0",
    borderRadius: 18,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  mediaRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  mediaItem: {
    flex: 1,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  mediaImage: { width: "100%", height: 220 },
  mediaLabel: {
    color: "#52657A",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  noMedia: { alignItems: "center", gap: 8, padding: 30 },
  noMediaText: { color: "#64748B", fontSize: 14, lineHeight: 20, textAlign: "center" },
  imageFallback: {
    minWidth: 120,
    minHeight: 140,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
  },
  fieldLabel: { color: "#243B53", fontSize: 16, lineHeight: 23, fontWeight: "800" },
  modeRow: { flexDirection: "row", gap: 10 },
  modeButton: {
    flex: 1,
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#B8C7D9",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
  },
  modeButtonSelected: { borderColor: "#174EA6", backgroundColor: "#EFF6FF" },
  modeText: { color: "#174EA6", fontSize: 15, fontWeight: "800" },
  answerInput: {
    minHeight: 56,
    borderWidth: 1.5,
    borderColor: "#B8C7D9",
    borderRadius: 12,
    paddingHorizontal: 15,
    backgroundColor: "#FFFFFF",
    color: "#172B4D",
    fontSize: 18,
  },
  speechNotice: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
  },
  note: { color: "#64748B", fontSize: 13, lineHeight: 20 },
  hintButton: {
    minHeight: 48,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#B8C7D9",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 15,
  },
  hintButtonText: { color: "#174EA6", fontSize: 15, fontWeight: "800" },
  hintCard: {
    padding: 15,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#D7E7FC",
    borderRadius: 14,
    gap: 7,
  },
  hintTitle: { color: "#174EA6", fontSize: 16, fontWeight: "800" },
  hintText: { color: "#334B63", fontSize: 15, lineHeight: 23 },
  pager: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginTop: 3,
  },
  pageButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#B8C7D9",
  },
  pageButtonText: { color: "#174EA6", fontSize: 14, fontWeight: "800" },
  nextButton: {
    flex: 1,
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#174EA6",
  },
  nextButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  disabledButton: { opacity: 0.35 },
});
