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
    registered.push({ options, isComponent: typeof Component === 'function', component: Component })
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

const injectedKeys = [...new Set(injected)]
check(
  'injects exactly the three slot keys',
  injectedKeys.length === 3 &&
    injectedKeys.includes('conversation.chat.node') &&
    injectedKeys.includes('conversation.chat.assistant-actions') &&
    injectedKeys.includes('shell.overlay'),
  injectedKeys.join(', '),
)
check('one injection per registration', injected.length === 10, 'injections=' + injected.length)

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
check(
  'assistant-step shadows the built-in renderer without colliding',
  nodeEntry !== undefined && nodeEntry.options.priority === -10,
  nodeEntry && String(nodeEntry.options.priority),
)
check('registers the assistant-actions entry', actionEntry !== undefined && actionEntry.isComponent)
check(
  'actions entry carries an order',
  actionEntry !== undefined && typeof actionEntry.options.order === 'number',
  actionEntry && String(actionEntry.options.order),
)
check('registers the shell overlay', overlayEntry !== undefined && overlayEntry.isComponent)
check('all registered entries carry a component', registered.every((entry) => entry.isComponent))

// ---- the working process never reaches the transcript ----------------------

const HIDDEN_KINDS = [
  'turn-process',
  'context',
  'compaction',
  'model-retry',
  'unknown',
  'workflow-run',
  'system-prompt',
]
const nodeEntries = registered.filter(
  (entry) => entry.options.name === 'conversation.chat.node' && entry.options.key !== 'assistant-step',
)
const renderedKeys = nodeEntries.map((entry) => entry.options.key)
check(
  'every process kind is taken over',
  HIDDEN_KINDS.every((kind) => renderedKeys.includes(kind)),
  renderedKeys.join(', '),
)
check(
  'every process renderer renders nothing',
  nodeEntries.length === HIDDEN_KINDS.length && nodeEntries.every((entry) => entry.component({}) === null),
  'entries=' + nodeEntries.length,
)
check(
  'process renderers shadow built-ins without priority collisions',
  nodeEntries.every((entry) => entry.options.priority === -10),
  nodeEntries.map((entry) => entry.options.key + ':' + entry.options.priority).join(', '),
)
check(
  'failures stay visible',
  !renderedKeys.includes('turn-error') && !renderedKeys.includes('turn-max-tokens'),
  renderedKeys.join(', '),
)
check('the turn footer stays visible', !renderedKeys.includes('turn-tail'))
check('the user keeps their own voice', !renderedKeys.includes('user') && !renderedKeys.includes('steering'))
check(
  'interactive tool cards keep their own renderer',
  !renderedKeys.includes('tool-call'),
  renderedKeys.join(', '),
)
check('total registrations matches the declared set', registered.length === 10, 'registered=' + registered.length)

// ---- running and mid-turn assistant steps ----------------------------------

const WAITING = '正在处理，有结果了第一时间给您汇报'
const stepEntry = registered.find((entry) => entry.options.key === 'assistant-step')

function snapshotWith(keys, byKey) {
  return {
    order: keys,
    nodes: { get: (key) => byKey[key] },
    locations: { getTurn: () => keys },
    navigation: { items: () => [] },
    timeline: { turns: new Map() },
  }
}

function renderStep(node, snapshot) {
  return stepEntry.component({
    node,
    useChat: (selector) => selector(snapshot),
    useInput: (selector) => selector({ draft: '' }),
  })
}

function textOf(element) {
  if (element === null || element === undefined) return ''
  if (typeof element === 'string') return element
  if (typeof element === 'number') return String(element)
  if (typeof element === 'function') return textOf(element({}))
  if (typeof element.type === 'function') return textOf(element.type(element.props || {}))
  let out = ''
  const children = element.children || []
  for (const child of children) out += ' ' + textOf(child)
  return out
}

const firstStep = {
  key: 'k1',
  kind: 'assistant-step',
  anchorSeq: 1,
  location: { kind: 'turn', turn: { turn: 3 } },
  data: { status: 'running', step: 1, blocks: [{ kind: 'text', text: 'working' }] },
}
const lastStep = { ...firstStep, key: 'k2', anchorSeq: 2 }
const runningSnapshot = snapshotWith(['k1', 'k2'], { k1: firstStep, k2: lastStep })

check('an earlier running step shows nothing', renderStep(firstStep, runningSnapshot) === null)
const waitingTree = textOf(renderStep(lastStep, runningSnapshot))
check('the last running step shows the placeholder', waitingTree.includes(WAITING), waitingTree.trim().slice(0, 80))
check('the placeholder is the only thing shown', waitingTree.trim() === WAITING, waitingTree.trim())

