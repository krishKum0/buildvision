'use client';

import React from 'react';
import type { Room, Window as WindowItem } from '@/lib/floor-plan/types';
import { useEditorStore } from '@/lib/floor-plan/store';

interface WindowShapeProps {
  window: WindowItem;
  room: Room;
  scale: number;
  selected: boolean;
}

/**
 * Render a window as a thin white gap with two parallel lines (the glass panes).
 */
export const WindowShape: React.FC<WindowShapeProps> = ({ window: win, room, scale, selected }) => {
  const updateWindow = useEditorStore((s) => s.updateWindow);
  const setSelection = useEditorStore((s) => s.setSelection);

  const w = win.width * scale;
  const wallT = 8;

  let cx: number;
  let cy: number;
  let isHorizontal = false;
  switch (win.edge) {
    case 0:
      cx = (room.x + win.offset * room.width) * scale;
      cy = room.y * scale;
      isHorizontal = true;
      break;
    case 1:
      cx = (room.x + room.width) * scale;
      cy = (room.y + win.offset * room.height) * scale;
      isHorizontal = false;
      break;
    case 2:
      cx = (room.x + win.offset * room.width) * scale;
      cy = (room.y + room.height) * scale;
      isHorizontal = true;
      break;
    case 3:
      cx = room.x * scale;
      cy = (room.y + win.offset * room.height) * scale;
      isHorizontal = false;
      break;
  }

  const x = isHorizontal ? cx - w / 2 : cx - wallT / 2;
  const y = isHorizontal ? cy - wallT / 2 : cy - w / 2;
  const width = isHorizontal ? w : wallT;
  const height = isHorizontal ? wallT : w;

  return (
    <g
      data-window-id={win.id}
      className="cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        setSelection({ kind: 'window', id: win.id });
      }}
    >
      {/* white gap */}
      <rect x={x} y={y} width={width} height={height} fill="#ffffff" />
      {/* two parallel lines representing glass */}
      {isHorizontal ? (
        <>
          <line x1={x} y1={cy - 1.5} x2={x + w} y2={cy - 1.5} stroke="#0ea5e9" strokeWidth={1.2} />
          <line x1={x} y1={cy + 1.5} x2={x + w} y2={cy + 1.5} stroke="#0ea5e9" strokeWidth={1.2} />
        </>
      ) : (
        <>
          <line x1={cx - 1.5} y1={y} x2={cx - 1.5} y2={y + w} stroke="#0ea5e9" strokeWidth={1.2} />
          <line x1={cx + 1.5} y1={y} x2={cx + 1.5} y2={y + w} stroke="#0ea5e9" strokeWidth={1.2} />
        </>
      )}
      {selected && (
        <rect
          x={x - 2}
          y={y - 2}
          width={width + 4}
          height={height + 4}
          fill="none"
          stroke="#0f172a"
          strokeDasharray="4 3"
          strokeWidth={1}
        />
      )}
      {/* drag handle */}
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill={selected ? '#0f172a' : '#0ea5e9'}
        stroke="#fff"
        strokeWidth={1}
        style={{ cursor: 'pointer' }}
        onMouseDown={(e) => onDragWindow(e, win, room, scale, updateWindow)}
      />
    </g>
  );
};

function onDragWindow(
  e: React.MouseEvent,
  win: WindowItem,
  room: Room,
  scale: number,
  updateWindow: (id: string, patch: Partial<WindowItem>) => void
) {
  e.stopPropagation();
  e.preventDefault();
  const startX = e.clientX;
  const startY = e.clientY;
  const startOffset = win.offset;
  const move = (ev: MouseEvent) => {
    const dx = (ev.clientX - startX) / scale;
    const dy = (ev.clientY - startY) / scale;
    let delta = 0;
    if (win.edge === 0 || win.edge === 2) {
      delta = dx / room.width;
    } else {
      delta = dy / room.height;
    }
    let next = startOffset + delta;
    next = Math.max(0.05, Math.min(0.95, next));
    next = Math.round(next * 100) / 100;
    updateWindow(win.id, { offset: next });
  };
  const up = () => {
    window.removeEventListener('mousemove', move);
    window.removeEventListener('mouseup', up);
  };
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', up);
}
