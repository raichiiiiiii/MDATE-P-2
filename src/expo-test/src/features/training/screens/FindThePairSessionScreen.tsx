import { useCallback, useEffect, useRef, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { useRouter } from "expo-router";

import { useAuth } from "../../auth/AuthProvider";
import { usePatientPreferences } from "../../../shared/theme/PatientPreferencesContext";
import { Text } from "../../../shared/ui/native";
import TrainingStateCard from "../components/TrainingStateCard";
import { getQSet, getSubmoduleQSets, localize, type QSetDetails } from "../trainingApi";
import {
  buildPairQuestions,
  getFindThePairScore,
  rewardForPair,
  shuffleCards,
  type PairQuestion,
  type SelectedPairCard,
} from "../games/find-the-pair/findThePairModel";

type Props = { initialQSet: QSetDetails };
type Feedback = { kind: "success" | "error"; message: string } | null;

type PairCardProps = {
  pair: PairQuestion;
  side: "outline" | "color";
  selected: boolean;
  matched: boolean;
  wrong: boolean;
  hinted: boolean;
  language: "ms" | "en";
  cardNumber: number;
  onPress: () => void;
};

function PairCard({ pair, side, selected, matched, wrong, hinted, language, cardNumber, onPress }: PairCardProps) {
  const media = side === "outline" ? pair.outlineImage : pair.colorImage;
  const sideLabel = side === "outline"
    ? (language === "ms" ? `Kad lukisan hitam putih ${cardNumber}` : `Black-and-white outline card ${cardNumber}`)
    : (language === "ms" ? `Kad gambar berwarna ${cardNumber}` : `Colour photograph card ${cardNumber}`);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={sideLabel}
      accessibilityHint={language === "ms" ? "Pilih kad ini, kemudian pilih pasangannya di lajur sebelah." : "Select this card, then select its match in the other column."}
      accessibilityState={{ selected, disabled: matched }}
      disabled={matched}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pairCard,
        selected && styles.cardSelected,
        matched && styles.cardMatched,
        wrong && styles.cardWrong,
        hinted && styles.cardHinted,
        pressed && !matched && styles.cardPressed,
      ]}
    >
      <Image
        accessibilityIgnoresInvertColors
        accessible={false}
        source={{ uri: media.url }}
        resizeMode={side === "outline" ? "contain" : "cover"}
        style={styles.cardImage}
      />
      {matched ? (
        <View style={styles.cardStatus}>
          <Ionicons name="checkmark-circle" size={24} color="#16734A" />
        </View>
      ) : selected ? (
        <View style={styles.cardStatus}>
          <Ionicons name="checkmark-circle" size={24} color="#174EA6" />
        </View>
      ) : null}
    </Pressable>
  );
}

