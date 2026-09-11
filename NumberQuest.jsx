import React, { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

const randInt = (n) => Math.floor(Math.random() * n);

function genQuestion(level) {
  const diff = level?.difficulty || "easy";
  const maxStep = diff === "easy" ? 3 : diff === "medium" ? 6 : 9;
  const start = 1 + randInt(5);
  const step = 1 + randInt(maxStep);
  const seq = [start, start + step, start + 2 * step, start + 3 * step];
  const answer = start + 4 * step;
  const distractors = new Set();
  while (distractors.size < 3) {
    const k = randInt(5) - 2;
    if (k === 0) continue;
    const v = answer + k * step;
    if (v > 0 && v !== answer) distractors.add(v);
  }
  const options = [answer, ...distractors].sort(() => Math.random() - 0.5);
  return { seq, answer, options };
}

export default function NumberQuest({ level, onComplete }) {
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
      <div className="text-lg font-semibold text-center">{t("game_what_next")}</div>
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {q.seq.map((n, i) => (
          <div key={i} className="w-16 h-16 rounded-2xl glass-strong flex items-center justify-center text-3xl font-bold text-primary glow-blue">
            {n}
          </div>
        ))}
        <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-primary flex items-center justify-center text-3xl font-bold text-primary">
          ?
        </div>
      </div>
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
            <button key={i} onClick={() => pick(o)} disabled={locked} className={`rounded-2xl py-5 text-2xl font-bold min-h-[64px] border ${cls}`}>
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}