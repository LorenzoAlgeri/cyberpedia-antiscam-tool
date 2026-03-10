import { useEffect, type RefObject } from 'react';

/**
 * Traps keyboard focus inside a container element.
 *
 * Features:
 * - Tab/Shift+Tab cycle within focusable children
 * - Escape key calls onEscape callback
 * - Only active when `active` is true
 *
 * @param containerRef - ref to the DOM element to trap focus within
 * @param active       - whether the trap is active
 * @param onEscape     - callback when Escape key is pressed
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
  onEscape: () => void,
) {
  useEffect(() => {
    if (!active) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onEscape();
        return;
      }

      if (e.key !== 'Tab' || !containerRef.current) return;

      const focusable = containerRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, active, onEscape]);
}
