/**
 * Cyberpedia brand logo as inline SVG.
 *
 * Inline SVG is the best choice for dark-mode (/visual-design-foundations):
 * - No network request (instant render)
 * - Scales to any size (responsive)
 * - "cyber" in brand cyan, "pedia" in foreground (white on dark bg)
 * - ® symbol + optional tagline
 *
 * The original PNG has black text which is invisible on dark backgrounds.
 */

import type { CSSProperties } from 'react';

interface CyberpediaLogoProps {
  /** Maximum width in px (height scales proportionally) */
  readonly width?: number;
  /** Show tagline below the wordmark */
  readonly showTagline?: boolean;
  /** Additional CSS class */
  readonly className?: string;
  /** Inline styles */
  readonly style?: CSSProperties;
}

/**
 * Brand wordmark: "cyber" (cyan) + "pedia" (white) + ®
 * Font: system sans-serif with letter-spacing to match brand.
 * viewBox calibrated for the logotype proportions.
 */
export function CyberpediaLogo({
  width = 260,
  showTagline = false,
  className = '',
  style,
}: CyberpediaLogoProps) {
  const viewBoxHeight = showTagline ? 56 : 38;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 260 ${viewBoxHeight}`}
      width={width}
      role="img"
      aria-label="Cyberpedia — Difenditi dalle truffe relazionali online"
      className={className}
      style={style}
    >
      {/* "cyber" — brand cyan */}
      <text
        x="0"
        y="30"
        fill="oklch(0.82 0.09 200)"
        fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
        fontSize="36"
        fontWeight="400"
        letterSpacing="-0.5"
      >
        cyber
      </text>

      {/* "pedia" — foreground (white on dark) */}
      <text
        x="113"
        y="30"
        fill="oklch(0.95 0.01 260)"
        fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
        fontSize="36"
        fontWeight="400"
        letterSpacing="-0.5"
      >
        pedia
      </text>

      {/* ® symbol */}
      <text
        x="228"
        y="16"
        fill="oklch(0.95 0.01 260)"
        fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
        fontSize="11"
        fontWeight="300"
      >
        ®
      </text>

      {/* Tagline (optional) */}
      {showTagline && (
        <text
          x="130"
          y="50"
          textAnchor="middle"
          fill="oklch(0.65 0.02 260)"
          fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
          fontSize="12"
          fontWeight="300"
          fontStyle="italic"
        >
          Difenditi dalle truffe relazionali online
        </text>
      )}
    </svg>
  );
}
