"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

if (process.platform !== "darwin") process.exit(0);

const root = path.join(__dirname, "..");
const addonPath = path.join(root, "native", "mac-notch");
const outputPath = path.join(addonPath, "prebuilds");
const nodeGypPath = require.resolve("node-gyp/bin/node-gyp.js", { paths: [root] });
const requestedArch = process.argv.find((arg) => arg.startsWith("--arch="))?.split("=")[1];
const architectures = requestedArch ? [requestedArch] : ["arm64", "x64"];

for (const arch of architectures) {
  const result = spawnSync(process.execPath, [nodeGypPath, "rebuild", `--arch=${arch}`], {
    cwd: addonPath,
    stdio: "inherit",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);

  fs.mkdirSync(outputPath, { recursive: true });
  fs.copyFileSync(
    path.join(addonPath, "build", "Release", "mac_notch.node"),
    path.join(outputPath, `mac_notch-${arch}.node`),
  );
}