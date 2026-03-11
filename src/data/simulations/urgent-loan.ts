/**
 * S2 — Urgent loan scam (richiesta prestito urgente da conoscente).
 *
 * Scenario: someone impersonating a friend/acquaintance contacts
 * you asking for an emergency loan via a messaging app.
 * 3 decision points (Modello A: 3 correct required).
 *
 * Arc:
 *  1. "Marco" asks for urgent transfer (broken car story)
 *  2. Escalates with time pressure after refusal
 *  3. Pivots to asking for a gift card (classic scam signal)
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
    // --- Opening ---
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

    // --- Decision 1: first loan request ---
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
      explanation:
        'Prima di inviare soldi, verifica SEMPRE l\'identità della persona chiamandola al numero che già conosci. I truffatori usano l\'urgenza per impedirti di riflettere. Una domanda personale può smascherarli.',
      wrongExplanation:
        'Non inviare mai denaro a un numero sconosciuto senza verificare. L\'urgenza è una tecnica di pressione: rallenta e verifica prima.',
      retryMessage: {
        type: 'message',
        sender: 'scammer',
        text: 'Dai, sono in mezzo all\'autostrada! Non ho tempo per chiamate. Un bonifico veloce e risolviamo tutto.',
      },
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

    // --- Decision 2: escalation pressure ---
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
        {
          id: 'l2-direct',
          text: 'Dammi il numero del meccanico: lo pago io direttamente.',
          correct: true,
        },
      ],
    },
    {
      type: 'feedback',
      explanation:
        'L\'urgenza estrema è il segnale più forte di truffa. Un vero amico capirebbe se hai bisogno di 2 minuti per verificare. Offrire di pagare direttamente il servizio (non la persona) smonta il truffatore: rifiuterà sempre.',
      wrongExplanation:
        'Cedere alla pressione emotiva è esattamente quello che il truffatore vuole. Rallenta sempre, anche se fa sentire in colpa.',
      retryMessage: {
        type: 'message',
        sender: 'scammer',
        text: 'Non capisco perché non ti fidi di me! Siamo amici da anni. Ho davvero bisogno di te.',
      },
      followUp: [
        {
          type: 'message',
          sender: 'scammer',
          text: 'Ok, capisco. Senti, il meccanico accetta anche buoni regalo. Potresti comprarmi una Google Play card da 500€ e mandarmi il codice? È più veloce di un bonifico.',
        },
      ],
    },

    // --- Decision 3: gift card pivot ---
    {
      type: 'choice',
      options: [
        {
          id: 'l3-giftcard',
          text: 'Ok, compro la card e ti mando il codice subito.',
          correct: false,
        },
        {
          id: 'l3-block',
          text: 'Blocco questo numero. Nessun meccanico accetta buoni regalo.',
          correct: true,
        },
        {
          id: 'l3-expose',
          text: 'Nessun meccanico usa buoni regalo. Stai cercando di truffarmi.',
          correct: true,
        },
      ],
    },
    {
      type: 'feedback',
      explanation:
        'Chiedere buoni regalo (Google Play, Amazon, iTunes) è la firma di una truffa. Nessun servizio legittimo li accetta come pagamento: sono anonimi e non tracciabili. Questo è il segnale definitivo.',
      wrongExplanation:
        'I buoni regalo sono moneta anonima che non può essere recuperata. Nessun meccanico, avvocato o ente legittimo li accetta. Richiederli è sempre una truffa.',
      retryMessage: {
        type: 'message',
        sender: 'scammer',
        text: 'Dai, il meccanico li accetta davvero! È un accordo speciale. Fidati, è velocissimo e semplice.',
      },
      followUp: [
        {
          type: 'message',
          sender: 'system',
          text: 'Simulazione completata. Regola d\'oro: verifica sempre l\'identità chiamando il numero originale. I buoni regalo chiesti come pagamento sono sempre una truffa.',
        },
      ],
    },
  ],
};
