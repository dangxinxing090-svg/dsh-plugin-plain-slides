const ID = "dsh-plugin-plain-slides"
const ROUTE = "/api/plain-slides.rewrite"

// Stands in for the dynamic-plugin `harness` builtin: the ported half calls
// harness.handle(method, handler) while apply() runs, and the handler is then
// served over this package's authenticated /api route.
const handlers = {}
const harness = {
  handle: function (method, handler) {
    handlers[method] = handler
  },
}

// ---- ported verbatim from the validated dynamic Host half ----
function ported() {
const SYSTEM_PROMPT = [
  '你负责把一段技术性的 agent 工作反馈，重写成普通人能看懂的内容，并排成幻灯片。',
  '读者不懂编程，但关心“改了哪些文件”。',
  '',
  '严格按下面的行格式输出，每行一个字段。输出的是 HTML 片段，不是 markdown。',
  '不要输出任何其他文字，不要用 markdown 代码块，不要编号。',
  '',
  'TITLE: 这一轮在做什么，不超过 18 个字',
  'RESULT: 结果或结论，一句话，不超过 45 个字',
  'STEP: 过程小标题，不超过 14 个字',
  'DETAIL: 用一句普通话解释这一步，不超过 45 个字',
  'STEP: 第二个过程小标题',
  'DETAIL: 解释',
  '',
  '只有在这一轮最后确实需要用户做决定时，才在末尾追加（可以有多个 OPT）：',
  'ASK: 想要用户决定的问题，不超过 40 个字',
  'OPT: 一个选项，不超过 20 个字',
  '',
  '硬性规则：',
  '1. 输出 1 到 5 组 STEP/DETAIL，能少则少，不要为了凑数硬加。如果这一轮没什么过程可说，就只输出 1 组。',
  '2. 绝对不要输出纯状态类或进度类的步骤，例如“插件已更新”“正在运行”“已完成”“已生效”“已就绪”。',
  '   只有当这一轮真的做了实际的事情时才写 STEP；没有什么可说的就少写，而不是拿状态来凑。',
  '3. 所有字段的值必须是 HTML 片段。禁止输出 markdown 语法：不要用 **、##、- 、* 、\u0060 这些标记符号，也不要用 markdown 表格的竖线写法。',
  '4. 只能用这些标签：<b> <i> <code> <br> <ul> <ol> <li> <p> <span> <mark> <table> <thead> <tbody> <tr> <th> <td>。',
  '   不要用其他标签，不要写任何属性（class、style、href、onclick 全部不要）。',
  '5. 需要强调用 <b>，需要写文件名或举例用 <code>，需要列点用 <ul><li>，需要做并列对比（多个项目对多个属性）时用 <table>。',
  '   表格必须写成 <table><thead><tr><th>表头</th>…</tr></thead><tbody><tr><td>值</td>…</tr></tbody></table> 这种完整形式。',
  '6. 文件名要保留：这一轮涉及具体文件时，写成 <code>README.md</code> 这样，不要带目录路径。一轮最多提 2 到 3 个。',
  '7. 除了文件名，禁止出现目录路径、代码、函数名、变量名、命令、工具名、参数、版本号、英文技术术语。',
  '8. 不要描述怎么实现的，只说做了什么、结果如何。',
  '9. RESULT 必须让人只读这一行就知道这轮发生了什么，先给结论。',
  '10. 不要输出 ASK 和 OPT，除非确实需要用户做决定。',
  '11. 全部用简体中文。',
].join('\n')

function readString(value) {
  return typeof value === 'string' ? value : ''
}

async function collectText(stream) {
  let out = ''
  let failure = ''
  let finish = ''
  for await (const chunk of stream) {
    if (!chunk) continue
    if (chunk.type === 'text-delta' && typeof chunk.text === 'string') {
      out += chunk.text
      continue
    }
    if (chunk.type === 'finish' && chunk.reason) {
      const kind = chunk.reason.kind
      finish = kind
      if (kind === 'error' || kind === 'aborted') {
        failure = (chunk.reason.failure && chunk.reason.failure.message) || kind
      }
    }
  }
  return { text: out, failure: failure, finish: finish }
}

return {
  apply(ctx) {
    harness.handle('plain', async function (args) {
      try {
        const text = readString(args && args.text)
        if (text.trim() === '') return { ok: false, code: 'empty' }

        const llm = ctx.get('llm')
        if (llm === undefined || typeof llm.stream !== 'function') return { ok: false, code: 'no-llm' }

        let provider = ''
        let model = ''
        let effort = ''
        const defaults = ctx.get('agentDefaultModel')
        if (defaults !== undefined && typeof defaults.currentSelection === 'function') {
          const selection = defaults.currentSelection()
          if (selection) {
            provider = readString(selection.provider)
            model = readString(selection.model)
            effort = readString(selection.reasoningEffort)
          }
        }
        if (provider === '' || model === '') return { ok: false, code: 'no-model' }

        const clipped = text.length > 6000 ? text.slice(0, 6000) : text
        const options = {
          provider: provider,
          model: model,
          system: SYSTEM_PROMPT,
          messages: [
            {
              id: 'dshdeck-' + Date.now(),
              role: 'user',
              content: [{ type: 'text', text: clipped }],
              source: { kind: 'plugin', plugin: ID, form: 'instructions' },
            },
          ],
          temperature: 0.2,
          maxTokens: 8000,
        }
        if (effort !== '') options.reasoningEffort = effort

        let collected = await collectText(llm.stream(options))
        if (collected.text.trim() === '' && collected.failure === '') {
          // Retry once with double the budget: a reasoning model can consume an
          // entire cap on reasoning and still finish cleanly.
          const retry = Object.assign({}, options, { maxTokens: options.maxTokens * 2 })
          collected = await collectText(llm.stream(retry))
        }
        if (collected.text.trim() === '') {
          return {
            ok: false,
            code: 'no-output',
            message: collected.failure || ('empty finish=' + collected.finish),
          }
        }
        return { ok: true, text: collected.text, provider: provider, model: model }
      } catch (err) {
        return { ok: false, code: 'threw', message: String(err && err.message ? err.message : err) }
      }
    })
  },
}

}
// ---- end ported half ----

const plugin = ported()

export const name = ID
export const inject = ['connection']

/**
 * Serve the ported rewrite handler over Connection's authenticated fetch
 * channel. The route sits under /api, so the bridge applies the Host/Origin
 * trust fence and the browser-session cookie before this handler runs and
 * nothing here authenticates anything.
 * @param ctx - host context carrying the browser transport.
 */
export function apply(ctx) {
  plugin.apply(ctx)
  const handler = handlers.plain
  if (typeof handler !== 'function') return
  const connection = ctx.get('connection')
  if (connection === undefined || connection.fetch === undefined) return
  if (typeof connection.fetch.register !== 'function') return

  ctx.effect(
    function () {
      return connection.fetch.register({
        path: ROUTE,
        methods: ['POST'],
        requestBody: 'buffered',
        fetch: async function (request) {
          let args = null
          try {
            args = await request.json()
          } catch (error) {
            return Response.json({ ok: false, code: 'bad-json' }, { status: 400 })
          }
          try {
            return Response.json(await handler(args), {
              headers: { 'cache-control': 'no-store' },
            })
          } catch (error) {
            return Response.json(
              {
                ok: false,
                code: 'handler',
                message: String(error && error.message ? error.message : error),
              },
              { status: 500 },
            )
          }
        },
      })
    },
    'plain-slides: rewrite route',
  )
}
