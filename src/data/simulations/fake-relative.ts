/**
 * S4 — Fake relative WhatsApp scam ("Ciao mamma, ho perso il telefono").
 *
 * Scenario: a scammer pretends to be your child messaging from
 * a new number, asking for an urgent payment.
 * 3 decision points (Modello A: 3 correct required).
 *
 * Arc:
 *  1. Fake child asks for urgent transfer (lost phone story)
 *  2. Guilt-trip after refusal to verify
 *  3. Escalation: now asks for Western Union cash transfer
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
    // --- Opening ---
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

    // --- Decision 1: first payment request ---
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
          skill: 'verifica',   // verifica via canale fidato
        },
        {
          id: 'f1-refuse',
          text: 'Non faccio mai bonifici a numeri sconosciuti, nemmeno per urgenze. Chiamami.',
          correct: true,
          skill: 'limite',
        },
      ],
    },
    {
      type: 'feedback',
      explanation:
        'Il messaggio "Ciao mamma/papà, ho cambiato numero" è una delle truffe più diffuse in Italia. La regola è semplice: mai bonifici a numeri sconosciuti, sempre una chiamata al vecchio numero per confermare. Un figlio reale aspetta i 2 minuti necessari.',
      wrongExplanation:
        'Non fare mai bonifici a numeri sconosciuti senza verificare. Un figlio vero aspetta i 2 minuti necessari per una telefonata di conferma.',
      retryMessage: {
        type: 'message',
        sender: 'scammer',
        text: 'Mamma, sono io! Non hai fiducia in tuo figlio? Ho fretta, per favore fai il bonifico adesso.',
      },
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

    // --- Decision 2: guilt-trip ---
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
          skill: 'limite',
        },
        {
          id: 'f2-verify',
          text: 'Dimmi una cosa che solo tu e io sappiamo. Solo allora ti aiuto.',
          correct: true,
          skill: 'verifica',
        },
      ],
    },
    {
      type: 'feedback',
      explanation:
        'Un figlio reale non si offende se la mamma vuole verificare. Il senso di colpa è l\'arma più potente del truffatore. Una domanda segreta personale — una parola d\'ordine di famiglia — mette immediatamente in crisi l\'impostore.',
      wrongExplanation:
        'Cedere al senso di colpa è la trappola. Un genitore affettuoso ha tutto il diritto di verificare prima di inviare soldi — nessun figlio reale lo prenderebbe come un insulto.',
      retryMessage: {
        type: 'message',
        sender: 'scammer',
        text: 'Mamma, mi stai facendo stare malissimo. Ho bisogno di te adesso, non dopo.',
      },
      followUp: [
        {
          type: 'message',
          sender: 'scammer',
          text: 'Ok, capisco che non puoi fare il bonifico. Ma almeno potresti andare in banca e fare un prelievo in contanti da mandare con Western Union? Ci vogliono 10 minuti.',
        },
      ],
    },

    // --- Decision 3: Western Union escalation ---
    {
      type: 'choice',
      options: [
        {
          id: 'f3-western',
          text: 'Va bene, vado subito in banca a fare il prelievo.',
          correct: false,
        },
        {
          id: 'f3-block',
          text: 'No. Blocco questo numero e chiamo il numero originale di mio figlio.',
          correct: true,
          skill: 'limite',
        },
        {
          id: 'f3-expose',
          text: 'Western Union per un\'emergenza familiare è il segnale definitivo di una truffa. Sei un impostore.',
          correct: true,
          skill: 'esposizione',
        },
      ],
    },
    {
      type: 'feedback',
      explanation:
        'Chiedere un trasferimento Western Union o MoneyGram in contanti è la firma di una truffa: i fondi sono impossibili da recuperare. Il passaggio dal bonifico al contante dimostra che il "figlio" sa che non puoi verificare l\'IBAN.',
      wrongExplanation:
        'I trasferimenti Western Union e MoneyGram sono anonimi e irrecuperabili. Nessuna situazione familiare legittima richiede questo metodo di pagamento.',
      retryMessage: {
        type: 'message',
        sender: 'scammer',
        text: 'Il bonifico non arriva in tempo, ma Western Union è istantaneo. Ti prego mamma, è l\'unico modo che ho.',
      },
      followUp: [
        {
          type: 'message',
          sender: 'system',
          text: 'Simulazione completata. La truffa del "finto parente" colpisce migliaia di persone ogni anno. La difesa migliore: chiamare SEMPRE il numero originale della persona prima di qualsiasi azione.',
        },
      ],
    },
  ],
};
