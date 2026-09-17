// Local verification of the ported client half. The browser bundle is a
// registration into window.__ModuleLoader__, so this drives the real bundle
// contract: capture the registration, call its factory with a stub `require`,
// then mount the returned plugin against a fake client context and assert it
// registers the same three contribution points the validated dynamic version
// did.
import { readFileSync } from 'node:fs'
// The browser store the working box keeps its open/closed preference in. The
// bundle is loaded before `apply` runs, and `apply` reads this store once, so it
// must exist — and be empty — by the time the fake context is mounted below.
const stored = new Map()
globalThis.window = {
  __ModuleLoader__: {
    load(registration) {
      captured = registration
    },
  },
  __PLAIN_SLIDES__: { token: 'test-token' },
  localStorage: {
    getItem: (key) => (stored.has(key) ? stored.get(key) : null),
    setItem: (key, value) => {
      stored.set(key, String(value))
    },
    removeItem: (key) => {
      stored.delete(key)
    },
  },
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

// React flattens array children and drops null/undefined/boolean ones. The stub
// must do the same, or a component that hands a mapped array over as a single
// child reads as one nested list here — which is not what the browser renders.
const React = {
  createElement: (type, props, ...children) => ({
    type,
    props,
    children: children
      .flat(Infinity)
      .filter((child) => child !== null && child !== undefined && typeof child !== 'boolean'),
  }),
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
  'injects exactly the five slot keys',
  injectedKeys.length === 5 &&
    injectedKeys.includes('conversation.chat.node') &&
    injectedKeys.includes('conversation.input.dock') &&
    injectedKeys.includes('conversation.session.header.utilities') &&
    injectedKeys.includes('conversation.chat.assistant-actions') &&
    injectedKeys.includes('shell.overlay'),
  injectedKeys.join(', '),
)
check('one injection per registration', injected.length === 14, 'injections=' + injected.length)

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
  'tool-call',
  'turn-process',
  'context',
  'compaction',
  'manual-compaction',
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
// Rendering nothing is not enough. The harness's own `.flowItem:empty` collapse
// never fires for these items — a measured turn showed every one of them
// carrying a single child element, so each kept its box and took the column's
// 16px sibling margin. 501 items meant ~8000px of pure gap above the
// turn-status label. The plugin has to collapse them itself, by kind, and this
// check is what stops a kind from being added to the renderer and forgotten in
// the stylesheet.
const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
const uncollapsed = HIDDEN_KINDS.filter(
  (kind) => source.indexOf('[data-chat-flow-kind="' + kind + '"]') === -1,
)
check('every hidden kind is collapsed by the plugin own CSS', uncollapsed.length === 0, uncollapsed.join(', '))
check(
  'a bare assistant step is collapsed while the deck item is kept',
  source.indexOf('[data-chat-flow-kind="assistant-step"]:not(:has(.dshdeck-card))') !== -1 &&
    source.indexOf("'dshdeck-card dshdeck-'") !== -1,
)
check(
  'process renderers shadow built-ins without priority collisions',
  nodeEntries.every((entry) => entry.options.priority === -10),
  nodeEntries.map((entry) => entry.options.key + ':' + entry.options.priority).join(', '),
)
// The bug this guards against, class-wide rather than key-by-key: a permanent
// client plugin that registers a conversation.chat.node key at the DEFAULT
// priority competes with the shipped renderer for the same cell at the same
// priority, and the plugin does not merely lose — it fails to load entirely.
// Every registration into that slot must therefore declare a shadowing
// priority. Add a key here and forget it, and this check fails before release.
const chatNodeRegistrations = registered.filter(
  (entry) => entry.options.name === 'conversation.chat.node',
)
check(
  'no chat.node registration competes with a built-in at the default priority',
  chatNodeRegistrations.length > 0 &&
    chatNodeRegistrations.every(
      (entry) => typeof entry.options.priority === 'number' && entry.options.priority < 0,
    ),
  chatNodeRegistrations.map((entry) => entry.options.key + ':' + String(entry.options.priority)).join(', '),
)
check(
  'failures stay visible',
  !renderedKeys.includes('turn-error') && !renderedKeys.includes('turn-max-tokens'),
  renderedKeys.join(', '),
)
check('the turn footer stays visible', !renderedKeys.includes('turn-tail'))
check('the user keeps their own voice', !renderedKeys.includes('user') && !renderedKeys.includes('steering'))
// Taking over `tool-call` hides every `tool.call.toolview` card at once, because
// a node renderer receives no renderSlot and so cannot delegate back to them.
// That is only safe while each blocking or interactive surface lives outside a
// tool row. The four homes, traced in the shipped client, are:
//   approvals + ask_user_question  -> `conversation.composer`
//   presented deliverables         -> `conversation.chat.turnTail`
//   dynamic-plugin approve/decline -> `sidebar.footer.action` (CordisPanel —
//                                     the inline CordisRunRow never receives
//                                     onApprove/onDecline)
// None of them is a `conversation.chat.node` key, so none can be shadowed from
// here. The two checks below pin both halves of that bargain.
check('the process takeover includes tool rows', renderedKeys.includes('tool-call'), renderedKeys.join(', '))
check(
  'the plugin reaches no slot outside the five it declares',
  injectedKeys.every(
    (key) =>
      key === 'conversation.chat.node' ||
      key === 'conversation.input.dock' ||
      key === 'conversation.session.header.utilities' ||
      key === 'conversation.chat.assistant-actions' ||
      key === 'shell.overlay',
  ),
  injectedKeys.join(', '),
)
check('total registrations matches the declared set', registered.length === 14, 'registered=' + registered.length)

// ---- running steps, and the working box in the composer dock ----------------

const WORKING_TITLE = '正在进行以下专业编程操作，想了解细节，请切到轨迹页'
const WORKING_KEY = 'dshdeck:working-box-closed'
const stepEntry = registered.find((entry) => entry.options.key === 'assistant-step')
const dockEntry = registered.find((entry) => entry.options.id === 'dshdeck-working')
const toggleEntry = registered.find((entry) => entry.options.id === 'dshdeck-working-toggle')

function snapshotWith(keys, byKey, openTurn) {
  const turns = new Map()
  if (openTurn !== undefined) turns.set(openTurn, { status: 'open', start: { time: 0 } })
  return {
    order: keys,
    nodes: { get: (key) => byKey[key] },
    locations: { getTurn: () => keys },
    navigation: { items: () => [] },
    timeline: { turns },
  }
}

function renderStep(node, snapshot) {
  return stepEntry.component({
    node,
    useChat: (selector) => selector(snapshot),
    useInput: (selector) => selector({ draft: '' }),
  })
}

/** The dock entry, driven the way the composer seat drives it. */
function renderDock(snapshot) {
  return dockEntry.component({ useChat: (selector) => selector(snapshot) })
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

// These renderers hand back an element whose `type` is the component, and the
// stub React does not invoke component functions — so the tree has to be
// unfolded by hand before anything inside it can be inspected.
function resolve(element) {
  if (element === null || element === undefined) return null
  if (typeof element === 'function') return resolve(element({}))
  if (typeof element.type === 'function') return resolve(element.type(element.props || {}))
  return element
}

function findButton(element) {
  if (element === null || element === undefined || typeof element !== 'object') return null
  if (element.type === 'button') return element
  const children = element.children || []
  for (const child of children) {
    const found = findButton(child)
    if (found !== null) return found
  }
  return null
}

const firstStep = {
  key: 'k1',
  kind: 'assistant-step',
  anchorSeq: 1,
  location: { kind: 'turn', turn: { turn: 3 } },
  data: { status: 'running', step: 1, blocks: [{ kind: 'text', text: 'working' }] },
}
const lastStep = { ...firstStep, key: 'k2', anchorSeq: 2 }
const runningSnapshot = snapshotWith(['k1', 'k2'], { k1: firstStep, k2: lastStep }, 3)

// A running assistant step renders nothing at all. The process readout is a
// composer-dock entry, because only the dock draws after the conversation — and
// therefore after the shipped "深度求索中..." turn status the box belongs under.
check('a running assistant step renders nothing', renderStep(firstStep, runningSnapshot) === null)
check('the last running step renders nothing either', renderStep(lastStep, runningSnapshot) === null)

const toolCallNode = (key, seq, name, args) => ({
  key,
  kind: 'tool-call',
  anchorSeq: seq,
  location: { kind: 'turn', turn: { turn: 3 } },
  data: {
    root: { kind: 'tool-result', call: { name, argsRaw: args }, callTime: 0, time: 5, isError: false },
  },
})
const readNode = toolCallNode('t1', 11, 'read', '{"file_path":"/a/b/setup.js"}')
const editNode = toolCallNode('t2', 12, 'edit', '{"file_path":"/a/b/client.js"}')
const dockSnapshot = snapshotWith(
  ['k1', 'k2', 't1', 't2'],
  { k1: firstStep, k2: lastStep, t1: readNode, t2: editNode },
  3,
)

const box = resolve(renderDock(dockSnapshot))
check(
  'the dock seat draws the working box',
  box !== null && box.props.className === 'dshdeck-working',
  box === null ? 'no box' : String(box.props.className),
)
const boxColumns = box === null ? [] : box.children || []
const boxLines = boxColumns.length ? boxColumns[0].children || [] : []
check('the working box stays exactly two lines', boxLines.length === 2, 'lines=' + boxLines.length)
check(
  'line one is the title, and it points at the Trajectory',
  boxLines.length === 2 &&
    boxLines[0].props.className === 'dshdeck-working-title' &&
    textOf(boxLines[0]).trim() === WORKING_TITLE,
  textOf(boxLines[0]).trim(),
)
check(
  'line two is the newest step, with no raw tool or directory',
  boxLines.length === 2 &&
    boxLines[1].props.className === 'dshdeck-working-line' &&
    textOf(boxLines[1]).includes('client.js') &&
    !/\bread\b|\bedit\b/.test(textOf(boxLines[1])) &&
    textOf(boxLines[1]).indexOf('/a/b') === -1,
  textOf(boxLines[1]).trim(),
)

const closeButton = box === null ? null : findButton(box)
check(
  'the working box carries a working close control',
  closeButton !== null && typeof closeButton.props.onClick === 'function',
)
check(
  'the box does not outlive the turn',
  resolve(renderDock(snapshotWith(['k1', 'k2'], { k1: firstStep, k2: lastStep }))) === null,
)
check(
  'the reopen control stays out of the way while the box is open',
  resolve(toggleEntry.component({ useChat: (selector) => selector(dockSnapshot) })) === null,
)
closeButton.props.onClick()
check('closing the box removes it from the dock', resolve(renderDock(dockSnapshot)) === null)
check(
  'closing the box is remembered across sessions',
  globalThis.window.localStorage.getItem(WORKING_KEY) === '1',
  String(globalThis.window.localStorage.getItem(WORKING_KEY)),
)

// Closing is a persisted preference, so without this control the only way back
// would be clearing browser storage. It appears exactly when there is something
// to reopen — a turn running and the box closed.
const reopenButton = resolve(toggleEntry.component({ useChat: (selector) => selector(dockSnapshot) }))
check(
  'a closed box offers a reopen control while a turn runs',
  reopenButton !== null && reopenButton.type === 'button' && typeof reopenButton.props.onClick === 'function',
)
check(
  'the reopen control stays away once nothing is running',
  resolve(toggleEntry.component({ useChat: (selector) => selector(snapshotWith(['k1'], { k1: firstStep })) })) === null,
)
reopenButton.props.onClick()
check('the reopen control brings the box back', resolve(renderDock(dockSnapshot)) !== null)
check(
  'reopening is remembered too',
  globalThis.window.localStorage.getItem(WORKING_KEY) === '0',
  String(globalThis.window.localStorage.getItem(WORKING_KEY)),
)
closeButton.props.onClick()

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

// An aborted or truncated turn writes no `turn-tail`, so there is no closing
// marker to compare against. The renderer must then fail CLOSED: only the last
// assistant step speaks for the turn. Treating every step as the report is what
// turned one failure into a pile of narration decks.
const abortedA = {
  key: 'a1',
  kind: 'assistant-step',
  anchorSeq: 1,
  location: { kind: 'turn', turn: { turn: 7 } },
  data: { status: 'settled', step: 1, blocks: [{ kind: 'text', text: '先看一下这个文件' }], finalNode: { seq: 1 } },
}
const abortedB = {
  ...abortedA,
  key: 'a2',
  anchorSeq: 2,
  data: { ...abortedA.data, step: 2, blocks: [{ kind: 'text', text: '看完了，结果如下。' }], finalNode: { seq: 2 } },
}
const abortedSnapshot = snapshotWith(['a1', 'a2'], { a1: abortedA, a2: abortedB })
check(
  'an aborted turn does not report every narration step',
  renderStep(abortedA, abortedSnapshot) === null,
)
check('an aborted turn still reports its last step', renderStep(abortedB, abortedSnapshot) !== null)

// A settled step inside a turn that is still OPEN must not become a report.
// Without this gate the step is briefly the turn's last assistant step, so the
// fallback renders it as a deck — and the next step arriving makes it stop
// being last, so the deck vanishes. That is one deck flickering per step.
const openStep = {
  key: 'o1',
  kind: 'assistant-step',
  anchorSeq: 1,
  location: { kind: 'turn', turn: { turn: 8, status: 'open' } },
  data: { status: 'settled', step: 1, blocks: [{ kind: 'text', text: '先看一下这个文件。' }], finalNode: { seq: 1 } },
}
const openSnapshot = snapshotWith(['o1'], { o1: openStep })
check('a settled step in an open turn is not a report', renderStep(openStep, openSnapshot) === null)

const closedStep = {
  ...openStep,
  key: 'o2',
  location: { kind: 'turn', turn: { turn: 8, status: 'closed' } },
}
check(
  'the very same step becomes a report once the turn closes',
  renderStep(closedStep, snapshotWith(['o2'], { o2: closedStep })) !== null,
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

// ---- the working box's process lines --------------------------------------

const lines = internals.workingLines
check(
  'a turn with nothing done yet still reads as plain Chinese',
  lines({ tools: [] }).length === 1 &&
    lines({ tools: [] })[0] === '正在理清该怎么做…' &&
    !LATIN.test(lines({ tools: [] })[0]),
  lines({ tools: [] }).join(' | '),
)
check(
  'one call yields one line',
  lines({ tools: [{ name: 'read' }] }).join('|') === labels.read,
  lines({ tools: [{ name: 'read' }] }).join('|'),
)
check(
  'the box carries only the newest call, since the title takes the other line',
  lines({ tools: [{ name: 'glob' }, { name: 'read' }, { name: 'edit' }] }).join('|') === labels.edit,
  lines({ tools: [{ name: 'glob' }, { name: 'read' }, { name: 'edit' }] }).join('|'),
)

const withTarget = lines({ tools: [{ name: 'read', args: '{"file_path":"/Users/me/proj/setup.js"}' }] })
check('a file call names the file without its directory', withTarget.join('|') === labels.read + ' · setup.js', withTarget.join('|'))

const viaBash = lines({ tools: [{ name: 'bash', args: '{"command":"rm -rf build"}' }] })
check(
  'a command is never shown',
  viaBash.length === 1 && viaBash[0] === labels.bash && !LATIN.test(viaBash[0]),
  viaBash.join('|'),
)

const garbled = lines({ tools: [{ name: 'read', args: '{not json' }] })
check('unparsable arguments degrade to the plain label', garbled.join('|') === labels.read, garbled.join('|'))

const noTurn = internals.runningTurnNo
check(
  'no open turn means nothing to report',
  noTurn({ timeline: { turns: new Map() } }) === -1 &&
    noTurn({}) === -1 &&
    noTurn(snapshotWith(['k1'], { k1: firstStep }, 9)) === 9,
  String(noTurn(snapshotWith(['k1'], { k1: firstStep }, 9))),
)

check(
  'targetHint keeps only a basename',
  internals.targetHint('{"file_path":"a/b/c/deep.txt"}') === 'deep.txt',
  internals.targetHint('{"file_path":"a/b/c/deep.txt"}'),
)
check(
  'targetHint refuses a payload it cannot read',
  internals.targetHint('nope') === '' && internals.targetHint('') === '' && internals.targetHint(undefined) === '',
)
check(
  'baseName leaves a plain name intact',
  internals.baseName('README.md') === 'README.md' && internals.baseName('') === '',
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

// ---- the rewrite input shape ----------------------------------------------
//
// The rewrite is the plugin's whole point: it is what turns a technical reply
// into plain language. It never worked, because the plumbing handed
// `slidesFromPlain` a hand-picked `{ prompt }` instead of the model slice it
// reads. `plainMeta` then read `problems.length` off undefined, the `.catch`
// swallowed the TypeError, and every card silently fell back to the local
// renderer. These checks pin both ends: the shape that is produced, and the
// rewrite actually rendering a deck when driven with it.

const REWRITE = ['TITLE: 改好了', 'RESULT: 文件已经更新。', 'STEP: 修改文件', 'DETAIL: 改了设置。'].join('\n')

const view = internals.plainModelView(model)
check(
  'the rewrite input is exactly the five fields it reads',
  Object.keys(view).sort().join(',') === 'problems,prompt,runMs,toolCount,toolFailures',
  Object.keys(view).sort().join(','),
)
check(
  'the rewrite input carries the turn it came from',
  view.prompt === model.prompt && view.runMs === model.runMs && view.toolCount === model.toolCount,
  JSON.stringify(view),
)

const rewritten = internals.slidesFromPlain(REWRITE, view)
check(
  'the rewrite renders a deck when driven with that shape',
  rewritten !== null && rewritten.length > 0 && rewritten[0].kind === 'conclusion',
  rewritten === null ? 'null' : rewritten.map((s) => s.kind + ':' + s.title).join(' | '),
)
check(
  'the rewritten deck carries the real status line, not a placeholder',
  rewritten !== null &&
    typeof rewritten[0].meta === 'string' &&
    rewritten[0].meta.indexOf('有失败的操作') === 0 &&
    rewritten[0].meta.indexOf('耗时 12.0s') !== -1 &&
    rewritten[0].meta.indexOf('5 个操作') !== -1,
  rewritten === null ? 'null' : String(rewritten[0].meta),
)

// Deliberately pin the strictness: a narrower object is the exact bug, and it
// must keep failing loudly rather than quietly reporting "正常完成". If someone
// later softens `plainMeta` with defaults, this check fails and forces them to
// decide that on purpose.
let narrowShapeThrows = false
try {
  internals.slidesFromPlain(REWRITE, { prompt: '把这件事做完' })
} catch (error) {
  narrowShapeThrows = error instanceof TypeError
}
check('a bare { prompt } still fails loudly instead of degrading silently', narrowShapeThrows)

// ---- the rewrite call budget ----------------------------------------------
//
// The host half used to keep a retry of its own on top of whatever the client
// did, so the real number of model calls was not the number either half thought
// it was. The budget now lives in exactly one place: one attempt plus at most
// REWRITE_MAX_RETRIES more, and not one call further once a deck comes back.

const REWRITE_DECK = [{ kind: 'conclusion', title: 'ok' }]

function driveRewrite(outcomes) {
  const calls = []
  let settled = null
  return new Promise((resolve) => {
    internals.runRewrite(
      (attempt) => {
        calls.push(attempt)
        const outcome = outcomes[Math.min(attempt, outcomes.length - 1)]
        return outcome === 'throw' ? Promise.reject(new Error('boom')) : Promise.resolve(outcome)
      },
      (state, slides) => {
        settled = { state, slides }
        resolve()
      },
    )
  }).then(() => ({ calls, settled }))
}

const okFirst = await driveRewrite([REWRITE_DECK])
check('a successful rewrite costs exactly one call', okFirst.calls.join(',') === '0', okFirst.calls.join(','))
check(
  'a successful rewrite settles as plain with the deck',
  okFirst.settled.state === 'plain' && okFirst.settled.slides === REWRITE_DECK,
)

const alwaysFails = await driveRewrite([null])
check(
  'a failing rewrite stops at the first attempt plus the retry cap',
  alwaysFails.calls.length === internals.REWRITE_MAX_RETRIES + 1,
  alwaysFails.calls.join(','),
)
check(
  'every retry is a distinct, consecutive attempt number',
  alwaysFails.calls.join(',') === '0,1,2,3',
  alwaysFails.calls.join(','),
)
check(
  'a failing rewrite settles as error with no deck',
  alwaysFails.settled.state === 'error' && alwaysFails.settled.slides === null,
)

const healsLate = await driveRewrite([null, null, REWRITE_DECK])
check(
  'a rewrite that heals mid-budget stops calling there',
  healsLate.calls.length === 3 && healsLate.settled.state === 'plain',
  healsLate.calls.join(','),
)

const rejectsAlways = await driveRewrite(['throw'])
check(
  'a rejected call spends the same budget rather than getting a fresh one',
  rejectsAlways.calls.length === internals.REWRITE_MAX_RETRIES + 1 && rejectsAlways.settled.state === 'error',
  rejectsAlways.calls.join(','),
)

const failed = results.filter((r) => !r.ok)
console.log('\n' + (results.length - failed.length) + '/' + results.length + ' checks passed')
process.exit(failed.length === 0 ? 0 : 1)
