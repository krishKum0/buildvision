'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { TopToolbar } from '@/components/floor-plan/TopToolbar';
import { Sidebar } from '@/components/floor-plan/Sidebar';
import { Canvas } from '@/components/floor-plan/Canvas';
import { PropertiesPanel } from '@/components/floor-plan/PropertiesPanel';
import { StatusBar } from '@/components/floor-plan/StatusBar';
import { DimensionDialog } from '@/components/floor-plan/DimensionDialog';
import { HelpDialog } from '@/components/floor-plan/HelpDialog';
import { ReferenceGallery } from '@/components/floor-plan/ReferenceGallery';
import { useEditorStore } from '@/lib/floor-plan/store';

export default function Home() {
  const [dimOpen, setDimOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [propertiesOpen, setPropertiesOpen] = useState(true);

  // Show the dimension dialog automatically the first time the user loads
  const [autoOpened, setAutoOpened] = useState(false);
  useEffect(() => {
    if (!autoOpened) {
      const t = setTimeout(() => {
        setDimOpen(true);
        setAutoOpened(true);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [autoOpened]);

  // Wire up keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useEditorStore.getState().undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z' || e.key === 'Z'))) {
        e.preventDefault();
        useEditorStore.getState().redo();
      } else if (e.key === 'Escape') {
        const s = useEditorStore.getState();
        s.setMode('select');
        s.setPendingRoomType(undefined);
        s.setPendingFurnitureType(undefined);
        s.clearSelection();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const s = useEditorStore.getState();
        if (s.selection.kind === 'room' && s.selection.id) s.removeRoom(s.selection.id);
        else if (s.selection.kind === 'door' && s.selection.id) s.removeDoor(s.selection.id);
        else if (s.selection.kind === 'window' && s.selection.id) s.removeWindow(s.selection.id);
        else if (s.selection.kind === 'furniture' && s.selection.id) s.removeFurniture(s.selection.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Export PNG via serialization of the SVG
  const handleExportPNG = useCallback(() => {
    const svg = document.getElementById('floor-plan-canvas') as SVGSVGElement | null;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const clone = svg.cloneNode(true) as SVGSVGElement;
    // ensure xmlns
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    // white background
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('x', '0');
    bg.setAttribute('y', '0');
    bg.setAttribute('width', String(clone.getAttribute('width') || '800'));
    bg.setAttribute('height', String(clone.getAttribute('height') || '600'));
    bg.setAttribute('fill', '#ffffff');
    clone.insertBefore(bg, clone.firstChild);

    const svgString = serializer.serializeToString(clone);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Number(svg.getAttribute('width')) || 800;
      canvas.height = Number(svg.getAttribute('height')) || 600;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) return;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(pngBlob);
        const plan = useEditorStore.getState().plan;
        link.download = `${plan.name.replace(/\s+/g, '-')}-floorplan.png`;
        link.click();
        URL.revokeObjectURL(link.href);
      });
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  }, []);

  const handleExportJSON = useCallback(() => {
    const plan = useEditorStore.getState().plan;
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${plan.name.replace(/\s+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, []);

  const handleImportJSON = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const plan = JSON.parse(text);
      if (!plan || !Array.isArray(plan.rooms)) {
        throw new Error('Invalid plan file');
      }
      useEditorStore.getState().setPlan(plan);
    } catch (err) {
      alert('Failed to load plan file: ' + (err as Error).message);
    }
  }, []);

  return (
    <div className="h-screen w-full flex flex-col bg-slate-100 overflow-hidden">
      {/* Top toolbar */}
      <div className="flex items-center bg-white">
        <TopToolbar
          onOpenDimensionDialog={() => setDimOpen(true)}
          onExportPNG={handleExportPNG}
          onExportJSON={handleExportJSON}
          onImportJSON={handleImportJSON}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onToggleProperties={() => setPropertiesOpen((v) => !v)}
          sidebarOpen={sidebarOpen}
          propertiesOpen={propertiesOpen}
        />
        <ReferenceGallery />
      </div>

      {/* Main 3-pane layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar */}
        {sidebarOpen && (
          <div className="w-[260px] shrink-0">
            <Sidebar onOpenDimensionDialog={() => setDimOpen(true)} />
          </div>
        )}

        {/* Center canvas */}
        <div className="flex-1 relative overflow-hidden">
          <Canvas />
        </div>

        {/* Right properties panel */}
        {propertiesOpen && (
          <div className="w-[300px] shrink-0">
            <PropertiesPanel />
          </div>
        )}
      </div>

      {/* Bottom status bar */}
      <StatusBar onOpenHelp={() => setHelpOpen(true)} />

      {/* Dialogs */}
      <DimensionDialog open={dimOpen} onOpenChange={setDimOpen} />
      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
}
