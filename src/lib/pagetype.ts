export type PageNode<T> = T extends { [K in keyof T]: infer Y } ? {
    type: keyof T,
    id: string,
    _children?: PageNodeAny[],
} & T : never

export type PageNodeRoot = PageNode<{ child_page: { title: string } }>
export type PageNodeParagraph = PageNode<{ 'paragraph': { rich_text: RichText[], color: string } }>;
export type PageNodeHeading1 = PageNode<{ 'heading_1': { rich_text: RichText[], color: string, is_toggleable: boolean } }>;
export type PageNodeHeading2 = PageNode<{ 'heading_2': { rich_text: RichText[], color: string, is_toggleable: boolean } }>;
export type PageNodeHeading3 = PageNode<{ 'heading_3': { rich_text: RichText[], color: string, is_toggleable: boolean } }>;
export type PageNodeBulletedListItem = PageNode<{ 'bulleted_list_item': { rich_text: RichText[], color: string } }>;
export type PageNodeNumberedListItem = PageNode<{ 'numbered_list_item': { rich_text: RichText[], color: string } }>;
export type PageNodeDivider = PageNode<{ 'divider': object }>;
export type PageNodeTableOfContents = PageNode<{ 'table_of_contents': { color: string } }>;
export type PageNodeCallout = PageNode<{ 'callout': { rich_text: RichText[], icon: { type: string, emoji: string }, color: string } }>;
export type PageNodeCode = PageNode<{ 'code': { rich_text: RichText[], language: string, caption: RichText[] } }>;
export type PageNodeColumn = PageNode<{ 'column': object }>;
export type PageNodeColumnList = PageNode<{ 'column_list': object }>;
export type PageNodeTable = PageNode<{ 'table': { table_width: number, has_column_header: boolean, has_row_header: boolean } }>;
export type PageNodeLinkToPage = PageNode<{ 'link_to_page': { page_id: string } }>;
export type PageNodeEmoji = PageNode<{ 'emoji': { emoji: string } }>;
export type PageNodeEquation = PageNode<{ 'equation': { expression: string } }>;
export type PageNodeImage = PageNode<{ 'image': { file: { url: string }, caption: RichText[] } }>;
export type PageNodeFile = PageNode<{ 'file': { file: { url: string } } }>;
export type PageNodeTableRow = PageNode<{ 'table_row': { cells: RichText[][] } }>;

export type PageNodeAny = PageNodeRoot
    | PageNodeParagraph
    | PageNodeHeading1
    | PageNodeHeading2
    | PageNodeHeading3
    | PageNodeBulletedListItem
    | PageNodeNumberedListItem
    | PageNodeDivider
    | PageNodeTableOfContents
    | PageNodeCallout
    | PageNodeCode
    | PageNodeColumn
    | PageNodeColumnList
    | PageNodeTable
    | PageNodeLinkToPage
    | PageNodeEmoji
    | PageNodeEquation
    | PageNodeImage
    | PageNodeFile
    | PageNodeTableRow

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
