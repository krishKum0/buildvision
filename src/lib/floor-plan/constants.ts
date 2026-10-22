import type { FurnitureType, RoomType } from './types';

// ===== ROOM CONFIG =====
export interface RoomConfig {
  type: RoomType;
  label: string;
  color: string; // pastel fill
  borderColor: string;
  icon: string; // simple SVG path / emoji-style glyph label
  defaultSize: { w: number; h: number }; // in feet, used as suggestion
  minSize: { w: number; h: number };
}

export const ROOM_CONFIG: Record<RoomType, RoomConfig> = {
  living: {
    type: 'living',
    label: 'Living Room',
    color: '#fde68a',
    borderColor: '#ca8a04',
    icon: 'Sofa',
    defaultSize: { w: 12, h: 14 },
    minSize: { w: 8, h: 8 },
  },
  bedroom: {
    type: 'bedroom',
    label: 'Bedroom',
    color: '#bfdbfe',
    borderColor: '#1e40af',
    icon: 'BedSingle',
    defaultSize: { w: 11, h: 12 },
    minSize: { w: 7, h: 8 },
  },
  'master-bed': {
    type: 'master-bed',
    label: 'Master Bedroom',
    color: '#c4b5fd',
    borderColor: '#5b21b6',
    icon: 'BedDouble',
    defaultSize: { w: 14, h: 13 },
    minSize: { w: 10, h: 10 },
  },
  kitchen: {
    type: 'kitchen',
    label: 'Kitchen',
    color: '#fed7aa',
    borderColor: '#c2410c',
    icon: 'CookingPot',
    defaultSize: { w: 9, h: 9 },
    minSize: { w: 6, h: 6 },
  },
  bathroom: {
    type: 'bathroom',
    label: 'Bathroom',
    color: '#bbf7d0',
    borderColor: '#15803d',
    icon: 'Bath',
    defaultSize: { w: 7, h: 5 },
    minSize: { w: 4, h: 4 },
  },
  dining: {
    type: 'dining',
    label: 'Dining',
    color: '#fbcfe8',
    borderColor: '#9d174d',
    icon: 'Utensils',
    defaultSize: { w: 10, h: 9 },
    minSize: { w: 7, h: 6 },
  },
  prayer: {
    type: 'prayer',
    label: 'Prayer Room',
    color: '#ddd6fe',
    borderColor: '#6d28d9',
    icon: 'Sparkles',
    defaultSize: { w: 6, h: 7 },
    minSize: { w: 4, h: 4 },
  },
  parking: {
    type: 'parking',
    label: 'Parking',
    color: '#e2e8f0',
    borderColor: '#475569',
    icon: 'Car',
    defaultSize: { w: 10, h: 18 },
    minSize: { w: 8, h: 16 },
  },
  porch: {
    type: 'porch',
    label: 'Porch',
    color: '#fef9c3',
    borderColor: '#a16207',
    icon: 'DoorOpen',
    defaultSize: { w: 6, h: 8 },
    minSize: { w: 4, h: 4 },
  },
  stair: {
    type: 'stair',
    label: 'Staircase',
    color: '#e0e7ff',
    borderColor: '#3730a3',
    icon: 'ArrowUp',
    defaultSize: { w: 6, h: 12 },
    minSize: { w: 4, h: 8 },
  },
  office: {
    type: 'office',
    label: 'Office',
    color: '#fed7aa',
    borderColor: '#9a3412',
    icon: 'Briefcase',
    defaultSize: { w: 9, h: 10 },
    minSize: { w: 6, h: 7 },
  },
  storage: {
    type: 'storage',
    label: 'Storage',
    color: '#e5e5e5',
    borderColor: '#525252',
    icon: 'Box',
    defaultSize: { w: 6, h: 6 },
    minSize: { w: 3, h: 3 },
  },
  balcony: {
    type: 'balcony',
    label: 'Balcony',
    color: '#fef3c7',
    borderColor: '#92400e',
    icon: 'Sun',
    defaultSize: { w: 10, h: 4 },
    minSize: { w: 4, h: 3 },
  },
  hall: {
    type: 'hall',
    label: 'Hall',
    color: '#fef9c3',
    borderColor: '#a16207',
    icon: 'Square',
    defaultSize: { w: 8, h: 12 },
    minSize: { w: 6, h: 6 },
  },
  foyer: {
    type: 'foyer',
    label: 'Foyer',
    color: '#fce7f3',
    borderColor: '#9d174d',
    icon: 'DoorOpen',
    defaultSize: { w: 5, h: 5 },
    minSize: { w: 3, h: 3 },
  },
  corridor: {
    type: 'corridor',
    label: 'Corridor',
    color: '#f1f5f9',
    borderColor: '#64748b',
    icon: 'MoveHorizontal',
    defaultSize: { w: 4, h: 12 },
    minSize: { w: 3, h: 4 },
  },
  laundry: {
    type: 'laundry',
    label: 'Laundry',
    color: '#cffafe',
    borderColor: '#0e7490',
    icon: 'WashingMachine',
    defaultSize: { w: 6, h: 6 },
    minSize: { w: 4, h: 4 },
  },
  garden: {
    type: 'garden',
    label: 'Garden',
    color: '#bbf7d0',
    borderColor: '#166534',
    icon: 'Trees',
    defaultSize: { w: 10, h: 8 },
    minSize: { w: 4, h: 4 },
  },
};

