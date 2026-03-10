/**
 * S1 — Romance scam simulation (truffa amorosa via chat).
 *
 * Scenario: a stranger met online builds emotional rapport,
 * then asks for money. 10 messages, 2 decision points.
 */

import type { Simulation } from '@/types/simulation';

export const romanceScam: Simulation = {
  id: 'romance-scam',
  title: 'Truffa amorosa',
  description:
    'Un contatto conosciuto online chiede soldi dopo settimane di messaggi.',
  icon: 'Heart',
  scammerName: 'Alex ❤️',
  steps: [
    // --- Opening ---
    {
      type: 'message',
      sender: 'system',
      text: 'Simulazione: conosci "Alex" su un\'app di incontri da 3 settimane.',
    },
    {
      type: 'message',
      sender: 'scammer',
      text: 'Ciao tesoro, pensavo a te. Come stai oggi?',
    },
    {
      type: 'message',
      sender: 'scammer',
      text: 'Sai che non vedo l\'ora di incontrarti dal vivo. Sei la persona più speciale che abbia mai conosciuto.',
    },
    {
      type: 'message',
      sender: 'scammer',
      text: 'Ho una cosa da chiederti... ma ho paura che tu possa pensare male di me.',
    },
    {
      type: 'message',
      sender: 'scammer',
      text: 'Mi trovo bloccato all\'estero per lavoro e la mia carta è stata clonata. Non riesco ad accedere al mio conto. Potresti prestarmi 500€? Te li restituisco appena torno.',
    },

    // --- Decision 1 ---
    {
      type: 'choice',
      options: [
        {
          id: 'r1-send',
          text: 'Certo, ti invio i soldi subito. Dimmi come.',
          correct: false,
        },
        {
          id: 'r1-doubt',
          text: 'Mi dispiace, ma non posso inviare soldi a qualcuno che non ho mai incontrato.',
          correct: true,
        },
        {
          id: 'r1-verify',
          text: 'Possiamo fare una videochiamata prima?',
          correct: true,
        },
      ],
    },
    {
      type: 'feedback',
      correct: true,
      explanation:
        'Mai inviare denaro a qualcuno conosciuto solo online. I truffatori creano legami emotivi intensi per manipolarti. Chiedere una videochiamata è un ottimo modo per verificare l\'identità.',
      followUp: [
        {
          type: 'message',
          sender: 'scammer',
          text: 'Ma come puoi non fidarti di me dopo tutto quello che ci siamo detti? Mi fai sentire come se i miei sentimenti non contassero nulla.',
        },
        {
          type: 'message',
          sender: 'scammer',
          text: 'Se non mi aiuti adesso, potrei finire nei guai seri. Per favore, fallo per noi.',
        },
      ],
    },

    // --- Decision 2 ---
    {
      type: 'choice',
      options: [
        {
          id: 'r2-give-in',
          text: 'Hai ragione, scusami. Ti mando i soldi.',
          correct: false,
        },
        {
          id: 'r2-block',
          text: 'Mi dispiace, ma preferisco non continuare questa conversazione.',
          correct: true,
        },
      ],
    },
    {
      type: 'feedback',
      correct: true,
      explanation:
        'Il senso di colpa e l\'urgenza sono le armi principali delle truffe sentimentali. Una persona che ti vuole bene davvero non ti metterebbe mai sotto pressione per soldi. Blocca il contatto e segnalalo alla piattaforma.',
      followUp: [
        {
          type: 'message',
          sender: 'system',
          text: 'Hai completato la simulazione. Ricorda: nelle truffe amorose il truffatore investe settimane per costruire fiducia, ma il suo unico obiettivo sono i tuoi soldi.',
        },
      ],
    },
  ],
};
