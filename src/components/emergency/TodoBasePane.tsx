/** Base tab pane — incident toggle, progress bar, sorted generic to-do list. */
import * as m from 'motion/react-m';
import type { TodoItem } from '@/types/todo';
import { GENERIC_TODOS } from '@/data/todo-generic';
import { TodoProgressBar } from './TodoProgressBar';
import { TodoRow } from './TodoRow';

interface TodoBasePaneProps {
  readonly resolvedIncident: 'no' | 'yes';
  readonly setIncident: (v: 'no' | 'yes') => void;
  readonly onIncidentChange?: (v: 'yes' | 'no') => void;
  readonly completedGeneric: readonly string[];
  readonly onToggleGeneric: (id: string) => void;
  readonly showIncidentToggle: boolean;
  readonly activeSevereId: string | null;
  readonly setActiveSevereId: (id: string | null) => void;
}

export function TodoBasePane({ resolvedIncident, setIncident, onIncidentChange, completedGeneric, onToggleGeneric, showIncidentToggle, activeSevereId, setActiveSevereId }: TodoBasePaneProps) {
  const isRelevant = (item: TodoItem): boolean => {
    if (!item.scope || item.scope === 'both' || item.scope === 'verify') return true;
    return resolvedIncident === 'yes'
      ? item.scope === 'repair'
      : item.scope === 'prevention';
  };
  return (
    <m.div key="base" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }}>
      {showIncidentToggle && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-base text-muted-foreground">Hai subito una truffa?</p>
          <div className="inline-flex shrink-0 rounded-full bg-white/5 p-0.5 text-base">
            <button type="button" onClick={() => { setIncident('no'); onIncidentChange?.('no'); }}
              className={`rounded-full px-2 py-1 transition-colors ${resolvedIncident === 'no' ? 'bg-cyan-brand/20 text-cyan-brand' : 'text-muted-foreground hover:text-foreground'}`}>
              No
            </button>
            <button type="button" onClick={() => { setIncident('yes'); onIncidentChange?.('yes'); }}
              className={`rounded-full px-2 py-1 transition-colors ${resolvedIncident === 'yes' ? 'bg-cyan-brand/20 text-cyan-brand' : 'text-muted-foreground hover:text-foreground'}`}>
              Sì
            </button>
          </div>
        </div>
      )}
      {(() => { const visible = GENERIC_TODOS.filter(isRelevant); return (
      <>
      <TodoProgressBar completed={completedGeneric.filter((id) => visible.some((t) => t.id === id)).length} total={visible.length} label="Progresso" />
      <div role="group" aria-label="Checklist generica anti-truffa">
        {visible.slice()
          .sort((a, b) => a.priority - b.priority)
          .map((item) => (
            <TodoRow key={item.id} item={item} isCompleted={completedGeneric.includes(item.id)}
              onToggle={() => {
                if (item.severe) {
                  const willCheck = !completedGeneric.includes(item.id);
                  if (willCheck) setActiveSevereId(item.id);
                  else if (activeSevereId === item.id) setActiveSevereId(null);
                }
                onToggleGeneric(item.id);
              }}
            />
          ))}
      </div>
      </>
      ); })()}
    </m.div>
  );
}
