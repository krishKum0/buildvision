'use client';

import React, { useState } from 'react';
import { useEditorStore } from '@/lib/floor-plan/store';
import { FURNITURE_CONFIG, ROOM_CONFIG, formatLength } from '@/lib/floor-plan/constants';
import type { Door, Furniture, Room, Window as WindowItem } from '@/lib/floor-plan/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Copy, RotateCw, X } from 'lucide-react';

export const PropertiesPanel: React.FC = () => {
  const selection = useEditorStore((s) => s.selection);
  const plan = useEditorStore((s) => s.plan);
  const removeRoom = useEditorStore((s) => s.removeRoom);
  const removeDoor = useEditorStore((s) => s.removeDoor);
  const removeWindow = useEditorStore((s) => s.removeWindow);
  const removeFurniture = useEditorStore((s) => s.removeFurniture);
  const updateRoom = useEditorStore((s) => s.updateRoom);
  const updateDoor = useEditorStore((s) => s.updateDoor);
  const updateWindow = useEditorStore((s) => s.updateWindow);
  const updateFurniture = useEditorStore((s) => s.updateFurniture);
  const addFurniture = useEditorStore((s) => s.addFurniture);
  const setPropertiesOpen = useEditorStore((s) => s.setPropertiesOpen);

  if (selection.kind === 'none' || !selection.id) {
    return (
      <div className="flex flex-col h-full bg-white border-l border-slate-200">
        <div className="flex items-center justify-between px-3 h-10 border-b border-slate-200 bg-slate-50">
          <span className="text-xs font-semibold text-slate-700">Properties</span>
          <button
            className="text-slate-400 hover:text-slate-700"
            onClick={() => setPropertiesOpen(false)}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center text-center p-4 text-xs text-slate-400">
          <div>
            <div className="text-3xl mb-2 opacity-40">▢</div>
            <p>Select a room, door, window, or furniture item to edit its properties.</p>
            <p className="mt-2 text-slate-400">You can click on the canvas or pick from the list.</p>
          </div>
        </div>
      </div>
    );
  }

  let content: React.ReactNode = null;

  if (selection.kind === 'room') {
    const room = plan.rooms.find((r) => r.id === selection.id);
    if (room) {
      content = <RoomEditor room={room} update={updateRoom} remove={removeRoom} addFurniture={addFurniture} />;
    }
  } else if (selection.kind === 'door') {
    const door = plan.doors.find((d) => d.id === selection.id);
    if (door) {
      content = <DoorEditor door={door} room={plan.rooms.find((r) => r.id === door.roomId)!} update={updateDoor} remove={removeDoor} />;
    }
  } else if (selection.kind === 'window') {
    const win = plan.windows.find((w) => w.id === selection.id);
    if (win) {
      content = <WindowEditor win={win} update={updateWindow} remove={removeWindow} />;
    }
  } else if (selection.kind === 'furniture') {
    const f = plan.furniture.find((f) => f.id === selection.id);
    if (f) {
      content = <FurnitureEditor item={f} update={updateFurniture} remove={removeFurniture} />;
    }
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200">
      <div className="flex items-center justify-between px-3 h-10 border-b border-slate-200 bg-slate-50">
        <span className="text-xs font-semibold text-slate-700 capitalize">{selection.kind} Properties</span>
        <button
          className="text-slate-400 hover:text-slate-700"
          onClick={() => setPropertiesOpen(false)}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {content}
      </div>
    </div>
  );
};

