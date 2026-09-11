import React from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/components/LanguageProvider";
import { LANGUAGE_LIST } from "@/lib/i18n";
import { ArrowLeft, Check, Globe } from "lucide-react";

export default function Settings() {
  const { t, language, setLanguage, translating } = useLanguage();
  const navigate = useNavigate();
  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 text-muted-foreground mb-4 text-lg"
      >
        <ArrowLeft className="w-6 h-6" /> {t("common_back")}
      </button>
      <h1 className="text-3xl font-bold text-primary text-glow mb-1">{t("settings_title")}</h1>
      <div className="glass-strong rounded-3xl p-5 mt-4">
        <div className="flex items-center gap-3 mb-2">
          <Globe className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">{t("settings_language")}</h2>
        </div>
        <p className="text-base text-muted-foreground mb-4">{t("settings_language_desc")}</p>
        {translating && (
          <p className="text-primary text-base mb-3 animate-pulse">{t("settings_translating")}</p>
        )}
        <div className="flex flex-col gap-2">
          {LANGUAGE_LIST.map((l) => (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              className={`flex items-center justify-between px-4 py-4 rounded-xl text-left text-lg min-h-[56px] ${
                l.code === language ? "bg-primary/20 text-foreground glow-blue" : "glass"
              }`}
            >
              <span className="font-semibold">{l.name}</span>
              {l.code === language && <Check className="w-6 h-6 text-primary" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}