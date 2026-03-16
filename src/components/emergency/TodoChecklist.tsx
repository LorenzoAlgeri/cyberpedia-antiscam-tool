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
import { Crosshair } from 'lucide-react';
import type { AttackType } from '@/types/emergency';
import type { TodoItem } from '@/types/todo';
import { ATTACK_TODOS } from '@/data/todo-by-attack';
import { SevereActionBanner } from './SevereActionBanner';
import { TodoProgressBar } from './TodoProgressBar';
import { TodoRow } from './TodoRow';
import { TodoTabBar } from './TodoTabBar';
import { TodoBasePane } from './TodoBasePane';

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

  const attackTodos: readonly TodoItem[] = selectedAttack ? (ATTACK_TODOS[selectedAttack] ?? []) : [];

  const doneGeneric = completedGeneric.length;
  const doneAttack = completedAttack.length;
  const totalAttack = attackTodos.length;

  return (
    <section className="space-y-4">
      {/* Tab bar */}
      {showTabs && (
        <TodoTabBar resolvedTab={resolvedTab} setTab={setTab} doneGeneric={doneGeneric} doneAttack={doneAttack} />
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
          <TodoBasePane
            resolvedIncident={resolvedIncident}
            setIncident={setIncident}
            {...(onIncidentChange !== undefined ? { onIncidentChange } : {})}
            completedGeneric={completedGeneric}
            onToggleGeneric={onToggleGeneric}
            showIncidentToggle={showIncidentToggle}
            activeSevereId={activeSevereId}
            setActiveSevereId={setActiveSevereId}
          />
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
                <TodoProgressBar completed={doneAttack} total={totalAttack} label="Azioni mirate" />
                <div role="group" aria-label="Checklist specifica per tipo di attacco">
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
                <Crosshair className="h-8 w-8 text-muted-foreground/40" strokeWidth={1} aria-hidden="true" />
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