export default function FindThePairSessionScreen({ initialQSet }: Props) {
  const router = useRouter();
  const { getAuthHeaders } = useAuth();
  const { language, voice } = usePatientPreferences();
  const isMalay = language === "ms";

  const [sets, setSets] = useState<QSetDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentSetIndex, setCurrentSetIndex] = useState<0 | 1>(0);
  const [outlineCards, setOutlineCards] = useState<PairQuestion[]>([]);
  const [colorCards, setColorCards] = useState<PairQuestion[]>([]);
  const [selectedCard, setSelectedCard] = useState<SelectedPairCard>(null);
  const [matchedQuestionIds, setMatchedQuestionIds] = useState<Set<string>>(new Set());
  const [wrongQuestionIds, setWrongQuestionIds] = useState<Set<string>>(new Set());
  const [hintedQuestionIds, setHintedQuestionIds] = useState<Set<string>>(new Set());
  const [activeHintQuestionId, setActiveHintQuestionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [baseCoins, setBaseCoins] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [boardLocked, setBoardLocked] = useState(false);
  const [showNextSet, setShowNextSet] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const matchedIdsRef = useRef<Set<string>>(new Set());
  const hintedIdsRef = useRef<Set<string>>(new Set());

  const clearTimer = (timer: typeof feedbackTimer) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const loadSession = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      if (initialQSet.submodule.exerciseType !== "find_the_pair") {
        throw new Error("The selected practice set is not a Find the Pair activity.");
      }
      const listing = await getSubmoduleQSets(initialQSet.submoduleId, getAuthHeaders);
      const ordered = [...listing.qSets].sort((left, right) => left.position - right.position);
      if (ordered.length !== 2 || ordered[0].position !== 0 || ordered[1].position !== 1) {
        throw new Error("Find the Pair must have exactly two published sets in order.");
      }
      if (!ordered.some((summary) => summary.id === initialQSet.id)) {
        throw new Error("The selected practice set is not part of the published Find the Pair session.");
      }
      const details = await Promise.all(ordered.map((summary) => (
        summary.id === initialQSet.id ? Promise.resolve(initialQSet) : getQSet(summary.id, getAuthHeaders)
      )));
      if (details.some((set) => set.questions.length !== 5)) {
        throw new Error("Each Find the Pair set must contain exactly five pairs.");
      }
      // Validate media roles and localized content before the patient enters the game.
      details.forEach((set) => {
        buildPairQuestions(set, "ms");
        buildPairQuestions(set, "en");
      });
      setSets(details);
      setCurrentSetIndex(0);
      setBaseCoins(0);
      setTotalCorrect(0);
      const emptyHinted = new Set<string>();
      hintedIdsRef.current = emptyHinted;
      setHintedQuestionIds(emptyHinted);
      setShowNextSet(false);
      setShowSummary(false);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "We couldn't load Find the Pair.");
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, initialQSet]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  useEffect(() => () => {
    clearTimer(feedbackTimer);
    clearTimer(hintTimer);
    clearTimer(wrongTimer);
    clearTimer(autoHintTimer);
    clearTimer(completionTimer);
    void Speech.stop();
  }, []);

  const currentSet = sets[currentSetIndex];
  const languageRef = useRef(language);
  languageRef.current = language;
  useEffect(() => {
    if (!currentSet) return;
    const nextPairs = buildPairQuestions(currentSet, languageRef.current);
    if (nextPairs.length !== 5) return;
    setOutlineCards(shuffleCards(nextPairs));
    setColorCards(shuffleCards(nextPairs));
    setSelectedCard(null);
    const emptyMatched = new Set<string>();
    matchedIdsRef.current = emptyMatched;
    setMatchedQuestionIds(emptyMatched);
    setWrongQuestionIds(new Set());
    setActiveHintQuestionId(null);
    setFeedback(null);
    setBoardLocked(false);
    setShowNextSet(false);
  }, [sets, currentSetIndex]);

  const matchedInSet = matchedQuestionIds.size;
  const activeHintPair = outlineCards.find((pair) => pair.id === activeHintQuestionId) ?? null;
  const setTitle = localize(currentSet?.title, language) || (isMalay ? `Set ${currentSetIndex + 1}` : `Set ${currentSetIndex + 1}`);

  const showHint = (questionId: string) => {
    const nextHinted = new Set(hintedIdsRef.current);
    nextHinted.add(questionId);
    hintedIdsRef.current = nextHinted;
    setHintedQuestionIds(nextHinted);
    setActiveHintQuestionId(questionId);
    clearTimer(hintTimer);
    hintTimer.current = setTimeout(() => {
      setActiveHintQuestionId((active) => active === questionId ? null : active);
      hintTimer.current = null;
    }, 3000);
  };

  const showFeedback = (nextFeedback: Feedback, duration = 1500) => {
    setFeedback(nextFeedback);
    clearTimer(feedbackTimer);
    feedbackTimer.current = setTimeout(() => {
      setFeedback(null);
      feedbackTimer.current = null;
    }, duration);
  };

  const resolveMatch = (source: PairQuestion, target: PairQuestion) => {
    if (boardLocked || matchedQuestionIds.has(source.id) || matchedQuestionIds.has(target.id)) return;
    setSelectedCard(null);

    if (source.id === target.id) {
      const nextMatched = new Set(matchedQuestionIds);
      nextMatched.add(source.id);
      matchedIdsRef.current = nextMatched;
      setMatchedQuestionIds(nextMatched);
      setWrongQuestionIds(new Set());
      const reward = rewardForPair(source.id, hintedIdsRef.current);
      setBaseCoins((current) => current + reward);
      setTotalCorrect((current) => current + 1);
      showFeedback({
        kind: "success",
        message: isMalay ? `Betul! +${reward} syiling` : `Correct! +${reward} coins`,
      }, 900);

      if (nextMatched.size === 5) {
        setBoardLocked(true);
        clearTimer(completionTimer);
        completionTimer.current = setTimeout(() => {
          if (currentSetIndex === 0) {
            setShowNextSet(true);
          } else {
            setShowSummary(true);
          }
          completionTimer.current = null;
        }, 900);
      }
      return;
    }

    setWrongQuestionIds(new Set([source.id, target.id]));
    showFeedback({
      kind: "error",
      message: isMalay ? "Bukan pasangan yang betul. Cuba lagi." : "Not the right pair. Try again.",
    });
    clearTimer(wrongTimer);
    wrongTimer.current = setTimeout(() => {
      setWrongQuestionIds(new Set());
      wrongTimer.current = null;
    }, 500);

    if (!hintedIdsRef.current.has(source.id)) {
      clearTimer(autoHintTimer);
      autoHintTimer.current = setTimeout(() => {
        if (!matchedIdsRef.current.has(source.id) && !hintedIdsRef.current.has(source.id)) {
          showHint(source.id);
        }
        autoHintTimer.current = null;
      }, 500);
    }
  };

  const selectCard = (pair: PairQuestion, side: "outline" | "color") => {
    if (boardLocked || matchedQuestionIds.has(pair.id)) return;
    if (!selectedCard) {
      setSelectedCard({ questionId: pair.id, side });
      return;
    }
    if (selectedCard.questionId === pair.id && selectedCard.side === side) {
      setSelectedCard(null);
      return;
    }
    if (selectedCard.side === side) {
      setSelectedCard({ questionId: pair.id, side });
      return;
    }

    const source = outlineCards.find((item) => item.id === selectedCard.questionId);
    if (!source) {
      setSelectedCard({ questionId: pair.id, side });
      return;
    }
    resolveMatch(source, pair);
  };

  const handleManualHint = () => {
    if (boardLocked) return;
    const nextPair = outlineCards.find((pair) => !matchedQuestionIds.has(pair.id));
    if (!nextPair) return;
    showHint(nextPair.id);
  };

  const readHintAloud = () => {
    if (!activeHintPair || voice.voiceDisabled) return;
    void Speech.stop();
    Speech.speak(activeHintPair.hint, {
      language: language === "ms" ? "ms-MY" : "en-US",
      rate: voice.audioRate || 0.82,
      volume: voice.audioVolume ?? 1,
      ...(voice.preferredVoiceId ? { voice: voice.preferredVoiceId } : {}),
    });
  };

  const handleNextSet = () => {
    void Speech.stop();
    clearTimer(feedbackTimer);
    clearTimer(hintTimer);
    clearTimer(wrongTimer);
    clearTimer(autoHintTimer);
    clearTimer(completionTimer);
    setCurrentSetIndex(1);
    setShowNextSet(false);
  };

  const handlePlayAgain = () => {
    void Speech.stop();
    clearTimer(feedbackTimer);
    clearTimer(hintTimer);
    clearTimer(wrongTimer);
    clearTimer(autoHintTimer);
    clearTimer(completionTimer);
    setCurrentSetIndex(0);
    setBaseCoins(0);
    setTotalCorrect(0);
    const emptyHinted = new Set<string>();
    hintedIdsRef.current = emptyHinted;
    setHintedQuestionIds(emptyHinted);
    setShowSummary(false);
    setFeedback(null);
  };

  const score = getFindThePairScore(baseCoins, hintedQuestionIds.size, totalCorrect);

  if (loading) return <View style={styles.statePage}><TrainingStateCard title={isMalay ? "Memuatkan Cari Pasangan…" : "Loading Find the Pair…"} loading /></View>;
  if (loadError) {
    return (
      <View style={styles.statePage}>
        <TrainingStateCard
          title={isMalay ? "Latihan tidak dapat dimuatkan" : "This activity couldn't be loaded"}
          message={loadError}
          actionLabel={isMalay ? "Cuba lagi" : "Try again"}
          onAction={() => void loadSession()}
        />
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>{isMalay ? "Kembali" : "Back"}</Text>
        </Pressable>
      </View>
    );
  }

  if (showSummary) {
    return (
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.content}>
          <View style={styles.summaryIcon}><Ionicons name="trophy" size={44} color="#174EA6" /></View>
          <Text accessibilityRole="header" style={styles.summaryTitle}>{isMalay ? "Latihan selesai!" : "Session complete!"}</Text>
          <Text style={styles.summarySubtitle}>{isMalay ? "Semua pasangan telah dipadankan." : "All pairs have been matched."}</Text>
          <View style={styles.summaryScoreCard}>
            <Text style={styles.summaryAccuracy}>{totalCorrect} / 10</Text>
            <Text style={styles.summaryLabel}>{isMalay ? "Pasangan betul" : "Correct pairs"}</Text>
            <View style={styles.summaryDivider} />
            <Text style={styles.summaryBase}>{score.baseCoins} {isMalay ? "syiling asas" : "base coins"}</Text>
            <View style={styles.bonusRow}>
              <Text style={styles.bonusLabel}>{isMalay ? "Bonus tamat" : "Completion bonus"}</Text>
              <Text style={styles.bonusValue}>+{score.completionBonus}</Text>
            </View>
            {score.perfectBonus > 0 ? (
              <View style={styles.bonusRow}>
                <Text style={styles.bonusLabel}>{isMalay ? "Bonus sempurna" : "Perfect score bonus"}</Text>
                <Text style={styles.bonusValue}>+{score.perfectBonus}</Text>
              </View>
            ) : null}
            <View style={styles.summaryDivider} />
            <Text style={styles.finalScore}>{score.finalCoins} {isMalay ? "syiling" : "coins"}</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={handlePlayAgain} style={styles.primaryButton}>
            <Ionicons name="refresh" size={23} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>{isMalay ? "Main Lagi" : "Play Again"}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.secondaryButton}>
            <Ionicons name="arrow-back" size={21} color="#174EA6" />
            <Text style={styles.secondaryButtonText}>{isMalay ? "Kembali" : "Back"}</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel={isMalay ? "Keluar" : "Exit"} onPress={() => { void Speech.stop(); router.back(); }} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={22} color="#174EA6" />
            <Text style={styles.exitButtonText}>{isMalay ? "Keluar" : "Exit"}</Text>
          </Pressable>
          <View style={styles.topTitle}>
            <Text accessibilityRole="header" style={styles.activityTitle}>{isMalay ? "Cari Pasangan" : "Find the Pair"}</Text>
            <Text style={styles.setLabel}>{setTitle} / 2</Text>
          </View>
          <View style={styles.coinPill}>
            <Text style={styles.coinText}>🪙 {baseCoins}</Text>
          </View>
        </View>

        <View style={styles.progressBlock}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>
              {isMalay ? `Pasangan ${matchedInSet} / 5` : `Pairs ${matchedInSet} / 5`}
            </Text>
            <Text style={styles.progressLabel}>{Math.round((matchedInSet / 5) * 100)}%</Text>
          </View>
          <View accessibilityRole="progressbar" accessibilityLabel={isMalay ? "Kemajuan pasangan" : "Pair progress"} accessibilityValue={{ min: 0, max: 5, now: matchedInSet }} style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(matchedInSet / 5) * 100}%` }]} />
          </View>
        </View>

        <View style={styles.instructionCard}>
          <Ionicons name="information-circle-outline" size={24} color="#174EA6" />
          <Text style={styles.instructionText}>
            {isMalay
              ? "Padankan lukisan dengan gambar sebenar. Pilih satu kad, kemudian pilih pasangannya."
              : "Match the outline with the real photo. Select one card, then select its pair."}
          </Text>
        </View>

        <View style={styles.boardHeader}>
          <Text style={styles.columnTitle}>{isMalay ? "LUKISAN" : "OUTLINES"}</Text>
          <Text style={styles.columnTitle}>{isMalay ? "GAMBAR" : "PHOTOS"}</Text>
        </View>
        <View style={styles.board}>
          <View style={styles.column}>
            {outlineCards.map((pair, index) => (
              <PairCard
                key={`outline-${pair.id}`}
                pair={pair}
                side="outline"
                language={language}
                cardNumber={index + 1}
                selected={Boolean(selectedCard && selectedCard.questionId === pair.id && selectedCard.side === "outline")}
                matched={matchedQuestionIds.has(pair.id)}
                wrong={wrongQuestionIds.has(pair.id)}
                hinted={activeHintQuestionId === pair.id}
                onPress={() => selectCard(pair, "outline")}
              />
            ))}
          </View>
          <View style={styles.column}>
            {colorCards.map((pair, index) => (
              <PairCard
                key={`color-${pair.id}`}
                pair={pair}
                side="color"
                language={language}
                cardNumber={index + 1}
                selected={Boolean(selectedCard && selectedCard.questionId === pair.id && selectedCard.side === "color")}
                matched={matchedQuestionIds.has(pair.id)}
                wrong={wrongQuestionIds.has(pair.id)}
                hinted={activeHintQuestionId === pair.id}
                onPress={() => selectCard(pair, "color")}
              />
            ))}
          </View>
        </View>

        {activeHintPair ? (
          <View accessibilityLiveRegion="polite" style={styles.hintCard}>
            <Ionicons name="bulb" size={23} color="#8A5700" />
            <View style={styles.hintCopy}>
              <Text style={styles.hintTitle}>{isMalay ? "Petunjuk" : "Hint"}</Text>
              <Text style={styles.hintText}>{activeHintPair.hint}</Text>
            </View>
            {!voice.voiceDisabled ? (
              <Pressable accessibilityRole="button" accessibilityLabel={isMalay ? "Dengar petunjuk" : "Listen to hint"} onPress={readHintAloud} style={styles.speakerButton}>
                <Ionicons name="volume-high-outline" size={22} color="#174EA6" />
                <Text style={styles.speakerButtonText}>{isMalay ? "Dengar" : "Listen"}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {feedback ? (
          <View accessibilityLiveRegion="polite" style={[styles.feedbackBanner, feedback.kind === "success" ? styles.feedbackSuccess : styles.feedbackError]}>
            <Ionicons name={feedback.kind === "success" ? "checkmark-circle" : "information-circle"} size={23} color={feedback.kind === "success" ? "#16734A" : "#8A3434"} />
            <Text style={styles.feedbackText}>{feedback.message}</Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isMalay ? "Bantu saya" : "Help me"}
          accessibilityState={{ disabled: boardLocked }}
          disabled={boardLocked}
          onPress={handleManualHint}
          style={[styles.helpButton, boardLocked && styles.disabledButton]}
        >
          <Ionicons name="bulb" size={23} color="#5F4300" />
          <Text style={styles.helpButtonText}>{isMalay ? "Bantu Saya" : "Help Me"}</Text>
        </Pressable>

        {boardLocked && !showNextSet && !showSummary ? (
          <View style={styles.completionBanner}>
            <Ionicons name="checkmark-circle" size={24} color="#16734A" />
            <Text style={styles.completionText}>{isMalay ? `Set ${currentSetIndex + 1} selesai!` : `Set ${currentSetIndex + 1} complete!`}</Text>
          </View>
        ) : null}

        {showNextSet ? (
          <Pressable accessibilityRole="button" onPress={handleNextSet} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>{isMalay ? "Seterusnya" : "Next"}</Text>
            <Ionicons name="arrow-forward" size={23} color="#FFFFFF" />
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  statePage: { flexGrow: 1, justifyContent: "center", padding: 20, gap: 14, backgroundColor: "#F8FAFC" },
  page: { flexGrow: 1, padding: 16, paddingTop: 16, paddingBottom: 32, backgroundColor: "#F8FAFC" },
  content: { width: "100%", maxWidth: 430, alignSelf: "center", gap: 16 },
  topBar: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconButton: { minWidth: 80, minHeight: 56, flexDirection: "row", gap: 5, paddingHorizontal: 9, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#CBD5E1" },
  exitButtonText: { color: "#174EA6", fontSize: 16, lineHeight: 22, fontWeight: "600" },
  topTitle: { flex: 1, alignItems: "center", gap: 2 },
  activityTitle: { color: "#172B4D", fontSize: 22, lineHeight: 30, fontWeight: "700", textAlign: "center" },
  setLabel: { color: "#52657A", fontSize: 16, lineHeight: 23, fontWeight: "500" },
  coinPill: { minWidth: 72, minHeight: 48, paddingHorizontal: 10, borderRadius: 16, backgroundColor: "#FFF1C7", alignItems: "center", justifyContent: "center" },
  coinText: { color: "#5F4300", fontSize: 16, lineHeight: 22, fontWeight: "700" },
  progressBlock: { gap: 8 },
  progressLabels: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { color: "#34465B", fontSize: 16, lineHeight: 23, fontWeight: "600" },
  progressTrack: { height: 12, overflow: "hidden", borderRadius: 8, backgroundColor: "#DCE5EF" },
  progressFill: { height: "100%", borderRadius: 8, backgroundColor: "#26734D" },
  instructionCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, backgroundColor: "#EAF2FF", borderRadius: 16, borderWidth: 1, borderColor: "#B8CBE5" },
  instructionText: { flex: 1, color: "#183B68", fontSize: 16, lineHeight: 24 },
  boardHeader: { flexDirection: "row", gap: 10 },
  columnTitle: { flex: 1, color: "#34465B", fontSize: 16, lineHeight: 23, fontWeight: "700", textAlign: "center" },
  board: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  column: { flex: 1, gap: 9 },
  pairCard: { minHeight: 78, flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 6, borderRadius: 14, borderWidth: 2, borderColor: "#C8D6E8", backgroundColor: "#FFFFFF", position: "relative", gap: 4 },
  cardImage: { width: "100%", height: 70, flex: 1, borderRadius: 8 },
  cardSelected: { borderColor: "#174EA6", backgroundColor: "#E8F0FE" },
  cardMatched: { borderColor: "#7DC58F", backgroundColor: "#E8F6EC" },
  cardWrong: { borderColor: "#C75B5B", backgroundColor: "#FDE8E8" },
  cardHinted: { borderColor: "#D18B12", backgroundColor: "#FFF8E1" },
  cardPressed: { opacity: 0.82 },
  cardStatus: { position: "absolute", right: 4, top: 4, borderRadius: 12, backgroundColor: "#FFFFFF" },
  hintCard: { flexDirection: "row", alignItems: "flex-start", gap: 11, padding: 14, borderWidth: 1.5, borderColor: "#E5B84C", borderRadius: 14, backgroundColor: "#FFF8E1" },
  hintCopy: { flex: 1, gap: 3 },
  speakerButton: { minWidth: 78, minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingHorizontal: 8, borderRadius: 12, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D5B45C" },
  speakerButtonText: { color: "#174EA6", fontSize: 16, lineHeight: 22, fontWeight: "600" },
  hintTitle: { color: "#6A4A00", fontSize: 16, lineHeight: 22, fontWeight: "700" },
  hintText: { color: "#513C0B", fontSize: 16, lineHeight: 24 },
  feedbackBanner: { flexDirection: "row", alignItems: "center", gap: 10, padding: 13, borderRadius: 14, borderWidth: 1 },
  feedbackSuccess: { backgroundColor: "#E8F6EC", borderColor: "#7DC58F" },
  feedbackError: { backgroundColor: "#FDEEEE", borderColor: "#D99B9B" },
  feedbackText: { flex: 1, color: "#26384A", fontSize: 16, lineHeight: 24, fontWeight: "600" },
  helpButton: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 18, backgroundColor: "#F8D77B", borderWidth: 1, borderColor: "#D4A83F", paddingHorizontal: 18 },
  helpButtonText: { color: "#513C0B", fontSize: 18, lineHeight: 25, fontWeight: "700" },
  disabledButton: { opacity: 0.55 },
  completionBanner: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, padding: 12, borderRadius: 16, backgroundColor: "#E8F6EC", borderWidth: 1, borderColor: "#7DC58F" },
  completionText: { color: "#145C3C", fontSize: 18, lineHeight: 26, fontWeight: "700" },
  primaryButton: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, borderRadius: 18, backgroundColor: "#174EA6", paddingHorizontal: 20 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 18, lineHeight: 25, fontWeight: "700" },
  secondaryButton: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 16, backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: "#B8C7D9", paddingHorizontal: 20 },
  secondaryButtonText: { color: "#174EA6", fontSize: 17, lineHeight: 24, fontWeight: "600" },
  summaryIcon: { width: 88, height: 88, alignSelf: "center", borderRadius: 44, alignItems: "center", justifyContent: "center", backgroundColor: "#EAF2FF", marginTop: 28 },
  summaryTitle: { color: "#172B4D", fontSize: 26, lineHeight: 34, fontWeight: "700", textAlign: "center" },
  summarySubtitle: { color: "#52657A", fontSize: 16, lineHeight: 24, textAlign: "center" },
  summaryScoreCard: { padding: 20, gap: 12, borderRadius: 22, borderWidth: 1.5, borderColor: "#CBD5E1", backgroundColor: "#FFFFFF" },
  summaryAccuracy: { color: "#174EA6", fontSize: 34, lineHeight: 42, fontWeight: "700", textAlign: "center" },
  summaryLabel: { color: "#52657A", fontSize: 16, lineHeight: 23, textAlign: "center" },
  summaryDivider: { height: 1, backgroundColor: "#DCE5EF", marginVertical: 3 },
  summaryBase: { color: "#26384A", fontSize: 18, lineHeight: 26, fontWeight: "600", textAlign: "center" },
  bonusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  bonusLabel: { color: "#52657A", fontSize: 16, lineHeight: 24, flex: 1 },
  bonusValue: { color: "#145C3C", fontSize: 18, lineHeight: 25, fontWeight: "700" },
  finalScore: { color: "#174EA6", fontSize: 27, lineHeight: 36, fontWeight: "700", textAlign: "center" },
});
