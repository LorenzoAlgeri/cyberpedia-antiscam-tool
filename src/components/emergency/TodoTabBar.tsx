/** Tab bar for TodoChecklist — "Base (sempre)" and "Scenario (mirato)" tabs. */
import { AlertTriangle, Crosshair } from 'lucide-react';

interface TodoTabBarProps {
  readonly resolvedTab: 'base' | 'scenario';
  readonly setTab: (tab: 'base' | 'scenario') => void;
  readonly doneGeneric: number;
  readonly doneAttack: number;
}

export function TodoTabBar({ resolvedTab, setTab, doneGeneric, doneAttack }: TodoTabBarProps) {
  const baseActive = resolvedTab === 'base';
  const scenarioActive = resolvedTab === 'scenario';
  return (
    <div className="flex rounded-2xl bg-white/5 p-1" role="tablist" aria-label="Sezioni checklist">
      <button type="button" role="tab" aria-selected={baseActive} onClick={() => setTab('base')}
        className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-base font-medium transition-colors ${baseActive ? 'bg-white/10 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
        Base (sempre)
        {doneGeneric > 0 && (
          <span className="ml-1 rounded-full bg-success/20 px-1.5 py-0.5 text-sm text-success">{doneGeneric}</span>
        )}
      </button>
      <button type="button" role="tab" aria-selected={scenarioActive} onClick={() => setTab('scenario')}
        className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-base font-medium transition-colors ${scenarioActive ? 'bg-cyan-brand/15 text-cyan-brand shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
        <Crosshair className="h-4 w-4 shrink-0" aria-hidden="true" />
        Scenario (mirato)
        {doneAttack > 0 && (
          <span className="ml-1 rounded-full bg-cyan-brand/20 px-1.5 py-0.5 text-sm text-cyan-brand">{doneAttack}</span>
        )}
      </button>
    </div>
  );
}
