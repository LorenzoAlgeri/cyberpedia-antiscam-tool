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
    if (!item.scope) return true;
    return resolvedIncident === 'yes'
      ? item.scope === 'repair' || item.scope === 'both'
      : item.scope === 'prevention' || item.scope === 'both';
  };
  return (
    <m.div key="base" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }}>
      {showIncidentToggle && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Hai subito una truffa in questa situazione?</p>
          <div className="inline-flex rounded-full bg-white/5 p-0.5 text-sm">
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
      <TodoProgressBar completed={completedGeneric.length} total={GENERIC_TODOS.length} label="Progresso" />
      <div role="group" aria-label="Checklist generica anti-truffa">
        {GENERIC_TODOS.slice()
          .sort((a, b) => {
            const aR = isRelevant(a); const bR = isRelevant(b);
            return aR === bR ? a.priority - b.priority : aR ? -1 : 1;
          })
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
              highlight={isRelevant(item)}
            />
          ))}
      </div>
    </m.div>
  );
}
