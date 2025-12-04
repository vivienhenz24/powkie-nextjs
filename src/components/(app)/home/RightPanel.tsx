 "use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { PokerGameCard } from "./PokerGameCard";

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
}

export function RightPanel({ onGameSelect }: RightPanelProps) {
  const supabase = createSupabaseBrowserClient();
  const [games, setGames] = useState<GameWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Clean up games that are 3+ hours past their start time
  const cleanupExpiredGames = useCallback(async () => {
    try {
      const now = new Date();
      const { data: allGames, error: fetchError } = await supabase
        .from("games")
        .select("*");

      if (fetchError || !allGames) return false;

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
          return false;
        }
        return true; // Games were deleted
      }
      return false; // No games to delete
    } catch (err) {
      console.error("Error cleaning up expired games:", err);
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

      if (userError || !user) {
        setError("You must be logged in to view games.");
        setLoading(false);
        return;
      }

      setUserId(user.id);

      // Clean up expired games before loading
      await cleanupExpiredGames();

      const today = new Date().toISOString().slice(0, 10);

      const { data: gamesData, error: gamesError } = await supabase
        .from("games")
        .select("*")
        .gte("game_date", today)
        .order("game_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (gamesError) {
        setError(gamesError.message);
        setLoading(false);
        return;
      }

      if (!gamesData || gamesData.length === 0) {
        setGames([]);
        setLoading(false);
        return;
      }

      const gameIds = gamesData.map((g) => g.id);

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
        if (row.player_id === user.id) {
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
            isJoined: meta.isJoined || g.host_id === user.id,
            isHost: g.host_id === user.id,
          };
        });

      setGames(withMeta);
    } catch {
      setError("An unexpected error occurred while loading games.");
    } finally {
      setLoading(false);
    }
  }, [supabase, cleanupExpiredGames]);

  useEffect(() => {
    loadGames();

    // Periodic cleanup of expired games (every 5 minutes)
    const cleanupInterval = setInterval(async () => {
      const gamesDeleted = await cleanupExpiredGames();
      // If games were deleted, reload the games list
      if (gamesDeleted) {
        loadGames();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(cleanupInterval);
  }, [loadGames, cleanupExpiredGames]);

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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
