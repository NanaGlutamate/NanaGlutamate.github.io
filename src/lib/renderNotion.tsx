// core styles shared by all of react-notion-x (required)
import '@/styles/notionx.css'
// used for code syntax highlighting (optional)
import 'prismjs/themes/prism-tomorrow.css'
// used for rendering equations (optional)
import 'katex/dist/katex.min.css'

import * as React from 'react'
import { NotionRenderer } from 'react-notion-x'
import { ExtendedRecordMap } from 'notion-types'
import { NotionAPI } from 'notion-client'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const Code = dynamic(() =>
    import('react-notion-x/build/third-party/code').then((m) => m.Code)
)

const Collection = dynamic(() =>
    import('react-notion-x/build/third-party/collection').then(
        (m) => m.Collection
    )
)

const Equation = dynamic(() =>
    import('react-notion-x/build/third-party/equation').then((m) => m.Equation)
)

const Pdf = dynamic(
    () => import('react-notion-x/build/third-party/pdf').then((m) => m.Pdf),
    {
        ssr: false
    }
)

const Modal = dynamic(
    () => import('react-notion-x/build/third-party/modal').then((m) => m.Modal),
    {
        ssr: false
    }
)

const api = new NotionAPI({ authToken: process.env.NOTION_TOKEN })

export const getRecordMap = async (id: string) => api.getPage(id)

export function renderNotionPage(rm: ExtendedRecordMap) {
    return <NotionRenderer
        recordMap={rm}
        components={{
            nextImage: Image,
            nextLink: Link,
            Code,
            Collection,
            Equation,
            Modal,
            Pdf,
        }}
        fullPage={false}
    />
}
