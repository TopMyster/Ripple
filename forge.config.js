const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const path = require('path');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    executableName: 'ripple',
    icon: 'src/assets/icons/icon',
    extraResource: [
      path.join(__dirname, 'src/assets/icons/icon.png'),
    ],
    ...(process.platform === 'darwin' ? {
      extendInfo: {
        NSAppleEventsUsageDescription: 'Ripple needs to control media players like Spotify and AppleMusic.',
      },
    } : {}),
  },
  hooks: {
    postPackage: async (forgeConfig, options) => {
      if (options.platform !== 'darwin') return;
      console.log('Signing application with entitlements...');
      const { execSync } = require('child_process');
      const fs = require('fs');
      const path = require('path');

      for (const outPath of options.outputPaths) {
        const files = fs.readdirSync(outPath);
        const appFile = files.find(f => f.endsWith('.app'));
        if (appFile) {
          const appPath = path.join(outPath, appFile);
          console.log(`Waiting for file lock release...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          console.log(`Signing ${appPath}...`);
          try {
            execSync(`codesign --deep --force --verbose -s - --entitlements "${path.resolve(__dirname, 'entitlements.plist')}" "${appPath}"`);
            console.log('Signed successfully.');
          } catch (e) {
            console.error('Sign failed, retrying without deep...');
            throw e;
          }
        }
      }
    },
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-wix',
      config: {
        language: 1033,
        manufacturer: 'TopMyster',
        description: 'A Dynamic Island for All',
        name: 'Ripple',
        shortcutFolderName: 'Ripple',
        programFilesFolderName: 'Ripple',
        ui: {
          chooseDirectory: true,
        },
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        name: 'Ripple',
        format: 'UDZO',
        overwrite: true
      }
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          icon: path.join(__dirname, 'src/assets/icons/icon.png'),
          executableName: 'ripple',
          name: 'ripple',
        }
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          icon: path.join(__dirname, 'src/assets/icons/icon.png'),
          name: 'ripple',
        }
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        build: [
          {
            entry: 'src/main.js',
            config: 'vite.main.config.mjs',
            target: 'main',
          },
          {
            entry: 'src/preload.js',
            config: 'vite.preload.config.mjs',
            target: 'preload',
          },
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.renderer.config.mjs',
          },
        ],
      },
    },
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },

    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: false,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
