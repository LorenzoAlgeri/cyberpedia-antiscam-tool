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

  // Check for SW updates every 60s (catches deploys without navigation)
  navigator.serviceWorker.ready.then((reg) => {
    setInterval(() => reg.update(), 60_000);
  });
}