// ===== ROOM EDITOR =====
const RoomEditor: React.FC<{
  room: Room;
  update: (id: string, patch: Partial<Room>) => void;
  remove: (id: string) => void;
  addFurniture: (f: Omit<Furniture, 'id'>) => void;
}> = ({ room, update, remove, addFurniture }) => {
  const cfg = ROOM_CONFIG[room.type];
  const [localName, setLocalName] = useState(room.name);
  React.useEffect(() => setLocalName(room.name), [room.name]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded" style={{ background: room.color, border: `1.5px solid ${cfg.borderColor}` }} />
        <div className="font-medium text-sm text-slate-900">{cfg.label}</div>
      </div>

      <div>
        <Label className="text-[11px] text-slate-500">Name</Label>
        <Input
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          onBlur={() => update(room.id, { name: localName || room.name })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') update(room.id, { name: localName || room.name });
          }}
          className="h-8 text-xs mt-1"
        />
      </div>

      <Separator />

      <div>
        <Label className="text-[11px] text-slate-500">Type</Label>
        <Select
          value={room.type}
          onValueChange={(v) => {
            const newCfg = ROOM_CONFIG[v as Room['type']];
            update(room.id, { type: v as Room['type'], color: newCfg.color, name: newCfg.label });
          }}
        >
          <SelectTrigger className="h-8 text-xs mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {(Object.keys(ROOM_CONFIG) as Room['type'][]).map((t) => (
              <SelectItem key={t} value={t} className="text-xs">
                {ROOM_CONFIG[t].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label="X"
          value={room.x}
          step={0.5}
          onChange={(v) => update(room.id, { x: v })}
        />
        <NumberField
          label="Y"
          value={room.y}
          step={0.5}
          onChange={(v) => update(room.id, { y: v })}
        />
        <NumberField
          label="Width"
          value={room.width}
          step={0.5}
          min={cfg.minSize.w}
          onChange={(v) => update(room.id, { width: Math.max(cfg.minSize.w, v) })}
        />
        <NumberField
          label="Height"
          value={room.height}
          step={0.5}
          min={cfg.minSize.h}
          onChange={(v) => update(room.id, { height: Math.max(cfg.minSize.h, v) })}
        />
      </div>

      <div className="rounded bg-slate-50 border border-slate-200 p-2 text-[11px] text-slate-600">
        <div className="flex justify-between mb-0.5"><span>Area</span><span className="font-semibold">{(room.width * room.height).toFixed(1)} sq ft</span></div>
        <div className="flex justify-between mb-0.5"><span>Min size</span><span>{cfg.minSize.w} × {cfg.minSize.h}</span></div>
        <div className="flex justify-between"><span>Default</span><span>{cfg.defaultSize.w} × {cfg.defaultSize.h}</span></div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" className="text-xs" onClick={() => update(room.id, { rotation: 0 })}>
          <Copy className="w-3 h-3 mr-1" /> Duplicate
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-xs text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
          onClick={() => remove(room.id)}
        >
          <Trash2 className="w-3 h-3 mr-1" /> Delete
        </Button>
      </div>

      <div className="text-[10px] text-slate-400 pt-2 leading-relaxed">
        Tip: drag corners to resize, drag the top handle to move. Dimensions snap to 0.5&apos;.
      </div>
    </div>
  );
};

// ===== DOOR EDITOR =====
const DoorEditor: React.FC<{
  door: Door;
  room: Room;
  update: (id: string, patch: Partial<Door>) => void;
  remove: (id: string) => void;
}> = ({ door, room, update, remove }) => (
  <div className="space-y-3">
    <div className="font-medium text-sm text-slate-900">Door Opening</div>

    <div>
      <Label className="text-[11px] text-slate-500">Attached to Room</Label>
      <div className="text-xs mt-1 text-slate-700">{room.name}</div>
    </div>

    <Separator />

    <div>
      <Label className="text-[11px] text-slate-500">Wall</Label>
      <Select
        value={String(door.edge)}
        onValueChange={(v) => update(door.id, { edge: Number(v) as 0 | 1 | 2 | 3 })}
      >
        <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="0" className="text-xs">Top wall</SelectItem>
          <SelectItem value="1" className="text-xs">Right wall</SelectItem>
          <SelectItem value="2" className="text-xs">Bottom wall</SelectItem>
          <SelectItem value="3" className="text-xs">Left wall</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <SliderRow
      label="Position along wall"
      value={door.offset}
      min={0.05}
      max={0.95}
      step={0.01}
      format={(v) => `${(v * 100).toFixed(0)}%`}
      onChange={(v) => update(door.id, { offset: v })}
    />

    <NumberField
      label="Width (ft)"
      value={door.width}
      step={0.5}
      min={2}
      onChange={(v) => update(door.id, { width: Math.max(2, v) })}
    />

    <div>
      <Label className="text-[11px] text-slate-500">Swing</Label>
      <Select
        value={door.swing}
        onValueChange={(v) => update(door.id, { swing: v as Door['swing'] })}
      >
        <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="in-left">Inward (left hinge)</SelectItem>
          <SelectItem value="in-right">Inward (right hinge)</SelectItem>
          <SelectItem value="out-left">Outward (left hinge)</SelectItem>
          <SelectItem value="out-right">Outward (right hinge)</SelectItem>
          <SelectItem value="double">Double leaf</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <Separator />

    <Button
      variant="outline"
      size="sm"
      className="w-full text-xs text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
      onClick={() => remove(door.id)}
    >
      <Trash2 className="w-3 h-3 mr-1" /> Delete Door
    </Button>
  </div>
);

