import React, { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { LANGUAGE_LIST } from "@/lib/i18n";

export default function LanguageSelector({ compact = false }) {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = LANGUAGE_LIST.find((l) => l.code === language) || LANGUAGE_LIST[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 glass rounded-full px-4 py-2.5 text-base font-semibold text-foreground hover:glow-blue transition-all min-h-[44px]"
        aria-label="Select language"
      >
        <Globe className="w-5 h-5 text-primary" />
        {!compact && <span>{current.name}</span>}
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute left-0 mt-2 w-56 glass-strong rounded-2xl p-2 z-50 max-h-80 overflow-y-auto animate-float-up">
          {LANGUAGE_LIST.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLanguage(l.code);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-left text-base transition-colors ${
                l.code === language ? "bg-primary/20 text-foreground" : "hover:bg-white/5 text-foreground/90"
              }`}
            >
              <span className="font-medium">{l.name}</span>
              {l.code === language && <Check className="w-5 h-5 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}