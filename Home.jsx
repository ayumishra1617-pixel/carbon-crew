import React, { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, ListChecks, LineChart, ChevronUp } from "lucide-react";
import Brain3D from "@/components/Brain3D";
import { useLanguage } from "@/components/LanguageProvider";

export default function Home() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const brainRef = useRef(null);
  const [revealed, setRevealed] = useState(false);
  const [hint, setHint] = useState(true);
  const touchStartY = useRef(null);

  const handleDispersed = useCallback(() => setRevealed(true), []);

  function trigger() {
    if (revealed) return;
    setHint(false);
    brainRef.current?.disperse();
  }

  function onTouchStart(e) {
    touchStartY.current = e.touches[0].clientY;
  }
  function onTouchEnd(e) {
    if (touchStartY.current == null) return;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (dy < -50) trigger();
    touchStartY.current = null;
  }
  function onWheel(e) {
    if (e.deltaY < -30) trigger();
  }

  const tabs = [
    { path: "/games", icon: Gamepad2, label: t("home_tab_games"), desc: t("home_tab_games_desc") },
    { path: "/checklist", icon: ListChecks, label: t("home_tab_checklist"), desc: t("home_tab_checklist_desc") },
    { path: "/caretaker", icon: LineChart, label: t("home_tab_caretaker"), desc: t("home_tab_caretaker_desc") },
  ];

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onWheel={onWheel}
    >
      <div className="absolute inset-0">
        <Brain3D ref={brainRef} onDispersed={handleDispersed} />
      </div>

      <AnimatePresence>
        {!revealed && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-end pb-24 pointer-events-none"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {hint && (
              <motion.div
                className="flex flex-col items-center gap-2 text-primary"
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 1.8 }}
              >
                <ChevronUp className="w-10 h-10" />
                <span className="text-xl font-semibold text-glow">{t("home_swipe_up")}</span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {revealed && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center px-6 gap-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-4xl font-bold text-primary text-glow mb-2"
            >
              {t("app_name")}
            </motion.h1>
            {tabs.map((tab, i) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 * i }}
                  className="w-full max-w-md glass-strong rounded-3xl p-6 flex items-center gap-5 min-h-[96px] glow-blue hover:scale-[1.02] transition-transform"
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="text-2xl font-bold">{tab.label}</div>
                    <div className="text-base text-muted-foreground">{tab.desc}</div>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}