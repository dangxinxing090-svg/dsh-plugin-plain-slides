# 可见性契约：正文只有 slides 或 报错

> 我给 agent 发一条消息，它显示给我的**只有**两样东西之一：
> **slides（结果/结论）** 或 **报错（出问题/任务中止/截断）**。
> 过程一律不显示，想看我自己去 Trajectory。
>
> 是否先出方案不是契约的一部分——有方案就是一份 slides，没方案就直接给结论。

---

## 1. 机制真相：系统自带的过程折叠是**有条件**的

`dsh-client-ui-chat` 本来就有一套「过程折叠」：把用户消息到最终答复之间的所有东西
收成一行可展开的摘要（`已思考 · N 次工具调用 · M 条消息`）。

它的判定写在 `TURN_PROCESS_INDEPENDENT_KINDS`——**这 7 类永不折叠**：

```
system-prompt, user, steering, turn-process, turn-error, turn-max-tokens, turn-tail
```

其余所有 kind（`tool-call`、`assistant-step`、`context`、`compaction`、
`manual-compaction`、`model-retry`、`unknown`、`workflow-run`）都是「过程成员」，
在折叠生效时被藏起来。

而折叠生效的条件是：

```
processWindowReady = processSpec 存在
                  && compactTranscript
                  && processSpec.answerAnchorSeq !== null   ← 本轮必须有"最终答复"
                  && processPresentation.turnClosed          ← 轮次必须已关闭
                  && !historyIncomplete
```

**这就解释了为什么过程还是会漏出来**：

| 场景 | 为什么不折叠 |
|---|---|
| 轮次运行中 | `turnClosed` 为 false |
| **轮次出错 / 截断，没有最终答复** | **`answerAnchorSeq === null`** |
| 历史未加载完 | `historyIncomplete` |
| 非 compact 转录 | `compactTranscript` 为 false |

**折叠只在「正常结束且有答复」这一条路径上工作。**
而用户最在意的「任务中止/截断」，恰好是**不折叠**的那条路径。

---

## 2. 当前插件的策略，以及它为什么不够

当前策略是：**隐藏折叠的摘要行（`turn-process`），然后指望折叠把成员藏掉。**

这是一个**依赖「有条件机制」**的策略——折叠不生效时，成员原样露出来。

当前隐藏名单：

```
turn-process, context, compaction, model-retry, unknown, workflow-run, system-prompt
```

### 漏项

| 漏项 | 后果 |
|---|---|
| **`tool-call`** | 折叠不生效时，**所有工具行全尺寸露出**。最大的过程泄漏 |
| **`manual-compaction`** | 同上（手动压缩提示） |
| 非收尾 `assistant-step` | 由 `isClosing` 处理，但该判断「失败即放行」 |

### 失败即放行的 bug

```js
const isClosing = closingSeq === null || mySeq === null ? true : mySeq === closingSeq
```

`closingSeq` 来自 `turn-tail` 节点的 `data.closing.finalNode.seq`。
**轮次异常结束时没有这个信息 → `closingSeq === null` → `isClosing` 恒为 true
→ 该轮每一个 assistant step 都被渲染成幻灯片。**

所以「任务中止」时用户看到的不是一条报错，而是：

> 一堆工具行 ＋ 一堆被渲染成幻灯片的旁白

这正好是契约的反面。**而且它和 §1 的不折叠是同一个场景，会叠加发生。**

---

## 3. 结论：不要依赖折叠，要显式封口

`conversation.chat.node` 是**按 kind 键控**的，插件可以无条件覆盖任意一类，
与折叠是否生效无关。所以正确策略是：

> **不依赖系统的折叠机制，自己对每一个「过程类」节点注册返回 `null` 的渲染器。**

### 完整隐藏集合

| kind | 处理 | 说明 |
|---|---|---|
| **`tool-call`** | **隐藏（新增）** | 纯过程，最大泄漏源 |
| `turn-process` | 隐藏（已有） | 折叠摘要行 |
| `context` | 隐藏（已有） | 注入的上下文 |
| `compaction` | 隐藏（已有） | |
| **`manual-compaction`** | **隐藏（新增）** | 当前漏了 |
| `model-retry` | 隐藏（已有） | |
| `unknown` | 隐藏（已有） | |
| `workflow-run` | 隐藏（已有） | |
| `system-prompt` | 隐藏（已有） | |
| `assistant-step` | 只放行收尾步 → Deck | 判定要**改为失败即关闭** |
| `user` / `steering` | 保留 | 用户自己的话 |
| `turn-tail` | **保留** | 它挂着 `conversation.chat.turnTail`（交付物芯片）和 `conversation.chat.assistant-actions`（演示按钮） |
| **`turn-error` / `turn-max-tokens`** | **改为报错形态** | 契约的第二形态 |
| `command` / `command-input` | 保留 | 用户自己敲的命令 |

### 隐藏 `tool-call` 安全吗？—— 已核实：安全

这是本次调查最要紧的一步。三个可能被误伤的东西，**都不在工具行里**：

