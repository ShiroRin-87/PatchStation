import lunr from "lunr";
import { loadGames, type Game } from "./utils";

let idx: lunr.Index | null = null;

async function loadIndex(): Promise<lunr.Index> {
  if (idx) return idx;
  const res = await fetch("./data/index.json");
  const data = await res.json();
  idx = lunr.Index.load(data);
  return idx;
}

export async function search(query: string): Promise<Game[]> {
  if (!query.trim()) return loadGames();

  const index = await loadIndex();
  const results = index.search(query);

  const games = await loadGames();
  const gameMap = new Map(games.map((g) => [g.id, g]));

  return results.map((r) => gameMap.get(r.ref)).filter((g): g is Game => g != null);
}
