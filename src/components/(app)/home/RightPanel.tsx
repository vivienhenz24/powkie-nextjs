"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { PokerGameCard } from "./PokerGameCard";
import { ChevronDown, ChevronUp, Archive } from "lucide-react";

interface GameWithMeta {
  id: string;
  game_type: string;
  location_name?: string | null;
  address: string;
  game_date: string;
  start_time: string;
  buy_in: string;
  max_players?: number | null;
  host_id: string;
  lng?: number;
  lat?: number;
  playersCount: number;
  isJoined: boolean;
  isHost: boolean;
}

interface RightPanelProps {
  onGameSelect?: (game: GameWithMeta) => void;
  isGuest?: boolean;
}

export function RightPanel({ onGameSelect, isGuest = false }: RightPanelProps) {
  const supabase = createSupabaseBrowserClient();
  const [games, setGames] = useState<GameWithMeta[]>([]);
  const [archivedGames, setArchivedGames] = useState<GameWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const isLoadingArchivedRef = useRef(false);

  // Archive games that are 3+ hours past their start time
  const cleanupExpiredGames = useCallback(async () => {
    try {
      const now = new Date();
      // Get all games and filter client-side to handle NULL values
      const { data: allGames, error: fetchError } = await supabase
        .from("games")
        .select("*");

      // Filter out archived games (handles both NULL and false)
      const nonArchivedGames = allGames?.filter(
        (game) => game.archived !== true
      ) || [];

      if (fetchError || !nonArchivedGames) return false;

      const expiredGameIds: string[] = [];

      for (const game of nonArchivedGames) {
        // Combine game_date and start_time to create the game start datetime
        const gameStartDate = new Date(`${game.game_date}T${game.start_time}`);
        
        // Add 3 hours to the start time
        const archiveTime = new Date(gameStartDate.getTime() + 3 * 60 * 60 * 1000);
        
        // If current time is past the archive time, mark for archiving
        if (now >= archiveTime) {
          expiredGameIds.push(game.id);
        }
      }

      // Archive expired games
      if (expiredGameIds.length > 0) {
        const { error: archiveError } = await supabase
          .from("games")
          .update({ archived: true })
          .in("id", expiredGameIds);

        if (archiveError) {
          console.error("Error archiving expired games:", archiveError);
          return false;
        }
        return true; // Games were archived
      }
      return false; // No games to archive
    } catch (err) {
      console.error("Error archiving expired games:", err);
      return false;
    }
  }, [supabase]);

  const loadGames = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      // Allow guest mode - don't require authentication to view games
      if (user && !userError) {
        setUserId(user.id);
      } else {
        setUserId(null);
      }

      // Clean up expired games before loading
      await cleanupExpiredGames();

      const today = new Date().toISOString().slice(0, 10);
      console.log("Loading games - today's date:", today);

      // Query for all games first (no date filter to see all games)
      const { data: allGamesData, error: allGamesError } = await supabase
        .from("games")
        .select("*")
        .order("game_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (allGamesError) {
        console.error("Error loading all games:", allGamesError);
        setError(allGamesError.message);
        setLoading(false);
        return;
      }

      console.log("All games from database:", {
        total: allGamesData?.length || 0,
        today: today,
        games: allGamesData?.map((g) => ({ 
          id: g.id, 
          archived: g.archived, 
          game_date: g.game_date,
          game_date_vs_today: g.game_date >= today ? "FUTURE" : "PAST",
          game_type: g.game_type,
          location_name: g.location_name
        }))
      });

      // Filter out archived games client-side (handles both NULL and false correctly)
      const nonArchivedGames = allGamesData?.filter(
        (game) => game.archived !== true
      ) || [];

      // Show all non-archived games (if they're not archived, they should be visible)
      // Sort by date so upcoming games appear first
      const upcomingGames = nonArchivedGames.sort((a, b) => {
        // Sort by date: future dates first, then past dates
        if (a.game_date >= today && b.game_date < today) return -1;
        if (a.game_date < today && b.game_date >= today) return 1;
        // If both are future or both are past, sort by date
        return a.game_date.localeCompare(b.game_date);
      });

      console.log("Upcoming games (all non-archived):", {
        count: upcomingGames.length,
        games: upcomingGames.map((g) => ({ 
          id: g.id, 
          archived: g.archived, 
          game_date: g.game_date,
          is_future: g.game_date >= today
        }))
      });

      console.log("Filtered games:", {
        nonArchived: nonArchivedGames.length,
        upcoming: upcomingGames.length,
        nonArchivedGames: nonArchivedGames.map((g) => ({ 
          id: g.id, 
          archived: g.archived, 
          game_date: g.game_date 
        })),
        upcomingGames: upcomingGames.map((g) => ({ 
          id: g.id, 
          archived: g.archived, 
          game_date: g.game_date 
        }))
      });

      if (upcomingGames.length === 0) {
        setGames([]);
        setLoading(false);
        return;
      }

      const gameIds = upcomingGames.map((g) => g.id);

      const { data: playersData, error: playersError } = await supabase
        .from("game_players")
        .select("game_id, player_id")
        .in("game_id", gameIds);

      if (playersError) {
        setError(playersError.message);
        setLoading(false);
        return;
      }

      const metaByGame = new Map<
        string,
        { playersCount: number; isJoined: boolean }
      >();

      playersData?.forEach((row) => {
        const current = metaByGame.get(row.game_id) || {
          playersCount: 0,
          isJoined: false,
        };
        current.playersCount += 1;
        if (user && row.player_id === user.id) {
          current.isJoined = true;
        }
        metaByGame.set(row.game_id, current);
      });

        const withMeta: GameWithMeta[] = upcomingGames.map((g: any) => {
          const meta = metaByGame.get(g.id) || {
            playersCount: 0,
            isJoined: false,
          };
          // Host always counts as 1 player, so add 1 to the count
          return {
            id: g.id,
            game_type: g.game_type,
            location_name: g.location_name,
            address: g.address,
            game_date: g.game_date,
            start_time: g.start_time,
            buy_in: g.buy_in,
            max_players: g.max_players,
            host_id: g.host_id,
            lng: g.lng,
            lat: g.lat,
            playersCount: meta.playersCount + 1, // +1 for the host
            isJoined: user ? (meta.isJoined || g.host_id === user.id) : false,
            isHost: user ? g.host_id === user.id : false,
          };
        });

      setGames(withMeta);
    } catch {
      setError("An unexpected error occurred while loading games.");
    } finally {
      setLoading(false);
    }
  }, [supabase, cleanupExpiredGames]);

  // Load archived games
  const loadArchivedGames = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingArchivedRef.current) {
      console.log("Archived games already loading, skipping...");
      return;
    }
    
    isLoadingArchivedRef.current = true;
    setArchivedLoading(true);
    setError(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      // Allow guest mode - don't require authentication to view games
      if (user && !userError) {
        setUserId(user.id);
      } else {
        setUserId(null);
      }

      // Query for archived games - explicitly true
      const { data: gamesData, error: gamesError } = await supabase
        .from("games")
        .select("*")
        .eq("archived", true) // Only load archived games (explicitly true)
        .order("game_date", { ascending: false })
        .order("start_time", { ascending: false })
        .limit(20); // Limit to 20 most recent archived games

      console.log("Archived games query result:", { 
        gamesData, 
        gamesError,
        count: gamesData?.length || 0,
        sample: gamesData?.slice(0, 2).map((g) => ({ id: g.id, archived: g.archived, game_date: g.game_date }))
      });

      if (gamesError) {
        console.error("Error loading archived games:", gamesError);
        setArchivedGames([]);
        setArchivedLoading(false);
        return;
      }

      if (!gamesData || gamesData.length === 0) {
        setArchivedGames([]);
        setArchivedLoading(false);
        return;
      }

      const gameIds = gamesData.map((g) => g.id);

      const { data: playersData, error: playersError } = await supabase
        .from("game_players")
        .select("game_id, player_id")
        .in("game_id", gameIds);

      if (playersError) {
        console.error("Error loading players for archived games:", playersError);
        // Continue anyway - we'll just show 0 players
      }

      const metaByGame = new Map<
        string,
        { playersCount: number; isJoined: boolean }
      >();

      playersData?.forEach((row) => {
        const current = metaByGame.get(row.game_id) || {
          playersCount: 0,
          isJoined: false,
        };
        current.playersCount += 1;
        if (user && row.player_id === user.id) {
          current.isJoined = true;
        }
        metaByGame.set(row.game_id, current);
      });

      const withMeta: GameWithMeta[] = gamesData.map((g: any) => {
        const meta = metaByGame.get(g.id) || {
          playersCount: 0,
          isJoined: false,
        };
        // Host always counts as 1 player, so add 1 to the count
        return {
          id: g.id,
          game_type: g.game_type,
          location_name: g.location_name,
          address: g.address,
          game_date: g.game_date,
          start_time: g.start_time,
          buy_in: g.buy_in,
          max_players: g.max_players,
          host_id: g.host_id,
          lng: g.lng,
          lat: g.lat,
          playersCount: meta.playersCount + 1, // +1 for the host
          isJoined: user ? (meta.isJoined || g.host_id === user.id) : false,
          isHost: user ? g.host_id === user.id : false,
        };
      });

      setArchivedGames(withMeta);
    } catch (err) {
      console.error("Error loading archived games:", err);
      setArchivedGames([]);
    } finally {
      setArchivedLoading(false);
      isLoadingArchivedRef.current = false;
    }
  }, [supabase]);

  useEffect(() => {
    loadGames();

    // Periodic cleanup of expired games (every 5 minutes)
    const cleanupInterval = setInterval(async () => {
      const gamesArchived = await cleanupExpiredGames();
      // If games were archived, reload the games list
      if (gamesArchived) {
        loadGames();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(cleanupInterval);
  }, [loadGames, cleanupExpiredGames]);

  // Load archived games when dropdown is opened
  useEffect(() => {
    if (archivedOpen && !isLoadingArchivedRef.current) {
      loadArchivedGames().catch((err) => {
        console.error("Failed to load archived games:", err);
        setArchivedLoading(false);
        isLoadingArchivedRef.current = false;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [archivedOpen]);

  const handleJoin = async (gameId: string) => {
    if (!userId) return;
    setJoiningId(gameId);
    setError(null);

    try {
      const { error: joinError } = await supabase.from("game_players").insert({
        game_id: gameId,
        player_id: userId,
      });

      if (joinError) {
        setError(joinError.message);
        setJoiningId(null);
        return;
      }

      setGames((prev) =>
        prev.map((g) =>
          g.id === gameId
            ? {
                ...g,
                isJoined: true,
                playersCount: g.playersCount + 1,
              }
            : g
        )
      );
    } catch {
      setError("An unexpected error occurred while joining the game.");
    } finally {
      setJoiningId(null);
    }
  };

  const handleLeave = async (gameId: string) => {
    if (!userId) return;
    setJoiningId(gameId);
    setError(null);

    try {
      const { error: leaveError } = await supabase
        .from("game_players")
        .delete()
        .match({ game_id: gameId, player_id: userId });

      if (leaveError) {
        setError(leaveError.message);
        setJoiningId(null);
        return;
      }

      setGames((prev) =>
        prev.map((g) =>
          g.id === gameId
            ? {
                ...g,
                isJoined: false,
                playersCount: Math.max(0, g.playersCount - 1),
              }
            : g
        )
      );
    } catch {
      setError("An unexpected error occurred while leaving the game.");
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div
      className="h-full w-full md:w-80 bg-card backdrop-blur-xl border border-white/20 rounded-lg md:rounded-xl overflow-y-auto md:overflow-y-auto shadow-lg transition-all duration-300 hover:shadow-xl hover:border-white/30 flex flex-col"
      style={{
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      }}
    >
      <div className="p-3 sm:p-4 space-y-3 flex-1 min-h-0">
        <h2 className="text-base sm:text-lg font-medium animate-in fade-in slide-in-from-top-2 duration-500">Upcoming Games</h2>

        {error && (
          <div className="text-xs sm:text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-2">
            {error}
          </div>
        )}

        {loading && (
          <div className="space-y-2 animate-in fade-in duration-300">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white/5 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {!loading && games.length === 0 && !error && (
        <div className="space-y-2 sm:space-y-3 text-sm text-muted-foreground">
          <p className="text-pop-up">
            You don&apos;t have any upcoming games yet.
          </p>
          <p className="text-pop-up-delay-1">
              Once you create or join a game, it will show up here with the game type,
              time, and players.
            </p>
          </div>
        )}

        <div className="space-y-2 sm:space-y-3">
          {games.map((game, index) => (
            <div key={game.id} className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
              <PokerGameCard
                gameType={game.game_type}
                locationName={game.location_name}
                address={game.address}
                date={(() => {
                  // Parse date string as local date to avoid timezone issues
                  const [year, month, day] = game.game_date.split('-').map(Number);
                  const date = new Date(year, month - 1, day);
                  return date.toLocaleDateString();
                })()}
                time={game.start_time}
                players={game.playersCount}
                maxPlayers={game.max_players}
                onClick={() => onGameSelect?.(game)}
              />
              {!isGuest && (
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-muted-foreground">
                    {game.isHost
                      ? "You are hosting this game"
                      : game.isJoined
                      ? "You are playing in this game"
                      : "Open seat available"}
                  </span>
                  {!game.isHost && (
                    <Button
                      size="sm"
                      variant={game.isJoined ? "outline" : "default"}
                      className="h-7 px-3 transition-all duration-200 hover:scale-105 active:scale-95"
                      disabled={joiningId === game.id}
                      onClick={() =>
                        game.isJoined ? handleLeave(game.id) : handleJoin(game.id)
                      }
                    >
                      {joiningId === game.id
                        ? game.isJoined
                          ? "Leaving..."
                          : "Joining..."
                        : game.isJoined
                        ? "Leave"
                        : "Join"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Archived Games Section */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <Button
            variant="ghost"
            className="w-full justify-between text-sm font-medium text-muted-foreground hover:text-foreground"
            onClick={() => setArchivedOpen(!archivedOpen)}
          >
            <div className="flex items-center gap-2">
              <Archive className="h-4 w-4" />
              <span>Archived Games</span>
            </div>
            {archivedOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          {archivedOpen && (
            <div className="mt-3 space-y-2 sm:space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
              {archivedLoading && (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-20 bg-white/5 rounded-lg animate-pulse" />
                  ))}
                </div>
              )}

              {!archivedLoading && archivedGames.length === 0 && (
                <p className="text-xs sm:text-sm text-muted-foreground">
                  No archived games yet.
                </p>
              )}

              {!archivedLoading &&
                archivedGames.map((game, index) => (
                  <div
                    key={game.id}
                    className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500 opacity-60"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <PokerGameCard
                      gameType={game.game_type}
                      locationName={game.location_name}
                      address={game.address}
                      date={(() => {
                        const [year, month, day] = game.game_date.split('-').map(Number);
                        const date = new Date(year, month - 1, day);
                        return date.toLocaleDateString();
                      })()}
                      time={game.start_time}
                      players={game.playersCount}
                      maxPlayers={game.max_players}
                      onClick={() => onGameSelect?.(game)}
                    />
                    <div className="text-xs text-muted-foreground italic">
                      Archived
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
