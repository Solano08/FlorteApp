import { activityService } from '../services/activityService';

/** Evita escrituras repetidas: una fila por usuario y dia en BD (UPSERT), pero sin golpear la BD en cada request. */
const recordedDayByUser = new Map<string, string>();

export function recordDailyLoginIfNeeded(userId: string): void {
  const day = new Date().toISOString().slice(0, 10);
  if (recordedDayByUser.get(userId) === day) {
    return;
  }
  recordedDayByUser.set(userId, day);
  void activityService.recordLogin(userId).catch(() => {});
}
