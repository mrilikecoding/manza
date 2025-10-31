use notify::{RecommendedWatcher, RecursiveMode, Watcher as NotifyWatcher};
use notify_debouncer_full::{new_debouncer, DebounceEventResult, Debouncer, FileIdMap};
use std::path::PathBuf;
use std::sync::mpsc::channel;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{AppHandle, Manager};

pub struct DirectoryWatcher {
    debouncer: Arc<Mutex<Option<Debouncer<RecommendedWatcher, FileIdMap>>>>,
    watched_path: Arc<Mutex<Option<PathBuf>>>,
}

impl DirectoryWatcher {
    pub fn new() -> Self {
        Self {
            debouncer: Arc::new(Mutex::new(None)),
            watched_path: Arc::new(Mutex::new(None)),
        }
    }

    pub fn watch_directory(&self, app_handle: AppHandle, path: String) -> Result<(), String> {
        let path_buf = PathBuf::from(&path);

        // Stop existing watcher if any
        self.stop_watching();

        // Store the new watched path
        *self.watched_path.lock().unwrap() = Some(path_buf.clone());

        // Create channel for events
        let (tx, rx) = channel();

        // Create debouncer with 500ms delay
        let mut debouncer = new_debouncer(
            Duration::from_millis(500),
            None,
            move |result: DebounceEventResult| {
                match result {
                    Ok(events) => {
                        // Send events through channel
                        for event in events {
                            let _ = tx.send(event);
                        }
                    }
                    Err(errors) => {
                        eprintln!("File watcher errors: {:?}", errors);
                    }
                }
            },
        )
        .map_err(|e| format!("Failed to create file watcher: {}", e))?;

        // Add path to watcher
        debouncer
            .watcher()
            .watch(&path_buf, RecursiveMode::Recursive)
            .map_err(|e| format!("Failed to watch directory: {}", e))?;

        // Store debouncer
        *self.debouncer.lock().unwrap() = Some(debouncer);

        // Spawn thread to handle events
        let app_handle_clone = app_handle.clone();
        std::thread::spawn(move || {
            while let Ok(event) = rx.recv() {
                // Emit event to frontend
                let event_data = serde_json::json!({
                    "kind": format!("{:?}", event.kind),
                    "paths": event.paths.iter().map(|p| p.to_string_lossy().to_string()).collect::<Vec<_>>(),
                });

                let _ = app_handle_clone.emit_all("file-change", event_data);
            }
        });

        Ok(())
    }

    pub fn stop_watching(&self) {
        *self.debouncer.lock().unwrap() = None;
        *self.watched_path.lock().unwrap() = None;
    }
}
