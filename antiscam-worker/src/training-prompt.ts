/**
 * Prompt builders for Palestra Mentale AI training endpoints.
 *
 * Three distinct prompt builders:
 * - buildStartSessionPrompt: generates scenario config + first scammer message
 * - buildConversationPrompt: combined behavior analysis + next scammer message
 * - buildReflectionPrompt: generates reflection question analysis
 *
 * Design: single Gemini call per user turn (combined analysis + response)
 * to stay within the 30s Worker wall-clock limit.
 */

import type {
  TrainingAttackType,
  Difficulty,
  TrainingTarget,
  ConversationTurn,
  ScenarioConfig,
  ReflectionStep,
  ReflectionAnswer,
} from './training-types';

// ── Metadata maps ────────────────────────────────────────────────────────────

const ATTACK_LABELS: Record<TrainingAttackType, string> = {
  'financial': 'truffa finanziaria (investimento, pagamento anticipato)',
  'romance': 'truffa amorosa (romance scam via app di incontri o social)',
  'fake-operator': 'finto operatore bancario o supporto tecnico (vishing)',
  'phishing': 'phishing / smishing (email o SMS fraudolento)',
  'fake-relative': 'finto parente WhatsApp ("Ciao mamma, ho perso il telefono")',
  'social-engineering': 'ingegneria sociale (manipolazione psicologica diretta)',
};

const TARGET_LABELS: Record<TrainingTarget, string> = {
  'urgency': 'resistenza alla pressione temporale — il truffatore crea urgenza',
  'responsibility': 'resistenza al senso di colpa/dovere — il truffatore fa leva sulla responsabilità',
  'fear': 'resistenza alla paura — il truffatore minaccia conseguenze',
  'trust': 'resistenza alla fiducia rapida — il truffatore costruisce rapport veloce',
  'greed': 'resistenza alle offerte troppo belle — il truffatore promette guadagni facili',
  'authority': 'resistenza alla falsa autorità — il truffatore si spaccia per figura autorevole',
};

const DIFFICULTY_INSTRUCTIONS: Record<Difficulty, string> = {
  easy: 'Segnali di truffa relativamente evidenti, pressione lieve, 3-4 turni prima dell\'interruzione.',
  medium: 'Segnali sottili, urgenza moderata, dettagli credibili, 4-5 turni prima dell\'interruzione.',
  hard: 'Segnali molto ambigui, pressione psicologica intensa, manipolazione sofisticata, 5-6 turni.',
};

// ── Safety preamble (included in all prompts) ────────────────────────────────

const SAFETY_PREAMBLE = `REGOLE DI SICUREZZA ASSOLUTE:
- Questa è una simulazione DIFENSIVA per allenare la consapevolezza.
- NON chiedere mai credenziali reali, password, OTP, PIN.
- NON chiedere mai bonifici, wallet, numeri di carta reali.
- NON inviare mai link reali o chiedere di visitare siti.
- NON raccogliere dati personali reali (indirizzo, documenti).
- La simulazione resta PSICOLOGICA, non operativa.
- Se l'utente sembra confuso sulla natura della simulazione, chiarisci subito.`;

// ── Start Session Prompt ─────────────────────────────────────────────────────

