/**
 * useVirtualKeyboard — handles iOS Safari virtual keyboard resizing.
 *
 * iOS Safari does NOT resize the layout viewport when the keyboard opens.
 * This hook listens to visualViewport.resize events and sets a CSS custom
 * property (--app-height) to the actual visible height, so the chat
 * container can adapt.
 *
 * On Android/Chrome with interactive-widget=resizes-content, dvh works
 * natively. This hook is a fallback for iOS Safari.
 */

import { useEffect } from 'react';

export function useVirtualKeyboard(): void {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    function updateHeight() {
      // visualViewport.height gives the actual visible area
      // excluding the virtual keyboard
      const height = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty('--app-height', `${height}px`);
    }

    // Set initial value
    updateHeight();

    vv.addEventListener('resize', updateHeight);
    vv.addEventListener('scroll', updateHeight);

    return () => {
      vv.removeEventListener('resize', updateHeight);
      vv.removeEventListener('scroll', updateHeight);
    };
  }, []);
}
