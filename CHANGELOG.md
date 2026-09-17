# Changelog

Notable changes to `dsh-plugin-plain-slides`. Versions follow [Semantic
Versioning](https://semver.org/).

## 0.4.0

### Added

- **The card can switch between the two wordings itself.** Once the rewrite has
  succeeded both decks exist — the plain one and the locally rendered one — so
  the header now names the one you are reading (`· 通俗版`) and carries an `原版`
  button beside it. Pressing it shows the same slides laid out from your own
  text: correct layout, unprocessed wording, and no model call, because that deck
  was built locally all along. The button then reads `通俗版` to come back.

  This is deliberately a different control from `完整原文`, which leaves the deck
  entirely for the full markdown. A card whose rewrite has not landed has only
  one wording and therefore offers no switch at all.
- **The header switch for the working box carries its wording.** It was a bare
  glyph, which in a row of other bare glyphs gave no clue what it toggled. It now
  reads `显示工作过程` while the box is closed and `隐藏工作过程` while it is
  showing — a toggle names what pressing it does — and it is styled as a labelled
  button rather than a 24px icon.

### Changed

- **The working box has room inside it.** Its padding had been tuned down to
  5px/6px/5px/12px while the box was a single line, which left a two-line box
  pinched against its own borders. It is now 11px top and bottom — the title's
  distance from the top border and the step's from the bottom one — 15px on the
  left and 10px on the right, with 10px between the text and the close control
  and a 5px gap holding the title and the step apart. Without that inner gap the
  two line boxes sat flush against each other.
- **The working-box title reads in the brand blue and is no longer bold.** It now
  says `正在进行以下专业编程操作，想了解过程细节，请到轨迹页查看`, in
  `--dsw-static-deepseek-500` — the same blue the shipped `深度求索中...` status
  line is built from — rather than in emphasised primary text.
- **The box keeps the same room below it as the transcript keeps above it.** The
  composer stack's own gap left it sitting too close to the input. A bottom
  margin now tops that gap up to 32px — twice the room the transcript column
  keeps above the box — so it stands clear of the input below it.
- **The wording switch carries a rounded frame.** Revealing the full text and
  switching between two wordings are different kinds of control, so the second
  one now looks like one: a visible rounded border, a filled background, and a
  brand-coloured border on hover and while showing the original.

## 0.3.0

### Added

- **A successful rewrite is kept, so reopening DSH shows the plain version
  without asking the model again.** A rewrite is a pure function of the closing
  step's text and that text cannot change once the turn has closed, so one
  success is enough forever. Decks are kept in `localStorage` under a
  version-prefixed key (`dshdeck:plain-decks`, `v1:<session>:<turn>`) and capped
  at 120 entries, evicting the least recently written. Until now every reload
  re-rendered every turn and re-asked the model for each one — the exact
  repetition this removes. The store is an optimisation throughout: a blocked,
  full or corrupt store falls back to asking, never to a broken card.
- **A switch for the working box in the session header.** Closing it is a
  persisted preference, so without this the only recovery was clearing browser
  storage. It is on screen in both states, with `data-on` showing which.
- **Rewrites are serialised, one in flight at a time.** A reload re-renders every
  turn in the loaded window at once, and each of them would otherwise ask the
  model together. In steady state the queue is empty: a kept deck never reaches
  it, so only the turn that just finished travels through it.

### Changed

- **The stretch-to-full-height control is gone, and the way to the full original
  text is now labelled.** The card header grew a second icon button that toggled
  the card between its clamped height and the whole conversation height; it is
  removed, along with the state and the icon that served it, and the card simply
  keeps its clamped height. The remaining control shows `完整原文` beside its icon
  (`回到幻灯片` once you are reading the original), so the way out of the deck is
  readable rather than a bare glyph.
- **Only the turn's report is ever rewritten, and that is now explicit.** A
  running step and a mid-turn step are the process: this plugin never renders
  them and must never pay a model call for them. `rewriteTarget` returns the
  closing step's text and `null` for everything else, so the rule is asserted
  rather than inferred from a boolean expression at the call site.
- **The header switch no longer hides itself.** It used to appear only while a
  turn was running *and* the box was closed, which made it invisible to exactly
  the person looking for it — a hover-less header icon that is missing most of
  the time reads as a control that does not exist. It lives in the header rather
  than beside the box, which keeps the promise that a closed box leaves the
  conversation with nothing but the report.
- **The rewrite's call budget is now explicit, finite, and stated in one place.**
  A success costs exactly one call and ends that turn's budget — no second call
  ever. A failure is retried at most three times, so one turn costs at most four
  calls. The second and later attempts request a wider output budget, because an
  empty answer usually means a reasoning model spent the whole cap on reasoning
  and still finished cleanly.

  What made the old behaviour unpredictable was that the budget lived in two
  halves at once: the client cached one call per turn, while the host added a
  retry of its own whenever the stream came back empty. Nothing in either half
  knew what the other was doing, so the real number of model calls was not the
  number either of them thought it was. The host now issues exactly one model
  call per request and takes the attempt number from the client, which is the
  only half that can count calls across a whole turn.
- **The working box leads with a title again.** Line one is now
  `正在进行以下专业编程操作，想了解细节，请切到轨迹页`, which states what is going on and
  where the detail lives; line two is the latest step. The box stays exactly two
  lines, so it still cannot grow or jump while the agent works.

## 0.2.0

### Added

- **A two-line working box replaces the one-line placeholder.** While a turn
  runs, a fixed-height box shows the last two steps in plain language
  (`阅读文件 · setup.js`), the newest one emphasised, with the close control at
  their right. It is exactly two lines so the transcript cannot grow or jump as
  the process streams — the behaviour the process takeover exists to remove. The
  lines reuse the existing fixed tool-name glossary and append a bare file name
  parsed from the call's arguments; commands, queries and directory paths are
  never shown.
- **The box sits in the composer dock, under the turn-status label.** It is a
  `conversation.input.dock` entry rather than part of the assistant step. The
  shipped `深度求索中...` status is rendered *after* the whole node list, so a box
  living inside a node could only ever appear above it; the dock is the one seat
  that draws after the conversation. A negative `order` keeps it closest to the
  conversation, above the shipped todo/goal/queue docks. A running assistant step
  now renders nothing at all.
- **Closing the box is a preference, not a per-turn choice.** It is stored in
  `localStorage` under `dshdeck:working-box-closed`, so a session that closed the
  box starts closed. Closing it leaves the transcript with nothing but the
  report — the same state as if the process had never rendered.

### Changed

- **`tool-call` joins the hidden kinds, so the process never reaches the
  transcript.** The takeover no longer depends on the harness's built-in
  `turn-process` fold, which only engages for a closed turn that produced a final
  answer (`answerAnchorSeq !== null && turnClosed && compactTranscript`) — so it
  is off exactly while a turn runs and after a turn is aborted. Shadowing each
  kind by key works from the turn's first second regardless of fold state.

  v0.1.1 kept `tool-call` visible on the grounds that it owns the
  `tool.call.toolview` child slot, where interactive cards live, and a node
  renderer receives no `renderSlot` and so cannot delegate back to them. That
  reasoning was right about the mechanism but wrong about the consequence. Every
  blocking or interactive surface has a home outside a tool row:

  | Surface | Home |
  | --- | --- |
  | approvals (sandbox, file writes) | `conversation.composer` (`dsh-client-ui-approval`) |
  | `ask_user_question` | `conversation.composer` (`dsh-client-ui-user-questions`) |
  | presented deliverables | `conversation.chat.turnTail` (`dsh-client-ui-deliverables`) |
  | dynamic-plugin approve/decline | `sidebar.footer.action` (`dsh-client-ui-cordis`'s `CordisPanel`) |

  Only `CordisPanel` is handed `onApprove`/`onDecline`; the inline `cordis_run`
  row never receives them, so hiding the row cannot remove the ability to approve
  a dynamic plugin. The one real loss is `tool.view.cordis`: a dynamic plugin's
  own inline UI region disappears with its row.
- `manual-compaction` was missing from the hidden kinds and is now taken over.

### Fixed

- **The hidden process no longer leaves thousands of pixels of blank above the
  turn-status label.** Rendering a process kind as `null` was never enough: the
  plugin trusted the harness's `.flowItem:empty{display:none}` to collapse the
  item, and it never fires. A DOM measurement of one real turn — 501 nodes, taken
  with a throwaway Cordis client probe — showed every one of those items carrying
  a single child element, so none is `:empty`. Each therefore kept its box and
  took the transcript column's 16px sibling margin: 501 × 16px is roughly 8000px
  of pure gap, growing with every tool call of a turn. That was the blank band
  above `深度求索中...`.

  The plugin now collapses each hidden kind itself, keyed on
  `[data-chat-flow-kind]`, and collapses a bare assistant step with
  `:not(:has(.dshdeck-card))` so that only the one item actually holding a deck
  keeps its box. `display:none` removes the margin as well as the box.

  A check in `test/client.test.mjs` now fails when a kind is added to the
  renderer and forgotten in the stylesheet, which is exactly how this survived
  the move to hiding `tool-call`.

- **The plain-language rewrite works for the first time.** It never reached the
  UI. The plumbing handed `slidesFromPlain` a hand-picked `{ prompt }` instead of
  the model slice it reads; `plainMeta` then read `problems.length` off
  `undefined`, the `.catch` swallowed the `TypeError`, the entry's state became
  `error`, and every card silently fell back to the local renderer. The `· 通俗版`
  marker this README documents never appeared on any turn, and the per-turn model
  call was paid and discarded every time.

  The shape is now defined once — `plainModelView`, which selects the five fields
  the rewrite reads — and built from the whole turn model at the point it is
  stashed, so a call site can no longer hand over a narrower object by accident.
  It selects rather than defaults, so a missing field still fails loudly instead
  of quietly reporting `正常完成`.

  Three checks in `test/client.test.mjs` pin it: the produced key set, the
  rewrite rendering a deck with a real status line when driven with that shape,
  and a bare `{ prompt }` still throwing — if someone later softens `plainMeta`
  with defaults, that last check forces the decision to be made on purpose.
- **A failed rewrite is no longer silent.** The `.catch` in `plainEntryFor`
  reported nothing, which is exactly why a rewrite that failed on every single
  turn looked like a plugin whose wording simply was not very plain. It now logs
  what went wrong.
- **The deck no longer appears and vanishes once per step.** A turn that is
  still open has no report yet, but nothing said so: a settled mid-turn step is
  briefly the turn's *last* assistant step, so the closing-step fallback below
  rendered it as a deck. The next step then made it stop being last and the deck
  disappeared — one deck flickering in and out for every step of the turn. The
  renderer now requires the turn not to be `open`, which is the same signal the
  shipped `深度求索中...` turn-status label reads, so the box and the report agree
  on when the turn is over.
- **The working box lines up with the conversation.** As a direct child of the
  composer stack it stretched the full window width, far wider than the messages
  and the composer card. It now carries the shipped dock formula —
  `width: calc(100% - 2 * side-clearance - 4 * dock-inset)` with
  `max-width: calc(card-max-width - 4 * dock-inset)` and `margin: 0 auto` —
  which resolves to exactly `--dsh-chat-content-width`, the width of the message
  column.
- **An aborted or truncated turn no longer reports every narration step.** The
  closing-step test read `closingSeq === null || mySeq === null ? true : …`, so a
  turn that wrote no `turn-tail` — which is exactly what an abort or a truncation
  leaves behind — was treated as if *every* assistant step were the report, and
  one failure produced a pile of narration decks. The test now fails closed: with
  no closing marker, only the last assistant step speaks for the turn.

## 0.1.1

### Fixed

- **The plugin now loads at all.** Every registration into
  `conversation.chat.node` went in at the default slot priority, while the
  harness's own renderer already owned those same keys at that same priority.
  Two registrations competing for one cell at one priority is not a tie the slot
  system resolves — the row failed to load and the plugin contributed nothing.
  v0.1.0 never mounted on any harness, and startup reported a plugin load error.
  Every registration now carries `priority: -10`, which wins the cell.

  Nothing else was wrong: the bundle patch, the profile `bundles` entry, the
  host half and the browser half were all correct throughout.

### Added

- A class-wide regression check in `test/client.test.mjs`: every
  `conversation.chat.node` registration must declare a shadowing priority. Adding
  a new key and forgetting the priority now fails the suite before release,
  instead of silently shipping a plugin that cannot load.
- A **Troubleshooting** section and a **"Shadowing a built-in slot"** development
  note, in English and Chinese.

### Changed

- `package.json` version now matches the published tag.

## 0.1.0

Initial release — the slide card, the plain-language rewrite, the transcript
tidy-up, and the local markdown fallback.

**Broken: do not use.** See 0.1.1.
