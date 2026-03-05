import { describe, it, expect } from 'vitest';
import { getEffectiveProgress, nextStatus } from './curriculum';
import type { Subject, ProgressMap } from '../types';

describe('nextStatus', () => {
  it('pendiente -> regular', () => {
    expect(nextStatus('pendiente')).toBe('regular');
  });
  it('puedo_cursar -> regular', () => {
    expect(nextStatus('puedo_cursar')).toBe('regular');
  });
  it('regular -> aprobada', () => {
    expect(nextStatus('regular')).toBe('aprobada');
  });
  it('aprobada -> pendiente', () => {
    expect(nextStatus('aprobada')).toBe('pendiente');
  });
});

describe('getEffectiveProgress', () => {
  const subjects: Subject[] = [
    { id: 'A', name: 'Materia A', semester: 1, prerequisites: [] },
    { id: 'B', name: 'Materia B', semester: 2, prerequisites: ['A'] },
    { id: 'C', name: 'Materia C', semester: 2, prerequisites: ['A'] },
  ];

  it('respeta aprobada y regular manual', () => {
    const progress: ProgressMap = { A: 'aprobada', B: 'regular' };
    const effective = getEffectiveProgress(subjects, progress);
    expect(effective['A']).toBe('aprobada');
    expect(effective['B']).toBe('regular');
  });

  it('asigna puedo_cursar cuando no hay prerequisitos', () => {
    const progress: ProgressMap = {};
    const effective = getEffectiveProgress(subjects, progress);
    expect(effective['A']).toBe('puedo_cursar');
  });

  it('asigna puedo_cursar cuando prerequisitos aprobados', () => {
    const progress: ProgressMap = { A: 'aprobada' };
    const effective = getEffectiveProgress(subjects, progress);
    expect(effective['B']).toBe('puedo_cursar');
    expect(effective['C']).toBe('puedo_cursar');
  });

  it('asigna pendiente cuando faltan prerequisitos', () => {
    const progress: ProgressMap = {};
    const effective = getEffectiveProgress(subjects, progress);
    expect(effective['B']).toBe('pendiente');
    expect(effective['C']).toBe('pendiente');
  });

  it('respeta pendiente manual', () => {
    const progress: ProgressMap = { A: 'aprobada', B: 'pendiente' };
    const effective = getEffectiveProgress(subjects, progress);
    expect(effective['B']).toBe('pendiente');
  });
});
