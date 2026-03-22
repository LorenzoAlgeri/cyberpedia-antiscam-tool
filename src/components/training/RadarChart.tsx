/**
 * Lightweight 4-axis SVG radar chart for behavioral training scores.
 * No external chart libraries — pure SVG + Framer Motion.
 *
 * Axes:
 * - Activation (inverted: outward = calmer = better)
 * - Impulsivity (inverted: outward = more deliberate = better)
 * - Verification (normal: outward = more cautious = better)
 * - Awareness (normal: outward = more aware = better)
 */

import * as m from 'motion/react-m';
import type { BehaviorScores } from '@/types/training';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RadarChartProps {
  readonly scores: BehaviorScores;
  readonly previousScores?: BehaviorScores | null;
  readonly size?: number;
}

// ---------------------------------------------------------------------------
// Axis configuration
// ---------------------------------------------------------------------------

interface AxisConfig {
  readonly label: string;
  /** Angle in degrees (0 = top, clockwise) */
  readonly angleDeg: number;
  readonly key: keyof Pick<BehaviorScores, 'activation' | 'impulsivity' | 'verification' | 'awareness'>;
  /** If true, displayed value = 100 - raw (so outward always = better) */
  readonly inverted: boolean;
}

const AXES: readonly AxisConfig[] = [
  { label: 'Activation',    angleDeg: 270, key: 'activation',   inverted: true },
  { label: 'Impulsivity',   angleDeg: 0,   key: 'impulsivity',  inverted: true },
  { label: 'Verification',  angleDeg: 90,  key: 'verification', inverted: false },
  { label: 'Awareness',     angleDeg: 180, key: 'awareness',    inverted: false },
] as const;

const GRID_LEVELS = [0.25, 0.5, 0.75, 1] as const;

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number,
): { x: number; y: number } {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

function buildPolygonPoints(
  scores: BehaviorScores,
  cx: number,
  cy: number,
  maxRadius: number,
): string {
  return AXES.map((axis) => {
    const raw = scores[axis.key];
    const value = axis.inverted ? 100 - raw : raw;
    const radius = (Math.max(0, Math.min(100, value)) / 100) * maxRadius;
    const { x, y } = polarToCartesian(cx, cy, radius, axis.angleDeg);
    return `${x},${y}`;
  }).join(' ');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RadarChart({
  scores,
  previousScores,
  size = 200,
}: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size / 2 - 30;

  const currentPoints = buildPolygonPoints(scores, cx, cy, maxRadius);
  const previousPoints =
    previousScores != null
      ? buildPolygonPoints(previousScores, cx, cy, maxRadius)
      : null;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Behavioral scores radar chart"
    >
      {/* Concentric grid polygons */}
      {GRID_LEVELS.map((level) => {
        const r = maxRadius * level;
        const points = AXES.map((axis) => {
          const { x, y } = polarToCartesian(cx, cy, r, axis.angleDeg);
          return `${x},${y}`;
        }).join(' ');
        return (
          <polygon
            key={level}
            points={points}
            fill="none"
            className="stroke-slate-700/40"
            strokeWidth={1}
          />
        );
      })}

      {/* Axis lines from center to edge */}
      {AXES.map((axis) => {
        const { x, y } = polarToCartesian(cx, cy, maxRadius, axis.angleDeg);
        return (
          <line
            key={axis.key}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            className="stroke-slate-700/30"
            strokeWidth={1}
          />
        );
      })}

      {/* Previous scores polygon (dashed amber) */}
      {previousPoints != null && (
        <polygon
          points={previousPoints}
          className="fill-amber-400/10 stroke-amber-400/40"
          strokeWidth={1.5}
          strokeDasharray="4 2"
        />
      )}

      {/* Current scores polygon (filled cyan, animated) */}
      <m.polygon
        points={currentPoints}
        className="fill-cyan-400/15 stroke-cyan-400/80"
        strokeWidth={1.5}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />

      {/* Axis labels */}
      {AXES.map((axis) => {
        const labelOffset = maxRadius + 18;
        const { x, y } = polarToCartesian(cx, cy, labelOffset, axis.angleDeg);
        return (
          <text
            key={axis.key}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-slate-400 text-[10px]"
          >
            {axis.label}
          </text>
        );
      })}
    </svg>
  );
}
