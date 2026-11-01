"use client";

import * as React from "react";
import { MindMapNode } from "@/server/db/schemas";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Sparkles, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

interface RadialMindMapProps {
  data: { root: MindMapNode };
  materialTitle: string;
}

interface NodeLayout {
  id: string;
  name: string;
  description?: string;
  depth: number;
  x: number;
  y: number;
  parentX?: number;
  parentY?: number;
  angle: number;
}

export function RadialMindMap({ data, materialTitle }: RadialMindMapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = React.useState<NodeLayout | null>(null);
  const [hoveredNode, setHoveredNode] = React.useState<string | null>(null);

  const cx = 500;
  const cy = 380;
  const R1 = 185;
  const R2 = 315;

  // Compute node layouts
  const { nodes, links } = React.useMemo(() => {
    const root = data.root;
    if (!root) return { nodes: [], links: [] };

    const nodeList: NodeLayout[] = [];
    const linkList: { fromX: number; fromY: number; toX: number; toY: number; id: string }[] = [];

    // Root
    const rootLayout: NodeLayout = {
      id: "root",
      name: root.name || materialTitle,
      description: root.description,
      depth: 0,
      x: cx,
      y: cy,
      angle: 0,
    };
    nodeList.push(rootLayout);

    const branches = root.children || [];
    const N = branches.length;

    branches.forEach((b, i) => {
      // Primary angle distributed around circle
      const angle = (2 * Math.PI * i) / Math.max(N, 1) - Math.PI / 2;
      const bx = cx + R1 * Math.cos(angle);
      const by = cy + R1 * Math.sin(angle);
      const branchId = `b-${i}`;

      const bLayout: NodeLayout = {
        id: branchId,
        name: b.name,
        description: b.description,
        depth: 1,
        x: bx,
        y: by,
        parentX: cx,
        parentY: cy,
        angle,
      };
      nodeList.push(bLayout);

      linkList.push({
        id: `link-root-${branchId}`,
        fromX: cx,
        fromY: cy,
        toX: bx,
        toY: by,
      });

      // Sub-branches
      const subBranches = b.children || [];
      const M = subBranches.length;
      if (M > 0) {
        const sectorWidth = (2 * Math.PI) / Math.max(N, 1);
        const spread = sectorWidth * 0.72;

        subBranches.forEach((sub, j) => {
          const subAngle =
            M === 1
              ? angle
              : angle - spread / 2 + (spread * j) / (M - 1);

          const sx = cx + R2 * Math.cos(subAngle);
          const sy = cy + R2 * Math.sin(subAngle);
          const subId = `sub-${i}-${j}`;

          nodeList.push({
            id: subId,
            name: sub.name,
            description: sub.description,
            depth: 2,
            x: sx,
            y: sy,
            parentX: bx,
            parentY: by,
            angle: subAngle,
          });

          linkList.push({
            id: `link-${branchId}-${subId}`,
            fromX: bx,
            fromY: by,
            toX: sx,
            toY: sy,
          });
        });
      }
    });

    return { nodes: nodeList, links: linkList };
  }, [data, materialTitle]);

  // Pan controls
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.min(2.2, Math.max(0.5, prev + delta)));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
  };

  return (
    <div className="relative flex flex-col rounded-[24px] border border-gold/20 bg-deep/90 shadow-astral overflow-hidden">
      {/* Mind map Header / Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-gold/15 bg-veil/40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-gold animate-twinkle" />
          <span className="font-mono text-xs uppercase tracking-widest text-gold-soft">
            Celestial Radial Mind Map
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-deep/80 border border-gold/20 rounded-xl p-1">
          <button
            onClick={() => handleZoom(0.15)}
            className="p-1.5 text-mist hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(-0.15)}
            className="p-1.5 text-mist hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetView}
            className="p-1.5 text-mist hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-gold/20 mx-1" />
          <span className="text-[11px] font-mono text-mist px-2">
            {Math.round(zoom * 100)}%
          </span>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={cn(
          "relative h-[580px] w-full overflow-hidden select-none cursor-grab active:cursor-grabbing",
          "bg-gradient-to-b from-void/80 via-deep/60 to-void/90"
        )}
      >
        <svg
          viewBox="0 0 1000 760"
          className="w-full h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.15s ease-out",
          }}
        >
          <defs>
            {/* Glow Filter */}
            <filter id="celestial-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Radial background grid */}
            <radialGradient id="hub-gradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#E6AF2E" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#8A6B29" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#0B0D14" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Concentric Guide Orbits */}
          <circle cx={cx} cy={cy} r={R1} stroke="#E6AF2E" strokeOpacity="0.1" strokeDasharray="4 6" fill="none" />
          <circle cx={cx} cy={cy} r={R2} stroke="#E6AF2E" strokeOpacity="0.07" strokeDasharray="4 8" fill="none" />
          <circle cx={cx} cy={cy} r={R2 + 45} stroke="#E6AF2E" strokeOpacity="0.04" fill="none" />

          {/* Links between stars */}
          {links.map((link) => {
            const isHovered =
              hoveredNode &&
              (link.id.includes(hoveredNode) || selectedNode?.id === hoveredNode);
            // Smooth celestial curve
            const midX = (link.fromX + link.toX) / 2;
            const midY = (link.fromY + link.toY) / 2;
            // Bend slightly towards center
            const bendFactor = 0.15;
            const cpx = midX + (cx - midX) * bendFactor;
            const cpy = midY + (cy - midY) * bendFactor;

            return (
              <path
                key={link.id}
                d={`M ${link.fromX} ${link.fromY} Q ${cpx} ${cpy} ${link.toX} ${link.toY}`}
                fill="none"
                stroke={isHovered ? "#E6AF2E" : "#8A6B29"}
                strokeOpacity={isHovered ? 0.9 : 0.3}
                strokeWidth={isHovered ? 2 : 1.2}
                strokeDasharray={isHovered ? "none" : "2 2"}
                className="transition-all duration-300"
              />
            );
          })}

          {/* Star Nodes */}
          {nodes.map((node) => {
            const isRoot = node.depth === 0;
            const isBranch = node.depth === 1;
            const isSelected = selectedNode?.id === node.id;
            const isHovered = hoveredNode === node.id;

            const radius = isRoot ? 36 : isBranch ? 22 : 14;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode(node);
                }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer group"
              >
                {/* Glow ring on hover/select */}
                {(isSelected || isHovered) && (
                  <circle
                    r={radius + 8}
                    fill="none"
                    stroke="#E6AF2E"
                    strokeWidth="1.5"
                    strokeOpacity="0.6"
                    className="animate-pulse"
                  />
                )}

                {/* Main node circle */}
                <circle
                  r={radius}
                  fill={isRoot ? "#121624" : isBranch ? "#151B2E" : "#0D111D"}
                  stroke={isSelected || isHovered ? "#E6AF2E" : isRoot ? "#E6AF2E" : isBranch ? "#A37D2C" : "#4A5568"}
                  strokeWidth={isRoot ? 2.5 : isSelected ? 2 : 1.5}
                  filter={isSelected || isHovered || isRoot ? "url(#celestial-glow)" : undefined}
                  className="transition-all duration-200"
                />

                {/* Inner star point */}
                <circle
                  r={isRoot ? 6 : isBranch ? 4 : 2.5}
                  fill={isRoot ? "#E6AF2E" : isBranch ? "#F2D06B" : "#A37D2C"}
                />

                {/* Label text */}
                <text
                  x={0}
                  y={isRoot ? radius + 18 : node.y > cy ? radius + 14 : -radius - 8}
                  textAnchor="middle"
                  className={cn(
                    "font-manrope select-none transition-colors",
                    isRoot
                      ? "text-xs font-semibold fill-ivory font-fraunces tracking-wide"
                      : isBranch
                      ? "text-[11px] font-medium fill-ivory"
                      : "text-[10px] fill-mist group-hover:fill-gold"
                  )}
                  style={{
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.8))",
                  }}
                >
                  {node.name.length > 20 ? node.name.slice(0, 18) + "…" : node.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating guidance overlay */}
        <div className="absolute bottom-4 left-6 pointer-events-none text-[11px] font-mono text-mist/60 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-gold/60" />
          <span>Click any star to inspect • Drag canvas to pan</span>
        </div>
      </div>

      {/* Selected Node Drawer / Info Card */}
      {selectedNode && (
        <div className="border-t border-gold/20 bg-veil/80 p-5 backdrop-blur-md transition-all duration-300">
          <div className="flex items-start justify-between gap-4 max-w-3xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-gold-soft">
                  {selectedNode.depth === 0
                    ? "Core Theme"
                    : selectedNode.depth === 1
                    ? "Primary Constellation"
                    : "Satellite Insight"}
                </span>
              </div>
              <h4 className="font-fraunces text-lg text-ivory font-normal">
                {selectedNode.name}
              </h4>
              {selectedNode.description && (
                <p className="font-manrope text-sm text-mist leading-relaxed pt-1">
                  {selectedNode.description}
                </p>
              )}
            </div>

            <button
              onClick={() => setSelectedNode(null)}
              className="text-xs font-mono text-mist hover:text-gold px-2.5 py-1 rounded-lg border border-gold/20 hover:border-gold/40 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
