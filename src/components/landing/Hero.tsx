"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Hero() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <main className="text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-normal text-foreground mb-8">
          Welcome to powkie
        </h1>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            asChild
            size="lg" 
            className="shadow-[4px_4px_0_0_rgba(0,0,0,0.25)] hover:bg-primary hover:shadow-[2px_2px_0_0_rgba(0,0,0,0.25)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-100"
          >
            <Link href="/signup">Sign Up</Link>
          </Button>
          <Button 
            asChild
            variant="outline" 
            size="lg"
            className="shadow-[4px_4px_0_0_rgba(0,0,0,0.15)] hover:bg-background hover:text-foreground hover:shadow-[2px_2px_0_0_rgba(0,0,0,0.15)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-100"
          >
            <Link href="/login">Log In</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

