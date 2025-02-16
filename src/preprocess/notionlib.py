from notion_client import Client
from functools import cache
import os
import json

class PageCache:
    def __init__(self):
        self.cache = dict()
        # 加载磁盘缓存
        if not os.path.exists('.notion_cache'):
            os.makedirs('.notion_cache')
        for cache_file in os.listdir('.notion_cache'):
            if not cache_file.endswith('.json'):
                continue
            with open('.notion_cache/' + cache_file, 'r') as f:
                key = cache_file.replace('.json', '')
                self.cache[key] = json.load(f)

    def get_cache(self, key: str):
        if key not in self.cache:
            return None
        return self.cache[key]

    def set_cache(self, key: str, value: any):
        self.cache[key] = value
        with open(f'.notion_cache/{key}.json', 'w') as f:
            json.dump(self.cache[key], f, indent=4)

# 从.env.local文件直接读取NOTION_TOKEN
config = dict()
with open('.env.local', 'r') as f:
    for line in f:
        k, v = line.strip().split('=')
        config[k] = v
notion = Client(auth=config['NOTION_TOKEN'])

def clip_block(block: dict):
    if 'created_time' in block: del block['created_time']
    if 'created_by' in block: del block['created_by']
    if 'last_edited_by' in block: del block['last_edited_by']
    if 'archived' in block: del block['archived']
    if 'in_trash' in block: del block['in_trash']
    if 'parent' in block: del block['parent']
    if 'object' in block: del block['object']

# cached notion APIs
@cache
def get_block(block_id: str):
    block = notion.blocks.retrieve(block_id=block_id)
    clip_block(block)
    return block

@cache
def get_block_children(id: str):
    res = notion.blocks.children.list(block_id=id)
    ans = res["results"]
    while res["has_more"]:
        res = notion.blocks.children.list(block_id=id, start_cursor=res["next_cursor"])
        ans.extend(res["results"])
    for i in ans:
        clip_block(i)
    return ans

@cache
def get_database_data(id: str):
    res = notion.databases.query(database_id=id)
    ans = res["results"]
    while res["has_more"]:
        res = notion.databases.query(database_id=id, start_cursor=res["next_cursor"])
        ans.extend(res["results"])
    return ans

class TreeCache:
    def __init__(self):
        self.cache = PageCache()
        self.id_to_node = dict()
        self.modified_pg_to_id = dict()

        def dfs(node: dict, pg_id: str):
            if '_children' in node:
                for i in node['_children']:
                    dfs(i, pg_id)
            if 'id' in node:
                self.id_to_node[node['id'], pg_id] = node
        for pg_id, pg_node in self.cache.cache.items():
            dfs(pg_node, pg_id)

    def flush_node_if_need(self, id: str, pg_id: str, new_value: dict | None = None):
        """
            will not write file cache; return if modified
        """
        if new_value is None:
            new_value = get_block(id)
        if (id, pg_id) not in self.id_to_node:
            # insert new node
            if id != pg_id:
                assert self.id_to_node[pg_id, pg_id]['type'] == 'child_page'
            else:
                assert new_value['type'] == 'child_page'
            self.id_to_node[id, pg_id] = new_value
        elif self.id_to_node[id, pg_id]['last_edited_time'] == new_value['last_edited_time']:
            # cache hit
            return False
        else:
            # cache miss
            for k in self.id_to_node[id, pg_id]:
                del self.id_to_node[id, pg_id][k]
            for k, v in new_value.items():
                self.id_to_node[id, pg_id][k] = v
                
        # mark dirty
        if pg_id not in self.modified_pg_to_id:
            self.modified_pg_to_id[pg_id] = [id]
        else:
            self.modified_pg_to_id[pg_id].append(id)
        
        new_value = self.id_to_node[id, pg_id]
        # leaf sub-page, return
        if new_value['type'] == 'child_page' and new_value['id'] != pg_id:
            return True

        # update children if cache miss or insert new node
        if new_value['has_children']:
            new_value['_children'] = []
            for i in get_block_children(new_value['id']):
                child_id = i['id']
                self.flush_node_if_need(child_id, pg_id, i)
                if i['type'] == 'child_page':
                    self.flush_node_if_need(child_id, child_id, { k: v for k, v in i.items() })
                new_value['_children'].append(self.id_to_node[child_id, pg_id])
        return True

    def get_node(self, id: str, pg_id: str):
        if self.flush_node_if_need(id, pg_id):
            self.__write_cache()
        return self.id_to_node[id, pg_id]

    def __write_cache(self):
        for k, v in self.modified_pg_to_id.items():
            print(f"cache miss in page[{k}]: {v}")
            self.cache.set_cache(k, self.id_to_node[k, k])
        self.modified_pg_to_id.clear()

tree_cache = TreeCache()
db_cache = PageCache()

def get_page_nodes(root: str) -> list[dict]:
    root = tree_cache.get_node(root, root)
    ans = [root]
    def dfs(node: dict):
        nonlocal ans
        if '_children' in node:
            for i in node['_children']:
                if i['type'] == 'child_page':
                    id = i['id']
                    ans += get_page_nodes(id)
                dfs(i)
    dfs(root)
    return ans

def get_database(root: str):
    root = get_block(block_id=root)
    if root['type'] != 'child_database':
        raise ValueError(f"root is not a database: {root}")
    
    cache = db_cache.get_cache(root['id'])
    if cache is not None and cache['last_edited_time'] == root['last_edited_time']:
        return cache['data']
    print(f"DB cache miss: {root['id']}")    
    ans = get_database_data(root['id'])
    db_cache.set_cache(root['id'], {'last_edited_time': root['last_edited_time'], 'data': ans})
    return ans
