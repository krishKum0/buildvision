import type {
  BuildingType,
  Door,
  Edge,
  FloorPlan,
  Furniture,
  Room,
  RoomType,
  Unit,
  Window,
} from './types';
import {
  DEFAULT_DOOR_WIDTH,
  DEFAULT_WINDOW_WIDTH,
  FURNITURE_CONFIG,
  ROOM_CONFIG,
} from './constants';

let _idCounter = 0;
function uid(prefix: string): string {
  _idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${_idCounter.toString(36)}`;
}

function roundHalf(n: number): number {
  return Math.round(n * 2) / 2;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Generate a sensible default floor plan from land dimensions.
 *
 * Layout strategy (all in plan units, typically feet):
 *   ┌─────────────────────────────────────────────┐
 *   │ Porch │ Staircase │   Living Room           │  ← front strip (top)
 *   ├───────┴───────────┼─────────────────────────┤
 *   │  Kitchen  │ Dining│   Master Bedroom        │
 *   ├────────────┴──────┴─────────────────────────┤
 *   │ Bathroom │ Prayer │   Bedroom 1              │
 *   ├──────────┴────────┴─────────────────────────┤
 *   │ Bedroom 2  /  Office │       Parking         │
 *   └─────────────────────────────────────────────┘
 *
 * The algorithm:
 *   1. Reserve parking strip (right side if plot ≥ 24' wide; else bottom)
 *   2. Reserve a front strip for porch + staircase + living room
 *   3. Allocate remaining area to a grid of rooms, sized proportionally
 *   4. Place doors between adjacent rooms and to exterior
 *   5. Place windows on exterior walls of habitable rooms
 *   6. Place sensible default furniture per room
 */
export function generateFloorPlan(params: {
  landWidth: number;
  landDepth: number;
  unit: Unit;
  buildingType: BuildingType;
  floors: number;
  facing?: 'N' | 'S' | 'E' | 'W';
}): FloorPlan {
  const {
    landWidth,
    landDepth,
    unit,
    buildingType,
    floors,
    facing = 'N',
  } = params;

  const W = Math.max(landWidth, 12);
  const H = Math.max(landDepth, 16);

  const rooms: Room[] = [];
  const doors: Door[] = [];
  const furniture: Furniture[] = [];
  const windows: Window[] = [];

  // Setback margin
  const margin = 0.5;
  const ix = margin;
  const iy = margin;
  const iW = W - margin * 2;
  const iH = H - margin * 2;

  // ===== Step 1: reserve parking =====
  // Place parking on the right side if plot is wide enough, otherwise along bottom
  const useRightParking = iW >= 24;
  let parking: Rect | null = null;
  let mainZone: Rect;

  if (useRightParking) {
    const pw = Math.min(10, Math.max(8, iW * 0.28));
    parking = { x: ix + iW - pw, y: iy, w: pw, h: iH };
    mainZone = { x: ix, y: iy, w: iW - pw, h: iH };
  } else {
    const ph = Math.min(18, Math.max(14, iH * 0.32));
    parking = { x: ix, y: iy + iH - ph, w: iW, h: ph };
    mainZone = { x: ix, y: iy, w: iW, h: iH - ph };
  }

  // ===== Step 2: layout main zone into a grid =====
  // Split the main zone into rows + columns, each cell becomes a room.
  // Use sensible row heights based on the plot's overall proportions.
  const layout = layoutMainZone(mainZone, floors);

  // Add rooms
  if (parking) {
    addRoom(rooms, parking, 'parking', 'Parking');
  }
  for (const cell of layout.cells) {
    addRoom(rooms, cell.rect, cell.type, ROOM_CONFIG[cell.type].label);
  }

  // ===== Step 3: doors =====
  placeDoors(rooms, doors, ix, iy, iW, iH);

  // ===== Step 4: windows =====
  placeWindows(rooms, windows, ix, iy, iW, iH);

  // ===== Step 5: furniture =====
  for (const r of rooms) {
    placeFurniture(r, furniture);
  }

  return {
    id: uid('plan'),
    name: `${W}×${H} ${buildingType}`,
    landWidth: W,
    landDepth: H,
    unit,
    buildingType,
    floors,
    facing,
    rooms,
    doors,
    windows,
    furniture,
  };
}

function addRoom(rooms: Room[], rect: Rect, type: RoomType, name: string) {
  const cfg = ROOM_CONFIG[type];
  // Note: we deliberately do NOT enforce minSize here — the generator must
  // produce rooms that fit the available zone. Clamping to minSize would
  // make adjacent rooms overlap.
  const w = roundHalf(rect.w);
  const h = roundHalf(rect.h);
  rooms.push({
    id: uid('room'),
    type,
    name,
    x: roundHalf(rect.x),
    y: roundHalf(rect.y),
    width: Math.max(2, w),
    height: Math.max(2, h),
    color: cfg.color,
  });
}

// ===== LAYOUT MAIN ZONE =====
interface Cell {
  rect: Rect;
  type: RoomType;
}

function layoutMainZone(zone: Rect, floors: number): { cells: Cell[] } {
  // Determine how many "rows" of rooms we want, based on zone height.
  // Row heights are proportional to typical room heights.
  const cells: Cell[] = [];

  // Decide room composition based on area
  const area = zone.w * zone.h;
  let plan: RoomType[];
  if (area < 300) {
    // small plot: 4 rooms
    plan = ['living', 'kitchen', 'bedroom', 'bathroom'];
  } else if (area < 600) {
    plan = ['living', 'kitchen', 'bedroom', 'bathroom', 'dining'];
  } else if (area < 1000) {
    plan = ['living', 'kitchen', 'dining', 'master-bed', 'bedroom', 'bathroom'];
  } else if (area < 1500) {
    plan = ['living', 'kitchen', 'dining', 'master-bed', 'bedroom', 'bedroom', 'bathroom', 'prayer'];
  } else {
    plan = ['living', 'kitchen', 'dining', 'master-bed', 'bedroom', 'bedroom', 'bathroom', 'prayer', 'office', 'laundry'];
  }

  // Reserve a front strip for porch + staircase + living
  const frontStripH = Math.min(Math.max(zone.h * 0.22, 8), 14);
  const frontStrip: Rect = { x: zone.x, y: zone.y, w: zone.w, h: frontStripH };

  // Porch + Staircase + Living on the front strip
  const porchW = Math.min(zone.w * 0.18, 8);
  const stairW = floors > 1 ? 6 : 0;
  const livingW = Math.max(8, frontStrip.w - porchW - stairW);

  cells.push({
    rect: { x: frontStrip.x, y: frontStrip.y, w: porchW, h: frontStrip.h },
    type: 'porch',
  });
  if (stairW > 0) {
    cells.push({
      rect: { x: frontStrip.x + porchW, y: frontStrip.y, w: stairW, h: frontStrip.h },
      type: 'stair',
    });
  }
  cells.push({
    rect: {
      x: frontStrip.x + porchW + stairW,
      y: frontStrip.y,
      w: livingW,
      h: frontStrip.h,
    },
    type: 'living',
  });

  // Remaining zone (below front strip)
  const rest: Rect = {
    x: zone.x,
    y: zone.y + frontStripH,
    w: zone.w,
    h: zone.h - frontStripH,
  };

  // Split the remaining zone into 2 columns + 3 rows
  // Left column: kitchen (top) + bathroom (mid) + prayer (bottom)
  // Right column: dining (top) + master-bed (mid) + bedroom (bottom)
  // If extra rooms: add to additional rows on right.

  // Plan: divide into 3 rows
  const remainingRooms = plan.filter(
    (t) => !['living', 'porch', 'stair'].includes(t)
  );

  // Pick layout: 2 columns × N rows when there are 4+ rooms and width allows
  const colCount = remainingRooms.length >= 4 && rest.w >= 14 ? 2 : 1;
  const rowCount = Math.ceil(remainingRooms.length / colCount);
  const colW = rest.w / colCount;
  const rowH = rest.h / rowCount;

  for (let i = 0; i < remainingRooms.length; i++) {
    const c = i % colCount;
    const r = Math.floor(i / colCount);
    cells.push({
      rect: {
        x: rest.x + c * colW,
        y: rest.y + r * rowH,
        w: colW,
        h: rowH,
      },
      type: remainingRooms[i],
    });
  }

  return { cells };
}

// ===== DOORS =====
function placeDoors(
  rooms: Room[],
  doors: Door[],
  ix: number,
  iy: number,
  iW: number,
  iH: number
) {
  const findAdjacent = (r: Room, edge: Edge): Room | null => {
    return (
      rooms.find((o) => {
        if (o.id === r.id) return false;
        switch (edge) {
          case 0:
            return (
              Math.abs(o.y + o.height - r.y) < 0.6 &&
              o.x < r.x + r.width - 0.5 &&
              o.x + o.width > r.x + 0.5
            );
          case 1:
            return (
              Math.abs(o.x - (r.x + r.width)) < 0.6 &&
              o.y < r.y + r.height - 0.5 &&
              o.y + o.height > r.y + 0.5
            );
          case 2:
            return (
              Math.abs(o.y - (r.y + r.height)) < 0.6 &&
              o.x < r.x + r.width - 0.5 &&
              o.x + o.width > r.x + 0.5
            );
          default:
            return (
              Math.abs(o.x + o.width - r.x) < 0.6 &&
              o.y < r.y + r.height - 0.5 &&
              o.y + o.height > r.y + 0.5
            );
        }
      }) ?? null
    );
  };

  const isExterior = (r: Room, edge: Edge): boolean => {
    switch (edge) {
      case 0:
        return Math.abs(r.y - iy) < 0.6;
      case 1:
        return Math.abs(r.x + r.width - (ix + iW)) < 0.6;
      case 2:
        return Math.abs(r.y + r.height - (iy + iH)) < 0.6;
      default:
        return Math.abs(r.x - ix) < 0.6;
    }
  };

  for (const r of rooms) {
    let placed = false;

    // Porch: exterior front door on top edge
    if (r.type === 'porch') {
      doors.push({
        id: uid('door'),
        roomId: r.id,
        edge: 0,
        offset: 0.5,
        width: DEFAULT_DOOR_WIDTH,
        swing: 'in-left',
      });
      // Also a door between porch and living (right edge of porch)
      const living = findAdjacent(r, 1);
      if (living) {
        doors.push({
          id: uid('door'),
          roomId: r.id,
          edge: 1,
          offset: 0.5,
          width: DEFAULT_DOOR_WIDTH,
          swing: 'in-right',
        });
      }
      placed = true;
      continue;
    }

    // Parking: exterior door / gate
    if (r.type === 'parking') {
      // try exterior edge (whichever is on the boundary)
      for (const e of [0, 2, 1, 3] as Edge[]) {
        if (isExterior(r, e)) {
          doors.push({
            id: uid('door'),
            roomId: r.id,
            edge: e,
            offset: 0.5,
            width: 8,
            swing: 'in-right',
          });
          placed = true;
          break;
        }
      }
      continue;
    }

    // Living: door to porch (interior on left)
    if (r.type === 'living' && !placed) {
      const porch = findAdjacent(r, 3);
      if (porch && porch.type === 'porch') {
        doors.push({
          id: uid('door'),
          roomId: r.id,
          edge: 3,
          offset: 0.5,
          width: DEFAULT_DOOR_WIDTH,
          swing: 'in-left',
        });
        placed = true;
      }
    }

    // Kitchen: door to adjacent dining or living
    if (r.type === 'kitchen' && !placed) {
      for (const e of [1, 2, 0, 3] as Edge[]) {
        const adj = findAdjacent(r, e);
        if (adj && (adj.type === 'dining' || adj.type === 'living')) {
          doors.push({
            id: uid('door'),
            roomId: r.id,
            edge: e,
            offset: 0.5,
            width: DEFAULT_DOOR_WIDTH,
            swing: 'in-left',
          });
          placed = true;
          break;
        }
      }
    }

    // Dining: door to living or kitchen
    if (r.type === 'dining' && !placed) {
      for (const e of [0, 3, 1, 2] as Edge[]) {
        const adj = findAdjacent(r, e);
        if (adj && (adj.type === 'living' || adj.type === 'kitchen')) {
          doors.push({
            id: uid('door'),
            roomId: r.id,
            edge: e,
            offset: 0.5,
            width: DEFAULT_DOOR_WIDTH,
            swing: 'in-right',
          });
          placed = true;
          break;
        }
      }
    }

    // Bathroom: door to adjacent room (interior)
    if (r.type === 'bathroom' && !placed) {
      for (const e of [0, 1, 2, 3] as Edge[]) {
        if (isExterior(r, e)) continue;
        const adj = findAdjacent(r, e);
        if (adj && adj.type !== 'bathroom') {
          doors.push({
            id: uid('door'),
            roomId: r.id,
            edge: e,
            offset: 0.5,
            width: DEFAULT_DOOR_WIDTH - 0.5,
            swing: 'in-left',
          });
          placed = true;
          break;
        }
      }
    }

    // Prayer: door to adjacent room (interior)
    if (r.type === 'prayer' && !placed) {
      for (const e of [0, 1, 2, 3] as Edge[]) {
        if (isExterior(r, e)) continue;
        const adj = findAdjacent(r, e);
        if (adj) {
          doors.push({
            id: uid('door'),
            roomId: r.id,
            edge: e,
            offset: 0.5,
            width: DEFAULT_DOOR_WIDTH - 0.5,
            swing: 'in-right',
          });
          placed = true;
          break;
        }
      }
    }

    // Bedrooms: door to adjacent interior room (corridor/living/dining)
    if ((r.type === 'bedroom' || r.type === 'master-bed') && !placed) {
      for (const e of [1, 3, 0, 2] as Edge[]) {
        if (isExterior(r, e)) continue;
        const adj = findAdjacent(r, e);
        if (adj && adj.type !== 'bathroom' && adj.type !== 'kitchen') {
          doors.push({
            id: uid('door'),
            roomId: r.id,
            edge: e,
            offset: 0.5,
            width: DEFAULT_DOOR_WIDTH,
            swing: 'in-left',
          });
          placed = true;
          break;
        }
      }
    }

    // Office: door to adjacent room
    if (r.type === 'office' && !placed) {
      for (const e of [0, 1, 2, 3] as Edge[]) {
        if (isExterior(r, e)) continue;
        const adj = findAdjacent(r, e);
        if (adj) {
          doors.push({
            id: uid('door'),
            roomId: r.id,
            edge: e,
            offset: 0.5,
            width: DEFAULT_DOOR_WIDTH,
            swing: 'in-left',
          });
          placed = true;
          break;
        }
      }
    }

    // Laundry: door to adjacent
    if (r.type === 'laundry' && !placed) {
      for (const e of [0, 1, 2, 3] as Edge[]) {
        if (isExterior(r, e)) continue;
        const adj = findAdjacent(r, e);
        if (adj) {
          doors.push({
            id: uid('door'),
            roomId: r.id,
            edge: e,
            offset: 0.5,
            width: DEFAULT_DOOR_WIDTH - 0.5,
            swing: 'in-left',
          });
          placed = true;
          break;
        }
      }
    }

    // Stair: open, no door
    if (r.type === 'stair') {
      placed = true;
    }

    // Fallback: any interior edge
    if (!placed) {
      for (const e of [0, 1, 2, 3] as Edge[]) {
        if (isExterior(r, e)) continue;
        doors.push({
          id: uid('door'),
          roomId: r.id,
          edge: e,
          offset: 0.5,
          width: DEFAULT_DOOR_WIDTH,
          swing: 'in-left',
        });
        placed = true;
        break;
      }
      // last resort: exterior edge 0
      if (!placed) {
        doors.push({
          id: uid('door'),
          roomId: r.id,
          edge: 0,
          offset: 0.5,
          width: DEFAULT_DOOR_WIDTH,
          swing: 'in-left',
        });
      }
    }
  }
}

// ===== WINDOWS =====
function placeWindows(
  rooms: Room[],
  windows: Window[],
  ix: number,
  iy: number,
  iW: number,
  iH: number
) {
  const habitable: RoomType[] = [
    'living',
    'bedroom',
    'master-bed',
    'kitchen',
    'dining',
    'prayer',
    'office',
    'hall',
  ];

  const isExterior = (r: Room, edge: Edge): boolean => {
    switch (edge) {
      case 0:
        return Math.abs(r.y - iy) < 0.6;
      case 1:
        return Math.abs(r.x + r.width - (ix + iW)) < 0.6;
      case 2:
        return Math.abs(r.y + r.height - (iy + iH)) < 0.6;
      default:
        return Math.abs(r.x - ix) < 0.6;
    }
  };

  for (const r of rooms) {
    if (!habitable.includes(r.type)) continue;
    for (const e of [0, 1, 2, 3] as Edge[]) {
      if (!isExterior(r, e)) continue;
      const len = e === 0 || e === 2 ? r.width : r.height;
      if (len < 4) continue;
      const winW = Math.min(DEFAULT_WINDOW_WIDTH, len - 1);
      const positions = len >= 10 ? [0.25, 0.75] : [0.5];
      for (const p of positions) {
        windows.push({
          id: uid('win'),
          roomId: r.id,
          edge: e,
          offset: p,
          width: winW,
          sillHeight: 3,
        });
      }
    }
  }
}

// ===== FURNITURE =====
function placeFurniture(room: Room, furniture: Furniture[]): void {
  if (['parking', 'porch', 'garden', 'corridor', 'storage', 'balcony'].includes(room.type)) {
    if (room.type === 'parking') {
      const fc = FURNITURE_CONFIG['car'];
      furniture.push({
        id: uid('fur'),
        type: 'car',
        roomId: room.id,
        x: room.x + (room.width - fc.defaultSize.w) / 2,
        y: room.y + (room.height - fc.defaultSize.h) / 2,
        width: fc.defaultSize.w,
        height: fc.defaultSize.h,
        rotation: 0,
      });
    }
    return;
  }

  switch (room.type) {
    case 'bedroom':
    case 'master-bed': {
      const isMaster = room.type === 'master-bed';
      const bedType = isMaster ? 'bed-double' : 'bed-single';
      const bed = FURNITURE_CONFIG[bedType];
      const bx = room.x + (room.width - bed.defaultSize.w) / 2;
      const by = room.y + 0.5;
      furniture.push({
        id: uid('fur'),
        type: bedType,
        roomId: room.id,
        x: bx,
        y: by,
        width: bed.defaultSize.w,
        height: bed.defaultSize.h,
        rotation: 0,
      });
      const ward = FURNITURE_CONFIG['wardrobe'];
      furniture.push({
        id: uid('fur'),
        type: 'wardrobe',
        roomId: room.id,
        x: room.x + 0.5,
        y: room.y + room.height - ward.defaultSize.h - 0.5,
        width: Math.min(ward.defaultSize.w, room.width - 1),
        height: ward.defaultSize.h,
        rotation: 0,
      });
      break;
    }
    case 'living': {
      const sofa = FURNITURE_CONFIG['sofa-3'];
      furniture.push({
        id: uid('fur'),
        type: 'sofa-3',
        roomId: room.id,
        x: room.x + (room.width - sofa.defaultSize.w) / 2,
        y: room.y + 0.5,
        width: Math.min(sofa.defaultSize.w, room.width - 1),
        height: sofa.defaultSize.h,
        rotation: 0,
      });
      const coffee = FURNITURE_CONFIG['coffee-table'];
      furniture.push({
        id: uid('fur'),
        type: 'coffee-table',
        roomId: room.id,
        x: room.x + (room.width - coffee.defaultSize.w) / 2,
        y: room.y + sofa.defaultSize.h + 1,
        width: coffee.defaultSize.w,
        height: coffee.defaultSize.h,
        rotation: 0,
      });
      const tv = FURNITURE_CONFIG['tv'];
      furniture.push({
        id: uid('fur'),
        type: 'tv',
        roomId: room.id,
        x: room.x + (room.width - tv.defaultSize.w) / 2,
        y: room.y + room.height - tv.defaultSize.h - 0.5,
        width: tv.defaultSize.w,
        height: tv.defaultSize.h,
        rotation: 0,
      });
      break;
    }
    case 'kitchen': {
      const counter = FURNITURE_CONFIG['kitchen-counter'];
      furniture.push({
        id: uid('fur'),
        type: 'kitchen-counter',
        roomId: room.id,
        x: room.x + 0.5,
        y: room.y + 0.5,
        width: Math.min(counter.defaultSize.w, room.width - 1),
        height: counter.defaultSize.h,
        rotation: 0,
      });
      const stove = FURNITURE_CONFIG['stove'];
      furniture.push({
        id: uid('fur'),
        type: 'stove',
        roomId: room.id,
        x: room.x + 0.5,
        y: room.y + counter.defaultSize.h + 0.5,
        width: stove.defaultSize.w,
        height: stove.defaultSize.h,
        rotation: 0,
      });
      const fridge = FURNITURE_CONFIG['fridge'];
      furniture.push({
        id: uid('fur'),
        type: 'fridge',
        roomId: room.id,
        x: room.x + room.width - fridge.defaultSize.w - 0.5,
        y: room.y + 0.5,
        width: fridge.defaultSize.w,
        height: fridge.defaultSize.h,
        rotation: 0,
      });
      break;
    }
    case 'dining': {
      const table = FURNITURE_CONFIG['dining-table'];
      const tw = Math.min(table.defaultSize.w, room.width - 2);
      const th = Math.min(table.defaultSize.h, room.height - 2);
      furniture.push({
        id: uid('fur'),
        type: 'dining-table',
        roomId: room.id,
        x: room.x + (room.width - tw) / 2,
        y: room.y + (room.height - th) / 2,
        width: tw,
        height: th,
        rotation: 0,
      });
      const chair = FURNITURE_CONFIG['chair'];
      const positions = [
        { x: room.x + (room.width - tw) / 2 + 0.3, y: room.y + (room.height - th) / 2 - chair.defaultSize.h - 0.3 },
        { x: room.x + (room.width + tw) / 2 - chair.defaultSize.w - 0.3, y: room.y + (room.height - th) / 2 - chair.defaultSize.h - 0.3 },
        { x: room.x + (room.width - tw) / 2 + 0.3, y: room.y + (room.height + th) / 2 + 0.3 },
        { x: room.x + (room.width + tw) / 2 - chair.defaultSize.w - 0.3, y: room.y + (room.height + th) / 2 + 0.3 },
      ];
      for (const p of positions) {
        if (p.x < room.x || p.y < room.y || p.x + chair.defaultSize.w > room.x + room.width || p.y + chair.defaultSize.h > room.y + room.height) continue;
        furniture.push({
          id: uid('fur'),
          type: 'chair',
          roomId: room.id,
          x: p.x,
          y: p.y,
          width: chair.defaultSize.w,
          height: chair.defaultSize.h,
          rotation: 0,
        });
      }
      break;
    }
    case 'bathroom': {
      const toilet = FURNITURE_CONFIG['toilet'];
      furniture.push({
        id: uid('fur'),
        type: 'toilet',
        roomId: room.id,
        x: room.x + 0.3,
        y: room.y + 0.3,
        width: toilet.defaultSize.w,
        height: toilet.defaultSize.h,
        rotation: 0,
      });
      const sink = FURNITURE_CONFIG['sink'];
      furniture.push({
        id: uid('fur'),
        type: 'sink',
        roomId: room.id,
        x: room.x + room.width - sink.defaultSize.w - 0.3,
        y: room.y + 0.3,
        width: sink.defaultSize.w,
        height: sink.defaultSize.h,
        rotation: 0,
      });
      if (room.width >= 6 && room.height >= 6) {
        const shower = FURNITURE_CONFIG['shower'];
        furniture.push({
          id: uid('fur'),
          type: 'shower',
          roomId: room.id,
          x: room.x + room.width - shower.defaultSize.w - 0.3,
          y: room.y + room.height - shower.defaultSize.h - 0.3,
          width: shower.defaultSize.w,
          height: shower.defaultSize.h,
          rotation: 0,
        });
      }
      break;
    }
    case 'prayer': {
      const mat = FURNITURE_CONFIG['prayer-mat'];
      furniture.push({
        id: uid('fur'),
        type: 'prayer-mat',
        roomId: room.id,
        x: room.x + (room.width - mat.defaultSize.w) / 2,
        y: room.y + (room.height - mat.defaultSize.h) / 2,
        width: mat.defaultSize.w,
        height: mat.defaultSize.h,
        rotation: 0,
      });
      break;
    }
    case 'office': {
      const desk = FURNITURE_CONFIG['desk'];
      furniture.push({
        id: uid('fur'),
        type: 'desk',
        roomId: room.id,
        x: room.x + (room.width - desk.defaultSize.w) / 2,
        y: room.y + 0.5,
        width: desk.defaultSize.w,
        height: desk.defaultSize.h,
        rotation: 0,
      });
      const chair = FURNITURE_CONFIG['chair'];
      furniture.push({
        id: uid('fur'),
        type: 'chair',
        roomId: room.id,
        x: room.x + (room.width - chair.defaultSize.w) / 2,
        y: room.y + desk.defaultSize.h + 1,
        width: chair.defaultSize.w,
        height: chair.defaultSize.h,
        rotation: 0,
      });
      break;
    }
    case 'stair': {
      const stair = FURNITURE_CONFIG['staircase'];
      const sw = Math.min(stair.defaultSize.w, room.width - 1);
      const sh = Math.min(stair.defaultSize.h, room.height - 1);
      furniture.push({
        id: uid('fur'),
        type: 'staircase',
        roomId: room.id,
        x: room.x + (room.width - sw) / 2,
        y: room.y + (room.height - sh) / 2,
        width: sw,
        height: sh,
        rotation: 0,
      });
      break;
    }
    case 'laundry': {
      const wm = FURNITURE_CONFIG['washing-machine'];
      furniture.push({
        id: uid('fur'),
        type: 'washing-machine',
        roomId: room.id,
        x: room.x + 0.3,
        y: room.y + 0.3,
        width: wm.defaultSize.w,
        height: wm.defaultSize.h,
        rotation: 0,
      });
      break;
    }
  }
}
