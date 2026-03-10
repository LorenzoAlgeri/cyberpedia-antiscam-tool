/**
 * Generic anti-scam to-do list — 10 prioritised items.
 *
 * Sources: Polizia Postale, ENISA, FBI IC3, Europol.
 * Applicable regardless of scam type.
 */

import type { TodoItem } from '@/types/todo';

export const GENERIC_TODOS: readonly TodoItem[] = [
  {
    id: 'gen-01',
    text: 'NON inviare denaro, codici o documenti a nessuno',
    priority: 1,
  },
  {
    id: 'gen-02',
    text: 'Blocca subito la carta o il conto se hai condiviso dati bancari',
    priority: 2,
  },
  {
    id: 'gen-03',
    text: 'Cambia le password degli account compromessi',
    priority: 3,
  },
  {
    id: 'gen-04',
    text: 'NON cliccare su link ricevuti via SMS, email o chat',
    priority: 4,
  },
  {
    id: 'gen-05',
    text: 'Chiama la tua banca al numero antifrode ufficiale',
    priority: 5,
  },
  {
    id: 'gen-06',
    text: 'Parla con una persona di fiducia prima di agire',
    priority: 6,
  },
  {
    id: 'gen-07',
    text: 'Conserva screenshot di messaggi, email e numeri sospetti',
    priority: 7,
  },
  {
    id: 'gen-08',
    text: 'Sporgi denuncia alla Polizia Postale (commissariatodips.it)',
    priority: 8,
  },
  {
    id: 'gen-09',
    text: 'Attiva l\'autenticazione a due fattori (2FA) sui tuoi account',
    priority: 9,
  },
  {
    id: 'gen-10',
    text: 'Monitora i movimenti del conto per 30 giorni',
    priority: 10,
  },
];
