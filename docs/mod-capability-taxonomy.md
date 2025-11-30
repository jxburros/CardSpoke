# Mod Capability Taxonomy

**Version:** 0.13.1  
**Author:** Showrunner Agent / jxburros  
**Date:** 2025-11-28  
**Status:** Design Document (Planned for v1.0+)  

---

## Overview

This document defines the **capability taxonomy** for CardSpoke mods, establishing a permission system that controls what actions mods can perform. This system will be enforced starting in v0.12 (Safety & Governance).

### Goals
1. Define clear capability categories
2. Enable granular permission control
3. Protect user data and privacy
4. Support future security enhancements
5. Maintain mod flexibility

---

## Capability Categories

### 1. UI Capability (`ui`)

**Description:** Modify user interface elements, styling, and visual presentation.

**Permissions:**
- Add/modify CSS styles
- Create new UI components
- Modify existing UI components
- Add menu items
- Add keyboard shortcuts
- Modify theme colors/fonts

**Examples:**
- Theme mods (dark mode variations)
- Custom card layouts
- UI enhancements (tooltips, animations)
- Layout modifications

**Restrictions:**
- Cannot access data directly
- Cannot make network requests
- Cannot modify core app logic

**Declaration:**
```javascript
{
  "capabilities": ["ui"],
  "description": "Dark theme with purple accents"
}
```

---

### 2. Data Capability (`data`)

**Description:** Read and modify card data, store, and user content.

**Permissions:**
- Read cards and metadata
- Create/update/delete cards
- Modify tags and attributes
- Access bookmarks and recent cards
- Read/write mod-specific data (`modsData` field)

**Examples:**
- Auto-tagging mods
- Card templates
- Batch operations
- Data visualization mods

**Restrictions:**
- Cannot access other mods' data
- Cannot modify mod registry
- Cannot access PIN-protected data without unlock

**Declaration:**
```javascript
{
  "capabilities": ["data"],
  "description": "Auto-tag cards based on content"
}
```

---

### 3. Storage Capability (`storage`)

**Description:** Access browser storage APIs beyond card data.

**Permissions:**
- Read/write localStorage
- Access IndexedDB
- Cache API access
- Session storage

**Examples:**
- Custom caching strategies
- Offline data sync preparation
- Analytics storage
- Settings persistence

**Restrictions:**
- Cannot access other apps' storage
- Cannot modify CardSpoke registry
- Must namespace keys (e.g., `mod_name_*`)

**Declaration:**
```javascript
{
  "capabilities": ["storage"],
  "description": "Custom caching for performance"
}
```

---

### 4. Network Capability (`network`)

**Description:** Make HTTP requests to external services.

**Permissions:**
- Fetch API access
- XMLHttpRequest access
- WebSocket connections
- Service Worker registration

**Examples:**
- Cloud sync mods
- Import from external APIs
- Export to cloud services
- Real-time collaboration

**Restrictions:**
- User must explicitly approve on first use
- All requests logged
- Cannot access localhost (security)
- Must declare endpoints in manifest

**Declaration:**
```javascript
{
  "capabilities": ["network"],
  "endpoints": [
    "https://api.example.com/*",
    "wss://sync.example.com/*"
  ],
  "description": "Sync cards to cloud"
}
```

---

### 5. Filesystem Capability (`filesystem`)

**Description:** Access device filesystem (Capacitor only).

**Permissions:**
- Read files
- Write files
- Choose directories
- File picker access

**Examples:**
- Advanced import/export
- Attachment handling
- Local backup mods
- Image/media handling

**Restrictions:**
- Capacitor Filesystem API only
- User must grant permissions
- No system directory access
- All operations logged

**Declaration:**
```javascript
{
  "capabilities": ["filesystem"],
  "description": "Import markdown files from filesystem"
}
```

---

### 6. Hooks Capability (`hooks`)

**Description:** Register and execute lifecycle hooks.

**Permissions:**
- onAppInit
- onCardRender
- onCardSave
- onCardDelete
- onSearch
- onExport
- onImport

**Examples:**
- All functional mods
- Data transformation
- Event-driven features

