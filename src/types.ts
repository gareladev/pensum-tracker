export type SubjectStatus = 'pendiente' | 'regular' | 'aprobada' | 'puedo_cursar';

export interface Subject {
  id: string;
  name: string;
  semester: number;
  prerequisites: string[];
}

export interface Career {
  id: string;
  name: string;
  type: 'grado' | 'postgrado';
  subjects: Subject[];
}

export type ProgressMap = Record<string, SubjectStatus>;
