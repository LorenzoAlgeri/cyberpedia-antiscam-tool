/**
 * S4 — Fake relative WhatsApp scam ("Ciao mamma, ho perso il telefono").
 *
 * Scenario: a scammer pretends to be your child messaging from
 * a new number, asking for an urgent payment. 10 messages, 2 decisions.
 */

import type { Simulation } from '@/types/simulation';

export const fakeRelative: Simulation = {
  id: 'fake-relative',
  title: 'Finto parente',
  description:
    '"Ciao mamma, ho perso il telefono" — la truffa WhatsApp più diffusa.',
  icon: 'Users',
  scammerName: 'Figlio/a 💕',
  steps: [
    {
      type: 'message',
      sender: 'system',
      text: 'Simulazione: ricevi un messaggio WhatsApp da un numero sconosciuto.',
    },
    {
      type: 'message',
      sender: 'scammer',
      text: 'Ciao mamma! Ho perso il telefono e questo è il mio nuovo numero. Salvalo! 😊',
    },
    {
      type: 'message',
      sender: 'scammer',
      text: 'Non riesco ad entrare nell\'app della banca perché era collegata al vecchio telefono. Devo pagare una cosa urgentissima.',
    },
    {
      type: 'message',
      sender: 'scammer',
      text: 'Puoi farmi un bonifico di 1.200€? Ti mando l\'IBAN. Domani ti spiego meglio, ora sono di fretta!',
    },

    // --- Decision 1 ---
    {
      type: 'choice',
      options: [
        {
          id: 'f1-pay',
          text: 'Certo tesoro, mandami l\'IBAN che faccio subito.',
          correct: false,
        },
        {
          id: 'f1-call',
          text: 'Ti chiamo al vecchio numero per sicurezza.',
          correct: true,
        },
        {
          id: 'f1-question',
          text: 'Come si chiama il nostro cane? Rispondimi a voce.',
          correct: true,
        },
      ],
    },
    {
      type: 'feedback',
      correct: true,
      explanation:
        'Il messaggio "Ciao mamma/papà, ho cambiato numero" è una delle truffe più diffuse in Italia. Prima di fare qualsiasi cosa, chiama SEMPRE il vecchio numero o fai una domanda personale che solo il vero familiare conosce.',
      followUp: [
        {
          type: 'message',
          sender: 'scammer',
          text: 'Mamma non posso parlare al telefono adesso, sono dal tecnico e c\'è casino. Ti prego, è urgente, devo pagare entro un\'ora sennò perdo tutto!',
        },
        {
          type: 'message',
          sender: 'scammer',
          text: 'Fidati di me, sono davvero io. Perché mi fai tutte queste domande? Non ti fidi di tuo figlio?',
        },
      ],
    },

    // --- Decision 2 ---
    {
      type: 'choice',
      options: [
        {
          id: 'f2-give-in',
          text: 'Hai ragione, scusami. Faccio il bonifico.',
          correct: false,
        },
        {
          id: 'f2-firm',
          text: 'Se sei davvero mio figlio/a, puoi aspettare che ti chiami. A dopo.',
          correct: true,
        },
      ],
    },
    {
      type: 'feedback',
      correct: true,
      explanation:
        'Un figlio vero non si offenderebbe se la mamma vuole verificare. Il senso di colpa è l\'arma più potente del truffatore. Se non può rispondere al telefono né a domande personali, è un impostore.',
      followUp: [
        {
          type: 'message',
          sender: 'system',
          text: 'Hai completato la simulazione. La truffa del "finto parente" colpisce migliaia di persone ogni anno. La difesa migliore: chiamare SEMPRE il numero originale della persona.',
        },
      ],
    },
  ],
};
