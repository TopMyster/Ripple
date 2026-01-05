const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const path = require('path');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    icon: 'src/assets/icons/icon',
    extendInfo: {
      NSAppleEventsUsageDescription: 'Ripple needs to control media players like Spotify and AppleMusic.',
    },
    // osxSign: {
    //   identity: '-',
    //   entitlements: path.resolve(__dirname, 'entitlements.plist'),
    //   'entitlements-inherit': path.resolve(__dirname, 'entitlements.plist'), // Good practice to have inheritance for child processes if needed, though often different.
    //   optionsForFile: (filePath) => {
    //     // This ensures child helpers also get signed/entitled if needed, though they usually use default entitlements.
    //     // For simplistic ad-hoc, maybe defaults are fine, but let's be explicit if needed.
    //     // Actually, let's keep it simple first.
    //     return {
    //       entitlements: path.resolve(__dirname, 'entitlements.plist'),
    //     };
    //   },
    // },
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
            // Sometimes deep signing fails on frameworks, retry specifically the top level? 
            // Or maybe just fail.
            throw e;
          }
        }
      }
    },
  },
  rebuildConfig: {},
  makers: [
    // {
    //   name: '@electron-forge/maker-squirrel',
    //   config: {},
    // },
    {
      name: '@electron-forge/maker-zip',
      // platforms: ['darwin'], 
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    // {
    //   name: '@electron-forge/maker-rpm',
    //   config: {},
    // },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
        // If you are familiar with Vite configuration, it will look really familiar.
        build: [
          {
            // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
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
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
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
