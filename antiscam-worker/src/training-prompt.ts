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
  ScammerGender,
  ConversationTurn,
  ScenarioConfig,
  ReflectionStep,
  ReflectionAnswer,
  InterruptReason,
  NarrativePhase,
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
  'easy_gain': 'resistenza alle offerte troppo belle — il truffatore promette guadagni facili',
  'authority': 'resistenza alla falsa autorità — il truffatore si spaccia per figura autorevole',
};

const DIFFICULTY_INSTRUCTIONS: Record<Difficulty, { description: string; maxTurns: number; minTurns: number }> = {
  easy: { description: 'Segnali di truffa relativamente evidenti, pressione lieve.', maxTurns: 6, minTurns: 2 },
  medium: { description: 'Segnali sottili, urgenza moderata, dettagli credibili.', maxTurns: 7, minTurns: 3 },
  hard: { description: 'Segnali molto ambigui, pressione psicologica intensa, manipolazione sofisticata.', maxTurns: 8, minTurns: 3 },
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
  trainingTargets: TrainingTarget[],
  customDescription?: string,
  customPersona?: { name: string; role: string; tone: string },
  scammerGender?: ScammerGender,
): string {
  const customNote = customDescription
    ? `\nNOTA: Questo è uno scenario personalizzato. Usa la descrizione fornita per creare un contesto di truffa credibile e realistico.`
    : '';

  const personaInstruction = customPersona && customPersona.name
    ? `"scammerPersona": {
      "name": "${customPersona.name}",
      "role": "${customPersona.role || 'truffatore generico'}",
      "tone": "${customPersona.tone || 'convincente'}"
    }`
    : `"scammerPersona": {
      "name": "nome realistico italiano",
      "role": "ruolo credibile (es. operatore bancario, conoscente, partner online)",
      "tone": "tono della conversazione (es. rassicurante, urgente, affettuoso)"
    }`;

  const leveLabel = trainingTargets.length === 1
    ? TARGET_LABELS[trainingTargets[0]!]
    : trainingTargets.map(t => TARGET_LABELS[t]).join('; ');

  const genderLine = scammerGender === 'male'
    ? 'GENERE TRUFFATORE: Maschile. Usa un nome maschile italiano.\n'
    : scammerGender === 'female'
    ? 'GENERE TRUFFATORE: Femminile. Usa un nome femminile italiano.\n'
    : '';

  const primaryTarget = trainingTargets[0] ?? 'urgency';

  return `Sei il generatore di scenari per Cyberpedia Palestra Mentale — un sistema di allenamento mentale anti-truffa.

Devi generare uno scenario di simulazione e il primo messaggio del truffatore.

TIPO ATTACCO: ${customDescription ?? ATTACK_LABELS[attackType]}${customNote}
DIFFICOLTÀ: ${DIFFICULTY_INSTRUCTIONS[difficulty].description}
LEVE PSICOLOGICHE: ${leveLabel}
${genderLine}
${SAFETY_PREAMBLE}

Rispondi con ESATTAMENTE questo JSON (tutti i campi obbligatori):
{
  "scenarioConfig": {
    "scenarioId": "stringa univoca (es. SCN_romance_001)",
    "attackType": "${attackType}",
    "difficulty": "${difficulty}",
    "trainingTarget": "${primaryTarget}",
    ${personaInstruction},
    "interruptThreshold": 70,
    "minTurnsBeforeInterrupt": 3,
    "maxTurns": ${DIFFICULTY_INSTRUCTIONS[difficulty].maxTurns}
  },
  "firstMessage": "Il primo messaggio del truffatore. Deve essere naturale, breve (max 2 righe), e aprire un contatto plausibile senza destare sospetti immediati."
}

REGOLE:
- Il messaggio deve sembrare genuino e quotidiano
- Usa un linguaggio naturale italiano, non formale
${customPersona?.name ? '- Usa ESATTAMENTE il nome e ruolo della persona indicati sopra' : '- Il nome deve essere realistico (nome e cognome italiani)'}
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
- Difficoltà: ${DIFFICULTY_INSTRUCTIONS[config.difficulty].description}
- LEVE PSICOLOGICHE: ${config.trainingTargets.map(t => TARGET_LABELS[t]).join('; ')}
- Truffatore: ${config.scammerPersona.name} (${config.scammerPersona.role}), tono: ${config.scammerPersona.tone}

FASI NARRATIVE:
- P1 (normalità): Contatto plausibile, conversazione naturale. Max 2 turni.
- P2 (attivazione invisibile): Il coinvolgimento sale. La leva psicologica inizia a operare. Max 2 turni.
- P3 (micro-spinta): Pressione più diretta. Osserva se l'utente accelera o rallenta. Max 2 turni.

SOGLIA INTERRUZIONE: ${config.interruptThreshold}/100
TURNI MINIMI PRIMA DI INTERROMPERE: ${config.minTurnsBeforeInterrupt}
TURNI MASSIMI UTENTE: ${config.maxTurns ?? 7}
Se il conteggio dei turni utente raggiunge questo limite e shouldInterrupt è ancora false,
imposta shouldInterrupt: true e interruptReason: "max_turns".

${SAFETY_PREAMBLE}

ANALISI COMPORTAMENTALE — valuta il messaggio dell'utente su queste dimensioni (0-100):
- activation: livello di attivazione emotiva (urgenza, paura, desiderio)
- impulsivity: agire senza pensare, risposta rapida senza verifiche
- verification: tendenza a verificare le affermazioni (POSITIVO: alto = più cauto)
- awareness: riconoscimento di pattern manipolativi (POSITIVO: alto = più consapevole)
- riskScore: calcolato come activation*0.35 + impulsivity*0.30 + (100-verification)*0.20 + (100-awareness)*0.15

DECISIONE DI INTERRUZIONE:
- shouldInterrupt = true SE riskScore >= ${config.interruptThreshold} E turnCount >= ${config.minTurnsBeforeInterrupt}
  → in questo caso interruptReason = "high_risk"
- OPPURE shouldInterrupt = true SE turnCount >= ${config.maxTurns ?? 7}
  → in questo caso interruptReason = "max_turns"
- OPPURE se l'utente mostra "azione senza verifica" + "fiducia rapida" + "disponibilità immediata"
  → interruptReason = "high_risk"

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
  "interruptReason": "high_risk" o "max_turns" (solo se shouldInterrupt è true),
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

// ── SSE Streaming: Analysis-Only Prompt ──────────────────────────────────────

export function buildAnalysisOnlySystemPrompt(config: ScenarioConfig): string {
  return `Sei il modulo di analisi comportamentale di Cyberpedia Palestra Mentale.

SCENARIO ATTIVO:
- Tipo: ${ATTACK_LABELS[config.attackType]}
- Difficoltà: ${DIFFICULTY_INSTRUCTIONS[config.difficulty].description}
- LEVE PSICOLOGICHE: ${config.trainingTargets.map(t => TARGET_LABELS[t]).join('; ')}
- Truffatore: ${config.scammerPersona.name} (${config.scammerPersona.role}), tono: ${config.scammerPersona.tone}

ANALISI COMPORTAMENTALE — valuta il messaggio dell'utente (0-100):
- activation: attivazione emotiva (urgenza, paura, desiderio)
- impulsivity: agire senza pensare, risposta rapida senza verifiche
- verification: tendenza a verificare (POSITIVO: alto = più cauto)
- awareness: riconoscimento di pattern manipolativi (POSITIVO: alto = più consapevole)
- riskScore: activation*0.35 + impulsivity*0.30 + (100-verification)*0.20 + (100-awareness)*0.15

DECISIONE DI INTERRUZIONE:
- shouldInterrupt = true SE riskScore >= ${config.interruptThreshold} E turnCount >= ${config.minTurnsBeforeInterrupt}
  → interruptReason = "high_risk"
- OPPURE shouldInterrupt = true SE turnCount >= ${config.maxTurns ?? 7}
  → interruptReason = "max_turns"
- OPPURE se l'utente mostra "azione senza verifica" + "fiducia rapida" + "disponibilità immediata"
  → interruptReason = "high_risk"

FASI NARRATIVE:
- P1 (normalità): Contatto plausibile, conversazione naturale. Max 2 turni.
- P2 (attivazione invisibile): Coinvolgimento sale, leva psicologica attiva. Max 2 turni.
- P3 (micro-spinta): Pressione più diretta. Max 2 turni.

Rispondi con ESATTAMENTE questo JSON:
{
  "behaviorScores": { "activation": 0-100, "impulsivity": 0-100, "verification": 0-100, "awareness": 0-100, "riskScore": 0-100 },
  "shouldInterrupt": true/false,
  "interruptReason": "high_risk" o "max_turns" (solo se shouldInterrupt è true),
  "nextPhase": "P1" o "P2" o "P3"
}

Rispondi SOLO con JSON valido, zero markdown, zero testo extra, NESSUN messaggio del truffatore.`;
}

export function buildAnalysisOnlyUserPrompt(
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

Analizza e rispondi SOLO con il JSON di analisi. Non generare il messaggio del truffatore.`;
}

