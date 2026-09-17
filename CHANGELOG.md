# Changelog

Notable changes to `dsh-plugin-plain-slides`. Versions follow [Semantic
Versioning](https://semver.org/).

## Unreleased

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
