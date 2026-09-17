# plain-slides

> A DeepSeek Harness plugin that turns each agent reply into a short slide deck in plain language — for people who use the harness but do not read code.

The agent still writes whatever it writes. This plugin gives you **a second way to read it**: every reply is re-shown as a few slides — conclusion first, then a few steps, then any question the agent is waiting on you to answer. The original text is always one click away.

---

## What it solves

An agent finishes a task and prints a wall of text: file names, code, jargon, parentheses, paths. If you read code, you scan it and know what happened. If you do not, you finish it and still do not know whether it worked.

This plugin puts a slide deck **where that reply would have been** — a few pages, not a wall:

| Slide | Content | What it is for |
|---|---|---|
| 1 | **Conclusion** | Read this one page and you know the result |
| 2–6 | **Process** | What actually happened, one line per step |
| last | **Questions** | If the agent needs a decision, click an option or type a reply |

Nothing is deleted. The button in the card header switches to the full original text, with a technical summary line (elapsed time, operation count, token usage) above it.

---

## Install

On a machine with DeepSeek Harness (`dsh`) installed:

```sh
dsh plugin --profile web add github:dangxinxing090-svg/dsh-plugin-plain-slides
```

This installs straight from this repository, and it works today — the package is not on npm yet.

Once it is published to npm, the shorter name resolves too:

```sh
dsh plugin --profile web add dsh-plugin-plain-slides
```

Restart `dsh`. That is the whole install — the package mounts itself, so there is no config file to edit.

Replace `web` with your profile name (`tui` is the other common one). To pin a release instead of tracking the default branch, append a tag or commit: `github:dangxinxing090-svg/dsh-plugin-plain-slides#v0.1.0`.

<details>
<summary>Manual install</summary>

1. Install the package in the profile directory:

   ```sh
   cd ~/.dsh/profiles/web
   pnpm add github:dangxinxing090-svg/dsh-plugin-plain-slides
   ```

2. Append to `cordis.patch.yml` in the same directory:

   ```yaml
   - insert:
       - id: plain-slides
         name: 'dsh-plugin-plain-slides'
   ```

3. Restart `dsh`. `dsh --dump-config` prints the composed tree if you want to confirm the row first.

Edit `cordis.patch.yml`, never `cordis.yml` — the latter is generated.
</details>

### Uninstall

```sh
dsh plugin --profile web remove dsh-plugin-plain-slides
```

### Publishing your own copy

Forking this and publishing under your own name? Three things must stay consistent:

1. `name` in `package.json` — your published package name.
2. The `name:` inside `cordis.patch.yml` — that is the row's module specifier, and it must equal the package name, or the loader cannot resolve the row.
3. The copyright line in `LICENSE`.

The row `id` (`plain-slides`) is only a composition key; rename it freely.

---

## The two states you will see

For a second or two after a reply lands, the card header reads `· 通俗化中…` while the rewrite is in flight. Then either:

- `· 通俗版` appears — the rewrite succeeded, you are reading plain language; or
- the marker disappears — the rewrite failed, and the card falls back to a locally rendered version. Still correctly formatted, just not simplified.

The fallback never blanks the card and never shows broken markup.

---

## What the conversation itself shows

The card is only half of it. The plugin also tidies the transcript around it, so
you are not scrolling past the agent's homework to find the answer:

| In the transcript | What you see |
| --- | --- |
| While a turn is running | a two-line box just above the composer, under the `深度求索中...` status — a title naming what is happening and pointing at the Trajectory, then the latest step in plain language. Close it and it stays closed; a small header button brings it back while a turn runs |
| When the turn settles | your message, then the deck |
| Tool rows, reasoning, tool folds, injected context, compaction markers, retries, the system prompt | nothing at all |
| Failures and truncation (`turn-error`, `turn-max-tokens`) | **kept** — you always learn when something went wrong |
| Approvals, questions, plan review, presented files | **kept** — each renders outside the tool row (the composer, the turn footer, the sidebar plugin panel) |
| A dynamic plugin's own inline UI (`tool.view.cordis`) | hidden with its row — the one real loss |
| Everything hidden above | still in the Trajectory view, one click away |

