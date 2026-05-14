import fs from "fs";
import path from "path";
import lunr from "lunr";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// ── Types ──────────────────────────────────────────────

interface SourceGame {
  id: string;
  vndbId?: string;
  overrides?: {
    title?: string;
    titleJa?: string;
    tags?: string[];
  };
}

interface PatchMeta {
  name: string;
  type: string;
  version: string;
  date: string;
  author: string;
  description: string;
}

interface Patch {
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

interface Game {
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

interface VndbVnResult {
  id: string;
  title?: string;
  alttitle?: string;
  description?: string;
  released?: string;
  developers?: { name: string }[];
  image?: { url: string; sexual?: number };
}

interface CacheEntry {
  fetchedAt: string;
  data: VndbVnResult;
}

interface VndbCache {
  [vndbId: string]: CacheEntry;
}

// ── Config ──────────────────────────────────────────────

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const SOURCE_PATH = path.join(root, "data/games.json");
const CACHE_PATH = path.join(root, "data/vndb-cache.json");
const PATCHES_DIR = path.join(root, "public/patches");
const OUTPUT_GAMES = path.join(root, "public/data/games.json");
const OUTPUT_INDEX = path.join(root, "public/data/index.json");

const PLACEHOLDER_COVER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='360'%3E%3Crect fill='%231a1a2e' width='640' height='360'/%3E%3Ctext fill='%23686888' x='320' y='190' text-anchor='middle' font-size='20'%3ENo Cover%3C/text%3E%3C/svg%3E";

// ── Helpers ─────────────────────────────────────────────

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + "...";
}

// ── VNDB Fetch ──────────────────────────────────────────

async function fetchVndb(vndbId: string): Promise<VndbVnResult> {
  const body = JSON.stringify({
    filters: ["id", "=", vndbId],
    fields: "title, alttitle, description, released, developers.name, image.url",
  });

  const res = await fetch("https://api.vndb.org/kana/vn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  if (!res.ok) throw new Error(`VNDB API error: ${res.status}`);

  const json = await res.json();
  if (!json.results?.length) throw new Error(`No VNDB result for ${vndbId}`);

  return json.results[0] as VndbVnResult;
}

// VNDB alttitle = Japanese/original name, title = romaji/English
// Default to Japanese name; user overrides with Chinese via overrides.title
function vndbToGame(vn: VndbVnResult): Pick<Game, "title" | "titleJa" | "brand" | "releaseDate" | "cover" | "description" | "tags"> {
  const titleJa = vn.alttitle || vn.title || "";

  return {
    title: titleJa,
    titleJa: titleJa,
    brand: vn.developers?.[0]?.name ?? "",
    releaseDate: vn.released ?? "",
    cover: vn.image?.url && !vn.image.sexual ? vn.image.url : PLACEHOLDER_COVER,
    description: vn.description ? truncate(vn.description.replace(/[\r\n]+/g, " "), 200) : "",
    tags: [],
  };
}

// ── Patch Scanning ──────────────────────────────────────

function scanPatches(gameId: string): Patch[] {
  const dir = path.join(PATCHES_DIR, gameId);
  if (!fs.existsSync(dir)) return [];

  const patches: Patch[] = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    if (!file.endsWith(".zip")) continue;

    const base = file.slice(0, -4);
    const jsonFile = base + ".json";
    const meta: PatchMeta = loadPatchMeta(path.join(dir, jsonFile));

    const stats = fs.statSync(path.join(dir, file));

    patches.push({
      id: base,
      name: meta.name || base,
      type: meta.type || "translation",
      version: meta.version || "1.0",
      file: `patches/${gameId}/${file}`,
      size: stats.size,
      date: meta.date || stats.mtime.toISOString().slice(0, 10),
      author: meta.author || "",
      description: meta.description || "",
    });
  }

  patches.sort((a, b) => b.date.localeCompare(a.date));
  return patches;
}

function loadPatchMeta(jsonPath: string): PatchMeta {
  try {
    return JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  } catch {
    return {} as PatchMeta;
  }
}

// ── CJK Bigram ──────────────────────────────────────────

function isCJK(ch: string): boolean {
  const cp = ch.codePointAt(0)!;
  return (cp >= 0x4E00 && cp <= 0x9FFF)  // CJK Unified
      || (cp >= 0x3040 && cp <= 0x30FF)  // Hiragana + Katakana
      || (cp >= 0x3400 && cp <= 0x4DBF); // CJK Extension A
}

function bigramCJK(text: string): string {
  const chars = [...text];
  const bigrams: string[] = [];
  for (let i = 0; i < chars.length - 1; i++) {
    if (isCJK(chars[i]) && isCJK(chars[i + 1])) {
      bigrams.push(chars[i] + chars[i + 1]);
    }
  }
  return bigrams.join(" ");
}

// ── Build Index ─────────────────────────────────────────

function buildSearchIndex(games: Game[]): void {
  const idx = lunr(function () {
    this.ref("id");
    this.field("title");
    this.field("titleJa");
    this.field("brand");
    this.field("tags");
    this.field("description");
    this.field("cjk");

    this.pipeline.remove(lunr.stemmer);
    this.pipeline.remove(lunr.stopWordFilter);

    for (const game of games) {
      this.add({
        id: game.id,
        title: game.title,
        titleJa: game.titleJa,
        brand: game.brand,
        tags: game.tags.join(" "),
        description: game.description,
        cjk: bigramCJK(game.title + " " + game.titleJa + " " + game.brand),
      });
    }
  });

  fs.writeFileSync(OUTPUT_INDEX, JSON.stringify(idx));
  console.log("  Index: " + games.length + " games indexed");
}

// ── Main ────────────────────────────────────────────────

async function main() {
  console.log("Building galpatch data...\n");

  // 1. Read source
  const source: SourceGame[] = JSON.parse(fs.readFileSync(SOURCE_PATH, "utf-8"));
  console.log("  Source: " + source.length + " games in games.json");

  // 2. Read cache
  let cache: VndbCache = {};
  try { cache = JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8")); } catch { /* first run */ }
  let cacheUpdated = false;

  // 3. Build full game data
  const games: Game[] = [];
  const now = Date.now();

  for (const src of source) {
    console.log("\n  [" + src.id + "]");

    // Resolve VNDB data
    let vnData: VndbVnResult | null = null;

    if (src.vndbId) {
      const cached = cache[src.vndbId];
      const cachedAge = cached ? now - new Date(cached.fetchedAt).getTime() : Infinity;

      if (cached && cachedAge < CACHE_TTL_MS) {
        console.log("    VNDB: cache hit (" + (cachedAge / 3600000).toFixed(1) + "h old)");
        vnData = cached.data;
      } else {
        try {
          console.log("    VNDB: fetching " + src.vndbId + "...");
          vnData = await fetchVndb(src.vndbId);
          cache[src.vndbId] = { fetchedAt: new Date().toISOString(), data: vnData };
          cacheUpdated = true;
          console.log("    VNDB: fetched OK");
        } catch (err) {
          console.warn("    VNDB: failed - " + err);
          if (cached) { console.warn("    VNDB: using stale cache"); vnData = cached.data; }
        }
      }
    }

    // Build game from VNDB data
    const vndbGame = vnData ? vndbToGame(vnData) : ({} as ReturnType<typeof vndbToGame>);

    // Scan patches
    const patches = scanPatches(src.id);
    console.log("    Patches: " + patches.length + " found");

    // Merge overrides (user's Chinese title overrides the Japanese default)
    const ov = src.overrides;
    const title = ov?.title || vndbGame.title || src.id;
    const titleJa = ov?.titleJa || vndbGame.titleJa || "";
    const tags = ov?.tags ?? [];

    games.push({
      id: src.id,
      title,
      titleJa,
      brand: vndbGame.brand || "",
      releaseDate: vndbGame.releaseDate || "",
      cover: vndbGame.cover || PLACEHOLDER_COVER,
      description: vndbGame.description || "",
      tags,
      patches,
    });
  }

  // 4. Write output
  fs.mkdirSync(path.dirname(OUTPUT_GAMES), { recursive: true });
  fs.writeFileSync(OUTPUT_GAMES, JSON.stringify(games, null, 2));
  console.log("\n  Output: " + OUTPUT_GAMES);

  // 5. Build search index
  buildSearchIndex(games);

  // 6. Save cache
  if (cacheUpdated) {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
    console.log("  Cache: updated");
  }

  console.log("\nDone!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
