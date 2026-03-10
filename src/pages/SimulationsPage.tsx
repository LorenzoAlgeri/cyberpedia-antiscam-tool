import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, Heart, Users, Wallet } from 'lucide-react';
import { simulations } from '@/data/simulations';
import { ChatSimulator } from '@/components/chat/ChatSimulator';
import type { Simulation } from '@/types/simulation';

/** Map icon string from simulation data to Lucide component */
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Heart,
  Wallet,
  Building2,
  Users,
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

  // --- Active simulation view ---
  if (activeSim) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
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
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  // --- Hub view ---
  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-foreground">
          Simulazioni interattive
        </h2>
        <p className="text-muted-foreground">
          Mettiti alla prova con 4 scenari realistici di truffa.
          Nessun dato viene salvato.
        </p>
      </div>

      {/* 4 simulation cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {simulations.map((sim, i) => {
          const Icon = ICON_MAP[sim.icon];
          return (
            <motion.button
              key={sim.id}
              type="button"
              onClick={() => setActiveSim(sim)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="glass-card group flex cursor-pointer flex-col items-start
                         gap-3 p-6 text-left transition-shadow
                         hover:shadow-cyan-500/20"
              style={{ minHeight: 44 }}
            >
              {/* Icon circle */}
              <div
                className="flex size-11 items-center justify-center rounded-xl
                            bg-cyan-brand/10 transition-colors
                            group-hover:bg-cyan-brand/20"
              >
                {Icon && (
                  <Icon className="size-5 text-cyan-brand" aria-hidden="true" />
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
            </motion.button>
          );
        })}
      </div>

      {/* Nav buttons */}
      <div className="mt-auto flex gap-4 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="btn-secondary flex-1"
        >
          Indietro
        </button>
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
