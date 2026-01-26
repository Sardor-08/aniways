export interface WatchHistoryItem {
  malId: number;
  episode: number;
  timestamp: number; // seconds into the episode
  duration: number; // total episode duration in seconds
  animeTitle: string;
  animeTitleEnglish?: string;
  imageUrl: string;
  lastWatched: number; // Date timestamp
}

const STORAGE_KEY = "aniways-watch-history";
const MAX_HISTORY_ITEMS = 20;

export function getWatchHistory(): WatchHistoryItem[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveWatchProgress(item: WatchHistoryItem): void {
  if (typeof window === "undefined") return;
  
  try {
    const history = getWatchHistory();
    
    // Remove existing entry for same anime/episode
    const filtered = history.filter(
      (h) => !(h.malId === item.malId && h.episode === item.episode)
    );
    
    // Add new entry at the beginning
    filtered.unshift({
      ...item,
      lastWatched: Date.now(),
    });
    
    // Keep only the most recent items
    const trimmed = filtered.slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error("Failed to save watch progress:", error);
  }
}

export function getWatchProgressForAnime(malId: number): WatchHistoryItem | null {
  const history = getWatchHistory();
  // Get the most recent episode watched for this anime
  return history.find((h) => h.malId === malId) || null;
}

export function removeFromWatchHistory(malId: number, episode: number): void {
  if (typeof window === "undefined") return;
  
  try {
    const history = getWatchHistory();
    const filtered = history.filter(
      (h) => !(h.malId === malId && h.episode === episode)
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to remove from watch history:", error);
  }
}

export function clearWatchHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