export const ROOM_PALETTE: RoomType[] = [
  'living',
  'bedroom',
  'master-bed',
  'kitchen',
  'bathroom',
  'dining',
  'prayer',
  'parking',
  'porch',
  'stair',
  'office',
  'storage',
  'balcony',
  'hall',
  'foyer',
  'corridor',
  'laundry',
  'garden',
];

// ===== FURNITURE CATALOG =====
export interface FurnitureConfig {
  type: FurnitureType;
  label: string;
  defaultSize: { w: number; h: number };
  color: string;
  category: 'bedroom' | 'living' | 'kitchen' | 'bath' | 'office' | 'outdoor' | 'other';
}

export const FURNITURE_CONFIG: Record<FurnitureType, FurnitureConfig> = {
  'bed-single': {
    type: 'bed-single',
    label: 'Single Bed',
    defaultSize: { w: 3.2, h: 6.5 },
    color: '#94a3b8',
    category: 'bedroom',
  },
  'bed-double': {
    type: 'bed-double',
    label: 'Double Bed',
    defaultSize: { w: 5, h: 6.8 },
    color: '#94a3b8',
    category: 'bedroom',
  },
  'sofa-2': {
    type: 'sofa-2',
    label: '2-Seater Sofa',
    defaultSize: { w: 5, h: 2.5 },
    color: '#a78bfa',
    category: 'living',
  },
  'sofa-3': {
    type: 'sofa-3',
    label: '3-Seater Sofa',
    defaultSize: { w: 7, h: 2.8 },
    color: '#a78bfa',
    category: 'living',
  },
  'dining-table': {
    type: 'dining-table',
    label: 'Dining Table',
    defaultSize: { w: 5, h: 3 },
    color: '#92400e',
    category: 'living',
  },
  'coffee-table': {
    type: 'coffee-table',
    label: 'Coffee Table',
    defaultSize: { w: 3, h: 2 },
    color: '#92400e',
    category: 'living',
  },
  toilet: {
    type: 'toilet',
    label: 'Toilet',
    defaultSize: { w: 1.8, h: 2.5 },
    color: '#cbd5e1',
    category: 'bath',
  },
  sink: {
    type: 'sink',
    label: 'Wash Basin',
    defaultSize: { w: 1.8, h: 1.5 },
    color: '#cbd5e1',
    category: 'bath',
  },
  shower: {
    type: 'shower',
    label: 'Shower',
    defaultSize: { w: 3, h: 3 },
    color: '#bae6fd',
    category: 'bath',
  },
  bathtub: {
    type: 'bathtub',
    label: 'Bathtub',
    defaultSize: { w: 5, h: 2.5 },
    color: '#bae6fd',
    category: 'bath',
  },
  stove: {
    type: 'stove',
    label: 'Stove',
    defaultSize: { w: 3, h: 2 },
    color: '#475569',
    category: 'kitchen',
  },
  fridge: {
    type: 'fridge',
    label: 'Refrigerator',
    defaultSize: { w: 2.5, h: 2.5 },
    color: '#94a3b8',
    category: 'kitchen',
  },
  'kitchen-counter': {
    type: 'kitchen-counter',
    label: 'Counter',
    defaultSize: { w: 6, h: 2 },
    color: '#b45309',
    category: 'kitchen',
  },
  wardrobe: {
    type: 'wardrobe',
    label: 'Wardrobe',
    defaultSize: { w: 6, h: 2 },
    color: '#92400e',
    category: 'bedroom',
  },
  desk: {
    type: 'desk',
    label: 'Desk',
    defaultSize: { w: 4, h: 1.8 },
    color: '#92400e',
    category: 'office',
  },
  chair: {
    type: 'chair',
    label: 'Chair',
    defaultSize: { w: 1.6, h: 1.6 },
    color: '#7c2d12',
    category: 'office',
  },
  tv: {
    type: 'tv',
    label: 'TV Unit',
    defaultSize: { w: 5, h: 0.6 },
    color: '#1f2937',
    category: 'living',
  },
  car: {
    type: 'car',
    label: 'Car',
    defaultSize: { w: 6, h: 10 },
    color: '#3b82f6',
    category: 'outdoor',
  },
  motorcycle: {
    type: 'motorcycle',
    label: 'Motorcycle',
    defaultSize: { w: 2.5, h: 6 },
    color: '#dc2626',
    category: 'outdoor',
  },
  plant: {
    type: 'plant',
    label: 'Plant',
    defaultSize: { w: 1.5, h: 1.5 },
    color: '#16a34a',
    category: 'outdoor',
  },
  'washing-machine': {
    type: 'washing-machine',
    label: 'Washing Machine',
    defaultSize: { w: 2.2, h: 2.2 },
    color: '#94a3b8',
    category: 'bath',
  },
  bookshelf: {
    type: 'bookshelf',
    label: 'Bookshelf',
    defaultSize: { w: 4, h: 1.2 },
    color: '#92400e',
    category: 'office',
  },
  'dressing-table': {
    type: 'dressing-table',
    label: 'Dressing Table',
    defaultSize: { w: 4, h: 1.6 },
    color: '#92400e',
    category: 'bedroom',
  },
  'prayer-mat': {
    type: 'prayer-mat',
    label: 'Prayer Mat',
    defaultSize: { w: 2, h: 3 },
    color: '#7c3aed',
    category: 'other',
  },
  staircase: {
    type: 'staircase',
    label: 'Staircase',
    defaultSize: { w: 6, h: 12 },
    color: '#94a3b8',
    category: 'other',
  },
};

export const FURNITURE_PALETTE: FurnitureType[] = Object.keys(FURNITURE_CONFIG) as FurnitureType[];

// ===== WALL THICKNESS / DOOR SIZES (in plan units) =====
export const WALL_THICKNESS = 0.5; // 6 inches
export const DEFAULT_DOOR_WIDTH = 3; // 3 ft
export const DEFAULT_WINDOW_WIDTH = 4; // 4 ft

// ===== CONVERSION =====
export const FT_TO_M = 0.3048;
export const M_TO_FT = 3.28084;

export function convertLength(value: number, from: 'ft' | 'm', to: 'ft' | 'm'): number {
  if (from === to) return value;
  return from === 'ft' ? value * FT_TO_M : value * M_TO_FT;
}

export function formatLength(value: number, unit: 'ft' | 'm'): string {
  if (unit === 'ft') {
    const ft = Math.floor(value);
    const inches = Math.round((value - ft) * 12);
    if (inches === 12) return `${ft + 1} ft`;
    if (inches === 0) return `${ft} ft`;
    return `${ft} ft ${inches} in`;
  }
  return `${value.toFixed(2)} m`;
}
