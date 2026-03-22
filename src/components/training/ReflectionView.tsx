/**
 * ReflectionView — guided reflection interface (R1-R3 in MVP).
 *
 * After the AI interrupts the conversation, this view presents
 * one reflection question at a time. The user answers freely,
 * then sees the AI's non-judgmental analysis before the next question.
 */

import * as m from 'motion/react-m';
import { AnimatePresence } from 'motion/react';
import { Brain, Loader2 } from 'lucide-react';
import { ChatInput } from './ChatInput';
import { useVirtualKeyboard } from '@/hooks/useVirtualKeyboard';
import type { ReflectionAnswer, ReflectionStep } from '@/types/training';

interface ReflectionViewProps {
  readonly currentStep: ReflectionStep;
  readonly currentQuestion: string;
  readonly reflections: readonly ReflectionAnswer[];
  readonly isLoading: boolean;
  readonly waitSeconds: number;
  readonly error: string | null;
  readonly onSubmitAnswer: (answer: string) => void;
  readonly onBack: () => void;
}

const STEP_LABELS: Record<ReflectionStep, string> = {
  R1: 'Consapevolezza',
  R2: 'Emozioni',
  R3: 'Pausa',
  R4: 'Pattern',
};

// V2: R1-R4 (added R4 pattern recognition)
const TOTAL_STEPS = 4;

function getStepNumber(step: ReflectionStep): number {
  const map: Record<ReflectionStep, number> = { R1: 1, R2: 2, R3: 3, R4: 4 };
  return map[step];
}

export function ReflectionView({
  currentStep,
  currentQuestion,
  reflections,
  isLoading,
  waitSeconds,
  error,
  onSubmitAnswer,
  onBack,
}: ReflectionViewProps) {
  const stepNumber = getStepNumber(currentStep);

  // Handle virtual keyboard on iOS + Android
  useVirtualKeyboard();

  // Show the latest analysis before moving to next question
  const latestReflection = reflections.at(-1);

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: 'var(--app-height, 100dvh)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700/50 bg-slate-900/80 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="text-base text-slate-400 hover:text-slate-200"
          aria-label="Torna indietro"
        >
          Esci
        </button>
        <div className="flex items-center gap-2">
          <Brain className="size-4 text-cyan-400" aria-hidden="true" />
          <span className="text-base font-semibold text-slate-200">Riflessione</span>
        </div>
        <span className="text-base text-slate-500">
          {stepNumber}/{TOTAL_STEPS}
        </span>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 py-3">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            className={`size-2 rounded-full transition-colors ${
              i < stepNumber
                ? 'bg-cyan-400'
                : i === stepNumber - 1
                  ? 'bg-cyan-400'
                  : 'bg-slate-700'
            }`}
          />
        ))}
      </div>

      {/* Content area */}
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-6">
        {/* Step label */}
        <div className="text-center">
          <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-sm font-medium text-cyan-400">
            {STEP_LABELS[currentStep]}
          </span>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <m.p
            key={currentStep}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="text-center font-medium leading-relaxed text-slate-100"
            style={{ fontSize: '22px' }}
          >
            {currentQuestion}
          </m.p>
        </AnimatePresence>

        {/* Previous reflection analysis (if just answered) */}
        <AnimatePresence>
          {latestReflection && latestReflection.step === (stepNumber > 1 ? `R${stepNumber - 1}` as ReflectionStep : null) && (
            <m.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-4"
            >
              <p className="mb-1 text-base font-medium text-cyan-400">La tua risposta precedente</p>
              <p className="mb-3 italic text-slate-400" style={{ fontSize: '16px' }}>"{latestReflection.userAnswer}"</p>
              <p className="leading-relaxed text-slate-300" style={{ fontSize: '16px' }}>{latestReflection.aiAnalysis}</p>
            </m.div>
          )}
        </AnimatePresence>

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="size-6 animate-spin text-cyan-400" />
            <p className="text-base text-slate-500">
              {waitSeconds >= 5
                ? 'Sto analizzando la tua risposta...'
                : 'Un momento...'}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-center text-base text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSend={onSubmitAnswer}
        disabled={isLoading}
        placeholder="Scrivi la tua risposta..."
      />
    </div>
  );
}
