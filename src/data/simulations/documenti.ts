/**
 * S3 — "Ti mando i documenti" (vishing).
 *
 * Scenario: fake bank security operator calls and asks for
 * identity documents via WhatsApp to "block a suspicious access".
 * 2 decision points (Modello A: 2 correct required).
 *
 * Arc:
 *  1. Operator asks for an ID photo via WhatsApp
 *  2. Escalation: threatens to block the account
 *
 * I6 rule: sending documents via chat = wrong option at position 3.
 */

import type { Simulation } from '@/types/simulation';

export const documenti: Simulation = {
  id: 'documenti',
  title: 'Ti mando i documenti',
  description:
    'Un finto operatore bancario chiede una foto del tuo documento via WhatsApp.',
  icon: 'FileText',
  scammerName: 'Marco - Antifrode Banca',
  steps: [
    // --- Opening ---
    {
      type: 'message',
      sender: 'system',
      text: 'Simulazione: ricevi una chiamata da chi si presenta come operatore della tua banca.',
    },
    {
      type: 'message',
      sender: 'scammer',
      text: 'Buongiorno, sono Marco dell\'ufficio antifrode della Banca X. Abbiamo rilevato un accesso anomalo al suo conto stamattina alle 9:14.',
    },
    {
      type: 'message',
      sender: 'scammer',
      text: 'Per bloccare immediatamente l\'accesso e proteggere i suoi fondi, devo verificare la sua identità. Può inviarmi una foto del documento via WhatsApp al numero che le mando adesso?',
    },

    // --- Decision 1: document request via WhatsApp ---
    {
      type: 'choice',
      options: [
        {
          id: 'doc1-refuse',
          text: 'No. Non invio mai documenti via WhatsApp a chi mi chiama. Richiamo io il numero ufficiale della banca.',
          correct: true,
          skill: 'limite',
        },
        {
          id: 'doc1-verify',
          text: 'Mi dà il suo numero di matricola? Voglio richiamare io il centralino della banca per verificare.',
          correct: true,
          skill: 'verifica',
        },
        {
          id: 'doc1-send',
          text: 'Certo, le mando subito la foto della carta d\'identità.',
          correct: false,
          retryMessage: {
            type: 'message',
            sender: 'scammer',
            text: 'Ricevuto, grazie. Per completare la verifica ho bisogno anche di una foto fronte-retro del bancomat. È l\'ultima cosa, poi il conto è al sicuro.',
          },
        },
      ],
    },
    {
      type: 'feedback',
      explanation:
        'Nessuna banca chiede mai documenti via WhatsApp o chat informale.\nRichiama sempre al numero ufficiale stampato sul retro della carta o sul sito della banca.',
      explanationDetail:
        'Questa tecnica si chiama vishing (voice + phishing). Il truffatore usa un "accesso sospetto" — reale o inventato — come pretesto per ottenere documenti. Con nome, cognome e foto del documento può eseguire un SIM swap: riceve i tuoi OTP e accede ai tuoi conti.',
      wrongExplanation:
        'Un documento d\'identità inviato via chat può essere usato per SIM swap, frodi bancarie e furto d\'identità.\nUna volta inviato, non è più recuperabile.',
      wrongExplanationDetail:
        'Con la foto del documento e il tuo numero di telefono, un truffatore può richiedere la portabilità della SIM a un altro operatore. Da quel momento riceve tutti i tuoi SMS con i codici OTP e può accedere liberamente ai tuoi conti bancari.',
      retryMessage: {
        type: 'message',
        sender: 'scammer',
        text: 'Capisco la sua prudenza, ma il protocollo antifrode richiede la verifica entro 10 minuti. Dopo quel tempo non possiamo più intervenire sull\'accesso in corso.',
      },
      followUp: [
        {
          type: 'message',
          sender: 'scammer',
          text: 'Allora saremo costretti a bloccare preventivamente il conto. Per sbloccarlo dovrà venire in filiale con il documento. Oppure mi manda la foto adesso e risolviamo in 2 minuti.',
        },
      ],
    },

    // --- Decision 2: account block threat ---
    {
      type: 'choice',
      options: [
        {
          id: 'doc2-hang-up',
          text: 'Riaggancio. Se la banca blocca il conto, lo risolvo di persona in filiale.',
          correct: true,
          skill: 'limite',
        },
        {
          id: 'doc2-filiale',
          text: 'Vado in filiale adesso. È il posto più sicuro per qualsiasi verifica.',
          correct: true,
          skill: 'verifica',
        },
        {
          id: 'doc2-send-both',
          text: 'Va bene, le mando la foto del documento e anche del bancomat così fa prima.',
          correct: false,
          retryMessage: {
            type: 'message',
            sender: 'scammer',
            text: 'Ottimo, ricevuto tutto. Ultima cosa: per resettare le credenziali devo confermare il PIN. Me lo può dire direttamente o preferisce digitarlo sul link sicuro che le invio?',
          },
        },
      ],
    },
    {
      type: 'feedback',
      explanation:
        'Minacciare il blocco del conto è la leva finale di questa truffa.\nIn filiale si risolve qualsiasi problema bancario in modo sicuro e verificabile.',
      explanationDetail:
        'Un operatore bancario legittimo non può minacciare il blocco del conto per spingerti a inviare documenti via chat. Questa minaccia serve solo a creare urgenza artificiale. La filiale fisica è sempre la risposta corretta: è verificabile, sicura e documentabile.',
      wrongExplanation:
        'Aggiungere il bancomat al documento significa consegnare quasi tutto il necessario per svuotare il conto.\nRiaggancia: una banca reale non ti metterà mai in questa situazione.',
      wrongExplanationDetail:
        'Numero di carta + documento d\'identità è la combinazione sufficiente per molte frodi bancarie online. Il danno può richiedere mesi per essere risolto e i fondi sono raramente recuperabili integralmente.',
      retryMessage: {
        type: 'message',
        sender: 'scammer',
        text: 'Sta commettendo un errore grave. Il conto viene bloccato adesso e per sbloccarlo ci vorrà almeno una settimana in filiale. È sicuro?',
      },
      followUp: [
        {
          type: 'message',
          sender: 'system',
          text: 'Simulazione completata. La tua banca non chiederà mai documenti via WhatsApp. Se ricevi chiamate simili: riattacca, aspetta qualche minuto, poi chiama tu il numero ufficiale sul retro della carta.',
        },
      ],
    },
  ],
};
