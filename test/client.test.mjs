// Local verification of the ported client half. The browser bundle is a
// registration into window.__ModuleLoader__, so this drives the real bundle
// contract: capture the registration, call its factory with a stub `require`,
// then mount the returned plugin against a fake client context and assert it
// registers the same three contribution points the validated dynamic version
// did.
globalThis.window = {
  __ModuleLoader__: {
    load(registration) {
      captured = registration
    },
  },
  __PLAIN_SLIDES__: { token: 'test-token' },
}
globalThis.document = {
  head: { appendChild() {} },
  querySelector: () => null,
  createElement: () => ({ dataset: {}, style: {}, textContent: '' }),
}

let captured = null

const results = []
function check(label, ok, detail) {
  results.push({ label, ok })
  console.log((ok ? 'PASS  ' : 'FAIL  ') + label + (detail === undefined ? '' : '   -> ' + detail))
}

const React = {
  createElement: (type, props, ...children) => ({ type, props, children }),
  useState: (initial) => [initial, () => {}],
  useEffect: () => {},
  useRef: () => ({ current: null }),
  Fragment: 'Fragment',
}

await import('../lib/client.js')

check('bundle registers into the module loader', captured !== null)
check('bundle id is the package name', captured && captured.id === 'dsh-plugin-plain-slides', captured && captured.id)

const required = []
let moduleExports = null
moduleExports = captured.factory((name) => {
  required.push(name)
  if (name === 'react') return React
  throw new Error('client bundle required an unexpected module: ' + name)
})

check('factory requires only react', required.length === 1 && required[0] === 'react', required.join(','))
check('exports apply', moduleExports && typeof moduleExports.apply === 'function')
check('exports inject', moduleExports && Array.isArray(moduleExports.inject), JSON.stringify(moduleExports && moduleExports.inject))

const injected = []
const registered = []
const fakeSlots = {
  inject(key, callback) {
    injected.push(key)
    callback()
    return () => {}
  },
  register(options, Component) {
    registered.push({ options, isComponent: typeof Component === 'function' })
    return () => {}
  },
}

const fakeClientCtx = {
  get(name) {
    if (name === 'slots') return fakeSlots
    return undefined
  },
  effect(fn) {
    fn()
    return () => {}
  },
  on() {
    return () => {}
  },
}

moduleExports.apply(fakeClientCtx)

check(
  'injects the three slot keys',
  injected.length === 3 &&
    injected.includes('conversation.chat.node') &&
    injected.includes('conversation.chat.assistant-actions') &&
    injected.includes('shell.overlay'),
  injected.join(', '),
)

const byKey = (predicate) => registered.find((entry) => predicate(entry.options))
const nodeEntry = byKey((o) => o.key === 'assistant-step')
const actionEntry = byKey((o) => o.id === 'dshdeck-stage')
const overlayEntry = byKey((o) => o.id === 'dshdeck-stage-overlay')

check('registers the assistant-step node renderer', nodeEntry !== undefined && nodeEntry.isComponent)
check(
  'node registration targets the right slot',
  nodeEntry !== undefined && nodeEntry.options.name === 'conversation.chat.node',
  nodeEntry && nodeEntry.options.name,
)
check('registers the assistant-actions entry', actionEntry !== undefined && actionEntry.isComponent)
check(
  'actions entry carries an order',
  actionEntry !== undefined && typeof actionEntry.options.order === 'number',
  actionEntry && String(actionEntry.options.order),
)
check('registers the shell overlay', overlayEntry !== undefined && overlayEntry.isComponent)
check('total registrations is three', registered.length === 3, 'registered=' + registered.length)

check('all three entries carry a component', registered.every((entry) => entry.isComponent))

const failed = results.filter((r) => !r.ok)
console.log('\n' + (results.length - failed.length) + '/' + results.length + ' checks passed')
process.exit(failed.length === 0 ? 0 : 1)