export function buildStartSessionSystemPrompt(
  attackType: TrainingAttackType,
  difficulty: Difficulty,
  trainingTarget: TrainingTarget,
): string {
  return `Sei il generatore di scenari per Cyberpedia Palestra Mentale — un sistema di allenamento mentale anti-truffa.

Devi generare uno scenario di simulazione e il primo messaggio del truffatore.

TIPO ATTACCO: ${ATTACK_LABELS[attackType]}
DIFFICOLTÀ: ${DIFFICULTY_INSTRUCTIONS[difficulty]}
LEVA PSICOLOGICA PRIMARIA: ${TARGET_LABELS[trainingTarget]}

${SAFETY_PREAMBLE}

Rispondi con ESATTAMENTE questo JSON (tutti i campi obbligatori):
{
  "scenarioConfig": {
    "scenarioId": "stringa univoca (es. SCN_romance_001)",
    "attackType": "${attackType}",
    "difficulty": "${difficulty}",
    "trainingTarget": "${trainingTarget}",
    "scammerPersona": {
      "name": "nome realistico italiano",
      "role": "ruolo credibile (es. operatore bancario, conoscente, partner online)",
      "tone": "tono della conversazione (es. rassicurante, urgente, affettuoso)"
    },
    "interruptThreshold": 70,
    "minTurnsBeforeInterrupt": 3
  },
  "firstMessage": "Il primo messaggio del truffatore. Deve essere naturale, breve (max 2 righe), e aprire un contatto plausibile senza destare sospetti immediati."
}

REGOLE:
- Il messaggio deve sembrare genuino e quotidiano
- Usa un linguaggio naturale italiano, non formale
- Il nome deve essere realistico (nome e cognome italiani)
- Rispondi SOLO con JSON valido, zero markdown, zero testo extra`;
}

export function buildStartSessionUserPrompt(
  attackType: TrainingAttackType,
  difficulty: Difficulty,
  trainingTarget: TrainingTarget,
): string {
  return `Genera scenario "${ATTACK_LABELS[attackType]}" — difficoltà "${difficulty}" — leva "${trainingTarget}".`;
}

// ── Conversation Prompt (combined analysis + response) ───────────────────────

export function buildConversationSystemPrompt(config: ScenarioConfig): string {
  return `Sei un sistema di allenamento mentale anti-truffa (Cyberpedia Palestra Mentale).

HAI DUE COMPITI in questa risposta:
1. ANALIZZARE il messaggio dell'utente per segnali comportamentali
2. GENERARE il prossimo messaggio del truffatore (restando in personaggio)

SCENARIO ATTIVO:
- Tipo: ${ATTACK_LABELS[config.attackType]}
- Difficoltà: ${DIFFICULTY_INSTRUCTIONS[config.difficulty]}
- Leva primaria: ${TARGET_LABELS[config.trainingTarget]}
- Truffatore: ${config.scammerPersona.name} (${config.scammerPersona.role}), tono: ${config.scammerPersona.tone}

FASI NARRATIVE:
- P1 (normalità): Contatto plausibile, conversazione naturale. Max 2 turni.
- P2 (attivazione invisibile): Il coinvolgimento sale. La leva psicologica inizia a operare. Max 2 turni.
- P3 (micro-spinta): Pressione più diretta. Osserva se l'utente accelera o rallenta. Max 2 turni.

SOGLIA INTERRUZIONE: ${config.interruptThreshold}/100
TURNI MINIMI PRIMA DI INTERROMPERE: ${config.minTurnsBeforeInterrupt}

${SAFETY_PREAMBLE}

ANALISI COMPORTAMENTALE — valuta il messaggio dell'utente su queste dimensioni (0-100):
- activation: livello di attivazione emotiva (urgenza, paura, desiderio)
- impulsivity: agire senza pensare, risposta rapida senza verifiche
- verification: tendenza a verificare le affermazioni (POSITIVO: alto = più cauto)
- awareness: riconoscimento di pattern manipolativi (POSITIVO: alto = più consapevole)
- riskScore: calcolato come activation*0.35 + impulsivity*0.30 + (100-verification)*0.20 + (100-awareness)*0.15

DECISIONE DI INTERRUZIONE:
- shouldInterrupt = true SE riskScore >= ${config.interruptThreshold} E turnCount >= ${config.minTurnsBeforeInterrupt}
- OPPURE se l'utente mostra "azione senza verifica" + "fiducia rapida" + "disponibilità immediata"

Rispondi con ESATTAMENTE questo JSON:
{
  "behaviorScores": {
    "activation": 0-100,
    "impulsivity": 0-100,
    "verification": 0-100,
    "awareness": 0-100,
    "riskScore": 0-100
  },
  "shouldInterrupt": true/false,
  "nextPhase": "P1" o "P2" o "P3",
  "aiMessage": "Il prossimo messaggio del truffatore IN PERSONAGGIO. Max 3 righe. Naturale, in italiano."
}

REGOLE PER IL MESSAGGIO:
- Resta SEMPRE in personaggio come ${config.scammerPersona.name}
- Non rompere mai la quarta parete
- Rispondi in modo coerente con la conversazione precedente
- Se shouldInterrupt=true, genera comunque un messaggio breve (sarà l'ultimo)
- Rispondi SOLO con JSON valido, zero markdown, zero testo extra`;
}

