/**
 * TodoChecklist — generic + attack-specific to-do items with progress counter.
 *
 * Design decisions (skills consulted):
 * - /accessibility-compliance: role="group", each checkbox is native <input>
 *   for screen reader + keyboard compat
 * - /interaction-design: line-through on completed, smooth opacity transition
 * - /ui-ux-pro-max: progress indicator "X/N completati" with visual bar
 * - /frontend-design: glass-card sections, clear visual separation
 * - CLAUDE.md: counter progresso "X/10 completati", touch targets 44px
 */

import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Circle, AlertTriangle } from 'lucide-react';
import type { AttackType } from '@/types/emergency';
import type { TodoItem } from '@/types/todo';
import { GENERIC_TODOS } from '@/data/todo-generic';
import { ATTACK_TODOS } from '@/data/todo-by-attack';

interface TodoChecklistProps {
  /** Currently selected attack type (null = show generic only) */
  readonly selectedAttack: AttackType | null;
  /** IDs of completed generic to-do items */
  readonly completedGeneric: readonly string[];
  /** IDs of completed attack-specific to-do items */
  readonly completedAttack: readonly string[];
  /** Toggle a generic to-do item */
  readonly onToggleGeneric: (id: string) => void;
  /** Toggle an attack-specific to-do item */
  readonly onToggleAttack: (id: string) => void;
}

/** Progress bar + counter sub-component */
function ProgressBar({
  completed,
  total,
  label,
}: {
  completed: number;
  total: number;
  label: string;
}) {
  const pct = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="mb-4">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">
          {completed}/{total} completati
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-cyan-brand to-cyan-brand-light"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

/** Single to-do row */
function TodoRow({
  item,
  isCompleted,
  onToggle,
}: {
  item: TodoItem;
  isCompleted: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className="flex cursor-pointer items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-white/5"
      style={{ minHeight: 44 }}
    >
      <input
        type="checkbox"
        checked={isCompleted}
        onChange={onToggle}
        className="sr-only"
        aria-label={item.text}
      />
      {/* Visual checkbox icon */}
      <span className="mt-0.5 shrink-0">
        {isCompleted ? (
          <CheckCircle2
            className="h-5 w-5 text-success"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        ) : (
          <Circle
            className="h-5 w-5 text-muted-foreground"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        )}
      </span>
      <span
        className={`text-base leading-snug transition-all duration-200 ${
          isCompleted
            ? 'text-muted-foreground line-through opacity-60'
            : 'text-foreground'
        }`}
      >
        {item.text}
      </span>
    </label>
  );
}

export function TodoChecklist({
  selectedAttack,
  completedGeneric,
  completedAttack,
  onToggleGeneric,
  onToggleAttack,
}: TodoChecklistProps) {
  const attackTodos = selectedAttack ? ATTACK_TODOS[selectedAttack] : [];
  const totalGeneric = GENERIC_TODOS.length;
  const doneGeneric = completedGeneric.length;
  const totalAttack = attackTodos.length;
  const doneAttack = completedAttack.length;

  return (
    <section className="space-y-6">
      {/* Generic checklist */}
      <div>
        <div className="mb-1 flex items-center gap-2">
          <AlertTriangle
            className="h-5 w-5 text-destructive"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <h3 className="text-lg font-semibold text-foreground">
            Checklist anti-truffa
          </h3>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          Azioni fondamentali da seguire in ogni caso.
        </p>

        <ProgressBar
          completed={doneGeneric}
          total={totalGeneric}
          label="Progresso"
        />

        <div role="group" aria-label="Checklist generica anti-truffa">
          {GENERIC_TODOS.map((item) => (
            <TodoRow
              key={item.id}
              item={item}
              isCompleted={completedGeneric.includes(item.id)}
              onToggle={() => onToggleGeneric(item.id)}
            />
          ))}
        </div>
      </div>

      {/* Attack-specific checklist (appears when an attack is selected) */}
      <AnimatePresence>
        {selectedAttack && attackTodos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-cyan-brand/20 bg-cyan-brand/5 p-4 sm:p-5">
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                Azioni specifiche
              </h3>
              <p className="mb-3 text-sm text-muted-foreground">
                Consigli mirati per il tipo di attacco selezionato.
              </p>

              <ProgressBar
                completed={doneAttack}
                total={totalAttack}
                label="Specifici"
              />

              <div role="group" aria-label="Checklist specifica per tipo di attacco">
                {attackTodos.map((item) => (
                  <TodoRow
                    key={item.id}
                    item={item}
                    isCompleted={completedAttack.includes(item.id)}
                    onToggle={() => onToggleAttack(item.id)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
