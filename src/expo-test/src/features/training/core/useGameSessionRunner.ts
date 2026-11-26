import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApiRequest } from "../../auth/apiClient";
import type { GameEngineAdapter, QuestionAttemptResult, RewardedQuestion } from "./gameTypes";
import {
  completeRewardedTrainingSession,
  recordRewardedPairMatch,
  startRewardedTrainingSession,
  type RewardedTrainingSession,
} from "../hierarchicalTrainingApi";

type Settlement = { rewardCoins: number; walletBalance: number; duplicate: boolean };

export function useGameSessionRunner<TState, TAction>(
  engine: GameEngineAdapter<TState, TAction>,
  submoduleId: string,
  questions: RewardedQuestion[],
  apiRequest: ApiRequest,
  refreshWallet: () => Promise<unknown>,
) {
  const [state, setState] = useState<TState>(() => engine.createInitialState(questions));
  const [session, setSession] = useState<RewardedTrainingSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [submittedIds, setSubmittedIds] = useState<string[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!session) return;
    const startedAt = Date.parse(session.startedAt);
    const updateElapsed = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    };
    updateElapsed();
    if (session.status !== "IN_PROGRESS") return;
    const timer = setInterval(updateElapsed, 1000);
    return () => clearInterval(timer);
  }, [session?.id, session?.startedAt, session?.status]);

  const totalPossibleCoins = useMemo(() => questions.reduce((sum, question) => sum + question.rewardCoins, 0), [questions]);
  const results = useMemo(() => engine.extractResults(state), [engine, state]);
  const earnedPreviewCoins = useMemo(() => {
    const rewardById = new Map(questions.map((question) => [question.id, question.rewardCoins]));
    return results.reduce((sum, result) => sum + (rewardById.get(result.questionId) ?? 0), 0);
  }, [questions, results]);
  const isComplete = engine.isComplete(state);

  const start = useCallback(async () => {
    setBusy(true);
    setError(null);
    setSettlement(null);
    setSubmittedIds([]);
    setElapsedSeconds(0);
    try {
      const created = await startRewardedTrainingSession(apiRequest, submoduleId);
      setSession(created);
      setState(engine.createInitialState(questions));
      return created;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "The training session could not be started.";
      setError(message);
      throw cause;
    } finally {
      setBusy(false);
    }
  }, [apiRequest, engine, questions, submoduleId]);

  const dispatch = useCallback((action: TAction) => {
    setState((current) => engine.reduce(current, action));
  }, [engine]);

  const recordResult = useCallback(async (result: QuestionAttemptResult) => {
    if (!session || session.status !== "IN_PROGRESS") throw new Error("Start an active training session first.");
    if (submittedIds.includes(result.questionId)) return;
    if (!questions.some((question) => question.id === result.questionId)) throw new Error("The question does not belong to this session.");
    setBusy(true);
    setError(null);
    try {
      if (engine.modeId === "find_the_pair") {
        const response = await recordRewardedPairMatch(apiRequest, session.id, result.questionId);
        setSession(response.session);
        setState((current) => engine.reduce(current, engine.createResultAction(result)));
        setSubmittedIds((current) => current.includes(result.questionId) ? current : [...current, result.questionId]);
        if (response.settlement) {
          setSettlement({ rewardCoins: response.rewardCoins, walletBalance: response.settlement.wallet.balance, duplicate: response.settlement.duplicate });
          await refreshWallet();
        }
        return response;
      }
      setState((current) => engine.reduce(current, engine.createResultAction(result)));
      setSubmittedIds((current) => current.includes(result.questionId) ? current : [...current, result.questionId]);
      return undefined;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "The question result could not be saved.";
      setError(message);
      throw cause;
    } finally {
      setBusy(false);
    }
  }, [apiRequest, engine, questions, refreshWallet, session, submittedIds]);

  const complete = useCallback(async () => {
    if (!session || session.status !== "IN_PROGRESS") throw new Error("Start an active training session first.");
    if (!engine.isComplete(state)) throw new Error("Complete every question before submitting the session.");
    setBusy(true);
    setError(null);
    try {
      const response = await completeRewardedTrainingSession(apiRequest, session.id, results);
      setSession(response.session);
      setSettlement({ rewardCoins: response.rewardCoins, walletBalance: response.settlement.wallet.balance, duplicate: response.settlement.duplicate });
      await refreshWallet();
      return response;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "The session could not be completed.";
      setError(message);
      throw cause;
    } finally {
      setBusy(false);
    }
  }, [apiRequest, engine, refreshWallet, results, session, state]);

  return { state, session, busy, error, settlement, results, totalPossibleCoins, earnedPreviewCoins, elapsedSeconds, isComplete, start, dispatch, recordResult, complete };
}
