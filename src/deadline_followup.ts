export type FollowupState = "overdue" | "due_soon" | "scheduled";

export function chooseDeadlineFollowup(deadlineAt: Date, now: Date): FollowupState {
  const hoursRemaining = (deadlineAt.getTime() - now.getTime()) / 3_600_000;
  if (hoursRemaining < 0) return "overdue";
  if (hoursRemaining <= 48) return "due_soon";
  return "scheduled";
}
