export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export function getMonthLabel(monthStr: string): string {
  const date = new Date(monthStr + "T00:00:00");
  return date.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}

export function getDaysInMonth(monthStr: string): number {
  const [year, month] = monthStr.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

export function getWeeksForMonth(monthStr: string): {
  weekNumber: number;
  startDay: number;
  endDay: number;
  days: number;
}[] {
  const totalDays = getDaysInMonth(monthStr);
  const boundaries: { start: number; end: number }[] = [
    { start: 1, end: 7 },
    { start: 8, end: 14 },
    { start: 15, end: 21 },
    { start: 22, end: 28 },
  ];
  if (totalDays > 28) {
    boundaries.push({ start: 29, end: totalDays });
  }
  return boundaries.map((b, i) => ({
    weekNumber: i + 1,
    startDay: b.start,
    endDay: b.end,
    days: b.end - b.start + 1,
  }));
}
