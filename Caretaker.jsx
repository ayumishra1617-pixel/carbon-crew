import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/components/LanguageProvider";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";
import DataNetwork3D from "@/components/3d/DataNetwork3D";

export default function Caretaker() {
  const { t } = useLanguage();
  const [progress, setProgress] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        const [prog, taskList, gameList] = await Promise.all([
          base44.entities.UserGameProgress.filter({ user_id: user.id }, "-completed_at", 100),
          base44.entities.Task.filter({ user_id: user.id }, "scheduled_time", 100),
          base44.entities.Game.list(),
        ]);
        setProgress(prog);
        setTasks(taskList);
        setGames(gameList);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const accuracyData = useMemo(() => {
    const byDate = {};
    progress.forEach((p) => {
      if (!p.completed_at) return;
      const d = p.completed_at.slice(0, 10);
      byDate[d] = byDate[d] || [];
      byDate[d].push(p.accuracy || 0);
    });
    return Object.keys(byDate)
      .sort()
      .map((d) => ({ date: d.slice(5), accuracy: Math.round(byDate[d].reduce((a, b) => a + b, 0) / byDate[d].length) }));
  }, [progress]);

  const completionData = useMemo(() => {
    const days = [];
    const total = tasks.length || 1;
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      const dayTasks = tasks.filter((tk) => tk.completed && tk.completed_at && tk.completed_at.slice(0, 10) === ds);
      days.push({ date: ds.slice(5), rate: Math.round((dayTasks.length / total) * 100) });
    }
    return days;
  }, [tasks]);

  const status = useMemo(() => {
    if (accuracyData.length < 2) return "stable";
    const recent = accuracyData.slice(-3).map((d) => d.accuracy);
    const older = accuracyData.slice(0, -3).map((d) => d.accuracy);
    const rAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const oAvg = older.length ? older.reduce((a, b) => a + b, 0) / older.length : rAvg;
    const diff = rAvg - oAvg;
    if (diff > 5) return "improving";
    if (diff < -5) return "declining";
    return "stable";
  }, [accuracyData]);

  const recommendations = useMemo(() => {
    const byCat = {};
    progress.forEach((p) => {
      const g = games.find((x) => x.id === p.game_id);
      if (!g) return;
      byCat[g.category] = byCat[g.category] || [];
      byCat[g.category].push(p.accuracy || 0);
    });
    const cats = Object.entries(byCat).map(([cat, arr]) => ({ cat, avg: arr.reduce((a, b) => a + b, 0) / arr.length }));
    cats.sort((a, b) => a.avg - b.avg);
    return cats.slice(0, 2);
  }, [progress, games]);

  const todayCompletion = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const done = tasks.filter((tk) => tk.completed && tk.completed_at && tk.completed_at.slice(0, 10) === today).length;
    return tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  }, [tasks]);

  const avgAccuracy = useMemo(
    () => (progress.length ? Math.round(progress.reduce((a, b) => a + (b.accuracy || 0), 0) / progress.length) : 0),
    [progress]
  );

  const statusMap = {
    improving: { label: t("caretaker_improving"), icon: TrendingUp, color: "text-emerald-400" },
    stable: { label: t("caretaker_stable"), icon: Minus, color: "text-primary" },
    declining: { label: t("caretaker_declining"), icon: TrendingDown, color: "text-amber-400" },
  };
  const S = statusMap[status];

  if (loading)
    return (
      <div className="max-w-md mx-auto px-4 py-10">
        <p className="text-lg text-muted-foreground">{t("common_loading")}</p>
      </div>
    );

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-primary text-glow">{t("caretaker_title")}</h1>
      <p className="text-lg text-muted-foreground mt-1 mb-4">{t("caretaker_subtitle")}</p>
      <DataNetwork3D className="w-full h-32 mb-6" />

      {progress.length === 0 && tasks.length === 0 ? (
        <p className="text-lg text-muted-foreground">{t("caretaker_no_data")}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="glass-strong rounded-2xl p-4">
              <div className="text-base text-muted-foreground">{t("caretaker_today_accuracy")}</div>
              <div className="text-4xl font-bold text-primary">{avgAccuracy}%</div>
            </div>
            <div className="glass-strong rounded-2xl p-4">
              <div className="text-base text-muted-foreground">{t("caretaker_today_completion")}</div>
              <div className="text-4xl font-bold text-primary">{todayCompletion}%</div>
            </div>
          </div>

          <div className="glass-strong rounded-2xl p-5 mb-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
              <S.icon className={`w-8 h-8 ${S.color}`} />
            </div>
            <div>
              <div className="text-base text-muted-foreground">{t("caretaker_status")}</div>
              <div className={`text-2xl font-bold ${S.color}`}>{S.label}</div>
            </div>
          </div>

          {accuracyData.length > 0 && (
            <div className="glass-strong rounded-2xl p-4 mb-6">
              <h2 className="text-xl font-bold mb-3">{t("caretaker_accuracy")}</h2>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={accuracyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis domain={[0, 100]} stroke="#9ca3af" />
                  <Tooltip contentStyle={{ background: "#12121c", border: "1px solid #2979FF", borderRadius: 12 }} />
                  <Line type="monotone" dataKey="accuracy" stroke="#2979FF" strokeWidth={3} dot={{ fill: "#2979FF" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="glass-strong rounded-2xl p-4 mb-6">
            <h2 className="text-xl font-bold mb-3">{t("caretaker_completion")}</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={completionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis domain={[0, 100]} stroke="#9ca3af" />
                <Tooltip contentStyle={{ background: "#12121c", border: "1px solid #2979FF", borderRadius: 12 }} />
                <Bar dataKey="rate" fill="#2979FF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {recommendations.length > 0 && (
            <div className="glass-strong rounded-2xl p-5">
              <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                {t("caretaker_recommendations")}
              </h2>
              <p className="text-lg text-muted-foreground mb-2">{t("caretaker_focus")}</p>
              <div className="flex flex-col gap-2">
                {recommendations.map((r) => (
                  <div key={r.cat} className="glass rounded-xl px-4 py-3 text-lg font-semibold capitalize">
                    {r.cat} · {Math.round(r.avg)}%
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}