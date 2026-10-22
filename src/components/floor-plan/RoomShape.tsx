'use client';

import React from 'react';
import type { Room } from '@/lib/floor-plan/types';
import { ROOM_CONFIG } from '@/lib/floor-plan/constants';
import { useEditorStore } from '@/lib/floor-plan/store';

interface RoomShapeProps {
  room: Room;
  scale: number; // px per plan unit
  selected: boolean;
  showLabel: boolean;
}

/**
 * Renders a single room as an SVG group:
 *  - pastel fill
 *  - thick border (walls)
 *  - label centered
 *  - dimension text below name
 */
export const RoomShape: React.FC<RoomShapeProps> = ({ room, scale, selected, showLabel }) => {
  const cfg = ROOM_CONFIG[room.type];
  const setSelection = useEditorStore((s) => s.setSelection);

  const x = room.x * scale;
  const y = room.y * scale;
  const w = room.width * scale;
  const h = room.height * scale;

  // Show label only if the room is big enough in screen space
  const labelVisible = showLabel && w >= 40 && h >= 30;
  const dimVisible = showLabel && w >= 60 && h >= 50;

  return (
    <g
      data-room-id={room.id}
      className="cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        setSelection({ kind: 'room', id: room.id });
      }}
    >
      {/* fill */}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill={room.color}
        stroke={cfg.borderColor}
        strokeWidth={selected ? 4 : 6}
        strokeOpacity={selected ? 1 : 0.85}
      />
      {/* selection highlight (inner dashed) */}
      {selected && (
        <rect
          x={x + 2}
          y={y + 2}
          width={Math.max(0, w - 4)}
          height={Math.max(0, h - 4)}
          fill="none"
          stroke="#0f172a"
          strokeDasharray="6 4"
          strokeWidth={1.5}
        />
      )}
      {labelVisible && (
        <text
          x={x + w / 2}
          y={y + h / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={Math.min(13, Math.max(8, scale * 0.95))}
          fontWeight={600}
          fill="#1f2937"
          pointerEvents="none"
          style={{ userSelect: 'none' }}
        >
          {room.name}
        </text>
      )}
      {dimVisible && (
        <text
          x={x + w / 2}
          y={y + h / 2 + Math.min(15, scale * 1.1)}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={Math.min(10, Math.max(7, scale * 0.75))}
          fill="#475569"
          pointerEvents="none"
          style={{ userSelect: 'none' }}
        >
          {room.width}&apos; × {room.height}&apos;
        </text>
      )}
    </g>
  );
};

interface RoomResizeHandleProps {
  room: Room;
  scale: number;
  handleSize?: number;
}

export const RoomResizeHandles: React.FC<RoomResizeHandleProps> = ({ room, scale, handleSize = 8 }) => {
  const updateRoom = useEditorStore((s) => s.updateRoom);

  const x = room.x * scale;
  const y = room.y * scale;
  const w = room.width * scale;
  const h = room.height * scale;

  const onDrag = (e: React.MouseEvent, kind: 'move' | 'nw' | 'ne' | 'sw' | 'se') => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const start = { x: room.x, y: room.y, w: room.width, h: room.height };

    const move = (ev: MouseEvent) => {
      const dx = (ev.clientX - startX) / scale;
      const dy = (ev.clientY - startY) / scale;
      if (kind === 'move') {
        updateRoom(room.id, {
          x: Math.round((start.x + dx) * 2) / 2,
          y: Math.round((start.y + dy) * 2) / 2,
        });
        return;
      }
      let nx = start.x;
      let ny = start.y;
      let nw = start.w;
      let nh = start.h;
      if (kind === 'nw') {
        nx = start.x + dx;
        ny = start.y + dy;
        nw = start.w - dx;
        nh = start.h - dy;
      } else if (kind === 'ne') {
        ny = start.y + dy;
        nw = start.w + dx;
        nh = start.h - dy;
      } else if (kind === 'sw') {
        nx = start.x + dx;
        nw = start.w - dx;
        nh = start.h + dy;
      } else if (kind === 'se') {
        nw = start.w + dx;
        nh = start.h + dy;
      }
      // snap to 0.5
      nx = Math.round(nx * 2) / 2;
      ny = Math.round(ny * 2) / 2;
      nw = Math.round(nw * 2) / 2;
      nh = Math.round(nh * 2) / 2;
      // minimums
      const minW = ROOM_CONFIG[room.type].minSize.w;
      const minH = ROOM_CONFIG[room.type].minSize.h;
      if (nw < minW) {
        if (kind === 'nw' || kind === 'sw') nx = start.x + start.w - minW;
        nw = minW;
      }
      if (nh < minH) {
        if (kind === 'nw' || kind === 'ne') ny = start.y + start.h - minH;
        nh = minH;
      }
      updateRoom(room.id, { x: nx, y: ny, width: nw, height: nh });
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const handleStyle: React.CSSProperties = {
    fill: '#0f172a',
    stroke: '#fff',
    strokeWidth: 1.5,
    cursor: 'pointer',
  };

  return (
    <g pointerEvents="all">
      {/* move handle on top center */}
      <rect
        x={x + w / 2 - handleSize / 2}
        y={y - handleSize / 2 - 4}
        width={handleSize}
        height={handleSize}
        rx={2}
        style={{ ...handleStyle, cursor: 'move' }}
        onMouseDown={(e) => onDrag(e, 'move')}
      />
      {/* corner handles */}
      <rect
        x={x - handleSize / 2}
        y={y - handleSize / 2}
        width={handleSize}
        height={handleSize}
        rx={2}
        style={{ ...handleStyle, cursor: 'nwse-resize' }}
        onMouseDown={(e) => onDrag(e, 'nw')}
      />
      <rect
        x={x + w - handleSize / 2}
        y={y - handleSize / 2}
        width={handleSize}
        height={handleSize}
        rx={2}
        style={{ ...handleStyle, cursor: 'nesw-resize' }}
        onMouseDown={(e) => onDrag(e, 'ne')}
      />
      <rect
        x={x - handleSize / 2}
        y={y + h - handleSize / 2}
        width={handleSize}
        height={handleSize}
        rx={2}
        style={{ ...handleStyle, cursor: 'nesw-resize' }}
        onMouseDown={(e) => onDrag(e, 'sw')}
      />
      <rect
        x={x + w - handleSize / 2}
        y={y + h - handleSize / 2}
        width={handleSize}
        height={handleSize}
        rx={2}
        style={{ ...handleStyle, cursor: 'nwse-resize' }}
        onMouseDown={(e) => onDrag(e, 'se')}
      />
    </g>
  );
};
