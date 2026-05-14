export function renderLayout(content: string): string {
  return `
    <header class="site-header">
      <div class="header-inner">
        <a href="#" class="logo" data-link>
          <span class="logo-icon">&#x2726;</span>
          <span class="logo-text">百合Galgame 补丁站</span>
        </a>
        <nav class="nav-links">
          <a href="#" data-link>首页</a>
        </nav>
      </div>
    </header>
    <main class="main-content">${content}</main>
    <footer class="site-footer">
      <p>百合Galgame 补丁索引站 &mdash; 仅供学习交流使用</p>
    </footer>
  `;
}
