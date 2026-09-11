import React, { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/components/LanguageProvider";

export default function MemoryMatrix({ level, onComplete }) {
  const { t } = useLanguage();
  const gridSize = level?.config?.gridSize || 3;
  const numLit = level?.config?.numLit || 3;
  const numRounds = level?.config?.numQuestions || 3;
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [phase, setPhase] = useState("memorize");
  const [lit, setLit] = useState([]);
  const [tapped, setTapped] = useState([]);
  const [locked, setLocked] = useState(true);

  const startRound = useCallback(() => {
    const total = gridSize * gridSize;
    const indices = Array.from({ length: total }, (_, i) => i);
    const chosen = [];
    while (chosen.length < numLit) {
      chosen.push(indices.splice(Math.floor(Math.random() * indices.length), 1)[0]);
    }
    setLit(chosen);
    setTapped([]);
    setPhase("memorize");
    setLocked(true);
    const memTime = 500 + numLit * 350;
    setTimeout(() => {
      setPhase("recall");
      setLocked(false);
    }, memTime);
  }, [gridSize, numLit]);

  useEffect(() => {
    startRound();
  }, [startRound]);

  function tap(i) {
    if (locked || phase !== "recall" || tapped.includes(i)) return;
    const next = [...tapped, i];
    setTapped(next);
    if (next.length >= numLit) {
      setLocked(true);
      const ok = next.every((x) => lit.includes(x)) && lit.every((x) => next.includes(x));
      const newCorrect = correct + (ok ? 1 : 0);
      if (ok) setCorrect(newCorrect);
      setPhase("result");
      setTimeout(() => {
        if (round + 1 >= numRounds) {
          onComplete({ accuracy: Math.round((newCorrect / numRounds) * 100), completed_at: new Date().toISOString() });
        } else {
          setRound(round + 1);
          startRound();
        }
      }, 950);
    }
  }

  const total = gridSize * gridSize;
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="text-base text-muted-foreground">
        {t("game_question")} {round + 1} {t("game_of")} {numRounds}
      </div>
      <div className="text-lg font-semibold">{phase === "memorize" ? t("game_memorize") : t("game_recall")}</div>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)`, width: gridSize * 78 + (gridSize - 1) * 8 }}
      >
        {Array.from({ length: total }, (_, i) => {
          let cls = "glass-strong";
          if (phase === "memorize" && lit.includes(i)) cls = "bg-primary glow-blue-strong";
          else if (phase === "recall" && tapped.includes(i)) cls = "bg-primary glow-blue";
          else if (phase === "result") {
            if (lit.includes(i)) cls = "bg-emerald-500";
            else if (tapped.includes(i)) cls = "bg-destructive";
          }
          return (
            <button
              key={i}
              onClick={() => tap(i)}
              disabled={locked || phase !== "recall"}
              className={`aspect-square rounded-xl min-h-[64px] transition-all ${cls}`}
            />
          );
        })}
      </div>
    </div>
  );
}