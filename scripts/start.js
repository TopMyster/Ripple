"use strict";

const { spawn } = require("node:child_process");
const path = require("node:path");

const forgeCli = path.join(
  __dirname,
  "..",
  "node_modules",
  "@electron-forge",
  "cli",
  "dist",
  "electron-forge.js",
);
const electronArgs = process.argv.slice(2);

if (
  process.platform === "linux" &&
  (process.env.XDG_SESSION_TYPE === "wayland" || process.env.WAYLAND_DISPLAY)
) {
  electronArgs.unshift("--ozone-platform=x11");
}

const forgeArgs = ["start"];
if (electronArgs.length > 0) forgeArgs.push("--", ...electronArgs);

const forge = spawn(process.execPath, [forgeCli, ...forgeArgs], {
  env: process.env,
  stdio: "inherit",
});

forge.on("error", (error) => {
  console.error("Failed to start Electron Forge:", error);
  process.exitCode = 1;
});

forge.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
