export interface FileInfo {
    slug: string,
    dir: Array<string>,
    type: "notion" | "mdx",
}

export interface HeaderInfo {
    title: string,
    date: string,
    lastUpdate?: string,
    desc?: string,
    tags: Array<string>,
    state: "初始" | "草稿" | "归档" | "搁置" | "定稿" | "过期",
}

export interface NotionPageInfo extends FileInfo, HeaderInfo {
    type: "notion",

    notionId: string,
}

export interface MDXPageInfo extends FileInfo {
    type: "mdx",

    source: string,
}

export function isNotion(info: FileInfo): info is NotionPageInfo {
    return info.type == "notion";
}

export function isMDX(info: FileInfo): info is MDXPageInfo {
    return info.type == "mdx";
}
