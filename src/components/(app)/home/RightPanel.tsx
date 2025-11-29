"use client";

export function RightPanel() {
  return (
    <div className="h-full w-full md:w-80 border border-border rounded-lg md:rounded-xl overflow-y-auto" style={{ backgroundColor: "var(--app-secondary)" }}>
      <div className="p-3 sm:p-4">
        <h2 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Upcoming Games</h2>
        <div className="space-y-2 sm:space-y-3 text-sm text-muted-foreground">
          <p className="text-pop-up">
            You don&apos;t have any upcoming games yet.
          </p>
          <p className="text-pop-up-delay-1">
            Once you create or join a game, it will show up here with the house, time, buy-in, and players.
          </p>
        </div>
      </div>
    </div>
  );
}
