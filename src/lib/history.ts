// 本地历史记录：完成 observer 模式后自动存
// 仅 localStorage，不上传

export type HistoryEntry = {
  id: string;
  timestamp: number;
  trigger: string;
  cinemaTitle: string;
  breathCount: number;
  thoughtCount: number;
  selectedAction: string;
  source: "preset" | "stepfun";
};

const STORAGE_KEY = "stillmind-history-v1";
const MAX_ENTRIES = 30;

function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (!value || typeof value !== "object") {
    return false;
  }
  const v = value as Partial<HistoryEntry>;
  return (
    typeof v.id === "string" &&
    typeof v.timestamp === "number" &&
    typeof v.trigger === "string" &&
    typeof v.cinemaTitle === "string" &&
    typeof v.breathCount === "number" &&
    typeof v.thoughtCount === "number" &&
    typeof v.selectedAction === "string" &&
    (v.source === "preset" || v.source === "stepfun")
  );
}

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isHistoryEntry);
  } catch {
    return [];
  }
}

export function appendHistory(
  entry: Omit<HistoryEntry, "id" | "timestamp">,
): HistoryEntry[] {
  const next: HistoryEntry = {
    ...entry,
    id: generateId(),
    timestamp: Date.now(),
  };
  try {
    const current = loadHistory();
    const updated = [next, ...current].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [next];
  }
}

export function clearHistory(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function formatRelativeTime(timestamp: number, now: number = Date.now()): string {
  const diff = now - timestamp;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return "刚刚";
  }
  if (diff < hour) {
    return `${Math.floor(diff / minute)} 分钟前`;
  }
  if (diff < day) {
    return `${Math.floor(diff / hour)} 小时前`;
  }
  if (diff < 7 * day) {
    return `${Math.floor(diff / day)} 天前`;
  }
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}
