import assert from "node:assert/strict";
import test from "node:test";
import { buildSpotDeck, createSpotExercise } from "../app/spot-error.ts";
import { dueReviews, recordReview } from "../app/review-schedule.ts";

const tenses = [
  "present-simple", "present-continuous", "present-perfect", "present-perfect-continuous",
  "past-simple", "past-continuous", "past-perfect", "past-perfect-continuous",
  "future-simple", "future-continuous", "future-perfect", "future-perfect-continuous",
];

test("each tense can produce 99 distinct exercises in one topic", () => {
  for (const tense of tenses) {
    const deck = Array.from({ length: 99 }, (_, index) => createSpotExercise(tense, "work", index, index % 5 === 0));
    assert.equal(new Set(deck.map((item) => item.id)).size, 99, tense);
    assert.equal(new Set(deck.map((item) => item.sentence)).size, 99, tense);
    for (const item of deck) {
      assert.equal(item.options.length, 3);
      assert.equal(new Set(item.options).size, 3);
      assert.ok(item.options.includes(item.correctFragment));
      assert.ok(item.parts[item.targetIndex]);
      assert.equal(item.isClean, item.sentence === item.correctSentence);
    }
  }
  const withComma = createSpotExercise("present-perfect", "work", 0, false);
  assert.ok(withComma.parts[withComma.targetIndex].endsWith(","));
  assert.ok(!withComma.parts.some((part) => part.startsWith(",")));
});

test("skipped and saved error exercises cannot return before a day", () => {
  const exercise = createSpotExercise("past-simple", "work", 0, false);
  const now = 1000;
  const history = recordReview({}, exercise, false, false, now);
  assert.equal(dueReviews(history, now + 24 * 60 * 60 * 1000 - 1).length, 0);
  assert.equal(dueReviews(history, now + 24 * 60 * 60 * 1000).length, 1);
  const early = buildSpotDeck(5, ["past-simple"], ["work"], history, { "past-simple": 1 }, now + 24 * 60 * 60 * 1000 - 1);
  assert.ok(!early.exercises.some((item) => item.id === exercise.id));
  const due = buildSpotDeck(5, ["past-simple"], ["work"], history, { "past-simple": 1 }, now + 24 * 60 * 60 * 1000);
  assert.ok(due.exercises.some((item) => item.id === exercise.id));
  assert.equal(new Set(due.exercises.map((item) => item.id)).size, 5);
});

test("a full party has 99 unique questions and about one fifth have no error", () => {
  const first = buildSpotDeck(99, ["present-perfect"], ["people"], {}, {}, Date.now());
  const { exercises } = first;
  assert.equal(exercises.length, 99);
  assert.equal(new Set(exercises.map((item) => item.id)).size, 99);
  assert.equal(new Set(exercises.map((item) => item.sentence)).size, 99);
  assert.equal(exercises.filter((item) => item.isClean).length, 20);
  const second = buildSpotDeck(99, ["present-perfect"], ["people"], {}, first.nextSerialState, Date.now());
  const all = [...exercises, ...second.exercises];
  assert.equal(new Set(all.map((item) => item.sentence)).size, 198);
  assert.equal(new Set(all.map((item) => item.situation)).size, 198);
});
