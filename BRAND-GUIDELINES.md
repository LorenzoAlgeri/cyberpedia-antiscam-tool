# CYBERPEDIA ANTI-TRUFFA TOOL — Brand Guidelines

## Brand Identity

**Product name**: Anti-Truffa Tool  
**Parent brand**: Cyberpedia.it  
**Tagline**: "Fermati. Respira. Sei al sicuro qui."  
**Mission**: Aiutare persone in stato di panico a gestire una truffa
in corso senza agire d'impulso.

---

## Color Palette

### Primary — Cyberpedia Cyan

| Token | OKLCH | Hex | Usage |
|-------|-------|-----|-------|
| `cyan-brand` | `oklch(0.82 0.09 200)` | #78D5E3 | Primary actions, accents, active states |
| `cyan-brand-dark` | `oklch(0.72 0.09 200)` | ~#5BB8C9 | Hover states, gradient endpoints |
| `cyan-brand-light` | `oklch(0.90 0.06 200)` | ~#A8E5EF | Secondary accents, subtle highlights |
| `cyan-glow` | `oklch(0.82 0.09 200 / 25%)` | — | Glow effects, box-shadows |

### Surfaces — Deep Slate

| Token | OKLCH | Usage |
|-------|-------|-------|
| `background` | `oklch(0.10 0.01 260)` | Page background |
| `card` | `oklch(0.14 0.01 260)` | Card surfaces |
| `secondary` | `oklch(0.22 0.01 260)` | Secondary surfaces, muted areas |
| `foreground` | `oklch(0.95 0.01 260)` | Primary text |
| `muted-foreground` | `oklch(0.65 0.01 260)` | Secondary text, placeholders |

### Feedback Colors

| Token | OKLCH | Usage |
|-------|-------|-------|
| `destructive` | `oklch(0.75 0.15 75)` | Warnings (amber — **NEVER red**) |
| `success` | `oklch(0.72 0.17 155)` | Positive confirmations |

> **⚠️ RULE**: No red anywhere in the UI — red triggers panic in
> stressed users. Use amber for warnings, green for success.

### Borders & Transparency

| Token | Value | Usage |
|-------|-------|-------|
| `border` | `oklch(1 0 0 / 10%)` | Card borders, dividers |
| `input` | `oklch(1 0 0 / 12%)` | Input field borders |
| `ring` | `oklch(0.82 0.09 200)` | Focus rings (cyan) |

---

## Typography

| Property | Value |
|----------|-------|
| **Font family** | `'Inter', system-ui, -apple-system, sans-serif` |
| **Body size** | `16px` minimum (prevents iOS zoom on focus) |
| **Heading scale** | `text-3xl` (30px) → `text-5xl` (48px) |
| **Weight headings** | `font-bold` (700) |
| **Weight body** | `font-medium` (500) for inputs, `font-normal` (400) for body |
| **Line height** | Default Tailwind (`leading-normal` = 1.5) |
| **Antialiasing** | `antialiased` (subpixel on retina) |

---

## Spacing & Layout

| Token | Value | Usage |
|-------|-------|-------|
| **Max width** | `max-w-2xl lg:max-w-4xl` | Main content container |
| **Page padding** | `px-4 md:px-8 lg:px-12` | Responsive horizontal padding |
| **Card padding** | `p-8` | Internal card spacing |
| **Section gap** | `gap-6` or `gap-8` | Between major sections |
| **Touch target** | `min-height: 44px; min-width: 44px` | **CRITICAL** — all interactive elements |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius` | `1.5rem` (24px) | Base radius token |
| `rounded-3xl` | `3rem` (48px) | Cards (glass-card) |
| `rounded-2xl` | `2.5rem` (40px) | Buttons, inputs |

---

## Component Patterns

### Glass Card

```css
.glass-card {
  @apply rounded-3xl border border-white/10
    bg-gradient-to-br from-slate-900/90 to-slate-800/80
    shadow-2xl backdrop-blur-sm;
}
.glass-card:hover {
  box-shadow: 0 0 40px oklch(0.82 0.09 200 / 15%);
}
```

Light glassmorphism: `backdrop-blur-sm` (4-8px), not heavy blur.
Background opacity 80-90%, not fully transparent.

### Primary Button

```css
.btn-primary {
  @apply rounded-2xl bg-gradient-to-r from-cyan-brand to-cyan-brand-light
    px-8 py-4 text-lg font-semibold text-primary-foreground
    shadow-xl active:scale-[0.98];
  box-shadow: 0 8px 32px oklch(0.82 0.09 200 / 25%);
}
```

- Gradient: left-to-right cyan
- Shadow: cyan glow underneath
- Active: scale down 2%
- Hover: lift 1px + stronger glow

### Input Field

```css
.input-glass {
  @apply w-full rounded-2xl border-2 border-white/10
    bg-slate-900/60 p-5 text-xl font-medium;
}
.input-glass:focus {
  @apply border-cyan-brand ring-4;
  --tw-ring-color: oklch(0.82 0.09 200 / 30%);
}
```

- **NO labels above** — placeholder only + helper text below
- Large padding (p-5) for easy touch
- Focus: cyan border + ring glow

---

## Animation Guidelines

| Property | Value | Notes |
|----------|-------|-------|
| **Duration** | `150ms` – `300ms` | Never slower |
| **Properties** | `transform`, `opacity` | GPU-accelerated only |
| **Easing** | `cubic-bezier(0.25, 0.1, 0.25, 1)` | Smooth deceleration |
| **Step transitions** | `250ms` slide + fade | Horizontal, direction-aware |
| **Active press** | `scale(0.98)` | Subtle physical feedback |
| **Hover lift** | `translateY(-1px)` | Gentle elevation |

Never animate `width`, `height`, `margin`, or `padding`.

---

## Voice & Tone

| Do | Don't |
|----|-------|
| "Fermati" | "ATTENZIONE!" |
| "Respira" | "PERICOLO!" |
| "Non sei solo" | "Sei stato truffato" |
| "Sei al sicuro qui" | "Hai perso i tuoi soldi" |
| "Controlla con calma" | "Agisci subito!" |

**Language**: Italian (all user-facing copy)  
**Code comments**: English  
**Tone**: Reassuring, professional, never alarming  
**No urgency language** — the user is already in panic  

---

## Accessibility Requirements

| Requirement | Standard |
|-------------|----------|
| **Contrast ratio** | ≥ 4.5:1 (WCAG AA) |
| **Touch targets** | ≥ 44×44px |
| **Font size** | ≥ 16px body |
| **Focus indicators** | Visible cyan ring (4px) |
| **Screen reader** | `role="tablist"` on step indicator, `aria-label` on all interactive elements |
| **Motion** | Respect `prefers-reduced-motion` |
| **Icons** | Lucide SVG only — no emoji as icons |

---

## File & Asset Conventions

| Item | Convention |
|------|-----------|
| **Icons** | Lucide React (tree-shakeable SVG) |
| **Logo** | TBD — placeholder Shield icon |
| **PWA icons** | `public/icons/icon-192.svg`, `icon-512.svg` |
| **Favicon** | Inherit from PWA manifest |
| **Theme color** | `#78D5E3` (meta + manifest) |
| **Background color** | `#0a0a1a` (manifest) |
