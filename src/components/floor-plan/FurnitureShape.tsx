'use client';

import React from 'react';
import type { Furniture, FurnitureType } from '@/lib/floor-plan/types';
import { FURNITURE_CONFIG } from '@/lib/floor-plan/constants';
import { useEditorStore } from '@/lib/floor-plan/store';

interface FurnitureShapeProps {
  item: Furniture;
  scale: number;
  selected: boolean;
}

/**
 * Render a furniture item as a small SVG group with rotation.
 * Uses simple geometric shapes + a small icon glyph inside.
 */
export const FurnitureShape: React.FC<FurnitureShapeProps> = ({ item, scale, selected }) => {
  const updateFurniture = useEditorStore((s) => s.updateFurniture);
  const setSelection = useEditorStore((s) => s.setSelection);

  const cfg = FURNITURE_CONFIG[item.type];
  const cx = (item.x + item.width / 2) * scale;
  const cy = (item.y + item.height / 2) * scale;
  const w = item.width * scale;
  const h = item.height * scale;

  return (
    <g
      data-furniture-id={item.id}
      className="cursor-pointer"
      transform={`rotate(${item.rotation} ${cx} ${cy})`}
      onMouseDown={(e) => onDragFurniture(e, item, scale, updateFurniture)}
      onClick={(e) => {
        e.stopPropagation();
        setSelection({ kind: 'furniture', id: item.id });
      }}
    >
      <FurnitureGlyph type={item.type} x={cx - w / 2} y={cy - h / 2} w={w} h={h} color={cfg.color} />
      {selected && (
        <rect
          x={cx - w / 2 - 2}
          y={cy - h / 2 - 2}
          width={w + 4}
          height={h + 4}
          fill="none"
          stroke="#0f172a"
          strokeDasharray="4 3"
          strokeWidth={1.2}
          pointerEvents="none"
        />
      )}
      {/* rotate handle */}
      {selected && (
        <g
          pointerEvents="all"
          onMouseDown={(e) => onRotate(e, item, cx, cy, scale, updateFurniture)}
        >
          <line
            x1={cx}
            y1={cy - h / 2}
            x2={cx}
            y2={cy - h / 2 - 16}
            stroke="#0f172a"
            strokeWidth={1}
          />
          <circle cx={cx} cy={cy - h / 2 - 20} r={5} fill="#0f172a" stroke="#fff" strokeWidth={1} />
        </g>
      )}
    </g>
  );
};

function onDragFurniture(
  e: React.MouseEvent,
  item: Furniture,
  scale: number,
  update: (id: string, patch: Partial<Furniture>) => void
) {
  e.stopPropagation();
  e.preventDefault();
  const startX = e.clientX;
  const startY = e.clientY;
  const start = { x: item.x, y: item.y };
  const move = (ev: MouseEvent) => {
    const dx = (ev.clientX - startX) / scale;
    const dy = (ev.clientY - startY) / scale;
    update(item.id, {
      x: Math.round((start.x + dx) * 2) / 2,
      y: Math.round((start.y + dy) * 2) / 2,
    });
  };
  const up = () => {
    window.removeEventListener('mousemove', move);
    window.removeEventListener('mouseup', up);
  };
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', up);
}

function onRotate(
  e: React.MouseEvent,
  item: Furniture,
  cx: number,
  cy: number,
  _scale: number,
  update: (id: string, patch: Partial<Furniture>) => void
) {
  e.stopPropagation();
  e.preventDefault();
  // cx, cy are in pixel coordinates relative to SVG; we need to compute angle from mouse to center
  // To get the actual mouse position relative to the SVG origin we use clientX/Y - svg bounding rect
  const svg = (e.target as Element).ownerSVGElement;
  if (!svg) return;
  const rect = svg.getBoundingClientRect();
  const move = (ev: MouseEvent) => {
    const mx = ev.clientX - rect.left;
    const my = ev.clientY - rect.top;
    const angle = Math.atan2(my - cy, mx - cx) * (180 / Math.PI) + 90;
    // snap to 15° increments
    const snapped = Math.round(angle / 15) * 15;
    update(item.id, { rotation: snapped });
  };
  const up = () => {
    window.removeEventListener('mousemove', move);
    window.removeEventListener('mouseup', up);
  };
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', up);
}

