import * as fs from "fs/promises"
import type { MetaData, Page, PageNodeRoot } from "@/lib/pagetype"
import { PageRoot } from "@/lib/render"
import * as Next from 'next'

export async function generateStaticParams() {
    const metaData: MetaData = JSON.parse(await fs.readFile('./.notion_out/__meta_data__.json', 'utf-8'))
    return Object.keys(metaData.slug_to_id).map((slug) => ({ slug }))
}

export default async function Page({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    if (typeof params == 'undefined') {
        throw new Error('no param')
    }
    const metaData: MetaData = JSON.parse(await fs.readFile('./.notion_out/__meta_data__.json', 'utf-8'))
    const { slug } = await params
    const id = metaData.slug_to_id[slug] ?? (() => { throw new Error('no id') })()
    const pageInfo = metaData.id_to_data[id] ?? (() => { throw new Error('no page info') })()
    const root = JSON.parse(await fs.readFile(`./.notion_out/${slug}.json`, 'utf-8')) as PageNodeRoot
    return (
        <PageRoot metaData={metaData} pageInfo={pageInfo} root={root} />
    )
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>
}): Promise<Next.Metadata> {
    if (typeof params == 'undefined') {
        throw new Error('no param')
    }
    const { slug } = await params
    const metaData: MetaData = JSON.parse(await fs.readFile('./.notion_out/__meta_data__.json', 'utf-8'))
    const id = metaData.slug_to_id[slug] ?? (() => { throw new Error('no id') })()
    const pageInfo = metaData.id_to_data[id] ?? (() => { throw new Error('no page info') })()
    return {
        title: "文章 / " + pageInfo.Title,
        keywords: pageInfo.Tag,
        icons: '/favicon.ico',
    }
}
