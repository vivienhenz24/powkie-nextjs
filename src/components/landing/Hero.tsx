"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PokerVisuals } from "@/components/auth/PokerVisuals";

export function Hero() {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Poker visuals */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <PokerVisuals />
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center space-y-6 px-8">
            <h2 className="text-5xl font-bold text-white drop-shadow-lg text-pop-up">
              Welcome to powkie
            </h2>
            <p className="text-2xl text-green-100 drop-shadow-md text-pop-up-delay-1">
              Casual in-person poker at Harvard, everyday!
            </p>
            <div className="flex items-center justify-center gap-3 text-2xl text-white/80 mt-4 text-pop-up-delay-2">
              <span>♠</span>
              <span>♥</span>
              <span>♦</span>
              <span>♣</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - CTA */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-12 bg-background">
        <main className="text-center w-full max-w-md space-y-8">
          {/* Mobile header */}
          <div className="lg:hidden space-y-4">
            <h1 className="text-4xl font-bold text-foreground text-pop-up">
              Welcome to powkie
            </h1>
            <p className="text-lg text-muted-foreground text-pop-up-delay-1">
              Upcoming games: Currier Dhall 10pm today!
            </p>
          </div>

          {/* Desktop header */}
          <div className="hidden lg:block space-y-4">
            <h1 className="text-5xl font-bold text-foreground text-pop-up">
              Ready to Sign Up?
            </h1>
            <p className="text-xl text-muted-foreground text-pop-up-delay-1">
              Upcoming games: Currier Dhall 10pm today!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button 
              asChild
              size="lg" 
              className="w-full sm:w-auto h-12 text-base font-semibold bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Link href="/signup">Ready to Sign Up?</Link>
            </Button>
            <Button 
              asChild
              variant="outline" 
              size="lg"
              className="w-full sm:w-auto h-12 text-base font-semibold border-2 hover:bg-accent hover:text-accent-foreground transition-all duration-200"
            >
              <Link href="/login">Log In</Link>
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-4">
            <span>♠</span>
            <span>♥</span>
            <span>♦</span>
            <span>♣</span>
          </div>
        </main>
      </div>
    </div>
  );
}

