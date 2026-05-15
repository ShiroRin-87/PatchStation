import type { Game } from "../utils";
import { renderTags } from "./tag";

export function renderGameCard(game: Game): string {
  const patchCount = game.patches.length;
  const countLabel = patchCount > 0 ? `${patchCount} 个补丁` : "暂无补丁";

  return `
    <a href="#/game/${game.id}" class="game-card" data-link>
      <div class="card-cover">
        <img src="${game.cover}" alt="${game.title}" loading="lazy" />
        <div class="card-cover-overlay">
          <span class="card-count">${countLabel}</span>
        </div>
      </div>
      <div class="card-body">
        <h3 class="card-title">${game.title}</h3>
        ${game.titleJa ? `<p class="card-title-ja">${game.titleJa}</p>` : ""}
        <p class="card-brand">${game.brand}</p>
        <div class="card-tags">${renderTags(game.tags, true)}</div>
      </div>
    </a>
  `;
}

export function renderGameGrid(games: Game[]): string {
  if (games.length === 0) {
    return `<div class="empty-state">
      <p class="empty-icon">&#x1F50D;</p>
      <p>没有找到匹配的游戏</p>
    </div>`;
  }
  return `<div class="game-grid">${games.map(renderGameCard).join("")}</div>`;
}
