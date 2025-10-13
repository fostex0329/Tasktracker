// 通知権限の取得
export function getNotificationPermission() {
  if (typeof window === "undefined" || typeof Notification === "undefined") return "unsupported";
  return Notification.permission;
}

// 通知権限のリクエスト
export async function requestNotificationPermission() {
  if (typeof window === "undefined" || typeof Notification === "undefined") return "unsupported";
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch (e) {
    return "denied";
  }
}

// タスクのリマインドをスケジュール
// onNotify(title, body) を呼び出す
export function scheduleTaskReminders(todos, onNotify) {
  const timeouts = [];
  const clear = () => { timeouts.forEach((id) => clearTimeout(id)); };

  if (typeof window === "undefined") {
    return { clear };
  }

  const now = Date.now();
  const canNotify = typeof Notification !== "undefined" && Notification.permission === "granted";
  const showNotify = (title, body) => {
    if (canNotify) {
      try { new Notification(title, { body }); return; } catch (e) {}
    }
    try { alert(`${title}${body ? `\n${body}` : ""}`); } catch (_) {}
  };

  for (const t of todos) {
    if (!t?.remindAt || t.completed) continue;
    const when = new Date(t.remindAt).getTime();
    if (!Number.isFinite(when) || when <= now) continue;
    const delay = Math.min(when - now, 2 ** 31 - 1);
    const id = setTimeout(() => {
      if (typeof onNotify === "function") {
        try { onNotify("リマインド", t.name || "タスク"); } catch (_) { showNotify("リマインド", t.name || "タスク"); }
      } else {
        showNotify("リマインド", t.name || "タスク");
      }
    }, delay);
    timeouts.push(id);
  }

  return { clear };
}


