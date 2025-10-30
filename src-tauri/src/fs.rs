use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Write;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileItem {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    pub is_markdown: bool,
}

/// Read directory contents and return structured file items
pub fn read_directory(path: &str) -> Result<Vec<FileItem>, String> {
    let dir_path = PathBuf::from(path);

    if !dir_path.exists() {
        return Err(format!("Directory does not exist: {}", path));
    }

    if !dir_path.is_dir() {
        return Err(format!("Path is not a directory: {}", path));
    }

    let entries = fs::read_dir(&dir_path)
        .map_err(|e| format!("Failed to read directory: {}", e))?;

    let mut files: Vec<FileItem> = Vec::new();

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let entry_path = entry.path();
        let metadata = entry
            .metadata()
            .map_err(|e| format!("Failed to read metadata: {}", e))?;

        let name = entry
            .file_name()
            .to_string_lossy()
            .to_string();

        let path_str = entry_path
            .to_string_lossy()
            .to_string();

        let is_directory = metadata.is_dir();
        let is_markdown = !is_directory && is_markdown_file(&name);

        files.push(FileItem {
            name,
            path: path_str,
            is_directory,
            is_markdown,
        });
    }

    // Sort: directories first, then alphabetically
    files.sort_by(|a, b| {
        match (a.is_directory, b.is_directory) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });

    Ok(files)
}

/// Check if a file is a markdown file based on extension
fn is_markdown_file(filename: &str) -> bool {
    let lower = filename.to_lowercase();
    lower.ends_with(".md")
        || lower.ends_with(".markdown")
        || lower.ends_with(".mdown")
}

/// Read file contents as UTF-8 string
pub fn read_file(path: &str) -> Result<String, String> {
    fs::read_to_string(path).map_err(|e| format!("Failed to read file: {}", e))
}

/// Write content to file
pub fn write_file(path: &str, content: &str) -> Result<(), String> {
    let file_path = PathBuf::from(path);

    // Create parent directories if they don't exist
    if let Some(parent) = file_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create parent directories: {}", e))?;
    }

    let mut file = fs::File::create(&file_path)
        .map_err(|e| format!("Failed to create file: {}", e))?;

    file.write_all(content.as_bytes())
        .map_err(|e| format!("Failed to write to file: {}", e))?;

    Ok(())
}

/// Create a new file with empty content
pub fn create_file(path: &str) -> Result<(), String> {
    write_file(path, "")
}

/// Create a new directory
pub fn create_directory(path: &str) -> Result<(), String> {
    fs::create_dir_all(path)
        .map_err(|e| format!("Failed to create directory: {}", e))
}

/// Delete a file
pub fn delete_file(path: &str) -> Result<(), String> {
    let file_path = PathBuf::from(path);

    if !file_path.exists() {
        return Err(format!("File does not exist: {}", path));
    }

    if file_path.is_dir() {
        return Err(format!("Path is a directory, not a file: {}", path));
    }

    fs::remove_file(&file_path)
        .map_err(|e| format!("Failed to delete file: {}", e))
}

/// Delete a directory and all its contents
pub fn delete_directory(path: &str) -> Result<(), String> {
    let dir_path = PathBuf::from(path);

    if !dir_path.exists() {
        return Err(format!("Directory does not exist: {}", path));
    }

    if !dir_path.is_dir() {
        return Err(format!("Path is not a directory: {}", path));
    }

    fs::remove_dir_all(&dir_path)
        .map_err(|e| format!("Failed to delete directory: {}", e))
}

/// Rename/move a file or directory
pub fn rename_path(old_path: &str, new_path: &str) -> Result<(), String> {
    let old = PathBuf::from(old_path);
    let new = PathBuf::from(new_path);

    if !old.exists() {
        return Err(format!("Source path does not exist: {}", old_path));
    }

    if new.exists() {
        return Err(format!("Destination path already exists: {}", new_path));
    }

    fs::rename(&old, &new)
        .map_err(|e| format!("Failed to rename: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_markdown_file() {
        assert!(is_markdown_file("README.md"));
        assert!(is_markdown_file("notes.markdown"));
        assert!(is_markdown_file("doc.mdown"));
        assert!(is_markdown_file("FILE.MD")); // Case insensitive
        assert!(!is_markdown_file("notes.txt"));
        assert!(!is_markdown_file("image.png"));
    }
}
