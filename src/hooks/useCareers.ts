import { useState } from 'react';
import type { Career } from '../types';
import { careers as initialCareers } from '../data/careers';

export function useCareers() {
  const [loadedCareers, setLoadedCareers] = useState<Career[]>([]);
  const careers = [...initialCareers, ...loadedCareers];
  const addCareer = (career: Career) => {
    setLoadedCareers((prev) => (prev.some((c) => c.id === career.id) ? prev : [...prev, career]));
  };
  return { careers, addCareer };
}
