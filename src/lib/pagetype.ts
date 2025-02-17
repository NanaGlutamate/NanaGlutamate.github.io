export interface PageNode<T extends string> {
    type: T,
    T: any,
    id: string,
    _children?: PageNodeAny[],
}

export type PageNodeRoot = PageNode<'child_page'>

export type PageNodeAny =
        PageNode<'child_page'>
        | PageNode<'bulleted_list_item'>
        | PageNode<'callout'>
        | PageNode<'child_page'>
        | PageNode<'code'>
        | PageNode<'column'>
        | PageNode<'column_list'>
        | PageNode<'divider'>
        | PageNode<'emoji'>
        | PageNode<'equation'>
        | PageNode<'file'>
        | PageNode<'heading_1'>
        | PageNode<'heading_2'>
        | PageNode<'heading_3'>
        | PageNode<'image'>
        | PageNode<'link_to_page'>
        | PageNode<'mention'>
        | PageNode<'numbered_list_item'>
        | PageNode<'page'>
        | PageNode<'page_id'>
        | PageNode<'paragraph'>
        | PageNode<'table'>
        | PageNode<'table_of_contents'>
        | PageNode<'table_row'>
        | PageNode<'text'>

export type MetaData = {
    slug_to_id: { [key: string]: string },
    id_to_data: { [key: string]: Page },
}

export interface Page {
    Slug: string,
    Title: string,
    Tag?: string[],
    Date?: string,
    Status?: string,
    Page?: string,
}
