'use client';

import { create } from 'zustand';
import type {
  Door,
  FloorPlan,
  Furniture,
  Room,
  ViewTransform,
  Window,
} from './types';
import { generateFloorPlan } from './generator';
import { FURNITURE_CONFIG, ROOM_CONFIG } from './constants';

// ===== SELECTION =====
export type SelectionKind = 'room' | 'door' | 'window' | 'furniture' | 'none';
export interface Selection {
  kind: SelectionKind;
  id: string | null;
}

export type ToolMode =
  | 'select'
  | 'add-room'
  | 'add-door'
  | 'add-window'
  | 'add-furniture'
  | 'pan';

interface EditorState {
  plan: FloorPlan;
  view: ViewTransform;
  selection: Selection;
  mode: ToolMode;
  pendingRoomType?: Room['type'];
  pendingFurnitureType?: Furniture['type'];
  // history
  past: FloorPlan[];
  future: FloorPlan[];
  // panels
  sidebarOpen: boolean;
  propertiesOpen: boolean;
  // actions
  setPlan: (plan: FloorPlan) => void;
  regenerate: (params: Parameters<typeof generateFloorPlan>[0]) => void;
  setView: (v: Partial<ViewTransform>) => void;
  zoomBy: (factor: number, centerX?: number, centerY?: number) => void;
  resetView: () => void;
  setSelection: (s: Selection) => void;
  clearSelection: () => void;
  setMode: (m: ToolMode) => void;
  setPendingRoomType: (t?: Room['type']) => void;
  setPendingFurnitureType: (t?: Furniture['type']) => void;
  setSidebarOpen: (v: boolean) => void;
  setPropertiesOpen: (v: boolean) => void;

  // mutations (each pushes history)
  updateRoom: (id: string, patch: Partial<Room>) => void;
  addRoom: (r: Omit<Room, 'id'>) => void;
  removeRoom: (id: string) => void;
  updateDoor: (id: string, patch: Partial<Door>) => void;
  addDoor: (d: Omit<Door, 'id'>) => void;
  removeDoor: (id: string) => void;
  updateWindow: (id: string, patch: Partial<Window>) => void;
  addWindow: (w: Omit<Window, 'id'>) => void;
  removeWindow: (id: string) => void;
  updateFurniture: (id: string, patch: Partial<Furniture>) => void;
  addFurniture: (f: Omit<Furniture, 'id'>) => void;
  removeFurniture: (id: string) => void;

