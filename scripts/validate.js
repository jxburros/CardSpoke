#!/usr/bin/env node
/**
 * Validation script for Card Info Base Capacitor conversion
 * Verifies all required files and configurations are in place
 */

const fs = require('fs');
const path = require('path');

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0
};

function check(name, condition, isWarning = false) {
  if (condition) {
    console.log(`✓ ${name}`);
    checks.passed++;
    return true;
  } else {
    if (isWarning) {
      console.warn(`⚠ ${name}`);
      checks.warnings++;
    } else {
      console.error(`✗ ${name}`);
      checks.failed++;
    }
    return false;
  }
}

function fileExists(filePath) {
  return fs.existsSync(path.join(__dirname, '..', filePath));
}

function fileContains(filePath, searchString) {
  try {
    const content = fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
    return content.includes(searchString);
  } catch (e) {
    return false;
  }
}

console.log('Card Info Base - Capacitor Validation\n');
console.log('='.repeat(50));

// Check core files
console.log('\n📁 Core Files:');
check('package.json exists', fileExists('package.json'));
check('capacitor.config.json exists', fileExists('capacitor.config.json'));
check('.gitignore exists', fileExists('.gitignore'));

// Check www directory structure
console.log('\n🌐 Web Directory:');
check('www/index.html exists', fileExists('www/index.html'));
check('www/manifest.json exists', fileExists('www/manifest.json'));
check('www/css/style.css exists', fileExists('www/css/style.css'));
check('www/js/app.js exists', fileExists('www/js/app.js'));
check('www/js/storage-manager.js exists', fileExists('www/js/storage-manager.js'));
check('www/js/comment-block-export.js exists', fileExists('www/js/comment-block-export.js'));

// Check icons
console.log('\n🎨 App Icons:');
check('icon.svg exists', fileExists('www/assets/icons/icon.svg'));
check('icon-192x192.svg exists', fileExists('www/assets/icons/icon-192x192.svg'));
check('icon-512x512.svg exists', fileExists('www/assets/icons/icon-512x512.svg'));

// Check documentation
console.log('\n📖 Documentation:');
check('README.md exists', fileExists('README.md'));
check('CAPACITOR_README.md exists', fileExists('CAPACITOR_README.md'));
check('CAPACITOR_CONVERSION.md exists', fileExists('CAPACITOR_CONVERSION.md'));

// Check version consistency
console.log('\n🔢 Version Consistency:');
const packageVersion = require('../package.json').version;
check(`package.json version is 0.7.0`, packageVersion === '0.7.0');
check('index.html has version 0.7.0', fileContains('www/index.html', 'Version: 0.7.0'));
check('app.js has version 0.7.0', fileContains('www/js/app.js', 'APP_VERSION = "0.7.0"'));

// Check Capacitor configuration
console.log('\n⚙️ Capacitor Configuration:');
const capConfig = require('../capacitor.config.json');
check('appId is configured', capConfig.appId === 'com.cardinfo.base');
check('appName is configured', capConfig.appName === 'Card Info Base');
check('webDir is www', capConfig.webDir === 'www');

// Check platform support
console.log('\n📱 Platform Support:');
check('Android platform added', fileExists('android'), true);
check('iOS platform ready', !fileExists('ios'), true);

// Check dependencies
console.log('\n📦 Dependencies:');
const pkg = require('../package.json');
check('@capacitor/core installed', pkg.dependencies['@capacitor/core'] !== undefined);
check('@capacitor/cli installed', pkg.dependencies['@capacitor/cli'] !== undefined);
check('@capacitor/app installed', pkg.dependencies['@capacitor/app'] !== undefined);
check('@capacitor/filesystem installed', pkg.dependencies['@capacitor/filesystem'] !== undefined);
check('@capacitor/preferences installed', pkg.dependencies['@capacitor/preferences'] !== undefined);
check('@capacitor/android installed', pkg.dependencies['@capacitor/android'] !== undefined);

// Summary
console.log('\n' + '='.repeat(50));
console.log('\n📊 Validation Summary:');
console.log(`   ✓ Passed: ${checks.passed}`);
console.log(`   ✗ Failed: ${checks.failed}`);
console.log(`   ⚠ Warnings: ${checks.warnings}`);

if (checks.failed > 0) {
  console.log('\n❌ Validation FAILED. Please fix the issues above.');
  process.exit(1);
} else if (checks.warnings > 0) {
  console.log('\n⚠️  Validation PASSED with warnings.');
  process.exit(0);
} else {
  console.log('\n✅ Validation PASSED! All checks successful.');
  process.exit(0);
}
