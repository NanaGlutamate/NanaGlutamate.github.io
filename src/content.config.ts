import { defineCollection } from 'astro:content'
import { z } from 'astro/zod'
import { execSync } from 'child_process'

const posts = defineCollection({
  loader: async () => {
      const stdout = execSync('python scripts/fetch-posts.py', {
      cwd: process.cwd(),
      stdio: ['inherit', 'pipe', 'inherit'],
      encoding: 'utf-8',
    })
    const posts = JSON.parse(stdout) as PostData[]
    return posts.map((post) => ({ id: post.slug, ...post }))
  },
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    date: z.string().nullable(),
    series: z.string().nullable(),
    tags: z.array(z.object({ name: z.string(), color: z.string() })),
    status: z.string(),
    summary: z.string(),
    blocks: z.array(z.any()),
    sub_pages: z.array(z.object({ title: z.string(), page_id: z.string(), slug: z.string() })).optional(),
  }),
})

type PostData = z.infer<typeof posts.schema>

export const collections = { posts }
