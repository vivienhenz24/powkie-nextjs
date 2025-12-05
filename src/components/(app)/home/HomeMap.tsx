"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import { Search, Settings, Menu, X, LogOut } from "lucide-react";
import { LeftPanel } from "./LeftPanel";
import { RightPanel } from "./RightPanel";
import { MapView } from "./MapView";
import { GameDetailBox } from "./GameDetailBox";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { LoginSignupModal } from "@/components/auth/LoginSignupModal";

export function HomeMap() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const supabase = createSupabaseBrowserClient();
  const [commandOpen, setCommandOpen] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [displayName, setDisplayName] = useState("Player");
  const [bio, setBio] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<any | null>(null);
  const [searchGames, setSearchGames] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const handleMapReady = useCallback((map: mapboxgl.Map) => {
    mapRef.current = map;
    setMapReady(true);
  }, []);

  // Check if user is guest and monitor auth state changes
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsGuest(!user);
    };
    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Update guest state based on auth
      if (event === "SIGNED_IN" && session) {
        setIsGuest(false);
      } else if (event === "SIGNED_OUT") {
        setIsGuest(true);
      } else if (!session && event === "INITIAL_SESSION") {
        setIsGuest(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Load profile when component mounts (only for authenticated users)
  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Guest mode - don't load profile
        return;
      }

      setProfileLoading(true);
      try {

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("display_name, bio, contact_email, contact_phone")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 is "not found" - that's okay, we'll use defaults
          return;
        }

        // Auto-sync email from auth if contact_email is missing
        if (profile && !profile.contact_email && user.email) {
          // Silently update the profile with the email from auth
          await supabase.from("profiles").update({
            contact_email: user.email,
          }).eq("user_id", user.id);
          // Update local state
          setContactEmail(user.email);
        }

        if (profile) {
          setDisplayName(profile.display_name || "Player");
          setBio(profile.bio || "");
          // Use contact_email from profile, or fallback to user's auth email
          setContactEmail(profile.contact_email || user.email || "");
          setContactPhone(profile.contact_phone || "");
        } else if (user.email) {
          // If no profile exists yet, use auth email
          setContactEmail(user.email);
        }
      } catch (err) {
        // Silently handle errors - don't spam console
      } finally {
        setProfileLoading(false);
      }
    }

    loadProfile();
  }, [supabase]);

  // Load profile when dialog opens
  useEffect(() => {
    if (profileOpen) {
      async function loadProfileForDialog() {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data: profile, error } = await supabase
            .from("profiles")
            .select("display_name, bio, contact_email, contact_phone")
            .eq("user_id", user.id)
            .single();

          if (error && error.code !== "PGRST116") {
            setProfileError("Failed to load profile");
            return;
          }

          if (profile) {
            setDisplayName(profile.display_name || "Player");
            setBio(profile.bio || "");
            // Use contact_email from profile, or fallback to user's auth email
            setContactEmail(profile.contact_email || user.email || "");
            setContactPhone(profile.contact_phone || "");
          } else if (user.email) {
            // If no profile exists yet, use auth email
            setContactEmail(user.email);
          }
        } catch (err) {
          setProfileError("Failed to load profile");
        }
      }

      loadProfileForDialog();
    }
  }, [profileOpen, supabase]);

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProfileError("You must be logged in to save your profile");
        setProfileSaving(false);
        return;
      }

      // Get email from auth if contact_email is not set
      const emailToSave = contactEmail || user.email || null;
      
      const { error } = await supabase.from("profiles").upsert({
        user_id: user.id,
        display_name: displayName || "Player",
        bio: bio || "",
        contact_email: emailToSave,
        contact_phone: contactPhone || null,
      });

      if (error) {
        setProfileError(error.message);
        setProfileSaving(false);
        return;
      }

      setProfileOpen(false);
    } catch (err) {
      setProfileError("An unexpected error occurred");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        alert("Failed to log out: " + error.message);
        return;
      }
      // Redirect to home page (which will show guest mode)
      window.location.href = "/home";
    } catch (err) {
      alert("An unexpected error occurred while logging out.");
    }
  };

  const initials = displayName
    .split(" ")
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "PP";

  // Clean up games that are 3+ hours past their start time
  const cleanupExpiredGames = useCallback(async () => {
    try {
      const now = new Date();
      const { data: allGames, error: fetchError } = await supabase
        .from("games")
        .select("*");

      if (fetchError || !allGames) return;

      const expiredGameIds: string[] = [];

      for (const game of allGames) {
        // Combine game_date and start_time to create the game start datetime
        const gameStartDate = new Date(`${game.game_date}T${game.start_time}`);
        
        // Add 3 hours to the start time
        const deletionTime = new Date(gameStartDate.getTime() + 3 * 60 * 60 * 1000);
        
        // If current time is past the deletion time, mark for deletion
        if (now >= deletionTime) {
          expiredGameIds.push(game.id);
        }
      }

      // Delete expired games
      if (expiredGameIds.length > 0) {
        const { error: deleteError } = await supabase
          .from("games")
          .delete()
          .in("id", expiredGameIds);

        if (deleteError) {
          console.error("Error deleting expired games:", deleteError);
        }
      }
    } catch (err) {
      console.error("Error cleaning up expired games:", err);
    }
  }, [supabase]);

  // Load games for search and markers
  const loadGames = useCallback(async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const { data: games, error } = await supabase
        .from("games")
        .select("*")
        .gte("game_date", today)
        .order("game_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error || !games) return null;
      return games;
    } catch {
      return null;
    }
  }, [supabase]);

  // Periodic cleanup of expired games (every 5 minutes)
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    const cleanupInterval = setInterval(async () => {
      await cleanupExpiredGames();
      // Reload games and markers after cleanup
      const currentMap = mapRef.current;
      if (currentMap) {
        const games = await loadGames();
        if (games) {
          // Clear existing markers
          markersRef.current.forEach((marker) => marker.remove());
          markersRef.current.clear();

          // Add updated markers
          games.forEach((game: any) => {
            if (
              typeof game.lng !== "number" ||
              typeof game.lat !== "number"
            ) {
              return;
            }

            const marker = new mapboxgl.Marker({ color: "#22c55e" })
              .setLngLat([game.lng, game.lat])
              .addTo(currentMap);

            const el = marker.getElement();
            el.addEventListener("click", () => {
              handleGameSelect(game);
            });
            el.style.cursor = "pointer";

            markersRef.current.set(game.id, marker);
          });
        }
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      clearInterval(cleanupInterval);
    };
  }, [mapReady, cleanupExpiredGames, loadGames]);

  // Load existing games and add markers when map is ready
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    let cancelled = false;

    async function loadGameMarkers() {
      // Clean up expired games first
      await cleanupExpiredGames();
      const games = await loadGames();
      if (!games || cancelled) return;

      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();

      const currentMap = mapRef.current;
      // Extra safety: make sure map is still alive and has a canvas
      if (
        !currentMap ||
        typeof (currentMap as any).getCanvas !== "function" ||
        !(currentMap as any).getCanvas()
      ) {
        console.warn("Map not ready or destroyed, cannot add markers");
        return;
      }

      games.forEach((game: any) => {
        if (
          typeof game.lng !== "number" ||
          typeof game.lat !== "number"
        ) {
          return;
        }

        let marker: mapboxgl.Marker | null = null;
        try {
          marker = new mapboxgl.Marker({ color: "#22c55e" })
            .setLngLat([game.lng, game.lat])
            .addTo(currentMap);
        } catch (err) {
          console.error("Failed to add marker to map:", err);
          return;
        }

        // Add click handler to show detail box
        const el = marker.getElement();
        el.addEventListener("click", () => {
          handleGameSelect(game);
        });
        el.style.cursor = "pointer";

        markersRef.current.set(game.id, marker);
      });
    }

    loadGameMarkers();

    return () => {
      cancelled = true;
    };
  }, [mapReady, supabase, loadGames, cleanupExpiredGames]);

  // Load games for search when command dialog opens
  useEffect(() => {
    if (!commandOpen) return;

    async function loadSearchGames() {
      setSearchLoading(true);
      const games = await loadGames();
      if (games) {
        setSearchGames(games);
      }
      setSearchLoading(false);
    }

    loadSearchGames();
  }, [commandOpen, loadGames]);

  const handleGameDeleted = () => {
    // Remove marker from map
    if (selectedGame) {
      const marker = markersRef.current.get(selectedGame.id);
      if (marker) {
        marker.remove();
        markersRef.current.delete(selectedGame.id);
      }
    }
    setSelectedGame(null);
    // Trigger a page refresh to update RightPanel
    // This ensures all components are in sync
    window.location.reload();
  };

  const handleGameUpdated = (updatedGame: any) => {
    // Update the selected game state
    setSelectedGame(updatedGame);

    // Update marker position if address changed
    const marker = markersRef.current.get(updatedGame.id);
    if (marker && updatedGame.lng && updatedGame.lat) {
      marker.setLngLat([updatedGame.lng, updatedGame.lat]);
    }

    // Reload markers to ensure everything is in sync
    if (mapRef.current) {
      // Remove old marker
      if (marker) {
        marker.remove();
        markersRef.current.delete(updatedGame.id);
      }

      // Add updated marker
      const newMarker = new mapboxgl.Marker({ color: "#22c55e" })
        .setLngLat([updatedGame.lng, updatedGame.lat])
        .addTo(mapRef.current);

      // Add click handler
      const el = newMarker.getElement();
      el.addEventListener("click", () => {
        handleGameSelect(updatedGame);
      });
      el.style.cursor = "pointer";

      markersRef.current.set(updatedGame.id, newMarker);
    }

    // Refresh the page to update RightPanel
    window.location.reload();
  };

  const handleGameSelect = (game: any) => {
    // Allow guests to see game details, but with login prompt
    setSelectedGame(game);
  };

  const handleLoginSuccess = () => {
    setLoginModalOpen(false);
    // Reload to refresh UI
    window.location.reload();
  };

  return (
    <div className="flex flex-col h-screen w-full px-2 sm:px-4 pb-2 sm:pb-4 animate-in fade-in duration-500">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 h-12 sm:h-14 flex items-center shrink-0 gap-2 sm:gap-3 bg-card/60 backdrop-blur-xl border-b border-white/10 rounded-lg mb-2 px-3 sm:px-4 shadow-lg transition-all duration-300 hover:shadow-xl" style={{ boxShadow: "0 4px 16px 0 rgba(0, 0, 0, 0.2)" }}>
        {/* Left - Logo and Mobile Menu */}
        <div className="flex items-center gap-2 sm:w-80">
          {!isGuest && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8 transition-all duration-200 hover:scale-110 active:scale-95"
              onClick={() => {
                setLeftPanelOpen((open) => !open);
              }}
            >
              {leftPanelOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          )}
          <h1 className="text-base sm:text-lg font-medium">powkie</h1>
        </div>

        {/* Center - Command */}
        <div className="flex-1 min-w-0">
          <Button
            variant="outline"
            className="w-full justify-start text-muted-foreground text-sm sm:text-base h-9 sm:h-10 bg-white/5 backdrop-blur-sm border-white/20 hover:bg-white/10 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
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

        {/* Right - Button Group (hidden for guests) */}
        {!isGuest && (
          <div className="flex items-center gap-2 sm:w-80 sm:justify-end">
            <ButtonGroup className="hidden sm:flex">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9 sm:h-10 sm:w-10 transition-all duration-200 hover:scale-110 active:scale-95"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full p-0 flex items-center justify-center font-semibold text-xs sm:text-sm transition-all duration-200 hover:scale-110 active:scale-95 hover:ring-2 hover:ring-green-600/50"
                onClick={() => setProfileOpen(true)}
              >
                {initials}
              </Button>
            </ButtonGroup>
          </div>
        )}
        {isGuest && (
          <div className="flex items-center gap-2 sm:w-80 sm:justify-end">
            <Button
              variant="outline"
              className="h-9 px-4 text-sm transition-all duration-200 hover:scale-105 active:scale-95"
              onClick={() => setLoginModalOpen(true)}
            >
              Log In
            </Button>
          </div>
        )}
      </header>

      {/* Command Dialog */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Search games by type, address, or date..." />
        <CommandList>
          <CommandEmpty>
            {searchLoading ? "Loading games..." : "No games found."}
          </CommandEmpty>
          {searchGames.length > 0 && (
            <CommandGroup heading="Available Games">
              {searchGames.map((game) => {
                // Parse date string as local date to avoid timezone issues
                const [year, month, day] = game.game_date.split('-').map(Number);
                const gameDate = new Date(year, month - 1, day);
                const formattedDate = gameDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
                const [hours, minutes] = game.start_time.split(":");
                const hour = parseInt(hours, 10);
                const ampm = hour >= 12 ? "PM" : "AM";
                const hour12 = hour % 12 || 12;
                const formattedTime = `${hour12}:${minutes} ${ampm}`;
                
                // Create searchable text for filtering
                const searchableText = `${game.game_type} ${game.address} ${formattedDate} ${formattedTime}`.toLowerCase();

                return (
                  <CommandItem
                    key={game.id}
                    value={searchableText}
                    onSelect={() => {
                      handleGameSelect(game);
                      setCommandOpen(false);
                    }}
                    className="flex items-center gap-3 p-3 cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{game.game_type}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {game.address}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formattedDate} • {formattedTime}
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
          <CommandGroup heading="Quick Actions">
            {!isGuest && (
              <CommandItem onSelect={() => setProfileOpen(true)}>
                View profile
              </CommandItem>
            )}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Profile dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Customize your profile</DialogTitle>
            <DialogDescription>
              Set how you&apos;ll appear to other players in powkie.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {profileError && (
              <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                {profileError}
              </div>
            )}
            <div className="space-y-1.5">
              <label htmlFor="displayName" className="text-sm font-medium">
                Display name
              </label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. RiverKing"
                disabled={profileSaving}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="bio" className="text-sm font-medium">
                Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your style (tight-aggressive, loose, etc.)"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none min-h-[80px]"
                disabled={profileSaving}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="contactEmail" className="text-sm font-medium">
                Contact Email{" "}
                <span className="text-xs text-muted-foreground">(optional)</span>
              </label>
              <Input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="your.email@example.com"
                disabled={profileSaving}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="contactPhone" className="text-sm font-medium">
                Contact Phone{" "}
                <span className="text-xs text-muted-foreground">(optional)</span>
              </label>
              <Input
                id="contactPhone"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="(555) 123-4567"
                disabled={profileSaving}
              />
            </div>
          </div>
          <DialogFooter className="mt-4 flex-col sm:flex-row gap-2">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={async () => {
                  setProfileOpen(false);
                  setProfileError(null);
                  // Reload profile data when canceling
                  const { data: { user } } = await supabase.auth.getUser();
                  if (user) {
                    const { data: profile } = await supabase
                      .from("profiles")
                      .select("display_name, bio, contact_email, contact_phone")
                      .eq("user_id", user.id)
                      .single();
                    if (profile) {
                      setDisplayName(profile.display_name || "Player");
                      setBio(profile.bio || "");
                      setContactEmail(profile.contact_email || "");
                      setContactPhone(profile.contact_phone || "");
                    }
                  }
                }}
                disabled={profileSaving}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={profileSaving}
                className="w-full sm:w-auto"
              >
                {profileSaving ? "Saving..." : "Save profile"}
              </Button>
            </div>
            <div className="w-full sm:w-auto border-t border-border pt-2 sm:pt-0 sm:border-t-0">
              <Button
                variant="outline"
                onClick={handleLogout}
                disabled={profileSaving}
                className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-600/10 border-red-600/20"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <div className="flex flex-1 gap-2 sm:gap-3 min-h-0 relative">
        {/* Left Panel - Always visible on desktop, drawer on mobile (hidden for guests) */}
        {!isGuest && (
          <div className={`hidden md:block animate-in slide-in-from-left-4 fade-in duration-500 ${leftPanelOpen ? "" : ""}`}>
            <LeftPanel
              onGameCreated={(game) => {
              if (!mapRef.current) return;
              const marker = new mapboxgl.Marker({ color: "#22c55e" })
                .setLngLat([game.lng, game.lat])
                .addTo(mapRef.current);

              // Add click handler
              const el = marker.getElement();
              el.addEventListener("click", () => {
                handleGameSelect(game);
              });
              el.style.cursor = "pointer";

              markersRef.current.set(game.id, marker);
            }}
          />
          </div>
        )}
        {/* Mobile Left Panel - Full Screen with backdrop blur (hidden for guests) */}
        {!isGuest && leftPanelOpen && (
          <>
            {/* Backdrop blur for content behind */}
            <div className="md:hidden absolute inset-0 z-40 bg-black/20 backdrop-blur-md animate-in fade-in duration-300" />
            {/* Full screen panel */}
            <div className="md:hidden absolute inset-0 z-50 shadow-2xl animate-in fade-in duration-300">
              <LeftPanel
                onGameCreated={(game) => {
                  if (!mapRef.current) return;
                  const marker = new mapboxgl.Marker({ color: "#22c55e" })
                    .setLngLat([game.lng, game.lat])
                    .addTo(mapRef.current);

                  // Add click handler
                  const el = marker.getElement();
                  el.addEventListener("click", () => {
                    handleGameSelect(game);
                  });
                  el.style.cursor = "pointer";

                  markersRef.current.set(game.id, marker);
                }}
                onClose={() => setLeftPanelOpen(false)}
              />
            </div>
          </>
        )}

        {/* Map - Full width on mobile */}
        <div className="flex-1 rounded-lg sm:rounded-xl overflow-hidden border border-white/20 min-w-0 relative shadow-lg animate-in fade-in zoom-in-95 duration-700" style={{ boxShadow: "0 4px 16px 0 rgba(0, 0, 0, 0.2)" }}>
          <MapView onMapReady={handleMapReady} />
          {selectedGame && (
            <GameDetailBox
              game={selectedGame}
              onClose={() => setSelectedGame(null)}
              onGameDeleted={handleGameDeleted}
              onGameUpdated={handleGameUpdated}
              isGuest={isGuest}
              onLoginRequest={() => setLoginModalOpen(true)}
            />
          )}
        </div>

        {/* Right Panel - Always visible on desktop */}
        <div className="hidden md:block animate-in slide-in-from-right-4 fade-in duration-500">
          <RightPanel onGameSelect={handleGameSelect} isGuest={isGuest} />
        </div>
        {/* Mobile Right Panel - Hide when game details are open */}
        {!selectedGame && (
          <div className="md:hidden absolute left-0 right-0 bottom-0 z-40 h-[33vh] shadow-2xl rounded-t-2xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
            <RightPanel onGameSelect={handleGameSelect} isGuest={isGuest} />
          </div>
        )}

        {/* Login/Signup Modal */}
        <LoginSignupModal
          open={loginModalOpen}
          onClose={() => setLoginModalOpen(false)}
          onSuccess={handleLoginSuccess}
        />

      </div>
    </div>
  );
}
