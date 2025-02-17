import json
import os
from notionlib import *
from render import *

# 获取所有页面
print(config['ROOT_PAGE_ID'])
data = list(map(lambda x:x['properties'], get_database(config['ROOT_PAGE_ID'])))
for row in data:
    row['Tag'] = list(map(lambda x:x['name'], row['Tag']['multi_select']))
    row['Date'] = row['Date']['date']
    if row['Date']:
        row['Date'] = row['Date']['start']
    row['Status'] = row['Status']['status']['name']
    row['Slug'] = flattern_rich_test(row['Slug']['rich_text'])
    for i in row['Page']['title']:
        if i['type'] == 'mention':
            row['Page'] = i['mention']['page']['id']
            row['Title'] = i['plain_text']
            break
    else:
        row['Page'] = None
    if row['Slug'] == '' and row['Page']:
        row['Slug'] = row['Page']

pages = []
id_to_data = dict()
id_to_slug = dict()

for row in data:
    if row['Page'] and row['Status'] == '发布':
        sub_page = get_page_nodes(row['Page'])
        for p in sub_page:
            id_to_slug[p['id']] = p['id']
            id_to_data[p['id']] = { 'Slug': p['id'], 'Title': p['child_page']['title'] }
            pages.append(p)
        id_to_slug[row['Page']] = row['Slug']
        id_to_data[row['Page']] = row

if not os.path.exists('.notion_out'):
    os.makedirs('.notion_out')

with open(f'.notion_out/__meta_data__.json', 'w', encoding='utf-8') as f:
    slug_to_id = { v: k for k, v in id_to_slug.items() }
    if len(slug_to_id) != len(id_to_slug):
        raise ValueError('duplicate slug')
    json.dump({
        'slug_to_id': slug_to_id,
        'id_to_data': id_to_data
    }, f, indent=4, ensure_ascii=False)

for p in pages:
    with open(f'.notion_out/{id_to_slug[p["id"]]}.json', 'w', encoding='utf-8') as f:
        json.dump(p, f, indent=4, ensure_ascii=False)
