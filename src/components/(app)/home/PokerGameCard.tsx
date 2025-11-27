"use client";

interface PokerGameCardProps {
  house: string;
  date: string;
  time: string;
  players: number;
  buyIn: string;
}

export function PokerGameCard({ house, date, time, players, buyIn }: PokerGameCardProps) {
  return (
    <div className="p-3 sm:p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors cursor-pointer">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium text-sm sm:text-base text-foreground">{house} House</h3>
        <span className="text-xs text-muted-foreground">{buyIn}</span>
      </div>
      <div className="space-y-1 text-xs sm:text-sm text-muted-foreground">
        <p>{date}</p>
        <p>{time}</p>
        <p className="text-xs">{players} players</p>
      </div>
    </div>
  );
}
