import React, { useState, useEffect, useRef } from "react";

const PAIRS = [
  ["Sun", "Moon"], ["Cat", "Kitten"], ["Hot", "Cold"], ["Day", "Night"],
  ["Happy", "Joy"], ["Big", "Large"], ["Fast", "Quick"], ["Doctor", "Hospital"],
  ["Morning", "Breakfast"], ["Book", "Read"], ["Rain", "Umbrella"], ["Music", "Song"],
  ["Hand", "Glove"], ["Foot", "Shoe"], ["Sleep", "Bed"], ["Thirsty", "Water"],
  ["Medicine", "Health"], ["Walk", "Exercise"], ["Friend", "Smile"], ["Memory", "Mind"],
];
const DISTRACTORS = ["Car", "Tree", "Cloud", "Stone", "River", "Chair", "Phone", "Window", "Bird", "Dress", "Lamp", "Key", "Box", "Paint", "Clock", "Road"];

export default function WordAssociation({ level, onComplete }) {
  const config = level?.config || {};
  const numQuestions = config.numQuestions || 5;
  const numOptions = config.numOptions || 4;
  const [qIdx, setQIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [options, setOptions] = useState([]);
  const [picked, setPicked] = useState(null);
  const startTime = useRef(Date.now());
  const questions = useRef([]);

  useEffect(() => {
    const shuffled = [...PAIRS].sort(() => Math.random() - 0.5).slice(0, numQuestions);
    questions.current = shuffled;
    setQIdx(0);
    setCorrect(0);
    setPicked(null);
    startTime.current = Date.now();
  }, [numQuestions]);

  useEffect(() => {
    if (qIdx >= questions.current.length) return;
    const [, answer] = questions.current[qIdx];
    const distractors = [...DISTRACTORS].sort(() => Math.random() - 0.5).slice(0, numOptions - 1);
    const opts = [...distractors, answer].sort(() => Math.random() - 0.5);
    setOptions(opts);
    setPicked(null);
  }, [qIdx]);

  function pick(opt) {
    if (picked) return;
    setPicked(opt);
    const [, answer] = questions.current[qIdx];
    const isCorrect = opt === answer;
    const newCorrect = correct + (isCorrect ? 1 : 0);
    setCorrect(newCorrect);
    setTimeout(() => {
      if (qIdx + 1 >= questions.current.length) {
        const acc = Math.round((newCorrect / questions.current.length) * 100);
        onComplete({ accuracy: acc, completed_at: new Date().toISOString(), durationMs: Date.now() - startTime.current });
      } else {
        setQIdx((i) => i + 1);
      }
    }, 700);
  }

  if (qIdx >= questions.current.length) return null;
  const [cue] = questions.current[qIdx];

  return (
    <div>
      <p className="text-center text-lg text-muted-foreground mb-2">
        Question {qIdx + 1}/{questions.current.length}
      </p>
      <div className="glass-strong rounded-3xl p-8 mb-6 text-center">
        <p className="text-base text-muted-foreground mb-2">Which word is related to</p>
        <p className="text-4xl font-bold text-primary text-glow">{cue}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => {
          const [, answer] = questions.current[qIdx];
          const isAns = opt === answer;
          const isPicked = picked === opt;
          let cls = "glass hover:bg-white/10";
          if (picked) {
            if (isAns) cls = "bg-primary/30 glow-blue";
            else if (isPicked) cls = "bg-destructive/30";
          }
          return (
            <button
              key={opt}
              onClick={() => pick(opt)}
              disabled={!!picked}
              className={`rounded-2xl p-5 text-2xl font-semibold min-h-[72px] transition-all ${cls}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}