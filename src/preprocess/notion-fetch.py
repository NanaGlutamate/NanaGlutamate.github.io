import json
import os
from notionlib import *
from render import *

# 获取所有页面
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
            id_to_data[p['id']] = dict()
            pages.append(p)
        id_to_slug[row['Page']] = row['Slug']
        id_to_data[row['Page']] = row

if not os.path.exists('.notion_log'):
    os.makedirs('.notion_log')

with open('.notion_log/database.json', 'w') as f:
    json.dump(data, f, indent=4)
with open('.notion_log/pages.json', 'w') as f:
    json.dump([{ 'content': p, **id_to_data[p['id']] } for p in pages], f, indent=4)
