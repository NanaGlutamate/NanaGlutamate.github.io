

def flattern_rich_test(rich_text: list[dict]):
    return ''.join(i['plain_text'] for i in rich_text)

def render_rich_text(rich_text: list[dict], id_to_slug: dict[str, str]):
    def get_slug(id: str):
        if id in id_to_slug:
            return id_to_slug[id]
        if len(id) == 32:
            id = id[:8] + '-' + id[8:12] + '-' + id[12:16] + '-' + id[16:20] + '-' + id[20:]
        return id
    
    def deco(node: dict):
        if node['type'] == 'text':
            s = node['text']['content'].replace('\n', '<br/>')
            if node['text']['link'] is not None:
                if node['text']['link']['url'][0] == '/':
                    id = node["text"]["link"]['url'][1:]
                    assert len(id) == 32
                    s = f'<a href="/posts/{get_slug(id)}">{s}</a>'
                else:
                    s = f'<a href="{node["text"]["link"]['url']}" target="_blank">{s}</a>'
        elif node['type'] == 'mention':
            id = node['mention']['page']['id']
            s = f'<a href="/posts/{get_slug(id)}">{node['plain_text']}</a>'
        else:
            print(f'unknown text type: {node["type"]}')
            s = ''
        annotations = node['annotations']
        if annotations['bold']:
            s = f'<strong>{s}</strong>'
        if annotations['italic']:
            s = f'<em>{s}</em>'
        if annotations['strikethrough']:
            s = f'<del>{s}</del>'
        if annotations['underline']:
            s = f'<u>{s}</u>'
        if annotations['code']:
            s = f'<code>{s}</code>'
        if annotations['color'] != 'default':
            s = f'<mark class="hightlight-{node["annotations"]["color"]}">{s}</mark>'
        return s
    return ''.join(deco(i) for i in rich_text)

def render_node(node: dict, id_to_slug: dict[str, str]):
    def get_slug(id: str):
        if id in id_to_slug:
            return id_to_slug[id]
        if len(id) == 32:
            id = id[:8] + '-' + id[8:12] + '-' + id[12:16] + '-' + id[16:20] + '-' + id[20:]
        return id
    content = node[node['type']]
    sub = ''.join(render_node(i, id_to_slug) for i in node['_children']) if '_children' in node else ''
    match node['type']:
        case 'child_page':
            return f'<a href="/posts/{get_slug(node['id'])}">{content['title']}</a>{sub}'
        case 'link_to_page':
            return f'<a href="/posts/{get_slug(node['id'])}">链接</a>{sub}'
        case 'paragraph':
            return f'<p>{render_rich_text(content['rich_text'], id_to_slug)}</p>{sub}'
        case 'table_of_contents':
            return ''
        case 'divider':
            return '<hr/>'
        case 'heading_1':
            return f'<h1>{render_rich_text(content['rich_text'], id_to_slug)}</h1>{sub}'
        case 'heading_2':
            return f'<h2>{render_rich_text(content['rich_text'], id_to_slug)}</h2>{sub}'
        case 'heading_3':
            return f'<h3>{render_rich_text(content['rich_text'], id_to_slug)}</h3>{sub}'
        case _:
            print(f'unknown node type: {node["type"]}')
            return f'<p>{content}</p>{sub}'
            # raise ValueError(f"unknown node type: {node['type']}\n{node}")

def render_page(node: dict, id_to_slug: dict[str, str]) -> list[str]:
    return f'<html><head><link rel="stylesheet" type="text/css" href="notion.css"></head><body>{''.join(render_node(n, id_to_slug) for n in node['_children'])}</body></html>'
