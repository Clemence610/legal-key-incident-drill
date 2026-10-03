import assert from "node:assert/strict";
import test from "node:test";
import { chooseDeadlineFollowup } from "../src/deadline_followup.ts";

test("a signed matter due within 48 hours enters the urgent follow-up lane", () => {
  const now = new Date("2026-09-29T09:00:00.000Z");
  const deadline = new Date("2026-09-30T09:00:00.000Z");
  assert.equal(chooseDeadlineFollowup(deadline, now), "due_soon");
});
