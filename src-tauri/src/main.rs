// Prevents additional console window on Windows in release builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

mod fs;
use fs::{read_directory, FileItem};

/// Tauri command to read directory contents
#[tauri::command]
fn get_directory_contents(path: String) -> Result<Vec<FileItem>, String> {
    read_directory(&path)
}

/// Tauri command to open a directory dialog and return selected path
#[tauri::command]
async fn select_directory() -> Result<Option<String>, String> {
    use tauri::api::dialog::blocking::FileDialogBuilder;

    let result = FileDialogBuilder::new()
        .pick_folder();

    Ok(result.map(|path| path.to_string_lossy().to_string()))
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_directory_contents,
            select_directory
        ])
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
