import * as fs from "fs/promises"
import type { MetaData, Page, PageNodeRoot } from "@/lib/pagetype"
import type {
    InferGetStaticPropsType,
    GetStaticProps,
    GetStaticPaths,
} from 'next'
import { PageRoot } from "@/lib/render"

const assert = (expr: boolean) => {
    if (!expr) {
        throw new Error('assertion failed')
    }
}

export const getStaticPaths: GetStaticPaths = async () => {
    const metaData: MetaData = JSON.parse(await fs.readFile('./.notion_out/__meta_data__.json', 'utf-8'))
    return {
        paths: Object.keys(metaData.slug_to_id).map(slug => ({ params: { slug } })),
        fallback: false
    }
}

export const getStaticProps: GetStaticProps<
    { metaData: MetaData, pageInfo: Page, root: PageNodeRoot },
    { slug: string }
> = async ({ params }) => {
    if (typeof params == 'undefined') {
        throw new Error('no param')
    }
    const metaData: MetaData = JSON.parse(await fs.readFile('./.notion_out/__meta_data__.json', 'utf-8'))
    const { slug } = params
    const id = metaData.slug_to_id[slug]
    if (typeof id == 'undefined') {
        throw new Error('no id')
    }
    const pageInfo = metaData.id_to_data[id]
    if (typeof pageInfo == 'undefined') {
        throw new Error('no page info')
    }
    return {
        props: {
            metaData,
            pageInfo,
            root: JSON.parse(await fs.readFile(`./.notion_out/${slug}.json`, 'utf-8')) as PageNodeRoot,
        }
    }
}

export default function Page(data: InferGetStaticPropsType<typeof getStaticProps>) {
    return (
        <PageRoot metaData={ data.metaData } pageInfo={ data.pageInfo } root={ data.root } />
    )
}
