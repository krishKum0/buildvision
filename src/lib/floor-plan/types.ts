// Core type definitions for the floor plan editor.
// All measurements are stored in the plan's `unit` ('ft' | 'm').

export type Unit = 'ft' | 'm';

export type BuildingType = 'house' | 'apartment' | 'building';

export type RoomType =
  | 'living'
  | 'bedroom'
  | 'master-bed'
  | 'kitchen'
  | 'bathroom'
  | 'dining'
  | 'prayer'
  | 'parking'
  | 'porch'
  | 'stair'
  | 'office'
  | 'storage'
  | 'balcony'
  | 'hall'
  | 'foyer'
  | 'corridor'
  | 'laundry'
  | 'garden';

export interface Room {
  id: string;
  type: RoomType;
  name: string;
  // position (top-left corner) and size, all in plan units
  x: number;
  y: number;
  width: number;
  height: number;
  color: string; // fill color (CSS)
}

// Doors / windows are attached to a room edge.
// edge: 0 = top, 1 = right, 2 = bottom, 3 = left
export type Edge = 0 | 1 | 2 | 3;

export interface Door {
  id: string;
  roomId: string;
  edge: Edge;
  // position 0..1 along the edge (center of the door)
  offset: number;
  width: number; // door opening width in plan units
  swing: 'in-left' | 'in-right' | 'out-left' | 'out-right' | 'double';
}

export interface Window {
  id: string;
  roomId: string;
  edge: Edge;
  offset: number; // 0..1
  width: number; // window width in plan units
  sillHeight: number; // for visual only
}

export type FurnitureType =
  | 'bed-single'
  | 'bed-double'
  | 'sofa-2'
  | 'sofa-3'
  | 'dining-table'
  | 'coffee-table'
  | 'toilet'
  | 'sink'
  | 'shower'
  | 'bathtub'
  | 'stove'
  | 'fridge'
  | 'kitchen-counter'
  | 'wardrobe'
  | 'desk'
  | 'chair'
  | 'tv'
  | 'car'
  | 'motorcycle'
  | 'plant'
  | 'washing-machine'
  | 'bookshelf'
  | 'dressing-table'
  | 'prayer-mat'
  | 'staircase';

export interface Furniture {
  id: string;
  type: FurnitureType;
  roomId: string;
  // position relative to the floor origin (absolute), in plan units
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees 0/90/180/270
  label?: string;
}

export interface FloorPlan {
  id: string;
  name: string;
  landWidth: number; // total plot width (X axis)
  landDepth: number; // total plot depth (Y axis)
  unit: Unit;
  buildingType: BuildingType;
  floors: number;
  facing: 'N' | 'S' | 'E' | 'W';
  rooms: Room[];
  doors: Door[];
  windows: Window[];
  furniture: Furniture[];
}

export interface ViewTransform {
  scale: number; // pixels per plan-unit
  offsetX: number; // px
  offsetY: number; // px
}
