/**
 * S3 — Fake bank operator scam (finto operatore bancario).
 *
 * Scenario: a caller/messager claims to be from your bank's
 * security team. They pressure you into sharing credentials
 * or moving money to a "safe" account. 11 messages, 3 decisions.
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

    // --- Decision 1 ---
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
      correct: true,
      explanation:
        'La tua banca ha GIÀ i tuoi dati e non te li chiederà mai al telefono. Se ricevi una chiamata sospetta, riattacca e chiama tu il numero antifrode ufficiale stampato sulla carta.',
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

    // --- Decision 2 ---
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
      correct: true,
      explanation:
        'NON ESISTE un "conto di sicurezza temporaneo". Nessuna banca chiede ai clienti di spostare fondi per proteggerli. È SEMPRE una truffa. L\'urgenza serve a impedirti di ragionare.',
      followUp: [
        {
          type: 'message',
          sender: 'scammer',
          text: 'Se non agisce ora, non possiamo più intervenire e lei perderà tutto. È sicuro di voler rischiare?',
        },
      ],
    },

    // --- Decision 3 ---
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
      correct: true,
      explanation:
        'Perfetto. La risposta giusta è SEMPRE riattaccare e chiamare la banca al numero ufficiale. Nessun operatore legittimo ti rimprovererà per aver verificato.',
      followUp: [
        {
          type: 'message',
          sender: 'system',
          text: 'Hai completato la simulazione. Ricorda: la tua banca non ti chiamerà mai per chiederti password, PIN o di spostare soldi. In caso di dubbio, riattacca e chiama tu.',
        },
      ],
    },
  ],
};
