import type { Subject } from '../types';

export const NODE_W = 180;
export const NODE_H = 60;
const COL_GAP = 20;
const ROW_GAP = 90;
const SEM_LABEL_W = 80;

/**
 * Layout por filas de cuatrimestre con nodeW configurable (desktop vs mobile).
 */
export function getSubjectPositions(
  subjects: Subject[],
  nodeW = NODE_W
): Map<string, { x: number; y: number }> {
  const NODE_WIDTH = nodeW;
  // Agrupar por cuatrimestre
  const bySem = new Map<number, Subject[]>();
  for (const s of subjects) {
    const list = bySem.get(s.semester) ?? [];
    list.push(s);
    bySem.set(s.semester, list);
  }
  const semesters = [...bySem.keys()].sort((a, b) => a - b);

  // Posiciones finales (centros)
  const cx = new Map<string, number>();
  const cy = new Map<string, number>();

  semesters.forEach((sem, rowIdx) => {
    const row = bySem.get(sem)!;
    const y = rowIdx * (NODE_H + ROW_GAP);

    // Ordenar dentro de la fila: por x medio de sus prerrequisitos
    const sortedRow = sortRowByPrereqs(row, cx, sem);
    const startX = SEM_LABEL_W;

    sortedRow.forEach((s, i) => {
      cx.set(s.id, startX + i * (NODE_WIDTH + COL_GAP));
      cy.set(s.id, y);
    });
  });

  // Convertir centro → esquina top-left para React Flow
  const positions = new Map<string, { x: number; y: number }>();
  for (const s of subjects) {
    const x = cx.get(s.id) ?? 0;
    const y = cy.get(s.id) ?? 0;
    positions.set(s.id, { x: x - NODE_WIDTH / 2, y: y - NODE_H / 2 });
  }
  return positions;
}

/** Ordena los nodos de una fila según el centro X medio de sus prerrequisitos */
function sortRowByPrereqs(
  row: Subject[],
  cx: Map<string, number>,
  _sem: number
): Subject[] {
  return [...row].sort((a, b) => {
    const avgA = prereqAvgX(a, cx);
    const avgB = prereqAvgX(b, cx);
    return avgA - avgB;
  });
}

function prereqAvgX(s: Subject, cx: Map<string, number>): number {
  const known = s.prerequisites
    .map((id) => cx.get(id))
    .filter((x): x is number => x !== undefined);
  if (known.length === 0) return 0;
  return known.reduce((a, b) => a + b, 0) / known.length;
}

/** Número ordinal del cuatrimestre en español (1° → "1er Cuat.", etc.) */
export function semesterLabel(n: number): string {
  const ordinals = ['', '1er', '2do', '3er', '4to', '5to', '6to', '7mo', '8vo', '9no', '10mo', '11ro', '12mo'];
  return (ordinals[n] ?? `${n}°`) + ' cuat.';
}

/** Devuelve los cuatrimestres únicos ordenados */
export function getSemesters(subjects: Subject[]): number[] {
  return [...new Set(subjects.map((s) => s.semester))].sort((a, b) => a - b);
}
