import 'katex/dist/katex.min.css'
import '@/styles/notion.css'

import * as React from 'react'
import * as PageType from "@/lib/pagetype"
import { CodeBlock } from '@/lib/components/CodeBlock'
import Link from 'next/link'
import Image from 'next/image'
import katex from 'katex'

// 为每种块级内容定义专门的渲染组件类型
const rendererForBlock = new Map<
    string,
    React.FC<{ 
        block: PageType.PageNodeAny,
        metaData: PageType.MetaData, 
        index: number,
        groupIndex: number
    }
>>([
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
    ['numbered_list_item', ({ block, metaData, groupIndex }) => {
        const b = block as PageType.PageNodeNumberedListItem
        return (
            <ol type="1" className="numbered-list" start={groupIndex + 1}>
                <li>
                    <RichTextArray texts={b.numbered_list_item.rich_text} metaData={metaData} />
                </li>
            </ol>
        )
    }],
    
    // PageNodeDivider
    ['divider', () => <hr />],
    
    // PageNodeTableOfContents
    ['table_of_contents', () => <div />],
    
    // PageNodeCallout
    ['callout', ({ block, metaData }) => {
        // TODO: 第一个 callout 视为旁注
        const b = block as PageType.PageNodeCallout
        return (
            <figure className={`block-color-${b.callout.color} callout`} style={{ whiteSpace: 'pre-wrap', display: 'flex' }}>
                <div style={{ width: '100%' }}>
                    <p>
                        <RichTextArray texts={b.callout.rich_text} metaData={metaData} />
                    </p>
                </div>
            </figure>
        )
    }],
    
    // PageNodeCode
    ['code', ({ block }) => <CodeBlock block={block} />],
    
    // PageNodeColumn
    ['column', () => {
        throw new Error('column should always be a child of column_list')
    }],
    
    // PageNodeColumnList
    ['column_list', ({ block, metaData }) => {
        const b = block as PageType.PageNodeColumnList
        return (
            <div className="column-list">
                {b._children?.map((column, i) => {
                    if (column.type !== 'column') {
                        throw new Error('column should always be a child of column_list')
                    }
                    const b = column as PageType.PageNodeColumn
                    return (
                        <div className="column" key={i}>
                            {b._children?.map((c, i) => < key={i} block={c} metaData={metaData} />)}
                        </div>
                    )
                })}
            </div>
        )
    }],
    
    // PageNodeTable
    ['table', ({ block, metaData }) => {
        if (block.type !== 'table') {
            throw new Error('table should always be a child of table_row')
        }
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
                <Image src={`/collected/${b.image.file.url}`}
                    width={metaData.img_to_wh[b.image.file.url].width}
                    height={metaData.img_to_wh[b.image.file.url].height}
                    alt={b.image.caption.map(c => c.plain_text).join('')} />
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
        const fileName = b.file.file.url.split('_', 2)[1]
        return (
            <a href={`/collected/${b.file.file.url}`} className="file-link">
                <figure className="file">
                    <p>附件：{fileName}</p>
                </figure>
            </a>
        )
    }],
    
    // PageNodeTableRow
    ['table_row', () => {
        throw new Error('table_row should always be a child of table')
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
        content = <code className="inline">{content}</code>
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
const BlockContent: React.FC<{
    block: PageType.PageNodeAny,
    metaData: PageType.MetaData,
    index: number,
    groupIndex: number
}> = ({ block, metaData, index }) => {
    const renderer = rendererForBlock.get(block.type) ?? (() => <p>{JSON.stringify(block)}</p>)
    const content = renderer({ block, metaData, index, groupIndex }) as React.ReactNode

    // 如果有子节点且当前块不是特殊处理子节点的类型（如 column_list、table 等）
    if (block._children && !['column_list', 'table'].includes(block.type)) {
        const groupedChildren = block._children.reduce((groupedChildren, child) => {
            const lastType = groupedChildren[groupedChildren.length - 1]
            if (lastType === child.type) {
                groupedChildren[groupedChildren.length - 1].push(child)
            } else {
                groupedChildren.push([child])
            }
        }, [])
        return (
            <>
                {content}
                <div className="indented">
                    {groupedChildren.flatMap((group, i) => {
                        const preLength = groupedChildren.slice(0, i).reduce((ans, i) => ans + i, 0)
                        return group.map((child, j) => (
                            <BlockContent key={preLength + j} block={child} metaData={metaData} index={preLength + j} groupIndex={j} />
                        ))
                     })}
                </div>
            </>
        )
    }

    return content
}

const PageDescription: React.FC<{ pageData: PageType.Page }> = ({ pageData }) => {
    return <p className="page-description">{JSON.stringify(pageData)}</p>
}

// 主页面渲染组件
export const PageRoot: React.FC<{ metaData: PageType.MetaData, pageInfo: PageType.Page, root: PageType.PageNodeRoot }> =
    ({ metaData, pageInfo, root }) => {
        return (
            <article className="page sans">
                <header>
                    <h1 className="page-title">{pageInfo.Title}</h1>
                    <PageDescription pageData={metaData.id_to_data[root.id]} />
                </header>
                <div className="page-body">
                    {root._children?.map((block, i) => (
                        < key={i} block={block} metaData={metaData} index={i} />
                    ))}
                </div>
            </article>
        )
    }
