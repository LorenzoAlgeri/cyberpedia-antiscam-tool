/**
 * chatSimulatorSelectChoice.ts — selectChoice handler implementation
 * for the useChatSimulator engine.
 *
 * Extracted to keep useChatSimulator.ts under 200 lines.
 * No React imports — pure TypeScript side-effect builder.
 */

import type { MutableRefObject } from 'react';
import type { Action, EngineState } from './chatSimulatorTypes';
import { sortChoices, calcTypingDelay, MESSAGE_GAP } from './chatSimulatorReducer';
import type {
  ChatEntry,
  SimChoice,
  SimFeedback,
  Simulation,
} from '@/types/simulation';

type Dispatch = (action: Action) => void;
type TimerRef = MutableRefObject<ReturnType<typeof setTimeout> | undefined>;
type SimRef = MutableRefObject<Simulation | null>;
type IsFirstSimRef = MutableRefObject<boolean>;
type ProcessStepRef = MutableRefObject<(stepIndex: number) => void>;

export function handleSelectChoice(
  optionId: string,
  state: Pick<EngineState, 'phase' | 'stepIndex' | 'wrongShownForStep'>,
  dispatch: Dispatch,
  timerRef: TimerRef,
  simRef: SimRef,
  isFirstSimRef: IsFirstSimRef,
  processStepRef: ProcessStepRef,
): void {
  const sim = simRef.current;
  if (!sim || state.phase !== 'choice') return;

  const stepIndex = state.stepIndex;
  const choiceStep = sim.steps[stepIndex];
  if (!choiceStep || choiceStep.type !== 'choice') return;

  const choice = choiceStep as SimChoice;
  const option = choice.options.find((o) => o.id === optionId);
  if (!option) return;

  // Add user's choice as a message
  const userEntry: ChatEntry = {
    id: `user-choice-${stepIndex}-${Date.now()}`,
    sender: 'user',
    text: option.text,
  };
  dispatch({ type: 'SHOW_MESSAGE', entry: userEntry });

  // Look for feedback step right after the choice
  const nextStep = sim.steps[stepIndex + 1];

  if (!nextStep || nextStep.type !== 'feedback') {
    // No feedback step — just advance (no retry possible)
    dispatch({ type: 'ADVANCE' });
    timerRef.current = setTimeout(() => {
      processStepRef.current(stepIndex + 1);
    }, MESSAGE_GAP);
    return;
  }

  const fb = nextStep as SimFeedback;

  if (option.correct) {
    // ── CORRECT ANSWER — green feedback, advance, continue ──────────
    const feedbackEntry: ChatEntry = {
      id: `feedback-${stepIndex}-${Date.now()}`,
      sender: 'feedback',
      text: fb.explanation,
      correct: true,
      ...(fb.explanationDetail !== undefined && { detail: fb.explanationDetail }),
    };
    timerRef.current = setTimeout(() => {
      dispatch({ type: 'SHOW_FEEDBACK', entry: feedbackEntry });
      dispatch({ type: 'RECORD_CORRECT' });
      dispatch({ type: 'ADVANCE' }); // past choice
      dispatch({ type: 'ADVANCE' }); // past feedback

      if (fb.followUp.length > 0) {
        dispatch({ type: 'QUEUE_FOLLOW_UPS', messages: fb.followUp });
      } else {
        timerRef.current = setTimeout(() => {
          processStepRef.current(stepIndex + 2);
        }, 800);
      }
    }, 500);
  } else {
    // ── WRONG ANSWER — amber feedback + retry ───────────────────────
    // UX rule: amber not red — red triggers panic in stressed users
    // wrongExplanation is shown at most once per SimChoice step.
    const alreadyShownWrong = state.wrongShownForStep === stepIndex;

    const wrongText =
      fb.wrongExplanation ??
      'Attenzione: questa risposta potrebbe metterti a rischio. Riprova.';
    const feedbackEntry: ChatEntry = {
      id: `feedback-wrong-${stepIndex}-${Date.now()}`,
      sender: 'feedback',
      text: wrongText,
      correct: false,
      ...(fb.wrongExplanationDetail !== undefined && { detail: fb.wrongExplanationDetail }),
    };

    timerRef.current = setTimeout(() => {
      if (alreadyShownWrong) {
        // Subsequent wrong: change phase without adding a new bubble
        dispatch({ type: 'RETRY_SILENT' });
      } else {
        dispatch({ type: 'SHOW_RETRY', entry: feedbackEntry, stepIndex });
      }
      dispatch({ type: 'RECORD_WRONG' });

      // Per-option retryMessage takes priority over the feedback-level one.
      // This lets the scammer respond to what the user actually said.
      const retryMsg = option.retryMessage ?? fb.retryMessage;

      if (retryMsg) {
        // Scammer stays in character — type, show, then re-present choice
        timerRef.current = setTimeout(() => {
          dispatch({ type: 'SHOW_TYPING' });
          const delay = retryMsg.delay ?? calcTypingDelay(retryMsg.text);
          timerRef.current = setTimeout(() => {
            const retryEntry: ChatEntry = {
              id: `retry-msg-${stepIndex}-${Date.now()}`,
              sender: retryMsg.sender,
              text: retryMsg.text,
            };
            dispatch({ type: 'SHOW_MESSAGE', entry: retryEntry });
            timerRef.current = setTimeout(() => {
              const retryOpts = isFirstSimRef.current
                ? choice.options.filter((o) => o.correct)
                : choice.options;
              dispatch({ type: 'SHOW_CHOICE', options: sortChoices(retryOpts) });
            }, MESSAGE_GAP);
          }, delay);
        }, 800);
      } else {
        // No retry message — re-present choice after short pause
        timerRef.current = setTimeout(() => {
          const retryOpts = isFirstSimRef.current
            ? choice.options.filter((o) => o.correct)
            : choice.options;
          dispatch({ type: 'SHOW_CHOICE', options: sortChoices(retryOpts) });
        }, 800);
      }
    }, 500);
  }
}
