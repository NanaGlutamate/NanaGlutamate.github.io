import sys
import json
import os
from pathlib import Path

PUBLISHED_STATUS = '发布'
TEST_STATUS = '调试'

PROJECT_ROOT = Path(__file__).parent.parent
PUBLIC_RAW = PROJECT_ROOT / 'public' / 'raw'
NOTION_BACKUP = PROJECT_ROOT / 'NotionBackup'
sys.path.insert(0, str(NOTION_BACKUP))

_original_cwd = os.getcwd()
os.chdir(str(NOTION_BACKUP))
try:
    from toolkit.notionlib3 import PageCache, ID, TYPE, CHILDREN, CHILD_PAGE, CHILD_DATABASE, DATA
finally:
    os.chdir(_original_cwd)


def _load_env():
    env = {}
    env_local = PROJECT_ROOT / '.env.local'
    if env_local.exists():
        with open(env_local, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    if '=' in line:
                        k, v = line.split('=', 1)
                        env[k.strip()] = v.strip()

    for key in ('NOTION_TOKEN', 'RELEASE_DATABASE_ID'):
        if key not in env and key in os.environ:
            env[key] = os.environ[key]

    config_json = NOTION_BACKUP / 'config.json'
    if config_json.exists() and 'NOTION_TOKEN' not in env:
        with open(config_json, 'r', encoding='utf-8') as f:
            cfg = json.load(f)
        env['NOTION_TOKEN'] = cfg.get('NOTION_TOKEN', '')

    if 'NOTION_TOKEN' in env:
        os.environ.setdefault('NOTION_TOKEN', env['NOTION_TOKEN'])

    return env


def get_plain_text(rich_text):
    if not rich_text:
        return ''
    return ''.join(item.get('plain_text', '') for item in rich_text)


def simplify_rich_text(rich_text):
    result = []
    for item in (rich_text or []):
        entry = {
            'type': item.get('type', 'text'),
            'plain_text': item.get('plain_text', ''),
            'annotations': item.get('annotations', {}),
        }
        if item.get('type') == 'text':
            entry['href'] = item.get('href')
        elif item.get('type') == 'mention':
            entry['mention_type'] = item.get('mention', {}).get('type', '')
            if entry['mention_type'] == 'page':
                entry['page_id'] = item.get('mention', {}).get('page', {}).get('id', '')
        elif item.get('type') == 'equation':
            entry['expression'] = item.get('equation', {}).get('expression', '')
        result.append(entry)
    return result


def _find_raw_filename(block_key, raw_dir):
    prefix = block_key[:2]
    marker = f'{block_key}[bin]'
    for base in (raw_dir, raw_dir / prefix):
        if not base.exists():
            continue
        for f in base.iterdir():
            if f.is_file() and f.name.startswith(marker):
                return f.name.split('[bin]', 1)[1]
    return None


def handle_media_block(block, cache):
    block_type = block[TYPE]
    if block_type not in ('image', 'video', 'file', 'pdf'):
        return None

    block_key = block[ID].replace('-', '')

    raw_bytes = cache._raw_storage.get(block_key)
    if raw_bytes:
        dest_name = _find_raw_filename(block_key, NOTION_BACKUP / '.notion-cache' / 'raw')
        if not dest_name:
            return None
        dest_path = PUBLIC_RAW / dest_name
        dest_path.parent.mkdir(parents=True, exist_ok=True)
        if not dest_path.exists():
            dest_path.write_bytes(raw_bytes)
        return f'/raw/{dest_name}'

    block_data = block.get(block_type, {})
    inner_type = block_data.get('type', '')
    if inner_type == 'external' and block_data.get('external', {}).get('url'):
        return block_data['external']['url']
    if inner_type == 'file' and block_data.get('file', {}).get('url'):
        return block_data['file']['url']

    return None


def simplify_block(block, cache):
    block_type = block.get(TYPE, 'unknown')
    simplified = {'type': block_type}

    if block_type in ('paragraph', 'heading_1', 'heading_2', 'heading_3', 'quote', 'to_do'):
        data = block.get(block_type, {})
        simplified['rich_text'] = simplify_rich_text(data.get('rich_text', []))
        if 'color' in data:
            simplified['color'] = data['color']
        if block_type == 'to_do':
            simplified['checked'] = data.get('checked', False)
        if CHILDREN in block:
            simplified['children'] = [simplify_block(c, cache) for c in block[CHILDREN]]

    elif block_type == 'code':
        data = block.get(block_type, {})
        simplified['rich_text'] = simplify_rich_text(data.get('rich_text', []))
        simplified['language'] = data.get('language', 'plain text')

    elif block_type == 'equation':
        simplified['expression'] = block.get(block_type, {}).get('expression', '')

    elif block_type == 'divider':
        pass

    elif block_type in ('image', 'video', 'file', 'pdf'):
        data = block.get(block_type, {})
        src = handle_media_block(block, cache)
        if src:
            simplified['src'] = src
            simplified['caption'] = simplify_rich_text(data.get('caption', []))
        else:
            simplified['src'] = ''

    elif block_type == 'callout':
        data = block.get(block_type, {})
        simplified['rich_text'] = simplify_rich_text(data.get('rich_text', []))
        simplified['color'] = data.get('color', 'default')
        icon = data.get('icon', {})
        if icon.get('type') == 'emoji':
            simplified['emoji'] = icon.get('emoji', '')
        if CHILDREN in block:
            simplified['children'] = [simplify_block(c, cache) for c in block[CHILDREN]]

    elif block_type == 'bookmark':
        data = block.get(block_type, {})
        simplified['url'] = data.get('url', '')
        simplified['caption'] = simplify_rich_text(data.get('caption', []))

    elif block_type == 'table_of_contents':
        data = block.get(block_type, {})
        simplified['color'] = data.get('color', 'default')

    elif block_type in ('bulleted_list_item', 'numbered_list_item'):
        data = block.get(block_type, {})
        simplified['rich_text'] = simplify_rich_text(data.get('rich_text', []))
        if CHILDREN in block:
            simplified['children'] = [simplify_block(c, cache) for c in block[CHILDREN]]

    elif block_type == 'toggle':
        data = block.get(block_type, {})
        simplified['rich_text'] = simplify_rich_text(data.get('rich_text', []))
        if CHILDREN in block:
            simplified['children'] = [simplify_block(c, cache) for c in block[CHILDREN]]

    elif block_type == 'column_list':
        if CHILDREN in block:
            simplified['children'] = [simplify_block(c, cache) for c in block[CHILDREN]]

    elif block_type == 'column':
        if CHILDREN in block:
            simplified['children'] = [simplify_block(c, cache) for c in block[CHILDREN]]

    elif block_type == 'table':
        data = block.get(block_type, {})
        simplified['table_width'] = data.get('table_width', 2)
        simplified['has_column_header'] = data.get('has_column_header', False)
        simplified['has_row_header'] = data.get('has_row_header', False)
        if CHILDREN in block:
            simplified['children'] = [simplify_block(c, cache) for c in block[CHILDREN]]

    elif block_type == 'table_row':
        if 'cells' in block.get(block_type, {}):
            simplified['cells'] = [
                simplify_rich_text(cell)
                for cell in block[block_type]['cells']
            ]

    elif block_type == 'synced_block':
        if CHILDREN in block:
            simplified['children'] = [simplify_block(c, cache) for c in block[CHILDREN]]

    elif block_type == 'link_to_page':
        data = block.get(block_type, {})
        simplified['page_id'] = data.get('page_id', '')

    elif block_type == 'child_page':
        simplified['page_id'] = block[ID]
        data = block.get(block_type, {})
        simplified['title_hint'] = data.get('title', '')

    else:
        if CHILDREN in block:
            simplified['children'] = [simplify_block(c, cache) for c in block[CHILDREN]]

    return simplified


def simplify_page_blocks(children, cache):
    return [simplify_block(block, cache) for block in (children or [])]


def extract_properties(row):
    props = row.get('properties', {})

    title = ''
    page_id = ''
    page_prop = props.get('Page', {})
    title_items = page_prop.get('title', [])
    if title_items and title_items[0].get('type') == 'mention':
        mention = title_items[0].get('mention', {})
        if mention.get('type') == 'page':
            page_id = mention.get('page', {}).get('id', '')
        title = get_plain_text(title_items).strip()

    slug = ''
    slug_prop = props.get('Slug', {})
    slug_text = slug_prop.get('rich_text', [])
    if slug_text:
        slug = get_plain_text(slug_text)

    date_val = None
    date_prop = props.get('Date', {})
    date_data = date_prop.get('date', {})
    if date_data and date_data.get('start'):
        date_val = date_data['start']

    series = None
    series_prop = props.get('Series', {})
    series_data = series_prop.get('select')
    if series_data:
        series = series_data.get('name')

    tags = []
    tag_prop = props.get('Tag', {})
    tag_data = tag_prop.get('multi_select', [])
    for t in tag_data:
        tags.append({'name': t.get('name', ''), 'color': t.get('color', 'default')})

    status = ''
    status_prop = props.get('Status', {})
    status_data = status_prop.get('status', {})
    if status_data:
        status = status_data.get('name', '')

    summary = ''
    summary_prop = props.get('Summary', {})
    summary_text = summary_prop.get('rich_text', [])
    if summary_text:
        summary = get_plain_text(summary_text)

    return {
        'title': title,
        'slug': slug,
        'date': date_val,
        'series': series,
        'tags': tags,
        'status': status,
        'summary': summary,
        'page_id': page_id,
    }


def log(msg: str) -> None:
    print(msg, file=sys.stderr)


def get_page_name(cache, page_id):
    try:
        page = cache.assemble_page(page_id)
        cp = page.get('child_page', {})
        if cp.get('title'):
            return cp['title']
        return page.get('name', 'Untitled')
    except Exception:
        return 'Untitled'


def collect_sub_page_refs(blocks):
    refs = []
    for block in blocks:
        t = block.get('type', '')
        if t in ('link_to_page', 'child_page'):
            page_id = block.get('page_id', '')
            if page_id:
                title = block.get('title_hint', '')
                refs.append({'title': title, 'page_id': page_id})
        # Also scan rich_text for Notion page hrefs
        rt = block.get('rich_text', [])
        for item in rt:
            href = item.get('href', '') or ''
            pid = _extract_notion_page_id(href)
            if pid:
                refs.append({'title': '', 'page_id': pid})
            if item.get('type') == 'mention' and item.get('mention_type') == 'page':
                pid2 = item.get('page_id', '')
                if pid2:
                    refs.append({'title': '', 'page_id': pid2})
        if 'children' in block:
            refs.extend(collect_sub_page_refs(block['children']))
    return refs


def _extract_notion_page_id(href):
    import re
    m = re.match(r'^/([0-9a-f]{8}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{12})(?:[#?]|$)', href, re.IGNORECASE)
    if not m:
        return None
    raw = m.group(1)
    return f'{raw[:8]}-{raw[8:12]}-{raw[12:16]}-{raw[16:20]}-{raw[20:]}'


def _generate_slug(title, page_id, used_slugs):
    import re
    safe = title.strip() or 'untitled'
    safe = re.sub(r'[^\w\u4e00-\u9fff-]', '-', safe)
    safe = re.sub(r'-+', '-', safe).strip('-')
    base = safe if safe else page_id.replace('-', '')[:12]
    slug = base
    n = 1
    while slug in used_slugs:
        slug = f'{base}-{n}'
        n += 1
    used_slugs.add(slug)
    return slug


def apply_sub_page_slugs(blocks, slug_map):
    for block in blocks:
        t = block.get('type', '')
        if t in ('link_to_page', 'child_page'):
            page_id = block.get('page_id', '')
            if page_id in slug_map:
                block['type'] = 'sub_page_link'
                block['slug'] = slug_map[page_id]
                block['title'] = block.get('title_hint', '') or slug_map.get(f'_{page_id}_title', 'Untitled')
        # Rewrite inline rich_text Notion hrefs
        for item in block.get('rich_text', []):
            href = item.get('href', '') or ''
            pid = _extract_notion_page_id(href)
            if pid and pid in slug_map:
                item['href'] = '/posts/' + slug_map[pid]
            if item.get('type') == 'mention' and item.get('mention_type') == 'page':
                pid2 = item.get('page_id', '')
                if pid2 and pid2 in slug_map:
                    item['page_id'] = slug_map[pid2]
        if 'children' in block:
            apply_sub_page_slugs(block['children'], slug_map)


def main():
    os.chdir(str(NOTION_BACKUP))
    env = _load_env()

    db_id = env.get('RELEASE_DATABASE_ID', '')
    if not db_id:
        log('ERROR: RELEASE_DATABASE_ID not found in .env.local')
        sys.exit(1)

    log(f'Using database ID: {db_id}')
    cache = PageCache()

    db_entry = cache.assemble_page(db_id)
    rows = db_entry.get(DATA, [])
    log(f'Found {len(rows)} rows in database')

    posts = []
    PUBLIC_RAW.mkdir(parents=True, exist_ok=True)
    posts_with_page_id = []

    allowed_statuses = {PUBLISHED_STATUS}
    include_test = os.environ.get('BLOG_INCLUDE_TEST', '') == 'true'
    if include_test:
        allowed_statuses.add(TEST_STATUS)

    for row in rows:
        meta = extract_properties(row)
        if not meta['slug'] or meta['status'] not in allowed_statuses:
            continue
        if not meta['page_id']:
            log(f'  SKIP (no page_id): {meta["title"]}')
            continue

        log(f'  Processing: {meta["title"]} ({meta["slug"]})')

        try:
            page = cache.assemble_page(meta['page_id'])
        except Exception as e:
            log(f'    ERROR assembling page: {e}')
            continue

        blocks = simplify_page_blocks(page.get(CHILDREN, []), cache)

        post_data = {
            'slug': meta['slug'],
            'title': meta['title'],
            'date': meta['date'],
            'series': meta['series'],
            'tags': meta['tags'],
            'status': meta['status'],
            'summary': meta['summary'],
            'blocks': blocks,
            'sub_pages': [],
        }

        posts_with_page_id.append((meta['page_id'], post_data))
        log(f'    -> {len(blocks)} blocks')

    # ── Collect all sub-page refs from top-level posts ──
    all_refs_by_parent = {}
    for pid, post_data in posts_with_page_id:
        refs = collect_sub_page_refs(post_data['blocks'])
        if refs:
            all_refs_by_parent[pid] = refs

    # ── Recursively build sub-page registry ──
    visited = set()
    sub_page_registry = {}
    worklist = []
    for refs in all_refs_by_parent.values():
        for r in refs:
            if r['page_id'] not in visited:
                visited.add(r['page_id'])
                worklist.append(r)

    while worklist:
        ref = worklist.pop(0)
        page_id = ref['page_id']
        title = ref['title'] or get_page_name(cache, page_id)
        if not title:
            title = page_id[:8] + '...'

        if page_id in sub_page_registry:
            continue

        try:
            sub_page = cache.assemble_page(page_id)
            sub_blocks = simplify_page_blocks(sub_page.get(CHILDREN, []), cache)
        except Exception as e:
            log(f'  WARNING: failed to assemble sub-page {page_id}: {e}')
            sub_blocks = []

        sub_page_registry[page_id] = {'title': title, 'blocks': sub_blocks}

        deeper_refs = collect_sub_page_refs(sub_blocks)
        for dr in deeper_refs:
            if dr['page_id'] not in visited:
                visited.add(dr['page_id'])
                dr['title'] = dr['title'] or get_page_name(cache, dr['page_id'])
                worklist.append(dr)

    # ── Generate slugs for all sub-pages ──
    used_slugs = set(pd['slug'] for _, pd in posts_with_page_id)
    db_slug_by_id = {pid: pd['slug'] for pid, pd in posts_with_page_id}
    slug_map = {}
    for page_id, info in sub_page_registry.items():
        if page_id in db_slug_by_id:
            slug = db_slug_by_id[page_id]
        else:
            slug = _generate_slug(info['title'], page_id, used_slugs)
        slug_map[page_id] = slug
        slug_map[f'_{page_id}_title'] = info['title']

    # ── Generate sub-page post entries (skip pages already in DB) ──
    sub_page_posts = []
    for page_id, info in sub_page_registry.items():
        if page_id in db_slug_by_id:
            continue
        slug = slug_map[page_id]
        sub_page_posts.append({
            'slug': slug,
            'title': info['title'],
            'date': None,
            'series': None,
            'tags': [],
            'status': 'sub_page',
            'summary': '',
            'blocks': info['blocks'],
            'sub_pages': [],
        })

    # ── Build ancestry: which sub-pages each post directly references ──
    # Must do this BEFORE apply_sub_page_slugs (which mutates blocks in-place)
    direct_children = {}
    for pid, refs in all_refs_by_parent.items():
        direct_children[pid] = [r['page_id'] for r in refs if r['page_id'] in slug_map]
    for page_id, info in sub_page_registry.items():
        child_refs = collect_sub_page_refs(info['blocks'])
        direct_children[page_id] = [r['page_id'] for r in child_refs if r['page_id'] in slug_map]

    # ── Apply slug mapping to sub-page blocks ──
    for sp in sub_page_posts:
        apply_sub_page_slugs(sp['blocks'], slug_map)

    # ── Build recursive sub_pages list for each top-level post ──
    def collect_descendants(root_id, visited=None):
        if visited is None:
            visited = set()
        result = []
        for child_id in direct_children.get(root_id, []):
            if child_id in visited:
                continue
            visited.add(child_id)
            title = slug_map.get(f'_{child_id}_title', 'Untitled')
            slug = slug_map[child_id]
            result.append({'title': title, 'page_id': child_id, 'slug': slug})
            result.extend(collect_descendants(child_id, visited))
        return result

    # ── Apply slug mapping to top-level posts ──
    for pid, post_data in posts_with_page_id:
        apply_sub_page_slugs(post_data['blocks'], slug_map)
        post_data['sub_pages'] = collect_descendants(pid)
        if post_data['sub_pages']:
            log(f'    -> {len(post_data["sub_pages"])} sub-page links')

    # ── Assemble final post list ──
    # Keep posts that were published in the DB, even if they're also sub-pages
    published_ids = {pid for pid, _ in posts_with_page_id}
    all_sub_page_ids = set(sub_page_registry.keys())
    pure_sub_page_ids = all_sub_page_ids - published_ids
    posts = [pd for pid, pd in posts_with_page_id if pid not in pure_sub_page_ids]
    posts.extend(sub_page_posts)
    main_count = len([p for p in posts if p['status'] != 'sub_page'])
    sub_count = len(sub_page_posts)
    sys.stdout.write(json.dumps(posts, ensure_ascii=False))
    log(f'\nTotal posts: {len(posts)} (main: {main_count}, sub-pages: {sub_count})')


if __name__ == '__main__':
    main()
