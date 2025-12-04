"use client";

import { useState, useEffect } from "react";
import { X, Trash2, MapPin, Calendar, Clock, DollarSign, Users, Edit2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

interface GameDetailBoxProps {
  game: {
    id: string;
    game_type: string;
    address: string;
    game_date: string;
    start_time: string;
    buy_in: string;
    max_players?: number | null;
    host_id: string;
    lng?: number;
    lat?: number;
  };
  onClose: () => void;
  onGameDeleted?: () => void;
  onGameUpdated?: (updatedGame: any) => void;
}

interface Player {
  id: string;
  display_name: string;
  email?: string;
  isHost: boolean;
}

export function GameDetailBox({ game, onClose, onGameDeleted, onGameUpdated }: GameDetailBoxProps) {
  const supabase = createSupabaseBrowserClient();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  
  // Edit form state
  const [gameType, setGameType] = useState(game.game_type);
  const [address, setAddress] = useState(game.address);
  const [gameDate, setGameDate] = useState(game.game_date);
  const [startTime, setStartTime] = useState(game.start_time);
  const [buyIn, setBuyIn] = useState(game.buy_in);
  const [maxPlayers, setMaxPlayers] = useState<string>(game.max_players?.toString() || "");

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          setIsHost(user.id === game.host_id);
        }

        // Load host profile
        const { data: hostProfile } = await supabase
          .from("profiles")
          .select("display_name, email")
          .eq("user_id", game.host_id)
          .single();

        const playersList: Player[] = [];
        if (hostProfile) {
          playersList.push({
            id: game.host_id,
            display_name: hostProfile.display_name || "Host",
            email: hostProfile.email,
            isHost: true,
          });
        }

        // Load other players
        const { data: gamePlayers, error: playersError } = await supabase
          .from("game_players")
          .select("player_id")
          .eq("game_id", game.id);

        if (!playersError && gamePlayers && gamePlayers.length > 0) {
          const playerIds = gamePlayers.map((gp) => gp.player_id);
          const { data: playerProfiles } = await supabase
            .from("profiles")
            .select("user_id, display_name, email")
            .in("user_id", playerIds);

          if (playerProfiles) {
            playerProfiles.forEach((profile) => {
              playersList.push({
                id: profile.user_id,
                display_name: profile.display_name || "Player",
                email: profile.email,
                isHost: false,
              });
            });
          }
        }

        setPlayers(playersList);
      } catch (err) {
        console.error("Error loading game details:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [game.id, game.host_id, supabase]);

  const handleDelete = async () => {
    if (!isHost || !currentUserId) return;

    if (!confirm("Are you sure you want to delete this game? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("games")
        .delete()
        .eq("id", game.id)
        .eq("host_id", currentUserId);

      if (error) {
        alert("Failed to delete game: " + error.message);
        setDeleting(false);
        return;
      }

      if (onGameDeleted) {
        onGameDeleted();
      }
      handleClose();
    } catch (err) {
      alert("An unexpected error occurred while deleting the game.");
      setDeleting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!isHost || !currentUserId) return;

    if (!gameType || !address || !gameDate || !startTime || !buyIn) {
      setEditError("Please fill in all required fields.");
      return;
    }

    setSaving(true);
    setEditError(null);

    try {
      let lng = game.lng;
      let lat = game.lat;
      const addressChanged = address !== game.address;

      // Re-geocode if address changed
      if (addressChanged) {
        const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!mapboxToken) {
          setEditError("Missing Mapbox token. Cannot update address.");
          setSaving(false);
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
          setEditError("Could not find that address on the map. Try a more specific address.");
          setSaving(false);
          return;
        }

        [lng, lat] = feature.center as [number, number];
      }

      const { data: updatedGame, error: updateError } = await supabase
        .from("games")
        .update({
          game_type: gameType,
          address,
          game_date: gameDate,
          start_time: startTime,
          buy_in: buyIn,
          max_players: maxPlayers ? Number(maxPlayers) : null,
          ...(addressChanged && { lng, lat }),
        })
        .eq("id", game.id)
        .eq("host_id", currentUserId)
        .select()
        .single();

      if (updateError) {
        setEditError(updateError.message);
        setSaving(false);
        return;
      }

      setIsEditing(false);
      if (onGameUpdated && updatedGame) {
        onGameUpdated(updatedGame);
      }
    } catch (err) {
      setEditError("An unexpected error occurred while updating the game.");
      setSaving(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditError(null);
    // Reset form to original values
    setGameType(game.game_type);
    setAddress(game.address);
    setGameDate(game.game_date);
    setStartTime(game.start_time);
    setBuyIn(game.buy_in);
    setMaxPlayers(game.max_players?.toString() || "");
    // Smooth transition out of edit mode
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    // timeString is in HH:MM:SS format, convert to 12-hour format
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className={`absolute inset-0 z-50 flex items-center justify-center p-4 sm:p-8 transition-all duration-300 ${isClosing ? 'animate-out fade-out' : 'animate-in fade-in'}`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-md transition-all duration-300 ${isClosing ? 'animate-out fade-out' : 'animate-in fade-in'}`}
        onClick={handleClose}
      />

      {/* Detail Box */}
      <div
        className={`relative w-full max-w-2xl bg-card/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 ${isClosing ? 'animate-out fade-out zoom-out-95' : 'animate-in fade-in zoom-in-95'}`}
        style={{
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600/30 to-green-700/30 backdrop-blur-sm border-b border-white/10 p-4 sm:p-6 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
              {game.game_type}
            </h2>
            <div className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{game.address}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 transition-all duration-200 hover:scale-110 active:scale-95"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6">
          {editError && (
            <div className="text-xs sm:text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-2">
              {editError}
            </div>
          )}

          {isEditing ? (
            /* Edit Form */
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 transition-all">
              <div className="space-y-2">
                <label htmlFor="editGameType" className="text-sm font-medium">
                  Game
                </label>
                <Input
                  id="editGameType"
                  value={gameType}
                  onChange={(e) => setGameType(e.target.value)}
                  placeholder="No Limit Texas Hold'em"
                  className="h-9 text-sm"
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="editAddress" className="text-sm font-medium">
                  Address
                </label>
                <Input
                  id="editAddress"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="64 Linnaean St, Cambridge, MA"
                  className="h-9 text-sm"
                  disabled={saving}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label htmlFor="editGameDate" className="text-sm font-medium">
                    Date
                  </label>
                  <Input
                    id="editGameDate"
                    type="date"
                    value={gameDate}
                    onChange={(e) => setGameDate(e.target.value)}
                    className="h-9 text-sm"
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="editStartTime" className="text-sm font-medium">
                    Time
                  </label>
                  <Input
                    id="editStartTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="h-9 text-sm"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="editBuyIn" className="text-sm font-medium">
                  Buy-in
                </label>
                <Input
                  id="editBuyIn"
                  value={buyIn}
                  onChange={(e) => setBuyIn(e.target.value)}
                  placeholder="$50"
                  className="h-9 text-sm"
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="editMaxPlayers" className="text-sm font-medium">
                  Max players{" "}
                  <span className="text-xs text-muted-foreground">(optional)</span>
                </label>
                <Input
                  id="editMaxPlayers"
                  type="number"
                  min={2}
                  max={12}
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(e.target.value)}
                  placeholder="8"
                  className="h-9 text-sm"
                  disabled={saving}
                />
              </div>
            </div>
          ) : (
            /* Game Details Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300 transition-all">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
              <Calendar className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="text-sm font-medium">{formatDate(game.game_date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="text-sm font-medium">{formatTime(game.start_time)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Buy-in</p>
                <p className="text-sm font-medium">{game.buy_in}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Players</p>
                <p className="text-sm font-medium">
                  {loading ? "Loading..." : `${players.length}${game.max_players ? ` / ${game.max_players}` : ""}`}
                </p>
              </div>
            </div>
            </div>
          )}

          {/* Players List */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Players ({loading ? "..." : players.length})
            </h3>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading players...</div>
            ) : players.length === 0 ? (
              <div className="text-sm text-muted-foreground p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
                No players have joined yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-200"
                  >
                    <div className="h-8 w-8 rounded-full bg-green-600/20 flex items-center justify-center font-semibold text-xs text-green-600">
                      {player.display_name
                        .split(" ")
                        .slice(0, 2)
                        .map((n) => n[0]?.toUpperCase())
                        .join("") || "P"}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {player.display_name}
                        {player.isHost && (
                          <span className="ml-2 text-xs text-green-600 font-semibold">
                            (Host)
                          </span>
                        )}
                      </p>
                      {player.email && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {player.email}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm p-4 sm:p-6 flex justify-between gap-3">
          <div className="flex gap-3">
            {isHost && !isEditing && (
              <Button
                variant="outline"
                onClick={handleStartEdit}
                className="flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Edit2 className="h-4 w-4" />
                Edit Game
              </Button>
            )}
            {isHost && isEditing && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting || saving}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? "Deleting..." : "Delete Game"}
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                onClick={handleClose}
                className="transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Close
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

