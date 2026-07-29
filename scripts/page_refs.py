import re
import sys

UNPUBLISHED_URL = '/unpublished'

_RESOLVED_PREFIXES = ('/posts/', '/raw/', '/unpublished')


def _extract_notion_page_id(href):
    m = re.match(r'^(?:/p)?/([0-9a-f]{8}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{12})(?:[#?]|$)', href, re.IGNORECASE)
    if not m:
        return None
    raw = m.group(1)
    return f'{raw[:8]}-{raw[8:12]}-{raw[12:16]}-{raw[16:20]}-{raw[20:]}'


def collect_sub_page_refs(blocks):
    refs = []
    for block in blocks:
        t = block.get('type', '')
        if t in ('link_to_page', 'child_page', 'child_database'):
            page_id = block.get('page_id', '')
            if page_id:
                title = block.get('title_hint', '')
                refs.append({'title': title, 'page_id': page_id})
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


def collect_child_page_refs(blocks):
    refs = []
    for block in blocks:
        t = block.get('type', '')
        if t == 'child_page':
            page_id = block.get('page_id', '')
            if page_id:
                title = block.get('title_hint', '')
                refs.append({'title': title, 'page_id': page_id})
        if 'children' in block:
            refs.extend(collect_child_page_refs(block['children']))
    return refs


def _generate_slug(title, page_id, used_slugs):
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


def _resolve_page_block(block, slug_map):
    """Resolve child_page / link_to_page block to sub_page_link or fallback paragraph."""
    page_id = block.get('page_id', '')
    if page_id in slug_map:
        block['type'] = 'sub_page_link'
        block['slug'] = slug_map[page_id]
        block['title'] = block.get('title_hint', '') or slug_map.get(f'_{page_id}_title', 'Untitled')
    else:
        title_text = block.get('title_hint', '') or 'Untitled'
        block['type'] = 'paragraph'
        block['rich_text'] = [{'type': 'text', 'plain_text': title_text, 'annotations': {}, 'href': UNPUBLISHED_URL}]


def _resolve_rich_text_ref(item, slug_map):
    """Resolve a rich_text item's Notion page href or mention to local URL."""
    href = item.get('href', '') or ''
    pid = _extract_notion_page_id(href)
    if pid:
        if pid in slug_map:
            item['href'] = '/posts/' + slug_map[pid]
        else:
            item['href'] = UNPUBLISHED_URL
    elif href and href.startswith('/') and not any(href.startswith(p) for p in _RESOLVED_PREFIXES):
        print(f'ERROR: unrecognized internal link format in rich_text: href="{href}" text="{item.get("plain_text", "")}"', file=sys.stderr)

    if item.get('type') == 'mention' and item.get('mention_type') == 'page':
        pid2 = item.get('page_id', '')
        if pid2:
            if pid2 in slug_map:
                item['page_id'] = slug_map.get(pid2, '')
            else:
                item['page_id'] = ''
                item['mention_type'] = ''
                item['href'] = UNPUBLISHED_URL


def collect_child_database_refs(blocks):
    refs = []
    for block in blocks:
        t = block.get('type', '')
        if t == 'child_database':
            page_id = block.get('page_id', '')
            if page_id:
                title = block.get('title_hint', '')
                refs.append({'title': title, 'page_id': page_id})
        if 'children' in block:
            refs.extend(collect_child_database_refs(block['children']))
    return refs


def apply_sub_page_slugs(blocks, slug_map):
    for block in blocks:
        t = block.get('type', '')
        if t in ('child_page', 'link_to_page', 'child_database'):
            _resolve_page_block(block, slug_map)
        for item in block.get('rich_text', []):
            _resolve_rich_text_ref(item, slug_map)
        if 'children' in block:
            apply_sub_page_slugs(block['children'], slug_map)
