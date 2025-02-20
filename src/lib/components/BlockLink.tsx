import 'katex/dist/katex.min.css'
import '@/styles/notion.css'

import * as React from 'react'
import Link from 'next/link'

export const BlockLink: React.FC<{
    url: string,
    desc: string,
}> = ({ url, desc }) => {
    return (
        <Link href={url}>
            <figure className="block-link">
                <p>{desc}</p>
            </figure>
        </Link>
    )
}
