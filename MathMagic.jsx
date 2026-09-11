import React, { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

const randInt = (n) => Math.floor(Math.random() * n);

function genQuestion(level) {
  const diff = level?.difficulty || "easy";
  const max = diff === "easy" ? 10 : diff === "medium" ? 25 : 50;
  const ops = diff === "easy" ? ["+"] : ["+", "-"];
  const op = ops[randInt(ops.length)];
  let a = 1 + randInt(max);
  let b = 1 + randInt(max);
  if (op === "-" && b > a) [a, b] = [b, a];
  const answer = op === "+" ? a + b : a - b;
  const distractors = new Set([answer]);
  while (distractors.size < 4) {
    const d = answer + (randInt(7) - 3);
    if (d >= 0 && d !== answer) distractors.add(d);
  }
  const options = Array.from(distractors).sort(() => Math.random() - 0.5);
  return { display: `${a} ${op} ${b}`, answer, options };
}

export default function MathMagic({ level, onComplete }) {
  const { t } = useLanguage();
  const numQuestions = level?.config?.numQuestions || 4;
  const [qi, setQi] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [q, setQ] = useState(() => genQuestion(level));
  const [picked, setPicked] = useState(null);
  const [locked, setLocked] = useState(false);

  function pick(v) {
    if (locked) return;
    setPicked(v);
    setLocked(true);
    const ok = v === q.answer;
    const newCorrect = correct + (ok ? 1 : 0);
    if (ok) setCorrect(newCorrect);
    setTimeout(() => {
      if (qi + 1 >= numQuestions) {
        onComplete({ accuracy: Math.round((newCorrect / numQuestions) * 100), completed_at: new Date().toISOString() });
      } else {
        setQi(qi + 1);
        setQ(genQuestion(level));
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
      <div className="glass-strong rounded-3xl px-8 py-6 text-5xl font-bold text-primary text-glow">{q.display} = ?</div>
      <div className="grid grid-cols-2 gap-3 w-full">
        {q.options.map((o, i) => {
          const isAns = o === q.answer;
          const isPicked = o === picked;
          const cls = !locked
            ? "glass-strong"
            : isAns
            ? "bg-emerald-500/30 border-emerald-400"
            : isPicked
            ? "bg-destructive/30 border-destructive"
            : "glass-strong opacity-50";
          return (
            <button key={i} onClick={() => pick(o)} disabled={locked} className={`rounded-2xl py-5 text-3xl font-bold min-h-[64px] border ${cls}`}>
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}