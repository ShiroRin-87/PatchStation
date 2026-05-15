export function renderTags(tags: string[], clickable = false): string {
  if (clickable) {
    return tags.map((t) => `<button class="tag tag-${slugify(t)} tag-clickable" data-tag="${t}">${t}</button>`).join("");
  }
  return tags.map((t) => `<span class="tag tag-${slugify(t)}">${t}</span>`).join("");
}

export function renderTagFilter(allTags: string[], active: Set<string>): string {
  const items = allTags.map((tag) => {
    const cls = active.has(tag) ? "tag-btn active" : "tag-btn";
    return `<button class="${cls}" data-tag="${tag}">${tag}</button>`;
  });
  return `<div class="tag-filter">${items.join("")}</div>`;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9一-鿿]+/g, "-");
}
