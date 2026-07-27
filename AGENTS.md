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

2. **禁止修改 `NotionBackup/` 下的任何代码。**
   - `NotionBackup` 是上游数据层。所有修改应在 `scripts/` 或 `src/` 中进行。

## 工作流

每次修改后跑一次构建：
```bash
npm run build:denoise
```