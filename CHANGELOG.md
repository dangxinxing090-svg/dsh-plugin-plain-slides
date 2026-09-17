# Changelog

Notable changes to `dsh-plugin-plain-slides`. Versions follow [Semantic
Versioning](https://semver.org/).

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
