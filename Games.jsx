import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/components/LanguageProvider";
import { GAME_KEYS } from "@/lib/i18n";
import NeuralOrb3D from "@/components/3d/NeuralOrb3D";
import { Gamepad2, ChevronRight } from "lucide-react";

export default function Games() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        const list = await base44.entities.Game.list();
        setGames(list);
        const prog = await base44.entities.UserGameProgress.filter({ user_id: user.id });
        const map = {};
        prog.forEach((p) => {
          map[p.game_id] = p;
        });
        setProgress(map);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-primary text-glow">{t("games_title")}</h1>
      <p className="text-lg text-muted-foreground mt-1 mb-4">{t("games_subtitle")}</p>
      <NeuralOrb3D className="w-full h-40 mb-6" />
      {loading && <p className="text-lg text-muted-foreground">{t("common_loading")}</p>}
      <div className="flex flex-col gap-4">
        {games.map((g) => {
          const p = progress[g.id];
          return (
            <button
              key={g.id}
              onClick={() => navigate(`/games/${g.id}`)}
              className="glass-strong rounded-3xl p-5 flex items-center gap-4 text-left min-h-[88px] hover:glow-blue transition-all w-full"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                <Gamepad2 className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-2xl font-bold">{GAME_KEYS[g.name] ? t(GAME_KEYS[g.name]) : g.name}</div>
                <div className="text-base text-muted-foreground">{GAME_KEYS[g.name] ? t(GAME_KEYS[g.name] + "_desc") : g.description}</div>
                <div className="text-base mt-1 text-primary font-semibold">
                  {t("games_level")} {p?.current_level || 1}
                  {p?.accuracy != null ? ` · ${p.accuracy}%` : ""}
                </div>
              </div>
              <ChevronRight className="w-7 h-7 text-muted-foreground shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}