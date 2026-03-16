Phase 4: Pre-Launch Readiness (Priority: CRITICAL)
Phase 4.1: Data Reliability & Performance
Objective: Ensure bulk operations are safe, performant, and reversible.

Task 4.1.1: Transactional Undo Groups

Context: Currently, pushUndo tracks single card changes.

Action: Implement window.startUndoGroup() and window.endUndoGroup(). Wrap bulk operations like importJSON and recursive duplicateCard in these boundaries.

Success Criteria: A user can revert a 100-card import with a single "Undo" command.

Task 4.1.2: Atomic Persistence for Recursive Deletes

Context: deleteCard calls itself recursively.

Action: Modify the deleteCard signature to ensure save() is only called by the top-level initiator, even if skipSave is false for children.

Success Criteria: Deleting a large tree triggers exactly one disk write instead of one per node.

Task 4.1.3: Deep Data Integrity Checker

Context: load() only performs basic root-order synchronization.

Action: Implement a validateStoreConsistency() function that runs on boot to:

Repair "orphan" cards (parentId exists but parent card is missing).

Detect and break circular parent/child loops.

Clean up rootOrder for IDs that no longer exist in store.cards.

Success Criteria: The app automatically repairs structural metadata on every load.

Phase 4.2: Security Hardening
Objective: Transition from "placeholder" security to actual user protection.

Task 4.2.1: Enable Dataset PIN Encryption

Context: PIN inputs are currently disabled: true.

Action: Implement the Web Crypto API within DatasetManager to encrypt the store payload using a PBKDF2-derived key from the user's PIN before passing it to the storage driver.

Success Criteria: The dataset payload is unreadable in localStorage or Cloud storage without the PIN.

Task 4.2.2: Sandbox Hardening (Iframe Isolation)

Context: _createSandboxedFunction uses new Function, which doesn't block window access.

Action: Refactor the plugin loader to execute JS within a hidden, null-origin <iframe>. Communicate via postMessage to the provided ctx API.

Success Criteria: Plugins cannot access document.cookie or the main app's window globals.

Phase 4.3: UX Maturity & Ecosystem
Objective: Improve user retention and ease of extensibility.

Task 4.3.1: Persistent Navigation History

Context: navHistory is currently a session-only array.

Action: Save the navHistory and navState to the dataset's metadata object during save().

Success Criteria: Refreshing the browser returns the user to their exact card and restores the "Back" button history.

Task 4.3.2: Built-in Plugin Gallery

Context: showPluginManager requires manual file uploads or URLs.

Action: Add a "Gallery" tab that fetches a curated manifest.json from the CardSpoke GitHub repository and provides one-click Plugin.install() buttons.

Success Criteria: Users can discover and install themes/features without leaving the app.
