"use client";

import { PokerGameCard } from "./PokerGameCard";

// Mock data for upcoming poker games
const upcomingGames = [
  {
    id: 1,
    house: "Eliot",
    date: "Friday, March 15",
    time: "7:00 PM",
    players: 8,
    buyIn: "$20",
  },
  {
    id: 2,
    house: "Kirkland",
    date: "Saturday, March 16",
    time: "8:00 PM",
    players: 6,
    buyIn: "$25",
  },
  {
    id: 3,
    house: "Winthrop",
    date: "Sunday, March 17",
    time: "6:30 PM",
    players: 10,
    buyIn: "$15",
  },
  {
    id: 4,
    house: "Quincy",
    date: "Monday, March 18",
    time: "7:30 PM",
    players: 7,
    buyIn: "$30",
  },
  {
    id: 5,
    house: "Adams",
    date: "Tuesday, March 19",
    time: "8:00 PM",
    players: 9,
    buyIn: "$20",
  },
];

export function RightPanel() {
  return (
    <div className="h-full w-full md:w-80 border border-border rounded-lg md:rounded-xl overflow-y-auto" style={{ backgroundColor: "var(--app-secondary)" }}>
      <div className="p-3 sm:p-4">
        <h2 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Upcoming Games</h2>
        <div className="space-y-2 sm:space-y-3">
          {upcomingGames.map((game) => (
            <PokerGameCard
              key={game.id}
              house={game.house}
              date={game.date}
              time={game.time}
              players={game.players}
              buyIn={game.buyIn}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
