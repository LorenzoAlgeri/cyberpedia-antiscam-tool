/**
 * TodoChecklist — tabbed generic + attack-specific to-do items.
 *
 * B2 change: two tabs replace the stacked layout:
 * - "Base (sempre)"    → generic anti-scam actions, always shown
 * - "Scenario (mirato)" → attack-specific actions, placeholder when none selected
 *
 * Design decisions:
 * - /accessibility-compliance: role="group", native <input> checkboxes
 * - /interaction-design: line-through on completed, smooth tab cross-fade
 * - /ui-ux-pro-max: progress indicator "X/N completati" + visual bar
 * - Tab state is local — parent state (completed IDs) is never reset on switch
 */

import { useState } from 'react';
import * as m from 'motion/react-m';
import { AnimatePresence } from 'motion/react';
import { AlertTriangle, Crosshair } from 'lucide-react';
import type { AttackType } from '@/types/emergency';
import type { TodoItem } from '@/types/todo';
import { GENERIC_TODOS } from '@/data/todo-generic';
import { ATTACK_TODOS } from '@/data/todo-by-attack';
import { SevereActionBanner } from './SevereActionBanner';
import { TodoProgressBar } from './TodoProgressBar';
import { TodoRow } from './TodoRow';

interface TodoChecklistProps {
  /** Currently selected attack type (null = no scenario chosen) */
  readonly selectedAttack: AttackType | null;
  readonly completedGeneric: readonly string[];
  readonly completedAttack: readonly string[];
  readonly onToggleGeneric: (id: string) => void;
  readonly onToggleAttack: (id: string) => void;
  /** Controlled tab (optional). If provided, internal tab state is bypassed. */
  readonly activeTab?: 'base' | 'scenario';
  /** Called when the user switches tabs (works for controlled + uncontrolled). */
  readonly onTabChange?: (tab: 'base' | 'scenario') => void;
  /** Show the internal tab bar (default: true). */
  readonly showTabs?: boolean;
  /** Controlled incident status (optional). */
  readonly incidentStatus?: 'no' | 'yes';
  /** Show the incident toggle (default: true). */
  readonly showIncidentToggle?: boolean;
  /** Called when the user clicks a Sì/No pill — propagates to App state + localStorage */
  readonly onIncidentChange?: (v: 'yes' | 'no') => void;
  /** Bank contact info — used for the severe-action CTA ("Chiama banca") */
  readonly bankPhone?: string;
  readonly bankCountryCode?: string;
  readonly bankName?: string;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function TodoChecklist({
  selectedAttack,
  completedGeneric,
  completedAttack,
  onToggleGeneric,
  onToggleAttack,
  activeTab,
  onTabChange,
  showTabs = true,
  incidentStatus,
  showIncidentToggle = true,
  onIncidentChange,
  bankPhone,
  bankCountryCode,
  bankName,
}: TodoChecklistProps) {
  const [uncontrolledTab, setUncontrolledTab] = useState<'base' | 'scenario'>('base');
  const [uncontrolledIncident, setUncontrolledIncident] = useState<'no' | 'yes'>('no');
  /** ID of the severe item most recently checked — drives the micro-action banner. */
  const [activeSevereId, setActiveSevereId] = useState<string | null>(null);

  const resolvedTab = activeTab ?? uncontrolledTab;
  const resolvedIncident = incidentStatus ?? uncontrolledIncident;

  const setTab = (tab: 'base' | 'scenario') => {
    onTabChange?.(tab);
    if (activeTab === undefined) setUncontrolledTab(tab);
  };

  const setIncident = (v: 'no' | 'yes') => {
    if (incidentStatus === undefined) setUncontrolledIncident(v);
  };

  const attackTodos: readonly TodoItem[] = selectedAttack
    ? (ATTACK_TODOS[selectedAttack] ?? [])
    : [];

  const totalGeneric = GENERIC_TODOS.length;
  const doneGeneric = completedGeneric.length;
  const totalAttack = attackTodos.length;
  const doneAttack = completedAttack.length;

  return (
    <section className="space-y-4">
      {/* Tab bar */}
      {showTabs && (
        <div
          className="flex rounded-2xl bg-white/5 p-1"
          role="tablist"
          aria-label="Sezioni checklist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={resolvedTab === 'base'}
            onClick={() => setTab('base')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-colors ${
              resolvedTab === 'base'
                ? 'bg-white/10 text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            Base (sempre)
            {doneGeneric > 0 && (
              <span className="ml-1 rounded-full bg-success/20 px-1.5 py-0.5 text-xs text-success">
                {doneGeneric}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={resolvedTab === 'scenario'}
            onClick={() => setTab('scenario')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-colors ${
              resolvedTab === 'scenario'
                ? 'bg-cyan-brand/15 text-cyan-brand shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Crosshair className="h-4 w-4 shrink-0" aria-hidden="true" />
            Scenario (mirato)
            {doneAttack > 0 && (
              <span className="ml-1 rounded-full bg-cyan-brand/20 px-1.5 py-0.5 text-xs text-cyan-brand">
                {doneAttack}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Severe-action micro-action banner — inline, non-blocking */}
      <AnimatePresence>
        {activeSevereId && (
          <SevereActionBanner
            {...(bankName !== undefined ? { bankName } : {})}
            {...(bankPhone !== undefined ? { bankPhone } : {})}
            {...(bankCountryCode !== undefined ? { bankCountryCode } : {})}
            onDismiss={() => setActiveSevereId(null)}
          />
        )}
      </AnimatePresence>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {resolvedTab === 'base' && (
          <m.div
            key="base"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
          >
            {showIncidentToggle && (
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Hai subito una truffa in questa situazione?
                </p>
                <div className="inline-flex rounded-full bg-white/5 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => { setIncident('no'); onIncidentChange?.('no'); }}
                    className={`rounded-full px-2 py-1 transition-colors ${
                      resolvedIncident === 'no'
                        ? 'bg-cyan-brand/20 text-cyan-brand'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIncident('yes'); onIncidentChange?.('yes'); }}
                    className={`rounded-full px-2 py-1 transition-colors ${
                      resolvedIncident === 'yes'
                        ? 'bg-cyan-brand/20 text-cyan-brand'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Sì
                  </button>
                </div>
              </div>
            )}

            <TodoProgressBar
              completed={doneGeneric}
              total={totalGeneric}
              label="Progresso"
            />
            <div role="group" aria-label="Checklist generica anti-truffa">
              {GENERIC_TODOS
                .slice()
                .sort((a, b) => {
                  const isRelevant = (item: TodoItem): boolean => {
                    if (!item.scope) return true;
                    if (resolvedIncident === 'yes') {
                      return item.scope === 'repair' || item.scope === 'both';
                    }
                    return item.scope === 'prevention' || item.scope === 'both';
                  };

                  const aRelevant = isRelevant(a);
                  const bRelevant = isRelevant(b);
                  if (aRelevant === bRelevant) {
                    return a.priority - b.priority;
                  }
                  return aRelevant ? -1 : 1;
                })
                .map((item) => {
                  const isRelevant =
                    !item.scope ||
                    (resolvedIncident === 'yes'
                      ? item.scope === 'repair' || item.scope === 'both'
                      : item.scope === 'prevention' || item.scope === 'both');
                  return (
                    <TodoRow
                      key={item.id}
                      item={item}
                      isCompleted={completedGeneric.includes(item.id)}
                      onToggle={() => {
                        if (item.severe) {
                          const willCheck = !completedGeneric.includes(item.id);
                          if (willCheck) setActiveSevereId(item.id);
                          else if (activeSevereId === item.id) setActiveSevereId(null);
                        }
                        onToggleGeneric(item.id);
                      }}
                      highlight={isRelevant}
                    />
                  );
                })}
            </div>
          </m.div>
        )}

        {resolvedTab === 'scenario' && (
          <m.div
            key="scenario"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.2 }}
          >
            {selectedAttack && attackTodos.length > 0 ? (
              <>
                <TodoProgressBar
                  completed={doneAttack}
                  total={totalAttack}
                  label="Azioni mirate"
                />
                <div
                  role="group"
                  aria-label="Checklist specifica per tipo di attacco"
                >
                  {attackTodos.map((item) => (
                    <TodoRow
                      key={item.id}
                      item={item}
                      isCompleted={completedAttack.includes(item.id)}
                      onToggle={() => {
                        if (item.severe) {
                          const willCheck = !completedAttack.includes(item.id);
                          if (willCheck) setActiveSevereId(item.id);
                          else if (activeSevereId === item.id) setActiveSevereId(null);
                        }
                        onToggleAttack(item.id);
                      }}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <Crosshair
                  className="h-8 w-8 text-muted-foreground/40"
                  strokeWidth={1}
                  aria-hidden="true"
                />
                <p className="text-sm text-muted-foreground">
                  Seleziona il tipo di truffa per vedere
                  <br />
                  le azioni mirate.
                </p>
              </div>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </section>
  );
}
