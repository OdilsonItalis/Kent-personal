import * as React from 'react'
import ReactDOMServer from 'react-dom/server'
import {
  RemixServer as Remix,
  Response,
  Request,
  Headers,
  EntryContext,
} from 'remix'
import {
  getDocumentReplayResponse,
  getDataReplayResponse,
} from './utils/prisma.server'
import {getRssFeedXml} from './utils/blog-rss-feed.server'
import {getEnv} from './utils/env.server'

global.ENV = getEnv()

const startTime = Date.now()

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) {
  const replayResponse = await getDocumentReplayResponse(request, remixContext)
  if (replayResponse) {
    return replayResponse
  }
  const {pathname} = new URL(request.url)
  if (pathname === '/build-info') {
    const buildInfo = {
      commit: ENV.COMMIT_SHA,
      startTime,
    }
    const json = JSON.stringify(buildInfo)
    return new Response(json, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': String(Buffer.byteLength(json)),
      },
    })
  }
  if (pathname === '/blog/rss.xml') {
    const rss = await getRssFeedXml(request)
    return new Response(rss, {
      headers: {
        'Content-Type': 'application/xml',
        'Content-Length': String(Buffer.byteLength(rss)),
      },
    })
  }

  const markup = ReactDOMServer.renderToString(
    <Remix context={remixContext} url={request.url} />,
  )

  if (process.env.NODE_ENV !== 'production') {
    responseHeaders.set('Cache-Control', 'no-store')
  }

  const html = `<!DOCTYPE html>${markup}`

  return new Response(html, {
    status: responseStatusCode,
    headers: {
      // TODO: remove this when we go to production
      'X-Robots-Tag': 'none',
      ...Object.fromEntries(responseHeaders),
      'X-Powered-By': 'Kody the Koala',
      'X-Fly-Region': process.env.FLY_REGION ?? 'unknown',
      'Content-Type': 'text/html',
      'Content-Length': String(Buffer.byteLength(html)),
    },
  })
}

export async function handleDataRequest(
  request: Request,
  dataResponse: Response,
) {
  const replayResponse = await getDataReplayResponse(request, dataResponse)
  if (replayResponse) {
    return replayResponse
  }
  return new Response(dataResponse.body, {
    status: dataResponse.status,
    headers: {
      'X-Robots-Tag': 'none',
      ...Object.fromEntries(dataResponse.headers),
      'X-Powered-By': 'Kody the Koala',
      'X-Fly-Region': process.env.FLY_REGION ?? 'unknown',
    },
  })
}
