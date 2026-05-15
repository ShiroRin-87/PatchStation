import { renderLayout } from "./ui/layout";
import { renderGamesPage, handleTagClick, handleSearch } from "./data/games";
import { renderDetailPage } from "./data/detail";

const app = document.getElementById("app")!;

function parseHash(): { route: string; params: Record<string, string> } {
  const hash = window.location.hash.slice(1) || "/";
  if (hash.startsWith("/game/")) {
    return { route: "/game/:id", params: { id: hash.slice(6) } };
  }
  return { route: hash, params: {} };
}

async function render(): Promise<void> {
  const { route, params } = parseHash();
  let content: string;

  if (route === "/game/:id") {
    content = await renderDetailPage(params.id);
  } else {
    content = await renderGamesPage();
  }

  app.innerHTML = renderLayout(content);
  bindEvents(route);
}

function bindEvents(route: string): void {
  // Navigation links
  document.querySelectorAll("[data-link]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const href = (el as HTMLAnchorElement).getAttribute("href");
      if (href) {
        window.location.hash = href.startsWith("#") ? href.slice(1) : href;
      }
    });
  });

  // Search
  const searchInput = document.getElementById("search-input") as HTMLInputElement | null;
  const searchBtn = document.getElementById("search-btn");

  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleSearch(searchInput.value.trim());
    });
  }
  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      if (searchInput) handleSearch(searchInput.value.trim());
    });
  }

  // Tag buttons (only on games page)
  if (route === "/") {
    document.querySelectorAll(".tag-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tag = (btn as HTMLButtonElement).dataset.tag!;
        handleTagClick(tag);
      });
    });
  }
}

window.addEventListener("hashchange", render);
render();
