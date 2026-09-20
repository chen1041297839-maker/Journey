export function formatDayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-")
  if (!year || !month || !day) return isoDate
  return `${Number(month)}月${Number(day)}日`
}
