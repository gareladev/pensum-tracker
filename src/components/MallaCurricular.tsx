import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  type NodeMouseHandler,
  type NodeProps,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Locate, Plus, Minus } from 'lucide-react';
import type { Career, ProgressMap } from '../types';
import { getEffectiveProgress, nextStatus } from '../utils/curriculum';
import {
  getSubjectPositions,
  getSemesters,
  semesterLabel,
  NODE_W,
  NODE_H,
} from '../utils/layout';
import { SubjectNode } from './SubjectNode';
import type { SubjectNodeType, SubjectNodeData, HighlightType } from './SubjectNode';
import { useDevice } from '../hooks/useDevice';

// ─── Tipos de nodo ─────────────────────────────────────────────────────────
function SemLabelNode({ data }: { data: { label: string } }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.05em',
      color: '#52525b', textTransform: 'uppercase', pointerEvents: 'none',
    }}>
      {data.label}
    </div>
  );
}

const nodeTypes = {
  subject: SubjectNode as React.ComponentType<NodeProps<SubjectNodeType>>,
  semLabel: SemLabelNode as unknown as React.ComponentType<NodeProps>,
};

// ─── Constantes ─────────────────────────────────────────────────────────────
const ROW_H    = NODE_H + 90;
const LABEL_W  = 68;
const LABEL_X  = -LABEL_W - 14;
const MAX_PRE  = 10;

// ─── Estilos de aristas ─────────────────────────────────────────────────────
const mkEdge = (color: string, w: number, anim = false): Partial<Edge> => ({
  type: 'smoothstep',
  animated: anim,
  markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12, color },
  style: { stroke: color, strokeWidth: w },
});

const E_DEF    = mkEdge('#3f3f46', 1.5);
const E_PREREQ = mkEdge('#f59e0b', 2.5, true);
const E_UNLOCK = mkEdge('#22c55e', 2.5, true);

// ─── Build graph ─────────────────────────────────────────────────────────────
function buildGraph(career: Career, progress: ProgressMap, sel: string | null, nodeW: number) {
  const effective = getEffectiveProgress(career.subjects, progress);
  const positions = getSubjectPositions(career.subjects, nodeW);
  const semesters = getSemesters(career.subjects);
  const byId      = new Map(career.subjects.map((s) => [s.id, s]));
  const ids       = new Set(career.subjects.map((s) => s.id));

  const prereqsOfSel  = sel ? (byId.get(sel)?.prerequisites ?? []) : [];
  const unlockedBySel = sel ? career.subjects.filter((s) => s.prerequisites.includes(sel)).map((s) => s.id) : [];

  const labelNodes: Node[] = semesters.map((sem, i) => ({
    id: `__sem_${sem}`,
    type: 'semLabel',
    position: { x: LABEL_X, y: i * ROW_H },
    data: { label: semesterLabel(sem) },
    style: { width: LABEL_W, height: NODE_H, pointerEvents: 'none' },
    draggable: false, selectable: false,
  }));

  const subjectNodes: Node<SubjectNodeData>[] = career.subjects.map((s) => {
    let highlight: HighlightType = null;
    if (sel) {
      if (s.id === sel) highlight = 'selected';
      else if (prereqsOfSel.includes(s.id)) highlight = 'prereq';
      else if (unlockedBySel.includes(s.id)) highlight = 'unlocked';
    }
    return {
      id: s.id,
      type: 'subject',
      position: positions.get(s.id) ?? { x: 0, y: 0 },
      data: { label: s.name, code: s.id, status: effective[s.id] ?? 'pendiente', highlight },
      style: { width: nodeW },
      draggable: true,
    };
  });

  const edges: Edge[] = [];
  for (const s of career.subjects) {
    if (s.prerequisites.length > MAX_PRE) continue;
    for (const preId of s.prerequisites) {
      if (!ids.has(preId)) continue;
      const isPrereq  = sel !== null && s.id === sel;
      const isUnlocks = sel !== null && preId === sel;
      edges.push({
        id: `${preId}→${s.id}`,
        source: preId,
        target: s.id,
        ...(isPrereq ? E_PREREQ : isUnlocks ? E_UNLOCK : E_DEF),
      });
    }
  }

  return { nodes: [...labelNodes, ...subjectNodes], edges };
}

// ─── Inner (necesita ReactFlowProvider) ─────────────────────────────────────
type Props = {
  career: Career;
  progress: ProgressMap;
  onProgressChange: (id: string, status: import('../types').SubjectStatus) => void;
};

