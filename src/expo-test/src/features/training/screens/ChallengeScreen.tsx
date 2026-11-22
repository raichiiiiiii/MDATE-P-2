import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type TextInput as NativeTextInputType,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAudioRecorder, useAudioRecorderState, AudioModule, RecordingPresets, setAudioModeAsync } from "expo-audio";
import * as Speech from "expo-speech";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useAuth } from "../../auth/AuthProvider";
import { usePatientPreferences } from "../../../shared/theme/PatientPreferencesContext";
import { Text, TextInput } from "../../../shared/ui/native";
import TrainingStateCard from "../components/TrainingStateCard";
import {
  getPrompt,
  getQSet,
  localize,
  localizeList,
  type Language,
  type QSetDetails,
} from "../trainingApi";
import { evaluateAnswer, transcribeRecording, type EvaluationResponse } from "../speechApi";

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
    permissionPermanentlyDenied: "Microphone access is blocked by the operating system. You can enable it in system settings or continue typing below.",
    openSettings: "Open system settings",
    speechError: "We couldn't transcribe that recording. Please try again or type your answer.",
    speaker: "Read the question aloud",
    speakerDisabled: "Voice playback is turned off in settings.",
    previous: "Previous",
    next: "Next question",
    finish: "Finish practice",
    return: "Return to activities",
    loading: "Loading your challenge…",
    loadError: "This challenge couldn't be loaded",
    hintCount: "HINT",
    micPermissionTitle: "Microphone permission",
    pause: "Pause",
    exit: "Exit",
    pausedTitle: "Practice Paused",
    pausedDescription: "Take a break whenever you need. Your answers are saved.",
    resume: "Resume practice",
    checkAnswer: "Check Answer",
    checkingAnswer: "Checking your answer…",
    exactMatch: "Great job! Your answer matches.",
    partialMatch: "Good effort! Your answer partially matches.",
    noMatch: "Keep trying! You can check the hints or try again.",
    prototypeDisclaimer: "Prototype demonstration match only. Does not count toward clinical scoring or XP.",
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
    permissionPermanentlyDenied: "Akses mikrofon disekat oleh sistem pengendalian. Anda boleh membenarkannya di tetapan atau terus menaip di bawah.",
    openSettings: "Buka tetapan sistem",
    speechError: "Rakaman tidak dapat ditukar kepada teks. Cuba lagi atau taip jawapan anda.",
    speaker: "Bacakan soalan",
    speakerDisabled: "Suara bacaan telah dimatikan di bahagian tetapan.",
    previous: "Sebelumnya",
    next: "Soalan seterusnya",
    finish: "Tamat latihan",
    return: "Kembali ke aktiviti",
    loading: "Memuatkan latihan…",
    loadError: "Latihan tidak dapat dimuatkan",
    hintCount: "PETUNJUK",
    micPermissionTitle: "Kebenaran mikrofon",
    pause: "Jeda",
    exit: "Keluar",
    pausedTitle: "Latihan Dijeda",
    pausedDescription: "Ambil masa anda. Jawapan anda telah disimpan.",
    resume: "Sambung latihan",
    checkAnswer: "Semak Jawapan",
    checkingAnswer: "Menyemak jawapan anda…",
    exactMatch: "Tahniah! Jawapan anda bertepatan.",
    partialMatch: "Usaha yang baik! Sebahagian jawapan anda sepadan.",
    noMatch: "Cuba lagi! Anda boleh merujuk petunjuk atau mencuba semula.",
    prototypeDisclaimer: "Demonstrasi prototaip sahaja. Tidak dikira untuk pemarkahan klinikal atau mata XP.",
  },
} as const;

function resolveQuestionTarget(content: Record<string, unknown> | undefined, lang: Language): string {
  if (!content) return "";
  const answers = content.answers as Record<string, string[]> | undefined;
  if (answers) {
    if (Array.isArray(answers[lang]) && answers[lang].length > 0) return answers[lang][0];
    if (Array.isArray(answers.en) && answers.en.length > 0) return answers.en[0];
    if (Array.isArray(answers.ms) && answers.ms.length > 0) return answers.ms[0];
  }
  const keywords = content.targetKeywords as Record<string, string[]> | undefined;
  if (keywords) {
    if (Array.isArray(keywords[lang]) && keywords[lang].length > 0) return keywords[lang].join(" ");
    if (Array.isArray(keywords.en) && keywords.en.length > 0) return keywords.en.join(" ");
  }
  return "";
}

