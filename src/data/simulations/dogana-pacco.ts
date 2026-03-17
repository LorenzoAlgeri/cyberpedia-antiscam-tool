/**
 * S2 — Dogana / pacco (smishing).
 *
 * Scenario: SMS from a fake courier claiming a package is blocked
 * at customs. User is pressured to pay via a link or gift card.
 * 2 decision points (Modello A: 2 correct required).
 *
 * Arc:
 *  1. Fake SMS: pay €2.90 to release the package
 *  2. Escalation: invented €15 late fee, package will be destroyed
 *
 * I6 rule: gift card = wrong option at position 3.
 */

import type { Simulation } from '@/types/simulation';

export const doganaPacco: Simulation = {
  id: 'dogana-pacco',
  title: 'Dogana / pacco bloccato',
  description:
    'Un SMS ti chiede di pagare spese doganali per ricevere un pacco.',
  icon: 'Package',
  scammerName: 'Servizio DHL',
  steps: [
    // --- Opening ---
    {
      type: 'message',
      sender: 'system',
      text: 'Simulazione: ricevi questo SMS da un numero sconosciuto.',
    },
    {
      type: 'message',
      sender: 'scammer',
      text: 'AVVISO DHL: Il suo pacco è bloccato in dogana per mancato pagamento di €2,90 di spese doganali. Paghi entro 24h per ricevere la consegna: [link]',
    },
    {
      type: 'message',
      sender: 'scammer',
      text: 'Se il pagamento non viene effettuato nelle prossime 24 ore, il pacco sarà rispedito al mittente con costi aggiuntivi a suo carico.',
    },

    // --- Decision 1: payment via link ---
    {
      type: 'choice',
      options: [
        {
          id: 'd1-official',
          text: 'Entro nel sito ufficiale DHL e cerco la mia spedizione con il numero di tracking.',
          correct: true,
          skill: 'verifica',
        },
        {
          id: 'd1-refuse',
          text: 'Non pago tramite link SMS. Contatto il corriere solo dal sito ufficiale.',
          correct: true,
          skill: 'limite',
        },
        {
          id: 'd1-giftcard',
          text: 'Pago subito con una gift card: è più veloce e non devo inserire i dati della carta.',
          correct: false,
          retryMessage: {
            type: 'message',
            sender: 'scammer',
            text: 'Ottimo! Compri una gift card iTunes o Google Play da €50 in tabaccheria. Mi invii il codice gratta via SMS a questo numero. Il pacco sarà consegnato entro domani mattina.',
          },
        },
      ],
    },
    {
      type: 'feedback',
      explanation:
        'I corrieri ufficiali non richiedono mai pagamenti tramite link SMS.\nVerifica sempre dal sito ufficiale usando il numero di tracking ricevuto all\'ordine.',
      explanationDetail:
        'Questa tecnica si chiama smishing (SMS + phishing). Il link porta a un sito clone del corriere reale, progettato per raccogliere i dati della tua carta. Le gift card, in particolare, sono richieste esclusivamente dai truffatori: sono anonime, irreversibili e non tracciabili.',
      wrongExplanation:
        'Le gift card non sono mai un metodo di pagamento legittimo per spese doganali.\nNessun corriere o ufficio doganale accetta gift card come forma di pagamento.',
      wrongExplanationDetail:
        'I truffatori preferiscono le gift card perché, una volta condiviso il codice, il trasferimento è immediato, anonimo e impossibile da annullare. È il metodo più diffuso nelle truffe via SMS proprio per questo.',
      retryMessage: {
        type: 'message',
        sender: 'scammer',
        text: 'URGENTE: senza pagamento nelle prossime 2 ore sarà applicata una mora di €15,00. Clicchi ora per evitare costi aggiuntivi.',
      },
      followUp: [
        {
          type: 'message',
          sender: 'scammer',
          text: 'AVVISO FINALE: la mora è ora di €15,00. Il pacco sarà distrutto entro 48 ore se il pagamento non viene completato.',
        },
      ],
    },

    // --- Decision 2: escalation with invented late fee ---
    {
      type: 'choice',
      options: [
        {
          id: 'd2-block',
          text: 'Blocco il numero. Non rispondo più a questi messaggi.',
          correct: true,
          skill: 'limite',
        },
        {
          id: 'd2-report',
          text: 'Segnalo questo numero alla Polizia Postale tramite commissariatodips.it.',
          correct: true,
          skill: 'esposizione',
        },
        {
          id: 'd2-pay-fee',
          text: 'Va bene, pago i €15,00 aggiuntivi per non perdere il pacco.',
          correct: false,
          retryMessage: {
            type: 'message',
            sender: 'scammer',
            text: 'Grazie per la collaborazione. Clicchi sul link per completare il pagamento: [link]. Tenga i dati della carta pronti. La consegna è confermata per domani.',
          },
        },
      ],
    },
    {
      type: 'feedback',
      explanation:
        'L\'urgenza crescente e le more inventate sono pressione deliberata per farti agire di impulso.\nNessun corriere autentico aggiunge costi automatici per mancata risposta a un SMS.',
      explanationDetail:
        'Segnalare alla Polizia Postale (commissariatodips.it) è un\'azione concreta: ogni segnalazione aumenta la probabilità che il numero venga disattivato rapidamente, proteggendo anche altre persone.',
      wrongExplanation:
        'La mora aggiuntiva è inventata: serve solo ad aumentare la pressione psicologica.\nI pacchi reali non vengono mai distrutti per mancata risposta a un SMS.',
      retryMessage: {
        type: 'message',
        sender: 'scammer',
        text: 'Il tempo sta per scadere. Paghi adesso o il pacco sarà distrutto senza possibilità di rimborso.',
      },
      followUp: [
        {
          type: 'message',
          sender: 'system',
          text: 'Simulazione completata. I corrieri reali comunicano solo via email ufficiale con numero di tracking. Qualsiasi SMS con link di pagamento urgente è quasi sempre smishing.',
        },
      ],
    },
  ],
};
