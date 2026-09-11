import React, { useState, useEffect, useRef } from "react";

const TILES = [
  { bg: "bg-[#2979FF]", glow: "shadow-[0_0_30px_#2979FF]" },
  { bg: "bg-[#00B0FF]", glow: "shadow-[0_0_30px_#00B0FF]" },
  { bg: "bg-[#26C6DA]", glow: "shadow-[0_0_30px_#26C6DA]" },
  { bg: "bg-[#7E57C2]", glow: "shadow-[0_0_30px_#7E57C2]" },
  { bg: "bg-[#FF7043]", glow: "shadow-[0_0_30px_#FF7043]" },
  { bg: "bg-[#66BB6A]", glow: "shadow-[0_0_30px_#66BB6A]" },
];

export default function SequenceRecall({ level, onComplete }) {
  const config = level?.config || {};
  const length = config.sequenceLength || 4;
  const numTiles = Math.min(config.numTiles || 4, TILES.length);
  const [sequence, setSequence] = useState([]);
  const [activeTile, setActiveTile] = useState(null);
  const [phase, setPhase] = useState("playing");
  const [inputIdx, setInputIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const seq = Array.from({ length }, () => Math.floor(Math.random() * numTiles));
    setSequence(seq);
    setPhase("playing");
    setInputIdx(0);
    setCorrect(0);
    startTime.current = Date.now();
  }, [length, numTiles]);

  useEffect(() => {
    if (phase !== "playing" || sequence.length === 0) return;
    let i = 0;
    let timers = [];
    const step = () => {
      if (i >= sequence.length) {
        setActiveTile(null);
        setPhase("input");
        return;
      }
      setActiveTile(sequence[i]);
      timers.push(setTimeout(() => {
        setActiveTile(null);
        i++;
        timers.push(setTimeout(step, 250));
      }, 600));
    };
    timers.push(setTimeout(step, 700));
    return () => timers.forEach(clearTimeout);
  }, [phase, sequence]);

  function handleClick(tileIdx) {
    if (phase !== "input") return;
    setActiveTile(tileIdx);
    setTimeout(() => setActiveTile(null), 200);
    if (sequence[inputIdx] === tileIdx) {
      const newCorrect = correct + 1;
      setCorrect(newCorrect);
      if (inputIdx + 1 >= sequence.length) {
        setTimeout(
          () => onComplete({ accuracy: 100, completed_at: new Date().toISOString(), durationMs: Date.now() - startTime.current }),
          400
        );
      } else {
        setInputIdx((i) => i + 1);
      }
    } else {
      const acc = Math.round((correct / sequence.length) * 100);
      setTimeout(
        () => onComplete({ accuracy: acc, completed_at: new Date().toISOString(), durationMs: Date.now() - startTime.current }),
        400
      );
    }
  }

  return (
    <div>
      <p className="text-center text-lg text-muted-foreground mb-4">
        {phase === "playing" ? "Watch the sequence..." : "Now repeat it!"}
      </p>
      <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
        {TILES.slice(0, numTiles).map((tile, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            disabled={phase !== "input"}
            className={`aspect-square rounded-3xl min-h-[96px] transition-all duration-150 ${tile.bg} ${
              activeTile === i ? `${tile.glow} scale-105 brightness-150` : "opacity-60"
            } ${phase === "input" ? "hover:opacity-100" : ""}`}
          />
        ))}
      </div>
      <p className="text-center text-lg text-muted-foreground mt-4">
        Step {Math.min(inputIdx + 1, sequence.length)}/{sequence.length}
      </p>
    </div>
  );
}