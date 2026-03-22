/**
 * Attack-specific to-do lists — prioritised items per scam type.
 *
 * Sources: Polizia Postale, ENISA, FBI IC3, Europol.
 * Each list supplements the generic checklist with targeted actions.
 */

import type { AttackType } from '@/types/emergency';
import type { TodoItem } from '@/types/todo';

const FINANCIAL_TODOS: readonly TodoItem[] = [
  { id: 'fin-01', text: 'Blocca immediatamente carte e accessi home banking', priority: 1, severe: true },
  { id: 'fin-02', text: 'Contatta la banca per disconoscere le operazioni', priority: 2, severe: true },
  { id: 'fin-03', text: 'Verifica la piattaforma su consob.it (elenco avvertenze)', priority: 3 },
  { id: 'fin-04', text: 'NON fornire ulteriori fondi per "sbloccare" guadagni', priority: 4 },
  { id: 'fin-05', text: 'Segnala alla Consob e alla Polizia Postale', priority: 5 },
];

const ROMANCE_TODOS: readonly TodoItem[] = [
  { id: 'rom-01', text: 'Interrompi ogni contatto con la persona sospetta', priority: 1 },
  { id: 'rom-02', text: 'NON inviare denaro per nessun motivo', priority: 2 },
  { id: 'rom-03', text: 'Fai una ricerca inversa delle foto del profilo', priority: 3 },
  { id: 'rom-04', text: 'Parla con un amico o familiare di fiducia', priority: 4 },
  { id: 'rom-05', text: 'Segnala il profilo sulla piattaforma e alla Polizia Postale', priority: 5 },
];

const FAKE_OPERATOR_TODOS: readonly TodoItem[] = [
  { id: 'fop-01', text: 'Riaggancia SUBITO e chiama tu il numero ufficiale della banca', priority: 1, severe: true },
  { id: 'fop-02', text: 'NON fornire mai PIN, OTP o password al telefono', priority: 2 },
  { id: 'fop-03', text: 'Controlla i movimenti del conto dall\'app ufficiale', priority: 3 },
  { id: 'fop-04', text: 'Ricorda: la banca non chiede MAI credenziali per telefono', priority: 4 },
  { id: 'fop-05', text: 'Segnala il numero chiamante alla Polizia Postale', priority: 5 },
];

const PHISHING_TODOS: readonly TodoItem[] = [
  { id: 'phi-01', text: 'NON cliccare su nessun link nel messaggio', priority: 1 },
  { id: 'phi-02', text: 'Se hai cliccato: cambia subito la password dell\'account', priority: 2 },
  { id: 'phi-03', text: 'Controlla l\'URL reale del sito (deve essere HTTPS + dominio ufficiale)', priority: 3 },
  { id: 'phi-04', text: 'Attiva la verifica in due passaggi sugli account esposti', priority: 4, hint: 'Cerca nelle impostazioni del tuo account, sotto "Sicurezza" o "Accesso". Può chiamarsi "Autenticazione a due fattori", "Verifica in due passaggi" o "Accesso con codice". Ti verrà chiesto un codice extra ogni volta che accedi.' },
  { id: 'phi-05', text: 'Segnala il messaggio come phishing al provider email', priority: 5 },
];

const FAKE_RELATIVE_TODOS: readonly TodoItem[] = [
  { id: 'frl-01', text: 'Chiama il parente al suo numero originale per verificare', priority: 1 },
  { id: 'frl-02', text: 'NON inviare denaro prima di aver parlato a voce', priority: 2 },
  { id: 'frl-03', text: 'Fai una domanda personale che solo il parente conosce', priority: 3 },
  { id: 'frl-04', text: 'Blocca il numero sospetto se confermata la truffa', priority: 4 },
  { id: 'frl-05', text: 'Segnala alla Polizia Postale con screenshot della chat', priority: 5 },
];

const SOCIAL_ENGINEERING_TODOS: readonly TodoItem[] = [
  { id: 'soc-01', text: 'Fermati e non agire sotto pressione o urgenza', priority: 1 },
  { id: 'soc-02', text: 'Verifica l\'identità di chi ti contatta con un canale diverso', priority: 2 },
  { id: 'soc-03', text: 'NON condividere informazioni personali o aziendali', priority: 3 },
  { id: 'soc-04', text: 'Segnala al tuo responsabile se è un contesto lavorativo', priority: 4 },
  { id: 'soc-05', text: 'Documenta tutto: orario, numero, richieste fatte', priority: 5 },
];

/** Lookup map: attack type → specific to-do list */
export const ATTACK_TODOS: Record<AttackType, readonly TodoItem[]> = {
  'financial': FINANCIAL_TODOS,
  'romance': ROMANCE_TODOS,
  'fake-operator': FAKE_OPERATOR_TODOS,
  'phishing': PHISHING_TODOS,
  'fake-relative': FAKE_RELATIVE_TODOS,
  'social-engineering': SOCIAL_ENGINEERING_TODOS,
};
