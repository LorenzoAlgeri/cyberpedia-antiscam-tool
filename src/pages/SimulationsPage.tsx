import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import * as m from 'motion/react-m';
import { AnimatePresence } from 'motion/react';
import { Brain, FileText, Heart, Loader2, Package, Sparkles } from 'lucide-react';
import { simulations } from '@/data/simulations';
import { ChatSimulator } from '@/components/chat/ChatSimulator';
import { TrainingChat } from '@/components/training/TrainingChat';
import { TrainingSetup } from '@/components/training/TrainingSetup';
import { ReflectionView } from '@/components/training/ReflectionView';
import { SessionReport } from '@/components/training/SessionReport';
import { TrainingDashboard } from '@/components/training/TrainingDashboard';
import { ScenarioEditor } from '@/components/training/ScenarioEditor';
import { useAISimulation } from '@/hooks/useAISimulation';
import { useTrainingSession } from '@/hooks/useTrainingSession';
import { useTrainingProfile } from '@/hooks/useTrainingProfile';
import { useCustomScenarios } from '@/hooks/useCustomScenarios';
import type { Simulation } from '@/types/simulation';
import type { AttackType } from '@/types/emergency';
import type { TrainingTarget, TrainingDimension, ScammerGender } from '@/types/training';
import { trackFeatureUsage } from '@/lib/event-analytics';

/** Maps each vulnerability dimension to the training target that addresses it */
const DIMENSION_TO_TARGET: Record<TrainingDimension, TrainingTarget> = {
  activation: 'fear',
  impulsivity: 'urgency',
  verification: 'trust',
  awareness: 'authority',
} as const;

/** Map icon string from simulation data to Lucide component */
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Heart,
  Package,
  FileText,
};

interface SimulationsPageProps {
  readonly onNext: () => void;
  readonly onBack: () => void;
}

/**
 * Step 3 — Interactive chat simulations hub.
 *
 * Two views managed by internal useState (NO React Router):
 * 1. Hub: 4 glass-card grid → select a simulation
 * 2. Active: ChatSimulator for the selected scenario
 *
 * /interaction-design: spring hover with glow, stagger entrance.
 * /frontend-design: responsive 1-col mobile, 2-col sm+.
 */
