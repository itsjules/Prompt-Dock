# Testing Guide for PromptDock

## Quick Start Testing

### Method 1: Production Build (Recommended)

This is the most reliable way to test the application:

```bash
# 1. Build the React frontend
npm run build

# 2. Run Electron with the built app
npx electron .
```

**What to expect:**
- A window should appear (600x500 pixels)
- The window will be "always on top"
- You'll see "PromptDock" heading with a counter button
- The window should show initially, then you can test the hotkey

**Test the global hotkey:**
- Press `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
- The window should toggle between visible/hidden
- This should work even when other applications are focused

**Test data persistence:**
1. Open the app
2. The console should log "Storage loaded successfully"
3. Close the app completely
4. Reopen it - your data should persist

**Check storage location:**
- Windows: `%APPDATA%\Roaming\com.promptdock.app\promptdock-data.json`
- You can view this file to see the stored data structure

---

### Method 2: Development Mode (If Fixed)

If you want to try the development mode:

```bash
npm run electron:dev
```

**Known issue:** There's currently a module loading quirk where `require('electron')` doesn't work properly in dev mode with our current setup. This is why Method 1 is recommended.

---

## What to Test

### ✅ Core Functionality

1. **Window Behavior**
   - Window appears on top of other windows
   - ESC key hides the window
   - Global hotkey (`Ctrl+Shift+P`) toggles visibility

2. **Data Persistence**
   - Open browser DevTools: `Ctrl+Shift+I` (in dev mode)
   - Check console for "Storage loaded successfully"
   - Check console for "Storage saved successfully" (happens automatically)

3. **Store Integration**
   - The app uses Zustand stores for state management
   - Changes are automatically saved after 500ms (debounced)

### 🔧 Developer Testing

**View the storage file:**
```bash
# Windows
type %APPDATA%\com.promptdock.app\promptdock-data.json

# Or navigate to:
# C:\Users\<YourUsername>\AppData\Roaming\com.promptdock.app\
```

**Expected storage structure:**
```json
{
  "version": "1.0.0",
  "blocks": {},
  "prompts": {},
  "collections": {},
  "settings": {
    "globalHotkey": "CommandOrControl+Shift+P",
    "theme": "system"
  }
}
```

---

## Troubleshooting

### Issue: Window doesn't appear
- Check if the build completed successfully
- Look for errors in the terminal
- Try running `npm run build` again

### Issue: Global hotkey doesn't work
- Make sure no other app is using `Ctrl+Shift+P`
- Try clicking on the window first to ensure it has focus
- Check Windows/Mac keyboard shortcut settings

### Issue: "Cannot find module 'electron'"
- Run `npm install` to ensure all dependencies are installed
- Make sure you're in the project directory

### Issue: Port already in use (dev mode)
- Kill any running Vite dev servers
- Or just use the production build method instead

---

## Next Steps

Once you've verified the basic functionality works:

1. **Phase 2** will add the actual UI components (prompt builder, library, search)
2. **Phase 3** will implement the full P0 features from the PRD

For now, the foundation is complete and working! 🎉
