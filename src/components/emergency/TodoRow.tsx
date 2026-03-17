/**
 * TodoRow — single row in the todo checklist.
 * Renders a checkbox, item text, and an optional scope label badge.
 */

import { CheckCircle2, Circle } from 'lucide-react';
import type { TodoItem, TodoScope } from '@/types/todo';

function scopeLabel(scope: TodoScope | undefined): string | null {
  if (!scope) return null;
  if (scope === 'prevention') return 'Prevenzione';
  if (scope === 'repair') return 'Se è già successo';
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
  const label = scopeLabel(item.scope);
  const isDimmed = highlight === false;

  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-white/5 ${
        isDimmed ? 'opacity-70' : ''
      }`}
      style={{ minHeight: 44 }}
    >
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
  );
}
