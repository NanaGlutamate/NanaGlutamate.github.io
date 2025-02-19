import * as fs from "fs/promises"
import type { MetaData, Page } from "@/lib/pagetype"
import Link from 'next/link'
import type { Metadata } from 'next'
 
export const metadata: Metadata = {
  title: '文章目录',
}

export default async function Page() {
    const metaData: MetaData = JSON.parse(await fs.readFile('./.notion_out/__meta_data__.json', 'utf-8'))
    return (
        <>
            {Object.values(metaData.id_to_data).map((page) => (
                <Link href={`/posts/${page.Slug}`} key={page.Slug}>
                    <h2>{page.Title}</h2>
                    <p>{JSON.stringify(page)}</p>
                </Link>
            ))}
        </>
    )
}