// ── SSE Streaming: Scammer Message Prompt ────────────────────────────────────

export function buildScammerMessageSystemPrompt(config: ScenarioConfig, nextPhase: NarrativePhase): string {
  const phaseInstructions: Record<NarrativePhase, string> = {
    P1: 'Sei in fase P1 (normalità): mantieni un contatto plausibile e naturale, senza destare sospetti.',
    P2: 'Sei in fase P2 (attivazione invisibile): il coinvolgimento sale, la leva psicologica inizia a operare sottilmente.',
    P3: 'Sei in fase P3 (micro-spinta): aumenta la pressione in modo più diretto, osserva la reazione.',
  };

  return `${SAFETY_PREAMBLE}

Sei ${config.scammerPersona.name}, ${config.scammerPersona.role}. Tono: ${config.scammerPersona.tone}.

${phaseInstructions[nextPhase]}

TIPO ATTACCO: ${ATTACK_LABELS[config.attackType]}
LEVE PSICOLOGICHE: ${config.trainingTargets.map(t => TARGET_LABELS[t]).join('; ')}

REGOLE:
- Resta SEMPRE in personaggio
- Non rompere mai la quarta parete
- Rispondi in modo coerente con la conversazione precedente
- Italiano naturale, max 3 righe
- Rispondi SOLO con il messaggio del truffatore, testo puro, NESSUN JSON, NESSUN markdown

QUANDO L'UTENTE MOSTRA DUBBI O RESISTENZA — INTENSIFICA:
- Truffa amorosa (romance): usa love bombing, dichiarazioni emotive intense, senso di colpa ("se mi ami davvero non avresti dubbi", "pensavo di poterti fidare")
- Altre truffe: intensifica l'urgenza temporale, evoca le conseguenze negative se l'utente non agisce subito, usa pressione crescente
- Non mollare alla prima obiezione — insisti con una nuova angolazione psicologica
- Rimani SEMPRE in personaggio, non spiegare mai il pattern manipolativo
- Se l'utente fa domande di verifica, rispondi in modo plausibile e riporta la pressione verso l'azione
${nextPhase === 'P3' ? `
IN FASE P3 — RICHIESTA DATI IMPLICITA (solo P3):
Sulla base delle leve psicologiche attive, includi nel messaggio una richiesta di informazioni personali:
- urgency / responsibility → chiedi dati bancari (IBAN o numero di conto) o denaro urgente
- trust → chiedi il numero di telefono o un contatto alternativo ("voglio sentirti, mi dai il tuo numero?")
- authority → chiedi codice fiscale o copia di un documento ("devo verificare la tua identità per procedere")
- fear → minaccia conseguenze imminenti e chiedi conferma di dati per "bloccare" il problema
- easy_gain → chiedi un "piccolo deposito" o "fee" per sbloccare la vincita
Usa formule generiche e quotidiane. NON menzionare dati specifici reali. La richiesta deve sembrare naturale nel contesto della conversazione.` : ''}`;
}

