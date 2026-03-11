/**
 * S3 — Fake bank operator scam (finto operatore bancario).
 *
 * Scenario: a caller/messager claims to be from your bank's
 * security team. They pressure you into sharing credentials
 * or moving money to a "safe" account.
 * 3 decision points (Modello A: 3 correct required).
 *
 * Arc:
 *  1. Operator asks for account code to "verify identity"
 *  2. Asks you to transfer savings to a "safe" temporary account
 *  3. Final pressure: threatens you'll lose everything
 */

import type { Simulation } from '@/types/simulation';

export const fakeBankOperator: Simulation = {
  id: 'fake-bank-operator',
  title: 'Finto operatore bancario',
  description:
    'Qualcuno dice di essere della tua banca e ti chiede dati sensibili.',
  icon: 'Building2',
  scammerName: 'Supporto Banca',
  steps: [
    // --- Opening ---
    {
      type: 'message',
      sender: 'system',
      text: 'Simulazione: ricevi una chiamata. Il numero sembra quello della tua banca (spoofing).',
    },
    {
      type: 'message',
      sender: 'scammer',
      text: 'Buongiorno, sono il Dott. Bianchi dell\'Ufficio Sicurezza della sua banca. La chiamo perché abbiamo rilevato un accesso sospetto al suo conto.',
    },
    {
      type: 'message',
      sender: 'scammer',
      text: 'Per bloccare immediatamente la transazione fraudolenta, ho bisogno di verificare la sua identità. Può confermarmi il suo codice cliente?',
    },

    // --- Decision 1: credential request ---
    {
      type: 'choice',
      options: [
        {
          id: 'b1-give',
          text: 'Sì certo, il mio codice cliente è...',
          correct: false,
        },
        {
          id: 'b1-refuse',
          text: 'La mia banca mi ha detto di non dare mai codici al telefono.',
          correct: true,
        },
        {
          id: 'b1-callback',
          text: 'Preferisco riattaccare e chiamare io il numero ufficiale.',
          correct: true,
        },
      ],
    },
    {
      type: 'feedback',
      explanation:
        'La tua banca ha GIÀ i tuoi dati e non te li chiederà mai al telefono. Se ricevi una chiamata sospetta, riattacca e chiama tu il numero antifrode ufficiale stampato sulla carta.',
      wrongExplanation:
        'Non fornire mai codici, PIN o password al telefono. La tua banca non ha bisogno di chiederteli: li possiede già.',
      retryMessage: {
        type: 'message',
        sender: 'scammer',
        text: 'Capisco la sua prudenza, ma se non verifichiamo ora non possiamo bloccare l\'operazione sospetta. È una questione di secondi.',
      },
      followUp: [
        {
          type: 'message',
          sender: 'scammer',
          text: 'Capisco la sua prudenza, ma ogni minuto che passa i truffatori stanno svuotando il suo conto! Abbiamo già bloccato 2.000€, ma ci sono altre operazioni in corso.',
        },
        {
          type: 'message',
          sender: 'scammer',
          text: 'Per mettere in sicurezza i suoi risparmi, deve trasferirli su un conto temporaneo protetto. Le invio l\'IBAN adesso.',
        },
      ],
    },

    // --- Decision 2: "safe account" transfer ---
    {
      type: 'choice',
      options: [
        {
          id: 'b2-transfer',
          text: 'Ok, mi dica l\'IBAN. Faccio subito il trasferimento.',
          correct: false,
        },
        {
          id: 'b2-hang-up',
          text: 'No. Chiudo la chiamata e contatto la banca dal numero ufficiale.',
          correct: true,
        },
      ],
    },
    {
      type: 'feedback',
      explanation:
        'NON ESISTE un "conto di sicurezza temporaneo". Nessuna banca chiede ai clienti di spostare fondi per proteggerli. È SEMPRE una truffa. L\'urgenza serve a impedirti di ragionare.',
      wrongExplanation:
        'Le banche non chiedono mai ai clienti di spostare soldi su altri conti per proteggerli. Qualsiasi IBAN fornito in questo contesto appartiene al truffatore.',
      retryMessage: {
        type: 'message',
        sender: 'scammer',
        text: 'La capisco, ma il conto di sicurezza è una procedura ufficiale della banca. Le garantisco che è tutto regolare.',
      },
      followUp: [
        {
          type: 'message',
          sender: 'scammer',
          text: 'Se non agisce ora, non possiamo più intervenire e lei perderà tutto. È sicuro di voler rischiare?',
        },
      ],
    },

    // --- Decision 3: final pressure ---
    {
      type: 'choice',
      options: [
        {
          id: 'b3-panic',
          text: 'Aspetti... forse dovrei fare il trasferimento per sicurezza.',
          correct: false,
        },
        {
          id: 'b3-firm',
          text: 'Ho detto no. Chiudo e chiamo la mia banca. Arrivederci.',
          correct: true,
        },
      ],
    },
    {
      type: 'feedback',
      explanation:
        'Perfetto. La risposta giusta è SEMPRE riattaccare e chiamare la banca al numero ufficiale. Nessun operatore legittimo ti rimprovererà per aver verificato.',
      wrongExplanation:
        'La minaccia di perdere tutto è una tecnica di panico progettata per farti agire senza pensare. Rallenta: una banca vera non ti abbandona se prendi 5 minuti.',
      retryMessage: {
        type: 'message',
        sender: 'scammer',
        text: 'Sta commettendo un errore gravissimo! Non saremo in grado di recuperare i suoi fondi se non agisce subito.',
      },
      followUp: [
        {
          type: 'message',
          sender: 'system',
          text: 'Simulazione completata. La tua banca non ti chiamerà mai per chiederti password, PIN o di spostare soldi. In caso di dubbio: riattacca, aspetta qualche minuto, poi chiama tu il numero antifrode ufficiale.',
        },
      ],
    },
  ],
};
