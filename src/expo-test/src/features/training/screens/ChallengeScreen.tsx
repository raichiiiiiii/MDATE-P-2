import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAudioRecorder, useAudioRecorderState, AudioModule, RecordingPresets, setAudioModeAsync } from "expo-audio";
import * as Speech from "expo-speech";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useAuth } from "../../auth/AuthProvider";
import TrainingStateCard from "../components/TrainingStateCard";
import {
  getPrompt,
  getQSet,
  localize,
  localizeList,
  type Language,
  type QSetDetails,
} from "../trainingApi";
import { transcribeRecording } from "../speechApi";

type InputMode = "keyboard" | "mic";

const COPY = {
  en: {
    practice: "TRY TO GUESS",
    points: "PTS",
    pointsUnavailable: "Balance not connected",
    question: "QUESTION",
    secondsUnavailable: "Question progress",
    clue: "PICTURE CLUE",
    noImage: "There is no picture for this question.",
    imageUnavailable: "Picture unavailable",
    prompt: "WHAT IS THIS?",
    fallbackPrompt: "Look at the picture. What do you see?",
    hint: "Hint",
    hintNext: "Show next hint",
    hintReset: "Hide hints",
    noHints: "No hints are available for this question.",
    answer: "YOUR ANSWER",
    answerPlaceholder: "Type your answer here…",
    keyboard: "Keyboard",
    micStart: "Tap to speak",
    micStop: "Tap when finished",
    recording: "Recording… speak clearly, then tap the microphone to finish.",
    transcribing: "Transcribing your answer…",
    transcriptAdded: "Your spoken answer was added. You can edit it below.",
    noSpeech: "No speech was detected. Please try again or type your answer.",
    permission: "Microphone access is needed to record your answer.",
    speechError: "We couldn't transcribe that recording. Please try again or type your answer.",
    speaker: "Read the question aloud",
    previous: "Previous",
    next: "Next question",
    finish: "Finish practice",
    return: "Return to activities",
    loading: "Loading your challenge…",
    loadError: "This challenge couldn't be loaded",
    hintCount: "HINT",
    micPermissionTitle: "Microphone permission",
  },
  ms: {
    practice: "CUBA TEKA",
    points: "MATA",
    pointsUnavailable: "Baki belum disambungkan",
    question: "SOALAN",
    secondsUnavailable: "Kemajuan soalan",
    clue: "PETUNJUK GAMBAR",
    noImage: "Tiada gambar untuk soalan ini.",
    imageUnavailable: "Gambar tidak tersedia",
    prompt: "APAKAH INI?",
    fallbackPrompt: "Lihat gambar. Apakah yang anda nampak?",
    hint: "Petunjuk",
    hintNext: "Tunjukkan petunjuk seterusnya",
    hintReset: "Sembunyikan petunjuk",
    noHints: "Tiada petunjuk untuk soalan ini.",
    answer: "JAWAPAN ANDA",
    answerPlaceholder: "Taip jawapan anda di sini…",
    keyboard: "Papan kekunci",
    micStart: "Tekan untuk bercakap",
    micStop: "Tekan apabila selesai",
    recording: "Sedang merakam… sebut dengan jelas, kemudian tekan mikrofon untuk selesai.",
    transcribing: "Jawapan anda sedang ditukar kepada teks…",
    transcriptAdded: "Jawapan suara telah dimasukkan. Anda boleh mengeditnya di bawah.",
    noSpeech: "Tiada suara dikesan. Cuba lagi atau taip jawapan anda.",
    permission: "Akses mikrofon diperlukan untuk merakam jawapan anda.",
    speechError: "Rakaman tidak dapat ditukar kepada teks. Cuba lagi atau taip jawapan anda.",
    speaker: "Bacakan soalan",
    previous: "Sebelumnya",
    next: "Soalan seterusnya",
    finish: "Tamat latihan",
    return: "Kembali ke aktiviti",
    loading: "Memuatkan latihan…",
    loadError: "Latihan tidak dapat dimuatkan",
    hintCount: "PETUNJUK",
    micPermissionTitle: "Kebenaran mikrofon",
  },
} as const;

