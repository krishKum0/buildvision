'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { HelpCircle, MousePointer2, ZoomIn, Move, Pencil, Plus, Square, DoorOpen, AppWindow } from 'lucide-react';

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export const HelpDialog: React.FC<HelpDialogProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <HelpCircle className="w-4 h-4" /> How to Use PlotPlan Studio
          </DialogTitle>
          <DialogDescription>
            A quick tour of how to generate, edit and export floor plans.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm text-slate-700 py-2">
          <section>
            <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
              <Square className="w-3.5 h-3.5" /> 1. Enter Plot Dimensions
            </h3>
            <p className="text-xs leading-relaxed">
              Click the <span className="font-medium">Land Dimensions</span> button in the toolbar
              (or use the sidebar&apos;s &quot;Plot&quot; tab). Enter your plot width, depth, unit (ft/m),
              building type, number of floors, and entrance direction. The studio will instantly generate
              a complete floor plan with rooms, doors, windows, furniture, parking, staircase and porch.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
              <MousePointer2 className="w-3.5 h-3.5" /> 2. Select &amp; Edit Rooms
            </h3>
            <p className="text-xs leading-relaxed mb-2">
              Click any room on the canvas to select it. The properties panel (right) shows its
              dimensions, position, type and label — edit any field. Drag the corner handles on the
              canvas to resize. Drag the top handle to move the room.
            </p>
            <ul className="text-[11px] text-slate-600 list-disc pl-5 space-y-0.5">
              <li>Snap-to-0.5&apos; for clean alignment</li>
              <li>Minimum sizes enforced per room type</li>
              <li>Type dropdown instantly recolors and relabels</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> 3. Add Rooms, Doors, Windows, Furniture
            </h3>
            <p className="text-xs leading-relaxed">
              Open the sidebar (left) and pick the <span className="font-medium">Rooms</span> or
              <span className="font-medium"> Items</span> tab. Click any item — it becomes your active
              tool. Then click on the canvas where you want to place it. For doors and windows, click
              inside a room near the wall you want them on.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
              <DoorOpen className="w-3.5 h-3.5" /> 4. Edit Doors &amp; Windows
            </h3>
            <p className="text-xs leading-relaxed">
              Click a door or window to select it. Drag its handle to slide it along the wall. Use
              the properties panel to change wall, swing direction, width, sill height, etc.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5" /> 5. Pan &amp; Zoom
            </h3>
            <p className="text-xs leading-relaxed">
              Scroll wheel zooms in/out at the cursor. Hold the middle mouse button or switch to Pan
              mode (Tools tab) to drag the canvas around. Use the + / − / 1:1 buttons in the bottom
              right to control zoom.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
              <Pencil className="w-3.5 h-3.5" /> 6. Undo / Redo
            </h3>
            <p className="text-xs leading-relaxed">
              Every change is recorded. Use the <span className="font-medium">Undo / Redo</span> buttons
              in the toolbar (or <span className="font-mono">Ctrl+Z</span> / <span className="font-mono">Ctrl+Y</span> on
              most systems via keyboard shortcuts — implement separately). The studio keeps 50 history steps.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
              <AppWindow className="w-3.5 h-3.5" /> 7. Export &amp; Save
            </h3>
            <p className="text-xs leading-relaxed">
              Use <span className="font-medium">PNG</span> to export the current plan as an image.
              Use <span className="font-medium">JSON</span> to save a project file you can re-import later
              via the <span className="font-medium">Import</span> button.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
              <ZoomIn className="w-3.5 h-3.5" /> 8. Inspiration Gallery
            </h3>
            <p className="text-xs leading-relaxed">
              Click the <span className="font-medium">Inspiration</span> button in the toolbar to browse
              reference floor plans and exterior designs. Click any image to view it full-size.
            </p>
          </section>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="bg-slate-900 hover:bg-slate-800">
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
