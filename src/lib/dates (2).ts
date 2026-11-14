export function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function yesterdayKey() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return todayKey(date);
}

export function shiftKey(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return todayKey(date);
}
