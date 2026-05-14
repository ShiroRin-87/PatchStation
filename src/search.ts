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

function fuzzyQuery(q: string): string {
  return q
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => {
      // For CJK terms, match as-is; for ASCII, add fuzzy
      if (/[぀-ヿ一-鿿]/.test(t)) {
        return t;
      }
      return t + "~1";
    })
    .join(" ");
}

function substringMatch(games: Game[], query: string): Game[] {
  const q = query.toLowerCase();
  return games.filter((g) => {
    const haystack = [
      g.title,
      g.titleJa,
      g.brand,
      ...g.tags,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export async function search(query: string): Promise<Game[]> {
  const trimmed = query.trim();
  if (!trimmed) return loadGames();

  const games = await loadGames();

  // Try lunr with fuzzy matching
  const index = await loadIndex();
  const fuzzyQ = fuzzyQuery(trimmed);

  let results: Array<{ ref: string }>;
  try {
    results = index.search(fuzzyQ);
  } catch {
    results = [];
  }

  if (results.length > 0) {
    const gameMap = new Map(games.map((g) => [g.id, g]));
    const matched = results
      .map((r) => gameMap.get(r.ref))
      .filter((g): g is Game => g != null);

    if (matched.length > 0) return matched;
  }

  // Fallback: substring match on title, titleJa, brand
  return substringMatch(games, trimmed);
}
