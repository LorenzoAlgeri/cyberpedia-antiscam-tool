/**
 * TodoRow — single row in the todo checklist.
 * Renders a checkbox, item text, optional scope label, and expandable hint.
 */

import { useState } from 'react';
import { CheckCircle2, Circle, ChevronDown } from 'lucide-react';
import type { TodoItem, TodoScope } from '@/types/todo';

function scopeLabel(scope: TodoScope | undefined): string | null {
  if (!scope) return null;
  if (scope === 'prevention') return 'Prevenzione';
  if (scope === 'repair') return 'Se è già successo';
  if (scope === 'verify') return 'Verifica';
  return 'In ogni caso';
}

export interface TodoRowProps {
  item: TodoItem;
  isCompleted: boolean;
  onToggle: () => void;
  highlight?: boolean;
}

export function TodoRow({
  item,
  isCompleted,
  onToggle,
  highlight,
}: TodoRowProps) {
  const [hintOpen, setHintOpen] = useState(false);
  const label = scopeLabel(item.scope);
  const isDimmed = highlight === false;

  return (
    <div
      className={`rounded-xl px-3 py-3 transition-colors hover:bg-white/5 ${
        isDimmed ? 'opacity-70' : ''
      }`}
      style={{ minHeight: 44 }}
    >
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={onToggle}
          className="sr-only"
          aria-label={item.text}
        />
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
        <span className="flex flex-1 flex-col gap-1">
          <span
            className={`text-base leading-snug transition-all duration-200 ${
              isCompleted
                ? 'text-muted-foreground line-through opacity-60'
                : 'text-foreground'
            }`}
          >
            {item.text}
          </span>
          {label && (
            <span className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 text-sm font-medium text-muted-foreground">
              {label}
            </span>
          )}
        </span>
      </label>

      {item.hint && (
        <>
          <button
            type="button"
            onClick={() => setHintOpen((v) => !v)}
            className="ml-8 mt-1.5 flex items-center gap-1 rounded-lg px-2 py-1 text-base font-medium text-cyan-brand transition-colors hover:bg-cyan-brand/10"
            aria-expanded={hintOpen}
            aria-controls={`hint-${item.id}`}
          >
            Come attivare l'autenticazione a due fattori?
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${hintOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>
          {hintOpen && (
            <p
              id={`hint-${item.id}`}
              className="ml-8 mt-1 rounded-xl bg-white/5 px-3 py-2.5 text-base leading-relaxed text-muted-foreground"
            >
              {item.hint}
            </p>
          )}
        </>
      )}
    </div>
  );
}
