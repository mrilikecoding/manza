// Prevents additional console window on Windows in release builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use std::sync::Arc;

mod fs;
use fs::{
    create_directory, create_file, delete_directory, delete_file, read_directory, read_file,
    rename_path, write_file, FileItem,
};

mod watcher;
use watcher::DirectoryWatcher;

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

/// Tauri command to create a new file
#[tauri::command]
fn create_new_file(path: String) -> Result<(), String> {
    create_file(&path)
}

/// Tauri command to create a new directory
#[tauri::command]
fn create_new_directory(path: String) -> Result<(), String> {
    create_directory(&path)
}

/// Tauri command to delete a file
#[tauri::command]
fn delete_file_at_path(path: String) -> Result<(), String> {
    delete_file(&path)
}

/// Tauri command to delete a directory
#[tauri::command]
fn delete_directory_at_path(path: String) -> Result<(), String> {
    delete_directory(&path)
}

/// Tauri command to rename/move a file or directory
#[tauri::command]
fn rename_file_or_directory(old_path: String, new_path: String) -> Result<(), String> {
    rename_path(&old_path, &new_path)
}

/// Tauri command to start watching a directory for changes
#[tauri::command]
fn watch_directory(
    app_handle: tauri::AppHandle,
    watcher: tauri::State<Arc<DirectoryWatcher>>,
    path: String,
) -> Result<(), String> {
    watcher.watch_directory(app_handle, path)
}

/// Tauri command to stop watching the current directory
#[tauri::command]
fn stop_watching(watcher: tauri::State<Arc<DirectoryWatcher>>) -> Result<(), String> {
    watcher.stop_watching();
    Ok(())
}

fn main() {
    // Create the directory watcher
    let watcher = Arc::new(DirectoryWatcher::new());

    tauri::Builder::default()
        .manage(watcher)
        .invoke_handler(tauri::generate_handler![
            get_directory_contents,
            select_directory,
            read_file_contents,
            save_file_contents,
            create_new_file,
            create_new_directory,
            delete_file_at_path,
            delete_directory_at_path,
            rename_file_or_directory,
            watch_directory,
            stop_watching
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
