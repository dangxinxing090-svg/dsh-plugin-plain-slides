// Local verification of the host half: mount it against a fake context, then
// drive its authenticated /api fetch route with real Request/Response objects.
// Proves route registration, the transport contract, the LLM call, the rewrite
// prompt content, and the response shape — without installing into a real DSH
// profile.
import { apply } from '../lib/index.js'

const routes = []
let seenSystem = ''
let seenOptions = null
const effectLabels = []

const fakeLlm = {
  stream(options) {
    seenOptions = options
    seenSystem = options.system
    return (async function* generate() {
      yield { type: 'block-start', index: 0, blockType: 'text' }
      yield { type: 'text-delta', index: 0, text: 'TITLE: 修复表格渲染\n' }
      yield { type: 'text-delta', index: 0, text: 'RESULT: 表格现在能正常显示了\n' }
      yield { type: 'text-delta', index: 0, text: 'STEP: 改渲染逻辑\nDETAIL: 加了表格标签白名单\n' }
      yield { type: 'finish', reason: { kind: 'stop' } }
    })()
  },
}

function connectionRouteSink() {
  return {
    fetch: {
      register(route) {
        routes.push(route)
        return () => {}
      },
    },
  }
}

function makeCtx({ llm }) {
  return {
    get(name) {
      if (name === 'connection') return connectionRouteSink()
      if (name === 'llm') return llm
      if (name === 'agentDefaultModel') {
        return { currentSelection: () => ({ provider: 'deepseek-official', model: 'deepseek-flash' }) }
      }
      return undefined
    },
    effect(fn, label) {
      effectLabels.push(label)
      fn()
      return () => {}
    },
  }
}

const ROUTE = '/api/brief.rewrite'

function post(body) {
  return new Request('http://127.0.0.1:3080' + ROUTE, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  })
}

const results = []
function check(label, ok, detail) {
  results.push({ label, ok })
  console.log((ok ? 'PASS  ' : 'FAIL  ') + label + (detail === undefined ? '' : '   -> ' + detail))
}

apply(makeCtx({ llm: fakeLlm }))

check('route registered', routes.length === 1, 'routes=' + routes.length)
check('route path is under /api', routes[0] && routes[0].path === ROUTE, routes[0] && routes[0].path)
check(
  'route declares POST only',
  routes[0] &&
    Array.isArray(routes[0].methods) &&
    routes[0].methods.length === 1 &&
    routes[0].methods[0] === 'POST',
  routes[0] && JSON.stringify(routes[0].methods),
)
check(
  'route buffers the request body',
  routes[0] && routes[0].requestBody === 'buffered',
  routes[0] && routes[0].requestBody,
)
check('route registration is fiber-owned', effectLabels.includes('brief: rewrite route'))
check(
  'no token or index tap is needed',
  !effectLabels.some((label) => /token|index/i.test(String(label))),
  effectLabels.join(', '),
)

const ok = await routes[0].fetch(post(JSON.stringify({ turn: 7, text: '一段技术性的回答' })))
const okBody = await ok.json()
check('successful call returns 200', ok.status === 200, String(ok.status))
check(
  'response asks for no caching',
  ok.headers.get('cache-control') === 'no-store',
  String(ok.headers.get('cache-control')),
)
check(
  'response carries the rewritten line protocol',
  okBody.ok === true && /RESULT:/.test(okBody.text),
  JSON.stringify(okBody).slice(0, 120),
)

check(
  'model route resolved from agentDefaultModel',
  seenOptions && seenOptions.provider === 'deepseek-official' && seenOptions.model === 'deepseek-flash',
  seenOptions && seenOptions.provider + '/' + seenOptions.model,
)
check(
  'request is bounded by maxTokens',
  seenOptions && typeof seenOptions.maxTokens === 'number',
  seenOptions && String(seenOptions.maxTokens),
)
check(
  'message source attributes this package',
  seenOptions &&
    seenOptions.messages &&
    seenOptions.messages[0] &&
    seenOptions.messages[0].source &&
    seenOptions.messages[0].source.kind === 'plugin' &&
    seenOptions.messages[0].source.plugin === 'dsh-plugin-brief' &&
    seenOptions.messages[0].source.form === 'instructions',
  JSON.stringify(seenOptions && seenOptions.messages && seenOptions.messages[0].source),
)

check('prompt forbids markdown tables', /竖线写法/.test(seenSystem))
check('prompt allows table tags', /<table>/.test(seenSystem))
check('prompt caps steps at 1..5', /1 到 5 组/.test(seenSystem))
check('prompt bans status-only steps', /纯状态类/.test(seenSystem))
check('prompt keeps file names', /文件名要保留/.test(seenSystem))
check('prompt forbids tag attributes', /不要写任何属性/.test(seenSystem))

