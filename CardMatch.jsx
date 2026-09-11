import React, { useState, useEffect, useRef } from "react";

const SYMBOLS = ["🐱", "🌸", "⭐", "🎵", "🍃", "☀️", "🌙", "❤️", "🐬", "🍎", "🦋", "🍀", "🎨", "⚡", "🐶", "🌺", "🐧", "🌻"];

export default function CardMatch({ level, onComplete }) {
  const config = level?.config || {};
  const gridSize = config.gridSize || 4;
  const pairs = Math.floor((gridSize * gridSize) / 2);
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [attempts, setAttempts] = useState(0);
  const [lock, setLock] = useState(false);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const chosen = SYMBOLS.slice(0, pairs);
    const deck = [...chosen, ...chosen].map((s, i) => ({ id: i, symbol: s }));
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    setCards(deck);
    setFlipped([]);
    setMatched([]);
    setAttempts(0);
    setLock(false);
    startTime.current = Date.now();
  }, [pairs]);

  function handleFlip(idx) {
    if (lock || flipped.includes(idx) || matched.includes(cards[idx].symbol)) return;
    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);
    if (newFlipped.length === 2) {
      setLock(true);
      setAttempts((a) => a + 1);
      const [a, b] = newFlipped;
      if (cards[a].symbol === cards[b].symbol) {
        setTimeout(() => {
          setMatched((m) => [...m, cards[a].symbol]);
          setFlipped([]);
          setLock(false);
        }, 400);
      } else {
        setTimeout(() => {
          setFlipped([]);
          setLock(false);
        }, 900);
      }
    }
  }

  useEffect(() => {
    if (pairs > 0 && matched.length === pairs) {
      const accuracy = attempts > 0 ? Math.round((pairs / attempts) * 100) : 100;
      const t = setTimeout(
        () => onComplete({ accuracy, completed_at: new Date().toISOString(), durationMs: Date.now() - startTime.current }),
        500
      );
      return () => clearTimeout(t);
    }
  }, [matched, pairs, attempts]);

  return (
    <div>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
      >
        {cards.map((card, idx) => {
          const isUp = flipped.includes(idx) || matched.includes(card.symbol);
          return (
            <button
              key={card.id}
              onClick={() => handleFlip(idx)}
              className={`aspect-square rounded-2xl flex items-center justify-center text-4xl min-h-[64px] transition-all duration-300 ${
                isUp ? "bg-primary/30 glow-blue scale-105" : "glass hover:bg-white/10"
              }`}
            >
              {isUp ? card.symbol : ""}
            </button>
          );
        })}
      </div>
      <p className="text-center text-lg text-muted-foreground mt-4">
        {matched.length}/{pairs} pairs · {attempts} tries
      </p>
    </div>
  );
}