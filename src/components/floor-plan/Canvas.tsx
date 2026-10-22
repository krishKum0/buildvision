'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEditorStore } from '@/lib/floor-plan/store';
import { formatLength } from '@/lib/floor-plan/constants';
import { RoomShape, RoomResizeHandles } from './RoomShape';
import { DoorShape } from './DoorShape';
import { WindowShape } from './WindowShape';
import { FurnitureShape } from './FurnitureShape';
import type { Edge } from '@/lib/floor-plan/types';

export const Canvas: React.FC = () => {
  const plan = useEditorStore((s) => s.plan);
  const view = useEditorStore((s) => s.view);
  const selection = useEditorStore((s) => s.selection);
  const mode = useEditorStore((s) => s.mode);
  const setView = useEditorStore((s) => s.setView);
  const zoomBy = useEditorStore((s) => s.zoomBy);
  const resetView = useEditorStore((s) => s.resetView);
  const setSelection = useEditorStore((s) => s.setSelection);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const setMode = useEditorStore((s) => s.setMode);
  const setPendingRoomType = useEditorStore((s) => s.setPendingRoomType);
  const setPendingFurnitureType = useEditorStore((s) => s.setPendingFurnitureType);
  const pendingRoomType = useEditorStore((s) => s.pendingRoomType);
  const pendingFurnitureType = useEditorStore((s) => s.pendingFurnitureType);
  const addRoom = useEditorStore((s) => s.addRoom);
  const addFurniture = useEditorStore((s) => s.addFurniture);
  const addDoor = useEditorStore((s) => s.addDoor);
  const addWindow = useEditorStore((s) => s.addWindow);

  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  // Track container size
  useEffect(() => {
    if (!svgRef.current) return;
    const el = svgRef.current.parentElement;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setSize({ w: rect.width, h: rect.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Auto-fit on first load and on plan change
  const firstFit = useRef(true);
  useEffect(() => {
    if (!svgRef.current || size.w < 100) return;
    if (!firstFit.current) return;
    firstFit.current = false;
    const fitScale = Math.min(
      (size.w - 80) / plan.landWidth,
      (size.h - 80) / plan.landDepth,
      40
    );
    const sc = Math.max(4, fitScale);
    setView({
      scale: sc,
      offsetX: 40,
      offsetY: 40,
    });
  }, [size.w, size.h, plan.landWidth, plan.landDepth, setView]);

  // Convert client coords -> plan units (world coords)
  const clientToWorld = useCallback(
    (clientX: number, clientY: number) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      return {
        x: (px - view.offsetX) / view.scale,
        y: (py - view.offsetY) / view.scale,
      };
    },
    [view]
  );

  // Mouse wheel = zoom
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    zoomBy(factor, cx, cy);
  };

  // Pan with space+drag or middle mouse
  const onMouseDown = (e: React.MouseEvent) => {
    // Middle mouse OR space-pan
    if (e.button === 1 || (e.button === 0 && mode === 'pan')) {
      setIsPanning(true);
      panStart.current = {
        x: e.clientX,
        y: e.clientY,
        ox: view.offsetX,
        oy: view.offsetY,
      };
      e.preventDefault();
      return;
    }

    // Click on empty canvas -> deselect + place element if in add-mode
    const target = e.target as Element;
    const isSvgBackground = target.tagName === 'rect' && target.getAttribute('data-bg') === 'true';
    if (target === e.currentTarget || isSvgBackground) {
      const world = clientToWorld(e.clientX, e.clientY);

      if (mode === 'add-room' && pendingRoomType) {
        // Add a room of default size at the click position
        import('@/lib/floor-plan/constants').then(({ ROOM_CONFIG, DEFAULT_DOOR_WIDTH }) => {
          const cfg = ROOM_CONFIG[pendingRoomType!];
          const w = cfg.defaultSize.w;
          const h = cfg.defaultSize.h;
          addRoom({
            type: pendingRoomType!,
            name: cfg.label,
            x: Math.round(world.x * 2) / 2,
            y: Math.round(world.y * 2) / 2,
            width: w,
            height: h,
            color: cfg.color,
          });
          setMode('select');
          setPendingRoomType(undefined);
          void DEFAULT_DOOR_WIDTH;
        });
        return;
      }

      if (mode === 'add-furniture' && pendingFurnitureType) {
        import('@/lib/floor-plan/constants').then(({ FURNITURE_CONFIG }) => {
          const cfg = FURNITURE_CONFIG[pendingFurnitureType!];
          addFurniture({
            type: pendingFurnitureType!,
            roomId: '',
            x: Math.round(world.x * 2) / 2,
            y: Math.round(world.y * 2) / 2,
            width: cfg.defaultSize.w,
            height: cfg.defaultSize.h,
            rotation: 0,
          });
          setMode('select');
          setPendingFurnitureType(undefined);
        });
        return;
      }

      clearSelection();
    }
  };

  useEffect(() => {
    if (!isPanning) return;
    const move = (e: MouseEvent) => {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setView({ offsetX: panStart.current.ox + dx, offsetY: panStart.current.oy + dy });
    };
    const up = () => setIsPanning(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [isPanning, setView]);

  // Find room containing a world point (for add-door / add-window placement)
  const findRoomAt = (wx: number, wy: number) => {
    return plan.rooms.find(
      (r) => wx >= r.x && wx <= r.x + r.width && wy >= r.y && wy <= r.y + r.height
    );
  };

  // Determine which edge of the room the point is closest to
  const closestEdge = (r: { x: number; y: number; width: number; height: number }, wx: number, wy: number): Edge => {
    const dTop = Math.abs(wy - r.y);
    const dBot = Math.abs(wy - (r.y + r.height));
    const dLeft = Math.abs(wx - r.x);
    const dRight = Math.abs(wx - (r.x + r.width));
    const min = Math.min(dTop, dBot, dLeft, dRight);
    if (min === dTop) return 0;
    if (min === dRight) return 1;
    if (min === dBot) return 2;
    return 3;
  };

  // Compute offset along edge for add-door/add-window
  const computeOffset = (r: { x: number; y: number; width: number; height: number }, edge: Edge, wx: number, wy: number) => {
    if (edge === 0 || edge === 2) {
      return Math.max(0.1, Math.min(0.9, (wx - r.x) / r.width));
    }
    return Math.max(0.1, Math.min(0.9, (wy - r.y) / r.height));
  };

  const onCanvasClick = (e: React.MouseEvent) => {
    if (mode === 'add-door' || mode === 'add-window') {
      const world = clientToWorld(e.clientX, e.clientY);
      const room = findRoomAt(world.x, world.y);
      if (!room) {
        // try nearest room within 2 units
        return;
      }
      const edge = closestEdge(room, world.x, world.y);
      const offset = computeOffset(room, edge, world.x, world.y);
      if (mode === 'add-door') {
        addDoor({
          roomId: room.id,
          edge,
          offset,
          width: 3,
          swing: 'in-left',
        });
      } else {
        addWindow({
          roomId: room.id,
          edge,
          offset,
          width: 4,
          sillHeight: 3,
        });
      }
      setMode('select');
    }
  };

  // Total SVG content width (plot + margins)
  const plotW = plan.landWidth * view.scale;
  const plotH = plan.landDepth * view.scale;
  const plotX = view.offsetX;
  const plotY = view.offsetY;

  // Build grid lines (every 1 unit)
  const gridLines: React.ReactNode[] = [];
  for (let i = 0; i <= plan.landWidth; i++) {
    const x = plotX + i * view.scale;
    if (x > -10 && x < size.w + 10) {
      gridLines.push(
        <line
          key={`gv${i}`}
          x1={x}
          y1={Math.max(0, plotY)}
          x2={x}
          y2={Math.min(size.h, plotY + plotH)}
          stroke={i % 5 === 0 ? '#e2e8f0' : '#f1f5f9'}
          strokeWidth={i % 5 === 0 ? 0.8 : 0.4}
          pointerEvents="none"
        />
      );
    }
  }
  for (let j = 0; j <= plan.landDepth; j++) {
    const y = plotY + j * view.scale;
    if (y > -10 && y < size.h + 10) {
      gridLines.push(
        <line
          key={`gh${j}`}
          x1={Math.max(0, plotX)}
          y1={y}
          x2={Math.min(size.w, plotX + plotW)}
          y2={y}
          stroke={j % 5 === 0 ? '#e2e8f0' : '#f1f5f9'}
          strokeWidth={j % 5 === 0 ? 0.8 : 0.4}
          pointerEvents="none"
        />
      );
    }
  }

  // Selected room for resize handles
  const selectedRoom =
    selection.kind === 'room' && selection.id
      ? plan.rooms.find((r) => r.id === selection.id)
      : null;

  // Dimension labels (outer)
  const dimFont = Math.max(9, view.scale * 0.7);

  return (
    <div className="relative w-full h-full bg-slate-50 overflow-hidden">
      <svg
        ref={svgRef}
        id="floor-plan-canvas"
        width={size.w}
        height={size.h}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onClick={onCanvasClick}
        style={{ cursor: isPanning ? 'grabbing' : mode === 'pan' ? 'grab' : 'default', display: 'block' }}
      >
        {/* background */}
        <rect data-bg="true" x={0} y={0} width={size.w} height={size.h} fill="#f8fafc" />

        {/* grid */}
        {gridLines}

        {/* plot boundary + setback */}
        <rect
          x={plotX}
          y={plotY}
          width={plotW}
          height={plotH}
          fill="#ffffff"
          stroke="#0f172a"
          strokeWidth={2.5}
        />

        {/* setback margin (visual only) */}
        <rect
          x={plotX + 0.5 * view.scale}
          y={plotY + 0.5 * view.scale}
          width={Math.max(0, plotW - 1 * view.scale)}
          height={Math.max(0, plotH - 1 * view.scale)}
          fill="none"
          stroke="#cbd5e1"
          strokeWidth={0.8}
          strokeDasharray="4 4"
          pointerEvents="none"
        />

        {/* rooms */}
        <g transform={`translate(${view.offsetX} ${view.offsetY})`}>
          {plan.rooms.map((r) => (
            <RoomShape
              key={r.id}
              room={r}
              scale={view.scale}
              selected={selection.kind === 'room' && selection.id === r.id}
              showLabel={view.scale >= 6}
            />
          ))}
        </g>

        {/* resize handles for selected room (in screen coords because handles use SVG-space) */}
        {selectedRoom && (
          <g transform={`translate(${view.offsetX} ${view.offsetY})`}>
            <RoomResizeHandles room={selectedRoom} scale={view.scale} />
          </g>
        )}

        {/* doors + windows + furniture (in screen coords because they use absolute positions) */}
        <g transform={`translate(${view.offsetX} ${view.offsetY})`}>
          {plan.windows.map((w) => {
            const room = plan.rooms.find((r) => r.id === w.roomId);
            if (!room) return null;
            return (
              <WindowShape
                key={w.id}
                window={w}
                room={room}
                scale={view.scale}
                selected={selection.kind === 'window' && selection.id === w.id}
              />
            );
          })}
          {plan.doors.map((d) => {
            const room = plan.rooms.find((r) => r.id === d.roomId);
            if (!room) return null;
            return (
              <DoorShape
                key={d.id}
                door={d}
                room={room}
                scale={view.scale}
                selected={selection.kind === 'door' && selection.id === d.id}
              />
            );
          })}
          {plan.furniture.map((f) => (
            <FurnitureShape
              key={f.id}
              item={f}
              scale={view.scale}
              selected={selection.kind === 'furniture' && selection.id === f.id}
            />
          ))}
        </g>

        {/* dimension labels: top width, left depth */}
        <text
          x={plotX + plotW / 2}
          y={plotY - 8}
          textAnchor="middle"
          fontSize={dimFont + 2}
          fontWeight={700}
          fill="#0f172a"
          pointerEvents="none"
        >
          {formatLength(plan.landWidth, plan.unit)}  (width)
        </text>
        <text
          x={plotX - 8}
          y={plotY + plotH / 2}
          textAnchor="middle"
          fontSize={dimFont + 2}
          fontWeight={700}
          fill="#0f172a"
          transform={`rotate(-90 ${plotX - 8} ${plotY + plotH / 2})`}
          pointerEvents="none"
        >
          {formatLength(plan.landDepth, plan.unit)}  (depth)
        </text>

        {/* compass (top right corner of plot) */}
        <g transform={`translate(${plotX + plotW + 24} ${plotY + 24})`} pointerEvents="none">
          <circle r={20} fill="#ffffff" stroke="#0f172a" strokeWidth={1.5} />
          <polygon points="0,-16 5,4 0,0 -5,4" fill="#dc2626" />
          <polygon points="0,16 5,-4 0,0 -5,-4" fill="#0f172a" />
          <text y={-22} textAnchor="middle" fontSize={10} fontWeight={700} fill="#0f172a">N</text>
        </g>
      </svg>

      {/* zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 bg-white border border-slate-200 rounded-md shadow-sm p-1">
        <button
          className="w-9 h-9 rounded hover:bg-slate-100 flex items-center justify-center text-slate-700"
          title="Zoom in"
          onClick={() => zoomBy(1.2, size.w / 2, size.h / 2)}
        >
          +
        </button>
        <button
          className="w-9 h-9 rounded hover:bg-slate-100 flex items-center justify-center text-slate-700"
          title="Zoom out"
          onClick={() => zoomBy(0.83, size.w / 2, size.h / 2)}
        >
          −
        </button>
        <button
          className="w-9 h-9 rounded hover:bg-slate-100 flex items-center justify-center text-xs text-slate-700"
          title="Reset view"
          onClick={resetView}
        >
          1:1
        </button>
      </div>

      {/* mode indicator */}
      {mode !== 'select' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-full shadow-md flex items-center gap-2">
          <span className="font-medium">
            {mode === 'pan' && 'Pan mode (drag to move canvas)'}
            {mode === 'add-room' && 'Click on canvas to place room'}
            {mode === 'add-door' && 'Click inside a room near a wall to place door'}
            {mode === 'add-window' && 'Click inside a room near a wall to place window'}
            {mode === 'add-furniture' && 'Click on canvas to place furniture'}
          </span>
          <button
            className="ml-2 bg-white/20 hover:bg-white/30 px-1.5 py-0.5 rounded"
            onClick={() => {
              setMode('select');
              setPendingRoomType(undefined);
              setPendingFurnitureType(undefined);
            }}
          >
            ESC
          </button>
        </div>
      )}
    </div>
  );
};