Nothing is deleted. The plugin changes what is *shown by default*, not what is
recorded.

---

## Cost

Each reply costs **one extra model call** to translate the technical content.

- It uses your currently selected default model.
- **Only the turn's report is translated.** The working process is never sent.
- **A success costs exactly one call, and is kept** — reopening DSH shows the
  plain version again without asking the model a second time, ever.
- **A failure is retried at most three times**, so one turn costs at most four
  calls, and each retry gets a wider output budget than the first attempt.
- Scrolling back does not re-request.
- To turn the rewrite off and keep only the local version, add `disabled: true` to the plugin row.

---

## How it works

Four parts:

1. **It takes over the reply renderer.** The plugin registers into the harness's assistant-message seat, so the raw markdown is no longer rendered directly — the slide card is.
2. **It takes over the working-process renderers.** The same seat is keyed by message kind, so the plugin also claims reasoning folds, injected context, compaction markers, retries and the system prompt, and renders them as nothing. The kinds it must not claim are the ones carrying interactive UI.
3. **One rewrite call.** When a turn settles, the plugin sends that text to your model with a strict instruction: emit HTML fragments in a fixed line protocol — one conclusion, a few process steps.
4. **A local fallback.** If that call fails or times out, the client splits the original text itself with a small markdown → HTML converter. Correct layout, unprocessed wording.

The client half talks to its host half over Connection's authenticated `/api` fetch channel (`ctx.connection.fetch.register`), so the harness applies its Host/Origin trust fence and browser-session cookie before the handler runs. The plugin implements no authentication of its own.

Model output is sanitized before rendering: only a small allow-list of bare text tags survives, every attribute is stripped, and `<script>`-like elements are removed whole.

---

## FAQ

**A slide is filler, like "plugin updated".**
The plugin already filters status-only and near-empty pages, and the rewrite prompt tells the model not to emit them. If one slips through, open an issue with that slide's text.

**A table renders as a row of pipes.**
That turn did not go through the HTML path. Open an issue with the full reply.

**I want the agent to answer plainly in the first place, not be translated afterwards.**
That is a different change — it belongs in the agent's prompt, not this plugin. This plugin deliberately leaves the agent's own words alone, because those words are also what it uses to keep working.

**The reply was long. Did I lose content?**
The deck shows at most one conclusion slide plus five process slides. Everything else is in the full-original view.

**Does this send my data anywhere?**
No. The rewrite uses the same model service your conversation already uses. This plugin has no network access of its own and collects nothing.

---

## Troubleshooting

**The card never appears, and startup reports a plugin load failure.**

Every registration into `conversation.chat.node` went in at the default slot
priority, while the harness's own renderer already owned those same keys at that
same priority. Two registrations competing for one cell at one priority is not a
tie the slot system resolves: the row fails to load and the plugin contributes
nothing. That was the v0.1.0 bug — the plugin never mounted on any harness.

Fixed in v0.1.1: every registration now carries `priority: -10`, which wins the
cell. On v0.1.0, upgrade.

**Is the plugin loaded at all?** A loaded plugin renders every reply as a card
with a `演示` button on it. If replies are plain markdown, it is not loaded — and
the harness itself is fine; the failure is confined to this plugin's own row.

**The card renders but the wording is still technical.** The rewrite call failed
and the local fallback drew the card instead: the `· 通俗版` marker is absent.
Still correctly laid out, just not simplified.

---

## Development

No build step — the files in `lib/` are the source.

```
lib/index.js       host half: the rewrite call and the /api route
lib/client.js      browser half: reply renderer, slide deck, markdown fallback
cordis.patch.yml   the self-mounting bundle patch
test/              runnable verification for both halves
```

```sh
npm test
```