| 交互 | 实际注册点 | 隐藏 `tool-call` 后 |
|---|---|---|
| **审批**（沙箱/写盘确认） | `dsh-client-ui-approval` → `conversation.composer`（链） | ✅ 不受影响 |
| **问答**（ask_user_question） | `dsh-client-ui-user-questions` → `conversation.composer`（链） | ✅ 不受影响 |
| **交付物**（present） | `dsh-client-ui-deliverables` → **`conversation.chat.turnTail`**（另在 toolview 也注册了一份） | ✅ 尾部芯片仍在 |

`tool.call.toolview` 里的那些只是「调用记录卡」。删掉它们，
阻塞式交互和交付物都还有各自的表面。

> **技术限制（重要）**：`conversation.chat.node` 的渲染器**拿不到 `renderSlot`**。
> `ChatNodeSeat` 传给 owner 的是 `{cwd, openFile, inspectCall, forkAt, loadImage,
> renderMessageImages, fileMentions, turnProcess}`，**没有 `renderSlot`**。
> 所以**做不了「白名单委托」**——要么整类隐藏，要么整类交给系统。
> 这正是必须先确认上面三样都有别的落点的原因。

---

## 4. 第二种形态：报错

`turn-error` / `turn-max-tokens` 现在是系统卡片。按契约，它们应当**就是**报错形态。

内容三要素（本地全都有，`buildModel` 已经在收 `model.problems` 和 `model.tools`）：

1. **出了什么事** —— 错误码 / 消息（`problems[].code` / `.message`；`max-tokens` 单独识别）
2. **做到哪一步** —— 已完成的与失败的（`model.tools[].ok`）
3. **你该怎么办** —— 重试 / 换路子 / 看轨迹

并且：**出错的那一轮，其余 assistant step 一律不渲染**，让报错独占正文。

---

## 5. 改造清单

| # | 改动 | 解决 | 状态 |
|---|---|---|---|
| **1** | `isClosing` 改为**失败即关闭**：`closingSeq === null` 时只放行最后一个 assistant step | 中止时的一堆旁白幻灯片 | ✅ 已落地 |
| **2** | `HIDDEN_NODE_KINDS` 增加 `manual-compaction` | 小泄漏 | ✅ 已落地 |
| **3** | 新增 `tool-call` → `null` | **最大的过程泄漏** | ✅ 已落地 |
| **3b** | 两行工作框：显示最近两步过程（新的那条加重），右侧关闭按钮；落在 `conversation.input.dock`（**「深度求索中...」下面**，因为该状态渲染在整个节点列表之后）；关闭状态写 `localStorage` 跨会话保留 | 运行中的过程不再逐条显示 | ✅ 已落地 |
| **4** | `turn-error` / `turn-max-tokens` 改为报错形态 | 契约第二形态 | ⬜ 未做 |
| **5** | 冒烟验证：审批、问答、present、动态插件批准在隐藏 `tool-call` 后仍可用 | 防回归 | ⬜ 待你在浏览器里确认 |

### 关于第 5 项：为什么隐藏 `tool-call` 是安全的

v0.1.1 保留 `tool-call` 的理由是「它拥有 `tool.call.toolview` 子槽，插件渲染器拿不到
`renderSlot`，无法只保留交互卡」。**机制判断正确，但后果判断错误**——每个阻塞式或交互式
表面在工具行之外都有落点：

| 表面 | 落点 |
|---|---|
| 审批（沙箱、写盘） | `conversation.composer`（`dsh-client-ui-approval`） |
| `ask_user_question` | `conversation.composer`（`dsh-client-ui-user-questions`） |
| 交付物 `present` | `conversation.chat.turnTail`（`dsh-client-ui-deliverables`） |
| 动态插件批准 / 拒绝 | `sidebar.footer.action`（`dsh-client-ui-cordis` 的 `CordisPanel`） |

关键证据：`onApprove` / `onDecline` **只传给了 `CordisPanel`**；行内的 `cordis_run`
卡（`CordisRunRow`）只拿到 `runCards` / `activeRuns` / `onObserveRunCard`，本身没有批准入口。
所以隐藏工具行不可能拿掉动态插件的批准能力。

**唯一真实代价**：`tool.view.cordis` —— 动态插件往对话行内塞自定义 UI 的洞会一起消失。
将来若需要，可用 CSS `:has()` 给含该区域的行使豁免。

---

## 6. 明确不做的事

- **不做方案/结果的判别分流** —— 方案不是契约的一部分。有方案就是一份 slides。
- **不依赖系统的 `turn-process` 折叠** —— 它有条件、不可靠，只当作不存在。
- **不给 `tool-call` 做白名单委托** —— 渲染器没有 `renderSlot`，做不到。

---

## 附录：为什么不走「方案闸门」那条线

早先一版方案主张新增 `propose_plan` 工具 + `deliver:policy` 提示段落，
让 agent 自己判断「该不该先出方案」并用 `ctx.userQuestions.ask()` 做硬闸门。

**技术上是可行的**（机制已核实：`intent: { kind: 'plan-review' }` 可复用随附的评审渲染器，
`execute` 是 async，await 期间 agent loop 停住，因此批准前不可能有副作用）。

**但它不是当前需求的重点**：契约只要求「可见输出只有 slides 或报错」。
方案闸门是**内容形态**问题，不是**可见性**问题。两者可以并行，但不应混为一谈——
先封口（本文 §5），再谈要不要加闸门。
