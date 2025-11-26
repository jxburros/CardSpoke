# CardSpoke Testing Guide

This guide explains how to test CardSpoke on **PC (Web Browser)** and **Android** devices.

## Quick Start

### Testing on PC (Web Browser)

**No installation required!** CardSpoke runs directly in your web browser.

1. Download or clone this repository
2. Navigate to the `www/` folder
3. Open `index.html` in any modern web browser (Chrome, Firefox, Safari, Edge)

That's it! The app is ready to use.

#### Alternative: Local Server (Optional)

If you encounter any CORS issues, you can use a local server:

```bash
# Using Python 3
cd www
python -m http.server 8080
# Open http://localhost:8080 in your browser

# Using Node.js
npx serve www
# Open the URL shown in terminal
```

---

### Testing on Android

There are two ways to test on Android:

#### Option A: Web Browser (Quickest)

1. Host the `www/` folder on any web server or GitHub Pages
2. Open the URL in Chrome on your Android device
3. Optionally, use Chrome's "Add to Home Screen" feature for an app-like experience

#### Option B: Native Android App (Full Experience)

For the full native app experience with Capacitor:

**Prerequisites:**
- [Node.js](https://nodejs.org/) v16 or higher
- [Android Studio](https://developer.android.com/studio)
- An Android device or emulator

**Steps:**

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install Capacitor Android package:**
   ```bash
   npm install @capacitor/android
   ```

3. **Add Android platform:**
   ```bash
   npx cap add android
   ```

4. **Sync web assets to Android:**
   ```bash
   npm run sync:android
   ```

5. **Open in Android Studio:**
   ```bash
   npm run open:android
   ```

6. **Run on device/emulator:**
   - In Android Studio, select your device or emulator
   - Click the "Run" button (green play icon)

---

## Files Included in Testing Branch

This branch contains only the essential files needed for testing:

### Core Application Files

| File | Purpose |
|------|---------|
| `www/index.html` | Main HTML structure |
| `www/app.js` | Application logic |
| `www/styles.css` | Application styles |
| `www/capacitor.js` | Capacitor initialization (for native builds) |

### Configuration Files

| File | Purpose |
|------|---------|
| `capacitor.config.json` | Capacitor native app configuration |
| `package.json` | Dependencies and npm scripts |
| `package-lock.json` | Locked dependency versions |

### Documentation

| File | Purpose |
|------|---------|
| `README.md` | Main project documentation |
| `README-CAPACITOR.md` | Capacitor setup guide |
| `TESTING_GUIDE.md` | This guide |
| `LICENSE` | ISC license |

---

## Features to Test

Here are the key features you can test:

### Basic Operations
- [ ] Create a new card
- [ ] Edit card content
- [ ] Delete a card
- [ ] Navigate between cards

### Navigator Suite
- [ ] Add/remove bookmarks (★ icon)
- [ ] View recent cards
- [ ] Duplicate a card
- [ ] Toggle compact view mode

### Search & Organization
- [ ] Search for cards
- [ ] Add/remove tags
- [ ] Filter by tags

### Export/Import
- [ ] Export data as JSON
- [ ] Export as Markdown
- [ ] Export as CSV
- [ ] Import data

### Settings
- [ ] Toggle dark/light theme
- [ ] Toggle high contrast mode
- [ ] View keyboard shortcuts (Ctrl+/)

### Extensions (if available)
- [ ] Load extensions
- [ ] Test extension functionality

---

## Keyboard Shortcuts

Press `Ctrl+/` (or `Cmd+/` on Mac) to see all shortcuts. Key shortcuts:

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New card |
| `Ctrl+F` | Search |
| `Ctrl+H` | Go home |
| `Ctrl+B` | Bookmarks |
| `Ctrl+R` | Recent cards |
| `Alt+T` | Toggle theme |
| `Escape` | Go back/close |

---

## Troubleshooting

### Web Browser Issues

**Problem:** App doesn't load or shows errors

**Solutions:**
- Make sure you're opening `www/index.html`, not the root folder
- Try a different browser
- Clear browser cache
- Check browser console (F12) for errors

### Android Build Issues

**Problem:** `npx cap add android` fails

**Solutions:**
- Make sure Android Studio is installed with SDK
- Set `ANDROID_HOME` environment variable
- Run `npm install` first

**Problem:** App crashes on device

**Solutions:**
- Check Android Studio logcat for errors
- Ensure minimum SDK version is supported
- Try on an emulator first

---

## Keeping Up to Date

This testing branch is automatically updated whenever changes are pushed to the main branch. To get the latest version:

```bash
git checkout testing
git pull origin testing
```

Or download the latest release from the [releases page](https://github.com/jxburros/CardSpoke/releases).

---

## Support

- 🐛 **Report Issues:** [GitHub Issues](https://github.com/jxburros/CardSpoke/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/jxburros/CardSpoke/discussions)

---

*This guide is part of the CardSpoke testing branch, which contains only the essential files needed for PC and Android testing.*
