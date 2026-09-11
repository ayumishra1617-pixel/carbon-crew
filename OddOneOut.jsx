import React, { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Shape } from "@/components/games/PatternLogic";

const COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7"];
const SHAPES = ["circle", "square", "triangle"];
const rand = (a) => a[Math.floor(Math.random() * a.length)];

function genRound() {
  const baseColor = rand(COLORS);
  const baseShape = rand(SHAPES);
  const oddColor = rand(COLORS.filter((c) => c !== baseColor));
  const oddShape = rand(SHAPES.filter((s) => s !== baseShape));
  const varyColor = Math.random() > 0.5;
  const odd = varyColor ? { color: oddColor, shape: baseShape } : { color: baseColor, shape: oddShape };
  const items = [];
  for (let i = 0; i < 3; i++) items.push({ color: baseColor, shape: baseShape });
  const oddIndex = Math.floor(Math.random() * 4);
  items.splice(oddIndex, 0, odd);
  return { items, oddIndex };
}

export default function OddOneOut({ level, onComplete }) {
  const { t } = useLanguage();
  const numQuestions = level?.config?.numQuestions || 4;
  const [qi, setQi] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [q, setQ] = useState(() => genRound());
  const [picked, setPicked] = useState(null);
  const [locked, setLocked] = useState(false);

  function pick(idx) {
    if (locked) return;
    const ok = idx === q.oddIndex;
    setPicked({ idx, ok });
    setLocked(true);
    const newCorrect = correct + (ok ? 1 : 0);
    if (ok) setCorrect(newCorrect);
    setTimeout(() => {
      if (qi + 1 >= numQuestions) {
        onComplete({ accuracy: Math.round((newCorrect / numQuestions) * 100), completed_at: new Date().toISOString() });
      } else {
        setQi(qi + 1);
        setQ(genRound());
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
      <div className="text-lg font-semibold">{t("game_pick_odd")}</div>
      <div className="grid grid-cols-2 gap-4 w-full">
        {q.items.map((it, i) => {
          const isOdd = i === q.oddIndex;
          const isPicked = picked && picked.idx === i;
          const cls = !locked
            ? "glass-strong"
            : isOdd
            ? "bg-emerald-500/30 border-emerald-400"
            : isPicked
            ? "bg-destructive/30 border-destructive"
            : "glass-strong opacity-50";
          return (
            <button key={i} onClick={() => pick(i)} disabled={locked} className={`rounded-2xl py-6 min-h-[88px] border flex items-center justify-center ${cls}`}>
              <Shape color={it.color} shape={it.shape} size={56} />
            </button>
          );
        })}
      </div>
    </div>
  );
}