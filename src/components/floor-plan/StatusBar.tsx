'use client';

import React from 'react';
import { useEditorStore } from '@/lib/floor-plan/store';
import { formatLength } from '@/lib/floor-plan/constants';
import { Maximize, MousePointerClick, ZoomIn, Info } from 'lucide-react';

export const StatusBar: React.FC<{ onOpenHelp?: () => void }> = ({ onOpenHelp }) => {
  const plan = useEditorStore((s) => s.plan);
  const selection = useEditorStore((s) => s.selection);
  const view = useEditorStore((s) => s.view);

  const totalArea = plan.landWidth * plan.landDepth;
  const builtArea = plan.rooms.reduce((s, r) => s + r.width * r.height, 0);
  const coverage = totalArea > 0 ? (builtArea / totalArea) * 100 : 0;

  let selText = 'Nothing selected';
  if (selection.kind !== 'none' && selection.id) {
    if (selection.kind === 'room') {
      const r = plan.rooms.find((x) => x.id === selection.id);
      selText = r ? `${r.name} — ${r.width}×${r.height} ${plan.unit}` : selText;
    } else if (selection.kind === 'door') {
      selText = `Door #${selection.id.slice(-4)} selected`;
    } else if (selection.kind === 'window') {
      selText = `Window #${selection.id.slice(-4)} selected`;
    } else if (selection.kind === 'furniture') {
      const f = plan.furniture.find((x) => x.id === selection.id);
      selText = f ? `Furniture: ${f.type}` : selText;
    }
  }

  return (
    <footer className="h-7 bg-slate-900 text-slate-100 flex items-center px-3 gap-4 text-[11px] shrink-0">
      <div className="flex items-center gap-1.5">
        <MousePointerClick className="w-3 h-3" />
        <span>{selText}</span>
      </div>
      <div className="flex-1" />
      <div className="hidden sm:flex items-center gap-1.5">
        <Maximize className="w-3 h-3" />
        <span>Plot: {formatLength(plan.landWidth, plan.unit)} × {formatLength(plan.landDepth, plan.unit)}</span>
      </div>
      <div className="hidden sm:flex items-center gap-1.5">
        <span>Built: {builtArea.toFixed(0)} / {totalArea.toFixed(0)} sq {plan.unit} ({coverage.toFixed(0)}%)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <ZoomIn className="w-3 h-3" />
        <span>{view.scale.toFixed(1)}px/unit</span>
      </div>
      <button
        className="flex items-center gap-1 hover:text-white text-slate-300"
        onClick={onOpenHelp}
      >
        <Info className="w-3 h-3" /> Help
      </button>
    </footer>
  );
};
