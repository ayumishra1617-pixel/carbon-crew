import React, { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Shape } from "@/components/games/PatternLogic";

const COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7"];
const SHAPES = ["circle", "square", "triangle"];
const rand = (a) => a[Math.floor(Math.random() * a.length)];

function genPair() {
  const same = Math.random() > 0.5;
  const a = { color: rand(COLORS), shape: rand(SHAPES) };
  let b;
  if (same) {
    b = { ...a };
  } else {
    b = { color: rand(COLORS), shape: rand(SHAPES) };
    if (b.color === a.color && b.shape === a.shape) {
      b.shape = SHAPES.find((s) => s !== a.shape);
    }
  }
  return { a, b, same };
}

export default function SpeedMatch({ level, onComplete }) {
  const { t } = useLanguage();
  const numQuestions = level?.config?.numQuestions || 6;
  const [qi, setQi] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [q, setQ] = useState(() => genPair());
  const [picked, setPicked] = useState(null);
  const [locked, setLocked] = useState(false);

  function pick(val) {
    if (locked) return;
    const ok = val === q.same;
    setPicked({ val, ok });
    setLocked(true);
    const newCorrect = correct + (ok ? 1 : 0);
    if (ok) setCorrect(newCorrect);
    setTimeout(() => {
      if (qi + 1 >= numQuestions) {
        onComplete({ accuracy: Math.round((newCorrect / numQuestions) * 100), completed_at: new Date().toISOString() });
      } else {
        setQi(qi + 1);
        setQ(genPair());
        setPicked(null);
        setLocked(false);
      }
    }, 600);
  }

  const btnCls = (val) =>
    !picked
      ? "glass-strong"
      : picked.val === val
      ? picked.ok
        ? "bg-emerald-500/30 border-emerald-400"
        : "bg-destructive/30 border-destructive"
      : "glass-strong opacity-50";

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-base text-muted-foreground">
        {t("game_question")} {qi + 1} {t("game_of")} {numQuestions}
      </div>
      <div className="flex items-center justify-center gap-5">
        <div className="w-24 h-24 rounded-2xl glass-strong flex items-center justify-center">
          <Shape color={q.a.color} shape={q.a.shape} size={64} />
        </div>
        <div className="text-2xl font-bold text-primary text-glow">vs</div>
        <div className="w-24 h-24 rounded-2xl glass-strong flex items-center justify-center">
          <Shape color={q.b.color} shape={q.b.shape} size={64} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 w-full">
        <button onClick={() => pick(true)} disabled={locked} className={`rounded-2xl py-6 text-2xl font-bold min-h-[72px] border ${btnCls(true)}`}>
          {t("game_same")}
        </button>
        <button onClick={() => pick(false)} disabled={locked} className={`rounded-2xl py-6 text-2xl font-bold min-h-[72px] border ${btnCls(false)}`}>
          {t("game_different")}
        </button>
      </div>
    </div>
  );
}