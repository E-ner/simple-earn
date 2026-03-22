/**
 * Returns today's date at UTC midnight — use this everywhere you query DailySchedule.
 * Ensures consistent date matching regardless of server timezone.
 */
export function getTodayUTC(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}