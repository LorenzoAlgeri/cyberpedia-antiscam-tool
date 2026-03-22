/**
 * useVirtualKeyboard — handles mobile virtual keyboard resizing.
 *
 * Problem: iOS Safari scrolls the entire page up when the keyboard opens,
 * pushing the chat header off-screen. The layout viewport doesn't resize.
 *
 * Solution: Listen to visualViewport resize/scroll events and:
 * 1. Set --app-height to the visible height (excluding keyboard)
 * 2. Scroll window back to top to counteract iOS scroll behavior
 * 3. Position the chat container using the visual viewport offset
 *
 * Works on both iOS Safari and Android Chrome.
 */

import { useEffect } from 'react';

export function useVirtualKeyboard(): void {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    function update() {
      if (!window.visualViewport) return;

      const height = window.visualViewport.height;
      const offsetTop = window.visualViewport.offsetTop;

      // Set the visible height (excludes keyboard)
      document.documentElement.style.setProperty('--app-height', `${height}px`);

      // Counteract iOS Safari scrolling the page up when keyboard opens:
      // Translate the app container down by the offset amount so it stays
      // visually in the same position
      document.documentElement.style.setProperty('--app-offset', `${offsetTop}px`);

      // Force scroll back to top — iOS scrolls the page to show the input,
      // but we want the container to handle its own scrolling
      if (offsetTop > 0) {
        window.scrollTo(0, 0);
      }
    }

    update();

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);

    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      document.documentElement.style.removeProperty('--app-height');
      document.documentElement.style.removeProperty('--app-offset');
    };
  }, []);
}
