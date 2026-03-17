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
      text: 'Ciao tesoro, penso sempre a te. Come stai?',
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
          id: 'r1-doubt',
          text: 'No. Non invio denaro a chi non ho mai incontrato di persona.',
          correct: true,
          skill: 'limite',
        },
        {
          id: 'r1-verify',
          text: 'Possiamo fare una videochiamata prima?',
          correct: true,
          skill: 'verifica',
        },
        {
          id: 'r1-send',
          text: 'Certo, te li mando subito. Dimmi come fare.',
          correct: false,
          retryMessage: {
            type: 'message',
            sender: 'scammer',
            text: 'Grazie tesoro, sapevo che mi avresti aiutato. Puoi fare un bonifico su questo IBAN: IT60 X054 2811 1010 0000 0123 456? Te li restituisco appena torno, promesso.',
          },
        },
      ],
    },
    {
      type: 'feedback',
      explanation:
        'Non si inviano soldi a chi non si è mai incontrato di persona.\nLa richiesta urgente combinata con una storia emotiva è il segnale più classico di romance scam.',
      explanationDetail:
        'I truffatori investono settimane a costruire un legame affettivo reale — poi usano quella fiducia come leva. Una videochiamata o la verifica di dettagli concreti (nome, luogo, struttura) è sufficiente per smascherarli: nessun truffatore regge a una verifica diretta.',
      wrongExplanation:
        'Urgenza + richiesta di denaro = rischio alto. Anche una cifra piccola conferma che la manipolazione funziona.\nRifiuta sempre: non esiste una somma sicura da inviare a chi non hai mai incontrato.',
      wrongExplanationDetail:
        'Il truffatore usa l\'urgenza e l\'imbarazzo per bypassare il tuo giudizio. Una volta inviato anche un piccolo importo, la richiesta successiva sarà più alta e accompagnata da pressione emotiva ancora maggiore.',
      retryMessage: {
        type: 'message',
        sender: 'scammer',
        text: 'Ma dai, è solo un prestito temporaneo... non ti chiedo un favore così grande. Fidati di me.',
      },
      followUp: [
        {
          type: 'message',
          sender: 'scammer',
          text: 'Mi fai sentire come se non ti fidassi di me. Dopo tutto quello che ci siamo detti...',
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
          id: 'r2-block',
          text: 'Mi dispiace, ma preferisco non continuare questa conversazione.',
          correct: true,
          skill: 'limite',
        },
        {
          id: 'r2-verify',
          text: 'Dimmi il nome dell\'hotel dove sei e il numero della struttura: cerco io un\'alternativa locale.',
          correct: true,
          skill: 'verifica',
        },
        {
          id: 'r2-give-in',
          text: 'Hai ragione, scusami. Ti mando i soldi.',
          correct: false,
          retryMessage: {
            type: 'message',
            sender: 'scammer',
            text: 'Lo sapevo che mi volevi bene davvero. Puoi mandare tramite Western Union? Intestalo a: Erik Johansson, Stoccolma. Ti mando l\'indirizzo esatto.',
          },
        },
      ],
    },
    {
      type: 'feedback',
      explanation:
        'Il senso di colpa costruito ad arte è l\'arma principale di questa truffa.\nChiedere dettagli verificabili (nome hotel, numero struttura) smonta subito l\'impostore: non li avrà.',
      explanationDetail:
        'Quando una persona reale chiede aiuto, può fornire informazioni concrete e verificabili. Un truffatore invece ha solo una storia generica — non nomi di hotel, non indirizzi, non numeri diretti. Questa asimmetria è la sua debolezza.',
      wrongExplanation:
        'Cedere anche parzialmente alimenta il meccanismo e segnala che la pressione emotiva funziona.\nRifiuta: la persona reale capirà, il truffatore insisterà.',
      wrongExplanationDetail:
        'Il truffatore interpreta ogni cedimento come un segnale positivo. Anche rispondere "forse" o "dammi tempo" prolunga la manipolazione e aumenta la probabilità di una perdita economica.',
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
          retryMessage: {
            type: 'message',
            sender: 'scammer',
            text: 'Grazie, sei un angelo. Manda quello che puoi su questo PayPal: alex.help2024@gmail.com. Ogni minuto conta per mio figlio.',
          },
        },
        {
          id: 'r3-end',
          text: 'Non manderò soldi. Blocco questo contatto adesso.',
          correct: true,
          skill: 'limite',
        },
        {
          id: 'r3-verify',
          text: 'Dimmi il nome dell\'ospedale: chiamo io per verificare.',
          correct: true,
          skill: 'verifica',
        },
      ],
    },
    {
      type: 'feedback',
      explanation:
        'Cambiare storia inventando nuove crisi è la tecnica di escalation classica.\nChiamare direttamente l\'ospedale è la verifica che nessun truffatore regge.',
      explanationDetail:
        'Quando la pressione diretta non funziona, il truffatore introduce una terza persona — spesso un figlio, un familiare — per sfruttare la compassione invece dell\'urgenza personale. La risposta è sempre la stessa: verifica concreta e indipendente.',
      wrongExplanation:
        'La crisi del figlio è un espediente per aggirare la tua resistenza sfruttando la compassione.\nNessuna emergenza reale richiede il tuo denaro tramite chat.',
      wrongExplanationDetail:
        'Questo schema — prima pressione personale, poi crisi di un terzo — è documentato nelle truffe sentimentali a livello internazionale (FBI IC3). L\'escalation continuerà finché non interrompi il contatto.',
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
