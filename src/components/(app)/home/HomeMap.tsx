"use client";

import { useCallback, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { Search, Settings, User } from "lucide-react";
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

  const handleMapReady = useCallback((map: mapboxgl.Map) => {
    mapRef.current = map;
  }, []);

  return (
    <div className="flex flex-col h-screen w-full px-4 pb-4">
      {/* Top Bar */}
      <header className="h-14 flex items-center shrink-0 gap-3">
        {/* Left - Logo */}
        <div className="w-80">
          <h1 className="text-lg font-medium">powkie</h1>
        </div>

        {/* Center - Command */}
        <div className="flex-1">
          <Button
            variant="outline"
            className="w-full justify-start text-muted-foreground"
            style={{ backgroundColor: "var(--app-secondary)" }}
            onClick={() => setCommandOpen(true)}
          >
            <Search className="mr-2 h-4 w-4" />
            <span>Search...</span>
            <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </div>

        {/* Right - Button Group */}
        <div className="w-80 flex justify-end">
          <ButtonGroup>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
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
      <div className="flex flex-1 gap-3 min-h-0">
        <LeftPanel />
        <div className="flex-1 rounded-xl overflow-hidden border border-border">
          <MapView onMapReady={handleMapReady} />
        </div>
        <RightPanel />
      </div>
    </div>
  );
}