export default function ChallengeScreen() {
  const { qSetId } = useLocalSearchParams<{ qSetId: string }>();
  const router = useRouter();
  const { getAuthHeaders } = useAuth();
  const { language, setLanguage, accessibility, voice } = usePatientPreferences();

  const answerInputRef = useRef<NativeTextInputType>(null);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  const [content, setContent] = useState<QSetDetails | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answersByQuestionId, setAnswersByQuestionId] = useState<Record<string, string>>({});
  const [answer, setAnswer] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("keyboard");
  const [revealedHints, setRevealedHints] = useState(0);
  const [failedMediaIds, setFailedMediaIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Speech & mic states
  const [speechBusy, setSpeechBusy] = useState(false);
  const [speechMessage, setSpeechMessage] = useState<string | null>(null);
  const [speechMessageKind, setSpeechMessageKind] = useState<"info" | "error">("info");
  const [permBlocked, setPermBlocked] = useState(false);

  // Evaluation states (Milestone 1)
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResponse | null>(null);

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
      setAnswersByQuestionId({});
      setAnswer("");
      setEvaluationResult(null);
      setRevealedHints(0);
      setFailedMediaIds([]);
      setInputMode("keyboard");
      setSpeechMessage(null);
      setIsPaused(false);
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

  const handleAnswerChange = (text: string) => {
    setAnswer(text);
    if (question) {
      setAnswersByQuestionId((prev) => ({ ...prev, [question.id]: text }));
    }
    if (evaluationResult) {
      setEvaluationResult(null);
    }
  };

  const changeQuestion = (nextIndex: number) => {
    if (!content || nextIndex < 0 || nextIndex >= content.questions.length) return;
    if (audioRecorder.isRecording) void audioRecorder.stop();
    void Speech.stop();

    const targetQuestion = content.questions[nextIndex];
    setQuestionIndex(nextIndex);
    const restored = answersByQuestionId[targetQuestion.id] ?? "";
    setAnswer(restored);
    setEvaluationResult(null);
    setRevealedHints(0);
    setInputMode("keyboard");
    setSpeechMessage(null);
    setFailedMediaIds([]);
  };

  const readPromptAloud = () => {
    if (voice.voiceDisabled) {
      setSpeechMessage(copy.speakerDisabled);
      setSpeechMessageKind("info");
      return;
    }
    const spokenPrompt = prompt || copy.fallbackPrompt;
    void Speech.stop();
    Speech.speak(spokenPrompt, {
      language: language === "ms" ? "ms-MY" : "en-US",
      rate: voice.audioRate || 0.82,
      volume: voice.audioVolume ?? 1.0,
      ...(voice.preferredVoiceId ? { voice: voice.preferredVoiceId } : {}),
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
        setPermBlocked(!permission.canAskAgain);
        setSpeechMessage(
          permission.canAskAgain ? copy.permission : copy.permissionPermanentlyDenied,
        );
        setSpeechMessageKind("error");
        return;
      }
      setPermBlocked(false);
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
      const updated = answer.trim() ? `${answer.trim()} ${transcript}` : transcript;
      handleAnswerChange(updated);
      setSpeechMessage(copy.transcriptAdded);
      setSpeechMessageKind("info");
      setInputMode("keyboard");
    } catch (error) {
      console.error("[MDATE Speech Transcription]", error);
      setSpeechMessage(error instanceof Error ? error.message : copy.speechError);
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

  const openSystemSettings = () => {
    if (Platform.OS === "web") {
      setSpeechMessage("Please allow microphone access in your web browser settings.");
      setSpeechMessageKind("info");
      return;
    }
    void Linking.openSettings();
  };

  const handleEvaluate = async () => {
    if (!answer.trim()) return;
    const target = resolveQuestionTarget(question?.content, language);
    if (!target) return;
    setEvaluating(true);
    setSpeechMessage(null);
    try {
      const result = await evaluateAnswer(answer, target, language, getAuthHeaders);
      setEvaluationResult(result);
    } catch (err) {
      setSpeechMessage(err instanceof Error ? err.message : copy.loadError);
      setSpeechMessageKind("error");
    } finally {
      setEvaluating(false);
    }
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
            {/* Top Navigation & Session Control Bar (DR-A11Y-07 leading edge) */}
            <View style={styles.sessionControlBar}>
              <View style={styles.sessionControlGroup}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={copy.pause}
                  onPress={() => {
                    void Speech.stop();
                    if (audioRecorder.isRecording) void audioRecorder.stop();
                    setIsPaused(true);
                  }}
                  style={styles.sessionButton}
                >
                  <Ionicons name="pause-circle-outline" size={24} color="#174EA6" />
                  <Text style={styles.sessionButtonText}>{copy.pause}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={copy.exit}
                  onPress={() => {
                    void Speech.stop();
                    if (audioRecorder.isRecording) void audioRecorder.stop();
                    router.back();
                  }}
                  style={styles.sessionButton}
                >
                  <Ionicons name="exit-outline" size={24} color="#52657A" />
                  <Text style={styles.sessionButtonTextSecondary}>{copy.exit}</Text>
                </Pressable>
              </View>
            </View>

            {isPaused ? (
              /* Paused Overlay — replaces all exercise nodes until resumed */
              <View style={styles.pausedCard}>
                <Ionicons name="pause-circle" size={54} color="#174EA6" />
                <Text accessibilityRole="header" style={styles.pausedTitle}>{copy.pausedTitle}</Text>
               
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={copy.resume}
                  onPress={() => setIsPaused(false)}
                  style={styles.resumeButton}
                >
                  <Text style={styles.resumeButtonText}>{copy.resume}</Text>
                  <Ionicons name="play" size={20} color="#FFFFFF" />
                </Pressable>
              </View>
            ) : (
              <>
                {/* Exercise Title Block */}
                <View style={styles.titleBlock}>
                  <Text style={styles.eyebrow}>{copy.practice}</Text>
                  <Text accessibilityRole="header" style={styles.title}>
                    {localize(content.submodule.name, language)}
                  </Text>
                </View>

                {/* Progress Panel */}
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

                {/* Picture Clue Card */}
                <View style={styles.imageCard}>
                  <View style={styles.imageCardHeader}>
                    <Ionicons name="image-outline" size={20} color="#54708D" />
                    <Text style={styles.imageCardLabel}>{copy.clue}</Text>
                  </View>
                  {media.length === 0 ? (
                    <View style={styles.noMedia}>
                      <Ionicons name="image-outline" size={52} color="#8AA0B8" />
                      <Text style={styles.noMediaText}>{copy.noImage}</Text>
                    </View>
                  ) : (
                    <View style={styles.mediaRow}>
                      {media.map((item) => failedMediaIds.includes(item.id) ? (
                        <View key={item.id} style={styles.imageFallback}>
                          <Ionicons name="image-outline" size={36} color="#8AA0B8" />
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

                {/* Prompt & Spoken Prompt (TTS) */}
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
                      style={[styles.speakerButton, voice.voiceDisabled && styles.disabledButton]}
                    >
                      <Ionicons name={voice.voiceDisabled ? "volume-mute-outline" : "volume-high-outline"} size={26} color="#FFFFFF" />
                    </Pressable>
                  </View>

                  {/* Hint Action */}
                  <View style={styles.hintActionRow}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={hints.length > 0 && revealedHints >= hints.length ? copy.hintReset : hints.length ? copy.hintNext : copy.hint}
                      onPress={revealHint}
                      style={styles.hintButton}
                    >
                      <Ionicons name="bulb" size={24} color="#FFFFFF" />
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

                {/* Answer & Speech/Keyboard Input Section */}
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
                        {speechBusy ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Ionicons
                            name={recorderState.isRecording ? "stop" : "mic"}
                            size={36}
                            color="#FFFFFF"
                          />
                        )}
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
                      <Ionicons name="keypad-outline" size={24} color="#174EA6" />
                      <Text style={styles.keyboardButtonText}>{copy.keyboard}</Text>
                    </Pressable>
                  </View>

                  {permBlocked ? (
                    <View style={styles.permissionCard}>
                      <Text style={styles.permissionText}>{copy.permissionPermanentlyDenied}</Text>
                      <Pressable accessibilityRole="button" onPress={openSystemSettings} style={styles.permissionAction}>
                        <Text style={styles.permissionActionText}>{copy.openSettings}</Text>
                      </Pressable>
                    </View>
                  ) : null}

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
                      onChangeText={handleAnswerChange}
                      placeholder={copy.answerPlaceholder}
                      placeholderTextColor="#8292A5"
                      style={styles.answerInput}
                      multiline
                      textAlignVertical="top"
                      returnKeyType="default"
                    />

                    {/* Milestone 1 Prototype Answer Evaluation Action */}
                    <View style={styles.checkAnswerRow}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={copy.checkAnswer}
                        disabled={evaluating || !answer.trim()}
                        onPress={() => void handleEvaluate()}
                        style={({ pressed }) => [
                          styles.checkAnswerButton,
                          (evaluating || !answer.trim()) && styles.disabled,
                          pressed && styles.pressed,
                        ]}
                      >
                        {evaluating ? (
                          <ActivityIndicator size="small" color="#174EA6" />
                        ) : (
                          <Ionicons name="checkmark-done-circle-outline" size={22} color="#174EA6" />
                        )}
                        <Text style={styles.checkAnswerText}>
                          {evaluating ? copy.checkingAnswer : copy.checkAnswer}
                        </Text>
                      </Pressable>
                    </View>

                    {/* Milestone 1 Evaluation Feedback Banner */}
                    {evaluationResult ? (
                      <View style={[
                        styles.evalCard,
                        evaluationResult.match === "EXACT_MATCH" && styles.evalCardExact,
                        evaluationResult.match === "PARTIAL_MATCH" && styles.evalCardPartial,
                        evaluationResult.match === "NO_MATCH" && styles.evalCardNone,
                      ]}>
                        <View style={styles.evalHeader}>
                          <Ionicons
                            name={
                              evaluationResult.match === "EXACT_MATCH"
                                ? "checkmark-circle"
                                : evaluationResult.match === "PARTIAL_MATCH"
                                  ? "alert-circle"
                                  : "information-circle"
                            }
                            size={24}
                            color={
                              evaluationResult.match === "EXACT_MATCH"
                                ? "#16734A"
                                : evaluationResult.match === "PARTIAL_MATCH"
                                  ? "#174EA6"
                                  : "#52657A"
                            }
                          />
                          <Text style={styles.evalMatchText}>
                            {evaluationResult.match === "EXACT_MATCH"
                              ? copy.exactMatch
                              : evaluationResult.match === "PARTIAL_MATCH"
                                ? copy.partialMatch
                                : copy.noMatch}
                          </Text>
                        </View>
                        <Text style={styles.evalDisclaimer}>{copy.prototypeDisclaimer}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* Previous / Next Question Navigation */}
                <View style={styles.navigationRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={copy.previous}
                    disabled={questionIndex === 0 || speechBusy || recorderState.isRecording}
                    onPress={() => changeQuestion(questionIndex - 1)}
                    style={[styles.previousButton, (questionIndex === 0 || speechBusy || recorderState.isRecording) && styles.disabled]}
                  >
                    <Ionicons name="chevron-back" size={22} color="#174EA6" />
                    <Text style={styles.previousButtonText}>{copy.previous}</Text>
                  </Pressable>
                  {questionIndex < questionCount - 1 ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={copy.next}
                      disabled={speechBusy || recorderState.isRecording}
                      onPress={() => changeQuestion(questionIndex + 1)}
                      style={[styles.nextButton, (speechBusy || recorderState.isRecording) && styles.disabled]}
                    >
                      <Text style={styles.nextButtonText}>{copy.next}</Text>
                      <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
                    </Pressable>
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={copy.finish}
                      disabled={speechBusy || recorderState.isRecording}
                      onPress={() => router.back()}
                      style={[styles.nextButton, (speechBusy || recorderState.isRecording) && styles.disabled]}
                    >
                      <Text style={styles.nextButtonText}>{copy.finish}</Text>
                      <Ionicons name="checkmark" size={22} color="#FFFFFF" />
                    </Pressable>
                  )}
                </View>

                {/* Return to Activities Link (≥ 48 hit area) */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={copy.return}
                  onPress={() => {
                    if (audioRecorder.isRecording) void audioRecorder.stop();
                    void Speech.stop();
                    router.back();
                  }}
                  style={styles.returnButton}
                >
                  <Ionicons name="arrow-back" size={20} color="#64748B" />
                  <Text style={styles.returnText}>{copy.return}</Text>
                </Pressable>
              </>
            )}
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
    paddingBottom: 36,
  },
  content: { width: "100%", maxWidth: 620, alignSelf: "center", gap: 16 },

  // Session controls (DR-A11Y-07)
  sessionControlBar: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sessionControlGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sessionButton: {
    minHeight: 48,
    minWidth: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#DFE7F0",
  },
  sessionButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#174EA6",
  },
  sessionButtonTextSecondary: {
    fontSize: 16,
    fontWeight: "600",
    color: "#52657A",
  },

  languageButton: {
    minWidth: 58,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#AFC1D6",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 10,
  },
  languageText: { color: "#174EA6", fontSize: 16, fontWeight: "800" },

  pausedCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#174EA6",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  pausedTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    color: "#172B4D",
  },
  pausedDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: "#52657A",
    textAlign: "center",
  },
  resumeButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#174EA6",
    paddingHorizontal: 22,
    borderRadius: 14,
    marginTop: 6,
  },
  resumeButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },

  titleBlock: { gap: 4 },
  eyebrow: { color: "#3474B8", fontSize: 16, letterSpacing: 1.2, fontWeight: "800" },
  title: { color: "#172B4D", fontSize: 26, lineHeight: 34, fontWeight: "800" },

  progressPanel: { gap: 10, padding: 14, borderRadius: 16, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E1E8F0" },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  progressLabel: { color: "#263B53", fontSize: 16, fontWeight: "800" },
  progressCaption: { color: "#718096", fontSize: 16, fontWeight: "600" },
  progressTrack: { height: 12, flexDirection: "row", gap: 3, overflow: "hidden", borderRadius: 8 },
  progressSegment: { flex: 1, borderRadius: 3, backgroundColor: "#E5ECF4", overflow: "hidden" },
  progressSegmentActive: { backgroundColor: "#3D82D1" },
  progressStripe: { width: 3, height: "100%", alignSelf: "flex-end", backgroundColor: "rgba(255,255,255,0.45)" },

  imageCard: {
    minHeight: 270, padding: 14, gap: 10, borderRadius: 22, backgroundColor: "#FFFFFF",
    borderWidth: 1, borderColor: "#DFE7F0",
    shadowColor: "#1D3552", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.07,
    shadowRadius: 14, elevation: 3,
  },
  imageCardHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 3 },
  imageCardLabel: { color: "#54708D", fontSize: 16, letterSpacing: 1.1, fontWeight: "800" },
  mediaRow: { width: "100%", flex: 1, minHeight: 220, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap" },
  mediaItem: { flex: 1, minWidth: 120, alignItems: "center", justifyContent: "center", gap: 6 },
  mediaImage: { width: "100%", height: 225 },
  mediaLabel: { color: "#52657A", fontSize: 16, lineHeight: 22, fontWeight: "700", textAlign: "center" },
  noMedia: { flex: 1, minHeight: 220, alignItems: "center", justifyContent: "center", gap: 9, padding: 22 },
  noMediaText: { color: "#64748B", fontSize: 16, lineHeight: 23, textAlign: "center" },
  imageFallback: { flex: 1, minWidth: 120, minHeight: 180, backgroundColor: "#F1F5F9", borderRadius: 14, alignItems: "center", justifyContent: "center", gap: 8 },

  promptWrap: { gap: 0 },
  promptCard: {
    minHeight: 112, flexDirection: "row", alignItems: "center", gap: 12, padding: 18,
    borderRadius: 18, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DCE6F1",
  },
  promptCopy: { flex: 1, gap: 6 },
  promptEyebrow: { color: "#5F7B98", fontSize: 16, letterSpacing: 1.1, fontWeight: "800" },
  promptText: { color: "#172B4D", fontSize: 22, lineHeight: 30, fontWeight: "800" },
  speakerButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#174EA6", alignItems: "center", justifyContent: "center" },
  disabledButton: { backgroundColor: "#94A3B8" },

  hintActionRow: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 8, marginTop: -13, paddingRight: 12 },
  hintButton: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: "#2D78C7", borderWidth: 3, borderColor: "#F3F7FC",
    alignItems: "center", justifyContent: "center", shadowColor: "#174EA6", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 3,
  },
  hintActionText: { color: "#2D5F94", fontSize: 16, fontWeight: "800" },
  hintCard: { padding: 14, borderRadius: 14, backgroundColor: "#EAF3FF", borderWidth: 1, borderColor: "#D3E5FA", gap: 4, marginTop: 4 },
  hintTitle: { color: "#1C5D9E", fontSize: 16, letterSpacing: 1.1, fontWeight: "800" },
  hintText: { color: "#29445F", fontSize: 16, lineHeight: 24, fontWeight: "600" },

  inputSection: { gap: 12 },
  inputModeRow: { minHeight: 126, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 25 },
  micControlGroup: { alignItems: "center", justifyContent: "center", gap: 8 },
  micButton: {
    width: 86, height: 86, borderRadius: 43, backgroundColor: "#174EA6", borderWidth: 5, borderColor: "#D9E8FB",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#123B70", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.23, shadowRadius: 9, elevation: 5,
  },
  micButtonRecording: { backgroundColor: "#B42318", borderColor: "#FADBD8" },
  micLabel: { color: "#36536F", fontSize: 16, fontWeight: "800" },
  keyboardButton: { minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, paddingHorizontal: 18, borderRadius: 16, borderWidth: 1.5, borderColor: "#B8C7D9", backgroundColor: "#FFFFFF" },
  keyboardButtonSelected: { borderColor: "#174EA6", backgroundColor: "#EAF2FF" },
  keyboardButtonText: { color: "#174EA6", fontSize: 16, fontWeight: "800" },

  permissionCard: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  permissionText: {
    fontSize: 16,
    lineHeight: 23,
    color: "#991B1B",
  },
  permissionAction: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    alignSelf: "flex-start",
  },
  permissionActionText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  speechMessage: { color: "#36536F", fontSize: 16, lineHeight: 23, paddingHorizontal: 3 },
  speechMessageError: { color: "#B42318" },

  answerCard: { gap: 10, padding: 14, borderRadius: 17, borderWidth: 1, borderColor: "#DCE6F1", backgroundColor: "#FFFFFF" },
  answerLabel: { color: "#36536F", fontSize: 16, letterSpacing: 1.1, fontWeight: "800" },
  answerInput: { minHeight: 70, maxHeight: 150, padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: "#B8C7D9", backgroundColor: "#FBFDFF", color: "#172B4D", fontSize: 18, lineHeight: 26 },

  checkAnswerRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  checkAnswerButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: "#EAF2FF",
    borderWidth: 1.5,
    borderColor: "#174EA6",
  },
  checkAnswerText: {
    color: "#174EA6",
    fontSize: 16,
    fontWeight: "700",
  },

  // Milestone 1 evaluation card
  evalCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
    gap: 6,
    marginTop: 6,
  },
  evalCardExact: {
    backgroundColor: "#F0FDF4",
    borderColor: "#86EFAC",
  },
  evalCardPartial: {
    backgroundColor: "#EFF6FF",
    borderColor: "#93C5FD",
  },
  evalCardNone: {
    backgroundColor: "#F8FAFC",
    borderColor: "#CBD5E1",
  },
  evalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  evalMatchText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: "#172B4D",
    flex: 1,
  },
  evalDisclaimer: {
    fontSize: 16,
    lineHeight: 22,
    color: "#64748B",
  },

  navigationRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 4 },
  previousButton: { minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingHorizontal: 16, borderRadius: 14, backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: "#CBD8E6" },
  previousButtonText: { color: "#174EA6", fontSize: 16, fontWeight: "800" },
  nextButton: { flex: 1, minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 16, borderRadius: 14, backgroundColor: "#174EA6" },
  nextButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },

  returnButton: { alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 8, minHeight: 48, paddingHorizontal: 16 },
  returnText: { color: "#64748B", fontSize: 16, fontWeight: "700" },

  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.45 },
});
