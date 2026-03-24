/**
 * Prompt builders for antiscam-worker Gemini API calls.
 *
 * buildSystemPrompt — minimal system instructions (no few-shot examples).
 *   Keeps token count low so output stays < 3000 chars — required for
 *   gemini-2.5-flash-lite to complete within the 30s Worker wall-clock limit.
 * buildUserPrompt   — short, task-specific user message.
 *
 * Design notes:
 * - No few-shot examples: only JSON structure + hard rules
 * - Max 3 steps: 1 SimMessage + 1 SimChoice + 1 SimFeedback
 * - SimFeedback: followUp always [], no retryMessage
 * - icon + id are injected as fixed values so the LLM cannot hallucinate them
 */

import type { AttackType, Difficulty } from './types';

// ── Metadata maps ─────────────────────────────────────────────────────────────

const ATTACK_LABELS: Record<AttackType, string> = {
  'romance-scam': 'truffa amorosa (romance scam via app di incontri o social)',
  'urgent-loan': 'truffa del prestito urgente (finto amico che ha cambiato numero)',
  'fake-bank-operator': 'finto operatore bancario (vishing telefonico)',
  'fake-relative': 'finto parente WhatsApp ("Ciao mamma, ho perso il telefono")',
};

// TODO(gemini.ts): after Zod parse, always overwrite simulation.id and simulation.icon
// with the deterministic values from ATTACK_ICONS[attackType] and attackType itself.
// Do NOT trust Gemini's output for these two fields — they must be exact.
export const ATTACK_ICONS: Record<AttackType, string> = {
  'romance-scam': 'Heart',
  'urgent-loan': 'Wallet',
  'fake-bank-operator': 'Building2',
  'fake-relative': 'Users',
};

const DIFFICULTY_INSTRUCTIONS: Record<Difficulty, string> = {
  easy: 'Segnali di truffa evidenti, pressione lieve.',
  medium: 'Segnali sottili, urgenza moderata, dettagli credibili.',
  hard: 'Segnali ambigui, pressione psicologica intensa.',
};

// ── Exported builders ─────────────────────────────────────────────────────────

export function buildSystemPrompt(attackType: AttackType, difficulty: Difficulty): string {
  return `Genera una simulazione anti-truffa JSON per Cyberpedia.it.
Tipo: ${ATTACK_LABELS[attackType]}
Difficoltà: ${DIFFICULTY_INSTRUCTIONS[difficulty]}

Rispondi con ESATTAMENTE questo schema JSON (tutti i campi obbligatori):
{
  "id": "${attackType}",
  "title": "titolo breve (max 5 parole)",
  "description": "descrizione (max 15 parole)",
  "icon": "${ATTACK_ICONS[attackType]}",
  "scammerName": "nome realistico del truffatore",
  "steps": [
    { "type": "message", "sender": "scammer", "text": "messaggio realistico max 2 righe" },
    { "type": "choice", "options": [
        { "id": "d1-a", "text": "risposta sbagliata max 1 riga",  "correct": false },
        { "id": "d1-b", "text": "risposta corretta — LIMITE (es. rifiuto netto, blocca contatto)", "correct": true,  "skill": "limite" },
        { "id": "d1-c", "text": "risposta corretta — VERIFICA (es. chiama numero originale, chiedi prova)", "correct": true, "skill": "verifica" },
        { "id": "d1-d", "text": "risposta sbagliata max 1 riga",  "correct": false }
      ]},
    { "type": "feedback",
      "explanation": "max 2 frasi che coprono ENTRAMBE le risposte corrette",
      "wrongExplanation": "max 15 parole, tono neutro",
      "followUp": [] }
  ]
}

REGOLE ASSOLUTE:
- SimChoice: ESATTAMENTE 2 correct:true con skill DIVERSA (una "limite" + una tra "verifica"/"esposizione"/"alternativa")
  - "limite"      = rifiutare / bloccare / dire NO con fermezza
  - "verifica"    = verificare identità o dettagli (chiamata, domanda segreta, videochiamata)
  - "esposizione" = nominare esplicitamente il pattern di truffa ("questo è una tecnica nota")
  - "alternativa" = proporre un pagamento/azione sicura alternativa (es. pagare il servizio direttamente)
  - Le due opzioni corrette NON devono essere sinonimi della stessa competenza
- SimFeedback: NO campo "correct", NO campo "retryMessage", followUp sempre []
- Tono realistico: urgenza, familiarità, manipolazione emotiva
- Rispondi ONLY con JSON puro, zero markdown, zero testo extra`;
}

export function buildUserPrompt(attackType: AttackType, difficulty: Difficulty): string {
  return `Genera simulazione "${ATTACK_LABELS[attackType]}" — difficoltà "${difficulty}". \
id: "${attackType}", icon: "${ATTACK_ICONS[attackType]}".`;
}
