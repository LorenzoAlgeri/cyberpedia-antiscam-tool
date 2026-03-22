/**
 * AttackTypeSelector — 6 card grid for selecting the scam type.
 *
 * Cards with comingSoon=true are blurred and non-interactive,
 * showing a "In arrivo" badge overlay.
 */

import { useRef, useCallback } from 'react';
import * as m from 'motion/react-m';
import {
  Banknote,
  Heart,
  Headset,
  Mail,
  Users,
  Brain,
  Clock,
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

  const selectableTypes = ATTACK_TYPES.filter((a) => !a.comingSoon);

  /** Roving tabindex: arrow keys move focus + select (skip comingSoon) */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key))
        return;

      e.preventDefault();
      const buttons = groupRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="radio"]:not([aria-disabled="true"])',
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
      onSelect(selectableTypes[next]!.id);
    },
    [onSelect, selectableTypes],
  );

  return (
    <section>
      <div
        ref={groupRef}
        role="radiogroup"
        aria-label="Seleziona il tipo di attacco"
        onKeyDown={handleKeyDown}
        className="grid grid-cols-2 gap-3 md:grid-cols-3"
      >
        {ATTACK_TYPES.map((attack) => {
          const Icon = ICON_MAP[attack.icon] ?? Brain;
          const isSelected = selected === attack.id;
          const isComingSoon = attack.comingSoon === true;

          if (isComingSoon) {
            return (
              <div
                key={attack.id}
                className="relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/10 bg-secondary/20 p-4 text-center opacity-50 sm:gap-3 sm:p-5"
                style={{ minHeight: 44 }}
                aria-label={`${attack.label} — in arrivo`}
              >
                {/* Badge in alto a destra */}
                <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border border-white/10 bg-slate-800/90 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  <Clock className="h-2.5 w-2.5" strokeWidth={2} aria-hidden="true" />
                  In arrivo
                </span>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-muted-foreground sm:h-12 sm:w-12">
                  <Icon
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <span className="block text-sm font-semibold leading-tight text-foreground/60 sm:text-base">
                    {attack.label}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground/60">
                    {attack.description}
                  </span>
                </div>
              </div>
            );
          }

          const selectableIdx = selectableTypes.findIndex((a) => a.id === attack.id);

          return (
            <m.button
              key={attack.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected || (!selected && selectableIdx === 0) ? 0 : -1}
              onClick={() => onSelect(attack.id)}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4 text-center transition-colors sm:gap-3 sm:p-5 ${
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
                <span className="mt-1 block text-sm text-muted-foreground">
                  {attack.description}
                </span>
              </div>
            </m.button>
          );
        })}
      </div>
    </section>
  );
}
