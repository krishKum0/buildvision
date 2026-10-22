'use client';

import React from 'react';
import { useEditorStore } from '@/lib/floor-plan/store';
import { Button } from '@/components/ui/button';
import {
  Ruler,
  Undo2,
  Redo2,
  Download,
  Upload,
  Image as ImageIcon,
  Trash2,
  Eye,
  EyeOff,
  Save,
  FolderOpen,
  Home,
  Building2,
  Layers,
} from 'lucide-react';
import { formatLength } from '@/lib/floor-plan/constants';

interface TopToolbarProps {
  onOpenDimensionDialog: () => void;
  onExportPNG: () => void;
  onExportJSON: () => void;
  onImportJSON: (file: File) => void;
  onToggleSidebar: () => void;
  onToggleProperties: () => void;
  sidebarOpen: boolean;
  propertiesOpen: boolean;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  onOpenDimensionDialog,
  onExportPNG,
  onExportJSON,
  onImportJSON,
  onToggleSidebar,
  onToggleProperties,
  sidebarOpen,
  propertiesOpen,
}) => {
  const plan = useEditorStore((s) => s.plan);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const past = useEditorStore((s) => s.past);
  const future = useEditorStore((s) => s.future);

  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center px-3 gap-2 shrink-0">
      {/* brand */}
      <div className="flex items-center gap-2 pr-2 mr-1 border-r border-slate-200">
        <div className="w-8 h-8 rounded-md bg-slate-900 flex items-center justify-center text-white">
          <Home className="w-4 h-4" />
        </div>
        <div className="leading-tight">
          <div className="font-semibold text-sm text-slate-900">PlotPlan Studio</div>
          <div className="text-[10px] text-slate-500 -mt-0.5">Interactive floor plan editor</div>
        </div>
      </div>

      {/* sidebar toggle */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        title="Toggle sidebar"
        onClick={onToggleSidebar}
      >
        {sidebarOpen ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </Button>

      {/* dimensions trigger */}
      <Button
        variant="default"
        size="sm"
        className="h-8 bg-slate-900 hover:bg-slate-800"
        onClick={onOpenDimensionDialog}
      >
        <Ruler className="w-3.5 h-3.5 mr-1.5" />
        {plan.landWidth} × {plan.landDepth} {plan.unit}
      </Button>

      {/* plot type + floor badges */}
      <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-600 px-2 border-l border-slate-200">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100">
          {plan.buildingType === 'house' ? <Home className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
          {plan.buildingType}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100">
          <Layers className="w-3 h-3" />
          {plan.floors}F
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100">
          <Building2 className="w-3 h-3" />
          {plan.rooms.length} rooms
        </span>
      </div>

      <div className="flex-1" />

      {/* undo / redo */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        title="Undo"
        disabled={past.length === 0}
        onClick={undo}
      >
        <Undo2 className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        title="Redo"
        disabled={future.length === 0}
        onClick={redo}
      >
        <Redo2 className="w-4 h-4" />
      </Button>

      <div className="h-6 w-px bg-slate-200 mx-1" />

      {/* export / import */}
      <label className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer">
        <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
        Import
        <input
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImportJSON(f);
            e.currentTarget.value = '';
          }}
        />
      </label>
      <Button variant="outline" size="sm" className="h-8" onClick={onExportJSON}>
        <Save className="w-3.5 h-3.5 mr-1.5" />
        JSON
      </Button>
      <Button variant="outline" size="sm" className="h-8" onClick={onExportPNG}>
        <ImageIcon className="w-3.5 h-3.5 mr-1.5" />
        PNG
      </Button>

      <div className="h-6 w-px bg-slate-200 mx-1" />

      {/* properties toggle */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        title="Toggle properties panel"
        onClick={onToggleProperties}
      >
        {propertiesOpen ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </Button>

      <div className="hidden lg:block text-[10px] text-slate-400 pl-2 border-l border-slate-200 ml-1 leading-tight">
        <div>Built area: {plan.rooms.reduce((s, r) => s + r.width * r.height, 0).toFixed(0)} sq {plan.unit}</div>
        <div>Plot: {formatLength(plan.landWidth, plan.unit)} × {formatLength(plan.landDepth, plan.unit)}</div>
      </div>

      <button
        className="hidden xl:inline-flex h-8 w-8 p-0 items-center justify-center text-red-600 hover:bg-red-50 rounded"
        title="Clear all"
        onClick={() => {
          if (confirm('Clear all rooms and start over?')) {
            useEditorStore.getState().setPlan({
              ...plan,
              rooms: [],
              doors: [],
              windows: [],
              furniture: [],
            });
          }
        }}
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="hidden">
        <Download className="w-3.5 h-3.5" />
      </div>
    </header>
  );
};