`test/host.test.mjs` mounts the host half against a fake context and drives the real route with `Request`/`Response` objects. `test/client.test.mjs` drives the actual browser-bundle contract: it captures the `window.__ModuleLoader__` registration, calls the factory with a stub `require`, and asserts the plugin registers the same three contribution points.

To try a local checkout without publishing:

```sh
dsh plugin --profile web add /path/to/dsh-plugin-plain-slides
```

### Shadowing a built-in slot

`conversation.chat.node` is a keyed slot whose keys the harness already owns. A
permanent client plugin that registers one of those keys **at the default
priority does not merely lose to the shipped renderer — the plugin fails to load
and contributes nothing**, with a load error at startup. Always declare a
shadowing priority:

```js
slots.register({ name: 'conversation.chat.node', key: 'assistant-step', priority: -10 }, View)
```

A lower number wins the cell. `test/client.test.mjs` enforces this across every
`conversation.chat.node` registration, so adding a key and forgetting the
priority fails the suite before release. List slots
(`conversation.chat.assistant-actions`, `shell.overlay`) are additive and need no
priority — give them an `id` of your own instead.

MIT licensed.

---
---

# plain-slides（中文）

> 一个 DeepSeek Harness 插件。把每一轮 AI 的回答重新排成几页大白话幻灯片——给用这个 harness、但不读代码的人。

AI 该怎么写还是怎么写。这个插件只是给你**第二种读法**：每轮回答都被重新呈现成几页幻灯片——先给结论，再列几步过程，最后是 AI 在等你拍板的问题。原文永远只差一次点击。

---

## 它解决什么问题

AI 干完活，吐出一大段文字：文件名、代码、术语、括号、路径。懂代码的人扫一眼就知道发生了什么；不懂的人读完了，还是不知道到底成没成。

这个插件在**原本那段回答的位置**放一副幻灯片——只有几页，不是一堵墙：

| 页 | 内容 | 作用 |
|---|---|---|
| 第 1 页 | **结论** | 只读这一页就知道结果 |
| 第 2–6 页 | **过程** | 每一步实际做了一件什么事 |
| 最后几页 | **问题** | 如果 AI 在等你决定，点选项或直接输入回复 |

什么都没删。卡片右上角的按钮随时切回完整原文，原文上方还有一行技术统计（耗时、操作次数、token 用量）。

---

## 安装

在装了 DeepSeek Harness（`dsh`）的机器上执行：

```sh
dsh plugin --profile web add github:dangxinxing090-svg/dsh-plugin-plain-slides
```

这是直接从本仓库安装，**现在就能用**——这个包还没发布到 npm。

等它发布到 npm 之后，短名字也成立：

```sh
dsh plugin --profile web add dsh-plugin-plain-slides
```

然后重启 `dsh`。安装就这一步——包会自己挂载自己，不需要改任何配置文件。

把 `web` 换成你实际用的 profile 名（另一个常见的是 `tui`）。想锁定某个版本而不是跟随默认分支，在末尾加上 tag 或 commit：`github:dangxinxing090-svg/dsh-plugin-plain-slides#v0.1.0`。

<details>
<summary>手动安装</summary>

1. 在 profile 目录里安装：

   ```sh
   cd ~/.dsh/profiles/web
   pnpm add github:dangxinxing090-svg/dsh-plugin-plain-slides
   ```

2. 在同目录的 `cordis.patch.yml` 里追加：

   ```yaml
   - insert:
       - id: plain-slides
         name: 'dsh-plugin-plain-slides'
   ```

3. 重启 `dsh`。想先确认的话，`dsh --dump-config` 会打印组合后的插件树。

要改的是 `cordis.patch.yml`，**不要**改 `cordis.yml`——后者是自动生成的。
</details>

### 卸载

```sh
dsh plugin --profile web remove dsh-plugin-plain-slides
```

### 发布你自己的版本

想 fork 出去用自己的名字发布？三处必须保持一致：

