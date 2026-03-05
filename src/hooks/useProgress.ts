import { useState, useCallback, useEffect } from 'react';
import type { ProgressMap } from '../types';

const STORAGE_KEY = 'pemsun-progress';

function loadProgress(): ProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ProgressMap;
  } catch {
    return {};
  }
}

function saveProgress(progress: ProgressMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (_) {}
}

export function useProgress() {
  const [progress, setProgress] = useState<ProgressMap>(loadProgress);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const setSubjectStatus = useCallback((careerId: string, subjectId: string, status: import('../types').SubjectStatus) => {
    setProgress((prev) => ({
      ...prev,
      [`${careerId}:${subjectId}`]: status,
    }));
  }, []);

  const getProgressForCareer = useCallback(
    (careerId: string): ProgressMap => {
      const prefix = `${careerId}:`;
      const out: ProgressMap = {};
      for (const [key, value] of Object.entries(progress)) {
        if (key.startsWith(prefix)) out[key.slice(prefix.length)] = value;
      }
      return out;
    },
    [progress]
  );

  const getFullProgress = useCallback(() => progress, [progress]);

  const setFullProgress = useCallback((data: ProgressMap) => {
    setProgress(typeof data === 'object' && data !== null ? data : {});
  }, []);

  return { progress, setSubjectStatus, getProgressForCareer, getFullProgress, setFullProgress };
}