function MallaInner({ career, progress, onProgressChange }: Props) {
  const { isMobile, isTablet } = useDevice();
  const nodeW = isMobile ? 150 : isTablet ? 165 : NODE_W;
  const fitPad = isMobile ? 0.04 : isTablet ? 0.06 : 0.1;
  /* Zoom mínimo al encuadrar: así la malla no se ve tan pequeña (≥ 0.6 en desktop) */
  const fitMinZoom = isMobile ? 0.35 : isTablet ? 0.45 : 0.6;
  const fitMaxZoom = 1.2;

  const [sel, setSel] = useState<string | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { fitView, getViewport, setViewport } = useReactFlow();
  const MIN_ZOOM = 0.1;
  const MAX_ZOOM = 3;
  const ZOOM_STEP = 1.25;
  const prevCareerRef = useRef(career.id);

  useEffect(() => {
    const { nodes: n, edges: e } = buildGraph(career, progress, sel, nodeW);
    setNodes(n);
    setEdges(e);
  }, [career, progress, sel, nodeW, setNodes, setEdges]);

  // Fit cuando cambia la carrera (con mismo zoom mínimo para que se vea más grande)
  useEffect(() => {
    if (prevCareerRef.current !== career.id) {
      prevCareerRef.current = career.id;
      setSel(null);
      setTimeout(() => fitView({ padding: fitPad, minZoom: fitMinZoom, maxZoom: fitMaxZoom, duration: 400 }), 50);
    }
  }, [career.id, fitView, fitPad, fitMinZoom, fitMaxZoom]);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      if (node.type !== 'subject') return;
      setSel(node.id);
      const current = (node.data as SubjectNodeData).status;
      onProgressChange(node.id, nextStatus(current));
    },
    [onProgressChange]
  );

  const onPaneClick = useCallback(() => setSel(null), []);

  const handleFitView = useCallback(
    () => fitView({ padding: fitPad, minZoom: fitMinZoom, maxZoom: fitMaxZoom, duration: 400 }),
    [fitView, fitPad, fitMinZoom, fitMaxZoom]
  );

  const handleZoomIn = useCallback(() => {
    const { x, y, zoom } = getViewport();
    setViewport({ x, y, zoom: Math.min(MAX_ZOOM, zoom * ZOOM_STEP) }, { duration: 200 });
  }, [getViewport, setViewport]);

  const handleZoomOut = useCallback(() => {
    const { x, y, zoom } = getViewport();
    setViewport({ x, y, zoom: Math.max(MIN_ZOOM, zoom / ZOOM_STEP) }, { duration: 200 });
  }, [getViewport, setViewport]);

  return (
    <div className="malla-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: fitPad, minZoom: fitMinZoom, maxZoom: fitMaxZoom }}
        minZoom={0.1}
        maxZoom={3}
        panOnScroll={!isMobile}
        zoomOnScroll={!isMobile}
        zoomOnPinch
        panOnDrag
        preventScrolling
      >
        <Background color="#27272a" gap={32} size={1} />
        <Controls showInteractive={false} position="bottom-right" className="malla-controls" />
        {!isMobile && (
          <MiniMap
            style={{ background: '#18181b' }}
            maskColor="#0f0f1190"
            nodeColor={(n) => {
              const d = n.data as SubjectNodeData;
              return d.status === 'aprobada'    ? '#16a34a'
                : d.status === 'regular'        ? '#ea580c'
                : d.status === 'puedo_cursar'   ? '#3b82f6'
                : '#27272a';
            }}
          />
        )}
      </ReactFlow>

      {/* Controles de zoom: menos, más, recentrar */}
      <div className="malla-zoom-controls">
        <button type="button" className="malla-zoom-btn" onClick={handleZoomOut} title="Alejar (menos)">
          <Minus size={20} strokeWidth={2.5} />
        </button>
        <button type="button" className="malla-zoom-btn" onClick={handleZoomIn} title="Acercar (más)">
          <Plus size={20} strokeWidth={2.5} />
        </button>
        <button type="button" className="malla-zoom-btn malla-zoom-btn--fit" onClick={handleFitView} title="Ver toda la malla">
          <Locate size={18} />
        </button>
      </div>
    </div>
  );
}

// ─── Export con Provider ─────────────────────────────────────────────────────
export function MallaCurricular(props: Props) {
  return (
    <ReactFlowProvider>
      <MallaInner {...props} />
    </ReactFlowProvider>
  );
}