1. `package.json` 里的 `name` —— 你发布的包名
2. `cordis.patch.yml` 里的 `name:` —— 这是插件行的模块标识符，**必须等于包名**，否则加载器找不到这一行
3. `LICENSE` 里的版权行

行里的 `id`（`plain-slides`）只是组合键，随便改。

---

## 你会看到的两种状态

每轮回答定稿后的最初一两秒，卡头显示 `· 通俗化中…`，这是在等改写调用返回。之后二选一：

- 出现 `· 通俗版` —— 改写成功，你读到的是大白话；或
- 标记消失 —— 改写失败，卡片退回本地渲染的版本。排版仍然正确，只是用词没加工。

兜底版本不会让卡片空白，也不会显示破损的标记。

---

## 对话里还剩什么

卡片只是一半。插件同时会把对话本身整理干净，你不用翻过一堆"作业"才能看到答案：

| 对话里的位置 | 你会看到 |
| --- | --- |
| 一轮正在进行时 | composer 上方一个两行框，位于「深度求索中...」下面 —— 第一行标题说明正在做什么并指向轨迹页，第二行是最近一步的普通话描述。关掉它就一直是关的；一轮进行中时，会话标题栏会有一个小按钮可以重新打开 |
| 一轮结束时 | 你的消息，然后是幻灯片 |
| 工具行、思考过程、工具折叠、注入的上下文、压缩标记、重试、系统提示 | 完全不显示 |
| 失败与截断（`turn-error`、`turn-max-tokens`） | **保留** —— 出了问题一定会告诉你 |
| 授权、提问、计划确认、交付物 | **保留** —— 各自都有工具行之外的落点（composer、轮次页脚、侧栏插件面板） |
| 动态插件自己的行内界面（`tool.view.cordis`） | 随工具行一起隐藏 —— 这是唯一的真实代价 |
| 上面被隐藏的内容 | 都在"轨迹"视图里，点一下就能看 |

什么都没删。插件改变的是**默认显示什么**，不是记录什么。

---

## 花多少钱

每一轮回答会**多出一次模型调用**，用来把技术内容翻译成大白话。

- 用的是你当前选中的默认模型
- **只翻译这一轮的结果**，工作过程从不发给模型
- **成功只调用一次，并且会存下来**——下次重开 DSH 直接显示通俗版，不会再问模型
- **失败最多重试三次**，所以一轮最多四次调用；每次重试的输出预算比首次更宽
- 往回翻不会重复请求
- 想彻底关掉改写、只留本地版本，在插件行上加 `disabled: true`

---

## 它是怎么工作的

四个部件：

1. **接管回答的渲染位。** 插件注册进 harness 的"助手消息渲染位"，所以原始 markdown 不再直接渲染——由幻灯片卡取代。
2. **接管工作过程的渲染位。** 同一个渲染位是按消息种类分键的，插件把工具行、思考折叠、注入的上下文、压缩标记、重试和系统提示全部认领下来，渲染成空——**从一轮的第一秒就生效**，不等 harness 自带的过程折叠（那个折叠只在"轮次已关闭且有最终答复"时才启用，恰好在一轮进行中和任务中止后是关着的，而那两个时刻正是过程最不该刷屏的时候）。工作框本身不是渲染位，而是一个 composer 停靠项，因为只有停靠层绘制在整段对话之后，也就是绘制在「深度求索中...」之后。承担交互的渲染位不能这样认领，所以插件改为确认它们的落点在别处：授权与提问在 composer，交付物在轮次页脚，动态插件的批准/拒绝在侧栏面板。
3. **一次改写调用。** 一轮结束后，插件把那段文字交给你的模型，要求严格按固定行协议输出 HTML 片段：一句结论、若干步过程。
4. **本地兜底。** 如果调用失败或超时，客户端自己用一个小型 markdown → HTML 转换器把原文切排。排版正确，用词不加工。

