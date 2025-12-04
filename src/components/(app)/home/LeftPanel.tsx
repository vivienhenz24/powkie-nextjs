 "use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

interface LeftPanelProps {
  onGameCreated?: (game: {
    id: string;
    game_type: string;
    location_name?: string | null;
    address: string;
    lng: number;
    lat: number;
    game_date: string;
    start_time: string;
    buy_in: string;
  }) => void;
  onClose?: () => void;
}

export function LeftPanel({ onGameCreated, onClose }: LeftPanelProps) {
  const supabase = createSupabaseBrowserClient();
  const [gameType, setGameType] = useState("");
  const [locationName, setLocationName] = useState("");
  const [address, setAddress] = useState("");
  const [gameDate, setGameDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [maxPlayers, setMaxPlayers] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleHostGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!gameType || !locationName || !address || !gameDate || !startTime) {
      setError("Please fill in game, location name, address, date, and time.");
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("You must be logged in to host a game.");
        setLoading(false);
        return;
      }

      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (!mapboxToken) {
        setError("Missing Mapbox token. Please set NEXT_PUBLIC_MAPBOX_TOKEN.");
        setLoading(false);
        return;
      }

      const geoRes = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          address
        )}.json?access_token=${mapboxToken}&limit=1`
      );

      const geoJson = await geoRes.json();
      const feature = geoJson.features?.[0];

      if (!feature || !Array.isArray(feature.center)) {
        setError("Could not find that address on the map. Try a more specific address.");
        setLoading(false);
        return;
      }

      const [lng, lat] = feature.center as [number, number];

      const { data: insertData, error: insertError } = await supabase
        .from("games")
        .insert({
          host_id: user.id,
          game_type: gameType,
          location_name: locationName,
          address,
          lng,
          lat,
          game_date: gameDate,
          start_time: startTime,
          buy_in: "", // Temporarily disabled - will be implemented later
          max_players: maxPlayers ? Number(maxPlayers) : null,
        })
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }

      setSuccess("Game hosted successfully!");
      setGameType("");
      setLocationName("");
      setAddress("");
      setGameDate("");
      setStartTime("");
      setMaxPlayers("");

      if (insertData && onGameCreated) {
        onGameCreated(insertData);
      }

      // After successfully hosting a game, optionally close the panel (e.g. on mobile)
      if (onClose) {
        onClose();
      }
    } catch {
      setError("An unexpected error occurred while hosting the game.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="h-full w-full md:w-80 bg-card/95 md:bg-card/60 backdrop-blur-xl border-0 md:border border-white/20 rounded-none md:rounded-xl overflow-y-auto shadow-lg transition-all duration-300 hover:shadow-xl hover:border-white/30"
      style={{
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      }}
    >
      <div className="p-3 sm:p-4 space-y-4">
        <div className="animate-in fade-in slide-in-from-top-2 duration-500">
          <h2 className="text-base sm:text-lg font-medium">Host a Game</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Create a new game with its type, address, date, and time.
          </p>
        </div>

        {error && (
          <div className="text-xs sm:text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-2 animate-in slide-in-from-top-2 fade-in duration-300">
            {error}
          </div>
        )}

        {success && (
          <div className="text-xs sm:text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md p-2 animate-in slide-in-from-top-2 fade-in duration-300">
            {success}
          </div>
        )}

        <form onSubmit={handleHostGame} className="space-y-3 text-xs sm:text-sm">
          <div className="space-y-1">
            <label htmlFor="gameType" className="font-medium">
              Game
            </label>
            <Input
              id="gameType"
              value={gameType}
              onChange={(e) => setGameType(e.target.value)}
              placeholder="Texas Hold'em"
              className="h-8 sm:h-9 text-xs sm:text-sm transition-all duration-200 focus:scale-[1.02]"
              disabled={loading}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="locationName" className="font-medium">
              Location Name
            </label>
            <Input
              id="locationName"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="Currier Dining Hall"
              className="h-8 sm:h-9 text-xs sm:text-sm"
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="address" className="font-medium">
              Address
            </label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="64 Linnaean St, Cambridge, MA"
              className="h-8 sm:h-9 text-xs sm:text-sm"
              disabled={loading}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 space-y-1">
              <label htmlFor="gameDate" className="font-medium">
                Date
              </label>
              <Input
                id="gameDate"
                type="date"
                value={gameDate}
                onChange={(e) => setGameDate(e.target.value)}
                className="h-8 sm:h-9 text-xs sm:text-sm"
                disabled={loading}
              />
            </div>
            <div className="flex-1 space-y-1">
              <label htmlFor="startTime" className="font-medium">
                Time
              </label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-8 sm:h-9 text-xs sm:text-sm"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="maxPlayers" className="font-medium">
              Max players{" "}
              <span className="text-[10px] sm:text-xs text-muted-foreground">(optional)</span>
            </label>
            <Input
              id="maxPlayers"
              type="number"
              min={2}
              max={12}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(e.target.value)}
              placeholder="8"
              className="h-8 sm:h-9 text-xs sm:text-sm"
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            size="sm"
            className="w-full mt-1 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg"
            disabled={loading}
          >
            {loading ? "Hosting..." : "Host game"}
          </Button>
        </form>
      </div>
    </div>
  );
}
