window.__ModuleLoader__.load({
	id: "dsh-plugin-plain-slides",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		var React = require("react");

		var ROUTE = "/api/plain-slides.rewrite";

		// Stands in for the dynamic-plugin `host.call` builtin. No credentials are
		// attached: the route sits behind Connection's authenticated /api bridge.
		var host = {
			call: function (method, args) {
				return fetch(ROUTE, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify(args || {})
				}).then(function (response) {
					return response.ok ? response.json() : null;
				}).catch(function () {
					return null;
				});
			}
		};

		// Stands in for the dynamic-plugin `styles` builtin.
		var styles = {
			insert: function (css) {
				if (typeof document === "undefined") return function () {};
				var tag = document.createElement("style");
				tag.dataset.plugin = "dsh-plugin-plain-slides";
				tag.dataset.pluginCss = "dsh-plugin-plain-slides";
				tag.textContent = css;
				document.head.appendChild(tag);
				return function () { if (tag.parentNode) tag.parentNode.removeChild(tag); };
			}
		};

		// Test seam: names declared inside the ported body are private to its IIFE,
		// so the body hands its pure helpers to this sink. The module loader reads
		// only apply/inject.
		var __internals = null;
		var __expose = function (face) { __internals = face; };

		// ---- ported verbatim from the validated dynamic Client half ----
		var plugin = (function () {
const CSS = `
.dshdeck-card{margin:2px 0 4px;display:flex;flex-direction:column;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);overflow:hidden;font-size:13px;line-height:1.6;color:var(--dsw-alias-label-primary);height:calc(100vh - 250px);height:calc(100dvh - 250px);min-height:280px;box-sizing:border-box}
.dshdeck-head{display:flex;align-items:center;gap:8px;padding:7px 10px 7px 12px;border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);flex:0 0 auto}
.dshdeck-badge{font-size:10px;font-weight:600;letter-spacing:.14em;color:var(--dsw-alias-label-secondary)}
.dshdeck-count{font-size:11px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.dshdeck-flag{font-size:11px;color:var(--dsw-alias-brand-primary)}
.dshdeck-grow{flex:1 1 auto}
.dshdeck-icon{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;padding:0;border:1px solid transparent;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;flex:0 0 auto}
.dshdeck-icon:hover{background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l1)}
.dshdeck-icon[data-on="true"]{background:var(--dsw-alias-bg-base);color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-border-l2)}
.dshdeck-body{padding:18px 20px;display:flex;flex-direction:column;gap:8px;flex:1 1 auto;min-height:0;overflow:auto}
.dshdeck-kicker{font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--dsw-alias-brand-primary);flex:0 0 auto}
.dshdeck-title{font-size:17px;font-weight:600;line-height:1.45;word-break:break-word;flex:0 0 auto}
.dshdeck-lines{display:flex;flex-direction:column;gap:3px;flex:1 1 auto;min-height:0;overflow:auto}
.dshdeck-line{white-space:pre-wrap;word-break:break-word;color:var(--dsw-alias-label-secondary)}
.dshdeck-html{color:var(--dsw-alias-label-secondary);line-height:1.75;word-break:break-word}
.dshdeck-html p{margin:0 0 8px}
.dshdeck-html p:last-child{margin-bottom:0}
.dshdeck-html ul,.dshdeck-html ol{margin:6px 0;padding-left:20px}
.dshdeck-html li{margin:2px 0}
.dshdeck-html b,.dshdeck-html strong{color:var(--dsw-alias-label-primary);font-weight:600}
.dshdeck-html i,.dshdeck-html em{font-style:italic}
.dshdeck-html code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.92em;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);border-radius:4px;padding:1px 4px}
.dshdeck-html pre{margin:8px 0;padding:10px 12px;background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l1);border-radius:8px;overflow:auto}
.dshdeck-html pre code{background:transparent;border:none;padding:0;font-size:.9em}
.dshdeck-html mark{background:transparent;color:var(--dsw-alias-brand-primary);font-weight:600}
.dshdeck-html table{border-collapse:collapse;width:100%;margin:8px 0;font-size:.95em;table-layout:fixed}
.dshdeck-html th,.dshdeck-html td{border:1px solid var(--dsw-alias-border-l1);padding:5px 8px;text-align:left;vertical-align:top;word-break:break-word;overflow-wrap:anywhere}
.dshdeck-html th{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-weight:600}
.dshdeck-meta{margin-top:auto;padding-top:12px;font-size:11px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;flex:0 0 auto;background:var(--dsw-alias-bg-layer-1)}
.dshdeck-foot{display:flex;align-items:center;gap:6px;padding:5px 8px;border-top:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);flex:0 0 auto}
.dshdeck-dots{display:flex;align-items:center;gap:5px;flex:1 1 auto;flex-wrap:wrap;justify-content:center}
.dshdeck-dot{width:6px;height:6px;border-radius:50%;border:none;padding:0;background:var(--dsw-alias-border-l2);cursor:pointer}
.dshdeck-dot[data-on="true"]{background:var(--dsw-alias-brand-primary);width:16px;border-radius:3px}
.dshdeck-dot[data-ask="true"]{background:var(--dsw-alias-state-warn-primary)}
.dshdeck-opts{display:flex;flex-direction:column;gap:8px;margin-top:10px}
.dshdeck-opt{text-align:left;padding:10px 12px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-2);cursor:pointer;font:inherit;font-size:13px;color:var(--dsw-alias-label-primary)}
.dshdeck-opt:hover{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-base)}
.dshdeck-opt-desc{font-size:11.5px;color:var(--dsw-alias-label-secondary);margin-top:3px}
.dshdeck-answer{margin-top:12px;display:flex;flex-direction:column;gap:8px;flex:0 0 auto}
.dshdeck-ta{width:100%;min-height:62px;resize:vertical;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;padding:8px 10px;box-sizing:border-box}
.dshdeck-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.dshdeck-btn{padding:7px 12px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-size:12.5px;cursor:pointer;font-family:inherit}
.dshdeck-btn:hover{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}
.dshdeck-btn[data-primary="true"]{background:var(--dsw-alias-brand-primary);color:#fff;border-color:transparent}
.dshdeck-note{font-size:11.5px;color:var(--dsw-alias-brand-primary)}
.dshdeck-raw{padding:2px 0 6px;white-space:pre-wrap;word-break:break-word;color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.7}
.dshdeck-rawstats{padding:0 0 10px;margin-bottom:10px;border-bottom:1px dashed var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary);font-size:11px;font-variant-numeric:tabular-nums}
.dshdeck-rawbody{padding:16px 20px;flex:1 1 auto;min-height:0;overflow:auto;white-space:pre-wrap;word-break:break-word;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1.75}
.dshdeck-images{display:flex;flex-wrap:wrap;gap:8px;padding-top:10px;flex:0 0 auto}
.dshdeck-action{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;padding:0;border:1px solid transparent;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
.dshdeck-action:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-border-l1)}
.dshdeck-stagewrap{position:fixed;inset:0;pointer-events:auto;z-index:60;display:flex;align-items:center;justify-content:center;padding:28px;background:rgba(0,0,0,.42)}
.dshdeck-panel{width:min(980px,100%);height:min(88vh,900px);display:flex;flex-direction:column;border:1px solid var(--dsw-alias-border-l1);border-radius:16px;background:var(--dsw-alias-bg-overlay);overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,.34);font-size:14px;color:var(--dsw-alias-label-primary)}
.dshdeck-panel .dshdeck-card{height:100%;margin:0;border:none;border-radius:0;min-height:0}
.dshdeck-panel .dshdeck-title{font-size:19px}
.dshdeck-panel .dshdeck-html{font-size:15px}
.dshdeck-working{box-sizing:border-box;width:calc(100% - 2 * var(--dsh-composer-side-clearance, 16px) - 4 * var(--dsh-composer-dock-inset, 8px));max-width:calc(var(--dsh-composer-card-max-width, 952px) - 4 * var(--dsh-composer-dock-inset, 8px));margin:0 auto;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);padding:5px 6px 5px 12px;display:flex;align-items:center;gap:8px;font-size:13px;line-height:1.5;overflow:hidden}
.dshdeck-working-lines{flex:1 1 auto;min-width:0;display:flex;flex-direction:column}
.dshdeck-working-line{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--dsw-alias-label-secondary);min-height:1.5em}
.dshdeck-working-line[data-latest="true"]{color:var(--dsw-alias-label-primary)}
/* The transcript wraps every node in a flowItem, and the harness's column rule
   gives each non-empty item a 16px top margin to the next one. Its
   flowItem:empty{display:none} was supposed to remove the items this plugin
   renders as nothing — but every one of them still carries a single child
   element, so it is never :empty, keeps its box, and takes the 16px anyway.
   A measured turn held 501 of them: ~8000px of pure gap stacked above the
   turn-status label, growing with every tool call. Take the box away here
   instead of relying on :empty; display:none removes the margin too. */
[data-chat-flow-kind="tool-call"],
[data-chat-flow-kind="turn-process"],
[data-chat-flow-kind="context"],
[data-chat-flow-kind="compaction"],
[data-chat-flow-kind="manual-compaction"],
[data-chat-flow-kind="model-retry"],
[data-chat-flow-kind="unknown"],
[data-chat-flow-kind="workflow-run"],
[data-chat-flow-kind="system-prompt"]{display:none!important}
/* A running or mid-turn assistant step renders nothing and must collapse the
   same way. The closing step is the one item that actually contains a deck, so
   it — and only it — keeps its box. */
[data-chat-flow-kind="assistant-step"]:not(:has(.dshdeck-card)){display:none!important}
`

const ALLOWED_TAGS = {
  b: 1, strong: 1, i: 1, em: 1, code: 1, br: 1, ul: 1, ol: 1, li: 1, p: 1, span: 1, mark: 1, pre: 1,
  table: 1, thead: 1, tbody: 1, tr: 1, th: 1, td: 1,
}

const STATUS_ONLY_RE = /^[^。！？]{0,20}(在运行|在跑|运行中|已完成|已经完成|已更新|已经更新|已生效|已就绪|已发布|更新完毕|已结束)/

const TABLE_SEP_RE = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/

function escapeHtml(raw) {
  return String(raw === undefined || raw === null ? '' : raw)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function sanitizeHtml(raw) {
  let s = String(raw === undefined || raw === null ? '' : raw)
  s = s.replace(/<\s*(script|style)[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
  s = s.replace(/<!--[\s\S]*?-->/g, '')
  s = s.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g, function (whole, tag) {
    const name = String(tag).toLowerCase()
    if (ALLOWED_TAGS[name] !== 1) return ''
    return whole.charAt(1) === '/' ? '</' + name + '>' : '<' + name + '>'
  })
  return s
}

function stripTags(value) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripMarkdownInline(value) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]*)\*\*/g, '$1')
    .replace(/__([^_]*)__/g, '$1')
    .replace(/^\s*#{1,6}\s*/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function slideVisibleText(slide) {
  let s = ''
  if (slide && typeof slide.title === 'string') s += ' ' + slide.title
  if (slide && typeof slide.html === 'string') s += ' ' + stripTags(slide.html)
  if (slide && Array.isArray(slide.lines)) s += ' ' + slide.lines.join(' ')
  return s.replace(/\s+/g, ' ').trim()
}

function isThinProcessSlide(slide) {
  const visible = slideVisibleText(slide)
  if (visible.length < 16) return true
  if (visible.length < 60 && STATUS_ONLY_RE.test(visible)) return true
  return false
}

function inlineMarkdown(raw) {
  let t = escapeHtml(raw)
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>')
  t = t.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
  t = t.replace(/__([^_]+)__/g, '<b>$1</b>')
  t = t.replace(/~~([^~]+)~~/g, '<mark>$1</mark>')
  return t
}

function splitTableRow(line) {
  let s = String(line).trim()
  if (s.charAt(0) === '|') s = s.slice(1)
  if (s.charAt(s.length - 1) === '|') s = s.slice(0, -1)
  return s.split('|').map(function (cell) { return cell.trim() })
}

function markdownToHtml(text) {
  const src = String(text === undefined || text === null ? '' : text).replace(/\r\n?/g, '\n')
  const lines = src.split('\n')
  const out = []
  let para = []
  let list = null
  let quote = []
  let fence = null

  function flushPara() {
    if (!para.length) return
    out.push('<p>' + para.map(function (l) { return inlineMarkdown(l) }).join('<br>') + '</p>')
    para = []
  }
  function flushList() {
    if (list === null) return
    const items = list.items.map(function (it) { return '<li>' + inlineMarkdown(it) + '</li>' }).join('')
    out.push('<' + list.type + '>' + items + '</' + list.type + '>')
    list = null
  }
  function flushQuote() {
    if (!quote.length) return
    out.push('<p>' + quote.map(function (l) { return inlineMarkdown(l) }).join('<br>') + '</p>')
    quote = []
  }
  function flushAll() {
    flushPara()
    flushList()
    flushQuote()
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const line = raw.replace(/\s+$/, '')
    const trimmed = line.trim()

    if (fence !== null) {
      if (/^\s*```/.test(line)) {
        out.push('<pre><code>' + escapeHtml(fence.join('\n')) + '</code></pre>')
        fence = null
      } else {
        fence.push(raw)
      }
      continue
    }
    if (/^\s*```/.test(line)) {
      flushAll()
      fence = []
      continue
    }

    if (trimmed === '') {
      flushAll()
      continue
    }

    if (trimmed.indexOf('|') >= 0 && i + 1 < lines.length && TABLE_SEP_RE.test(lines[i + 1].trim())) {
      flushAll()
      const header = splitTableRow(trimmed)
      const rows = []
      let j = i + 2
      while (j < lines.length) {
        const rowLine = lines[j].trim()
        if (rowLine === '' || rowLine.indexOf('|') < 0) break
        rows.push(splitTableRow(rowLine))
        j += 1
      }
      let table = '<table><thead><tr>'
      for (let c = 0; c < header.length; c++) table += '<th>' + inlineMarkdown(header[c]) + '</th>'
      table += '</tr></thead><tbody>'
      for (let r = 0; r < rows.length; r++) {
        table += '<tr>'
        for (let c = 0; c < header.length; c++) {
          table += '<td>' + inlineMarkdown(rows[r][c] === undefined ? '' : rows[r][c]) + '</td>'
        }
        table += '</tr>'
      }
      table += '</tbody></table>'
      out.push(table)
      i = j - 1
      continue
    }

    const heading = /^(#{1,6})\s+(.*\S)\s*$/.exec(trimmed)
    if (heading) {
      flushAll()
      out.push('<p><b>' + inlineMarkdown(heading[2]) + '</b></p>')
      continue
    }

    if (/^(\*\*\*+|---+|_{3,})\s*$/.test(trimmed)) {
      flushAll()
      out.push('<p>\u2014\u2014\u2014</p>')
      continue
    }

    const quoted = /^>\s?(.*)$/.exec(trimmed)
    if (quoted) {
      flushPara()
      flushList()
      quote.push(quoted[1])
      continue
    }

    const bullet = /^[-*+]\s+(.*)$/.exec(trimmed)
    if (bullet) {
      flushPara()
      flushQuote()
      if (list === null || list.type !== 'ul') { flushList(); list = { type: 'ul', items: [] } }
      list.items.push(bullet[1])
      continue
    }

    const ordered = /^\d+[.)]\s+(.*)$/.exec(trimmed)
    if (ordered) {
      flushPara()
      flushQuote()
      if (list === null || list.type !== 'ol') { flushList(); list = { type: 'ol', items: [] } }
      list.items.push(ordered[1])
      continue
    }

    flushList()
    flushQuote()
    para.push(trimmed)
  }

  if (fence !== null) out.push('<pre><code>' + escapeHtml(fence.join('\n')) + '</code></pre>')
  flushAll()
  return out.join('')
}

function truncate(value, max) {
  const s = String(value === undefined || value === null ? '' : value).replace(/\s+/g, ' ').trim()
  if (s.length <= max) return s
  return s.slice(0, max - 1) + '\u2026'
}

function isNum(v) {
  return typeof v === 'number' && isFinite(v)
}

function fmtMs(ms) {
  if (!isNum(ms)) return ''
  if (ms < 1000) return Math.round(ms) + 'ms'
  if (ms < 60000) return (ms / 1000).toFixed(1) + 's'
  return Math.round(ms / 60000) + 'm' + Math.round((ms % 60000) / 1000) + 's'
}

function fmtTok(n) {
  if (!isNum(n)) return ''
  if (n < 1000) return String(Math.round(n))
  if (n < 1000000) return (n / 1000).toFixed(n < 10000 ? 1 : 0) + 'k'
  return (n / 1000000).toFixed(1) + 'M'
}

function textOfBlocks(blocks) {
  if (!Array.isArray(blocks)) return ''
  let out = ''
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]
    if (b && b.kind === 'text' && typeof b.text === 'string') out += (out ? '\n\n' : '') + b.text
  }
  return out
}

function imageSources(blocks) {
  const out = []
  if (!Array.isArray(blocks)) return out
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]
    if (b && b.kind === 'image' && b.attachment) out.push({ attachment: b.attachment })
  }
  return out
}