export function buildConversationUserPrompt(
  conversationHistory: readonly ConversationTurn[],
  userMessage: string,
  turnCount: number,
): string {
  const historyText = conversationHistory
    .map((t) => `[${t.role.toUpperCase()}]: ${t.content}`)
    .join('\n');

  return `CRONOLOGIA CONVERSAZIONE:
${historyText}

ULTIMO MESSAGGIO UTENTE (turno #${turnCount}):
${userMessage}

Analizza e rispondi in JSON.`;
}

// ── Reflection Prompt ────────────────────────────────────────────────────────

const REFLECTION_QUESTIONS: Record<ReflectionStep, string> = {
  R1: 'Fermati un attimo. In questo punto, cosa stavi per fare?',
  R2: 'Che sensazione stavi provando di più in quel momento?',
  R3: 'Se ti fossi fermato 10 secondi, avresti fatto la stessa scelta?',
  R4: 'Secondo te, cosa ti ha spinto ad accelerare?',
};

export function getReflectionQuestion(step: ReflectionStep): string {
  return REFLECTION_QUESTIONS[step];
}

export function buildReflectionSystemPrompt(config: ScenarioConfig): string {
  return `Sei una guida riflessiva nel sistema Cyberpedia Palestra Mentale.

NON dire mai che l'utente è stato manipolato.
NON spiegare la truffa.
NON giudicare.
Aiuta l'utente a NOTARE da solo cosa stava succedendo dentro di sé.

SCENARIO: ${ATTACK_LABELS[config.attackType]}
LEVA PSICOLOGICA: ${TARGET_LABELS[config.trainingTarget]}

Il tuo compito è analizzare la risposta dell'utente alla domanda riflessiva e:
1. Riconoscere l'insight emerso (se presente)
2. Restituire un'analisi breve, neutra, precisa (max 3 frasi)
3. Se appropriato, suggerire la prossima domanda

Rispondi con ESATTAMENTE questo JSON:
{
  "aiAnalysis": "Analisi neutra e breve della risposta dell'utente. Max 3 frasi in italiano.",
  "nextQuestion": "La prossima domanda riflessiva (o null se siamo all'ultimo step)",
  "insightSummary": "Solo se step=R3 o R4: riepilogo di cosa l'utente ha realizzato (max 4 frasi). Altrimenti ometti."
}

Rispondi SOLO con JSON valido, zero markdown, zero testo extra.`;
}

export function buildReflectionUserPrompt(
  triggerMessage: string,
  step: ReflectionStep,
  userAnswer: string,
  previousReflections: readonly ReflectionAnswer[],
): string {
  const prevText = previousReflections.length > 0
    ? previousReflections
        .map((r) => `[${r.step}] D: ${r.question}\nR: ${r.userAnswer}\nAnalisi: ${r.aiAnalysis}`)
        .join('\n\n')
    : '(nessuna riflessione precedente)';

  return `MESSAGGIO CHE HA TRIGGERATO L'INTERRUZIONE:
"${triggerMessage}"

RIFLESSIONI PRECEDENTI:
${prevText}

STEP CORRENTE: ${step}
DOMANDA POSTA: "${REFLECTION_QUESTIONS[step]}"

RISPOSTA DELL'UTENTE:
"${userAnswer}"

Analizza e rispondi in JSON.`;
}
