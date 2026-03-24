/**
 * Score interpretation texts for the SessionReport component.
 *
 * Each dimension has 3 performance ranges based on displayValue
 * (normalized so that higher always = better performance):
 *   high:   70-100  (green zone — ottima)
 *   medium: 40-69   (amber zone — nella norma)
 *   low:    0-39    (red zone  — area di miglioramento)
 *
 * displayValue = inverted ? 100 - rawValue : rawValue
 * Inverted dimensions (vulnerability axes): activation, impulsivity
 * Normal dimensions  (protective axes):     verification, awareness
 */

import type { TrainingDimension } from '@/types/training';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DisplayRange = 'low' | 'medium' | 'high';

export interface DimensionInterpretation {
  readonly label: string;
  readonly text: string;
}

export interface GlobalRiskDescription {
  readonly title: string;
  readonly text: string;
}

// ---------------------------------------------------------------------------
// Short tooltip texts — shown on HelpCircle icon hover
// ---------------------------------------------------------------------------

export const DIMENSION_TOOLTIPS: Record<TrainingDimension, string> = {
  activation:
    "Misura l'intensità della tua risposta emotiva (urgenza, paura, eccitazione). È un asse di vulnerabilità: valori bassi indicano maggiore resistenza.",
  impulsivity:
    'Misura la tendenza ad agire senza riflettere, seguendo il primo impulso. È un asse di vulnerabilità: valori bassi indicano risposte più deliberate.',
  verification:
    "Misura quanto hai cercato di verificare le affermazioni ricevute. È un asse protettivo: valori alti indicano comportamenti difensivi attivi.",
  awareness:
    'Misura quanto hai riconosciuto e nominato le tecniche di manipolazione in tempo reale. È un asse protettivo: valori alti indicano un sistema difensivo maturo.',
};

// ---------------------------------------------------------------------------
// Per-dimension range interpretations (ULTRATHINK — psychologically founded)
// ---------------------------------------------------------------------------

export const DIMENSION_INTERPRETATIONS: Record<
  TrainingDimension,
  Record<DisplayRange, DimensionInterpretation>
> = {
  activation: {
    high: {
      label: 'Regolazione emotiva ottima',
      text: "Hai mantenuto una risposta emotiva calma e controllata. La capacità di non lasciarsi attivare emotivamente sotto pressione è uno dei fattori protettivi più solidi contro le truffe: riduce la velocità di risposta impulsiva e consente una valutazione razionale della situazione.",
    },
    medium: {
      label: 'Risposta emotiva moderata',
      text: "La tua risposta emotiva è rimasta entro un range gestibile. I truffatori progettano scenari per attivare emozioni come urgenza, paura o desiderio — riconoscere queste sensazioni nel momento in cui si presentano è il primo passo per non lasciarsi guidare da esse.",
    },
    low: {
      label: 'Alta attivazione emotiva',
      text: "La tua risposta emotiva è stata intensa. Questo è esattamente ciò che l'attacco voleva provocare: le emozioni forti riducono la capacità di pensiero critico. Allena la tecnica della micro-pausa: prima di rispondere, fermati tre secondi e chiediti «cosa sta cercando di farmi fare questa persona?».",
    },
  },
  impulsivity: {
    high: {
      label: 'Risposta deliberata e riflessiva',
      text: "Hai risposto in modo riflessivo, non reattivo. Il pensiero deliberato — prendersi il tempo per valutare prima di agire — è la difesa più diretta contro la manipolazione. Le truffe falliscono quando la vittima potenziale si prende una pausa e dice «ci penso su».",
    },
    medium: {
      label: 'Tendenza impulsiva moderata',
      text: 'Meccanismi come «decide ora», «l\'offerta scade», «non c\'è tempo» sono progettati per bypassare il pensiero critico. Hai mostrato tendenze impulsive in alcune risposte. Nota in quali momenti la risposta è stata più automatica: sono quelli più importanti da allenare.',
    },
    low: {
      label: 'Alta impulsività',
      text: "Hai risposto rapidamente senza sufficiente valutazione. L'impulsività è direttamente correlata alla vulnerabilità alle truffe nella letteratura di ricerca. La buona notizia: è altamente allenabile. Ogni sessione in cui catturi l'impulso e ti fermi costruisce nuovi pattern di risposta.",
    },
  },
  verification: {
    low: {
      label: 'Verifica insufficiente',
      text: "Hai mostrato poca tendenza a mettere in discussione o verificare le affermazioni. Nelle truffe reali, il mancato controllo delle informazioni è il varco principale. Sviluppa l'abitudine di fare domande anche scomode: «Come posso confermare questo?», «Puoi inviarmi qualcosa per iscritto?».",
    },
    medium: {
      label: 'Verifica parziale',
      text: "Hai applicato lo scetticismo in alcuni momenti, ma non sistematicamente. La sfida è la consistenza: i truffatori costruiscono fasi di warm-up per abbassare la guardia prima della richiesta critica. La verifica deve essere un'abitudine automatica, non situazionale.",
    },
    high: {
      label: 'Forte comportamento di verifica',
      text: "Hai dimostrato un'eccellente capacità di verifica. Fare domande, mettere in discussione le affermazioni, cercare conferme — questi comportamenti interrompono direttamente il processo di manipolazione. La vigilanza epistemica è il predittore più affidabile di resistenza alle truffe.",
    },
  },
  awareness: {
    low: {
      label: 'Consapevolezza limitata',
      text: "Hai avuto difficoltà a riconoscere i pattern manipolativi in tempo reale. Il «naming» — saper chiamare una tecnica con il suo nome mentre si svolge — è uno strumento potente: attiva il pensiero analitico e spezza l'automatismo dell'influenza. Ogni sessione amplia il tuo vocabolario difensivo.",
    },
    medium: {
      label: 'Consapevolezza parziale',
      text: "Hai riconosciuto alcuni pattern, non tutti. La consapevolezza parziale è normale all'inizio del percorso: con l'esposizione ripetuta a varianti diverse dello stesso attacco, impari a riconoscere le tecniche sempre prima e con più precisione.",
    },
    high: {
      label: 'Alta consapevolezza metacognitiva',
      text: "Hai dimostrato un'ottima capacità di riconoscimento. Riesci a nominare le tecniche di manipolazione nel momento in cui si verificano — un'abilità che la ricerca chiama «immunizzazione cognitiva». Questo riconoscimento attivo spezza direttamente l'efficacia dell'influenza.",
    },
  },
};

