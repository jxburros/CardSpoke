# Branch Information

## capacitor-0.8.1

This branch contains CardSpoke Version 0.8.1 - the Capacitor edition.

### Key Changes

- Converted from single HTML file to Capacitor project structure
- Added support for Android, iOS, and Web platforms
- Separated HTML, CSS, and JavaScript into individual files
- Integrated Capacitor plugins for native functionality
- Updated version from 0.8 to 0.8.1

### Structure

The application is now organized as follows:

```
www/
├── index.html     - Main HTML structure
├── styles.css     - All application styles
├── app.js         - Application logic
└── capacitor.js   - Capacitor initialization
```

### Building

See [README-CAPACITOR.md](README-CAPACITOR.md) for detailed build instructions.

### Migration from 0.8

Version 0.8 exists as `CardSpoke 0.8.html` in the repository root. Version 0.8.1 maintains the same functionality but is restructured for Capacitor.
