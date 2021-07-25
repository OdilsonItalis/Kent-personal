import * as React from 'react'
import {useRouteData, json} from 'remix'
import type {MdxPage, KCDLoader} from 'types'
import {
  getMdxPage,
  mdxPageMeta,
  useMdxComponent,
  refreshCacheForMdx,
} from '../utils/mdx'
import {shouldForceFresh} from '../utils/redis.server'
import {FourOhFour} from '../components/errors'
import {Grid} from '../components/grid'
import {BackLink} from '../components/arrow-button'
import {H2, H6} from '../components/typography'

export const loader: KCDLoader<{slug: string}> = async ({params, request}) => {
  const pageMeta = {
    contentDir: 'pages',
    slug: params.slug,
  }
  if (await shouldForceFresh(request)) {
    await refreshCacheForMdx(pageMeta)
  }
  const page = await getMdxPage(pageMeta)

  if (!page) return json(null, {status: 404})
  return json({page})
}

export const meta = mdxPageMeta

export default function MdxScreenBase() {
  const data = useRouteData<{page: MdxPage} | null>()

  if (data) return <MdxScreen mdxPage={data.page} />
  else return <FourOhFour />
}

function MdxScreen({mdxPage}: {mdxPage: MdxPage}) {
  const {code, frontmatter} = mdxPage
  const Component = useMdxComponent(code)

  return (
    <>
      <Grid className="mb-10 mt-24 lg:mb-24">
        <div className="flex col-span-full justify-between lg:col-span-8 lg:col-start-3">
          <BackLink to="/">Back to home</BackLink>
        </div>
      </Grid>

      <Grid className="mb-12">
        <div className="col-span-full lg:col-span-8 lg:col-start-3">
          <H2>{frontmatter.title}</H2>
          {frontmatter.description ? (
            <H6 as="p" variant="secondary" className="mt-2 lowercase">
              {frontmatter.description}
            </H6>
          ) : null}
        </div>
        {frontmatter.bannerUrl ? (
          <img
            className="col-span-full mt-10 mx-auto rounded-lg lg:col-span-10 lg:col-start-2"
            src={frontmatter.bannerUrl}
            alt={frontmatter.bannerAlt}
          />
        ) : null}
      </Grid>

      <Grid className="prose prose-light dark:prose-dark">
        <Component />
      </Grid>
    </>
  )
}
