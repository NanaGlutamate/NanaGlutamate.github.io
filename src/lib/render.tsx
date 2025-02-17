// used for code syntax highlighting (optional)
import 'prismjs/themes/prism-tomorrow.css'
// used for rendering equations (optional)
import 'katex/dist/katex.min.css'

import * as React from 'react'
import type { MetaData, Page, PageNodeRoot } from "@/lib/pagetype"

export const PageRoot: React.FC<{ metaData: MetaData, pageInfo: Page, root: PageNodeRoot }> = ({ metaData, pageInfo, root }) => {
    return <p>{ JSON.stringify(pageInfo) }</p>
}