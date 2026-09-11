import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/components/LanguageProvider";
import CardMatch from "@/components/games/CardMatch";
import SequenceRecall from "@/components/games/SequenceRecall";
import WordAssociation from "@/components/games/WordAssociation";
import NumberQuest from "@/components/games/NumberQuest";
import PatternLogic from "@/components/games/PatternLogic";
import OddOneOut from "@/components/games/OddOneOut";
import { GAME_KEYS } from "@/lib/i18n";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

const COMPONENTS = {
  "Card Match": CardMatch,
  "Sequence Recall": SequenceRecall,
  "Word Link": WordAssociation,
  "Number Quest": NumberQuest,
  "Pattern Logic": PatternLogic,
  "Odd One Out": OddOneOut,
};

export default function GamePlay() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [game, setGame] = useState(null);
  const [level, setLevel] = useState(null);
  const [progress, setProgress] = useState(null);
  const [done, setDone] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        const g = await base44.entities.Game.get(gameId);
        setGame(g);
        const progList = await base44.entities.UserGameProgress.filter({ user_id: user.id, game_id: gameId });
        const p = progList[0];
        setProgress(p);
        const currentLevel = p?.current_level || 1;
        const levels = await base44.entities.GameLevel.filter({ game_id: gameId }, "level_number", 50);
        const lvl = levels.find((l) => l.level_number === currentLevel) || levels[0];
        setLevel(lvl);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [gameId]);

  async function handleComplete(result) {
    try {
      const user = await base44.auth.me();
      const now = result.completed_at || new Date().toISOString();
      const nextLevel = (level?.level_number || 1) + 1;
      if (progress) {
        await base44.entities.UserGameProgress.update(progress.id, {
          current_level: nextLevel,
          accuracy: result.accuracy,
          completed_at: now,
        });
      } else {
        await base44.entities.UserGameProgress.create({
          user_id: user.id,
          game_id: gameId,
          current_level: nextLevel,
          accuracy: result.accuracy,
          completed_at: now,
        });
      }
    } catch (e) {
      console.error(e);
    }
    setDone(result);
  }

  if (loading)
    return (
      <div className="max-w-md mx-auto px-4 py-10">
        <p className="text-lg text-muted-foreground">{t("games_loading")}</p>
      </div>
    );
  if (!game || !level)
    return (
      <div className="max-w-md mx-auto px-4 py-10">
        <p className="text-lg text-muted-foreground">Game not found.</p>
      </div>
    );

  const GameComp = COMPONENTS[game.name];

  if (done) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 flex flex-col items-center gap-6 text-center">
        <CheckCircle2 className="w-20 h-20 text-primary glow-blue" />
        <h2 className="text-3xl font-bold text-primary">{t("games_level_complete")}</h2>
        <p className="text-xl">
          {t("games_accuracy")}: {done.accuracy}%
        </p>
        <button
          onClick={() => navigate("/games")}
          className="glass-strong rounded-2xl px-8 py-4 text-lg font-semibold min-h-[56px] glow-blue"
        >
          {t("games_back_to_games")}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <button
        onClick={() => navigate("/games")}
        className="flex items-center gap-2 text-muted-foreground mb-4 text-lg"
      >
        <ArrowLeft className="w-6 h-6" /> {t("common_back")}
      </button>
      <h1 className="text-2xl font-bold mb-1">{GAME_KEYS[game.name] ? t(GAME_KEYS[game.name]) : game.name}</h1>
      <p className="text-base text-muted-foreground mb-4">
        {t("games_level")} {level.level_number} · {level.difficulty}
      </p>
      {GameComp ? (
        <GameComp level={level} onComplete={handleComplete} />
      ) : (
        <p className="text-lg text-muted-foreground">Unknown game.</p>
      )}
    </div>
  );
}