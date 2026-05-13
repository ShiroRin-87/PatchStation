import { loadGames, getGameById, formatSize, formatDate, type Game } from "../utils";
import { renderTags } from "../ui/tag";

export async function renderDetailPage(gameId: string): Promise<string> {
  const games = await loadGames();
  const game = getGameById(games, gameId);

  if (!game) {
    return `
      <div class="page-detail">
        <div class="empty-state">
          <p class="empty-icon">&#x1F50D;</p>
          <p>游戏不存在</p>
          <a href="#" class="back-link" data-link>&larr; 返回首页</a>
        </div>
      </div>
    `;
  }

  return `
    <div class="page-detail">
      <a href="#" class="back-link" data-link>&larr; 返回首页</a>
      <div class="detail-hero">
        <div class="detail-cover">
          <img src="${game.cover}" alt="${game.title}" />
        </div>
        <div class="detail-info">
          <h1 class="detail-title">${game.title}</h1>
          ${game.titleJa ? `<p class="detail-title-ja">${game.titleJa}</p>` : ""}
          <div class="detail-meta">
            <div class="meta-item">
              <span class="meta-label">社团</span>
              <span class="meta-value">${game.brand}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">发售日</span>
              <span class="meta-value">${formatDate(game.releaseDate)}</span>
            </div>
          </div>
          <div class="detail-tags">${renderTags(game.tags)}</div>
          <p class="detail-desc">${game.description}</p>
        </div>
      </div>
      <section class="patch-section">
        <h2 class="section-title">补丁列表</h2>
        ${renderPatchList(game)}
      </section>
    </div>
  `;
}

function renderPatchList(game: Game): string {
  if (game.patches.length === 0) {
    return `<p class="no-patches">暂无补丁，敬请期待</p>`;
  }

  const typeLabels: Record<string, string> = {
    translation: "汉化",
    restoration: "内容恢复",
    fix: "修复",
    mod: "MOD",
    other: "其他",
  };

  return `
    <div class="patch-list">
      ${game.patches
        .map(
          (p) => `
        <div class="patch-card">
          <div class="patch-header">
            <span class="patch-type">${typeLabels[p.type] || p.type}</span>
            <span class="patch-version">v${p.version}</span>
          </div>
          <h3 class="patch-name">${p.name}</h3>
          <p class="patch-desc">${p.description}</p>
          <div class="patch-meta">
            <span>作者: ${p.author}</span>
            <span>大小: ${formatSize(p.size)}</span>
            <span>日期: ${formatDate(p.date)}</span>
          </div>
          <a href="${p.file}" class="patch-download" download>
            &#x2B07; 下载补丁
          </a>
        </div>
      `
        )
        .join("")}
    </div>
  `;
}
