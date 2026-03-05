import { X, GraduationCap } from 'lucide-react';
import type { Career } from '../types';

interface Props {
  careers: Career[];
  selectedId: string | null;
  onSelect: (careerId: string) => void;
  onClose?: () => void;
  /** En mobile sin carrera seleccionada: no se puede cerrar sin elegir */
  canClose: boolean;
}

export function CareerPickerModal({ careers, selectedId, onSelect, onClose, canClose }: Props) {
  return (
    <div
      className={`career-picker ${canClose ? 'career-picker--dismissable' : 'career-picker--fullscreen'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="career-picker-title"
    >
      {canClose && onClose && (
        <div className="career-picker__backdrop" onClick={onClose} aria-hidden />
      )}

      <div className="career-picker__content">
        {canClose && onClose && (
          <button
            type="button"
            className="career-picker__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={24} />
          </button>
        )}
        <div className="career-picker__header">
          <GraduationCap size={32} className="career-picker__icon" />
          <h2 id="career-picker-title" className="career-picker__title">
            Selecciona tu carrera
          </h2>
          <p className="career-picker__subtitle">
            Elige el pensum para ver tu malla y dar seguimiento
          </p>
        </div>

        <ul className="career-picker__list">
          {careers.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className={`career-picker__item ${c.id === selectedId ? 'career-picker__item--active' : ''}`}
                onClick={() => onSelect(c.id)}
              >
                <span className="career-picker__item-name">{c.name}</span>
                <span className="career-picker__item-count">{c.subjects.length} materias</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
