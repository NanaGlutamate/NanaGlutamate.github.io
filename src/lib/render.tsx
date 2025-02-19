// import 'prismjs/themes/prism-tomorrow.css'
import 'katex/dist/katex.min.css'
import '@/styles/notion.css'

import * as React from 'react'
import * as PageType from "@/lib/pagetype"
import Link from 'next/link'
import Image from 'next/image'
import katex from 'katex'

// 为每种块级内容定义专门的渲染组件类型
const rendererForBlock = new Map<string, React.FC<{ block: PageType.PageNodeAny, metaData: PageType.MetaData, index?: number }>>([
    // PageNodeRoot 是子节点时当做 link_to_page 处理
    ['child_page', ({ block, metaData }) => {
        const b = block as PageType.PageNodeRoot
        return <figure className="link-to-page">
            <Link href={`/posts/${metaData.id_to_data[b.id].Slug}`} className="mention">
                {metaData.id_to_data[b.id].Title}
            </Link>
        </figure>
    }],
    
    // PageNodeParagraph
    ['paragraph', ({ block, metaData }) => {
        const b = block as PageType.PageNodeParagraph
        return <p><RichTextArray texts={b.paragraph.rich_text} metaData={metaData} /></p>
    }],
    
    // PageNodeHeading1
    ['heading_1', ({ block, metaData }) => {
        const b = block as PageType.PageNodeHeading1
        return <h1><RichTextArray texts={b.heading_1.rich_text} metaData={metaData} /></h1>
    }],
    
    // PageNodeHeading2
    ['heading_2', ({ block, metaData }) => {
        const b = block as PageType.PageNodeHeading2
        return <h2><RichTextArray texts={b.heading_2.rich_text} metaData={metaData} /></h2>
    }],
    
    // PageNodeHeading3
    ['heading_3', ({ block, metaData }) => {
        const b = block as PageType.PageNodeHeading3
        return <h3><RichTextArray texts={b.heading_3.rich_text} metaData={metaData} /></h3>
    }],
    
    // PageNodeBulletedListItem
    ['bulleted_list_item', ({ block, metaData }) => {
        const b = block as PageType.PageNodeBulletedListItem
        return (
            <ul className="bulleted-list">
                <li style={{ listStyleType: 'disc' }}>
                    <RichTextArray texts={b.bulleted_list_item.rich_text} metaData={metaData} />
                </li>
            </ul>
        )
    }],
    
    // PageNodeNumberedListItem
    ['numbered_list_item', ({ block, metaData, index }) => {
        const b = block as PageType.PageNodeNumberedListItem
        return (
            <ol type="1" className="numbered-list" start={index}>
                <li>
                    <RichTextArray texts={b.numbered_list_item.rich_text} metaData={metaData} />
                </li>
            </ol>
        )
    }],
    
    // PageNodeDivider
    ['divider', () => <hr />],
    
    // PageNodeTableOfContents
    ['table_of_contents', () => <nav className="table_of_contents" />],
    
    // PageNodeCallout
    ['callout', ({ block, metaData, index }) => {
        // TODO: 第一个 callout 视为旁注
        const b = block as PageType.PageNodeCallout
        return (
            <figure className={`block-color-${b.callout.color} callout`} style={{ whiteSpace: 'pre-wrap', display: 'flex' }}>
                <div style={{ fontSize: '1.5em' }}>
                    <span className="icon">{b.callout.icon.emoji}</span>
                </div>
                <div style={{ width: '100%' }}>
                    <p>
                        <RichTextArray texts={b.callout.rich_text} metaData={metaData} />
                    </p>
                </div>
            </figure>
        )
    }],
    
    // PageNodeCode
    ['code', ({ block }) => {
        const b = block as PageType.PageNodeCode
        return (
            <pre className={`code language-${b.code.language.toLowerCase()}`}>
                <code className={`language-${b.code.language.toLowerCase()}`}>
                    {b.code.rich_text.map(t => t.plain_text).join('')}
                </code>
            </pre>
        )
    }],
    
    // PageNodeColumn
    ['column', ({ block, metaData }) => {
        const b = block as PageType.PageNodeColumn
        return <div className="column">{b._children?.map((c, i) => <BlockContent key={i} block={c} metaData={metaData} />)}</div>
    }],
    
    // PageNodeColumnList
    ['column_list', ({ block, metaData }) => {
        const b = block as PageType.PageNodeColumnList
        return (
            <div className="column-list">
                {b._children?.map((column, i) => (
                    <div key={i} className="column" style={{ width: `${100 / (b._children?.length || 1)}%` }}>
                        <BlockContent block={column} metaData={metaData} index={i} />
                    </div>
                ))}
            </div>
        )
    }],
    
    // PageNodeTable
    ['table', ({ block, metaData }) => {
        const b = block as PageType.PageNodeTable
        return (
            <table className="simple-table">
                <tbody>
                    {b._children?.map((row, i) => (
                        <tr key={i}>
                            {(row as PageType.PageNodeTableRow).table_row.cells.map((cell, j) => (
                                <td key={j}>
                                    <RichTextArray texts={cell} metaData={metaData} />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        )
    }],
    
    // PageNodeLinkToPage
    ['link_to_page', ({ block, metaData }) => {
        const b = block as PageType.PageNodeLinkToPage
        const pageData = metaData.id_to_data[b.link_to_page.page_id]
        if (!pageData) {
            return <figure className="link-to-page">
                <Link href="/">
                    <em className="highlight-gray">{"[未发布页面]"}</em>
                </Link>
            </figure>
        }
        return <figure className="link-to-page">
            <Link href={`/posts/${metaData.id_to_data[b.link_to_page.page_id].Slug}`} className="link-to-page">
                <span className="icon">📓</span>
                {metaData.id_to_data[b.link_to_page.page_id].Title}
            </Link>
        </figure>
    }],
    
    // PageNodeEmoji
    ['emoji', ({ block }) => {
        const b = block as PageType.PageNodeEmoji
        return <span className="emoji">{b.emoji.emoji}</span>
    }],
    
    // PageNodeEquation
    ['equation', ({ block }) => {
        const b = block as PageType.PageNodeEquation
        return <div className='equation-container'>
            <span className='katex-display' dangerouslySetInnerHTML={{ __html: katex.renderToString(b.equation.expression) }} />
        </div>
    }],
    
    // PageNodeImage
    ['image', ({ block, metaData }) => {
        const b = block as PageType.PageNodeImage
        return (
            <figure className="image">
                <Image src={`/collected/${b.image.file.url}`} width={100} height={100} alt={b.image.caption.map(c => c.plain_text).join('')} />
                {b.image.caption.length > 0 && (
                    <figcaption>
                        <RichTextArray texts={b.image.caption} metaData={metaData} />
                    </figcaption>
                )}
            </figure>
        )
    }],
    
    // PageNodeFile
    ['file', ({ block }) => {
        const b = block as PageType.PageNodeFile
        return <a href={`/collected/${b.file.file.url}`} className="file-link">📎 下载文件</a>
    }],
    
    // PageNodeTableRow
    ['table_row', ({ block, metaData }) => {
        const b = block as PageType.PageNodeTableRow
        return (
            <tr>
                {b.table_row.cells.map((cell, i) => (
                    <td key={i}>
                        <RichTextArray texts={cell} metaData={metaData} />
                    </td>
                ))}
            </tr>
        )
    }],
]);

// 渲染富文本内容的组件
const RichTextContent: React.FC<{ text: PageType.RichText, metaData: PageType.MetaData }> = ({ text, metaData }) => {
    // 处理原始文本中的换行符
    let content: React.ReactNode = text.plain_text
        .split('\n')
        .flatMap((line, i, arr) => [
            line,
            i < arr.length - 1 && <br key={`br-${i}`} />
        ])
        .filter(Boolean);

    // 处理不同类型的内容
    if (text.type === 'equation') {
        content = <span dangerouslySetInnerHTML={{ 
            __html: katex.renderToString(text.equation.expression) 
        }} />
    } else if (text.type === 'mention' && text.mention.type === 'page') {
        content = <Link href={`/posts/${metaData.id_to_data[text.mention.page.id].Slug}`}>{text.plain_text}</Link>
    } else if (text.type === 'text' && text.text.link) {
        content = <Link href={text.text.link.url}>{text.plain_text}</Link>
    }

    // 应用文本样式
    if (text.annotations.code) {
        content = <code>{content}</code>
    }
    if (text.annotations.bold) {
        content = <strong>{content}</strong>
    }
    if (text.annotations.italic) {
        content = <em>{content}</em>
    }
    if (text.annotations.strikethrough) {
        content = <del>{content}</del>
    }
    if (text.annotations.underline) {
        content = <span style={{ borderBottom: '0.05em solid' }}>{content}</span>
    }
    if (text.annotations.color !== 'default') {
        content = <mark className={`highlight-${text.annotations.color}`}>{content}</mark>
    }

    return <>{content}</>
}

// 渲染富文本数组的组件
const RichTextArray: React.FC<{ texts: PageType.RichText[], metaData: PageType.MetaData }> = ({ texts, metaData }) => {
    // 内容为空时返回空格
    if (texts.length === 0) {
        return <> </>
    }
    return <>{texts.map((text, i) => <RichTextContent key={i} text={text} metaData={metaData} />)}</>
}

// 渲染块级内容的组件
const BlockContent: React.FC<{ block: PageType.PageNodeAny, metaData: PageType.MetaData, index?: number }> = ({ block, metaData, index }) => {
    const renderer = rendererForBlock.get(block.type)
    const content = renderer ? renderer({ block, metaData, index }) : <p>{JSON.stringify(block)}</p>

    // 如果有子节点且当前块不是特殊处理子节点的类型（如 column_list、table 等）
    if (block._children && !['column_list', 'table'].includes(block.type)) {
        return (
            <>
                {content}
                <div className="indented">
                    {block._children.map((child, i) => (
                        <BlockContent key={i} block={child} metaData={metaData} index={i} />
                    ))}
                </div>
            </>
        )
    }

    return content
}

// 主页面渲染组件
export const PageRoot: React.FC<{ metaData: PageType.MetaData, pageInfo: PageType.Page, root: PageType.PageNodeRoot }> =
    ({ metaData, pageInfo, root }) => {
        return (
            <article className="page sans">
                <header>
                    <h1 className="page-title">{pageInfo.Title}</h1>
                    <p className="page-description">{JSON.stringify(metaData)}</p>
                </header>
                <div className="page-body">
                    {root._children?.map((block, i) => (
                        <BlockContent key={i} block={block} metaData={metaData} index={i} />
                    ))}
                </div>
            </article>
        )
    }