use tauri::{Manager, PhysicalPosition};
#[cfg(not(target_os = "macos"))]
use tauri::LogicalPosition;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn position_window_at_top(window: &tauri::WebviewWindow) {
    if let Ok(Some(monitor)) = window.current_monitor() {
        let screen_size = monitor.size();
        let screen_width = screen_size.width as f64;
        
        // Get window size
        if let Ok(window_size) = window.outer_size() {
            let window_width = window_size.width as f64;
            
            // Calculate x position to center horizontally
            let x = (screen_width / 2.0) - (window_width / 2.0);
            
            // Position at the very top (y = 0)
            // Use LogicalPosition for consistent behavior across platforms
            let _y = 0.0;
            
            #[cfg(target_os = "macos")]
            {
                // On macOS, use PhysicalPosition for absolute screen coordinates
                let monitor_position = monitor.position();
                let abs_x = monitor_position.x as f64 + x;
                
                // Position at the very top of the screen
                let abs_y = monitor_position.y as f64;
                
                let _ = window.set_position(PhysicalPosition::new(
                    abs_x as i32,
                    abs_y as i32,
                ));
            }
            
            #[cfg(not(target_os = "macos"))]
            {
                // For Windows and Linux, use LogicalPosition
                let _ = window.set_position(LogicalPosition::new(x, _y));
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .setup(|app| {
            #[cfg(target_os = "macos")]
            {
                use tauri::ActivationPolicy;
                // Set activation policy to Accessory to appear above menu bar
                app.set_activation_policy(ActivationPolicy::Accessory);
            }
            
            let app_handle = app.handle().clone();
            
            // Try positioning multiple times to ensure it works
            std::thread::spawn(move || {
                // First attempt after short delay
                std::thread::sleep(std::time::Duration::from_millis(100));
                if let Some(window) = app_handle.get_webview_window("main") {
                    position_window_at_top(&window);
                }
                
                // Second attempt after longer delay
                std::thread::sleep(std::time::Duration::from_millis(200));
                if let Some(window) = app_handle.get_webview_window("main") {
                    position_window_at_top(&window);
                }
                
                // Third attempt
                std::thread::sleep(std::time::Duration::from_millis(300));
                if let Some(window) = app_handle.get_webview_window("main") {
                    position_window_at_top(&window);
                }
                
                // Final attempt after window is fully shown
                std::thread::sleep(std::time::Duration::from_millis(500));
                if let Some(window) = app_handle.get_webview_window("main") {
                    position_window_at_top(&window);
                }
            });
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