浏览器半边通过 Connection 的**带鉴权 `/api` 通道**（`ctx.connection.fetch.register`）和宿主半边通信，所以 Host/Origin 信任栅栏和浏览器会话 cookie 由 harness 在处理函数运行前统一校验，插件自己不做任何鉴权。

模型返回的 HTML 在渲染前会过白名单过滤器：只放行少数几个裸文本标签，所有属性一律剥掉，`<script>` 之类整段删除。

---

## 常见问题

**有一页是废话，比如"插件已更新"。**
插件已经会过滤只有状态、没有内容的页，改写提示词里也明令禁止。如果还漏了，把那一页的文字贴上来开个 issue。

**表格显示成一堆竖线。**
那一轮没走通 HTML 路径。请附上完整回答内容开 issue。

**我想让 AI 一开始就用大白话回答，而不是事后翻译。**
那是另一件事——属于 agent 的提示词，不属于这个插件。这个插件刻意不改 AI 的原话，因为那些话它自己还要拿来继续干活。

**回答很长，内容丢了吗？**
幻灯片最多显示 1 页结论 + 5 页过程。剩下的都在"完整原文"里。

**它会把我的数据发到别处吗？**
不会。改写用的就是你本来就在用的那个模型服务。这个插件自己不联网、不收集任何东西。

---

## 排错

**卡片一直不出现，启动时报插件加载失败。**

插件注册 `conversation.chat.node` 时用的是默认优先级，而 harness 自带的渲染器早就占了同样的 key、同样的优先级。同一个格子里两个注册抢位，不是"谁赢"的问题 —— 整条 row 加载失败，插件什么都没贡献。这就是 v0.1.0 的 bug：它在任何 harness 上都装不上。

v0.1.1 已修复：每个注册都带 `priority: -10`，数字更低，赢得格子。你如果装的是 v0.1.0，请升级。

**怎么判断插件到底有没有加载？** 加载成功时，每条回复都是一张卡片，右上角还有一个"演示"按钮。如果回复是普通 markdown，就是没加载 —— 但 harness 本身没事，失败只局限在这个插件自己那条 row 里。

**卡片出来了，但用词还是很专业。** 说明改写调用失败、退回了本地渲染 —— 右上角不会出现 `· 通俗版` 标记。排版仍然正确，只是用词没加工。

---

## 开发

没有构建步骤——`lib/` 里的文件就是源码。

```
lib/index.js      宿主半边：发起改写调用、提供 /api 路由
lib/client.js     浏览器半边：接管回答显示、渲染幻灯片、markdown 兜底
cordis.patch.yml  自挂载补丁
test/             两个半边各自的可运行验证
```

```sh
npm test
```

`test/host.test.mjs` 把假上下文挂上宿主半边，用真正的 `Request`/`Response` 打通整条路由；`test/client.test.mjs` 验证真实的浏览器包契约——捕获 `window.__ModuleLoader__` 注册、用桩 `require` 调用工厂函数，并断言它注册了同样的三个贡献点。

想试本地 checkout 而不发布：

```sh
dsh plugin --profile web add /path/to/dsh-plugin-plain-slides
```

### 覆盖 harness 自带的槽位时，必须给优先级

`conversation.chat.node` 是按 key 分格的槽位，而这些 key 早就被 harness 占着。永久客户端插件**用默认优先级注册同一个 key，不是"输给"自带渲染器 —— 是整个插件加载失败、什么都没贡献**，启动时还会报一个加载错误。必须显式声明一个能赢的优先级：

```js
slots.register({ name: 'conversation.chat.node', key: 'assistant-step', priority: -10 }, View)
```

数字更低者赢得格子。`test/client.test.mjs` 对**每一个** `conversation.chat.node` 注册都强制检查这一点 —— 以后加了新 key 却忘了优先级，测试会在发布前就失败。列表型槽位（`conversation.chat.assistant-actions`、`shell.overlay`）是可叠加的，不需要优先级，但要用自己的 `id`。

MIT 许可。
