import React, { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/components/LanguageProvider";
import { requestNotificationPermission, fireNotification, startReminderWatcher } from "@/lib/notifications";
import { Plus, Pencil, Trash2, X, Bell, Check } from "lucide-react";

export default function DailyChecklist() {
  const { t } = useLanguage();
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [perm, setPerm] = useState(typeof Notification !== "undefined" ? Notification.permission : "unsupported");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", scheduled_time: "09:00", is_recurring: true, description: "" });
  const tasksRef = useRef([]);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  async function load() {
    try {
      const u = await base44.auth.me();
      setUser(u);
      const list = await base44.entities.Task.filter({ user_id: u.id }, "scheduled_time", 100);
      list.sort((a, b) => (a.scheduled_time || "").localeCompare(b.scheduled_time || ""));
      setTasks(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const cleanup = startReminderWatcher(
      () => tasksRef.current,
      (task) => fireNotification(t("app_name"), `${task.title} — ${task.scheduled_time}`)
    );
    return cleanup;
  }, []);

  async function toggle(task) {
    try {
      const completed = !task.completed;
      const completed_at = completed ? new Date().toISOString() : null;
      await base44.entities.Task.update(task.id, { completed, completed_at });
      setTasks((ts) => ts.map((x) => (x.id === task.id ? { ...x, completed, completed_at } : x)));
    } catch (e) {
      console.error(e);
    }
  }

  function openAdd() {
    setEditing({});
    setForm({ title: "", scheduled_time: "09:00", is_recurring: true, description: "" });
  }
  function openEdit(task) {
    setEditing(task);
    setForm({ title: task.title, scheduled_time: task.scheduled_time, is_recurring: !!task.is_recurring, description: task.description || "" });
  }

  async function save() {
    if (!form.title || !form.scheduled_time) return;
    try {
      if (editing.id) {
        await base44.entities.Task.update(editing.id, form);
      } else {
        await base44.entities.Task.create({ ...form, user_id: user.id, completed: false });
      }
      setEditing(null);
      load();
    } catch (e) {
      console.error(e);
    }
  }

  async function remove(task) {
    try {
      await base44.entities.Task.delete(task.id);
      setTasks((ts) => ts.filter((x) => x.id !== task.id));
    } catch (e) {
      console.error(e);
    }
  }

  async function enableNotif() {
    const r = await requestNotificationPermission();
    setPerm(r);
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-primary text-glow">{t("checklist_title")}</h1>
      <p className="text-lg text-muted-foreground mt-1 mb-4">{t("checklist_subtitle")}</p>

      {perm !== "granted" && perm !== "unsupported" && (
        <button
          onClick={enableNotif}
          className="w-full glass rounded-2xl p-4 mb-4 flex items-center gap-3 text-left min-h-[56px]"
        >
          <Bell className="w-6 h-6 text-primary" />
          <span className="text-lg">{t("checklist_enable_notif")}</span>
        </button>
      )}
      {perm === "denied" && (
        <p className="text-base text-muted-foreground mb-4">{t("checklist_perm_denied")}</p>
      )}

      {loading && <p className="text-lg text-muted-foreground">{t("common_loading")}</p>}
      {!loading && tasks.length === 0 && (
        <p className="text-lg text-muted-foreground">{t("checklist_empty")}</p>
      )}

      <div className="flex flex-col gap-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`glass-strong rounded-2xl p-4 flex items-center gap-4 min-h-[72px] ${task.completed ? "opacity-60" : ""}`}
          >
            <button
              onClick={() => toggle(task)}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                task.completed ? "bg-primary text-primary-foreground glow-blue" : "glass border-2 border-primary/40"
              }`}
            >
              {task.completed && <Check className="w-7 h-7" />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="text-xl font-semibold">{task.title}</div>
              <div className="text-base text-primary font-semibold">{task.scheduled_time}</div>
            </div>
            <button onClick={() => openEdit(task)} className="p-2 text-muted-foreground">
              <Pencil className="w-5 h-5" />
            </button>
            <button onClick={() => remove(task)} className="p-2 text-destructive">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={openAdd}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center glow-blue-strong z-30"
      >
        <Plus className="w-7 h-7" />
      </button>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4" onClick={() => setEditing(null)}>
          <div className="glass-strong rounded-3xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">{editing.id ? t("checklist_edit") : t("checklist_add")}</h2>
              <button onClick={() => setEditing(null)}>
                <X className="w-6 h-6 text-muted-foreground" />
              </button>
            </div>
            <label className="block text-base font-semibold mb-1">{t("checklist_title_label")}</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full glass rounded-xl px-4 py-3 mb-3 text-lg min-h-[56px]"
            />
            <label className="block text-base font-semibold mb-1">{t("checklist_time_label")}</label>
            <input
              type="time"
              value={form.scheduled_time}
              onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })}
              className="w-full glass rounded-xl px-4 py-3 mb-3 text-lg min-h-[56px]"
            />
            <label className="flex items-center gap-3 mb-4 text-lg">
              <input
                type="checkbox"
                checked={form.is_recurring}
                onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })}
                className="w-6 h-6"
              />
              {t("checklist_recurring")}
            </label>
            <div className="flex gap-3">
              <button
                onClick={save}
                className="flex-1 bg-primary text-primary-foreground rounded-xl py-4 text-lg font-semibold min-h-[56px] glow-blue"
              >
                {t("checklist_save")}
              </button>
              <button onClick={() => setEditing(null)} className="glass rounded-xl px-6 text-lg min-h-[56px]">
                {t("checklist_cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}