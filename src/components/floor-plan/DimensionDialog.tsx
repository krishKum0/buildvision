'use client';

import React, { useState } from 'react';
import { useEditorStore } from '@/lib/floor-plan/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Ruler, Sparkles } from 'lucide-react';

interface DimensionDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const PRESETS = [
  { w: 20, d: 30, label: '20×30 Small Plot', building: 'house' as const, floors: 1 },
  { w: 20, d: 40, label: '20×40 Narrow Plot', building: 'house' as const, floors: 2 },
  { w: 30, d: 40, label: '30×40 Family Home', building: 'house' as const, floors: 2 },
  { w: 30, d: 50, label: '30×50 Premium Plot', building: 'house' as const, floors: 2 },
  { w: 40, d: 60, label: '40×60 Bungalow', building: 'house' as const, floors: 2 },
  { w: 50, d: 80, label: '50×80 Estate', building: 'building' as const, floors: 3 },
];

/**
 * Inner form holds its own state, initialised from the current plan when first mounted.
 * The parent `DimensionDialog` re-mounts this component via `key` whenever the dialog opens,
 * avoiding setState-in-effect.
 */
const DimensionForm: React.FC<{ onOpenChange: (v: boolean) => void }> = ({ onOpenChange }) => {
  const regenerate = useEditorStore((s) => s.regenerate);
  const plan = useEditorStore((s) => s.plan);

  const [width, setWidth] = useState(plan.landWidth);
  const [depth, setDepth] = useState(plan.landDepth);
  const [unit, setUnit] = useState<'ft' | 'm'>(plan.unit);
  const [buildingType, setBuildingType] = useState<'house' | 'apartment' | 'building'>(plan.buildingType);
  const [floors, setFloors] = useState(plan.floors);
  const [facing, setFacing] = useState<'N' | 'S' | 'E' | 'W'>(plan.facing);

  const apply = () => {
    regenerate({
      landWidth: Math.max(8, Number(width)),
      landDepth: Math.max(10, Number(depth)),
      unit,
      buildingType,
      floors,
      facing,
    });
    onOpenChange(false);
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-slate-900">
          <Ruler className="w-4 h-4" /> Land Dimensions &amp; Plot Setup
        </DialogTitle>
        <DialogDescription>
          Enter the dimensions of your plot. The studio will auto-generate a complete floor plan with rooms,
          doors, windows, and furniture. You can edit everything afterwards.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-2">
        {/* presets */}
        <div>
          <Label className="text-xs text-slate-500 uppercase tracking-wide">Quick Presets</Label>
          <div className="grid grid-cols-3 gap-2 mt-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                className="border border-slate-200 hover:border-slate-900 hover:bg-slate-50 rounded p-2 text-left text-xs"
                onClick={() => {
                  setWidth(p.w);
                  setDepth(p.d);
                  setBuildingType(p.building);
                  setFloors(p.floors);
                  setUnit('ft');
                }}
              >
                <div className="font-medium text-slate-900">{p.w}×{p.d}</div>
                <div className="text-[10px] text-slate-500">{p.label.replace(/^\d+×\d+\s/, '')}</div>
              </button>
            ))}
          </div>
        </div>

        {/* dimensions */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Plot Width</Label>
            <Input
              type="number"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Plot Depth</Label>
            <Input
              type="number"
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className="mt-1"
            />
          </div>
        </div>

        {/* unit */}
        <div>
          <Label className="text-xs">Unit</Label>
          <RadioGroup
            value={unit}
            onValueChange={(v) => setUnit(v as 'ft' | 'm')}
            className="flex gap-4 mt-1.5"
          >
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="ft" id="unit-ft" />
              <Label htmlFor="unit-ft" className="text-xs font-normal cursor-pointer">Feet (ft)</Label>
            </div>
            <div className="flex items-center gap-1.5">
              <RadioGroupItem value="m" id="unit-m" />
              <Label htmlFor="unit-m" className="text-xs font-normal cursor-pointer">Meters (m)</Label>
            </div>
          </RadioGroup>
        </div>

        {/* building type */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Building Type</Label>
            <Select
              value={buildingType}
              onValueChange={(v) => setBuildingType(v as 'house' | 'apartment' | 'building')}
            >
              <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="house">House (Independent)</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="building">Building (Multi-unit)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Floors</Label>
            <Select value={String(floors)} onValueChange={(v) => setFloors(Number(v))}>
              <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} {n === 1 ? 'Floor' : 'Floors'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* facing */}
        <div>
          <Label className="text-xs">Plot Facing (Entrance Direction)</Label>
          <RadioGroup
            value={facing}
            onValueChange={(v) => setFacing(v as 'N' | 'S' | 'E' | 'W')}
            className="grid grid-cols-4 gap-2 mt-1.5"
          >
            {(['N', 'S', 'E', 'W'] as const).map((d) => (
              <div key={d} className="flex items-center gap-1.5 border border-slate-200 rounded px-2 py-1.5">
                <RadioGroupItem value={d} id={`face-${d}`} />
                <Label htmlFor={`face-${d}`} className="text-xs font-normal cursor-pointer">{d}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="rounded bg-amber-50 border border-amber-200 p-2.5 text-[11px] text-amber-800 leading-relaxed flex gap-2">
          <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold">Auto-generation:</span> The studio will create a complete layout
            with bedrooms, kitchen, bathrooms, parking, porch, staircase and furniture. After generation,
            everything stays fully editable — drag, resize, delete, or add new items.
          </div>
        </div>
      </div>

      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button onClick={apply} className="bg-slate-900 hover:bg-slate-800">
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          Generate Floor Plan
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export const DimensionDialog: React.FC<DimensionDialogProps> = ({ open, onOpenChange }) => {
  // `key` re-mounts the inner form whenever the dialog re-opens, so its useState
  // initial values get re-read from the latest plan.
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && <DimensionForm key={Date.now()} onOpenChange={onOpenChange} />}
    </Dialog>
  );
};
