/**
 * useChatSimulator — state-machine engine for interactive chat simulations.
 *
 * Orchestrates progressive message delays, decision points with 2-3 choices,
 * correct/wrong feedback, and a final score.
 *
 * Types/state: ./chatSimulatorTypes
 * Reducer/helpers: ./chatSimulatorReducer
 * selectChoice impl: ./chatSimulatorSelectChoice
 */

import { useCallback, useEffect, useReducer, useRef } from 'react';
import type {
  SimChoice,
  SimMessage,
  SimScore,
  Simulation,
} from '@/types/simulation';
import type { ChatSimulatorResult } from './chatSimulatorTypes';
import { initialState } from './chatSimulatorTypes';
import { reducer, sortChoices, calcTypingDelay, MESSAGE_GAP } from './chatSimulatorReducer';
import { handleSelectChoice } from './chatSimulatorSelectChoice';

export type { ChatSimulatorResult } from './chatSimulatorTypes';

export function useChatSimulator(
  simulation: Simulation | null,
  isFirstSimulation = false,
): ChatSimulatorResult {
  const [state, dispatch] = useReducer(reducer, initialState);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const simRef = useRef(simulation);
  useEffect(() => { simRef.current = simulation; }, [simulation]);

  const isFirstSimRef = useRef(isFirstSimulation);
  useEffect(() => { isFirstSimRef.current = isFirstSimulation; }, [isFirstSimulation]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => { if (timerRef.current !== undefined) clearTimeout(timerRef.current); };
  }, []);

  // -----------------------------------------------------------------------
  // Process next step in the script
  // -----------------------------------------------------------------------
  const processStepRef = useRef<(stepIndex: number) => void>(() => {});

  const processStep = useCallback(
    (stepIndex: number) => {
      const sim = simRef.current;
      if (!sim) return;

      if (state.followUpQueue.length > 0) return; // handled by follow-up effect

      if (stepIndex >= sim.steps.length || !sim.steps[stepIndex]) {
        dispatch({ type: 'COMPLETE' });
        return;
      }

      const step = sim.steps[stepIndex];
      if (step.type === 'message') {
        const msg = step as SimMessage;
        dispatch({ type: 'SHOW_TYPING' });
        timerRef.current = setTimeout(() => {
          dispatch({ type: 'SHOW_MESSAGE', entry: { id: `msg-${stepIndex}-${Date.now()}`, sender: msg.sender, text: msg.text } });
          dispatch({ type: 'ADVANCE' });
          timerRef.current = setTimeout(() => { processStepRef.current(stepIndex + 1); }, MESSAGE_GAP);
        }, msg.delay ?? calcTypingDelay(msg.text));
      } else if (step.type === 'choice') {
        const choice = step as SimChoice;
        const opts = isFirstSimRef.current ? choice.options.filter((o) => o.correct) : choice.options;
        dispatch({ type: 'SHOW_CHOICE', options: sortChoices(opts) });
      }
    },
    [state.followUpQueue.length],
  );

  useEffect(() => { processStepRef.current = processStep; }, [processStep]);

  // -----------------------------------------------------------------------
  // Follow-up queue draining (runs only after a CORRECT answer)
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (state.followUpQueue.length === 0 || state.phase !== 'feedback') return;

    const msgs = [...state.followUpQueue];
    dispatch({ type: 'QUEUE_FOLLOW_UPS', messages: [] });

    let delay = 800;
    const idx = state.stepIndex;
    msgs.forEach((msg, i) => {
      const msgDelay = msg.delay ?? calcTypingDelay(msg.text);
      setTimeout(() => { dispatch({ type: 'SHOW_TYPING' }); }, delay);
      delay += msgDelay;
      setTimeout(() => {
        dispatch({ type: 'SHOW_MESSAGE', entry: { id: `followup-${idx}-${i}-${Date.now()}`, sender: msg.sender, text: msg.text } });
        if (i === msgs.length - 1) {
          timerRef.current = setTimeout(() => { processStepRef.current(idx); }, MESSAGE_GAP);
        }
      }, delay);
      delay += MESSAGE_GAP;
    });
  }, [state.followUpQueue, state.phase, state.stepIndex, processStep]);

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------
  const start = useCallback(() => {
    dispatch({ type: 'START' });
    timerRef.current = setTimeout(() => { processStepRef.current(0); }, 400);
  }, []);

  const selectChoice = useCallback(
    (optionId: string) => {
      handleSelectChoice(optionId, state, dispatch, timerRef, simRef, isFirstSimRef, processStepRef);
    },
    [state],
  );

  const reset = useCallback(() => {
    if (timerRef.current !== undefined) clearTimeout(timerRef.current);
    dispatch({ type: 'RESET' });
  }, []);

  const score: SimScore | null =
    state.phase === 'complete'
      ? { correctAnswers: state.correctAnswers, totalAttempts: state.totalAttempts }
      : null;

  return {
    phase: state.phase,
    entries: state.entries,
    currentChoices: state.currentChoices,
    score,
    start,
    selectChoice,
    reset,
  };
}
