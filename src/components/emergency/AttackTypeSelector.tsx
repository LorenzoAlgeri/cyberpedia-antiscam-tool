/**
 * AttackTypeSelector — 6 card grid for selecting the scam type.
 *
 * Design decisions (skills consulted):
 * - /ui-ux-pro-max: card grid with icon + label + description
 * - /interaction-design: hover glow, active scale, ring on selected
 * - /accessibility-compliance: role="radiogroup" + role="radio",
 *   aria-checked, keyboard nav (Enter/Space to select)
 * - /frontend-design: 2-col grid on mobile, 3-col on md+
 * - CLAUDE.md: rounded-3xl cards, cyan glow on hover/selected,
 *   touch targets 44px, Lucide icons only
 */

import { useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Banknote,
  Heart,
  Headset,
  Mail,
  Users,
  Brain,
  type LucideIcon,
} from 'lucide-react';
import type { AttackType } from '@/types/emergency';
import { ATTACK_TYPES } from '@/data/attack-types';

/** Map icon string names from data to actual Lucide components */
const ICON_MAP: Record<string, LucideIcon> = {
  Banknote,
  Heart,
  Headset,
  Mail,
  Users,
  Brain,
};

interface AttackTypeSelectorProps {
  /** Currently selected attack type (null = none selected) */
  readonly selected: AttackType | null;
  /** Called when user selects an attack type */
  readonly onSelect: (type: AttackType) => void;
}

export function AttackTypeSelector({
  selected,
  onSelect,
}: AttackTypeSelectorProps) {
  const groupRef = useRef<HTMLDivElement>(null);

  /** Roving tabindex: arrow keys move focus + select */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key))
        return;

      e.preventDefault();
      const buttons = groupRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="radio"]',
      );
      if (!buttons?.length) return;

      const current = Array.from(buttons).findIndex(
        (b) => b === document.activeElement,
      );
      let next = current;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        next = (current + 1) % buttons.length;
      } else {
        next = (current - 1 + buttons.length) % buttons.length;
      }

      const nextBtn = buttons[next]!;
      nextBtn.focus();
      onSelect(ATTACK_TYPES[next]!.id);
    },
    [onSelect],
  );

  return (
    <section>
      <h3 className="mb-2 text-lg font-semibold text-foreground">
        Tipo di attacco
      </h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Seleziona il tipo di truffa per una checklist mirata.
      </p>

      <div
        ref={groupRef}
        role="radiogroup"
        aria-label="Seleziona il tipo di attacco"
        onKeyDown={handleKeyDown}
        className="grid grid-cols-2 gap-3 md:grid-cols-3"
      >
        {ATTACK_TYPES.map((attack, idx) => {
          const Icon = ICON_MAP[attack.icon] ?? Brain;
          const isSelected = selected === attack.id;

          return (
            <motion.button
              key={attack.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected || (!selected && idx === 0) ? 0 : -1}
              onClick={() => onSelect(attack.id)}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-colors sm:gap-3 sm:p-5 ${
                isSelected
                  ? 'border-cyan-brand bg-cyan-brand/10 shadow-lg shadow-cyan-brand/15'
                  : 'border-white/10 bg-secondary/50 hover:border-cyan-brand/30 hover:bg-secondary'
              }`}
              style={{ minHeight: 44 }}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${
                  isSelected
                    ? 'bg-cyan-brand/20 text-cyan-brand'
                    : 'bg-white/5 text-muted-foreground'
                }`}
              >
                <Icon
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </div>

              <div>
                <span
                  className={`block text-sm font-semibold leading-tight sm:text-base ${
                    isSelected ? 'text-foreground' : 'text-foreground/80'
                  }`}
                >
                  {attack.label}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground sm:text-sm">
                  {attack.description}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
