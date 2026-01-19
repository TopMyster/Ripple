#!/bin/bash
# Script to package the GNOME extension
mkdir -p build
cp gnome-extension/metadata.json build/
cp gnome-extension/extension.js build/
cp gnome-extension/stylesheet.css build/
cd build
zip -r ../ripple-extension.shell-extension.zip .
cd ..
rm -rf build
echo "Extension packaged as ripple-extension.shell-extension.zip"