// ---------------------------------------------------------------------------
// Global risk score descriptions (ULTRATHINK — 3 psychological bands)
// ---------------------------------------------------------------------------

export const GLOBAL_RISK_DESCRIPTIONS: Record<
  'low' | 'medium' | 'high',
  GlobalRiskDescription
> = {
  low: {
    title: 'Profilo difensivo solido',
    text: "In questa sessione hai dimostrato una risposta psicologica matura. La tua capacità di mantenerti lucido sotto pressione emotiva, di agire in modo deliberato invece di reagire d'impulso, e di applicare pensiero critico alle affermazioni che ti venivano fatte, indica un sistema difensivo ben calibrato. Continua ad allenarti su scenari più complessi o con leve che hai meno praticato — la resistenza alla manipolazione si mantiene con la pratica regolare.",
  },
  medium: {
    title: 'Profilo con aree di miglioramento',
    text: "Questa sessione ha rivelato sia punti di forza che vulnerabilità. Alcune situazioni ti hanno attivato emotivamente o spinto verso risposte più veloci del solito — questo è normale, e indica che lo scenario ha toccato meccanismi psicologici reali. Usa le tue riflessioni per identificare in quali momenti la guardia si è abbassata e perché: quella è informazione preziosa. Ogni sessione ti avvicina al riconoscimento in tempo reale.",
  },
  high: {
    title: 'Vulnerabilità significativa rilevata',
    text: "Questa sessione ha messo in luce vulnerabilità rilevanti rispetto alle tecniche utilizzate. Non è un giudizio — significa che i meccanismi progettati per questa simulazione hanno funzionato come funzionano nelle truffe reali. Hai ora una mappa precisa di dove il tuo sistema difensivo ha bisogno di rinforzo. Concentrati sulle dimensioni con i punteggi più critici e riprova la stessa leva a difficoltà ridotta.",
  },
};

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

export function getDisplayRange(value: number, inverted: boolean): DisplayRange {
  const displayValue = inverted ? 100 - value : value;
  if (displayValue >= 70) return 'high';
  if (displayValue >= 40) return 'medium';
  return 'low';
}

export function getDimensionInterpretation(
  dimension: TrainingDimension,
  value: number,
  inverted: boolean,
): DimensionInterpretation {
  const range = getDisplayRange(value, inverted);
  return DIMENSION_INTERPRETATIONS[dimension][range];
}

export function getGlobalRiskRange(riskScore: number): 'low' | 'medium' | 'high' {
  if (riskScore <= 35) return 'low';
  if (riskScore <= 65) return 'medium';
  return 'high';
}

export function getGlobalRiskDescription(riskScore: number): GlobalRiskDescription {
  return GLOBAL_RISK_DESCRIPTIONS[getGlobalRiskRange(riskScore)];
}
