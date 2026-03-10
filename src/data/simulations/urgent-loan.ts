/**
 * S2 — Urgent loan scam (richiesta prestito urgente da conoscente).
 *
 * Scenario: someone impersonating a friend/acquaintance contacts
 * you asking for an emergency loan via a messaging app.
 * 10 messages, 2 decision points.
 */

import type { Simulation } from '@/types/simulation';

export const urgentLoan: Simulation = {
  id: 'urgent-loan',
  title: 'Prestito urgente',
  description:
    'Un "amico" ti scrive chiedendo soldi con estrema urgenza.',
  icon: 'Wallet',
  scammerName: 'Marco (amico)',
  steps: [
    {
      type: 'message',
      sender: 'system',
      text: 'Simulazione: ricevi un messaggio da un numero sconosciuto che dice di essere un tuo amico.',
    },
    {
      type: 'message',
      sender: 'scammer',
      text: 'Ciao! Sono Marco, ho cambiato numero. Salva questo nuovo contatto!',
    },
    {
      type: 'message',
      sender: 'scammer',
      text: 'Senti, mi trovo in una situazione assurda. Mi si è rotta la macchina in autostrada e il meccanico vuole 800€ in contanti.',
    },
    {
      type: 'message',
      sender: 'scammer',
      text: 'Ho il bancomat bloccato e non riesco a prelevare. Puoi farmi un bonifico istantaneo? Ti ridò tutto domani, giuro.',
    },

    // --- Decision 1 ---
    {
      type: 'choice',
      options: [
        {
          id: 'l1-send',
          text: 'Ok Marco, ti mando subito i soldi. Mandami l\'IBAN.',
          correct: false,
        },
        {
          id: 'l1-call',
          text: 'Ti chiamo al tuo vecchio numero per verificare.',
          correct: true,
        },
        {
          id: 'l1-question',
          text: 'Se sei davvero Marco, dimmi dove ci siamo conosciuti.',
          correct: true,
        },
      ],
    },
    {
      type: 'feedback',
      correct: true,
      explanation:
        'Prima di inviare soldi, verifica SEMPRE l\'identità della persona chiamandola al numero che già conosci. I truffatori usano l\'urgenza per impedirti di riflettere. Una domanda personale può smascherarli.',
      followUp: [
        {
          type: 'message',
          sender: 'scammer',
          text: 'Dai, non ho tempo per queste cose! Sono in mezzo all\'autostrada, piove e il carro attrezzi sta arrivando. Mi servono ORA.',
        },
        {
          type: 'message',
          sender: 'scammer',
          text: 'Se non mi aiuti tu, non so a chi altro chiedere. Per favore, sei l\'unico che può aiutarmi.',
        },
      ],
    },

    // --- Decision 2 ---
    {
      type: 'choice',
      options: [
        {
          id: 'l2-rush',
          text: 'Va bene, ti mando i soldi. Non voglio lasciarti in difficoltà.',
          correct: false,
        },
        {
          id: 'l2-firm',
          text: 'Ti richiamo al vecchio numero. Se non rispondi, non posso aiutarti.',
          correct: true,
        },
      ],
    },
    {
      type: 'feedback',
      correct: true,
      explanation:
        'L\'urgenza estrema è il segnale più forte di truffa. Un vero amico capirebbe se hai bisogno di 2 minuti per verificare. Se il "vecchio numero" funziona ancora, è quasi certamente un impostore.',
      followUp: [
        {
          type: 'message',
          sender: 'system',
          text: 'Hai completato la simulazione. Regola d\'oro: se qualcuno ti chiede soldi con urgenza, prenditi sempre il tempo di verificare per un\'altra via (chiamata, di persona).',
        },
      ],
    },
  ],
};
