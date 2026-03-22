/**
 * useVirtualKeyboard — handles mobile virtual keyboard resizing.
 *
 * Problem: iOS Safari scrolls the page and doesn't resize the layout
 * when the keyboard opens. The input gets hidden behind the keyboard.
 *
 * Solution:
 * 1. Listen to visualViewport resize events
 * 2. Set --app-height to visible height
 * 3. Scroll window back to top to counteract iOS scroll
 * 4. After keyboard opens, scroll the input into view
 *
 * Works on both iOS Safari and Android Chrome.
 */

import { useEffect } from 'react';

export function useVirtualKeyboard(): void {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    let prevHeight = vv.height;

    function update() {
      if (!window.visualViewport) return;

      const height = window.visualViewport.height;

      // Set the visible height (excludes keyboard)
      document.documentElement.style.setProperty('--app-height', `${height}px`);

      // Detect keyboard opening (height decreased significantly)
      const keyboardOpened = prevHeight - height > 100;

      if (keyboardOpened) {
        // Counteract iOS Safari scrolling the page up
        requestAnimationFrame(() => {
          window.scrollTo(0, 0);

          // Scroll the focused input into view within the chat container
          const focused = document.activeElement;
          if (focused && (focused.tagName === 'TEXTAREA' || focused.tagName === 'INPUT')) {
            // Small delay to let iOS finish animation
            setTimeout(() => {
              focused.scrollIntoView({ block: 'end', behavior: 'smooth' });
            }, 100);
          }
        });
      }

      prevHeight = height;
    }

    update();

    vv.addEventListener('resize', update);

    return () => {
      vv.removeEventListener('resize', update);
      document.documentElement.style.removeProperty('--app-height');
    };
  }, []);
}
