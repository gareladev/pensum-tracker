import type { Subject, ProgressMap, SubjectStatus } from '../types';

export function getEffectiveProgress(
  subjects: Subject[],
  progress: ProgressMap
): Record<string, SubjectStatus> {
  const result: Record<string, SubjectStatus> = {};
  for (const s of subjects) {
    const manual = progress[s.id];
    if (manual === 'aprobada' || manual === 'regular') {
      result[s.id] = manual;
      continue;
    }
    if (manual === 'pendiente') {
      result[s.id] = 'pendiente';
      continue;
    }
    const allOk = s.prerequisites.every((id) => progress[id] === 'aprobada');
    result[s.id] = s.prerequisites.length === 0 || allOk ? 'puedo_cursar' : 'pendiente';
  }
  return result;
}

export function nextStatus(current: SubjectStatus): SubjectStatus {
  if (current === 'pendiente' || current === 'puedo_cursar') return 'regular';
  if (current === 'regular') return 'aprobada';
  return 'pendiente';
}
