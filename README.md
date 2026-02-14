# Ripple
### Dynamic Island for All
##### Apple's Dynamic Island on your computer

https://github.com/user-attachments/assets/a7b9ed8a-97b5-4603-bad7-6f4c4bef1f5d

### <a href="https://discord.gg/a2xzVkxFVg">Join the Discord</a>

## Features
- ✅ Island syncs across desktops and monitors
- ✅ Bluetooth device connected alerts
- ✅ Now playing preview and controls 
- ✅ Themes (e.g. Win95, SleekBlack)
- ✅ Shows on all desktops    
- ✅ Keyboard shortcuts
- ✅ Shows the weather    
- ✅ Charging alerts
- ✅ AI Ask feature   
- ✅ Battery alerts
- ✅ Browser search
- ✅ Standby mode
- ✅ Stealth mode
- ✅ Quick apps
- ✅ Clipboard
- ✅ Tasks List


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
