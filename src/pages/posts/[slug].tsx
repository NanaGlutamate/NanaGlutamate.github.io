import * as fs from "fs/promises"
import * as notion from "@/lib/renderNotion"
import { ExtendedRecordMap } from 'notion-types'
import type {
  InferGetStaticPropsType,
  GetStaticProps,
  GetStaticPaths,
} from 'next'

const slugContentMap = new Map<string, string>()

export const getStaticPaths: GetStaticPaths = async () => {
  const rawFilePath = await fs.readdir("./raw/posts", { recursive: true })
  return {
    paths: [
      {
        params: {
          slug: 'test-page',
          id: '13b67c975f5a80dd8c0ad745cf34f8a1'
        },
      },
    ],
    fallback: 'blocking'
  }
}

export const getStaticProps: GetStaticProps<
  { rm: ExtendedRecordMap },
  { slug: string, id: string }
> = async ({ params }) => {
  return { props: { rm: await notion.getRecordMap('13b67c975f5a80dd8c0ad745cf34f8a1') } }
}

export default function Page({
  rm
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return notion.renderNotionPage(rm)
}

// import * as fs from "fs/promises"
// import * as notion from "@/lib/renderNotion"
// import { ExtendedRecordMap } from 'notion-types'
// import * as React from 'react'
// import { NotionAPI } from 'notion-client'
// import { Notion } from '@/lib/notionComponent'

// // function Blog({ res, id }: { res: string, id: string }) {
// //   // Render posts...
// //   return <h1 className="list-inside list-decimal text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">{res}, {id}</h1>
// // }

// // export async function getStaticPaths() {
// //   const rawFilePath = await fs.readdir("./raw/posts", { recursive: true })
// //   return {
// //     paths: [
// //       { params: { title: '1' } },
// //       { params: { title: '2' } },
// //       { params: { title: '3' } },
// //     ],
// //     fallback: false,
// //   }
// // }

// // export async function getStaticProps({ params }: { params: { title: string } }) {
// //   const res = await fs.readFile("./raw/posts.json", { encoding: 'utf-8' })
// //   return {
// //     props: {
// //       res: res,
// //       id: params.title,
// //     }
// //   }
// // }
// export const dynamicParams = false

// export async function generateStaticParams() {
//   const rm = await notion.getRecordMap("13b67c975f5a80dd8c0ad745cf34f8a1")
//   return [
//     {
//       slug: 'test1',
//       rm: rm
//     }
//   ]
// }

// export default async function Page({
//   params
// }: {
//   params: Promise<{
//     slug: string,
//     rm: ExtendedRecordMap
//   }>
// }) {
//   const value = await params
//   console.log(value)
//   return <Notion rm={value.rm}/>
//   // const value = await params
//   // const [open, setOpen] = React.useState(false)
//   // return (
//   //   <div>
//   //     {/* <h1 onClick={() => setOpen(!open)}>114514 {open}</h1> */}
//   //     {/* <NotionRenderer
//   //       recordMap={value.rm}
//   //       components={{
//   //         nextImage: Image,
//   //         nextLink: Link,
//   //         Code,
//   //         Collection,
//   //         Equation,
//   //         Modal,
//   //         Pdf,
//   //       }}
//   //       fullPage={false}
//   //     /> */}
//   //     {/* {
//   //       render.renderNotionPage(value.rm)
//   //     } */}
//   //   </div>
//   // )
// }