function toolRow(root) {
  if (!root || typeof root !== 'object') return null
  const settled = root.kind === 'tool-result'
  const call = root.call
  const name = (call && typeof call.name === 'string' && call.name) || (typeof root.name === 'string' && root.name) || 'tool'
  let args = ''
  if (call && typeof call.argsRaw === 'string') args = call.argsRaw
  else if (typeof root.argsRaw === 'string') args = root.argsRaw
  const callTime = isNum(root.callTime) ? root.callTime : null
  const resTime = isNum(root.time) ? root.time : null
  let ms = null
  if (settled && callTime !== null && resTime !== null) ms = Math.max(0, resTime - callTime)
  let err = null
  if (settled && root.error) err = root.error.code || root.error.name || 'error'
  const ok = settled ? root.isError !== true : null
  const subs = []
  if (Array.isArray(root.subCalls)) {
    for (let i = 0; i < root.subCalls.length; i++) {
      const s = toolRow(root.subCalls[i])
      if (s) subs.push(s)
    }
  }
  return { name: name, args: args, ok: ok, ms: ms, err: err, subs: subs }
}

function turnOfNode(node) {
  const loc = node && node.location
  if (loc && (loc.kind === 'turn' || loc.kind === 'step') && loc.turn && isNum(loc.turn.turn)) return loc.turn.turn
  return -1
}