  // history
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

let _idc = 0;
function nid(prefix: string): string {
  _idc += 1;
  return `${prefix}_${Date.now().toString(36)}_${_idc.toString(36)}`;
}

const DEFAULT_PLAN = generateFloorPlan({
  landWidth: 30,
  landDepth: 40,
  unit: 'ft',
  buildingType: 'house',
  floors: 2,
  facing: 'N',
});

const MAX_HISTORY = 50;

function pushHistory(state: EditorState): Partial<EditorState> {
  return {
    past: [...state.past, state.plan].slice(-MAX_HISTORY),
    future: [],
  };
}

export const useEditorStore = create<EditorState>((set, get) => ({
  plan: DEFAULT_PLAN,
  view: { scale: 12, offsetX: 60, offsetY: 60 },
  selection: { kind: 'none', id: null },
  mode: 'select',
  pendingRoomType: undefined,
  pendingFurnitureType: undefined,
  past: [],
  future: [],
  sidebarOpen: true,
  propertiesOpen: true,

  setPlan: (plan) => set({ plan, past: [], future: [], selection: { kind: 'none', id: null } }),

  regenerate: (params) =>
    set((state) => ({
      ...pushHistory(state),
      plan: generateFloorPlan(params),
      selection: { kind: 'none', id: null },
    })),

  setView: (v) => set((state) => ({ view: { ...state.view, ...v } })),

  zoomBy: (factor, cx, cy) =>
    set((state) => {
      const newScale = Math.min(60, Math.max(2, state.view.scale * factor));
      const ratio = newScale / state.view.scale;
      const ox = cx !== undefined ? cx - (cx - state.view.offsetX) * ratio : state.view.offsetX;
      const oy = cy !== undefined ? cy - (cy - state.view.offsetY) * ratio : state.view.offsetY;
      return { view: { scale: newScale, offsetX: ox, offsetY: oy } };
    }),

  resetView: () => set({ view: { scale: 12, offsetX: 60, offsetY: 60 } }),

  setSelection: (s) => set({ selection: s }),
  clearSelection: () => set({ selection: { kind: 'none', id: null } }),
  setMode: (m) => set({ mode: m }),
  setPendingRoomType: (t) => set({ pendingRoomType: t }),
  setPendingFurnitureType: (t) => set({ pendingFurnitureType: t }),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  setPropertiesOpen: (v) => set({ propertiesOpen: v }),

  updateRoom: (id, patch) =>
    set((state) => ({
      ...pushHistory(state),
      plan: {
        ...state.plan,
        rooms: state.plan.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      },
    })),

  addRoom: (r) =>
    set((state) => ({
      ...pushHistory(state),
      plan: {
        ...state.plan,
        rooms: [...state.plan.rooms, { ...r, id: nid('room') }],
      },
      selection: { kind: 'room', id: null },
    })),

  removeRoom: (id) =>
    set((state) => ({
      ...pushHistory(state),
      plan: {
        ...state.plan,
        rooms: state.plan.rooms.filter((r) => r.id !== id),
        doors: state.plan.doors.filter((d) => d.roomId !== id),
        windows: state.plan.windows.filter((w) => w.roomId !== id),
        furniture: state.plan.furniture.filter((f) => f.roomId !== id),
      },
      selection: { kind: 'none', id: null },
    })),

  updateDoor: (id, patch) =>
    set((state) => ({
      ...pushHistory(state),
      plan: {
        ...state.plan,
        doors: state.plan.doors.map((d) => (d.id === id ? { ...d, ...patch } : d)),
      },
    })),

  addDoor: (d) =>
    set((state) => ({
      ...pushHistory(state),
      plan: {
        ...state.plan,
        doors: [...state.plan.doors, { ...d, id: nid('door') }],
      },
    })),

  removeDoor: (id) =>
    set((state) => ({
      ...pushHistory(state),
      plan: {
        ...state.plan,
        doors: state.plan.doors.filter((d) => d.id !== id),
      },
      selection: { kind: 'none', id: null },
    })),

  updateWindow: (id, patch) =>
    set((state) => ({
      ...pushHistory(state),
      plan: {
        ...state.plan,
        windows: state.plan.windows.map((w) => (w.id === id ? { ...w, ...patch } : w)),
      },
    })),

  addWindow: (w) =>
    set((state) => ({
      ...pushHistory(state),
      plan: {
        ...state.plan,
        windows: [...state.plan.windows, { ...w, id: nid('win') }],
      },
    })),

  removeWindow: (id) =>
    set((state) => ({
      ...pushHistory(state),
      plan: {
        ...state.plan,
        windows: state.plan.windows.filter((w) => w.id !== id),
      },
      selection: { kind: 'none', id: null },
    })),

  updateFurniture: (id, patch) =>
    set((state) => ({
      ...pushHistory(state),
      plan: {
        ...state.plan,
        furniture: state.plan.furniture.map((f) => (f.id === id ? { ...f, ...patch } : f)),
      },
    })),

  addFurniture: (f) =>
    set((state) => ({
      ...pushHistory(state),
      plan: {
        ...state.plan,
        furniture: [...state.plan.furniture, { ...f, id: nid('fur') }],
      },
    })),

  removeFurniture: (id) =>
    set((state) => ({
      ...pushHistory(state),
      plan: {
        ...state.plan,
        furniture: state.plan.furniture.filter((f) => f.id !== id),
      },
      selection: { kind: 'none', id: null },
    })),

  undo: () =>
    set((state) => {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        future: [state.plan, ...state.future].slice(0, MAX_HISTORY),
        plan: previous,
        selection: { kind: 'none', id: null },
      };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        future: state.future.slice(1),
        past: [...state.past, state.plan].slice(-MAX_HISTORY),
        plan: next,
        selection: { kind: 'none', id: null },
      };
    }),

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
}));

// expose helpers for child components
export { ROOM_CONFIG, FURNITURE_CONFIG };
