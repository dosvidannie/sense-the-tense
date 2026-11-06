import assert from "node:assert/strict";
import test from "node:test";
import { recentAttempts, summarizeTenses, trimAttemptHistory } from "../app/practice-analytics.ts";

const base = { id: "one", mode: "cards", tense: "past-simple", firstTryCorrect: true, skipped: false };

test("weekly window uses seven local calendar days", () => {
  const now = new Date(2026, 10, 6, 15).getTime();
  const start = new Date(2026, 9, 31).getTime();
  const events = [
    { ...base, id: "before", at: start - 1 },
    { ...base, id: "start", at: start },
    { ...base, id: "today", at: now },
    { ...base, id: "future", at: now + 1 },
  ];
  assert.deepEqual(recentAttempts(events, now).map((event) => event.id), ["start", "today"]);
});

test("skips do not count as mistakes and confidence needs five answers", () => {
  const events = Array.from({ length: 4 }, (_, index) => ({ ...base, id: `${index}`, at: index }));
  events.push({ ...base, id: "skip", at: 5, skipped: true });
  const limited = summarizeTenses(events)[0];
  assert.equal(limited.answered, 4);
  assert.equal(limited.skipped, 1);
  assert.equal(limited.status, "limited");
  const confident = summarizeTenses([...events, { ...base, id: "fifth", at: 6 }])[0];
  assert.equal(confident.status, "confident");
  const focus = summarizeTenses(Array.from({ length: 5 }, (_, index) => ({ ...base, id: `${index}`, at: index, firstTryCorrect: index === 0 })))[0];
  assert.equal(focus.status, "focus");
  const onlySkips = summarizeTenses([{ ...base, id: "only-skip", at: 7, skipped: true }])[0];
  assert.equal(onlySkips.answered, 0);
  assert.equal(onlySkips.skipped, 1);
  assert.equal(onlySkips.status, "limited");
});

test("old attempt events are trimmed without changing review records", () => {
  const now = Date.now();
  const month = 30 * 24 * 60 * 60 * 1000;
  assert.deepEqual(trimAttemptHistory([{ ...base, at: now - month - 1 }, { ...base, id: "new", at: now }], now).map((event) => event.id), ["new"]);
});
