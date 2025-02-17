export interface PageNode<T extends string, Y> {
    type: T,
    T: Y,
    id: string,
    _children?: PageNodeAny[],
}

export type PageNodeRoot = PageNode<'child_page', { title: string }>

export type PageNodeAny =
        PageNode<'child_page', { title: string }>
        | PageNode<'bulleted_list_item', { rich_text: RichText[], color: string }>
        | PageNode<'callout', { rich_text: RichText[], icon: { type: string, emoji: string }, color: string }>
        | PageNode<'code', { rich_text: RichText[], language: string, caption: RichText[] }>
        | PageNode<'column', object>
        | PageNode<'column_list', object>
        | PageNode<'divider', object>
        | PageNode<'emoji', { emoji: string }>
        | PageNode<'equation', { expression: string }>
        | PageNode<'file', { type: string, file: { url: string, expiry_time: string } }>
        | PageNode<'heading_1', { rich_text: RichText[], color: string, is_toggleable: boolean }>
        | PageNode<'heading_2', { rich_text: RichText[], color: string, is_toggleable: boolean }>
        | PageNode<'heading_3', { rich_text: RichText[], color: string, is_toggleable: boolean }>
        | PageNode<'image', { type: string, file: { url: string, expiry_time: string }, caption: RichText[] }>
        | PageNode<'link_to_page', { type: string, page_id: string }>
        | PageNode<'mention', { type: string, page: { id: string } }>
        | PageNode<'numbered_list_item', { rich_text: RichText[], color: string }>
        | PageNode<'page', { title: string }>
        | PageNode<'page_id', { title: string }>
        | PageNode<'paragraph', { rich_text: RichText[], color: string }>
        | PageNode<'table', { table_width: number, has_column_header: boolean, has_row_header: boolean }>
        | PageNode<'table_of_contents', { color: string }>
        | PageNode<'table_row', { cells: RichText[][] }>
        | PageNode<'text', { content: string, link: { url: string } | null }>

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

export type RichText = 
    (RichTextTextContent | RichTextMentionContent | RichTextEquationContent) & {
        annotations: {
            bold: boolean;
            italic: boolean;
            strikethrough: boolean;
            underline: boolean;
            code: boolean;
            color: string;
        };
        plain_text: string;
        href: string | null;
    }

export type RichTextTextContent = {
    type: 'text',
    text: {
        content: string;
        link: { url: string } | null;
    };
}

export type RichTextMentionContent = {
    type: 'mention',
    mention: {
        type: string;
        page: { id: string };
    };
}

export type RichTextEquationContent = {
    type: 'equation',
    equation: {
        expression: string;
    };
}
