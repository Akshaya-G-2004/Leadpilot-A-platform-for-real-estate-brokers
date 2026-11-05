// src/lib/scoring.ts
import type { SignalSet, Readiness } from "./types";

/**
 * Compute the hybrid score from the four signals.
 * Formula: round(((intent*0.30)+(timeline*0.45)+(budget*0.10)+(engagement*0.15))*10)
 */
export function computeScore(signals: SignalSet): number {
  const { intent_strength, timeline_urgency, budget_clarity, engagement_quality } = signals;
  const weighted =
    intent_strength * 0.30 +
    timeline_urgency * 0.45 +
    budget_clarity * 0.10 +
    engagement_quality * 0.15;
  return Math.round(weighted * 10);
}

/**
 * Convert a numeric score (0‑100) to a tag: high, medium, low.
 */
export function computeTag(score: number): "high" | "medium" | "low" {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

/**
 * Readiness percentage is the average of the five fields.
 * clear = 1, vague = 0.5, missing = 0.
 */
export function computeReadiness(readiness: Readiness): number {
  const map = { clear: 1, vague: 0.5, missing: 0 } as const;
  const values = [
    readiness.budget.status,
    readiness.location.status,
    readiness.property_type.status,
    readiness.timeline.status,
    readiness.decision_maker.status,
  ].map((s) => map[s as keyof typeof map]);
  const avg = (values as number[]).reduce((a, b) => a + b, 0) / values.length;
  return Math.round(avg * 100);
}

/**
 * Convenience helper that returns all three derived fields.
 */
export function deriveScores(signals: SignalSet, readiness: Readiness) {
  const score = computeScore(signals);
  const tag = computeTag(score);
  const readiness_pct = computeReadiness(readiness);
  return { score, tag, readiness_pct };
}

