import { formatDistanceToNow, differenceInDays } from "date-fns";

/**
 * Returns a human-readable relative time string like "Updated 3 days ago"
 * or "Created 2 months ago" if never edited.
 */
export function relativeTime(
  updatedAt?: string | null,
  createdAt?: string | null
): { label: string; prefix: string } {
  const ts = updatedAt || createdAt;
  if (!ts) return { label: "Unknown", prefix: "" };

  const isEdited = updatedAt && createdAt && updatedAt !== createdAt;
  const prefix = isEdited ? "Updated" : "Created";
  const label = formatDistanceToNow(new Date(ts), { addSuffix: true });
  return { label, prefix };
}

/**
 * Returns staleness level for a category based on the most recent
 * updated_at across all its entries.
 */
export function stalenessLevel(
  mostRecentUpdate?: string | null
): "fresh" | "stale" | "needs-review" {
  if (!mostRecentUpdate) return "needs-review";
  const days = differenceInDays(new Date(), new Date(mostRecentUpdate));
  if (days > 180) return "needs-review";
  if (days > 90) return "stale";
  return "fresh";
}