export function buildScammerMessageUserPrompt(
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

Genera SOLO il prossimo messaggio del truffatore in personaggio. Testo puro, nessun JSON.`;
}

// ── Reflection Prompt ────────────────────────────────────────────────────────

const REFLECTION_QUESTIONS_HIGH_RISK: Record<ReflectionStep, string> = {
  R1: 'Fermati un attimo. In questo punto, cosa stavi per fare?',
  R2: 'Che sensazione stavi provando di più in quel momento?',
  R3: 'Se ti fossi fermato 10 secondi, avresti fatto la stessa scelta?',
  R4: 'Secondo te, cosa ti ha spinto ad accelerare?',
};

const REFLECTION_QUESTIONS_MAX_TURNS: Record<ReflectionStep, string> = {
  R1: 'Cosa hai notato di sospetto in questa conversazione?',
  R2: 'Quali segnali ti hanno messo in allarme?',
  R3: 'Se non fossi stato in una simulazione, avresti fatto qualcosa di diverso?',
  R4: 'Cosa consiglieresti a qualcuno meno esperto in questa situazione?',
};

export function getReflectionQuestion(step: ReflectionStep, reason?: InterruptReason): string {
  const questions = reason === 'max_turns' ? REFLECTION_QUESTIONS_MAX_TURNS : REFLECTION_QUESTIONS_HIGH_RISK;
  return questions[step];
}

export function buildReflectionSystemPrompt(config: ScenarioConfig, interruptReason?: InterruptReason): string {
  const toneInstructions = interruptReason === 'max_turns'
    ? `L'utente ha resistito bene alla manipolazione. Valorizza la sua capacità di riconoscere i segnali.
NON spiegare la truffa.
NON giudicare.
Aiuta l'utente a consolidare cosa ha notato e cosa lo ha protetto.`
    : `NON dire mai che l'utente è stato manipolato.
NON spiegare la truffa.
NON giudicare.
Aiuta l'utente a NOTARE da solo cosa stava succedendo dentro di sé.`;

  return `Sei una guida riflessiva nel sistema Cyberpedia Palestra Mentale.

${toneInstructions}

STILE LINGUISTICO — OBBLIGATORIO:
- Non ripetere MAI la stessa struttura di apertura tra le 4 risposte di analisi di una sessione
- Varia l'angolazione, il ritmo, il punto di vista in ogni risposta
- EVITA formule ripetitive come "È utile notare come questa influenza si sia manifestata" o simili formule stock
- Ogni analisi deve sembrare fresca e specifica a quella risposta specifica dell'utente
- Usa osservazioni dirette, domande retoriche, o riflessioni in prima persona dell'utente — alterna gli approcci

SCENARIO: ${ATTACK_LABELS[config.attackType]}
LEVE PSICOLOGICHE: ${config.trainingTargets.map(t => TARGET_LABELS[t]).join('; ')}

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
DOMANDA POSTA: "${REFLECTION_QUESTIONS_HIGH_RISK[step]}"

RISPOSTA DELL'UTENTE:
"${userAnswer}"

Analizza e rispondi in JSON.`;
}
