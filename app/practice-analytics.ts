import type { ModeId, TenseId } from "./game-types";

export type AttemptEvent = {
  id: string;
  at: number;
  mode: ModeId;
  tense: TenseId;
  firstTryCorrect: boolean;
  skipped: boolean;
  errorStage?: "find" | "replace";
};

export type TenseSummary = {
  tense: TenseId;
  answered: number;
  correct: number;
  skipped: number;
  findErrors: number;
  replaceErrors: number;
  status: "confident" | "sometimes" | "focus" | "limited";
};

const DAY = 24 * 60 * 60 * 1000;

export function recentAttempts(events: AttemptEvent[], now: number): AttemptEvent[] {
  const today = new Date(now);
  const from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6).getTime();
  return events.filter((event) => Number.isFinite(event.at) && event.at >= from && event.at <= now);
}

export function trimAttemptHistory(events: AttemptEvent[], now: number): AttemptEvent[] {
  return events.filter((event) => Number.isFinite(event.at) && event.at >= now - 30 * DAY && event.at <= now);
}

export function summarizeTenses(events: AttemptEvent[], minimum = 5): TenseSummary[] {
  const byTense = new Map<TenseId, TenseSummary>();
  for (const event of events) {
    const row = byTense.get(event.tense) ?? {
      tense: event.tense,
      answered: 0,
      correct: 0,
      skipped: 0,
      findErrors: 0,
      replaceErrors: 0,
      status: "limited" as const,
    };
    if (event.skipped) {
      row.skipped += 1;
    } else {
      row.answered += 1;
      row.correct += Number(event.firstTryCorrect);
      row.findErrors += Number(event.errorStage === "find");
      row.replaceErrors += Number(event.errorStage === "replace");
    }
    byTense.set(event.tense, row);
  }
  return [...byTense.values()].map((row) => ({
    ...row,
    status: row.answered < minimum
      ? "limited"
      : row.correct / row.answered >= 0.8
        ? "confident"
        : row.correct / row.answered >= 0.5
          ? "sometimes"
          : "focus",
  }));
}
