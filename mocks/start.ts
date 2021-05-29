import {rest} from 'msw'
import {setupServer} from 'msw/node'
import {githubHandlers} from './github'
import {tiToHandlers} from './tito'
import {oembedHandlers} from './oembed'
import {isE2E, updateFixture} from './utils'

// put one-off handlers that don't really need an entire file to themselves here
const miscHandlers = [
  rest.post(
    'https://api.mailgun.net/v3/:domain/messages',
    async (req, res, ctx) => {
      const body = new URLSearchParams(req.body?.toString())
      const text = body.get('text')
      console.info('🔶 mocked email contents:', text)

      if (isE2E && text) {
        const magicLink = text.match(/(http.+magic.+)\n/)?.[1]
        if (magicLink) {
          await updateFixture({magicLink})
        }
      }
      const randomId = '20210321210543.1.E01B8B612C44B41B'
      const id = `<${randomId}>@${req.params.domain}`
      return res(ctx.json({id, message: 'Queued. Thank you.'}))
    },
  ),
]

const server = setupServer(
  ...githubHandlers,
  ...oembedHandlers,
  ...tiToHandlers,
  ...miscHandlers,
)

server.listen({onUnhandledRequest: 'error'})
console.info('🔶 Mock server installed')

process.once('SIGINT', () => server.close())
process.once('SIGTERM', () => server.close())
