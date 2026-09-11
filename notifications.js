export async function requestNotificationPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return "denied";
  }
}

export function fireNotification(title, body) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: title + body,
    });
  } catch {
    /* ignore */
  }
}

// Returns a cleanup function. Calls onDue(task) when a task's scheduled time is reached.
export function startReminderWatcher(getTasks, onDue) {
  const fired = new Set();
  let interval;

  function check() {
    const now = new Date();
    const hhmm = now.toTimeString().slice(0, 5);
    const today = now.toISOString().slice(0, 10);
    const tasks = getTasks() || [];
    for (const task of tasks) {
      if (task.completed) continue;
      if (!task.scheduled_time) continue;
      const key = `${today}-${task.id}-${task.scheduled_time}`;
      if (task.scheduled_time <= hhmm && !fired.has(key)) {
        fired.add(key);
        onDue(task);
      }
    }
  }

  interval = setInterval(check, 15000);
  check();
  return () => clearInterval(interval);
}