function findTurnByMessage(snapshot, messageId) {
  if (!snapshot || !messageId) return -1
  const order = snapshot.order
  const store = snapshot.nodes
  if (!Array.isArray(order) || !store || typeof store.get !== 'function') return -1
  for (let i = 0; i < order.length; i++) {
    const node = store.get(order[i])
    if (!node || node.kind !== 'assistant-step') continue
    const finalNode = node.data && node.data.finalNode
    if (finalNode && finalNode.messageId === messageId) {
      const turn = turnOfNode(node)
      if (turn >= 0) return turn
    }
  }
  return -1
}

/** Key of the turn's last assistant-step node, or null when it has none. */
function lastAssistantKey(snapshot, turnNo) {
  if (!snapshot || !isNum(turnNo) || turnNo < 0) return null
  const locs = snapshot.locations
  const store = snapshot.nodes
  if (!locs || typeof locs.getTurn !== 'function' || !store || typeof store.get !== 'function') return null
  const keys = locs.getTurn(turnNo)
  if (!Array.isArray(keys)) return null
  let last = null
  for (let i = 0; i < keys.length; i++) {
    const n = store.get(keys[i])
    if (n && n.kind === 'assistant-step') last = keys[i]
  }
  return last
}

function closingAssistantSeq(snapshot, turnNo) {
  if (!snapshot || !isNum(turnNo) || turnNo < 0) return null
  const locs = snapshot.locations
  const store = snapshot.nodes
  if (!locs || typeof locs.getTurn !== 'function' || !store || typeof store.get !== 'function') return null
  const keys = locs.getTurn(turnNo)
  if (!Array.isArray(keys)) return null
  for (let i = 0; i < keys.length; i++) {
    const n = store.get(keys[i])
    if (n && n.kind === 'turn-tail' && n.data && n.data.closing && n.data.closing.finalNode) {
      const seq = n.data.closing.finalNode.seq
      return isNum(seq) ? seq : null
    }
  }
  return null
}

function buildModel(chat, turnNo) {
  const model = {
    turn: turnNo,
    prompt: '',
    text: '',
    runMs: null,
    toolCount: 0,
    toolFailures: 0,
    problems: [],
    tokenUsage: null,
    tools: [],
  }

  let turnLoc = null
  if (chat && chat.timeline && chat.timeline.turns && typeof chat.timeline.turns.get === 'function') {
    turnLoc = chat.timeline.turns.get(turnNo) || null
  }
  if (turnLoc && turnLoc.start && turnLoc.end && isNum(turnLoc.start.time) && isNum(turnLoc.end.time)) {
    model.runMs = Math.max(0, turnLoc.end.time - turnLoc.start.time)
  }

  if (chat && chat.navigation && typeof chat.navigation.items === 'function') {
    const items = chat.navigation.items()
    if (Array.isArray(items)) {
      for (let i = 0; i < items.length; i++) {
        const it = items[i]
        if (it && it.turn === turnNo) {
          if (typeof it.prompt === 'string') model.prompt = it.prompt
          break
        }
      }
    }
  }

  let keys = []
  if (chat && chat.locations && typeof chat.locations.getTurn === 'function') {
    const got = chat.locations.getTurn(turnNo)
    if (Array.isArray(got)) keys = got
  }
  const store = chat && chat.nodes ? chat.nodes : null
  if (store && typeof store.get === 'function') {
    for (let i = 0; i < keys.length; i++) {
      const node = store.get(keys[i])
      if (!node) continue
      const data = node.data
      if (node.kind === 'assistant-step') {
        const piece = textOfBlocks(data && data.blocks)
        if (piece) model.text = model.text ? model.text + '\n\n' + piece : piece
      } else if (node.kind === 'tool-call') {
        const row = toolRow(data && data.root)
        if (row) {
          model.tools.push(row)
          model.toolCount += 1
          if (row.ok === false) model.toolFailures += 1
          for (let s = 0; s < row.subs.length; s++) model.tools.push(row.subs[s])
        }
      } else if (node.kind === 'turn-error') {
        model.problems.push({ kind: 'error', message: (data && data.message) || '', code: (data && data.code) || '' })
      } else if (node.kind === 'turn-max-tokens') {
        model.problems.push({ kind: 'max-tokens' })
      } else if (node.kind === 'model-retry') {
        const attempts = data && Array.isArray(data.attempts) ? data.attempts.length : 0
        model.problems.push({ kind: 'retry', attempts: attempts })
      } else if (node.kind === 'compaction') {
        model.problems.push({ kind: 'compaction', shadowed: data ? data.shadowedItemCount : null })
      } else if (node.kind === 'turn-tail') {
        if (data && data.tokenUsage) model.tokenUsage = data.tokenUsage
      }
    }
  }

  return model
}

function parseSections(text) {
  const lines = String(text || '').split('\n')
  let sawHeading = false
  const sections = []
  let cur = null
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/\s+$/, '')
    const m = /^\s{0,3}#{1,6}\s+(.*\S)\s*$/.exec(line)
    if (m) {
      sawHeading = true
      cur = { heading: m[1], lines: [] }
      sections.push(cur)
      continue
    }
    if (cur === null) {
      cur = { heading: '', lines: [] }
      sections.push(cur)
    }
    cur.lines.push(line)
  }
  if (!sawHeading) {
    const paras = []
    let buf = []
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].replace(/\s+$/, '')
      if (line.trim() === '') {
        if (buf.length) { paras.push(buf); buf = [] }
        continue
      }
      buf.push(line)
    }
    if (buf.length) paras.push(buf)
    return paras.map(function (p) { return { heading: '', lines: p } })
  }
  return sections
    .map(function (s) {
      const l = s.lines.slice()
      while (l.length && l[0].trim() === '') l.shift()
      while (l.length && l[l.length - 1].trim() === '') l.pop()
      return { heading: s.heading, lines: l }
    })
    .filter(function (s) { return s.heading !== '' || s.lines.length > 0 })
}

function deriveTitle(lines, fallback) {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() !== '') return truncate(stripMarkdownInline(lines[i].replace(/^[-*+]\s+/, '').replace(/^\d+[.)]\s+/, '')), 62)
  }
  return fallback
}

function stripLines(lines, max) {
  const out = []
  for (let i = 0; i < lines.length && out.length < max; i++) out.push(lines[i])
  return out
}

const CONCLUSION_RE = /(结论|总结|小结|结果|要点|建议|综上|Summary|Conclusion|Result|TL;?DR|Takeaway|Bottom line)/i

function splitConclusion(text) {
  const sections = parseSections(text)
  if (!sections.length) return { conclusion: null, rest: [] }
  let idx = -1
  for (let i = sections.length - 1; i >= 0; i--) {
    if (sections[i].heading && CONCLUSION_RE.test(sections[i].heading)) { idx = i; break }
  }
  if (idx < 0) idx = sections.length >= 3 ? sections.length - 1 : 0
  const rest = []
  for (let i = 0; i < sections.length; i++) if (i !== idx) rest.push(sections[i])
  const c = sections[idx]
  const body = c.lines.slice()
  if (!c.heading && body.length) body.shift()
  return {
    conclusion: { title: c.heading || deriveTitle(c.lines, ''), lines: stripLines(body.filter(function (l) { return l.trim() !== '' }), 14) },
    rest: rest,
  }
}

function chunkSections(sections, maxSlides, maxLines) {
  const out = []
  let cur = null
  function flush() {
    if (!cur) return
    if (!cur.title) {
      const at = cur.lines.findIndex(function (l) { return l.trim() !== '' })
      if (at >= 0) {
        cur.title = truncate(stripMarkdownInline(cur.lines[at].replace(/^[-*+]\s+/, '').replace(/^\d+[.)]\s+/, '')), 62)
        cur.lines = cur.lines.slice(at + 1)
      }
    }
    while (cur.lines.length && cur.lines[cur.lines.length - 1].trim() === '') cur.lines.pop()
    if (cur.title || cur.lines.length) out.push(cur)
    cur = null
  }
  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i]
    if (cur && sec.heading) flush()
    if (!cur) cur = { kicker: '\u8fc7\u7a0b', title: sec.heading || '', lines: [] }
    else if (sec.heading && !cur.title) cur.title = sec.heading
    for (let k = 0; k < sec.lines.length; k++) {
      if (cur.lines.length >= maxLines) {
        const carried = cur.title
        flush()
        cur = { kicker: '\u8fc7\u7a0b', title: carried ? carried + '\uff08\u7eed\uff09' : '', lines: [] }
      }
      cur.lines.push(sec.lines[k])
    }
  }
  flush()
  return out
}

