'use client';

import React from 'react';
import type { Door, Room } from '@/lib/floor-plan/types';
import { useEditorStore } from '@/lib/floor-plan/store';

interface DoorShapeProps {
  door: Door;
  room: Room;
  scale: number;
  selected: boolean;
}

/**
 * Edge convention:
 *   0 = top, 1 = right, 2 = bottom, 3 = left
 * offset = 0..1 along the edge (center of opening)
 */
export const DoorShape: React.FC<DoorShapeProps> = ({ door, room, scale, selected }) => {
  const updateDoor = useEditorStore((s) => s.updateDoor);
  const setSelection = useEditorStore((s) => s.setSelection);

  const w = door.width * scale;
  const wallT = 8;

  // Center of the opening along the edge
  let cx: number;
  let cy: number;
  let isHorizontal: boolean;

  switch (door.edge) {
    case 0:
      cx = (room.x + door.offset * room.width) * scale;
      cy = room.y * scale;
      isHorizontal = true;
      break;
    case 1:
      cx = (room.x + room.width) * scale;
      cy = (room.y + door.offset * room.height) * scale;
      isHorizontal = false;
      break;
    case 2:
      cx = (room.x + door.offset * room.width) * scale;
      cy = (room.y + room.height) * scale;
      isHorizontal = true;
      break;
    default: // 3
      cx = room.x * scale;
      cy = (room.y + door.offset * room.height) * scale;
      isHorizontal = false;
      break;
  }

  const openingX = isHorizontal ? cx - w / 2 : cx - wallT / 2;
  const openingY = isHorizontal ? cy - wallT / 2 : cy - w / 2;
  const openingW = isHorizontal ? w : wallT;
  const openingH = isHorizontal ? wallT : w;

  // Swing quadrant: hinge + perpendicular door panel + arc
  const inward = door.swing.startsWith('in');
  const right = door.swing.endsWith('right');
  const dir = inward ? 1 : -1; // direction perpendicular to wall (1 = into room)

  // hinge is at one end of the opening. right=true -> hinge is on the right/bottom end
  let hingeX: number;
  let hingeY: number;
  let panelEndX: number;
  let panelEndY: number;
  let arcEndX: number;
  let arcEndY: number;
  let sweep: 0 | 1;

  if (door.edge === 0) {
    // top wall, room is below (inward dir = +Y)
    hingeX = right ? cx + w / 2 : cx - w / 2;
    hingeY = cy;
    // door panel goes perpendicular into the room
    panelEndX = hingeX;
    panelEndY = cy + dir * w;
    // arc from panelEnd back to the other end of the opening
    arcEndX = cx - (right ? w / 2 : -w / 2);
    arcEndY = cy;
    sweep = right ? 0 : 1;
  } else if (door.edge === 2) {
    // bottom wall, room is above (inward dir = -Y)
    hingeX = right ? cx + w / 2 : cx - w / 2;
    hingeY = cy;
    panelEndX = hingeX;
    panelEndY = cy - dir * w;
    arcEndX = cx - (right ? w / 2 : -w / 2);
    arcEndY = cy;
    sweep = right ? 1 : 0;
  } else if (door.edge === 1) {
    // right wall, room is to the left (inward dir = -X)
    hingeX = cx;
    hingeY = right ? cy + w / 2 : cy - w / 2;
    panelEndX = cx - dir * w;
    panelEndY = hingeY;
    arcEndX = cx;
    arcEndY = cy - (right ? w / 2 : -w / 2);
    sweep = right ? 1 : 0;
  } else {
    // left wall, room is to the right (inward dir = +X)
    hingeX = cx;
    hingeY = right ? cy + w / 2 : cy - w / 2;
    panelEndX = cx + dir * w;
    panelEndY = hingeY;
    arcEndX = cx;
    arcEndY = cy - (right ? w / 2 : -w / 2);
    sweep = right ? 0 : 1;
  }

  const r = w; // arc radius = door width

  return (
    <g
      data-door-id={door.id}
      className="cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        setSelection({ kind: 'door', id: door.id });
      }}
    >
      {/* opening (white gap in the wall) */}
      <rect
        x={openingX}
        y={openingY}
        width={openingW}
        height={openingH}
        fill="#ffffff"
        stroke={selected ? '#0f172a' : 'transparent'}
        strokeWidth={selected ? 1.5 : 0}
      />
      {/* swing arc + door panel */}
      <path
        d={`M ${hingeX} ${hingeY} L ${panelEndX} ${panelEndY} A ${r} ${r} 0 0 ${sweep} ${arcEndX} ${arcEndY}`}
        fill="none"
        stroke="#0f172a"
        strokeWidth={1.2}
        opacity={0.65}
        pointerEvents="none"
      />
      {/* drag handle */}
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill={selected ? '#0f172a' : '#475569'}
        stroke="#fff"
        strokeWidth={1}
        style={{ cursor: 'pointer' }}
        onMouseDown={(e) => onDragDoor(e, door, room, scale, updateDoor)}
      />
    </g>
  );
};

function onDragDoor(
  e: React.MouseEvent,
  door: Door,
  room: Room,
  scale: number,
  updateDoor: (id: string, patch: Partial<Door>) => void
) {
  e.stopPropagation();
  e.preventDefault();
  const startX = e.clientX;
  const startY = e.clientY;
  const startOffset = door.offset;
  const move = (ev: MouseEvent) => {
    const dx = (ev.clientX - startX) / scale;
    const dy = (ev.clientY - startY) / scale;
    let delta = 0;
    if (door.edge === 0 || door.edge === 2) {
      delta = dx / room.width;
    } else {
      delta = dy / room.height;
    }
    let next = startOffset + delta;
    next = Math.max(0.05, Math.min(0.95, next));
    next = Math.round(next * 100) / 100;
    updateDoor(door.id, { offset: next });
  };
  const up = () => {
    window.removeEventListener('mousemove', move);
    window.removeEventListener('mouseup', up);
  };
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', up);
}
