# Deviation (Fork) Guide

A Deviation is any fork or derivative build of CardSpoke. Use this guide to stay aligned with the project’s licensing and ecosystem rules.

## Naming & Branding
- Do **not** use the name “CardSpoke” or official branding for a Deviation without explicit written permission from JX Holdings, LLC.
- Provide prominent credit to CardSpoke and JX Holdings, LLC in your README and about screens.

## Mandatory Metadata
Include the required metadata block for Deviations (see [Extensions Developer Guide](./extensions/DEVELOPER_GUIDE.md)) with `type: "Deviation"`.

## Licenses & Attribution
- CardSpoke core is licensed under an ISC-style license with branding restrictions (see [LICENSE](./LICENSE)).
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
- Provide migration and rollback instructions if you diverge from core schemas.

## Open Items
- [PLACEHOLDER] Required notice template for about pages and splash screens.
- [PLACEHOLDER] Checklist for validating Deviation compatibility with popular Extensions.

