// used for code syntax highlighting (optional)
import 'prismjs/themes/prism-tomorrow.css'
// used for rendering equations (optional)
import 'katex/dist/katex.min.css'
import '@/styles/notion.css'

import * as React from 'react'
import type { MetaData, Page, PageNodeRoot } from "@/lib/pagetype"
import Link from 'next/link'
import Image from 'next/image'

// 渲染块级内容的组件
const BlockContent: React.FC<{ block: any }> = ({ block }) => {
    const { type } = block

    switch (type) {
        default:
            return <p>{JSON.stringify(block)}</p>
    }
}

// 主页面渲染组件
export const PageRoot: React.FC<{ metaData: MetaData, pageInfo: Page, root: PageNodeRoot }> =
    ({ metaData, pageInfo, root }) => {
        return (
            <article className="page sans">
                <header>
                    <h1 className="page-title">{pageInfo.Title}</h1>
                    <p className="page-description"></p>
                </header>
                <div className="page-body">
                    {root._children?.map((block) => (
                        <BlockContent block={block} />
                    ))}
                </div>
            </article>
        )
    }