export function SimulationsPage({
  onNext,
  onBack,
}: SimulationsPageProps) {
  const [activeSim, setActiveSim] = useState<Simulation | null>(null);
  /** ID of the card currently being loaded — drives per-card loading state */
  const [selectingId, setSelectingId] = useState<string | null>(null);
  /** Number of simulations completed — persisted in localStorage */
  const [simulationCount, setSimulationCount] = useState<number>(() => {
    const raw = localStorage.getItem('antiscam-sim-count');
    if (!raw) return 0;
    const n = parseInt(raw, 10);
    return Number.isNaN(n) ? 0 : n;
  });
  /** Show onboarding-to-realistic hint after first completion */
  const [showRealismHint, setShowRealismHint] = useState(false);

  /** Scenario click counts — persisted in localStorage for frequency sorting */
  const [scenarioClicks, setScenarioClicks] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem('antiscam-scenario-clicks');
      return raw ? (JSON.parse(raw) as Record<string, number>) : {};
    } catch { return {}; }
  });

  /** Simulations sorted by click frequency (most clicked first), fallback to default order */
  const sortedSimulations = useMemo(() => {
    const hasAnyClicks = Object.values(scenarioClicks).some((c) => c > 0);
    if (!hasAnyClicks) return simulations;
    return [...simulations].sort((a, b) => (scenarioClicks[b.id] ?? 0) - (scenarioClicks[a.id] ?? 0));
  }, [scenarioClicks]);

  const { fetchAISimulation } = useAISimulation();

  // --- AI Training (Palestra Mentale) ---
  const isTrainingEnabled = import.meta.env.VITE_AI_TRAINING_ENABLED === 'true';
  const training = useTrainingSession();
  const { state: trainingState } = training;
  const { profile, saveSession, getRecommendedTarget } = useTrainingProfile();
  const { scenarios: customScenarios, addScenario, removeScenario } = useCustomScenarios();
  const [showSetup, setShowSetup] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  /** Pre-selected targets when navigating from "Allenati su questo" in SessionReport */
  const [preSelectedTargets, setPreSelectedTargets] = useState<TrainingTarget[]>([]);
  /** Track whether we already saved this session to profile */
  const savedSessionRef = useRef(false);

  const handleOpenSetup = useCallback(() => {
    trackFeatureUsage('palestra_mentale');
    setShowSetup(true);
  }, []);

  const handleStartTraining = useCallback(async (
    attackType: AttackType,
    difficulty: 'easy' | 'medium' | 'hard',
    targets: TrainingTarget[],
    customDescription?: string,
    customPersona?: { name: string; role: string; tone: string },
    gender?: ScammerGender,
  ) => {
    await training.startSession({
      attackType,
      difficulty,
      trainingTargets: targets,
      ...(gender && gender !== 'unspecified' ? { scammerGender: gender } : {}),
      ...(customDescription ? { customDescription } : {}),
      ...(customPersona ? { customPersona } : {}),
    });
  }, [training]);

  const handleTrainingBack = useCallback(() => {
    training.reset();
    setShowSetup(false);
    setPreSelectedTargets([]);
    savedSessionRef.current = false;
  }, [training]);

  /** Called when user clicks "Allenati su questo" in SessionReport */
  const handleTrainOnDimension = useCallback(
    (dim: TrainingDimension) => {
      training.reset();
      savedSessionRef.current = false;
      const target = DIMENSION_TO_TARGET[dim];
      setPreSelectedTargets([target]);
      setShowSetup(true);
    },
    [training],
  );

  // Save session to profile when reaching summary
  useEffect(() => {
    if (
      trainingState.phase === 'summary' &&
      !savedSessionRef.current &&
      trainingState.scenarioConfig
    ) {
      const finalScores = trainingState.finalScores ?? trainingState.latestScores;
      if (finalScores) {
        savedSessionRef.current = true;
        const summary = {
          sessionId: trainingState.scenarioConfig.scenarioId,
          date: new Date().toISOString(),
          attackType: trainingState.scenarioConfig.attackType,
          trainingTarget: trainingState.scenarioConfig.trainingTarget,
          finalRiskScore: finalScores.riskScore,
          interruptedAtTurn: trainingState.interruptedAtTurn,
          improvement: 0, // computed inside saveSession
        } as const;
        saveSession(summary, finalScores, []);
      }
    }
  }, [trainingState.phase, trainingState.scenarioConfig, trainingState.finalScores, trainingState.latestScores, trainingState.interruptedAtTurn, saveSession]);

  /** Called by ChatSimulator when phase reaches 'complete' */
  const handleSimComplete = useCallback(() => {
    setSimulationCount((prev) => {
      const next = prev + 1;
      localStorage.setItem('antiscam-sim-count', String(next));
      return next;
    });
    setShowRealismHint(true);
  }, []);

  // Hide the hint as soon as another sim starts
  useEffect(() => {
    if (activeSim) setShowRealismHint(false);
  }, [activeSim]);

  const handleSelectSim = useCallback(
    async (simId: string) => {
      const sim = simulations.find((s) => s.id === simId) ?? null;
      if (!sim) return;

      // Track click for frequency sorting
      setScenarioClicks((prev) => {
        const updated = { ...prev, [simId]: (prev[simId] ?? 0) + 1 };
        localStorage.setItem('antiscam-scenario-clicks', JSON.stringify(updated));
        return updated;
      });

      setSelectingId(sim.id);
      try {
        const aiSim = await fetchAISimulation(sim.id, 'medium');
        setActiveSim(aiSim ?? sim);
      } finally {
        setSelectingId(null);
      }
    },
    [fetchAISimulation],
  );

  const handleKeyDownCard = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, simId: string) => {
      if (selectingId !== null) return;
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        void handleSelectSim(simId);
      }
    },
    [selectingId, handleSelectSim],
  );

  // --- Scenario editor view ---
  if (showEditor) {
    return (
      <AnimatePresence mode="wait">
        <m.div
          key="scenario-editor"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex flex-col bg-background overflow-y-auto"
        >
          <ScenarioEditor
            onSave={(scenario) => {
              addScenario(scenario);
              setShowEditor(false);
            }}
            onCancel={() => setShowEditor(false)}
          />
        </m.div>
      </AnimatePresence>
    );
  }

  // --- Training setup view ---
  if (showSetup && trainingState.phase === 'setup') {
    return (
      <AnimatePresence mode="wait">
        <m.div
          key="training-setup"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25 }}
          className="flex flex-1 flex-col"
        >
          <TrainingSetup
            profile={profile}
            recommendedTarget={getRecommendedTarget()}
            {...(preSelectedTargets.length > 0 ? { initialTargets: preSelectedTargets } : {})}
            isLoading={trainingState.isLoading}
            error={trainingState.error}
            customScenarios={customScenarios}
            onStart={(at, diff, tgts, customDesc, customPersona, gender) => void handleStartTraining(at, diff, tgts, customDesc, customPersona, gender)}
            onCreateScenario={() => setShowEditor(true)}
            onDeleteScenario={removeScenario}
            onBack={handleTrainingBack}
          />
        </m.div>
      </AnimatePresence>
    );
  }

  // --- Active training session views ---
  if (trainingState.phase === 'conversation' || trainingState.phase === 'interrupted') {
    return (
      <AnimatePresence mode="wait">
        <m.div
          key="training-chat"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex flex-col bg-background"
        >
          <TrainingChat
            scammerName={trainingState.scenarioConfig?.scammerPersona.name ?? 'Truffatore'}
            turns={trainingState.turns}
            latestScores={trainingState.latestScores}
            isLoading={trainingState.isLoading}
            waitSeconds={trainingState.waitSeconds}
            error={trainingState.error}
            onSendMessage={(text) => void training.sendMessage(text)}
            onBack={handleTrainingBack}
          />
          {/* Interruption overlay — prompt user to begin reflection */}
          {trainingState.phase === 'interrupted' && !trainingState.isLoading && (
            <m.div
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border-t bg-slate-900/95 px-4 py-6 text-center ${
                trainingState.interruptReason === 'max_turns'
                  ? 'border-cyan-500/30'
                  : 'border-amber-500/30'
              }`}
            >
              <p className={`mb-3 text-base font-medium ${
                trainingState.interruptReason === 'max_turns'
                  ? 'text-cyan-300'
                  : 'text-amber-300'
              }`}>
                {trainingState.interruptReason === 'max_turns'
                  ? 'Sessione completata. Passiamo alla riflessione.'
                  : 'Sessione interrotta — il livello di rischio ha superato la soglia.'}
              </p>
              <button
                type="button"
                onClick={training.beginReflection}
                className="btn-primary"
              >
                {trainingState.interruptReason === 'max_turns'
                  ? 'Analizza le tue scelte'
                  : 'Inizia riflessione guidata'}
              </button>
            </m.div>
          )}
        </m.div>
      </AnimatePresence>
    );
  }

  if (trainingState.phase === 'reflection') {
    return (
      <AnimatePresence mode="wait">
        <m.div
          key="training-reflection"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex flex-col bg-background"
        >
          <ReflectionView
            currentStep={trainingState.currentReflectionStep}
            currentQuestion={trainingState.currentReflectionQuestion}
            reflections={trainingState.reflections}
            isLoading={trainingState.isLoading}
            waitSeconds={trainingState.waitSeconds}
            error={trainingState.error}
            suggestedAnswers={trainingState.suggestedAnswers}
            isFetchingSuggestions={trainingState.isFetchingSuggestions}
            onSubmitAnswer={(answer) => void training.submitReflection(answer)}
            onBack={handleTrainingBack}
          />
        </m.div>
      </AnimatePresence>
    );
  }

  if (trainingState.phase === 'summary') {
    return (
      <AnimatePresence mode="wait">
        <m.div
          key="training-report"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex flex-col bg-background overflow-y-auto"
        >
          <SessionReport
            scores={trainingState.finalScores ?? trainingState.latestScores}
            reflections={trainingState.reflections}
            previousAverageScores={profile.sessionsCompleted > 1 ? profile.averageScores : null}
            onFinish={handleTrainingBack}
            onBack={handleTrainingBack}
            onContinueChat={training.continueChat}
            onTrainOnDimension={handleTrainOnDimension}
          />
        </m.div>
      </AnimatePresence>
    );
  }

  // --- Active simulation view ---
  if (activeSim) {
    return (
      <AnimatePresence mode="wait">
        <m.div
          key={activeSim.id}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25 }}
          className="flex flex-1 flex-col"
        >
          <ChatSimulator
            simulation={activeSim}
            onBack={() => setActiveSim(null)}
            isFirstSimulation={simulationCount === 0}
            onComplete={handleSimComplete}
          />
        </m.div>
      </AnimatePresence>
    );
  }

  // --- Hub view ---
  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-foreground">
          Training antitruffa
        </h2>
        <p className="text-muted-foreground">
          Allenati a riconoscere quando <span className="font-medium text-cyan-300">stai per</span> cascare in una truffa.
        </p>
      </div>

      {/* Realism hint — shown after first simulation completion */}
      <AnimatePresence>
        {showRealismHint && (
          <m.div
            key="realism-hint"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="flex items-start gap-2.5 rounded-2xl border border-cyan-brand/30 bg-cyan-brand/10 px-4 py-3"
          >
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyan-brand" aria-hidden="true" />
            <p className="text-base leading-relaxed text-cyan-100">
              Ottimo! Prova ora un&apos;opzione più realistica — questa volta vedrai anche risposte sbagliate da evitare.
            </p>
          </m.div>
        )}
      </AnimatePresence>

      {/* AI Training card — Palestra Mentale */}
      {isTrainingEnabled && (
        <m.button
          type="button"
          onClick={handleOpenSetup}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="group relative flex items-start gap-4 p-6 text-left transition-all cursor-pointer
                     rounded-3xl border-2 border-violet-500/40 hover:border-violet-400/60
                     bg-gradient-to-br from-violet-950/60 via-slate-900/80 to-indigo-950/60
                     backdrop-blur-xl shadow-xl hover:shadow-violet-500/20"
          style={{ minHeight: 44 }}
        >
          {/* Icon */}
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 transition-colors group-hover:bg-violet-500/30">
            <Brain className="size-5 text-violet-400" aria-hidden="true" />
          </div>

          {/* Text */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">
                Palestra Mentale
              </h3>
              <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-300">
                Beta
              </span>
            </div>
            {profile.sessionsCompleted > 0 ? (
              <p className="text-base leading-relaxed text-muted-foreground">
                Bentornato! <span className="font-medium text-violet-300">{profile.sessionsCompleted} sessioni</span> completate.
                {profile.weakestDimension && (
                  <> Punto debole: <span className="font-medium text-amber-300">{
                    profile.weakestDimension === 'activation' ? 'attivazione' :
                    profile.weakestDimension === 'impulsivity' ? 'impulsivita' :
                    profile.weakestDimension === 'verification' ? 'verifica' : 'consapevolezza'
                  }</span>.</>
                )}
              </p>
            ) : (
              <p className="text-base leading-relaxed text-muted-foreground">
                Conversazione AI libera per allenare i tuoi riflessi mentali contro le truffe.
              </p>
            )}
          </div>
        </m.button>
      )}

      {/* Training dashboard — visible after first session */}
      {isTrainingEnabled && profile.sessionsCompleted > 0 && (
        <TrainingDashboard profile={profile} />
      )}

      {/* Prompt — moved from old button text */}
      <p className="text-base font-medium text-cyan-300">
        Clicca su uno scenario per iniziare
      </p>

      {/* Scenario cards — click to start simulation directly */}
      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        role="list"
        aria-label="Scenari di simulazione disponibili"
      >
        {sortedSimulations.map((sim, i) => {
          const Icon = ICON_MAP[sim.icon];
          const isLoading = selectingId === sim.id;

          return (
            <m.button
              key={sim.id}
              type="button"
              onKeyDown={(event) => handleKeyDownCard(event, sim.id)}
              onClick={() => void handleSelectSim(sim.id)}
              disabled={selectingId !== null}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
              whileHover={selectingId === null ? { scale: 1.02, y: -2 } : {}}
              whileTap={selectingId === null ? { scale: 0.98 } : {}}
              className="glass-card group flex flex-col items-start gap-3 p-6 text-left transition-shadow cursor-pointer"
              style={{ minHeight: 44 }}
              aria-busy={isLoading}
            >
              {/* Icon circle — swaps to spinner while this card loads */}
              <div
                className="flex size-11 items-center justify-center rounded-xl
                            bg-cyan-brand/10 transition-colors
                            group-hover:bg-cyan-brand/20"
              >
                {isLoading ? (
                  <Loader2
                    className="size-5 animate-spin text-cyan-brand"
                    aria-hidden="true"
                  />
                ) : (
                  Icon && (
                    <Icon className="size-5 text-cyan-brand" aria-hidden="true" />
                  )
                )}
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground">
                  {sim.title}
                </h3>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {sim.description}
                </p>
              </div>
            </m.button>
          );
        })}
      </div>

      {/* Navigation — only back + forward, no secondary CTA */}
      <div className="mt-auto flex justify-between gap-3 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="btn-ghost"
        >
          Indietro
        </button>
        <button
          type="button"
          onClick={onNext}
          className="btn-primary"
        >
          Avanti
        </button>
      </div>
    </div>
  );
}
