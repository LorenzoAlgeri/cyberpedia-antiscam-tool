import { useState, useCallback, useMemo, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import * as m from 'motion/react-m';
import { AnimatePresence } from 'motion/react';
import { FileText, Heart, Loader2, Package, Sparkles } from 'lucide-react';
import { simulations } from '@/data/simulations';
import { ChatSimulator } from '@/components/chat/ChatSimulator';
import { useAISimulation } from '@/hooks/useAISimulation';
import type { Simulation } from '@/types/simulation';

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
  /** E-phase: preferred scenario selection (single-choice, romance default) */
  const [selectedId, setSelectedId] = useState<string>('romance-scam');
  /** Number of simulations completed — persisted in localStorage */
  const [simulationCount, setSimulationCount] = useState<number>(() => {
    const raw = localStorage.getItem('antiscam-sim-count');
    if (!raw) return 0;
    const n = parseInt(raw, 10);
    return Number.isNaN(n) ? 0 : n;
  });
  /** Show onboarding-to-realistic hint after first completion */
  const [showRealismHint, setShowRealismHint] = useState(false);

  const { isGenerating, fetchAISimulation } = useAISimulation();

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

  // Hooks must be called unconditionally — before any early return.
  const selectedSimulation = useMemo(
    () => simulations.find((s) => s.id === selectedId) ?? null,
    [selectedId],
  );

  const handleSelectSim = useCallback(
    async () => {
      // Guard case 1: no attack type selected → return early.
      // Guard does NOT fire when isGenerating is true — loading state is shown instead.
      if (!selectedId) return;
      const sim = selectedSimulation;
      if (!sim) return;

      console.debug('[SimulationsPage] handleSelectSim fired:', {
        id: sim.id,
        title: sim.title,
        stepsCount: sim.steps.length,
      });

      setSelectingId(sim.id);
      try {
        const aiSim = await fetchAISimulation(sim.id, 'medium');
        setActiveSim(aiSim ?? sim);
      } finally {
        setSelectingId(null);
      }
    },
    [selectedId, selectedSimulation, fetchAISimulation],
  );

  const handleKeyDownRadio = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, simId: string, disabled: boolean) => {
      if (disabled) return;
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        setSelectedId(simId);
      }
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        const currentIndex = simulations.findIndex((s) => s.id === selectedId);
        const delta = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
        const nextIndex = (currentIndex + delta + simulations.length) % simulations.length;
        setSelectedId(simulations[nextIndex]?.id ?? simId);
      }
    },
    [selectedId],
  );

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
          Scenario preferito
        </h2>
        <p className="text-muted-foreground">
          Se vuoi, scegli lo scenario più probabile: così ti prepariamo la checklist mirata.
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
            <p className="text-sm leading-relaxed text-cyan-100">
              Ottimo! Prova ora un&apos;opzione più realistica — questa volta vedrai anche risposte sbagliate da evitare.
            </p>
          </m.div>
        )}
      </AnimatePresence>

      {/* Scenario selector — single choice, romance scam enabled, others upcoming */}
      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        role="radiogroup"
        aria-label="Scegli lo scenario più probabile"
      >
        {simulations.map((sim, i) => {
          const Icon = ICON_MAP[sim.icon];
          const isSelected = selectedId === sim.id;

          return (
            <m.button
              key={sim.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onKeyDown={(event) => handleKeyDownRadio(event, sim.id, false)}
              onClick={() => setSelectedId(sim.id)}
              disabled={selectingId !== null}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
              whileHover={selectingId === null ? { scale: 1.02, y: -2 } : {}}
              whileTap={selectingId === null ? { scale: 0.98 } : {}}
              className="glass-card group flex flex-col items-start gap-3 p-6 text-left transition-shadow cursor-pointer"
              style={{ minHeight: 44 }}
            >
              {/* Icon circle — swaps to spinner while this card loads */}
              <div
                className="flex size-11 items-center justify-center rounded-xl
                            bg-cyan-brand/10 transition-colors
                            group-hover:bg-cyan-brand/20"
              >
                {selectingId === sim.id ? (
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
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {sim.description}
                </p>
              </div>
            </m.button>
          );
        })}
      </div>

      {/* CTAs: try simulation + advance */}
      <div className="mt-auto flex flex-col gap-3 pt-4 sm:flex-row">
        {/* Tertiary — ghost */}
        <button
          type="button"
          onClick={onBack}
          className="btn-ghost sm:order-first"
        >
          Indietro
        </button>
        {/* Secondary — outline */}
        <button
          type="button"
          onClick={() => void handleSelectSim()}
          className="btn-secondary flex flex-1 items-center justify-center gap-2"
          disabled={!selectedId || selectingId !== null}
          aria-busy={isGenerating || selectingId !== null}
        >
          {selectingId !== null || isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Caricamento...
            </>
          ) : (
            'Prova una simulazione (45 sec)'
          )}
        </button>
        {/* Primary — filled */}
        <button
          type="button"
          onClick={onNext}
          className="btn-primary flex-1"
        >
          Avanti
        </button>
      </div>
    </div>
  );
}
