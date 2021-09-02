import path from 'path'
import * as React from 'react'
import {json, redirect} from 'remix'
import type {ActionFunction} from 'remix'
import {getRequiredServerEnvVar} from '~/utils/misc'
import {redisCache} from '~/utils/redis.server'
import {getMdxDirList, getMdxPage} from '~/utils/mdx'
import {getTalksAndTags} from '~/utils/talks.server'
import {getTestimonials} from '~/utils/testimonials.server'
import {getWorkshops} from '~/utils/workshops.server'

type Body = {keys: Array<string>} | {contentPaths: Array<string>}

export const action: ActionFunction = async ({request}) => {
  if (
    request.headers.get('auth') !==
    getRequiredServerEnvVar('REFRESH_CACHE_SECRET')
  ) {
    return redirect('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  }

  const body = (await request.json()) as Body
  // fire and forget
  if ('keys' in body && Array.isArray(body.keys)) {
    for (const key of body.keys) {
      void redisCache.del(key)
    }
    return {message: 'Deleting redis cache keys', keys: body.keys}
  }
  if ('contentPaths' in body && Array.isArray(body.contentPaths)) {
    const refreshingContentPaths = []
    for (const contentPath of body.contentPaths) {
      if (typeof contentPath !== 'string') continue

      if (contentPath.startsWith('blog') || contentPath.startsWith('pages')) {
        const [contentDir, dirOrFilename] = contentPath.split('/')
        if (!contentDir || !dirOrFilename) continue
        const slug = path.parse(dirOrFilename).name

        refreshingContentPaths.push(contentPath)
        void refreshMdxContent({contentDir, slug})
      }
      if (contentPath.startsWith('workshops')) {
        refreshingContentPaths.push(contentPath)
        void getWorkshops({forceFresh: true})
      }
      if (contentPath === 'data/testimonials.yml') {
        refreshingContentPaths.push(contentPath)
        void getTestimonials({forceFresh: true})
      }
      if (contentPath === 'data/talks.yml') {
        refreshingContentPaths.push(contentPath)
        void getTalksAndTags({forceFresh: true})
      }
    }
    return {
      message: 'Refreshing cache for content paths',
      contentPaths: refreshingContentPaths,
    }
  }
  return json({message: 'no action taken'}, {status: 400})
}

async function refreshMdxContent({
  contentDir,
  slug,
}: {
  contentDir: string
  slug: string
}) {
  // refresh the page first, then refresh the whole list
  await getMdxPage({contentDir, slug}, {forceFresh: true})
  await getMdxDirList(contentDir, {forceFresh: true})
}

export const loader = () => redirect('/', {status: 404})

export default function MarkRead() {
  return <div>Oops... You should not see this.</div>
}
