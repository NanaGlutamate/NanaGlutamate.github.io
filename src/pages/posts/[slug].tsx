import * as fs from "fs/promises"
import * as notion from "@/lib/renderNotion"
import { ExtendedRecordMap } from 'notion-types'
import type {
    InferGetStaticPropsType,
    GetStaticProps,
    GetStaticPaths,
} from 'next'
import {
    FileInfo,
    HeaderInfo,
    NotionPageInfo,
    MDXPageInfo,
    isMDX,
} from '@/lib/pagetype'
import { MDXRemote } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import type { CompileMDXResult, MDXRemoteSerializeResult } from 'next-mdx-remote/rsc'
import { PageHeader } from '@/lib/view/PageHeader'
import { JSXElementConstructor, ReactElement } from "react"

const postDir = "./raw/posts/"

const assert = (expr: boolean) => {
    if (!expr) {
        throw new Error('assertion failed')
    }
}

const processNotion = async (path: string[], content: string): Promise<NotionPageInfo> => {
    const info = JSON.parse(content) as HeaderInfo & { notionId: string }
    return {
        ...info,
        slug: path[path.length - 1],
        dir: path.slice(0, path.length - 1),
        type: "notion",
    }
}

const processMDX = async (path: string[], content: string): Promise<MDXPageInfo> => {
    return {
        slug: path[path.length - 1],
        dir: path.slice(0, path.length - 1),
        type: "mdx",
        source: content,
    }
}

/**
 * load file to slugContentMap, and then returns slug of file
 * @param relativePath path from /raw to target file
 * @returns [slug of file, content]
 */
const loadFile = async (
    relativePath: string
): Promise<NotionPageInfo | MDXPageInfo> => {
    const path = relativePath.split('/').flatMap((s) => s.split('\\'))

    const filePath = postDir + relativePath
    const fileName = path[path.length - 1]
    const fileType = fileName.slice(fileName.lastIndexOf('.') + 1)
    
    const fileContent = (await fs.readFile(filePath, { encoding: 'utf-8' })).toString()

    if (fileType == 'mdx' || fileType == 'md') {
        return await processMDX(path, fileContent)
    } else if (fileType == 'json') {
        return await processNotion(path, fileContent)
    } else {
        throw new Error(`unknown type of file: ${fileName}`)
    }
}

export const getStaticPaths: GetStaticPaths = async () => {
    const slugs = (await fs.readdir(postDir, { recursive: true }))
            // file only, filter out dirs
            .filter((value) => value.includes('.'))
            // get slug and file path
            .map((value) => {
                const path = value.split('/').flatMap((s) => s.split('\\'))
                const fileName = path[path.length - 1]
                return {
                    params: {
                        slug: fileName.slice(0, fileName.lastIndexOf('.'))
                    }
                }
            })
    return {
        paths: slugs,
        fallback: false
    }
}

const getHeaderFromFrontMatter = (fileInfo: FileInfo, frontmatter: Record<string, unknown>): HeaderInfo & FileInfo => {
    const date = frontmatter.date ? frontmatter.date as string : ""
    return {
        ...fileInfo,
        title: frontmatter.title ? frontmatter.title as string : "",
        date: date,
        lastUpdate: (frontmatter.lastUpdate ? frontmatter.lastUpdate : date) as string,
        desc: frontmatter.desc ? frontmatter.desc as string : "",
        tags: frontmatter.tags ? (frontmatter.tags as string).split(',') : [],
        state: frontmatter.state ? frontmatter.state as ("初始" | "草稿" | "归档" | "搁置" | "定稿" | "过期") : "归档",
    }
}

export const getStaticProps: GetStaticProps<
    { info: HeaderInfo & FileInfo } & ({ rm: ExtendedRecordMap } | { mdx: MDXRemoteSerializeResult }),
    { slug: string }
> = async ({ params }) => {
    if (typeof params == 'undefined') {
        throw new Error('no param')
    }

    const filePaths = (await fs.readdir(postDir, { recursive: true }))
            .filter((v) => v.includes(params.slug))
    assert(filePaths.length == 1)
    
    const pageInfo = await loadFile(filePaths[0])
    if (isMDX(pageInfo)) {
        const compiled = await serialize(pageInfo.source, { parseFrontmatter: true })
        return {
            props: {
                mdx: compiled,
                info: getHeaderFromFrontMatter(pageInfo, compiled.frontmatter),
            }
        }
    }
    return {
        props: {
            rm: await notion.getRecordMap(pageInfo.notionId),
            info: pageInfo
        }
    }
    // rm: await notion.getRecordMap('13b67c975f5a80dd8c0ad745cf34f8a1')
}

export default function Page(data: InferGetStaticPropsType<typeof getStaticProps>) {
    return (
        <>
            <PageHeader info={ data.info } />
            { ('rm' in data) ? notion.renderNotionPage(data.rm) : <MDXRemote { ...data.mdx }/> }
        </>
    )
}
