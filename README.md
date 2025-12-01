# CardSpoke

CardSpoke is a lightweight, card-based knowledge system built for extensibility. The core intentionally stays minimal while an extension framework enables themes, plugins, patches, and full-scale mods. Users keep control of their data with a local-first storage model and optional off-device integrations.

## Why CardSpoke
- **Ultra-lightweight core:** Intentional minimalism keeps performance high and cognitive load low.
- **Extension-first architecture:** Themes, Patches, Plugins, Mods, Kits, and Expansions let the community expand the product without bloating the core.
- **User ownership:** Data stays local by default; no hosted data or silent syncs.
- **Transparent ecosystem:** Clear metadata, authorship, and changelog expectations for all angled (community) content.

## Getting Started
1. Install dependencies (Node 18+ recommended):
   ```bash
   npm install
   ```
2. Run the web build (files are pre-generated in `www`):
   ```bash
   npm run build
   ```
3. Start a Capacitor workflow (see [Capacitor README](./README.CAPACITOR.md)):
   ```bash
   npm run sync
   ```
4. Run the tests:
   ```bash
   npm test
   ```

## Project Layout
- `www/` – Prebuilt web assets for the Capacitor shell.
- `types/` – Type declarations and shared interfaces.
- `tests/` – Automated tests (uvu).
- `cardspoke_spec_v1.md` – Canonical specification for philosophy, licensing boundaries, and ecosystem rules.
- `test-extension-improvements.js` – Scripted checks for extension-related scenarios.

## Extension Framework Overview
- **Themes:** Cosmetic only; cannot change logic or data.
- **Patches:** Packaged updates that may alter behavior; official or angled.
- **Plugins:** Add features without rewriting the core.
- **Mods:** Change fundamental logic; intentionally high impact.
- **Kits:** Bundles of Themes/Patches.
- **Expansions:** Bundles that include Plugins or Mods.

Each Extension must ship mandatory metadata (type, name, version, author, AI assistants, description, date, dependencies, schema compatibility, official/angled flags). See [Extensions Developer Guide](./extensions/DEVELOPER_GUIDE.md).

## Deviation (Fork) Rules
Deviations are forks/derivatives that must not use the "CardSpoke" name or branding. They must include mandatory metadata, clear credit to CardSpoke and JX Holdings, and avoid implying official endorsement.

## Storage Model
CardSpoke is local-first (LocalStorage/IndexedDB). Optional off-device storage may be wired through integrations chosen by the user; no automatic sync or hosted data.

## Contributing
- Follow community and extension guidelines in [Extension Ecosystem Guidelines](./extensions/ECOSYSTEM_GUIDELINES.md).
- Adhere to safety expectations in [Security & Safety Considerations](./SECURITY_AND_SAFETY.md).
- Submit issues/PRs with clear metadata and changelog entries.
- Respect branding restrictions (CardSpoke name/branding cannot be used in forks).

## Support & Questions
Please open an issue with details about your environment, extensions in use, and schema version. For licensing or branding questions, include your planned distribution channel and whether the work is official or angled.

## Open Items
- [PLACEHOLDER] Preferred channels for user support and security disclosures.
- [PLACEHOLDER] Any official branding assets and usage guidelines for community themes.

