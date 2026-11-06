import assert from "node:assert/strict";
import test from "node:test";
import { dueReviews, recordReview } from "../app/review-schedule.ts";

const DAY = 24 * 60 * 60 * 1000;
const card = { id: "card-one" };

test("saved and missed cards wait at least a day", () => {
  for (const [correct, saved] of [[false, false], [true, true]]) {
    const history = recordReview({}, card, correct, saved, 1000);
    assert.equal(dueReviews(history, 1000 + DAY - 1).length, 0);
    assert.equal(dueReviews(history, 1000 + DAY).length, 1);
  }
});

test("correct cards return less often and attempts are retained", () => {
  const first = recordReview({}, card, true, false, 1000);
  assert.equal(first[card.id].nextEligibleAt, 1000 + 7 * DAY);
  const second = recordReview(first, card, true, false, 1000 + 7 * DAY);
  assert.equal(second[card.id].attempts, 2);
  assert.equal(second[card.id].nextEligibleAt, 1000 + 21 * DAY);
  assert.equal(second[card.id].lastAnsweredAt, 1000 + 7 * DAY);
});