// ===== FURNITURE GLYPHS =====
// Simple iconic shapes for each furniture type, drawn in local coordinates.
// All glyphs fill the (x, y, w, h) box.
interface GlyphProps {
  type: FurnitureType;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

export const FurnitureGlyph: React.FC<GlyphProps> = ({ type, x, y, w, h, color }) => {
  const stroke = '#1f2937';
  const sw = Math.max(0.8, Math.min(w, h) * 0.04);
  switch (type) {
    case 'bed-single':
    case 'bed-double': {
      // bed: rounded rectangle with a pillow band
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} rx={Math.min(w, h) * 0.1} fill={color} stroke={stroke} strokeWidth={sw} />
          <rect x={x + w * 0.05} y={y + h * 0.05} width={w * 0.9} height={h * 0.18} rx={2} fill="#e2e8f0" stroke={stroke} strokeWidth={sw * 0.6} />
          <line x1={x + w * 0.5} y1={y + h * 0.25} x2={x + w * 0.5} y2={y + h - h * 0.05} stroke={stroke} strokeWidth={sw * 0.5} opacity={0.6} />
        </g>
      );
    }
    case 'sofa-2':
    case 'sofa-3': {
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} rx={Math.min(w, h) * 0.2} fill={color} stroke={stroke} strokeWidth={sw} />
          <line x1={x + w * 0.33} y1={y + h * 0.1} x2={x + w * 0.33} y2={y + h * 0.9} stroke={stroke} strokeWidth={sw * 0.5} opacity={0.5} />
          {type === 'sofa-3' && (
            <line x1={x + w * 0.66} y1={y + h * 0.1} x2={x + w * 0.66} y2={y + h * 0.9} stroke={stroke} strokeWidth={sw * 0.5} opacity={0.5} />
          )}
        </g>
      );
    }
    case 'dining-table':
    case 'coffee-table': {
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} rx={Math.min(w, h) * 0.1} fill={color} stroke={stroke} strokeWidth={sw} />
        </g>
      );
    }
    case 'toilet': {
      // toilet: tank + bowl
      return (
        <g>
          <rect x={x} y={y} width={w} height={h * 0.35} fill={color} stroke={stroke} strokeWidth={sw} />
          <ellipse cx={x + w / 2} cy={y + h * 0.7} rx={w * 0.45} ry={h * 0.3} fill={color} stroke={stroke} strokeWidth={sw} />
        </g>
      );
    }
    case 'sink': {
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} rx={Math.min(w, h) * 0.2} fill={color} stroke={stroke} strokeWidth={sw} />
          <ellipse cx={x + w / 2} cy={y + h / 2} rx={w * 0.3} ry={h * 0.25} fill="#fff" stroke={stroke} strokeWidth={sw * 0.6} />
        </g>
      );
    }
    case 'shower': {
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} fill={color} stroke={stroke} strokeWidth={sw} />
          <circle cx={x + w / 2} cy={y + h * 0.2} r={Math.min(w, h) * 0.08} fill={stroke} />
          {Array.from({ length: 3 }).map((_, i) => (
            <line key={i} x1={x + w / 2} y1={y + h * 0.3} x2={x + w / 2 + (i - 1) * 3} y2={y + h * 0.7} stroke={stroke} strokeWidth={sw * 0.5} opacity={0.5} />
          ))}
        </g>
      );
    }
    case 'bathtub': {
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} rx={Math.min(w, h) * 0.25} fill={color} stroke={stroke} strokeWidth={sw} />
          <rect x={x + 2} y={y + 2} width={w - 4} height={h - 4} rx={Math.min(w, h) * 0.2} fill="#e0f2fe" stroke={stroke} strokeWidth={sw * 0.5} opacity={0.7} />
        </g>
      );
    }
    case 'stove': {
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} fill={color} stroke={stroke} strokeWidth={sw} />
          <circle cx={x + w * 0.3} cy={y + h * 0.3} r={Math.min(w, h) * 0.12} fill="#1f2937" />
          <circle cx={x + w * 0.7} cy={y + h * 0.3} r={Math.min(w, h) * 0.12} fill="#1f2937" />
          <circle cx={x + w * 0.3} cy={y + h * 0.7} r={Math.min(w, h) * 0.12} fill="#1f2937" />
          <circle cx={x + w * 0.7} cy={y + h * 0.7} r={Math.min(w, h) * 0.12} fill="#1f2937" />
        </g>
      );
    }
    case 'fridge': {
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} rx={2} fill={color} stroke={stroke} strokeWidth={sw} />
          <line x1={x} y1={y + h * 0.35} x2={x + w} y2={y + h * 0.35} stroke={stroke} strokeWidth={sw} />
          <line x1={x + w - 2} y1={y + h * 0.2} x2={x + w - 2} y2={y + h * 0.3} stroke={stroke} strokeWidth={sw} />
          <line x1={x + w - 2} y1={y + h * 0.5} x2={x + w - 2} y2={y + h * 0.6} stroke={stroke} strokeWidth={sw} />
        </g>
      );
    }
    case 'kitchen-counter': {
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} fill={color} stroke={stroke} strokeWidth={sw} />
          <line x1={x + w / 3} y1={y} x2={x + w / 3} y2={y + h} stroke={stroke} strokeWidth={sw * 0.5} opacity={0.6} />
          <line x1={x + 2 * w / 3} y1={y} x2={x + 2 * w / 3} y2={y + h} stroke={stroke} strokeWidth={sw * 0.5} opacity={0.6} />
        </g>
      );
    }
    case 'wardrobe': {
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} fill={color} stroke={stroke} strokeWidth={sw} />
          <line x1={x + w / 3} y1={y} x2={x + w / 3} y2={y + h} stroke={stroke} strokeWidth={sw * 0.5} />
          <line x1={x + 2 * w / 3} y1={y} x2={x + 2 * w / 3} y2={y + h} stroke={stroke} strokeWidth={sw * 0.5} />
          <circle cx={x + w / 3 - 1} cy={y + h / 2} r={1} fill={stroke} />
          <circle cx={x + 2 * w / 3 + 1} cy={y + h / 2} r={1} fill={stroke} />
        </g>
      );
    }
    case 'desk': {
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} fill={color} stroke={stroke} strokeWidth={sw} />
          <line x1={x} y1={y + h * 0.5} x2={x + w} y2={y + h * 0.5} stroke={stroke} strokeWidth={sw * 0.4} opacity={0.6} />
        </g>
      );
    }
    case 'chair': {
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} rx={Math.min(w, h) * 0.2} fill={color} stroke={stroke} strokeWidth={sw} />
          <rect x={x + w * 0.1} y={y} width={w * 0.8} height={h * 0.2} fill="#1f2937" />
        </g>
      );
    }
    case 'tv': {
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} fill={color} stroke={stroke} strokeWidth={sw} />
          <rect x={x + 2} y={y + 1} width={Math.max(0, w - 4)} height={Math.max(0, h - 2)} fill="#0ea5e9" opacity={0.5} />
        </g>
      );
    }
    case 'car': {
      return (
        <g>
          <rect x={x + w * 0.05} y={y + h * 0.1} width={w * 0.9} height={h * 0.8} rx={Math.min(w, h) * 0.15} fill={color} stroke={stroke} strokeWidth={sw} />
          <rect x={x + w * 0.15} y={y + h * 0.25} width={w * 0.7} height={h * 0.3} rx={2} fill="#1e3a8a" opacity={0.5} />
          <circle cx={x + w * 0.25} cy={y + h * 0.85} r={Math.min(w, h) * 0.08} fill="#1f2937" />
          <circle cx={x + w * 0.75} cy={y + h * 0.85} r={Math.min(w, h) * 0.08} fill="#1f2937" />
        </g>
      );
    }
    case 'motorcycle': {
      return (
        <g>
          <rect x={x + w * 0.1} y={y + h * 0.4} width={w * 0.8} height={h * 0.2} rx={2} fill={color} stroke={stroke} strokeWidth={sw} />
          <circle cx={x + w * 0.2} cy={y + h * 0.8} r={Math.min(w, h) * 0.18} fill="#1f2937" />
          <circle cx={x + w * 0.8} cy={y + h * 0.8} r={Math.min(w, h) * 0.18} fill="#1f2937" />
        </g>
      );
    }
    case 'plant': {
      return (
        <g>
          <rect x={x + w * 0.3} y={y + h * 0.6} width={w * 0.4} height={h * 0.35} fill="#92400e" />
          <circle cx={x + w / 2} cy={y + h * 0.3} r={Math.min(w, h) * 0.3} fill={color} />
          <circle cx={x + w * 0.3} cy={y + h * 0.4} r={Math.min(w, h) * 0.18} fill={color} opacity={0.7} />
          <circle cx={x + w * 0.7} cy={y + h * 0.4} r={Math.min(w, h) * 0.18} fill={color} opacity={0.7} />
        </g>
      );
    }
    case 'washing-machine': {
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} rx={2} fill={color} stroke={stroke} strokeWidth={sw} />
          <circle cx={x + w / 2} cy={y + h * 0.6} r={Math.min(w, h) * 0.3} fill="#e0f2fe" stroke={stroke} strokeWidth={sw * 0.6} />
          <circle cx={x + w * 0.85} cy={y + h * 0.15} r={1} fill="#0f172a" />
        </g>
      );
    }
    case 'bookshelf': {
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} fill={color} stroke={stroke} strokeWidth={sw} />
          {Array.from({ length: 4 }).map((_, i) => (
            <line key={i} x1={x} y1={y + (i + 1) * h / 5} x2={x + w} y2={y + (i + 1) * h / 5} stroke={stroke} strokeWidth={sw * 0.4} opacity={0.5} />
          ))}
        </g>
      );
    }
    case 'dressing-table': {
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} fill={color} stroke={stroke} strokeWidth={sw} />
          <ellipse cx={x + w / 2} cy={y + h / 2} rx={w * 0.25} ry={h * 0.3} fill="#cffafe" stroke={stroke} strokeWidth={sw * 0.5} />
        </g>
      );
    }
    case 'prayer-mat': {
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} rx={Math.min(w, h) * 0.15} fill={color} stroke={stroke} strokeWidth={sw} />
          <circle cx={x + w / 2} cy={y + h / 2} r={Math.min(w, h) * 0.2} fill="none" stroke="#fef9c3" strokeWidth={sw} />
        </g>
      );
    }
    case 'staircase': {
      // staircase: series of horizontal lines
      const steps = 8;
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} fill={color} stroke={stroke} strokeWidth={sw} />
          {Array.from({ length: steps - 1 }).map((_, i) => (
            <line
              key={i}
              x1={x}
              y1={y + (i + 1) * h / steps}
              x2={x + w}
              y2={y + (i + 1) * h / steps}
              stroke={stroke}
              strokeWidth={sw * 0.5}
              opacity={0.7}
            />
          ))}
          <polygon
            points={`${x + w / 2 - 4},${y + 4} ${x + w / 2 + 4},${y + 4} ${x + w / 2},${y - 2}`}
            fill="#0f172a"
          />
        </g>
      );
    }
    default:
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} fill={color} stroke={stroke} strokeWidth={sw} />
        </g>
      );
  }
};
