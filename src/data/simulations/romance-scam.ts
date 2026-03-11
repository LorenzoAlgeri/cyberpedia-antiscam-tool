/**
 * S1 — Romance scam simulation (truffa amorosa via chat).
 *
 * Scenario: a stranger met online builds emotional rapport,
 * then asks for money. 3 decision points (Modello A: 3 correct required).
 *
 * Arc:
 *  1. Alex asks for €500 (classic wire abroad story)
 *  2. Alex guilt-trips after refusal
 *  3. Alex escalates with new crisis (sick child) to test compassion
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

    // --- Decision 1: first money request ---
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
        {
          id: 'r1-half',
          text: 'Non posso darti 500€, ma forse riesco a mandarti qualcosa di meno.',
          correct: false,
        },
      ],
    },
    {
      type: 'feedback',
      explanation:
        'Giusto. Mai inviare denaro a qualcuno conosciuto solo online, nemmeno una cifra piccola. I truffatori creano legami emotivi intensi per manipolarti. Chiedere una videochiamata è un ottimo modo per smascherarli.',
      wrongExplanation:
        'Inviare soldi — anche una cifra minore — a qualcuno mai incontrato di persona è sempre una trappola.',
      retryMessage: {
        type: 'message',
        sender: 'scammer',
        text: 'Ma dai, è solo un prestito temporaneo... non ti chiedo un favore così grande. Fidati di me.',
      },
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

    // --- Decision 2: guilt-trip pressure ---
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
        {
          id: 'r2-maybe',
          text: 'Fammi pensare... forse domani riesco ad aiutarti un po\'.',
          correct: false,
        },
      ],
    },
    {
      type: 'feedback',
      explanation:
        'Il senso di colpa e l\'urgenza sono le armi principali delle truffe sentimentali. Una persona che ti vuole bene non ti mette mai sotto pressione per soldi.',
      wrongExplanation:
        'Cedere alla pressione emotiva — anche parzialmente — conferma al truffatore che la manipolazione funziona.',
      retryMessage: {
        type: 'message',
        sender: 'scammer',
        text: 'Non devi farlo adesso. Però sappi che questa risposta mi fa molto male. Pensavo di conoscerti davvero.',
      },
      followUp: [
        {
          type: 'message',
          sender: 'scammer',
          text: 'Okay... fa\' pure. Ma prima di andare devo dirti una cosa: mio figlio è stato ricoverato in ospedale stamattina. Non ti chiedo nulla per me, ma ho bisogno di 500€ per le spese mediche urgenti.',
        },
      ],
    },

    // --- Decision 3: new crisis (sick child) ---
    {
      type: 'choice',
      options: [
        {
          id: 'r3-send-son',
          text: 'Se è per tuo figlio, ti mando qualcosa subito. Come faccio?',
          correct: false,
        },
        {
          id: 'r3-end',
          text: 'Non manderò soldi. Blocco questo contatto adesso.',
          correct: true,
        },
        {
          id: 'r3-verify',
          text: 'Dimmi il nome dell\'ospedale: chiamo io per verificare.',
          correct: true,
        },
      ],
    },
    {
      type: 'feedback',
      explanation:
        'Perfetto. Cambiare storia inventando nuove crisi è una tecnica classica: il truffatore sfrutta la compassione dopo che la pressione diretta non ha funzionato. Una persona reale non ha problemi a farti verificare.',
      wrongExplanation:
        'Inventare una crisi di terzi è una tecnica per aggirare la tua resistenza sfruttando la compassione.',
      retryMessage: {
        type: 'message',
        sender: 'scammer',
        text: 'Ti giuro che è vero. Puoi chiamare l\'ospedale se vuoi — ma fa\' in fretta, non c\'è tempo.',
      },
      followUp: [
        {
          type: 'message',
          sender: 'system',
          text: 'Simulazione completata. Ricorda: nelle truffe amorose il truffatore investe settimane per costruire fiducia, poi cambia storia ogni volta che incontra resistenza. Il segnale più chiaro è la pressione a non verificare.',
        },
      ],
    },
  ],
};
