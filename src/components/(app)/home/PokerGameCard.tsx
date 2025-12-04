 "use client";

interface PokerGameCardProps {
  gameType: string;
  locationName?: string | null;
  address: string;
  date: string;
  time: string;
  players: number;
  maxPlayers?: number | null;
  onClick?: () => void;
}

function formatTime(timeString: string): string {
  // timeString is in HH:MM:SS or HH:MM format, convert to 12-hour format
  const [hours, minutes] = timeString.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export function PokerGameCard({
  gameType,
  locationName,
  address,
  date,
  time,
  players,
  maxPlayers,
  onClick,
}: PokerGameCardProps) {
  const availableSeats = maxPlayers ? maxPlayers - players : null;
  const playersText = availableSeats !== null 
    ? `${players} players (${availableSeats} seats available)`
    : `${players} players`;

  return (
    <div 
      className="p-3 sm:p-4 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md hover:scale-[1.02] hover:border-white/30 active:scale-[0.98]"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-medium text-sm sm:text-base text-foreground">
            {gameType}
          </h3>
          {locationName && (
            <p className="text-xs sm:text-sm font-medium text-foreground">{locationName}</p>
          )}
          <p className="text-xs sm:text-sm text-muted-foreground">{address}</p>
        </div>
      </div>
      <div className="space-y-1 text-xs sm:text-sm text-muted-foreground">
        <p>{date}</p>
        <p>{formatTime(time)}</p>
        <p className="text-xs">{playersText}</p>
      </div>
    </div>
  );
}
