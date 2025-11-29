"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'slide-left' | 'slide-right' | 'fade'>('fade');
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    // Only transition if pathname actually changed
    if (prevPathnameRef.current !== pathname) {
      // Determine transition direction based on navigation
      const prevPath = prevPathnameRef.current;
      const isToAuth = pathname === '/signup' || pathname === '/login';
      const isFromAuth = prevPath === '/signup' || prevPath === '/login';
      const isFromHome = prevPath === '/';
      
      if (isToAuth && isFromHome) {
        setTransitionDirection('slide-left');
      } else if (isFromAuth && pathname === '/') {
        setTransitionDirection('slide-right');
      } else {
        setTransitionDirection('fade');
      }
      
      setIsTransitioning(true);
      
      // Use double requestAnimationFrame for smoother transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setDisplayChildren(children);
          // Small delay to ensure DOM is ready
          setTimeout(() => {
            setIsTransitioning(false);
          }, 50);
        });
      });
      
      prevPathnameRef.current = pathname;
    } else {
      // If pathname didn't change, just update children without transition
      setDisplayChildren(children);
    }
  }, [pathname, children]);

  const getTransitionStyles = () => {
    if (!isTransitioning) {
      return {
        opacity: 1,
        transform: 'translateX(0) translateY(0) scale(1)',
      };
    }

    switch (transitionDirection) {
      case 'slide-left':
        return {
          opacity: 0,
          transform: 'translateX(30px) translateY(0) scale(0.95)',
        };
      case 'slide-right':
        return {
          opacity: 0,
          transform: 'translateX(-30px) translateY(0) scale(0.95)',
        };
      default: // fade
        return {
          opacity: 0,
          transform: 'translateY(16px) scale(0.98)',
        };
    }
  };

  return (
    <div
      className="transition-all duration-300 ease-in-out"
      style={{
        ...getTransitionStyles(),
        transitionProperty: 'opacity, transform',
        willChange: isTransitioning ? 'opacity, transform' : 'auto',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        perspective: '1000px',
      }}
    >
      {displayChildren}
    </div>
  );
}