function extractQuestions(text) {
  const lines = String(text || '').split('\n')
  const found = []
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim()
    if (!raw) continue
    const cleaned = raw.replace(/^[-*+]\s+/, '').replace(/^\d+[.)]\s+/, '').replace(/^#{1,6}\s*/, '').replace(/\*\*/g, '').trim()
    if (!/[?\uff1f]\s*$/.test(cleaned)) continue
    if (cleaned.length < 8) continue
    const options = []
    for (let k = i + 1; k < lines.length; k++) {
      const next = lines[k].trim()
      if (next === '') { if (options.length) break; continue }
      const m = /^(?:[-*+]|\d+[.)])\s+(.+)$/.exec(next)
      if (!m) break
      const label = m[1].replace(/\*\*/g, '').trim()
      const parts = label.split(/\s+[\u2014\u2013-]{1,2}\s+|\uff1a|:\s+/)
      options.push({ label: truncate(parts[0], 70), desc: parts.length > 1 ? truncate(parts.slice(1).join(' '), 90) : '' })
      if (options.length >= 6) break
    }
    found.push({ question: truncate(cleaned, 140), options: options })
  }
  return found.slice(-3)
}

/**
 * The slice of a turn model the rewrite actually reads. `slidesFromPlain` uses
 * `prompt` for a title fallback and hands the rest to `plainMeta`, so the
 * rewrite's input is exactly these five fields.
 *
 * This is defined once, here, instead of as an inline literal at the call site,
 * because the bug that killed every rewrite was precisely a hand-written
 * narrower object: the plumbing was given a bare `{ prompt }`, the missing
 * `problems` made `plainMeta` read `.length` off undefined, the catch swallowed
 * the TypeError, and the card silently fell back to the local renderer on every
 * single turn since the feature shipped.
 *
 * It selects rather than defaults: a missing field stays missing so the
 * consumer still fails loudly rather than quietly reporting "正常完成".
 */
function plainModelView(model) {
  return {
    prompt: model ? model.prompt : '',
    problems: model ? model.problems : [],
    toolFailures: model ? model.toolFailures : 0,
    runMs: model ? model.runMs : null,
    toolCount: model ? model.toolCount : 0,
  }
}

function plainMeta(model) {
  const bits = []
  if (model.problems.length) bits.push('\u6709\u95ee\u9898')
  else if (model.toolFailures) bits.push('\u6709\u5931\u8d25\u7684\u64cd\u4f5c')
  else bits.push('\u6b63\u5e38\u5b8c\u6210')
  if (model.runMs !== null) bits.push('\u8017\u65f6 ' + fmtMs(model.runMs))
  if (model.toolCount) bits.push('\u6267\u884c\u4e86 ' + model.toolCount + ' \u4e2a\u64cd\u4f5c')
  return bits.join('  \u00b7  ')
}

function technicalBits(model) {
  const bits = []
  if (model.runMs !== null) bits.push('\u8017\u65f6 ' + fmtMs(model.runMs))
  bits.push(model.toolCount + ' \u6b21\u5de5\u5177\u8c03\u7528')
  const u = model.tokenUsage
  if (u && isNum(u.totalTokens)) bits.push(fmtTok(u.totalTokens) + ' tokens')
  if (model.problems.length) {
    for (let i = 0; i < model.problems.length; i++) {
      const p = model.problems[i]
      if (p.kind === 'error') bits.push('\u5931\u8d25: ' + truncate(p.message || p.code || '', 60))
      else if (p.kind === 'max-tokens') bits.push('\u8fbe\u5230\u8f93\u51fa\u4e0a\u9650')
      else if (p.kind === 'retry') bits.push('\u91cd\u8bd5 ' + p.attempts + ' \u6b21')
      else if (p.kind === 'compaction') bits.push('\u4e0a\u4e0b\u6587\u538b\u7f29')
    }
  }
  return bits.join('  \u00b7  ')
}

function problemLine(p) {
  if (p.kind === 'error') return '\u26a0 \u51fa\u4e86\u95ee\u9898\uff1a' + truncate(p.message || p.code || '\u672a\u77e5\u9519\u8bef', 90)
  if (p.kind === 'max-tokens') return '\u26a0 \u8f93\u51fa\u8fc7\u957f\u88ab\u622a\u65ad\u4e86'
  if (p.kind === 'retry') return '\u26a0 \u91cd\u8bd5\u4e86 ' + p.attempts + ' \u6b21\u624d\u6210\u529f'
  if (p.kind === 'compaction') return '\u00b7 \u4e2d\u9014\u6574\u7406\u8fc7\u4e00\u6b21\u8bb0\u5fc6'
  return ''
}

const TOOL_LABELS = {
  bash: '\u6267\u884c\u547d\u4ee4',
  read: '\u9605\u8bfb\u6587\u4ef6',
  read_image: '\u67e5\u770b\u56fe\u7247',
  write: '\u5199\u5165\u6587\u4ef6',
  edit: '\u4fee\u6539\u6587\u4ef6',
  glob: '\u67e5\u627e\u6587\u4ef6',
  grep: '\u641c\u7d22\u5185\u5bb9',
  present: '\u63d0\u4ea4\u6210\u679c',
  skill: '\u67e5\u9605\u6307\u5f15',
  todo_write: '\u8bb0\u5f55\u5f85\u529e',
  ask_user_question: '\u5411\u4f60\u63d0\u95ee',
  web_search: '\u8054\u7f51\u641c\u7d22',
  web_fetch: '\u6253\u5f00\u7f51\u9875',
  job_output: '\u67e5\u770b\u540e\u53f0\u8fdb\u5ea6',
  job_list: '\u5217\u51fa\u540e\u53f0\u4efb\u52a1',
  job_kill: '\u53d6\u6d88\u540e\u53f0\u4efb\u52a1',
  create_goal: '\u8bbe\u5b9a\u76ee\u6807',
  get_goal: '\u67e5\u770b\u76ee\u6807',
  update_goal: '\u66f4\u65b0\u76ee\u6807',
  exit_plan_mode: '\u63d0\u4ea4\u65b9\u6848',
  subagent: '\u6d3e\u53d1\u5b50\u4efb\u52a1',
  subagent_fork: '\u6d3e\u751f\u4e00\u4e2a\u5b50\u4efb\u52a1',
  workflow: '\u7f16\u6392\u591a\u9879\u4efb\u52a1',
  ralph: '\u53cd\u590d\u8fed\u4ee3',
  send_message: '\u7ed9\u5b50\u4efb\u52a1\u53d1\u6d88\u606f',
  interrupt_agent: '\u4e2d\u6b62\u5b50\u4efb\u52a1',
  list_agents: '\u67e5\u770b\u5b50\u4efb\u52a1',
  cordis_define: '\u5b9a\u4e49\u63d2\u4ef6',
  cordis_run: '\u542f\u7528\u63d2\u4ef6',
  cordis_stop: '\u505c\u7528\u63d2\u4ef6',
  cordis_undefine: '\u5220\u9664\u63d2\u4ef6',
  cordis_inspect_list: '\u67e5\u770b\u53ef\u7528\u80fd\u529b',
  cordis_inspect_query: '\u67e5\u8be2\u8fd0\u884c\u65f6\u63a5\u53e3',
  cordis_inspect_self: '\u67e5\u770b\u5f53\u524d\u63d2\u4ef6',
}

const TOOL_FALLBACKS = [
  [/search/i, '\u641c\u7d22'],
  [/fetch|http|web|url/i, '\u8054\u7f51\u8bfb\u53d6'],
  [/read|view|open|show/i, '\u9605\u8bfb'],
  [/write|edit|patch|replace/i, '\u4fee\u6539'],
  [/bash|shell|exec|command|terminal/i, '\u6267\u884c\u547d\u4ee4'],
  [/goal|plan|todo/i, '\u76ee\u6807\u76f8\u5173\u64cd\u4f5c'],
  [/agent|subagent|delegate/i, '\u5b50\u4efb\u52a1\u76f8\u5173\u64cd\u4f5c'],
  [/job|task|background/i, '\u540e\u53f0\u4efb\u52a1\u76f8\u5173\u64cd\u4f5c'],
  [/skill|doc|reference/i, '\u67e5\u9605\u6307\u5f15'],
]

/** Plain-language label for one wire tool name; never returns a raw tool name. */
function toolLabel(name) {
  const raw = String(name === undefined || name === null ? '' : name)
  if (Object.prototype.hasOwnProperty.call(TOOL_LABELS, raw)) return TOOL_LABELS[raw]
  for (let i = 0; i < TOOL_FALLBACKS.length; i++) {
    if (TOOL_FALLBACKS[i][0].test(raw)) return TOOL_FALLBACKS[i][1]
  }
  return '\u6267\u884c\u4e86\u4e00\u4e2a\u64cd\u4f5c'
}

/** Argument keys whose value names the thing a call is acting on. */
const TARGET_KEYS = ['file_path', 'filePath', 'path', 'pattern']

