# CardSpoke Capacitor Guide

This guide covers platform prerequisites and workflows for building and running CardSpoke with Capacitor. The web assets are already in `www/`, so the focus is on syncing and opening native shells.

## Prerequisites
- Node 18+
- Capacitor CLI (`npx cap` via project devDependencies)
- Android: Android Studio, Android SDK + platform tools, Java 17+
- iOS: Xcode, CocoaPods, iOS device/simulator provisioning
- Optional: platform-specific signing assets for release builds ([PLACEHOLDER] add signing instructions)

## Typical Workflows
### 1) Sync web assets to native platforms
```bash
npm run sync          # Sync all configured platforms
npm run sync:android  # Sync Android only
npm run sync:ios      # Sync iOS only
```

### 2) Open platform workspaces
```bash
npm run open:android  # Launch Android Studio with the generated project
npm run open:ios      # Launch Xcode with the generated project
```

### 3) Build web assets (when changed)
Web files in `www/` are already bundled. If you modify them, run:
```bash
npm run build
npm run sync
```

## Platform Notes
- **Android:** Ensure `ANDROID_HOME` is set and emulator/device is available. Use Android Studio’s Run/Debug to deploy. For release builds, configure signing configs inside the generated Android project ([PLACEHOLDER] keystore guidance).
- **iOS:** Run `pod install` inside `ios/App` after syncing if pods change. Use Xcode’s scheme selector to choose device/simulator and run. Configure signing & provisioning profiles in Xcode for distribution ([PLACEHOLDER] distribution profile steps).

## Plugins Used
- `@capacitor/android`, `@capacitor/ios` – native shells
- `@capacitor/app` – app lifecycle helpers
- `@capacitor/preferences` – key/value storage
- `@capacitor/filesystem` – file persistence

Document any additional plugins you add in this file, including platform-specific caveats, configuration steps, and testing expectations.

## Troubleshooting
- **Sync failures:** Delete `android/` or `ios/` builds and re-run `npm run sync`. Clear Gradle/DerivedData if platform caches corrupt.
- **Plugin issues:** Confirm plugin versions match Capacitor major version. Re-run `npx cap doctor` ([PLACEHOLDER] add known-good versions/table if needed).
- **Platform-specific errors:** Capture logs from `adb logcat` (Android) or Xcode console (iOS) when filing issues.

