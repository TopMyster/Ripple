# Ripple
### Dynamic Island for All
##### Apple's Dynamic Island on your computer
https://github.com/user-attachments/assets/2a142434-0812-4e2f-adfd-3fed0500153a

### <a href="https://discord.gg/a2xzVkxFVg">Join the Discord</a>

## Features
 - ✅ Now playing preview and controls<br>
 - ✅ Battery Alerts<br>
 - ✅ Island syncs accross desktops and monitors<br>
 - ✅ AI Ask feature<br>
 - ✅ Themes e.g. Win95, Sleek Black<br>
 - ✅ Shows the Weather<br>
 - ✅ Shows on all desktops<br>
 - ✅ Quick Apps<br>
 - ✅ Browser search<br>
 - ✅ Keyboard Shortcuts<br>
 - ✅ Clipboard<br>
 - ✅ Intructions<br>
 - ✅ Stealth Mode<br>
 - ✅ Charging Alert<br>
 - ✅ Standby Mode<br>
 - •Fix not working on Ubuntu (https://github.com/TopMyster/Ripple/issues/4)<br>
 - •Make windows build an installer<br>

<sup>✅ = done, - = Working on, • = Planned, * = Note to self</sup><br>
<a href="https://github.com/TopMyster/Ripple/blob/main/instructions.md">Further Instructions</a>

## Build Instructions

### Standard Build (Current OS)
```bash
npm run make
```

### Build for Specific Platforms

**Windows (x64)**
```bash
npm run make -- --platform=win32 --arch=x64
```

**Linux (x64)**
```bash
npm run make -- --platform=linux --arch=x64
```

**macOS (Apple Silicon & Intel)**
```bash
# Apple Silicon
npm run make -- --platform=darwin --arch=arm64

# Intel
npm run make -- --platform=darwin --arch=x64
```

Artifacts will be found in the `out/make` directory.
