import lunr from "lunr";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

const gamesPath = path.resolve(__dirname, "../public/data/games.json");
const indexOutputPath = path.resolve(__dirname, "../public/data/index.json");

const games: Game[] = JSON.parse(fs.readFileSync(gamesPath, "utf-8"));

const idx = lunr(function () {
  this.ref("id");
  this.field("title");
  this.field("titleJa");
  this.field("brand");
  this.field("tags");
  this.field("description");

  for (const game of games) {
    this.add({
      id: game.id,
      title: game.title,
      titleJa: game.titleJa,
      brand: game.brand,
      tags: game.tags.join(" "),
      description: game.description,
    });
  }
});

fs.writeFileSync(indexOutputPath, JSON.stringify(idx));
console.log(`Search index built: ${games.length} games indexed.`);
