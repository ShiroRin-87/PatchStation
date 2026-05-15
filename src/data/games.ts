import { loadGames, getAllTags, type Game } from "../utils";
import { search } from "../search";
import { renderGameGrid } from "../ui/card";
import { renderTagFilter } from "../ui/tag";

let allGames: Game[] = [];
let activeTags = new Set<string>();
let currentQuery = "";

export async function renderGamesPage(): Promise<string> {
  allGames = await loadGames();
  const allTags = getAllTags(allGames);

  return `
    <div class="page-games">
      <div class="search-section">
        <div class="search-box">
          <input type="text" id="search-input" placeholder="搜索游戏名称、社团..." value="${escapeHtml(currentQuery)}" autocomplete="off" />
          <button id="search-btn" class="search-btn">&#x1F50D;</button>
        </div>
        ${renderTagFilter(allTags, activeTags)}
      </div>
      <div id="game-list">
        ${await renderFilteredGames()}
      </div>
    </div>
  `;
}

async function renderFilteredGames(): Promise<string> {
  let games: Game[];

  if (currentQuery.trim()) {
    games = await search(currentQuery);
  } else {
    games = allGames;
  }

  if (activeTags.size > 0) {
    games = games.filter((g) => g.tags.some((t) => activeTags.has(t)));
  }

  return renderGameGrid(games);
}

export async function handleTagClick(tag: string): Promise<void> {
  if (activeTags.has(tag)) {
    activeTags.delete(tag);
  } else {
    activeTags.add(tag);
  }
  await refreshGameList();
}

export async function handleSearch(query: string): Promise<void> {
  currentQuery = query;
  await refreshGameList();
}

async function refreshGameList(): Promise<void> {
  const el = document.getElementById("game-list");
  if (el) {
    el.innerHTML = await renderFilteredGames();
    rebindCardLinks();
  }

  const allTags = getAllTags(allGames);
  const filterEl = document.querySelector(".tag-filter");
  if (filterEl) {
    filterEl.innerHTML = renderTagFilter(allTags, activeTags);
    rebindTagButtons();
  }
}

function rebindCardLinks(): void {
  document.querySelectorAll(".game-card[data-link]").forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      const href = (card as HTMLAnchorElement).getAttribute("href");
      if (href) navigateTo(href);
    });
  });

  document.querySelectorAll(".tag-clickable").forEach((tag) => {
    tag.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      const t = (tag as HTMLElement).dataset.tag!;
      handleTagClick(t);
    });
  });
}

function rebindTagButtons(): void {
  document.querySelectorAll(".tag-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tag = (btn as HTMLButtonElement).dataset.tag!;
      handleTagClick(tag);
    });
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function navigateTo(href: string): void {
  window.location.hash = href.startsWith("#") ? href.slice(1) : href;
}
