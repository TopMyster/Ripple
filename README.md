# Ripple
### Dynamic Island for All
##### Apple's Dynamic Island on your computer
https://github.com/user-attachments/assets/2a142434-0812-4e2f-adfd-3fed0500153a

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

## Distribution & GNOME Extension

Ripple is expanding to official package managers and the GNOME Shell!

### GNOME Extension (Linux)
The GNOME extension provides a native "Island" experience in the top bar.
- Located in: `gnome-extension/`
- To install locally: 
  1. `cp -r gnome-extension ~/.local/share/gnome-shell/extensions/ripple@topmyster.github.com`
  2. Restart GNOME Shell (`Alt+F2`, then type `r` and `Enter`, or logout/login on Wayland)
  3. Enable via GNOME Extensions app.

### Official Package Managers
We are preparing Ripple for the following platforms:

- **Flathub (Flatpak)**: Manifest available at `packaging/flatpak/com.github.topmyster.ripple.yaml`
- **Homebrew (macOS)**: Cask available at `packaging/brew/ripple.rb`
- **Chocolatey (Windows)**: Nuspec available at `packaging/chocolatey/ripple.nuspec`

Check the `packaging/` directory for integration details.
