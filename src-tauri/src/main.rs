// Prevents additional console window on Windows in release builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

mod fs;
use fs::{read_directory, read_file, write_file, FileItem};

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

/// Tauri command to read file contents
#[tauri::command]
fn read_file_contents(path: String) -> Result<String, String> {
    read_file(&path)
}

/// Tauri command to write file contents
#[tauri::command]
fn save_file_contents(path: String, content: String) -> Result<(), String> {
    write_file(&path, &content)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_directory_contents,
            select_directory,
            read_file_contents,
            save_file_contents
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
