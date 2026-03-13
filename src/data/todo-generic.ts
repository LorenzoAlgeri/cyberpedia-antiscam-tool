/**
 * Generic anti-scam to-do list — 5 life-saving actions.
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
    text: 'Metti pausa di 24 ore (o "prendi tempo")',
    priority: 2,
    scope: 'prevention',
  },
  {
    id: 'gen-03',
    text: 'Verifica con un terzo (contatto fiducia)',
    priority: 3,
    scope: 'both',
  },
  {
    id: 'gen-04',
    text: 'Cambia password/2FA se hai condiviso dati',
    priority: 4,
    scope: 'repair',
    severe: true,
  },
  {
    id: 'gen-05',
    text: 'Contatta banca se c\'è transazione o dati bancari',
    priority: 5,
    scope: 'repair',
    severe: true,
  },
];
