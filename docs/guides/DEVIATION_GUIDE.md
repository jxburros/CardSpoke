# Deviation (Fork) Guide

A Deviation is any fork or derivative build of CardSpoke. Use this guide to stay aligned with the project’s licensing and ecosystem rules.

## Naming & Branding

- Do **not** use the name “CardSpoke” or official branding for a Deviation without explicit written permission from JX Holdings, LLC.
- Provide prominent credit to CardSpoke and JX Holdings, LLC in your README and about screens.

## Mandatory Metadata

Include the Deviation notice and credit block from the Required Notice Template below. If your Deviation also ships a plugin package, follow the manifest field requirements in [Plugin System](../architecture/PLUGIN_SYSTEM.md).

## Licenses & Attribution

- CardSpoke core is licensed under the Apache License 2.0 (see [LICENSE](../../LICENSE)).
- Your Deviation must retain copyright and permission notices.
- Credit any AI assistants and contributors used.

## Compatibility & Updates

- Declare which schemaVersion you support.
- Document differences from the canonical CardSpoke behavior.
- Clearly label angled (community) features vs. any official components you include.

## Distribution

- Monetization is allowed. Be transparent about pricing, support policies, and update cadence.
- Avoid implying official endorsement unless granted in writing.

## Safety & Data

- Respect the local-first model; do not collect or transmit data without opt-in.
- Provide migration and rollback instructions if you diverge from core schemas. Note how you handle exports created by the core — JSON exports are named `cardspoke-{type}-{timestamp}.json` (e.g. `cardspoke-instance-1719936000000.json`), while CSV/Markdown/TXT exports are named `cardspoke-{YYYY-MM-DD}.{ext}` with no type segment — and whether your build can import/export them without loss.

## Required Notice Template

Use this (or stricter) notice in your README/about screen/splash:

> This project is a Deviation of CardSpoke and is not an official CardSpoke release.
> CardSpoke is owned by JX Holdings, LLC. This build is independently maintained.

## Compatibility Checklist

- Declare supported `schemaVersion` and tested CardSpoke baseline version.
- Validate import/export compatibility for JSON/CSV/Markdown/TXT backup formats.
- Test with at least one theme-layer, one feature-layer, and one app-layer plugin (or clearly document unsupported layers).
- Document any changed hooks, storage behavior, or removed APIs before release.
