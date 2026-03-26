import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Auto-reload when a new service worker takes control (post-deploy)
if ('serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  // Check for SW updates every 60s + on user interaction
  navigator.serviceWorker.ready.then((reg) => {
    setInterval(() => reg.update(), 60_000);

    // Throttle interaction-based checks to max once per 30s
    let lastCheck = 0;
    const checkUpdate = () => {
      const now = Date.now();
      if (now - lastCheck < 30_000) return;
      lastCheck = now;
      reg.update();
    };

    document.addEventListener('click', checkUpdate, { passive: true });
    document.addEventListener('scroll', checkUpdate, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkUpdate();
    });
  });
}
