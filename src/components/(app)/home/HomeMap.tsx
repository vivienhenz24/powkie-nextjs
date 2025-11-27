"use client";

import { useCallback, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { Search, Settings, User, Menu, X } from "lucide-react";
import { LeftPanel } from "./LeftPanel";
import { RightPanel } from "./RightPanel";
import { MapView } from "./MapView";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export function HomeMap() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  const handleMapReady = useCallback((map: mapboxgl.Map) => {
    mapRef.current = map;
  }, []);

  return (
    <div className="flex flex-col h-screen w-full px-2 sm:px-4 pb-2 sm:pb-4">
      {/* Top Bar */}
      <header className="h-12 sm:h-14 flex items-center shrink-0 gap-2 sm:gap-3">
        {/* Left - Logo and Mobile Menu */}
        <div className="flex items-center gap-2 sm:w-80">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8"
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          >
            {leftPanelOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          <h1 className="text-base sm:text-lg font-medium">powkie</h1>
        </div>

        {/* Center - Command */}
        <div className="flex-1 min-w-0">
          <Button
            variant="outline"
            className="w-full justify-start text-muted-foreground text-sm sm:text-base h-9 sm:h-10"
            style={{ backgroundColor: "var(--app-secondary)" }}
            onClick={() => setCommandOpen(true)}
          >
            <Search className="mr-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
            <span className="hidden sm:inline">Search...</span>
            <span className="sm:hidden">Search</span>
            <kbd className="pointer-events-none ml-auto hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </div>

        {/* Right - Button Group */}
        <div className="flex items-center gap-2 sm:w-80 sm:justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8"
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
          >
            {rightPanelOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          <ButtonGroup className="hidden sm:flex">
            <Button variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
              <User className="h-4 w-4" />
            </Button>
          </ButtonGroup>
        </div>
      </header>

      {/* Command Dialog */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem>Search houses...</CommandItem>
            <CommandItem>Go to settings</CommandItem>
            <CommandItem>View profile</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Main Content */}
      <div className="flex flex-1 gap-2 sm:gap-3 min-h-0 relative">
        {/* Left Panel - Always visible on desktop, drawer on mobile */}
        <div className={`hidden md:block ${leftPanelOpen ? "" : ""}`}>
          <LeftPanel />
        </div>
        {/* Mobile Left Panel Drawer */}
        {leftPanelOpen && (
          <div className="md:hidden absolute left-0 top-0 bottom-0 z-50 w-80 shadow-lg">
            <LeftPanel />
          </div>
        )}

        {/* Map - Full width on mobile */}
        <div className="flex-1 rounded-lg sm:rounded-xl overflow-hidden border border-border min-w-0">
          <MapView onMapReady={handleMapReady} />
        </div>

        {/* Right Panel - Always visible on desktop, drawer on mobile */}
        <div className="hidden md:block">
          <RightPanel />
        </div>
        {/* Mobile Right Panel Drawer */}
        {rightPanelOpen && (
          <div className="md:hidden absolute right-0 top-0 bottom-0 z-50 w-80 shadow-lg">
            <RightPanel />
          </div>
        )}

        {/* Mobile overlay when panel is open */}
        {(leftPanelOpen || rightPanelOpen) && (
          <div
            className="md:hidden absolute inset-0 bg-black/20 z-40"
            onClick={() => {
              setLeftPanelOpen(false);
              setRightPanelOpen(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
