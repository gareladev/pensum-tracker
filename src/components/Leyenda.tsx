import { useState } from 'react';
import { Info, X } from 'lucide-react';
import { useDevice } from '../hooks/useDevice';

const ITEMS = [
  { cls: 'leyenda-pendiente', label: 'Pendiente' },
  { cls: 'leyenda-regular',   label: 'Cursando' },
  { cls: 'leyenda-aprobada',  label: 'Aprobada' },
  { cls: 'leyenda-puedo',     label: 'Disponible' },
  { dot: '#f59e0b', bg: '#f59e0b22', label: 'Prerrequisito' },
  { dot: '#22c55e', bg: '#22c55e22', label: 'Desbloquea' },
];

export function Leyenda() {
  const { isMobile } = useDevice();
  const [open, setOpen] = useState(false);

  if (isMobile) {
    return (
      <>
        <button className="leyenda-toggle" onClick={() => setOpen(true)}>
          <Info size={14} /> Leyenda
        </button>

        {open && (
          <div className="leyenda-modal-overlay" onClick={() => setOpen(false)}>
            <div className="leyenda-modal" onClick={(e) => e.stopPropagation()}>
              <div className="leyenda-modal__header">
                <span>Leyenda</span>
                <button onClick={() => setOpen(false)}><X size={18} /></button>
              </div>
              <div className="leyenda-modal__grid">
                {ITEMS.map((item) => (
                  <div key={item.label} className="leyenda-item">
                    {'cls' in item
                      ? <span className={`leyenda-box ${item.cls}`} />
                      : <span className="leyenda-box" style={{ background: item.bg, border: `2px solid ${item.dot}` }} />
                    }
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
              <p className="leyenda-modal__hint">
                Toca una materia: 1× Cursando · 2× Aprobada · 3× Reiniciar
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop: barra horizontal
  return (
    <div className="leyenda">
      <span className="leyenda-title">Estado:</span>
      {ITEMS.slice(0, 4).map((item) => (
        <div key={item.label} className="leyenda-item">
          {'cls' in item && <span className={`leyenda-box ${item.cls}`} />}
          <span>{item.label}</span>
        </div>
      ))}
      <span className="leyenda-sep">|</span>
      {ITEMS.slice(4).map((item) => (
        <div key={item.label} className="leyenda-item">
          <span className="leyenda-box" style={{ background: (item as { bg: string }).bg, border: `2px solid ${(item as { dot: string }).dot}` }} />
          <span>{item.label}</span>
        </div>
      ))}
      <span className="leyenda-sep">|</span>
      <span className="leyenda-hint">Clic ×1 Cursando · ×2 Aprobada · ×3 Reiniciar · Fondo = deseleccionar</span>
    </div>
  );
}
