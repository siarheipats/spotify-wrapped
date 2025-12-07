export function formatLocalDateTime(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  // Uses browser's local timezone by default
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