export default function ChallengeScreen() {
  const { qSetId } = useLocalSearchParams<{ qSetId: string }>();
  const router = useRouter();
  const { getAuthHeaders } = useAuth();
  const answerInputRef = useRef<TextInput>(null);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  const [content, setContent] = useState<QSetDetails | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [language, setLanguage] = useState<Language>("en");
  const [inputMode, setInputMode] = useState<InputMode>("keyboard");
  const [answer, setAnswer] = useState("");
  const [revealedHints, setRevealedHints] = useState(0);
  const [failedMediaIds, setFailedMediaIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [speechBusy, setSpeechBusy] = useState(false);
  const [speechMessage, setSpeechMessage] = useState<string | null>(null);
  const [speechMessageKind, setSpeechMessageKind] = useState<"info" | "error">("info");

  const copy = COPY[language];

  const load = useCallback(async () => {
    if (!qSetId) {
      setError("The practice-set identifier is missing.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await getQSet(qSetId, getAuthHeaders);
      setContent(result);
      setQuestionIndex(0);
      setAnswer("");
      setRevealedHints(0);
      setFailedMediaIds([]);
      setInputMode("keyboard");
      setSpeechMessage(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "We couldn't load this practice set.");
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, qSetId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => () => {
    void Speech.stop();
    if (audioRecorder.isRecording) void audioRecorder.stop();
  }, [audioRecorder]);

  const question = content?.questions[questionIndex];
  const prompt = getPrompt(question?.content, language);
  const hints = useMemo(
    () => localizeList(question?.content.hints, language),
    [question, language],
  );
  const media = question?.media.filter((item) => item.mimeType.startsWith("image/")) ?? [];
  const questionCount = content?.questions.length ?? 0;
  const progress = questionCount > 0 ? ((questionIndex + 1) / questionCount) * 100 : 0;
  const filledSegments = Math.ceil(progress / 5);

  const changeQuestion = (nextIndex: number) => {
    if (!content || nextIndex < 0 || nextIndex >= content.questions.length) return;
    if (audioRecorder.isRecording) void audioRecorder.stop();
    void Speech.stop();
    setQuestionIndex(nextIndex);
    setAnswer("");
    setRevealedHints(0);
    setInputMode("keyboard");
    setSpeechMessage(null);
    setFailedMediaIds([]);
  };

  const readPromptAloud = () => {
    const spokenPrompt = prompt || copy.fallbackPrompt;
    void Speech.stop();
    Speech.speak(spokenPrompt, {
      language: language === "ms" ? "ms-MY" : "en-US",
      rate: 0.82,
    });
  };

  const revealHint = () => {
    if (hints.length === 0) {
      setRevealedHints(1);
      return;
    }
    setRevealedHints((current) => current >= hints.length ? 0 : current + 1);
  };

  const startRecording = async () => {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setSpeechMessage(copy.permission);
        setSpeechMessageKind("error");
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setInputMode("mic");
      setSpeechMessage(copy.recording);
      setSpeechMessageKind("info");
    } catch {
      setSpeechMessage(copy.speechError);
      setSpeechMessageKind("error");
    }
  };

  const stopAndTranscribe = async () => {
    setSpeechBusy(true);
    setSpeechMessage(copy.transcribing);
    setSpeechMessageKind("info");
    try {
      await audioRecorder.stop();
      const recordingUri = audioRecorder.uri;
      if (!recordingUri) throw new Error("The audio recorder did not return a recording file.");
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      const result = await transcribeRecording(recordingUri, language, getAuthHeaders);
      const transcript = result.transcript.trim();
      if (result.status !== "TRANSCRIBED" || transcript.length === 0) {
        setSpeechMessage(copy.noSpeech);
        setSpeechMessageKind("error");
        return;
      }
      setAnswer((current) => current.trim() ? `${current.trim()} ${transcript}` : transcript);
      setSpeechMessage(copy.transcriptAdded);
      setSpeechMessageKind("info");
      setInputMode("keyboard");
    } catch {
      setSpeechMessage(copy.speechError);
      setSpeechMessageKind("error");
    } finally {
      setSpeechBusy(false);
    }
  };

  const toggleMicrophone = async () => {
    if (speechBusy) return;
    if (audioRecorder.isRecording) {
      await stopAndTranscribe();
      return;
    }
    await startRecording();
  };

  const focusAnswer = () => {
    setInputMode("keyboard");
    answerInputRef.current?.focus();
  };

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        {loading ? (
          <TrainingStateCard title={copy.loading} loading />
        ) : error ? (
          <TrainingStateCard
            title={copy.loadError}
            message={error}
            actionLabel="Try again"
            onAction={() => void load()}
          />
        ) : content && question ? (
          <>
            <View style={styles.headerBar}>
              <View style={styles.scoreGroup}>
                <View style={styles.coin}>
                  <Text style={styles.coinSymbol}>$</Text>
                </View>
                <View style={styles.scorePill}>
                  <Text style={styles.scoreValue}>—</Text>
                  <Text style={styles.scoreUnit}>{copy.points}</Text>
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={language === "en" ? "Switch language to Malay" : "Switch language to English"}
                onPress={() => setLanguage((current) => current === "en" ? "ms" : "en")}
                style={styles.languageButton}
              >
                <Text style={styles.languageText}>{language.toUpperCase()}</Text>
                <Ionicons name="chevron-down" size={15} color="#174EA6" />
              </Pressable>
            </View>

            <View style={styles.titleBlock}>
              <Text style={styles.eyebrow}>{copy.practice}</Text>
              <Text accessibilityRole="header" style={styles.title}>
                {localize(content.submodule.name, language)}
              </Text>
            </View>

            <View style={styles.progressPanel}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>{copy.question} {questionIndex + 1} / {questionCount}</Text>
                <Text style={styles.progressCaption}>{copy.secondsUnavailable}</Text>
              </View>
              <View
                accessible
                accessibilityRole="progressbar"
                accessibilityLabel={`${copy.question} ${questionIndex + 1} of ${questionCount}`}
                accessibilityValue={{ min: 0, max: 100, now: Math.round(progress) }}
                style={styles.progressTrack}
              >
                {Array.from({ length: 20 }, (_, index) => (
                  <View
                    key={`progress-${index}`}
                    style={[styles.progressSegment, index < filledSegments && styles.progressSegmentActive]}
                  >
                    {index < filledSegments ? <View style={styles.progressStripe} /> : null}
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.imageCard}>
              <View style={styles.imageCardHeader}>
                <Ionicons name="image-outline" size={16} color="#54708D" />
                <Text style={styles.imageCardLabel}>{copy.clue}</Text>
              </View>
              {media.length === 0 ? (
                <View style={styles.noMedia}>
                  <Ionicons name="image-outline" size={48} color="#8AA0B8" />
                  <Text style={styles.noMediaText}>{copy.noImage}</Text>
                </View>
              ) : (
                <View style={styles.mediaRow}>
                  {media.map((item) => failedMediaIds.includes(item.id) ? (
                    <View key={item.id} style={styles.imageFallback}>
                      <Ionicons name="image-outline" size={34} color="#8AA0B8" />
                      <Text style={styles.noMediaText}>{copy.imageUnavailable}</Text>
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

            <View style={styles.promptWrap}>
              <View style={styles.promptCard}>
                <View style={styles.promptCopy}>
                  <Text style={styles.promptEyebrow}>{copy.prompt}</Text>
                  <Text style={styles.promptText}>{prompt || copy.fallbackPrompt}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={copy.speaker}
                  onPress={readPromptAloud}
                  style={styles.speakerButton}
                >
                  <Ionicons name="volume-high-outline" size={23} color="#FFFFFF" />
                </Pressable>
              </View>
              <View style={styles.hintActionRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={hints.length > 0 && revealedHints >= hints.length ? copy.hintReset : hints.length ? copy.hintNext : copy.hint}
                  onPress={revealHint}
                  style={styles.hintButton}
                >
                  <Ionicons name="bulb" size={22} color="#FFFFFF" />
                </Pressable>
                <Text style={styles.hintActionText}>
                  {hints.length > 0 && revealedHints >= hints.length
                    ? copy.hintReset
                    : hints.length
                      ? `${copy.hint} ${Math.min(revealedHints + 1, hints.length)} / ${hints.length}`
                      : copy.hint}
                </Text>
              </View>
              {revealedHints > 0 ? (
                <View style={styles.hintCard}>
                  <Text style={styles.hintTitle}>{copy.hintCount} {Math.min(revealedHints, Math.max(hints.length, 1))}</Text>
                  <Text style={styles.hintText}>
                    {hints.length > 0 ? hints[Math.min(revealedHints, hints.length) - 1] : copy.noHints}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.inputSection}>
              <View style={styles.inputModeRow}>
                <View style={styles.micControlGroup}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ disabled: speechBusy, busy: speechBusy }}
                    accessibilityLabel={recorderState.isRecording ? copy.micStop : copy.micStart}
                    disabled={speechBusy}
                    onPress={() => void toggleMicrophone()}
                    style={({ pressed }) => [
                      styles.micButton,
                      recorderState.isRecording && styles.micButtonRecording,
                      pressed && styles.pressed,
                      speechBusy && styles.disabled,
                    ]}
                  >
                    <Ionicons
                      name={recorderState.isRecording ? "stop" : speechBusy ? "ellipsis-horizontal" : "mic"}
                      size={33}
                      color="#FFFFFF"
                    />
                  </Pressable>
                  <Text style={styles.micLabel}>
                    {speechBusy ? copy.transcribing : recorderState.isRecording ? copy.micStop : copy.micStart}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: inputMode === "keyboard", disabled: speechBusy || recorderState.isRecording }}
                  disabled={speechBusy || recorderState.isRecording}
                  onPress={focusAnswer}
                  style={[styles.keyboardButton, inputMode === "keyboard" && styles.keyboardButtonSelected]}
                >
                  <Ionicons name="keyboard-outline" size={21} color="#174EA6" />
                  <Text style={styles.keyboardButtonText}>{copy.keyboard}</Text>
                </Pressable>
              </View>

              {speechMessage ? (
                <Text
                  accessibilityLiveRegion="polite"
                  style={[styles.speechMessage, speechMessageKind === "error" && styles.speechMessageError]}
                >
                  {speechMessage}
                </Text>
              ) : null}

              <View style={styles.answerCard}>
                <Text style={styles.answerLabel}>{copy.answer}</Text>
                <TextInput
                  ref={answerInputRef}
                  accessibilityLabel={copy.answer}
                  value={answer}
                  onChangeText={setAnswer}
                  placeholder={copy.answerPlaceholder}
                  placeholderTextColor="#8292A5"
                  style={styles.answerInput}
                  multiline
                  textAlignVertical="top"
                  returnKeyType="default"
                />
              </View>
            </View>

            <View style={styles.navigationRow}>
              <Pressable
                accessibilityRole="button"
                disabled={questionIndex === 0 || speechBusy || recorderState.isRecording}
                onPress={() => changeQuestion(questionIndex - 1)}
                style={[styles.previousButton, (questionIndex === 0 || speechBusy || recorderState.isRecording) && styles.disabled]}
              >
                <Ionicons name="chevron-back" size={19} color="#174EA6" />
                <Text style={styles.previousButtonText}>{copy.previous}</Text>
              </Pressable>
              {questionIndex < questionCount - 1 ? (
                <Pressable
                  accessibilityRole="button"
                  disabled={speechBusy || recorderState.isRecording}
                  onPress={() => changeQuestion(questionIndex + 1)}
                  style={[styles.nextButton, (speechBusy || recorderState.isRecording) && styles.disabled]}
                >
                  <Text style={styles.nextButtonText}>{copy.next}</Text>
                  <Ionicons name="chevron-forward" size={19} color="#FFFFFF" />
                </Pressable>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  disabled={speechBusy || recorderState.isRecording}
                  onPress={() => router.back()}
                  style={[styles.nextButton, (speechBusy || recorderState.isRecording) && styles.disabled]}
                >
                  <Text style={styles.nextButtonText}>{copy.finish}</Text>
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                </Pressable>
              )}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (audioRecorder.isRecording) void audioRecorder.stop();
                void Speech.stop();
                router.back();
              }}
              style={styles.returnButton}
            >
              <Ionicons name="arrow-back" size={17} color="#64748B" />
              <Text style={styles.returnText}>{copy.return}</Text>
            </Pressable>
            <Text style={styles.pointsNote}>{copy.pointsUnavailable}</Text>
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    backgroundColor: "#F3F7FC",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 34,
  },
  content: { width: "100%", maxWidth: 620, alignSelf: "center", gap: 16 },
  headerBar: { minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  scoreGroup: { flexDirection: "row", alignItems: "center", gap: 8 },
  coin: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: "#F5C451",
    borderWidth: 2, borderColor: "#E0A92F", alignItems: "center", justifyContent: "center",
  },
  coinSymbol: { color: "#80520A", fontSize: 21, fontWeight: "900" },
  scorePill: {
    minHeight: 38, minWidth: 76, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingHorizontal: 13, borderRadius: 20, backgroundColor: "#FFFFFF",
    borderWidth: 1, borderColor: "#E1E8F0",
  },
  scoreValue: { color: "#263B53", fontSize: 18, fontWeight: "900" },
  scoreUnit: { color: "#718096", fontSize: 11, fontWeight: "900" },
  languageButton: {
    minWidth: 66, minHeight: 40, borderRadius: 20, borderWidth: 1.5, borderColor: "#AFC1D6",
    backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4,
  },
  languageText: { color: "#174EA6", fontSize: 14, fontWeight: "900" },
  titleBlock: { gap: 4 },
  eyebrow: { color: "#3474B8", fontSize: 11, letterSpacing: 1.8, fontWeight: "900" },
  title: { color: "#172B4D", fontSize: 25, lineHeight: 32, fontWeight: "900" },
  progressPanel: { gap: 9, padding: 14, borderRadius: 16, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E1E8F0" },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  progressLabel: { color: "#263B53", fontSize: 13, fontWeight: "900" },
  progressCaption: { color: "#718096", fontSize: 12, fontWeight: "700" },
  progressTrack: { height: 12, flexDirection: "row", gap: 3, overflow: "hidden", borderRadius: 8 },
  progressSegment: { flex: 1, borderRadius: 3, backgroundColor: "#E5ECF4", overflow: "hidden" },
  progressSegmentActive: { backgroundColor: "#3D82D1" },
  progressStripe: { width: 3, height: "100%", alignSelf: "flex-end", backgroundColor: "rgba(255,255,255,0.45)" },
  imageCard: {
    minHeight: 270, padding: 13, gap: 8, borderRadius: 22, backgroundColor: "#FFFFFF",
    borderWidth: 1, borderColor: "#DFE7F0",
    shadowColor: "#1D3552", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.07,
    shadowRadius: 14, elevation: 3,
  },
  imageCardHeader: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 3 },
  imageCardLabel: { color: "#54708D", fontSize: 11, letterSpacing: 1.4, fontWeight: "900" },
  mediaRow: { width: "100%", flex: 1, minHeight: 220, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap" },
  mediaItem: { flex: 1, minWidth: 120, alignItems: "center", justifyContent: "center", gap: 6 },
  mediaImage: { width: "100%", height: 225 },
  mediaLabel: { color: "#52657A", fontSize: 13, lineHeight: 18, fontWeight: "700", textAlign: "center" },
  noMedia: { flex: 1, minHeight: 220, alignItems: "center", justifyContent: "center", gap: 9, padding: 22 },
  noMediaText: { color: "#64748B", fontSize: 14, lineHeight: 21, textAlign: "center" },
  imageFallback: { flex: 1, minWidth: 120, minHeight: 180, backgroundColor: "#F1F5F9", borderRadius: 14, alignItems: "center", justifyContent: "center", gap: 8 },
  promptWrap: { gap: 0 },
  promptCard: {
    minHeight: 112, flexDirection: "row", alignItems: "center", gap: 12, padding: 17,
    borderRadius: 18, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DCE6F1",
  },
  promptCopy: { flex: 1, gap: 7 },
  promptEyebrow: { color: "#5F7B98", fontSize: 10, letterSpacing: 1.6, fontWeight: "900" },
  promptText: { color: "#172B4D", fontSize: 21, lineHeight: 29, fontWeight: "800" },
  speakerButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#174EA6", alignItems: "center", justifyContent: "center" },
  hintActionRow: { minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 8, marginTop: -13, paddingRight: 12 },
  hintButton: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: "#2D78C7", borderWidth: 3, borderColor: "#F3F7FC",
    alignItems: "center", justifyContent: "center", shadowColor: "#174EA6", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 3,
  },
  hintActionText: { color: "#2D5F94", fontSize: 12, fontWeight: "800" },
  hintCard: { padding: 14, borderRadius: 14, backgroundColor: "#EAF3FF", borderWidth: 1, borderColor: "#D3E5FA", gap: 4, marginTop: 4 },
  hintTitle: { color: "#1C5D9E", fontSize: 10, letterSpacing: 1.2, fontWeight: "900" },
  hintText: { color: "#29445F", fontSize: 16, lineHeight: 23, fontWeight: "600" },
  inputSection: { gap: 12 },
  inputModeRow: { minHeight: 126, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 25 },
  micControlGroup: { alignItems: "center", justifyContent: "center", gap: 8 },
  micButton: {
    width: 86, height: 86, borderRadius: 43, backgroundColor: "#174EA6", borderWidth: 5, borderColor: "#D9E8FB",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#123B70", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.23, shadowRadius: 9, elevation: 5,
  },
  micButtonRecording: { backgroundColor: "#B42318", borderColor: "#FADBD8" },
  micLabel: { color: "#36536F", fontSize: 12, fontWeight: "800" },
  keyboardButton: { minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, paddingHorizontal: 18, borderRadius: 16, borderWidth: 1.5, borderColor: "#B8C7D9", backgroundColor: "#FFFFFF" },
  keyboardButtonSelected: { borderColor: "#174EA6", backgroundColor: "#EAF2FF" },
  keyboardButtonText: { color: "#174EA6", fontSize: 15, fontWeight: "900" },
  speechMessage: { color: "#36536F", fontSize: 13, lineHeight: 20, paddingHorizontal: 3 },
  speechMessageError: { color: "#B42318" },
  answerCard: { gap: 9, padding: 14, borderRadius: 17, borderWidth: 1, borderColor: "#DCE6F1", backgroundColor: "#FFFFFF" },
  answerLabel: { color: "#36536F", fontSize: 12, letterSpacing: 1.2, fontWeight: "900" },
  answerInput: { minHeight: 66, maxHeight: 150, padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: "#B8C7D9", backgroundColor: "#FBFDFF", color: "#172B4D", fontSize: 18, lineHeight: 25 },
  navigationRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 2 },
  previousButton: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3, paddingHorizontal: 12, borderRadius: 13, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#CBD8E6" },
  previousButtonText: { color: "#174EA6", fontSize: 13, fontWeight: "800" },
  nextButton: { flex: 1, minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 14, borderRadius: 13, backgroundColor: "#174EA6" },
  nextButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  returnButton: { alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 7, minHeight: 40, paddingHorizontal: 12 },
  returnText: { color: "#64748B", fontSize: 13, fontWeight: "700" },
  pointsNote: { color: "#8292A5", fontSize: 10, textAlign: "center", marginTop: -13 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.45 },
});