/** Last path segment of a path-ish value, without any directory component. */
function baseName(value) {
  const raw = String(value === undefined || value === null ? '' : value).trim()
  if (raw === '') return ''
  const parts = raw.split(/[\\/]/)
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i] !== '') return parts[i]
  }
  return ''
}

/**
 * One short, plain target parsed from a tool call's raw arguments. Returns ''
 * when the call names nothing worth showing — a command, a query, or arguments
 * that are not JSON. Never returns a directory path.
 */
function targetHint(rawArgs) {
  if (typeof rawArgs !== 'string' || rawArgs.trim() === '') return ''
  let parsed = null
  try {
    parsed = JSON.parse(rawArgs)
  } catch (error) {
    return ''
  }
  if (!parsed || typeof parsed !== 'object') return ''
  for (let i = 0; i < TARGET_KEYS.length; i++) {
    const value = parsed[TARGET_KEYS[i]]
    if (typeof value === 'string' && value.trim() !== '') {
      const name = baseName(value)
      if (name !== '') return truncate(name, 28)
    }
  }
  return ''
}

/** How many process lines the working box keeps on screen. */
const WORKING_LINES = 2

/**
 * The process lines the working box shows, oldest first: the most recent things
 * the agent did, in plain language. Never returns a raw tool name, a command, or
 * a directory path — the detail lives in the Trajectory.
 */
function workingLines(model) {
  const tools = model && Array.isArray(model.tools) ? model.tools : []
  const out = []
  for (let i = tools.length - 1; i >= 0 && out.length < WORKING_LINES; i--) {
    const row = tools[i]
    if (!row) continue
    const label = toolLabel(row.name)
    const hint = targetHint(row.args)
    out.unshift(hint === '' ? label : label + ' · ' + hint)
  }
  return out.length ? out : ['\u6b63\u5728\u7406\u6e05\u8be5\u600e\u4e48\u505a\u2026']
}

/**
 * The turn that is still running, or -1. The shipped turn-status label uses the
 * same `status === 'open'` signal, so the box and the label agree on when the
 * agent is working.
 */
function runningTurnNo(chat) {
  const turns = chat && chat.timeline && chat.timeline.turns
  if (!turns || typeof turns.forEach !== 'function') return -1
  let latest = -1
  turns.forEach(function (value, key) {
    if (!value || value.status !== 'open') return
    const n = isNum(key) ? key : Number(key)
    if (isNum(n) && n > latest) latest = n
  })
  return latest
}

function buildSlides(model, fallbackText) {
  const slides = []
  const source = fallbackText || ''
  const split = splitConclusion(source)

  const cLines = []
  if (split.conclusion && split.conclusion.lines.length) {
    for (let i = 0; i < split.conclusion.lines.length; i++) cLines.push(split.conclusion.lines[i])
  } else {
    cLines.push('\u672c\u8f6e\u6ca1\u6709\u660e\u786e\u7684\u7ed3\u8bba\u6587\u672c\u3002')
  }
  if (model.problems.length) {
    for (let i = 0; i < model.problems.length; i++) {
      const line = problemLine(model.problems[i])
      if (line) cLines.push(line)
    }
  } else if (model.toolFailures) {
    cLines.push('\u26a0 \u6709 ' + model.toolFailures + ' \u6b21\u64cd\u4f5c\u6ca1\u6210\u529f\u3002')
  }

  slides.push({
    kind: 'conclusion',
    kicker: '\u7ed3\u8bba',
    title: stripMarkdownInline(split.conclusion && split.conclusion.title) || (model.prompt ? truncate(model.prompt, 56) : '\u672c\u8f6e\u7ed3\u8bba'),
    html: markdownToHtml(cLines.join('\n')),
    meta: plainMeta(model),
  })

  const process = []
  if (model.tools.length) {
    const toolLines = model.tools.slice(0, 10).map(function (t) {
      const tail = []
      if (t.ok === false) tail.push('\u6ca1\u6210\u529f')
      if (isNum(t.ms)) tail.push(fmtMs(t.ms))
      return '\u00b7 ' + toolLabel(t.name) + (tail.length ? '  \u2014  ' + tail.join(' \u00b7 ') : '')
    })
    process.push({
      kind: 'process',
      kicker: '\u8fc7\u7a0b',
      title: '\u505a\u4e86 ' + model.tools.length + ' \u4ef6\u4e8b',
      html: markdownToHtml(toolLines.join('\n')),
    })
  }
  const chunked = chunkSections(split.rest, 40, 9)
  for (let i = 0; i < chunked.length; i++) {
    chunked[i].kind = 'process'
    chunked[i].title = stripMarkdownInline(chunked[i].title) || '\u8fc7\u7a0b'
    chunked[i].html = markdownToHtml((chunked[i].lines || []).join('\n'))
    chunked[i].lines = []
    process.push(chunked[i])
  }

  const kept = []
  for (let i = 0; i < process.length; i++) {
    if (!isThinProcessSlide(process[i])) kept.push(process[i])
  }
  for (let i = 0; i < kept.length && i < 5; i++) slides.push(kept[i])

  const questions = extractQuestions(source)
  for (let i = 0; i < questions.length; i++) {
    slides.push({
      kind: 'question',
      kicker: questions.length > 1 ? '\u95ee\u9898 ' + (i + 1) + ' / ' + questions.length : '\u9700\u8981\u4f60\u7684\u51b3\u5b9a',
      title: questions[i].question,
      lines: [],
      options: questions[i].options,
    })
  }
  return slides
}

const PLAIN_TAGS = {
  TITLE: 'title',
  RESULT: 'result',
  CONCLUSION: 'result',
  STEP: 'steptitle',
  DETAIL: 'stepdetail',
  WHY: 'stepdetail',
  HOW: 'stepdetail',
  BODY: 'stepdetail',
  ASK: 'ask',
  QUESTION: 'ask',
  OPT: 'opt',
  OPTION: 'opt',
}

function slidesFromPlain(raw, model) {
  const lines = String(raw || '').split('\n')
  let title = ''
  let result = ''
  const steps = []
  const asks = []
  let curStep = null
  let curAsk = null
  let lastKind = null

  function appendTo(kind, text) {
    if (kind === 'title') title = title ? title + '\n' + text : text
    else if (kind === 'result') result = result ? result + '\n' + text : text
    else if (kind === 'steptitle' && curStep) curStep.title = curStep.title ? curStep.title + '\n' + text : text
    else if (kind === 'stepdetail' && curStep) curStep.detail = curStep.detail ? curStep.detail + '\n' + text : text
    else if (kind === 'ask' && curAsk) curAsk.question = curAsk.question ? curAsk.question + '\n' + text : text
    else if (kind === 'opt' && curAsk && curAsk.options.length) {
      const last = curAsk.options[curAsk.options.length - 1]
      last.label = last.label ? last.label + '\n' + text : text
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line === '') continue
    const m = /^([A-Za-z]+)\s*[:\uff1a]\s*([\s\S]*)$/.exec(line)
    if (m) {
      const tag = m[1].toUpperCase()
      const kind = PLAIN_TAGS[tag]
      if (kind !== undefined) {
        const value = m[2].trim()
        if (kind === 'title') { title = value; lastKind = 'title' }
        else if (kind === 'result') { result = value; lastKind = 'result' }
        else if (kind === 'steptitle') { curStep = { title: value, detail: '' }; steps.push(curStep); curAsk = null; lastKind = 'steptitle' }
        else if (kind === 'stepdetail') { if (curStep) curStep.detail = value; lastKind = 'stepdetail' }
        else if (kind === 'ask') { curAsk = { question: value, options: [] }; asks.push(curAsk); curStep = null; lastKind = 'ask' }
        else if (kind === 'opt') { if (curAsk) curAsk.options.push({ label: value }); lastKind = 'opt' }
        continue
      }
    }
    if (lastKind !== null) appendTo(lastKind, line)
  }

  if (result === '' && steps.length === 0) return null

  const slides = []
  slides.push({
    kind: 'conclusion',
    kicker: '\u7ed3\u8bba',
    title: stripTags(title) || (model.prompt ? truncate(model.prompt, 56) : '\u672c\u8f6e\u7ed3\u8bba'),
    html: result ? sanitizeHtml(result) : '\u672c\u8f6e\u5df2\u5b8c\u6210\u3002',
    meta: plainMeta(model),
  })

  const processSlides = []
  for (let i = 0; i < steps.length; i++) {
    processSlides.push({
      kind: 'process',
      kicker: '\u8fc7\u7a0b',
      title: stripTags(steps[i].title) || '\u8fc7\u7a0b',
      html: steps[i].detail ? sanitizeHtml(steps[i].detail) : '',
    })
  }
  if (processSlides.length === 0) {
    processSlides.push({ kind: 'process', kicker: '\u8fc7\u7a0b', title: '\u672c\u8f6e\u6ca1\u6709\u9700\u8981\u989d\u5916\u89e3\u91ca\u7684\u6b65\u9aa4', html: '' })
  }
  let kept = 0
  for (let i = 0; i < processSlides.length && kept < 5; i++) {
    if (isThinProcessSlide(processSlides[i])) continue
    slides.push(processSlides[i])
    kept += 1
  }

  for (let i = 0; i < asks.length && i < 3; i++) {
    slides.push({
      kind: 'question',
      kicker: asks.length > 1 ? '\u95ee\u9898 ' + (i + 1) + ' / ' + asks.length : '\u9700\u8981\u4f60\u7684\u51b3\u5b9a',
      title: stripTags(asks[i].question),
      lines: [],
      options: asks[i].options.map(function (o) { return { label: stripTags(o.label), desc: '' } }),
    })
  }
  return slides
}

