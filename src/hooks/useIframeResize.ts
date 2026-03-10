import { useEffect } from 'react';

/**
 * Allowed parent origins for postMessage communication.
 * Only these domains can receive height updates from the SPA.
 */
const ALLOWED_ORIGINS = [
  'https://cyberpedia.it',
  'https://www.cyberpedia.it',
] as const;

/**
 * Sends the current document height to the parent window via postMessage.
 *
 * When the SPA is embedded in an iframe on cyberpedia.it,
 * the parent page needs to know the content height to resize
 * the iframe dynamically — preventing scrollbars inside the frame.
 *
 * Uses ResizeObserver on <body> for efficient, debounce-free
 * height tracking that fires only when the DOM actually changes.
 *
 * Security: messages are sent only to ALLOWED_ORIGINS.
 * If not in an iframe (window.parent === window), does nothing.
 */
export function useIframeResize() {
  useEffect(() => {
    // Not in an iframe — skip entirely
    if (window.parent === window) return;

    /** Send height message to all allowed parent origins */
    function sendHeight() {
      const height = document.documentElement.scrollHeight;
      const message = {
        type: 'antiscam-resize',
        height,
      };

      for (const origin of ALLOWED_ORIGINS) {
        window.parent.postMessage(message, origin);
      }
    }

    // Send initial height after first paint
    sendHeight();

    // Observe body size changes (content load, route change, expand/collapse)
    const observer = new ResizeObserver(() => {
      sendHeight();
    });

    observer.observe(document.body);

    // Also send on hash change (step transitions may alter height)
    window.addEventListener('hashchange', sendHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('hashchange', sendHeight);
    };
  }, []);
}