// ===== WINDOW EDITOR =====
const WindowEditor: React.FC<{
  win: WindowItem;
  update: (id: string, patch: Partial<WindowItem>) => void;
  remove: (id: string) => void;
}> = ({ win, update, remove }) => (
  <div className="space-y-3">
    <div className="font-medium text-sm text-slate-900">Window</div>

    <div>
      <Label className="text-[11px] text-slate-500">Wall</Label>
      <Select
        value={String(win.edge)}
        onValueChange={(v) => update(win.id, { edge: Number(v) as 0 | 1 | 2 | 3 })}
      >
        <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="0">Top wall</SelectItem>
          <SelectItem value="1">Right wall</SelectItem>
          <SelectItem value="2">Bottom wall</SelectItem>
          <SelectItem value="3">Left wall</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <SliderRow
      label="Position"
      value={win.offset}
      min={0.05}
      max={0.95}
      step={0.01}
      format={(v) => `${(v * 100).toFixed(0)}%`}
      onChange={(v) => update(win.id, { offset: v })}
    />

    <NumberField
      label="Width (ft)"
      value={win.width}
      step={0.5}
      min={1.5}
      onChange={(v) => update(win.id, { width: Math.max(1.5, v) })}
    />

    <NumberField
      label="Sill Height (ft)"
      value={win.sillHeight}
      step={0.5}
      min={0}
      onChange={(v) => update(win.id, { sillHeight: Math.max(0, v) })}
    />

    <Separator />

    <Button
      variant="outline"
      size="sm"
      className="w-full text-xs text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
      onClick={() => remove(win.id)}
    >
      <Trash2 className="w-3 h-3 mr-1" /> Delete Window
    </Button>
  </div>
);

// ===== FURNITURE EDITOR =====
const FurnitureEditor: React.FC<{
  item: Furniture;
  update: (id: string, patch: Partial<Furniture>) => void;
  remove: (id: string) => void;
}> = ({ item, update, remove }) => {
  const cfg = FURNITURE_CONFIG[item.type];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded" style={{ background: cfg.color }} />
        <div className="font-medium text-sm text-slate-900">{cfg.label}</div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-2">
        <NumberField label="X" value={item.x} step={0.5} onChange={(v) => update(item.id, { x: v })} />
        <NumberField label="Y" value={item.y} step={0.5} onChange={(v) => update(item.id, { y: v })} />
        <NumberField
          label="Width"
          value={item.width}
          step={0.5}
          min={0.5}
          onChange={(v) => update(item.id, { width: Math.max(0.5, v) })}
        />
        <NumberField
          label="Height"
          value={item.height}
          step={0.5}
          min={0.5}
          onChange={(v) => update(item.id, { height: Math.max(0.5, v) })}
        />
      </div>

      <div>
        <Label className="text-[11px] text-slate-500">Rotation</Label>
        <div className="flex gap-1.5 mt-1">
          {[0, 90, 180, 270].map((r) => (
            <button
              key={r}
              className={`flex-1 text-xs py-1.5 rounded border ${item.rotation === r ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 hover:bg-slate-50'}`}
              onClick={() => update(item.id, { rotation: r })}
            >
              {r}°
            </button>
          ))}
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs"
        onClick={() => update(item.id, { rotation: (item.rotation + 15) % 360 })}
      >
        <RotateCw className="w-3 h-3 mr-1" /> Rotate 15°
      </Button>

      <Separator />

      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
        onClick={() => remove(item.id)}
      >
        <Trash2 className="w-3 h-3 mr-1" /> Delete Item
      </Button>
    </div>
  );
};

// ===== SHARED INPUTS =====
const NumberField: React.FC<{
  label: string;
  value: number;
  step?: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}> = ({ label, value, step = 1, min, max, onChange }) => {
  return (
    <div>
      <Label className="text-[11px] text-slate-500">{label}</Label>
      <Input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        step={step}
        min={min}
        max={max}
        onChange={(e) => {
          const n = parseFloat(e.target.value);
          if (!Number.isNaN(n)) onChange(n);
        }}
        className="h-8 text-xs mt-1"
      />
    </div>
  );
};

const SliderRow: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}> = ({ label, value, min, max, step, format, onChange }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label className="text-[11px] text-slate-500">{label}</Label>
        <span className="text-[11px] font-medium text-slate-700">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-slate-900"
      />
    </div>
  );
};

void formatLength;
