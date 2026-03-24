# Fase 4 — Gemini Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace mock simulation with real Gemini API call + KV cache in antiscam-worker.

**Architecture:** `index.ts` (request routing) → `gemini.ts` (Gemini REST call + Zod parse) → `schema.ts` (validation) + `prompt.ts` (prompt builders). KV cache wraps Gemini call with 24h TTL.

**Tech Stack:** Cloudflare Workers, Gemini REST API (`generativelanguage.googleapis.com`), Zod v4, TypeScript strict.

---

### Task 1: Create src/gemini.ts

**Files:**
- Create: `src/gemini.ts`

**Step 1: Define `GeminiApiResponse` interface + `GeminiError` class**

Minimal interface for Gemini REST response shape. Custom error class carries
`cause` for upstream context (Zod errors, parse errors).

**Step 2: Define `GEMINI_RESPONSE_SCHEMA` constant**

Simplified JSON Schema (no discriminated union — Gemini may not support anyOf/oneOf).
Zod validates strictly post-parse. Include all possible fields as optional on steps items.

**Step 3: Implement `generateSimulation(apiKey, attackType, difficulty)`**

Flow:
1. Build prompts via `buildSystemPrompt` / `buildUserPrompt` from `./prompt`
2. POST to `GEMINI_API_URL?key=${apiKey}` with `system_instruction` + `generationConfig`
3. Check `response.ok` → throw `GeminiError` on non-2xx
4. Extract `candidates[0].content.parts[0].text` → parse JSON
5. Overwrite `id` and `icon` with deterministic values (see TODO in prompt.ts)
6. `SimulationSchema.safeParse()` → throw `GeminiError` on failure
7. Return `result.data` (typed `SimulationOutput`)

**Step 4: Run type-check**

```bash
npm run type-check
```
Expected: 0 errors.

---

### Task 2: Refactor src/index.ts — replace mock with real flow

**Files:**
- Modify: `src/index.ts`

**Step 1: Swap inline definitions for module imports**

Remove: inline `Env`, `VALID_ATTACK_TYPES`, `VALID_DIFFICULTIES`, `AttackType`,
`Difficulty`, `GenerateRequest`, `getCorsHeaders`, `handlePreflight`.
Add imports from `./types`, `./cors`, `./utils`, `./gemini`.

**Step 2: Replace TODO comments with KV cache + Gemini logic**

```
cached = await env.ANTISCAM_SIMULATIONS_CACHE.get(key)
  → HIT: return JSON.parse(cached) with X-Cache: HIT
  → MISS: generateSimulation(env.GEMINI_API_KEY, attackType, difficulty)
         → put to KV with expirationTtl: 86400
         → return with X-Cache: MISS, X-Source: gemini
```

**Step 3: Wrap generateSimulation in try/catch**

`GeminiError` → 502 Bad Gateway (don't leak internals).
JSON parse errors → 500.

**Step 4: Remove `buildMockSimulation` function**

Dead code once Gemini is wired.

**Step 5: Run type-check**

```bash
npm run type-check
```
Expected: 0 errors.

**Step 6: Smoke-test with wrangler dev**

```bash
curl -s -X POST http://localhost:8787/api/generate-simulation \
  -H "Content-Type: application/json" \
  -d '{"attackType":"romance-scam","difficulty":"easy"}' | jq .id
```
Expected without GEMINI_API_KEY set locally: 502 error (correct — key not set in dev).
Expected with key set: `"romance-scam"`.
