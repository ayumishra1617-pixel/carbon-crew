import React, { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

const COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#eab308"];
const SHAPES = ["circle", "square", "triangle"];
const rand = (a) => a[Math.floor(Math.random() * a.length)];

export function Shape({ color, shape, size = 56 }) {
  const style = { width: size, height: size };
  if (shape === "circle") return <div style={{ ...style, background: color }} className="rounded-full" />;
  if (shape === "square") return <div style={{ ...style, background: color }} className="rounded-lg" />;
  return (
    <div
      style={{
        width: 0,
        height: 0,
        borderLeft: `${size / 2}px solid transparent`,
        borderRight: `${size / 2}px solid transparent`,
        borderBottom: `${size}px solid ${color}`,
      }}
    />
  );
}

function genPattern(level) {
  const diff = level?.difficulty || "easy";
  const L = diff === "hard" ? 3 : 2;
  const cycle = [];
  const used = new Set();
  while (cycle.length < L) {
    const item = { color: rand(COLORS), shape: rand(SHAPES) };
    const k = item.color + item.shape;
    if (!used.has(k)) {
      used.add(k);
      cycle.push(item);
    }
  }
  const seq = [];
  for (let i = 0; i < 4; i++) seq.push(cycle[i % L]);
  const answer = seq[3];
  seq[3] = null;
  const opts = new Set([JSON.stringify(answer)]);
  while (opts.size < 4) {
    opts.add(JSON.stringify({ color: rand(COLORS), shape: rand(SHAPES) }));
  }
  const options = Array.from(opts).map((s) => JSON.parse(s)).sort(() => Math.random() - 0.5);
  return { seq, answer, options };
}

export default function PatternLogic({ level, onComplete }) {
  const { t } = useLanguage();
  const numQuestions = level?.config?.numQuestions || 4;
  const [qi, setQi] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [q, setQ] = useState(() => genPattern(level));
  const [picked, setPicked] = useState(null);
  const [locked, setLocked] = useState(false);

  function pick(item) {
    if (locked) return;
    const ok = item.color === q.answer.color && item.shape === q.answer.shape;
    setPicked({ item, ok });
    setLocked(true);
    const newCorrect = correct + (ok ? 1 : 0);
    if (ok) setCorrect(newCorrect);
    setTimeout(() => {
      if (qi + 1 >= numQuestions) {
        onComplete({ accuracy: Math.round((newCorrect / numQuestions) * 100), completed_at: new Date().toISOString() });
      } else {
        setQi(qi + 1);
        setQ(genPattern(level));
        setPicked(null);
        setLocked(false);
      }
    }, 850);
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-base text-muted-foreground">
        {t("game_question")} {qi + 1} {t("game_of")} {numQuestions}
      </div>
      <div className="text-lg font-semibold">{t("game_what_next")}</div>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {q.seq.map((it, i) => (
          <div key={i} className="w-20 h-20 rounded-2xl glass-strong flex items-center justify-center">
            {it ? <Shape color={it.color} shape={it.shape} size={48} /> : <span className="text-3xl font-bold text-primary">?</span>}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 w-full">
        {q.options.map((o, i) => {
          const isAns = o.color === q.answer.color && o.shape === q.answer.shape;
          const isPicked = picked && picked.item.color === o.color && picked.item.shape === o.shape;
          const cls = !locked
            ? "glass-strong"
            : isAns
            ? "bg-emerald-500/30 border-emerald-400"
            : isPicked
            ? "bg-destructive/30 border-destructive"
            : "glass-strong opacity-50";
          return (
            <button key={i} onClick={() => pick(o)} disabled={locked} className={`rounded-2xl py-5 min-h-[80px] border flex items-center justify-center ${cls}`}>
              <Shape color={o.color} shape={o.shape} size={48} />
            </button>
          );
        })}
      </div>
    </div>
  );
}