**Restrictions:**
- Timeout enforcement (5 seconds)
- Error isolation (failures don't crash app)
- No recursive hook calls

**Declaration:**
```javascript
{
  "capabilities": ["hooks"],
  "hooks": ["onCardRender", "onCardSave"],
  "description": "Transform card content on save"
}
```

---

## Capability Combinations

Mods can request multiple capabilities:

### Common Combinations

**Theme Mod:**
```javascript
{
  "capabilities": ["ui"]
}
```

**Data Transformation Mod:**
```javascript
{
  "capabilities": ["data", "hooks"]
}
```

**Cloud Sync Mod:**
```javascript
{
  "capabilities": ["data", "network", "storage", "hooks"]
}
```

**Import/Export Mod:**
```javascript
{
  "capabilities": ["data", "filesystem", "hooks"]
}
```

---

## Permission Levels

### Level 0: Restricted (Default)
- No capabilities declared
- Can only provide CSS
- Cannot execute JavaScript
- Safe for all users

### Level 1: UI Only
- `capabilities: ["ui"]`
- Visual changes only
- No data access
- Low risk

### Level 2: Data Access
- `capabilities: ["ui", "data", "hooks"]`
- Can modify user content
- Medium risk
- Review recommended

### Level 3: Extended Access
- Includes `storage`, `network`, or `filesystem`
- High privilege
- High risk
- Explicit user approval required

---

## Enforcement Mechanism

### v0.9 (Documentation Phase)
- Capabilities declared in mod manifest (optional)
- No enforcement
- Used for documentation and user awareness

### v0.10 (Warning Phase)
- Capabilities checked
- Warnings shown for undeclared usage
- Still no blocking

### v0.12 (Enforcement Phase)
- Full capability enforcement
- Mods without proper capabilities blocked
- Detailed error messages
- User override option (advanced users)

---

## Mod Manifest Schema

### Complete Manifest Example

```javascript
{
  // Basic Info
  "name": "Advanced Cloud Sync",
  "creator": "Example Developer",
  "version": "1.0.0",
  "releaseDate": "2025-11-12",
  "schema": 4,
  
  // Capabilities
  "capabilities": ["data", "network", "storage", "hooks"],
  
  // Network endpoints (if network capability)
  "endpoints": [
    "https://api.sync.example.com/*"
  ],
  
  // Hooks used (if hooks capability)
  "hooks": ["onAppInit", "onCardSave", "onCardDelete"],
  
  // Description
  "description": "Sync your cards to cloud storage",
  
  // Code
  "js": "function onAppInit() { ... }",
  "css": ".sync-indicator { ... }"
}
```

---

## Security Considerations

### User Consent
- First-time capability use requires consent
- Clear explanation of what mod can do
- Option to deny or allow

### Audit Log
- All capability usage logged
- User can review mod activity
- Suspicious behavior flagged

### Sandboxing
- Each mod runs in isolated context
- Cannot access other mods' data
- Cannot modify core app code

### Revocation
- User can revoke capabilities anytime
- Mod disabled until capabilities granted
- No data loss

---

## Developer Guidelines

### Principle of Least Privilege
Request only capabilities you need:
```javascript
// Bad - over-privileged
{
  "capabilities": ["ui", "data", "network", "storage", "filesystem", "hooks"]
}

// Good - minimal
{
  "capabilities": ["ui", "hooks"]
}
```

### Capability Justification
Explain why each capability is needed:
```javascript
{
  "capabilities": ["data", "network"],
  "description": "Sync cards to Google Drive",
  "capabilityReasons": {
    "data": "Read and update cards during sync",
    "network": "Connect to Google Drive API"
  }
}
```

### Progressive Enhancement
Start with minimal capabilities, request more as needed:
```javascript
// v1.0 - UI only
{ "capabilities": ["ui"] }

// v2.0 - Add data access when feature added
{ "capabilities": ["ui", "data", "hooks"] }
```

---

## User Interface

### Permission Dialog

```
┌─────────────────────────────────────────────┐
│  Permission Request                        │
│                                             │
│  "Advanced Cloud Sync" wants to:           │
│                                             │
│  ✓ Access your card data                   │
│  ✓ Make network requests to:               │
│    • https://api.sync.example.com          │
│  ✓ Store sync settings locally             │
│                                             │
│  These permissions allow the mod to        │
│  sync your cards to cloud storage.         │
│                                             │
│  [Deny] [Allow Once] [Always Allow]        │
└─────────────────────────────────────────────┘
```

### Mod Info Panel

```
┌─────────────────────────────────────────────┐
│  Advanced Cloud Sync v1.0.0                │
│  by Example Developer                       │
│                                             │
│  Capabilities: 🔒                           │
│  • Data Access                              │
│  • Network (api.sync.example.com)          │
│  • Local Storage                            │
│                                             │
│  Status: ✓ Permissions Granted             │
│  Last Used: 2 minutes ago                   │
│                                             │
│  [Revoke Permissions] [Uninstall]          │
└─────────────────────────────────────────────┘
```

---

## Implementation Roadmap

### v0.9.0 (Current)
- [ ] Document capability taxonomy
- [ ] Update mod manifest schema
- [ ] Add capability field to mod structure

### v0.10.0
- [ ] Implement capability declaration
- [ ] Show warnings for missing capabilities
- [ ] Update mod creation wizard

### v0.11.0
- [ ] Add permission request UI
- [ ] Implement consent flow
- [ ] Add capability audit log

### v0.12.0
- [ ] Full capability enforcement
- [ ] Block mods without proper capabilities
- [ ] Add capability revocation
- [ ] Implement safety layer

---

## Testing Requirements

### Unit Tests
- Capability validation
- Permission checking
- Audit logging

### Integration Tests
- Mod installation with capabilities
- Permission request flow
- Capability revocation
- Cross-capability interactions

### Security Tests
- Attempt unauthorized data access
- Attempt unauthorized network requests
- Attempt capability escalation
- Sandbox escape attempts

---

## Migration Path

### Existing Mods (Pre-v0.9)
1. Analyze mod code to determine needed capabilities
2. Auto-generate capability list (best effort)
3. Prompt developer to review and confirm
4. Update mod manifest

### User Experience
- Existing mods continue to work (v0.9-0.11)
- Warnings shown in v0.10-0.11
- Enforcement in v0.12+
- Migration guide for mod developers

---

## Future Enhancements

### v0.13+
- Fine-grained data permissions (read-only, specific cards)
- Temporary permissions (one-time actions)
- Capability templates (pre-approved sets)

### v1.0+
- Mod marketplace with capability reviews
- Community trust ratings
- Verified mod badges

---

## Appendix: Capability Matrix

| Capability | Risk Level | User Approval | Audit Log |
|------------|-----------|---------------|-----------|
| ui | Low | Auto | No |
| data | Medium | First use | Yes |
| storage | Medium | First use | Yes |
| network | High | Always | Yes |
| filesystem | High | Always | Yes |
| hooks | Medium | Auto | Yes |

---

## References

- Road Map V2.md - v0.12 Safety & Governance
- Mod System Documentation
- Web Security Best Practices
- OWASP Guidelines

---

**Document Status:** Design Document - Planned for v1.0+  
**Next Steps:** Implementation after v1.0 stable release  
**Review Required:** Security team, Mod developers
