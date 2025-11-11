# CardSpoke Extension Features

This document lists features that are planned to be released as optional extensions/mods after the 1.0 release. These features enhance CardSpoke's functionality without adding complexity to the core application.

---

## 📋 Overview

Extensions allow users to customize CardSpoke based on their specific needs. All features listed below are designed to be implemented as optional mods that users can enable or disable through the Extensions Manager.

---

## 🎯 Planned Extension Features

### Focus Mode
**Purpose:** Distraction-free writing interface

**Features:**
- Hide UI elements except current card
- Keyboard-only navigation
- Zen/meditation timer option
- Minimal interface for deep work

**Target Version:** Post-1.0

---

### Quick Capture
**Purpose:** Rapid idea collection

**Features:**
- Floating quick-add button always accessible
- Keyboard shortcut for instant new card creation
- "Inbox" concept for unsorted cards
- Integration with mobile quick share

**Target Version:** Post-1.0

---

### Card Templates
**Purpose:** Standardized card structures

**Features:**
- Predefined card structures for common use cases
- Custom template creation and management
- Template library in mod form
- Quick-apply templates during card creation

**Target Version:** Post-1.0

---

### Daily Notes / Journal Mode
**Purpose:** Time-based journaling and logging

**Features:**
- Auto-create daily cards with timestamps
- Calendar navigation for date-based cards
- Journaling-specific features:
  - Mood tracking
  - Habit logging
  - Daily reflection prompts
- Integration with other cards

**Target Version:** Post-1.0

---

### Card Attachments
**Purpose:** Multimedia content integration

**Features:**
- Attach images to cards (stored as base64 or linked)
- File attachments with preview
- Voice notes/audio clips
- Drawing/sketching canvas
- Support for various file types

**Target Version:** Post-1.0

---

### Card Comments/Notes
**Purpose:** Collaborative annotation

**Features:**
- Separate comment thread on cards
- Annotations without editing main content
- Collaborative note-taking preparation
- Comment history and threading

**Target Version:** Post-1.0

---

### Custom Card Fields
**Purpose:** Structured data management

**Features:**
- User-defined metadata fields
- Field types:
  - Text
  - Number
  - Date
  - Dropdown/select
  - Checkbox
  - URL
- Custom field display in UI
- Filterable and searchable custom fields
- Field templates

**Target Version:** Post-1.0

---

### Browser Extension
**Purpose:** Web content capture

**Features:**
- Quick clip from web pages
- Save selections to cards
- Universal capture from any website
- Automatic metadata extraction (URL, title, date)
- Image capture and storage

**Target Version:** Post-1.0

**Note:** Requires separate browser extension development for Chrome, Firefox, Edge, etc.

---

### Text-to-Speech
**Purpose:** Accessibility and convenience

**Features:**
- Read card content aloud
- Navigate cards via voice
- Speed and voice customization
- Language support
- Pause/resume functionality

**Target Version:** Post-1.0

---

### Card Reminders
**Purpose:** Task management and scheduling

**Features:**
- Set due dates on cards
- Reminder notifications
- Task/todo functionality
- Recurring reminders
- Priority levels
- Integration with calendar apps (optional)

**Target Version:** Post-1.0

---

### Change Notifications
**Purpose:** Track modifications and updates

**Features:**
- Track when cards are modified
- Notification center for updates
- Follow/watch specific cards
- Digest emails (optional)
- Activity feed
- Filter notifications by type/card

**Target Version:** Post-1.0

---

## 🔧 Implementation Guidelines

All extensions should:
- Be self-contained and modular
- Not require core app modifications
- Include proper error handling
- Follow the mod safety guidelines
- Provide clear documentation
- Be reversible (can be disabled without data loss)

---

## 📝 Extension Development

Developers interested in creating these extensions should:
1. Review the Extension Wizard documentation
2. Use the Playground for testing
3. Follow the mod safety layer requirements
4. Submit to the Mod Marketplace (when available)

---

## 🎨 Extension Categories

Extensions are grouped by functionality:

**Productivity:**
- Focus Mode
- Quick Capture
- Card Templates
- Card Reminders

**Journaling:**
- Daily Notes / Journal Mode
- Card Attachments
- Mood/Habit Tracking

**Collaboration:**
- Card Comments/Notes
- Change Notifications
- Shared workspace features (future)

**Data Management:**
- Custom Card Fields
- Advanced filtering
- Data validation

**Accessibility:**
- Text-to-Speech
- High contrast themes
- Keyboard navigation enhancements

**Integration:**
- Browser Extension
- API integrations
- Third-party tool connectors

---

## 📅 Release Timeline

- **Phase 1 (Post-1.0):** Focus Mode, Quick Capture, Card Templates
- **Phase 2 (v1.1-1.2):** Daily Notes, Card Attachments, Card Reminders
- **Phase 3 (v1.3-1.4):** Custom Fields, Comments, Text-to-Speech
- **Phase 4 (v1.5+):** Browser Extension, Change Notifications, Advanced Features

---

## 💡 Suggesting New Extensions

Users can suggest new extension ideas by:
- Opening an issue on GitHub
- Describing the use case and desired functionality
- Providing examples of similar features in other apps
- Explaining why it should be an extension vs. core feature

---

**Last Updated:** 2025-11-11  
**Document Version:** 1.0  
**Related:** Road Map V2.md, Roadmap changes.md
