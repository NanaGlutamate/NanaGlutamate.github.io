# AGENTS.md

## 数据来源：NotionBackup 是唯一数据源

所有页面内容均来源于 **NotionBackup**。网站的数据管线如下：

```
Notion API → NotionBackup (.notion-cache/) → assemble_page() → Astro 构建 → 静态 HTML
```

### 关键规则

1. **`NotionBackup/toolkit/notionlib2.py` 的 `assemble_page` 是页面内容的唯一数据源。**
   - 网站上展示的每一篇文章都必须来自 `assemble_page`。
   - 不允许手动创建 JSON/MD 文件作为页面的替代数据源。

2. **不要将生成的页面数据存为文件。**
   - `src/content/posts/` 已被 gitignore —— 不应提交页面 JSON 文件。
   - Astro 内容加载器（`src/content/config.ts`）在构建时调用 `scripts/fetch-posts.py`，该脚本调用 `assemble_page` 并将数据直接送入构建管线。

3. **禁止修改 `NotionBackup/` 下的任何代码。**
   - `NotionBackup` 是上游数据层。所有修改应在 `scripts/` 或 `src/` 中进行。

### 构建管线

```
npm run build
  └── astro build
        └── src/content/config.ts 加载器
              └── python scripts/fetch-posts.py
                    ├── PageCache.assemble_page(db_id)   # 获取数据库行
                    ├── PageCache.assemble_page(pg_id)   # 获取每篇已发布文章
                    └── stdout: JSON 数组                # Astro 加载器读取
```

### 媒体文件

媒体文件（图片、视频、PDF）在拉取时从 `.notion-cache/_raw/` 复制到 `public/collected/`。此目录已被 gitignore。
