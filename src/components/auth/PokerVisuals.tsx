"use client";

import { useEffect, useState } from "react";

const suits = ["♠", "♥", "♦", "♣"];
const ranks = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];

type ShuffleType = 'riffle' | 'overhand' | 'hindu' | 'faro';

interface Card {
  suit: string;
  rank: string;
  color: string;
  index: number;
  shuffleType: ShuffleType;
}

export function PokerVisuals() {
  const [cards, setCards] = useState<Card[]>([]);
  const [isReady, setIsReady] = useState(false);

  const generateDeck = (): Card[] => {
    const deck: Card[] = [];
    const shuffleTypes: ShuffleType[] = ['riffle', 'overhand', 'hindu', 'faro'];
    
    suits.forEach((suit) => {
      ranks.forEach((rank) => {
        const color = suit === "♥" || suit === "♦" ? "text-red-600" : "text-foreground";
        deck.push({ suit, rank, color, index: deck.length, shuffleType: shuffleTypes[deck.length % shuffleTypes.length] });
      });
    });
    // Shuffle the deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    // Take first 16 cards for display - ensure all have valid data
    return deck.slice(0, 16).map((card, i) => {
      // Always ensure card has valid suit and rank
      const validSuit = card.suit && card.suit.trim() ? card.suit : suits[i % suits.length];
      const validRank = card.rank && card.rank.trim() ? card.rank : ranks[i % ranks.length];
      const validColor = validSuit === "♥" || validSuit === "♦" ? "text-red-600" : "text-foreground";
      
      return { 
        suit: validSuit,
        rank: validRank,
        color: validColor,
        index: i,
        shuffleType: shuffleTypes[i % shuffleTypes.length]
      };
    });
  };

  useEffect(() => {
    // Initialize GPU acceleration and prepare animations
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setCards(generateDeck());
        setIsReady(true);
      });
    });
  }, []);

  return (
    <div 
      className="relative w-full h-full overflow-hidden bg-linear-to-br from-green-950 via-green-900 to-green-950 min-h-screen"
      style={{
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
    >
      {/* Felt texture overlay */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `repeating-linear-gradient(
          45deg,
          transparent,
          transparent 2px,
          rgba(0,0,0,0.1) 2px,
          rgba(0,0,0,0.1) 4px
        )`
      }} />
      
      {/* Cards area - positioned at top, centered */}
      <div 
        className="absolute top-10 left-0 right-0 flex justify-center"
        style={{
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
      >
        <div 
          className="relative w-full max-w-2xl h-64 flex items-center justify-center"
          style={{
            willChange: 'transform',
            transform: 'translateZ(0)',
          }}
        >
          {/* Animated cards with different shuffle types */}
          {cards.map((card, i) => {
            const totalCards = cards.length;
            const stackOffset = i * 0.4;
            const opacity = Math.max(0.85, 1 - (i / totalCards) * 0.15);
            const cardColor = card.color.includes('red') ? '#dc2626' : '#1a1a1a';
            const isLeftHalf = i < totalCards / 2;
            const positionInHalf = isLeftHalf ? i : i - totalCards / 2;
            
            // Calculate circle positions for fan-out
            const circleRadius = 75;
            const startAngle = 180; // Start from left
            const endAngle = 180 + 360; // Full circle
            const angleRange = endAngle - startAngle;
            const angle = startAngle + (i / Math.max(1, totalCards - 1)) * angleRange;
            const angleRad = (angle * Math.PI) / 180;
            const circleX = Math.cos(angleRad) * circleRadius;
            const circleY = Math.sin(angleRad) * circleRadius;
            
            // Shuffled position for variety
            const shuffledIndex = (i * 7 + 13) % totalCards;
            const shuffledAngle = startAngle + (shuffledIndex / Math.max(1, totalCards - 1)) * angleRange;
            const shuffledAngleRad = (shuffledAngle * Math.PI) / 180;
            const shuffledX = Math.cos(shuffledAngleRad) * circleRadius;
            const shuffledY = Math.sin(shuffledAngleRad) * circleRadius;
            
            // Create animation that cycles through all shuffle types
            const baseDelay = (i / totalCards) * 0.3;
            
            return (
              <div
                key={`card-${i}`}
                className="absolute w-20 h-28 bg-white rounded-lg shadow-2xl flex flex-col items-center justify-center font-bold border-2 border-gray-200"
                style={{
                  left: '50%',
                  top: '50%',
                  marginLeft: '-40px',
                  marginTop: '-56px',
                  '--card-index': i,
                  '--is-left': isLeftHalf ? 1 : 0,
                  '--position-in-half': positionInHalf,
                  '--stack-offset': `${stackOffset}px`,
                  '--card-opacity': opacity,
                  '--circle-x': `${circleX}px`,
                  '--circle-y': `${circleY}px`,
                  '--shuffled-x': `${shuffledX}px`,
                  '--shuffled-y': `${shuffledY}px`,
                  '--angle': `${angle}deg`,
                  animation: isReady ? `cycle-shuffles-with-fan 10s ease-in-out infinite` : 'none',
                  animationDelay: isReady ? `${baseDelay}s` : '0s',
                  transformOrigin: 'center center',
                  zIndex: totalCards - i + 100,
                  willChange: isReady ? 'transform, opacity' : 'auto',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'translateZ(0)',
                  opacity: isReady ? 1 : 0,
                  transition: isReady ? 'opacity 0.3s ease-in' : 'none',
                } as React.CSSProperties & {
                  '--card-index': number;
                  '--is-left': number;
                  '--position-in-half': number;
                  '--stack-offset': string;
                  '--card-opacity': number;
                  '--circle-x': string;
                  '--circle-y': string;
                  '--shuffled-x': string;
                  '--shuffled-y': string;
                  '--angle': string;
                }}
              >
                {/* Top right corner */}
                <div className="absolute top-1 right-1 flex flex-col items-end leading-tight z-10 pointer-events-none">
                  <span 
                    className="text-xs font-bold" 
                    style={{ 
                      color: cardColor,
                      lineHeight: '1.1'
                    }}
                  >
                    {card.rank}
                  </span>
                  <span 
                    className="text-xs" 
                    style={{ 
                      color: cardColor,
                      lineHeight: '1.1',
                      fontSize: '0.7rem'
                    }}
                  >
                    {card.suit}
                  </span>
                </div>
                {/* Center large suit (face) */}
                <span 
                  className="text-3xl font-bold pointer-events-none" 
                  style={{ 
                    color: cardColor,
                    lineHeight: '1'
                  }}
                >
                  {card.suit}
                </span>
                {/* Bottom left corner (rotated) */}
                <div className="absolute bottom-1 left-1 flex flex-col items-start leading-tight rotate-180 z-10 pointer-events-none">
                  <span 
                    className="text-xs font-bold" 
                    style={{ 
                      color: cardColor,
                      lineHeight: '1.1'
                    }}
                  >
                    {card.rank}
                  </span>
                  <span 
                    className="text-xs" 
                    style={{ 
                      color: cardColor,
                      lineHeight: '1.1',
                      fontSize: '0.7rem'
                    }}
                  >
                    {card.suit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Decorative face cards on left and right sides - fanned and slanted */}
      {/* Left side - Joker, A, K */}
      {/* Joker */}
      <div 
        className="absolute w-16 h-28 bg-white rounded-lg shadow-xl flex flex-col items-center justify-center font-bold border-2 border-gray-200"
        style={{
          left: '16px',
          top: 'calc(50% - 60px)',
          transform: 'translateY(-50%) rotate(-15deg)',
          zIndex: 23
        }}
      >
        <div className="absolute top-1 right-1 text-xs font-bold" style={{ color: '#9333ea' }}>J</div>
        <div className="text-2xl">🃏</div>
        <div className="absolute bottom-1 left-1 text-xs font-bold rotate-180" style={{ color: '#9333ea' }}>J</div>
      </div>
      {/* Ace */}
      <div 
        className="absolute w-16 h-28 bg-white rounded-lg shadow-xl flex flex-col items-center justify-center font-bold border-2 border-gray-200"
        style={{
          left: '24px',
          top: 'calc(50% + 0px)',
          transform: 'translateY(-50%) rotate(-8deg)',
          zIndex: 22
        }}
      >
        <div className="absolute top-1 right-1 flex flex-col items-end leading-tight z-10 pointer-events-none">
          <span className="text-xs font-bold" style={{ color: '#1a1a1a', lineHeight: '1.1' }}>A</span>
          <span className="text-xs" style={{ color: '#1a1a1a', lineHeight: '1.1', fontSize: '0.7rem' }}>♠</span>
        </div>
        <span className="text-2xl font-bold pointer-events-none" style={{ color: '#1a1a1a', lineHeight: '1' }}>♠</span>
        <div className="absolute bottom-1 left-1 flex flex-col items-start leading-tight rotate-180 z-10 pointer-events-none">
          <span className="text-xs font-bold" style={{ color: '#1a1a1a', lineHeight: '1.1' }}>A</span>
          <span className="text-xs" style={{ color: '#1a1a1a', lineHeight: '1.1', fontSize: '0.7rem' }}>♠</span>
        </div>
      </div>
      {/* King */}
      <div 
        className="absolute w-16 h-28 bg-white rounded-lg shadow-xl flex flex-col items-center justify-center font-bold border-2 border-gray-200"
        style={{
          left: '28px',
          top: 'calc(50% + 60px)',
          transform: 'translateY(-50%) rotate(-2deg)',
          zIndex: 21
        }}
      >
        <div className="absolute top-1 right-1 flex flex-col items-end leading-tight z-10 pointer-events-none">
          <span className="text-xs font-bold" style={{ color: '#dc2626', lineHeight: '1.1' }}>K</span>
          <span className="text-xs" style={{ color: '#dc2626', lineHeight: '1.1', fontSize: '0.7rem' }}>♥</span>
        </div>
        <span className="text-2xl font-bold pointer-events-none" style={{ color: '#dc2626', lineHeight: '1' }}>♥</span>
        <div className="absolute bottom-1 left-1 flex flex-col items-start leading-tight rotate-180 z-10 pointer-events-none">
          <span className="text-xs font-bold" style={{ color: '#dc2626', lineHeight: '1.1' }}>K</span>
          <span className="text-xs" style={{ color: '#dc2626', lineHeight: '1.1', fontSize: '0.7rem' }}>♥</span>
        </div>
      </div>

      {/* Right side - Q, J */}
      {/* Queen */}
      <div 
        className="absolute w-16 h-28 bg-white rounded-lg shadow-xl flex flex-col items-center justify-center font-bold border-2 border-gray-200"
        style={{
          right: '16px',
          top: 'calc(50% - 30px)',
          transform: 'translateY(-50%) rotate(15deg)',
          zIndex: 23
        }}
      >
        <div className="absolute top-1 right-1 flex flex-col items-end leading-tight z-10 pointer-events-none">
          <span className="text-xs font-bold" style={{ color: '#dc2626', lineHeight: '1.1' }}>Q</span>
          <span className="text-xs" style={{ color: '#dc2626', lineHeight: '1.1', fontSize: '0.7rem' }}>♦</span>
        </div>
        <span className="text-2xl font-bold pointer-events-none" style={{ color: '#dc2626', lineHeight: '1' }}>♦</span>
        <div className="absolute bottom-1 left-1 flex flex-col items-start leading-tight rotate-180 z-10 pointer-events-none">
          <span className="text-xs font-bold" style={{ color: '#dc2626', lineHeight: '1.1' }}>Q</span>
          <span className="text-xs" style={{ color: '#dc2626', lineHeight: '1.1', fontSize: '0.7rem' }}>♦</span>
        </div>
      </div>
      {/* Jack */}
      <div 
        className="absolute w-16 h-28 bg-white rounded-lg shadow-xl flex flex-col items-center justify-center font-bold border-2 border-gray-200"
        style={{
          right: '24px',
          top: 'calc(50% + 30px)',
          transform: 'translateY(-50%) rotate(8deg)',
          zIndex: 22
        }}
      >
        <div className="absolute top-1 right-1 flex flex-col items-end leading-tight z-10 pointer-events-none">
          <span className="text-xs font-bold" style={{ color: '#1a1a1a', lineHeight: '1.1' }}>J</span>
          <span className="text-xs" style={{ color: '#1a1a1a', lineHeight: '1.1', fontSize: '0.7rem' }}>♣</span>
        </div>
        <span className="text-2xl font-bold pointer-events-none" style={{ color: '#1a1a1a', lineHeight: '1' }}>♣</span>
        <div className="absolute bottom-1 left-1 flex flex-col items-start leading-tight rotate-180 z-10 pointer-events-none">
          <span className="text-xs font-bold" style={{ color: '#1a1a1a', lineHeight: '1.1' }}>J</span>
          <span className="text-xs" style={{ color: '#1a1a1a', lineHeight: '1.1', fontSize: '0.7rem' }}>♣</span>
        </div>
      </div>

      {/* Poker chips with denominations */}
      {/* $10 chips (yellow/gold) */}
      <div 
        className="absolute bottom-32 right-24 w-12 h-12 rounded-full bg-linear-to-br from-yellow-500 to-yellow-700 shadow-lg border-4 border-white" 
        style={{ 
          animation: isReady ? 'bounce 2.2s ease-in-out infinite' : 'none',
          animationDelay: isReady ? '1s' : '0s',
          willChange: isReady ? 'transform' : 'auto',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        <div className="absolute inset-2 rounded-full border-2 border-white/50" />
        <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-[9px]">$10</div>
      </div>
      <div 
        className="absolute top-56 left-16 w-14 h-14 rounded-full bg-linear-to-br from-yellow-500 to-yellow-700 shadow-lg border-4 border-white" 
        style={{ 
          animation: isReady ? 'bounce 2.6s ease-in-out infinite' : 'none',
          animationDelay: isReady ? '1.2s' : '0s',
          willChange: isReady ? 'transform' : 'auto',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        <div className="absolute inset-2 rounded-full border-2 border-white/50" />
        <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-[10px]">$10</div>
      </div>
      
      {/* $20 chips (green) */}
      <div 
        className="absolute top-16 left-12 w-16 h-16 rounded-full bg-linear-to-br from-green-600 to-green-800 shadow-lg border-4 border-white" 
        style={{ 
          animation: isReady ? 'bounce 2.1s ease-in-out infinite' : 'none',
          animationDelay: isReady ? '0.2s' : '0s',
          willChange: isReady ? 'transform' : 'auto',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        <div className="absolute inset-2 rounded-full border-2 border-white/50" />
        <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs">$20</div>
      </div>
      <div 
        className="absolute bottom-24 right-40 w-14 h-14 rounded-full bg-linear-to-br from-green-600 to-green-800 shadow-lg border-4 border-white" 
        style={{ 
          animation: isReady ? 'bounce 2.7s ease-in-out infinite' : 'none',
          animationDelay: isReady ? '0.8s' : '0s',
          willChange: isReady ? 'transform' : 'auto',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        <div className="absolute inset-2 rounded-full border-2 border-white/50" />
        <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-[10px]">$20</div>
      </div>
      
      {/* $50 chips (purple) */}
      <div 
        className="absolute top-40 right-32 w-16 h-16 rounded-full bg-linear-to-br from-purple-600 to-purple-800 shadow-lg border-4 border-white" 
        style={{ 
          animation: isReady ? 'bounce 2.3s ease-in-out infinite' : 'none',
          animationDelay: isReady ? '0.4s' : '0s',
          willChange: isReady ? 'transform' : 'auto',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        <div className="absolute inset-2 rounded-full border-2 border-white/50" />
        <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs">$50</div>
      </div>
      <div 
        className="absolute bottom-36 left-40 w-14 h-14 rounded-full bg-linear-to-br from-purple-600 to-purple-800 shadow-lg border-4 border-white" 
        style={{ 
          animation: isReady ? 'bounce 2.5s ease-in-out infinite' : 'none',
          animationDelay: isReady ? '1.1s' : '0s',
          willChange: isReady ? 'transform' : 'auto',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        <div className="absolute inset-2 rounded-full border-2 border-white/50" />
        <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-[10px]">$50</div>
      </div>
      
      {/* $100 chips (black/gray) */}
      <div 
        className="absolute top-16 right-48 w-18 h-18 rounded-full bg-linear-to-br from-gray-700 to-gray-900 shadow-lg border-4 border-white" 
        style={{ 
          animation: isReady ? 'bounce 2.4s ease-in-out infinite' : 'none',
          animationDelay: isReady ? '0.6s' : '0s',
          willChange: isReady ? 'transform' : 'auto',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        <div className="absolute inset-2 rounded-full border-2 border-white/50" />
        <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs">$100</div>
      </div>
      <div 
        className="absolute bottom-16 left-56 w-16 h-16 rounded-full bg-linear-to-br from-gray-700 to-gray-900 shadow-lg border-4 border-white" 
        style={{ 
          animation: isReady ? 'bounce 2.8s ease-in-out infinite' : 'none',
          animationDelay: isReady ? '1.3s' : '0s',
          willChange: isReady ? 'transform' : 'auto',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        <div className="absolute inset-2 rounded-full border-2 border-white/50" />
        <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs">$100</div>
      </div>
      
      {/* $250 chips (orange) */}
      <div 
        className="absolute top-28 right-20 w-16 h-16 rounded-full bg-linear-to-br from-orange-600 to-orange-800 shadow-lg border-4 border-white" 
        style={{ 
          animation: isReady ? 'bounce 2.2s ease-in-out infinite' : 'none',
          animationDelay: isReady ? '0.3s' : '0s',
          willChange: isReady ? 'transform' : 'auto',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        <div className="absolute inset-2 rounded-full border-2 border-white/50" />
        <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs">$250</div>
      </div>
      <div 
        className="absolute bottom-28 left-28 w-14 h-14 rounded-full bg-linear-to-br from-orange-600 to-orange-800 shadow-lg border-4 border-white" 
        style={{ 
          animation: isReady ? 'bounce 2.6s ease-in-out infinite' : 'none',
          animationDelay: isReady ? '0.9s' : '0s',
          willChange: isReady ? 'transform' : 'auto',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        <div className="absolute inset-2 rounded-full border-2 border-white/50" />
        <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-[10px]">$250</div>
      </div>
      
      {/* $500 chips (pink/magenta) */}
      <div 
        className="absolute top-36 left-20 w-18 h-18 rounded-full bg-linear-to-br from-pink-600 to-pink-800 shadow-lg border-4 border-white" 
        style={{ 
          animation: isReady ? 'bounce 2.5s ease-in-out infinite' : 'none',
          animationDelay: isReady ? '0.5s' : '0s',
          willChange: isReady ? 'transform' : 'auto',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        <div className="absolute inset-2 rounded-full border-2 border-white/50" />
        <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs">$500</div>
      </div>
      <div 
        className="absolute bottom-20 right-56 w-16 h-16 rounded-full bg-linear-to-br from-pink-600 to-pink-800 shadow-lg border-4 border-white" 
        style={{ 
          animation: isReady ? 'bounce 2.7s ease-in-out infinite' : 'none',
          animationDelay: isReady ? '1.2s' : '0s',
          willChange: isReady ? 'transform' : 'auto',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        <div className="absolute inset-2 rounded-full border-2 border-white/50" />
        <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs">$500</div>
      </div>

      {/* Glow effect */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-green-950/30" />
    </div>
  );
}

