'use client';

import React, { useState } from 'react';
import { useEditorStore } from '@/lib/floor-plan/store';
import { FURNITURE_CONFIG, FURNITURE_PALETTE, ROOM_CONFIG, ROOM_PALETTE } from '@/lib/floor-plan/constants';
import { cn } from '@/lib/utils';
import { Ruler, ArrowUp, Building2, House, Maximize, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface SidebarProps {
  onOpenDimensionDialog?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenDimensionDialog }) => {
  const mode = useEditorStore((s) => s.mode);
  const setMode = useEditorStore((s) => s.setMode);
  const setPendingRoomType = useEditorStore((s) => s.setPendingRoomType);
  const setPendingFurnitureType = useEditorStore((s) => s.setPendingFurnitureType);
  const plan = useEditorStore((s) => s.plan);

  const [activeTab, setActiveTab] = useState<'rooms' | 'furniture' | 'tools' | 'project'>('rooms');

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2 font-semibold text-sm text-slate-800">
          <Building2 className="w-4 h-4 text-slate-700" />
          Design Tools
        </div>
        <div className="text-[10px] text-slate-500 uppercase tracking-wide">
          {plan.floors}F · {plan.buildingType}
        </div>
      </div>

      {/* tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="grid grid-cols-4 gap-0.5 bg-slate-100 rounded-none h-auto p-1 border-b border-slate-200">
          <TabsTrigger value="rooms" className="text-[11px] py-1.5">Rooms</TabsTrigger>
          <TabsTrigger value="furniture" className="text-[11px] py-1.5">Items</TabsTrigger>
          <TabsTrigger value="tools" className="text-[11px] py-1.5">Tools</TabsTrigger>
          <TabsTrigger value="project" className="text-[11px] py-1.5">Plot</TabsTrigger>
        </TabsList>

        <TabsContent value="rooms" className="flex-1 overflow-y-auto p-3 m-0">
          <p className="text-xs text-slate-500 mb-2.5">Click a room then click on canvas to place it.</p>
          <div className="grid grid-cols-2 gap-1.5">
            {ROOM_PALETTE.map((rt) => {
              const cfg = ROOM_CONFIG[rt];
              const active = mode === 'add-room' && useEditorStore.getState().pendingRoomType === rt;
              return (
                <button
                  key={rt}
                  className={cn(
                    'flex flex-col items-start p-2 rounded border text-left text-xs transition-colors',
                    active
                      ? 'border-slate-900 bg-slate-100 ring-1 ring-slate-300'
                      : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                  )}
                  onClick={() => {
                    setMode('add-room');
                    setPendingRoomType(rt);
                    setPendingFurnitureType(undefined);
                  }}
                >
                  <div
                    className="w-full h-3.5 rounded mb-1.5"
                    style={{ background: cfg.color, border: `1px solid ${cfg.borderColor}` }}
                  />
                  <span className="font-medium text-slate-800 leading-tight">{cfg.label}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    {cfg.defaultSize.w}&apos; × {cfg.defaultSize.h}&apos;
                  </span>
                </button>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="furniture" className="flex-1 overflow-y-auto p-3 m-0">
          <p className="text-xs text-slate-500 mb-2.5">Click an item then click on the canvas to place it.</p>
          {(['bedroom', 'living', 'kitchen', 'bath', 'office', 'outdoor', 'other'] as const).map((cat) => {
            const items = FURNITURE_PALETTE.filter((t) => FURNITURE_CONFIG[t].category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat} className="mb-3">
                <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-1.5">{cat}</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {items.map((ft) => {
                    const cfg = FURNITURE_CONFIG[ft];
                    const active = mode === 'add-furniture' && useEditorStore.getState().pendingFurnitureType === ft;
                    return (
                      <button
                        key={ft}
                        className={cn(
                          'flex items-center gap-2 p-1.5 rounded border text-left text-[11px] transition-colors',
                          active
                            ? 'border-slate-900 bg-slate-100 ring-1 ring-slate-300'
                            : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                        )}
                        onClick={() => {
                          setMode('add-furniture');
                          setPendingFurnitureType(ft);
                          setPendingRoomType(undefined);
                        }}
                      >
                        <div className="w-4 h-4 rounded" style={{ background: cfg.color }} />
                        <span className="text-slate-700 leading-tight">{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="tools" className="flex-1 overflow-y-auto p-3 m-0 space-y-2">
          <p className="text-xs text-slate-500 mb-2">Active tool defines your click behaviour on canvas.</p>
          <ToolButton
            label="Select & Move"
            icon={<Building2 className="w-3.5 h-3.5" />}
            active={mode === 'select'}
            onClick={() => setMode('select')}
          />
          <ToolButton
            label="Add Door"
            icon={<ArrowUp className="w-3.5 h-3.5" />}
            active={mode === 'add-door'}
            onClick={() => {
              setMode('add-door');
              setPendingRoomType(undefined);
              setPendingFurnitureType(undefined);
            }}
          />
          <ToolButton
            label="Add Window"
            icon={<Maximize className="w-3.5 h-3.5" />}
            active={mode === 'add-window'}
            onClick={() => {
              setMode('add-window');
              setPendingRoomType(undefined);
              setPendingFurnitureType(undefined);
            }}
          />
          <ToolButton
            label="Pan Canvas"
            icon={<ZoomIn className="w-3.5 h-3.5" />}
            active={mode === 'pan'}
            onClick={() => setMode('pan')}
          />
          <div className="text-[10px] text-slate-500 mt-3 leading-relaxed">
            Tip: Hold middle-mouse button or use Pan mode to drag the canvas. Mouse wheel zooms in/out.
          </div>
        </TabsContent>

        <TabsContent value="project" className="flex-1 overflow-y-auto p-3 m-0 space-y-3">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-1.5">Current Plot</div>
            <div className="rounded border border-slate-200 p-2.5 text-xs space-y-1.5 bg-slate-50">
              <Row label="Width">{plan.landWidth} {plan.unit}</Row>
              <Row label="Depth">{plan.landDepth} {plan.unit}</Row>
              <Row label="Type">{plan.buildingType}</Row>
              <Row label="Floors">{plan.floors}</Row>
              <Row label="Facing">{plan.facing}</Row>
              <Row label="Rooms">{plan.rooms.length}</Row>
              <Row label="Doors">{plan.doors.length}</Row>
              <Row label="Windows">{plan.windows.length}</Row>
              <Row label="Furniture">{plan.furniture.length}</Row>
              <Row label="Built area">
                {plan.rooms.reduce((s, r) => s + r.width * r.height, 0).toFixed(1)} sq {plan.unit}
              </Row>
            </div>
          </div>

          <Button
            onClick={onOpenDimensionDialog}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white"
            size="sm"
          >
            <Ruler className="w-3.5 h-3.5 mr-1.5" />
            Edit Land Dimensions
          </Button>

          <Button
            onClick={() => useEditorStore.getState().resetView()}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <House className="w-3.5 h-3.5 mr-1.5" />
            Reset Canvas View
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const ToolButton: React.FC<{ label: string; icon: React.ReactNode; active: boolean; onClick: () => void }> = ({
  label,
  icon,
  active,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={cn(
      'w-full flex items-center gap-2 px-2.5 py-1.5 rounded border text-xs font-medium transition-colors',
      active
        ? 'border-slate-900 bg-slate-900 text-white'
        : 'border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
    )}
  >
    {icon}
    {label}
  </button>
);

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center justify-between">
    <span className="text-slate-500">{label}</span>
    <span className="font-medium text-slate-800">{children}</span>
  </div>
);
