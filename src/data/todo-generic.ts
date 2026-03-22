/**
 * Generic anti-scam to-do list — 4 life-saving actions.
 *
 * These are the core actions that must always be present in Step 2.
 */

import type { TodoItem } from '@/types/todo';

export const GENERIC_TODOS: readonly TodoItem[] = [
  {
    id: 'gen-01',
    text: 'Non inviare denaro/codici/documenti',
    priority: 1,
    scope: 'prevention',
  },
  {
    id: 'gen-02',
    text: 'Aspetta 24 ore prima di agire, prendi tempo',
    priority: 2,
    scope: 'prevention',
  },
  {
    id: 'gen-05',
    text: 'Contatta la banca dai numeri ufficiali',
    priority: 3,
    scope: 'verify',
    severe: true,
  },
  {
    id: 'gen-04',
    text: 'Cambia le password e attiva l\'autenticazione a due fattori (2FA)',
    priority: 4,
    scope: 'repair',
    severe: true,
    hint: 'L\'autenticazione a due fattori (2FA) aggiunge un codice extra oltre alla password, così nessuno può entrare nel tuo account anche se conosce la password. Per attivarla, cerca nelle impostazioni del tuo account sotto "Sicurezza" o "Accesso". Ogni servizio la chiama in modo diverso: "Autenticazione a due fattori", "Verifica in due passaggi" o "Accesso con codice".',
  },
];