const bad = await routes[0].fetch(post('{ not json'))
check('malformed JSON is 400', bad.status === 400, String(bad.status))
check('malformed JSON reports a code', (await bad.json()).code === 'bad-json')

// A provider failure must surface as ok:false rather than an unhandled rejection.
routes.length = 0
apply(
  makeCtx({
    llm: {
      stream() {
        return (async function* generate() {
          yield { type: 'finish', reason: { kind: 'error', failure: { message: 'provider down', code: 'X' } } }
        })()
      },
    },
  }),
)
const failedCall = await routes[0].fetch(post(JSON.stringify({ text: 'x' })))
const failedBody = await failedCall.json()
check('model failure reports ok:false', failedBody.ok === false, JSON.stringify(failedBody).slice(0, 120))

// ---- output budget ---------------------------------------------------------
// A reasoning model can spend an entire output cap on reasoning and still
// finish cleanly, yielding zero text. That is what silently degraded this
// plugin to its local fallback: maxTokens 1200 produced no text at all.

check('the rewrite asks for a real output budget', seenOptions.maxTokens >= 8000, String(seenOptions.maxTokens))

routes.length = 0
let calls = 0
const budgets = []
apply(
  makeCtx({
    llm: {
      stream(options) {
        calls += 1
        budgets.push(options.maxTokens)
        return (async function* generate() {
          yield { type: 'text-delta', index: 0, text: 'RESULT: 一次就够\n' }
          yield { type: 'finish', reason: { kind: 'stop' } }
        })()
      },
    },
  }),
)
const first = await routes[0].fetch(post(JSON.stringify({ text: '一段较长的输入' })))
const firstBody = await first.json()
check('one request costs exactly one model call', calls === 1, 'calls=' + calls)
check('the first attempt uses the base budget', budgets[0] === 8000, budgets.join(' -> '))
check(
  'the answer is the one returned',
  firstBody.ok === true && /一次就够/.test(firstBody.text),
  JSON.stringify(firstBody).slice(0, 120),
)

// The host used to add a retry of its own, which silently doubled whatever cap
// the caller believed it had. The budget belongs to the client, which is the
// only half that can count calls across a whole turn, so a repeat request is a
// separate request — and it is the one that earns the wider cap, because an
// empty answer usually means a reasoning model spent the whole budget thinking.
routes.length = 0
calls = 0
budgets.length = 0
apply(
  makeCtx({
    llm: {
      stream(options) {
        calls += 1
        budgets.push(options.maxTokens)
        return (async function* generate() {
          yield { type: 'text-delta', index: 0, text: 'RESULT: 宽预算重试\n' }
          yield { type: 'finish', reason: { kind: 'stop' } }
        })()
      },
    },
  }),
)
const repeated = await routes[0].fetch(post(JSON.stringify({ text: 'x', attempt: 1 })))
const repeatedBody = await repeated.json()
check('a repeat request is still one model call', calls === 1, 'calls=' + calls)
check('a repeat request gets the wider budget', budgets[0] === 16000, budgets.join(' -> '))
check(
  'the repeat answer is returned',
  repeatedBody.ok === true && /宽预算重试/.test(repeatedBody.text),
  JSON.stringify(repeatedBody).slice(0, 120),
)

routes.length = 0
calls = 0
apply(
  makeCtx({
    llm: {
      stream() {
        calls += 1
        return (async function* generate() {
          yield { type: 'finish', reason: { kind: 'max-tokens' } }
        })()
      },
    },
  }),
)
const empty = await routes[0].fetch(post(JSON.stringify({ text: 'x' })))
const emptyBody = await empty.json()
check('an empty answer is not retried by this half', calls === 1, 'calls=' + calls)
check(
  'an empty answer names the finish reason',
  emptyBody.ok === false && /max-tokens/.test(String(emptyBody.message)),
  JSON.stringify(emptyBody),
)

// Without the connection service the plugin must stay inert, not throw.
routes.length = 0
const inert = await import('../lib/index.js')
let threw = false
try {
  inert.apply({ get: () => undefined, effect: () => () => {} })
} catch {
  threw = true
}
check('mounting without connection is inert', !threw && routes.length === 0)

const failed = results.filter((r) => !r.ok)
console.log('\n' + (results.length - failed.length) + '/' + results.length + ' checks passed')
process.exit(failed.length === 0 ? 0 : 1)
