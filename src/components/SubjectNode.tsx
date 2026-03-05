import { memo } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import type { SubjectStatus } from '../types';

export type HighlightType = 'selected' | 'prereq' | 'unlocked' | null;

const STATUS: Record<SubjectStatus, { label: string; bg: string; border: string; text: string; dot: string }> = {
  pendiente:   { label: 'Pendiente',  bg: '#18181b', border: '#3f3f46', text: '#71717a', dot: '#3f3f46' },
  regular:     { label: 'Cursando',   bg: '#431407', border: '#ea580c', text: '#fed7aa', dot: '#ea580c' },
  aprobada:    { label: 'Aprobada',   bg: '#052e16', border: '#16a34a', text: '#bbf7d0', dot: '#16a34a' },
  puedo_cursar:{ label: 'Disponible', bg: '#0f172a', border: '#3b82f6', text: '#bfdbfe', dot: '#3b82f6' },
};

export interface SubjectNodeData extends Record<string, unknown> {
  label: string;
  code: string;
  status: SubjectStatus;
  highlight?: HighlightType;
}

export type SubjectNodeType = Node<SubjectNodeData, 'subject'>;

function SubjectNodeFn(props: NodeProps<SubjectNodeType>) {
  const { data } = props;
  const cfg = STATUS[data.status];
  const hl = data.highlight ?? null;

  const hlBorder =
    hl === 'selected' ? '#60a5fa' :
    hl === 'prereq'   ? '#f59e0b' :
    hl === 'unlocked' ? '#22c55e' : null;

  return (
    <>
      <Handle type="target" position={Position.Top}
        style={{ width: 8, height: 8, background: 'transparent', border: 'none', top: -1 }} />

      <div
        style={{
          background: cfg.bg,
          border: `1.5px solid ${hlBorder ?? cfg.border}`,
          borderRadius: 8,
          padding: '6px 10px 7px',
          cursor: 'pointer',
          boxShadow: hlBorder
            ? `0 0 0 2px ${hlBorder}55, 0 3px 12px #00000060`
            : '0 2px 6px #00000050',
          transition: 'box-shadow .15s, border-color .15s',
          userSelect: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: hlBorder ?? cfg.dot, flexShrink: 0,
          }} />
          <span style={{
            fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.05em',
            color: hlBorder ?? cfg.dot, textTransform: 'uppercase',
          }}>
            {data.code}
          </span>
        </div>
        <div style={{
          fontSize: '0.72rem', fontWeight: 600, lineHeight: 1.3,
          color: cfg.text,
        }}>
          {data.label}
        </div>
        <div style={{
          fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.06em',
          textTransform: 'uppercase', color: cfg.dot, opacity: 0.8,
        }}>
          {cfg.label}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom}
        style={{ width: 8, height: 8, background: 'transparent', border: 'none', bottom: -1 }} />
    </>
  );
}

export const SubjectNode = memo(SubjectNodeFn);
