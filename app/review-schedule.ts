export type ReviewRecord<Card> = {
  card: Card;
  lastAnsweredAt: number;
  nextEligibleAt: number;
  correct: boolean;
  saved: boolean;
  attempts: number;
};

export type ReviewHistory<Card> = Record<string, ReviewRecord<Card>>;

const DAY = 24 * 60 * 60 * 1000;

export function recordReview<Card extends { id: string }>(
  history: ReviewHistory<Card>,
  card: Card,
  correct: boolean,
  saved: boolean,
  now: number,
): ReviewHistory<Card> {
  const previous = history[card.id];
  const attempts = (previous?.attempts ?? 0) + 1;
  // Explicit saves and mistakes come back after one day; successful answers
  // spread out across a week, then two weeks, then a month.
  const delayDays = saved || !correct ? 1 : attempts === 1 ? 7 : attempts === 2 ? 14 : 30;
  return {
    ...history,
    [card.id]: {
      card,
      lastAnsweredAt: now,
      nextEligibleAt: now + delayDays * DAY,
      correct,
      saved,
      attempts,
    },
  };
}

export function dueReviews<Card extends { id: string }>(
  history: ReviewHistory<Card>,
  now: number,
): ReviewRecord<Card>[] {
  return Object.values(history).filter(
    (record) => Number.isFinite(record.nextEligibleAt) && record.nextEligibleAt <= now,
  );
}
