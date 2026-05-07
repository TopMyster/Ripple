# Ripple

**Bring Apple's Dynamic Island to your computer** — the elegant notification and widget system that adapts to what you need, when you need it.

> **"Dynamic Island, but for everyone."**
>
> Ripple is a cross-platform desktop application that recreates Apple's Dynamic Island experience on Windows, Linux, and macOS. It's a highly customizable notification hub, widget system, and smart assistant that stays out of your way until you need it.

<div align="center">

[![Discord](https://img.shields.io/badge/Discord-Join%20Us-5865F2)](https://discord.gg/a2xzVkxFVg)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Version](https://img.shields.io/badge/Version-3.2.3-blue)](package.json)

https://github.com/user-attachments/assets/a7b9ed8a-97b5-4603-bad7-6f4c4bef1f5d

</div>

---

## Features

### Core Functionality
- **Multi-Monitor & Desktop Support** — Island syncs seamlessly across all desktops and monitors
- **Media Controls** — Now playing preview with playback controls for your music
- **Customizable Themes** — Multiple themes including Win95, SleekBlack, and more
- **Quick Apps** — One-click access to 4 apps of your choice
- **Keyboard Shortcuts** — Quick navigation with Ctrl + number shortcuts

### Information & Alerts
- **Weather Display** — Real-time weather information
- **Battery Alerts** — Charging status and low battery notifications
- **Bluetooth Alerts** — Get notified when devices connect/disconnect
- **Smart Notifications** — Contextual alerts that appear when you need them

### Smart Features
- **AI Ask Feature** — Integrated AI assistant powered by Groq
- **Browser Search** — Quick search integration
- **Clipboard Manager** — Access your clipboard history
- **Tasks List** — Built-in task management
- **Stealth Mode** — Complete transparency when idle
- **Standby Mode** — Always-visible quick info widget

### Interaction Modes
Ripple has multiple display modes that adapt to your needs:
- **Still Mode** — Minimalist idle state (170px)
- **Quick Mode** — Hover to see weather, time, battery, and music info
- **Large Mode** — Full interface with all tabs and features
- **Stealth Mode** — Invisible when inactive
- **Standby Mode** — Persistent quick info display


---

## Quick Start

### Installation

Download the latest release for your platform:
- **Windows**: `.exe` installer
- **macOS**: `.dmg` package (Intel & Apple Silicon supported)
- **Linux**: `.deb` or `.rpm` packages

[Download Latest Release](https://github.com/TopMyster/Ripple/releases)

### First Run
1. Install and launch Ripple
2. The Island will appear on your screen
3. **Click** the Island to open Large Mode
4. **Hover** over it to see Quick Mode
5. Visit **Settings** (last tab) to customize everything

---

## How to Use

### The Three Modes

**Still Mode** — The default idle state
- Compact 170px display
- Minimal visual footprint
- Ready to expand on interaction

**Quick Mode** — Hover over the Island
- See current time, weather, and battery status
- If music is playing, view now-playing info
- Hover playback controls for music

**Large Mode** — Click the Island
- Full interface with all tabs
- Switch tabs with arrow keys or mouse scroll
- Access all features and settings
- Default view for focused work

### Using Tabs
- **Arrow Keys** — Navigate between tabs
- **Mouse Wheel** — Scroll horizontally between tabs
- **Ctrl + Number** — Jump to a specific tab
- **Custom Apps Tab** — Quick access to 4 apps of your choice

### Optional Modes
- **Stealth Mode** — Island completely disappears when idle (Settings)
- **Standby Mode** — Always shows quick info instead of disappearing (Settings)

---

## Build & Development

### Prerequisites
- **Node.js** 16+ and npm
- Platform-specific build tools:
  - **Windows**: Visual Studio Build Tools
  - **macOS**: Xcode Command Line Tools
  - **Linux**: Build essentials (`build-essential` on Ubuntu/Debian)

### Development Setup

```bash
# Clone the repository
git clone https://github.com/TopMyster/Ripple.git
cd Ripple

# Install dependencies
npm install

# Start development server
npm start
```

The development server will launch Ripple with hot reload enabled. Press `Ctrl+R` (or `Cmd+R` on macOS) to refresh the app.

### Building for Production

#### Build for Current OS
```bash
npm run make
```

#### Build for Specific Platforms

**Windows (x64)**
```bash
npm run make -- --platform=win32 --arch=x64
```

**Linux (x64)**
```bash
npm run make -- --platform=linux --arch=x64
```

**macOS (Apple Silicon)**
```bash
npm run make -- --platform=darwin --arch=arm64
```

**macOS (Intel)**
```bash
npm run make -- --platform=darwin --arch=x64
```

> **Linux Note**: Building Linux packages requires `dpkg`, `fakeroot`, and `rpm`:
> ```bash
> sudo apt-get install dpkg fakeroot rpm
> ```

**Output**: Compiled binaries are found in `out/make/`

## Documentation

For more detailed information, see [instructions.md](instructions.md) which includes:
- Comprehensive mode explanations with screenshots
- Tab system overview
- Settings configuration
- Feature walkthroughs

---

## Contributing

We welcome contributions! Whether it's:
- Bug reports and fixes
- New features and improvements
- Documentation updates
- Theme designs
- Ideas and suggestions

Please check [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

Ripple is open source and available under the [MIT License](LICENSE).

---

## Support & Community

- **Discord**: [Join our Discord server](https://discord.gg/a2xzVkxFVg) for discussions, support, and updates
- **Issues**: Report bugs and request features on [GitHub Issues](https://github.com/TopMyster/Ripple/issues)
- **Author**: Created by [TopMyster](https://github.com/TopMyster)


