#include <napi.h>
#import <Cocoa/Cocoa.h>
#import <objc/runtime.h>

static NSWindow* notchWindow = nil;
static Method constrainFrameMethod = nil;
static IMP originalConstrainFrame = nullptr;

static NSRect ConstrainFrameForNotch(NSWindow* window, SEL selector, NSRect frame, NSScreen* screen) {
  if (window == notchWindow) return frame;
  using OriginalMethod = NSRect (*)(id, SEL, NSRect, NSScreen*);
  return reinterpret_cast<OriginalMethod>(originalConstrainFrame)(window, selector, frame, screen);
}

Napi::Value SetWindowTopEdge(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (info.Length() < 2 || !info[0].IsBuffer() || !info[1].IsBoolean()) {
    Napi::TypeError::New(env, "Expected a native window handle and enabled flag").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  Napi::Buffer<uint8_t> handle = info[0].As<Napi::Buffer<uint8_t>>();
  if (handle.Length() < sizeof(void*)) {
    Napi::TypeError::New(env, "Native window handle is too small").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  NSView* view = *reinterpret_cast<NSView**>(handle.Data());
  NSWindow* window = view.window;
  if (window == nil) {
    Napi::Error::New(env, "Native view is not attached to a window").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  if (!info[1].As<Napi::Boolean>().Value()) {
    if (window == notchWindow && constrainFrameMethod != nil) {
      method_setImplementation(constrainFrameMethod, originalConstrainFrame);
      notchWindow = nil;
      constrainFrameMethod = nil;
      originalConstrainFrame = nullptr;
    }
    return Napi::Number::New(env, 0);
  }

  NSScreen* screen = window.screen ?: NSScreen.mainScreen;
  if (screen == nil) {
    Napi::Error::New(env, "No screen is available for the native window").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  if (window != notchWindow) {
    SEL selector = @selector(constrainFrameRect:toScreen:);
    constrainFrameMethod = class_getInstanceMethod(object_getClass(window), selector);
    if (constrainFrameMethod == nil) {
      Napi::Error::New(env, "NSWindow frame constraint method is unavailable").ThrowAsJavaScriptException();
      return env.Undefined();
    }
    originalConstrainFrame = method_getImplementation(constrainFrameMethod);
    method_setImplementation(constrainFrameMethod, reinterpret_cast<IMP>(ConstrainFrameForNotch));
    notchWindow = window;
  }

  NSRect frame = window.frame;
  NSRect screenFrame = screen.frame;
  frame.origin.x = NSMinX(screenFrame);
  frame.origin.y = NSMaxY(screenFrame) - NSHeight(frame);
  [window setFrame:frame display:YES animate:NO];

  NSRect actualFrame = window.frame;
  return Napi::Number::New(env, NSMaxY(screenFrame) - NSMaxY(actualFrame));
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("setWindowTopEdge", Napi::Function::New(env, SetWindowTopEdge));
  return exports;
}

NODE_API_MODULE(mac_notch, Init)