const midStep = {
  key: 'k3',
  kind: 'assistant-step',
  anchorSeq: 5,
  location: { kind: 'turn', turn: { turn: 4 } },
  data: { status: 'settled', step: 1, blocks: [{ kind: 'text', text: 'mid-turn narration' }], finalNode: { seq: 5 } },
}
const tailNode = {
  key: 'k4',
  kind: 'turn-tail',
  anchorSeq: 10,
  data: { turn: 4, seq: 10, time: 0, closing: { finalNode: { seq: 99 } } },
}
check(
  'a settled mid-turn step shows nothing',
  renderStep(midStep, snapshotWith(['k3', 'k4'], { k3: midStep, k4: tailNode })) === null,
)

// ---- tool-name glossary ----------------------------------------------------

const internals = moduleExports.__internals
check('bundle exposes the pure helpers', internals !== undefined, typeof internals)
if (internals === undefined) {
  console.log('\n0/0 checks passed (test seam missing)')
  process.exit(1)
}

const CJK = /[\u4e00-\u9fa5]/
const LATIN = /[A-Za-z]/

const labels = internals.TOOL_LABELS
const labelKeys = Object.keys(labels)
check('every callable tool is mapped', labelKeys.length >= 30, 'entries=' + labelKeys.length)
check(
  'every label is Chinese with no latin letters',
  labelKeys.every((key) => CJK.test(labels[key]) && !LATIN.test(labels[key])),
  labelKeys.filter((key) => !CJK.test(labels[key]) || LATIN.test(labels[key])).join(', '),
)

const probes = ['edit', 'bash', 'present', 'write', 'read', 'glob', 'grep', 'web_search', 'subagent', 'cordis_run']
check(
  'known names resolve to their fixed label',
  probes.every((name) => internals.toolLabel(name) === labels[name]),
  probes.map((name) => name + '=' + internals.toolLabel(name)).join('  '),
)

const unknowns = ['some_new_tool', 'mcp__server__search', 'constructor', 'toString', 'hasOwnProperty', '__proto__']
check(
  'unknown names never leak latin text',
  unknowns.every((name) => !LATIN.test(internals.toolLabel(name))),
  unknowns.map((name) => name + '=' + internals.toolLabel(name)).join('  '),
)

const model = {
  turn: 3,
  prompt: '把这件事做完',
  text: '',
  runMs: 12000,
  toolCount: 5,
  toolFailures: 1,
  problems: [],
  tokenUsage: null,
  tools: [
    { name: 'edit', ok: true, ms: 120, subs: [] },
    { name: 'bash', ok: true, ms: 900, subs: [] },
    { name: 'present', ok: false, ms: 30, subs: [] },
    { name: 'write', ok: true, ms: 10, subs: [] },
    { name: 'some_new_tool', ok: true, ms: 5, subs: [] },
  ],
}
const deck = internals.buildSlides(model, '## 结论\n做好了。\n\n## 过程\n改了文件。')
const action = deck.find((slide) => typeof slide.title === 'string' && slide.title.indexOf('件事') !== -1)
check('the fallback deck has an action slide', action !== undefined, deck.map((s) => s.kind + ':' + s.title).join(' | '))
check('action slide counts the actions in plain language', action !== undefined && action.title === '做了 5 件事', action && action.title)

const actionHtml = action === undefined ? '' : String(action.html)
check(
  'action slide shows no raw tool name',
  ['edit', 'bash', 'present', 'write', 'some_new_tool'].every((name) => actionHtml.indexOf(name) === -1),
  actionHtml,
)
check(
  'action slide carries the translated labels',
  actionHtml.indexOf('修改文件') !== -1 &&
    actionHtml.indexOf('执行命令') !== -1 &&
    actionHtml.indexOf('提交成果') !== -1 &&
    actionHtml.indexOf('写入文件') !== -1,
  actionHtml,
)

const wholeDeck = deck.map((slide) => String(slide.html === undefined ? (slide.lines || []).join(' ') : slide.html)).join(' ')
check(
  'no slide in the deck contains a raw tool name',
  ['edit', 'bash', 'present', 'write', 'glob', 'grep'].every((name) => !new RegExp('\\b' + name + '\\b').test(wholeDeck)),
  wholeDeck.slice(0, 160),
)

const failed = results.filter((r) => !r.ok)
console.log('\n' + (results.length - failed.length) + '/' + results.length + ' checks passed')
process.exit(failed.length === 0 ? 0 : 1)
