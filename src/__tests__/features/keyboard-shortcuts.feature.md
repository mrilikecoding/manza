# Feature: Keyboard Shortcuts System

## Background
The application provides a keyboard shortcut system that allows users to perform common actions using keyboard combinations. The shortcuts are configurable through the settings and work across different operating systems (using "Mod" key that maps to Cmd on macOS and Ctrl on Windows/Linux).

---

## Scenario 1: Save File with Keyboard Shortcut
**Given** the user has an open file with unsaved changes
**When** the user presses the save shortcut (default: `Mod+s`)
**Then** the file should be saved
**And** the save action should be triggered

---

## Scenario 2: Open Settings with Keyboard Shortcut
**Given** the user is viewing the application
**When** the user presses the open settings shortcut (default: `Mod+,`)
**Then** the settings modal should open
**And** display the settings options

---

## Scenario 3: Toggle Preview with Keyboard Shortcut
**Given** the preview pane is visible
**When** the user presses the toggle preview shortcut (default: `Mod+p`)
**Then** the preview pane should be hidden

**Given** the preview pane is hidden
**When** the user presses the toggle preview shortcut again
**Then** the preview pane should be shown

---

## Scenario 4: Toggle Editor with Keyboard Shortcut
**Given** the editor pane is visible
**When** the user presses the toggle editor shortcut (default: `Mod+e`)
**Then** the editor pane should be hidden

**Given** the editor pane is hidden
**When** the user presses the toggle editor shortcut again
**Then** the editor pane should be shown

---

## Scenario 5: Create New File with Keyboard Shortcut
**Given** the user has a directory open
**When** the user presses the new file shortcut (default: `Mod+n`)
**Then** the create file dialog should open
**And** the user can enter a new file name

---

## Scenario 6: Create New Folder with Keyboard Shortcut
**Given** the user has a directory open
**When** the user presses the new folder shortcut (default: `Mod+Shift+n`)
**Then** the create folder dialog should open
**And** the user can enter a new folder name

---

## Scenario 7: Keyboard Shortcuts Respect Custom Mappings
**Given** the user has changed the save shortcut from `Mod+s` to `Mod+Shift+s`
**When** the user presses `Mod+Shift+s`
**Then** the file should be saved

**When** the user presses the old shortcut `Mod+s`
**Then** no save action should occur

---

## Scenario 8: Keyboard Shortcuts Don't Fire in Input Fields
**Given** the user is typing in a text input or textarea
**When** the user presses a shortcut key combination
**Then** the shortcut should not trigger
**And** the text input should receive the keypress normally

---

## Scenario 9: Prevent Default Browser Behavior
**Given** the user is viewing the application
**When** the user presses a registered shortcut (e.g., `Mod+s`)
**Then** the default browser behavior should be prevented
**And** only the application's custom action should execute

---

## Scenario 10: Multiple Shortcuts Work Together
**Given** the user has the application open
**When** the user presses `Mod+n` to create a file
**Then** the create file dialog opens

**When** the user presses `Escape` to close the dialog
**And** then presses `Mod+,` to open settings
**Then** the settings modal should open
**And** all shortcuts should work independently without conflicts

---

## Implementation Notes

### Technical Requirements:
1. **Hook-based architecture**: Create a `useKeyboardShortcuts` hook that can be used in components
2. **Event listener management**: Properly add/remove keyboard event listeners
3. **Key combination parsing**: Support "Mod" key that adapts to OS (Cmd/Ctrl)
4. **Input field detection**: Don't trigger shortcuts when user is typing in inputs/textareas
5. **preventDefault**: Prevent default browser actions for registered shortcuts
6. **Dynamic shortcut mapping**: Use shortcuts from SettingsContext so changes apply immediately
7. **Memory management**: Clean up event listeners on unmount

### Shortcut Actions to Implement:
- `save`: Trigger file save
- `bold`: Insert bold markdown (future - not in scope yet)
- `italic`: Insert italic markdown (future - not in scope yet)
- `openSettings`: Open settings modal
- `togglePreview`: Toggle preview pane visibility
- `toggleEditor`: Toggle editor pane visibility
- `newFile`: Open create file dialog
- `newFolder`: Open create folder dialog
