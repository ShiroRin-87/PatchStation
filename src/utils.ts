export interface Patch {
  id: string;
  name: string;
  type: string;
  version: string;
  file: string;
  size: number;
  date: string;
  author: string;
  description: string;
}

export interface Game {
  id: string;
  title: string;
  titleJa: string;
  brand: string;
  releaseDate: string;
  cover: string;
  tags: string[];
  description: string;
  patches: Patch[];
}

let cachedGames: Game[] | null = null;

export async function loadGames(): Promise<Game[]> {
  if (cachedGames) return cachedGames;
  const res = await fetch("./data/games.json");
  cachedGames = await res.json();
  return cachedGames!;
}

export function getGameById(games: Game[], id: string): Game | undefined {
  return games.find((g) => g.id === id);
}

export function getAllTags(games: Game[]): string[] {
  const tagSet = new Set<string>();
  for (const game of games) {
    for (const tag of game.tags) {
      tagSet.add(tag);
    }
  }
  return Array.from(tagSet).sort();
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
