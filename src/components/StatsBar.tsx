import type { Career, ProgressMap } from '../types';
import { getEffectiveProgress } from '../utils/curriculum';

interface Props {
  career: Career;
  progress: ProgressMap;
}

export function StatsBar({ career, progress }: Props) {
  const effective   = getEffectiveProgress(career.subjects, progress);
  const total       = career.subjects.length;
  const aprobadas   = Object.values(effective).filter((s) => s === 'aprobada').length;
  const cursando    = Object.values(effective).filter((s) => s === 'regular').length;
  const disponibles = Object.values(effective).filter((s) => s === 'puedo_cursar').length;
  const pendientes  = total - aprobadas - cursando - disponibles;
  const pct         = total > 0 ? Math.round((aprobadas / total) * 100) : 0;
  const pctCursando = total > 0 ? Math.round((cursando / total) * 100) : 0;

  return (
    <div className="stats-bar">
      <div className="stats-cards">
        {([
          { label: 'Aprobadas',   value: aprobadas,   color: '#16a34a', bg: '#052e16' },
          { label: 'Cursando',    value: cursando,     color: '#ea580c', bg: '#431407' },
          { label: 'Disponibles', value: disponibles,  color: '#3b82f6', bg: '#0f172a' },
          { label: 'Pendientes',  value: pendientes,   color: '#52525b', bg: '#18181b' },
        ] as const).map(({ label, value, color, bg }) => (
          <div key={label} className="stats-item" style={{ background: bg, borderColor: color + '55' }}>
            <span className="stats-value" style={{ color }}>{value}</span>
            <span className="stats-label">{label}</span>
          </div>
        ))}
      </div>

      <div className="stats-progress">
        <div className="stats-progress__header">
          <span>Progreso general</span>
          <strong style={{ color: '#16a34a' }}>{pct}%</strong>
        </div>
        <div className="stats-progress__track">
          <div className="stats-progress__fill" style={{ width: `${pct}%` }} />
          {cursando > 0 && (
            <div
              className="stats-progress__fill stats-progress__fill--cursando"
              style={{ width: `${pctCursando}%`, left: `${pct}%` }}
            />
          )}
        </div>
        <div className="stats-progress__footer">
          {aprobadas} de {total} materias aprobadas
        </div>
      </div>
    </div>
  );
}
