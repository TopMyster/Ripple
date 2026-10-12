{
  "targets": [
    {
      "target_name": "mac_notch",
      "sources": ["mac_notch.mm"],
      "include_dirs": ["../../node_modules/node-addon-api"],
      "dependencies": ["<!(node -p \"require('node-addon-api').gyp\")"],
      "defines": ["NAPI_CPP_EXCEPTIONS", "NAPI_VERSION=8"],
      "cflags_cc": ["-std=c++17", "-fexceptions"],
      "xcode_settings": {
        "CLANG_CXX_LANGUAGE_STANDARD": "c++17",
        "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
        "MACOSX_DEPLOYMENT_TARGET": "12.0",
        "OTHER_LDFLAGS": ["-framework Cocoa"]
      }
    }
  ]
}