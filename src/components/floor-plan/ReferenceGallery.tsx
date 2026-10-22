'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Images } from 'lucide-react';

interface GalleryItem {
  src: string;
  title: string;
  description: string;
}

const INSPIRATIONS: GalleryItem[] = [
  {
    src: '/inspiration/floor-plan-37x32.jpg',
    title: '37×32 Family Home',
    description: 'Detailed 2-floor plan with bedrooms, kitchen, dining, prayer room, porch, parking, and stairs.',
  },
  {
    src: '/inspiration/north-facing.jpg',
    title: 'North-Facing Plot',
    description: 'Compact plan with car parking, porch, kitchen, master bedroom, hall and septic tank.',
  },
  {
    src: '/inspiration/narrow-19x56.jpg',
    title: '19×56 Narrow Plot',
    description: 'Two-floor layout for a long narrow plot — bedroom, kitchen, bath, living, balcony.',
  },
  {
    src: '/inspiration/modern-2story.jpg',
    title: 'Modern 2-Story Exterior',
    description: 'White & dark-grey facade with wood texture, glass balcony, gate and wall lighting.',
  },
  {
    src: '/inspiration/four-styles.jpg',
    title: 'Four Exterior Styles',
    description: 'Pitched-roof, flat modern, walled compound, red-brick — pick your inspiration.',
  },
  {
    src: '/inspiration/colorful-geometric.jpg',
    title: 'Colorful Geometric Facade',
    description: 'Blue/orange/white patterned two-story with balcony, ramp and patterned gate.',
  },
  {
    src: '/inspiration/foundation-types.jpg',
    title: 'Foundation Types',
    description: 'Reference for pad, stepped and sloped footings, pile caps and caisson support.',
  },
];

export const ReferenceGallery: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
          <Images className="w-3.5 h-3.5" />
          Inspiration
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[480px] overflow-y-auto p-0">
        <SheetHeader className="px-4 py-3 border-b border-slate-200">
          <SheetTitle className="flex items-center gap-2 text-slate-900">
            <Images className="w-4 h-4" /> Design Inspiration Gallery
          </SheetTitle>
        </SheetHeader>
        <div className="p-4 space-y-4">
          <p className="text-xs text-slate-500">
            Browse these reference designs for inspiration. Click any image to zoom in. Use the dimensions dialog
            to recreate a layout based on the plot size shown in each plan.
          </p>
          {INSPIRATIONS.map((item) => (
            <figure key={item.src} className="rounded-lg border border-slate-200 overflow-hidden bg-white">
              <button
                onClick={() => window.open(item.src, '_blank')}
                className="block w-full"
                title="Click to open full-size"
              >
                {/* Static reference gallery from /public */}
                <img
                  src={item.src}
                  alt={item.title}
                  className="w-full h-44 object-cover hover:opacity-90 transition-opacity"
                />
              </button>
              <figcaption className="p-3 text-left">
                <div className="font-medium text-sm text-slate-900">{item.title}</div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{item.description}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
