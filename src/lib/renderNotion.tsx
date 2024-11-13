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
import remarkGfm from 'remark-gfm'

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

// export const NotionTitle = () => {
//   // console.log(children)
//   return (
//     <h3 className="notion-h notion-h2 notion-h-indent-0">
//       <div className="notion-header-anchor"></div>
//       <a className="notion-hash-link" title="114514">
//         <svg viewBox="0 0 16 16" width="16" height="16">
//           <path fill-rule="evenodd" d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z">
//           </path>
//         </svg>
//       </a>
//       <span className="notion-h-title">
//         标题标题
//       </span>
//     </h3>
//   )
// }