function chevron(dir) {
  return React.createElement(
    'svg',
    { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('path', { d: dir < 0 ? 'M10 3 5 8l5 5' : 'M6 3l5 5-5 5' }),
  )
}

function closeIcon() {
  return React.createElement(
    'svg',
    { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' },
    React.createElement('path', { d: 'M4 4l8 8M12 4l-8 8' }),
  )
}

function screenIcon() {
  return React.createElement(
    'svg',
    { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('rect', { x: 2, y: 2.5, width: 12, height: 8.5, rx: 1.6 }),
    React.createElement('path', { d: 'M8 11v2.5M5.5 13.5h5' }),
  )
}

function stretchIcon(out) {
  return React.createElement(
    'svg',
    { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('path', { d: out ? 'M4 6.5 8 2.5l4 4' : 'M4 2.5 8 6.5l4-4' }),
    React.createElement('path', { d: out ? 'M4 9.5 8 13.5l4-4' : 'M4 13.5 8 9.5l4 4' }),
  )
}

function textIcon() {
  return React.createElement(
    'svg',
    { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' },
    React.createElement('path', { d: 'M3 4h10M3 7h10M3 10h7M3 13h5' }),
  )
}

function useNothing() {
  return undefined
}

function useConversationHeight(ref, enabled) {
  const [height, setHeight] = React.useState(null)
  React.useEffect(function () {
    if (!enabled) return undefined
    const el = ref.current
    if (!el) return undefined
    if (typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') return undefined

    function measure() {
      let node = el.parentElement
      let found = null
      let guard = 0
      while (node && guard < 40) {
        guard += 1
        const cs = window.getComputedStyle(node)
        const oy = cs ? cs.overflowY : ''
        if ((oy === 'auto' || oy === 'scroll' || oy === 'overlay') && node.clientHeight > 80) {
          found = node.clientHeight
          break
        }
        node = node.parentElement
      }
      if (found === null) {
        const rect = el.getBoundingClientRect()
        const vh = isNum(window.innerHeight) ? window.innerHeight : 0
        if (vh > 0) found = vh - rect.top - 132
      }
      if (isNum(found) && found > 200) setHeight(Math.round(found))
    }

    measure()
    let ro = null
    if (typeof ResizeObserver !== 'undefined') {
      try {
        ro = new ResizeObserver(measure)
        ro.observe(el)
      } catch (err) {
        ro = null
      }
    }
    window.addEventListener('resize', measure)
    return function () {
      window.removeEventListener('resize', measure)
      if (ro) ro.disconnect()
    }
  }, [enabled])
  return height
}

function QuestionSlide(props) {
  const question = props.question
  const options = question.options || []
  const inputActions = props.inputActions
  const composeAnswer = props.composeAnswer
  const [custom, setCustom] = React.useState('')
  const [filled, setFilled] = React.useState('')

  function fill(text) {
    const value = String(text || '').trim()
    if (!value) return
    const merged = composeAnswer ? composeAnswer(value) : value
    setFilled(merged)
    if (inputActions && typeof inputActions.setDraft === 'function') inputActions.setDraft(merged)
  }

  function send() {
    const value = filled || custom
    if (!value) return
    if (inputActions && typeof inputActions.setDraft === 'function') inputActions.setDraft(value)
    if (inputActions && typeof inputActions.submit === 'function') inputActions.submit()
  }

  const children = []
  if (options.length) {
    children.push(React.createElement(
      'div',
      { key: 'o', className: 'dshdeck-opts' },
      options.map(function (opt, i) {
        return React.createElement(
          'button',
          { key: i, type: 'button', className: 'dshdeck-opt', onClick: function () { fill(opt.label) } },
          opt.label,
          opt.desc ? React.createElement('div', { className: 'dshdeck-opt-desc' }, opt.desc) : null,
        )
      }),
    ))
  }
  children.push(React.createElement(
    'div',
    { key: 'a', className: 'dshdeck-answer' },
    React.createElement('textarea', {
      className: 'dshdeck-ta',
      value: custom,
      placeholder: '\u6216\u8005\u76f4\u63a5\u8f93\u5165\u4f60\u7684\u56de\u590d\u2026',
      onChange: function (e) { setCustom(e.target.value) },
    }),
    React.createElement(
      'div',
      { className: 'dshdeck-row' },
      React.createElement('button', { type: 'button', className: 'dshdeck-btn', onClick: function () { fill(custom) } }, '\u586b\u5165\u8f93\u5165\u6846'),
      React.createElement('button', { type: 'button', className: 'dshdeck-btn', 'data-primary': 'true', onClick: send }, '\u53d1\u9001'),
      filled ? React.createElement('span', { className: 'dshdeck-note' }, '\u5df2\u586b\u5165\uff1a' + truncate(filled, 40)) : null,
    ),
  ))
  return React.createElement('div', { className: 'dshdeck-body' }, children)
}

function Deck(props) {
  const model = props.model
  const slides = props.slides
  const variant = props.variant
  const fullText = props.fullText || ''
  const images = props.images || []
  const plainState = props.plainState || 'local'
  const technicalText = props.technicalText || ''
  const total = slides.length
  const [page, setPage] = React.useState(0)
  const [expand, setExpand] = React.useState(false)
  const [rawMode, setRawMode] = React.useState(false)
  const rootRef = React.useRef(null)
  const convHeight = useConversationHeight(rootRef, variant === 'inline')

  const index = Math.max(0, Math.min(page, total - 1))
  const slide = slides[index]
  const cardHeight = convHeight === null
    ? null
    : expand
      ? convHeight
      : Math.max(300, Math.min(600, Math.round(convHeight * 0.6)))

  function go(delta) {
    setPage(function (prev) {
      const next = prev + delta
      if (next < 0) return total - 1
      if (next >= total) return 0
      return next
    })
  }

  let imageNode = null
  if (images.length && typeof props.renderMessageImages === 'function') {
    try {
      imageNode = props.renderMessageImages({ images: images, align: 'start' })
    } catch (err) {
      imageNode = null
    }
  }

  const flag = plainState === 'pending' ? '\u901a\u4fd7\u5316\u4e2d\u2026' : rawMode ? '\u539f\u6587' : plainState === 'plain' ? '\u901a\u4fd7\u7248' : ''

  const head = React.createElement(
    'div',
    { className: 'dshdeck-head' },
    React.createElement('span', { className: 'dshdeck-badge' }, variant === 'stage' ? 'DECK' : 'SLIDES'),
    React.createElement('span', { className: 'dshdeck-count' }, index + 1 + ' / ' + total),
    flag ? React.createElement('span', { className: 'dshdeck-flag' }, '\u00b7 ' + flag) : null,
    React.createElement('span', { className: 'dshdeck-grow' }),
    fullText
      ? React.createElement(
          'button',
          {
            type: 'button',
            className: 'dshdeck-icon',
            'data-on': rawMode ? 'true' : 'false',
            'aria-label': rawMode ? '\u56de\u5230\u5e7b\u706f\u7247' : '\u770b\u5b8c\u6574\u539f\u6587',
            title: rawMode ? '\u56de\u5230\u5e7b\u706f\u7247' : '\u770b\u5b8c\u6574\u539f\u6587',
            onClick: function () { setRawMode(function (v) { return !v }) },
          },
          textIcon(),
        )
      : null,
    convHeight === null
      ? null
      : React.createElement(
          'button',
          {
            type: 'button',
            className: 'dshdeck-icon',
            'data-on': expand ? 'true' : 'false',
            'aria-label': expand ? '\u6536\u8d77\u5361\u7247\u9ad8\u5ea6' : '\u5c55\u5f00\u5230\u6574\u5c4f\u9ad8\u5ea6',
            title: expand ? '\u6536\u8d77\u5361\u7247\u9ad8\u5ea6' : '\u5c55\u5f00\u5230\u6574\u5c4f\u9ad8\u5ea6',
            onClick: function () { setExpand(function (v) { return !v }) },
          },
          stretchIcon(expand),
        ),
    props.onClose
      ? React.createElement('button', { type: 'button', className: 'dshdeck-icon', 'aria-label': '\u5173\u95ed', title: '\u5173\u95ed', onClick: props.onClose }, closeIcon())
      : null,
  )

  let body = null
  if (rawMode) {
    const kids = []
    if (technicalText) kids.push(React.createElement('div', { key: 's', className: 'dshdeck-rawstats' }, technicalText))
    kids.push(React.createElement('div', { key: 't', className: 'dshdeck-raw' }, fullText))
    body = React.createElement('div', { className: 'dshdeck-rawbody' }, kids)
  } else if (slide.kind === 'question') {
    body = React.createElement(QuestionSlide, {
      question: slide,
      inputActions: props.inputActions,
      composeAnswer: props.composeAnswer,
    })
  } else {
    const linesNode = typeof slide.html === 'string'
      ? React.createElement('div', { className: 'dshdeck-html', dangerouslySetInnerHTML: { __html: slide.html } })
      : (slide.lines || []).map(function (line, i) {
          return React.createElement('div', { key: i, className: 'dshdeck-line' }, line === '' ? '\u00a0' : line)
        })
    body = React.createElement(
      'div',
      { className: 'dshdeck-body' },
      React.createElement('div', { className: 'dshdeck-kicker' }, slide.kicker || ''),
      React.createElement('div', { className: 'dshdeck-title' }, slide.title || ''),
      React.createElement('div', { className: 'dshdeck-lines' }, linesNode),
      slide.meta ? React.createElement('div', { className: 'dshdeck-meta' }, slide.meta) : null,
      imageNode ? React.createElement('div', { className: 'dshdeck-images' }, imageNode) : null,
    )
  }

  const foot = React.createElement(
    'div',
    { className: 'dshdeck-foot' },
    React.createElement('button', { type: 'button', className: 'dshdeck-icon', 'aria-label': '\u4e0a\u4e00\u9875', title: '\u4e0a\u4e00\u9875', onClick: function () { go(-1) } }, chevron(-1)),
    React.createElement(
      'div',
      { className: 'dshdeck-dots' },
      slides.map(function (s, i) {
        return React.createElement('button', {
          key: i, type: 'button', className: 'dshdeck-dot',
          'data-on': i === index ? 'true' : 'false',
          'data-ask': s.kind === 'question' ? 'true' : 'false',
          title: s.title || String(i + 1),
          'aria-label': '\u7b2c ' + (i + 1) + ' \u9875',
          onClick: function () { setPage(i) },
        })
      }),
    ),
    React.createElement('button', { type: 'button', className: 'dshdeck-icon', 'aria-label': '\u4e0b\u4e00\u9875', title: '\u4e0b\u4e00\u9875', onClick: function () { go(1) } }, chevron(1)),
  )

  return React.createElement(
    'div',
    {
      className: 'dshdeck-card dshdeck-' + variant,
      ref: rootRef,
      style: cardHeight !== null ? { height: cardHeight + 'px' } : undefined,
    },
    head,
    body,
    foot,
  )
}

__expose({ buildSlides: buildSlides, slidesFromPlain: slidesFromPlain, plainModelView: plainModelView, markdownToHtml: markdownToHtml, sanitizeHtml: sanitizeHtml, toolLabel: toolLabel, TOOL_LABELS: TOOL_LABELS, workingLines: workingLines, runningTurnNo: runningTurnNo, targetHint: targetHint, baseName: baseName })
return {
  apply(ctx) {
    const slots = ctx.get('slots')
    if (slots === undefined) return

    ctx.effect(function () { return styles.insert(CSS) }, 'dshdeck: styles')

    const plainCache = new Map()
    const plainSubs = new Set()
    const plainModelStash = new Map()
    function notifyPlain() { plainSubs.forEach(function (fn) { fn() }) }

    // Whether the working box is shown is the user's preference and it outlives
    // the session: closing it leaves the transcript as nothing but the report,
    // exactly as if the process had never rendered. A blocked or absent store
    // only costs the preference, never the box.
    const WORKING_BOX_KEY = 'dshdeck:working-box-closed'
    const workingBoxSubs = new Set()
    let workingBoxClosed = readWorkingBoxClosed()

    function readWorkingBoxClosed() {
      try {
        if (typeof window === 'undefined' || !window.localStorage) return false
        return window.localStorage.getItem(WORKING_BOX_KEY) === '1'
      } catch (error) {
        return false
      }
    }

    function setWorkingBoxClosed(closed) {
      workingBoxClosed = closed
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(WORKING_BOX_KEY, closed ? '1' : '0')
        }
      } catch (error) {
        // Ignore: the preference is a convenience, not state the box needs.
      }
      workingBoxSubs.forEach(function (fn) { fn() })
    }

    function useWorkingBoxClosed() {
      const [, setTick] = React.useState(0)
      React.useEffect(function () {
        const listener = function () { setTick(function (v) { return v + 1 }) }
        workingBoxSubs.add(listener)
        return function () { workingBoxSubs.delete(listener) }
      }, [])
      return workingBoxClosed
    }

    function plainEntryFor(turnNo, text) {
      const key = 'p' + turnNo
      const existing = plainCache.get(key)
      if (existing !== undefined) return existing
      const entry = { state: 'pending', slides: null }
      plainCache.set(key, entry)
      host
        .call('plain', { turn: turnNo, text: text })
        .then(function (res) {
          const stash = plainModelStash.get(key)
          const view = stash === undefined ? plainModelView(null) : stash
          const parsed = res && res.ok === true && typeof res.text === 'string' ? slidesFromPlain(res.text, view) : null
          entry.state = parsed && parsed.length ? 'plain' : 'error'
          entry.slides = parsed
          notifyPlain()
        })
        .catch(function (error) {
          // Never swallow this silently again. The rewrite failing is a normal,
          // expected fallback; the rewrite failing on EVERY turn because the
          // plumbing was handed the wrong shape is a bug, and it stayed hidden
          // for the whole life of the feature because this catch said nothing.
          entry.state = 'error'
          entry.slides = null
          if (typeof console !== 'undefined' && typeof console.warn === 'function') {
            console.warn('plain-slides: the rewrite did not produce a deck; the local rendering is shown instead', error)
          }
          notifyPlain()
        })
      return entry
    }

    /**
     * `model` is the whole turn model, never a hand-picked subset: the subset is
     * `plainModelView`'s job, and passing one here is what broke the rewrite.
     */
    function usePlainEntry(turnNo, text, enabled, model) {
      const [, setTick] = React.useState(0)
      React.useEffect(function () {
        const listener = function () { setTick(function (v) { return v + 1 }) }
        plainSubs.add(listener)
        return function () { plainSubs.delete(listener) }
      }, [])
      React.useEffect(function () {
        if (!enabled) return
        const key = 'p' + turnNo
        if (plainCache.has(key)) return
        plainModelStash.set(key, plainModelView(model))
        plainEntryFor(turnNo, text)
      }, [turnNo, enabled])
      return plainCache.get('p' + turnNo) || null
    }

    let stageState = null
    const stageSubs = new Set()

    function openStage(payload) {
      stageState = payload
      stageSubs.forEach(function (fn) { fn() })
    }

    function closeStage() {
      stageState = null
      stageSubs.forEach(function (fn) { fn() })
    }

    function useStageState() {
      const [value, setValue] = React.useState(stageState)
      React.useEffect(function () {
        const listener = function () { setValue(stageState) }
        stageSubs.add(listener)
        return function () { stageSubs.delete(listener) }
      }, [])
      return value
    }

    ctx.effect(function () {
      return function () {
        stageSubs.clear()
        stageState = null
        plainSubs.clear()
        plainCache.clear()
        plainModelStash.clear()
        workingBoxSubs.clear()
      }
    }, 'dshdeck: reset')

    /**
     * The working box: two lines of process, the latest one emphasised, with the
     * close control at their right. It lives in the composer dock — the one
     * place that renders *after* the conversation, so the box sits under the
     * shipped "深度求索中..." turn status instead of above it. It shows only while
     * a turn is open, and closing it persists across sessions: the transcript is
     * then left with nothing but the report. Either way the detail is in the
     * Trajectory.
     */
    function WorkingBox(props) {
      const closed = useWorkingBoxClosed()
      const useChat = typeof props.useChat === 'function' ? props.useChat : useNothing
      const chat = useChat(function (s) { return s })
      const turnNo = runningTurnNo(chat)
      if (closed || turnNo < 0) return null
      const lines = workingLines(buildModel(chat, turnNo))
      return React.createElement(
        'div',
        { className: 'dshdeck-working' },
        React.createElement(
          'div',
          { className: 'dshdeck-working-lines' },
          lines.map(function (line, i) {
            return React.createElement(
              'div',
              {
                key: i,
                className: 'dshdeck-working-line',
                'data-latest': i === lines.length - 1 ? 'true' : undefined,
                title: line,
              },
              line,
            )
          }),
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            className: 'dshdeck-icon',
            'aria-label': '不再显示工作过程',
            title: '不再显示工作过程',
            onClick: function () { setWorkingBoxClosed(true) },
          },
          closeIcon(),
        ),
      )
    }

    function AssistantStepView(props) {
      const useChat = typeof props.useChat === 'function' ? props.useChat : useNothing
      const useInput = typeof props.useInput === 'function' ? props.useInput : useNothing
      const node = props.node
      const data = node && node.data
      const blocks = data && data.blocks
      const text = textOfBlocks(blocks)
      const images = imageSources(blocks)
      const status = data && typeof data.status === 'string' ? data.status : ''
      const settled = status === 'settled' || status === 'interrupted'
      const turnNo = turnOfNode(node)
      const chat = useChat(function (s) { return s })
      const draft = useInput(function (s) { return s && typeof s.draft === 'string' ? s.draft : '' })
      const closingSeq = useChat(function (s) { return closingAssistantSeq(s, turnNo) })
      const lastKey = useChat(function (s) { return lastAssistantKey(s, turnNo) })
      const mySeq = data && data.finalNode && isNum(data.finalNode.seq) ? data.finalNode.seq : null
      // A turn that is still open has no report yet, and that gate is what stops
      // the deck from flickering. Without it a settled mid-turn step is briefly
      // the LAST assistant step of the turn, so the fallback below renders it as
      // a deck; the next step then makes it stop being last and the deck
      // vanishes — one deck appearing and disappearing per step. The shipped
      // turn-status label reads the same `open` signal, so the box and this gate
      // agree on when the turn is over.
      const turnLoc = node && node.location && (node.location.kind === 'turn' || node.location.kind === 'step')
        ? node.location.turn
        : null
      const turnOpen = turnLoc !== null && turnLoc !== undefined && turnLoc.status === 'open'
      // Fail closed when a closed turn carries no closing marker. An aborted or
      // truncated turn never writes a `turn-tail`, and treating every step as
      // the report is what turned one failure into a pile of narration decks;
      // only the last assistant step may speak for such a turn.
      const isClosing = !turnOpen && (closingSeq === null
        ? node !== undefined && node !== null && lastKey !== null && node.key === lastKey
        : mySeq === null || mySeq === closingSeq)
      const usePlain = settled && isClosing && text.length > 0 && turnNo >= 0
      const model = buildModel(chat, turnNo)
      const localSlides = buildSlides(model, text)
      const plainEntry = usePlainEntry(turnNo, text, usePlain, model)

      // A running step renders nothing here: the working box is a composer-dock
      // entry, because only the dock draws after the conversation — and so after
      // the shipped turn-status label the box belongs under.
      if (!settled) return null
      // A settled non-closing step is mid-turn narration: process, not report.
      if (!isClosing) return null
      if (!text && !images.length) return null

      const plainState = !usePlain ? 'local' : plainEntry === null ? 'pending' : plainEntry.state
      let slides = localSlides
      if (plainState === 'plain' && plainEntry.slides && plainEntry.slides.length) {
        slides = plainEntry.slides
      } else if (plainState === 'pending') {
        slides = localSlides.length ? [localSlides[0]] : localSlides
      }

      function composeAnswer(value) {
        const base = typeof draft === 'string' ? draft.trim() : ''
        if (!base) return value
        if (base.indexOf(value) >= 0) return base
        return base + ' ' + value
      }

      return React.createElement(Deck, {
        model: model,
        slides: slides,
        variant: 'inline',
        onClose: null,
        fullText: text,
        technicalText: technicalBits(model),
        images: images,
        plainState: plainState,
        renderMessageImages: props.renderMessageImages,
        inputActions: props.inputActions,
        composeAnswer: composeAnswer,
      })
    }

    function DeckAction(props) {
      const useChat = typeof props.useChat === 'function' ? props.useChat : useNothing
      const messageId = props.messageId
      const chat = useChat(function (s) { return s })
      const turnNo = useChat(function (s) { return findTurnByMessage(s, messageId) })
      const inputActions = props.inputActions

      function onOpen() {
        if (!isNum(turnNo) || turnNo < 0) return
        const model = buildModel(chat, turnNo)
        const entry = plainCache.get('p' + turnNo)
        const slides = entry && entry.state === 'plain' && entry.slides ? entry.slides : buildSlides(model, model.text)
        openStage({
          turn: turnNo,
          model: model,
          slides: slides,
          fullText: model.text,
          technicalText: technicalBits(model),
          plainState: entry ? entry.state : 'local',
          inputActions: inputActions,
          composeAnswer: function (value) { return value },
        })
      }

      return React.createElement(
        'button',
        { type: 'button', className: 'dshdeck-action', 'aria-label': '\u6f14\u793a\uff1a\u5927\u5c4f\u5e7b\u706f\u7247', title: '\u6f14\u793a\uff1a\u5927\u5c4f\u5e7b\u706f\u7247', onClick: onOpen },
        screenIcon(),
      )
    }

    function StageOverlay() {
      const stage = useStageState()
      if (stage === null || stage === undefined) return null
      return React.createElement(
        'div',
        { className: 'dshdeck-stagewrap', onClick: function (event) { if (event.target === event.currentTarget) closeStage() } },
        React.createElement(
          'div',
          { className: 'dshdeck-panel' },
          React.createElement(Deck, {
            model: stage.model,
            slides: stage.slides,
            variant: 'stage',
            onClose: closeStage,
            fullText: stage.fullText,
            technicalText: stage.technicalText,
            plainState: stage.plainState,
            inputActions: stage.inputActions,
            composeAnswer: stage.composeAnswer,
          }),
        ),
      )
    }

    slots.inject('conversation.chat.node', function () {
      return slots.register(
        { name: 'conversation.chat.node', key: 'assistant-step', priority: -10 },
        AssistantStepView,
      )
    })

    // Every conversation.chat.node registration below MUST carry priority: -10.
    // The shipped renderers own these same keys at the default priority 0, and
    // two permanent registrations competing in one cell at the same priority is
    // what made the whole plugin fail to load. A lower number wins the cell, so
    // -10 deterministically shadows the built-in renderer.
    //
    // These kinds carry the agent's working process rather than its report:
    // tool rows, the fold controller over reasoning and tool calls, injected
    // context, housekeeping markers, retry notices and the system prompt card.
    // Rendering them as nothing leaves the transcript as "your messages plus
    // the final deck"; every detail stays in the Trajectory view.
    //
    // This takeover does NOT depend on the built-in turn-process fold. That
    // fold engages only for a closed turn that produced a final answer
    // (`answerAnchorSeq !== null && turnClosed && compactTranscript`), so it is
    // off precisely while a turn runs and after a turn is aborted — the two
    // moments the process must not stream. Shadowing each kind by key works
    // from the turn's first second regardless of fold state.
    //
    // Failures (turn-error, turn-max-tokens) and the turn footer are
    // deliberately absent from this list.
    //
    // `tool-call` IS in the list, and the reason it is safe is narrower than it
    // first looks. It owns the `tool.call.toolview` child slot, and a
    // conversation.chat.node renderer receives no renderSlot prop — so a
    // replacement cannot delegate back to those cards, and hiding this kind
    // hides every one of them. What made that acceptable is that each blocking
    // or interactive surface has a home outside a tool row:
    //   - approvals (sandbox, file writes) -> `conversation.composer`,
    //     registered by dsh-client-ui-approval;
    //   - ask_user_question -> `conversation.composer`, registered by
    //     dsh-client-ui-user-questions;
    //   - presented deliverables -> `conversation.chat.turnTail`, registered by
    //     dsh-client-ui-deliverables;
    //   - dynamic-plugin approve/decline -> `sidebar.footer.action`, in
    //     dsh-client-ui-cordis's CordisPanel. Only CordisPanel is handed
    //     onApprove/onDecline; the inline `cordis_run` row (CordisRunRow) gets
    //     none, so hiding the row cannot remove the ability to approve.
    // The one real loss is `tool.view.cordis`: a dynamic plugin's own inline UI
    // region disappears with its row.
    const HIDDEN_NODE_KINDS = [
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
    for (let i = 0; i < HIDDEN_NODE_KINDS.length; i++) {
      const hiddenKind = HIDDEN_NODE_KINDS[i]
      slots.inject('conversation.chat.node', function () {
        return slots.register(
          { name: 'conversation.chat.node', key: hiddenKind, priority: -10 },
          function () { return null },
        )
      })
    }

    // The working box belongs in the composer dock, not in the transcript: it is
    // the only seat that draws after the conversation, so the box lands under
    // the shipped turn-status label rather than above it. The shipped docks
    // there run at order 0/10/20; a negative order keeps the box closest to the
    // conversation, which is where a running process reads best.
    slots.inject('conversation.input.dock', function () {
      return slots.register(
        { name: 'conversation.input.dock', id: 'dshdeck-working', order: -10 },
        WorkingBox,
      )
    })

    slots.inject('conversation.chat.assistant-actions', function () {
      return slots.register(
        { name: 'conversation.chat.assistant-actions', id: 'dshdeck-stage', order: 20, label: '\u6f14\u793a' },
        DeckAction,
      )
    })

    slots.inject('shell.overlay', function () {
      return slots.register({ name: 'shell.overlay', id: 'dshdeck-stage-overlay', order: 40 }, StageOverlay)
    })
  },
}

		})();
		// ---- end ported half ----

		exports.apply = plugin.apply;
		exports.inject = ["slots"];
		exports.__internals = __internals;
		return module.exports;
	}
});
