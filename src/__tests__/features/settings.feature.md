# Feature: Settings and Keyboard Shortcuts

## Background
As a user of Manza, I want to customize my keyboard shortcuts and application settings so that I can work more efficiently according to my preferences.

## Scenario 1: Default Settings Load on First Use
**Given** the application is launched for the first time
**When** the settings system initializes
**Then** default settings should be loaded
**And** default keyboard shortcuts should be configured (Mod+S for save, Mod+B for bold, etc.)
**And** auto-save should be enabled by default
**And** vim mode should be disabled by default

## Scenario 2: Settings Persist Across Sessions
**Given** the user has customized their settings
**When** the application is closed and reopened
**Then** the customized settings should be restored
**And** custom keyboard shortcuts should still work

## Scenario 3: Open Settings Modal
**Given** the application is running
**When** the user presses Mod+, (or clicks settings button)
**Then** the settings modal should open
**And** the current settings should be displayed

## Scenario 4: Change Keyboard Shortcut
**Given** the settings modal is open
**When** the user clicks on a keyboard shortcut field
**And** presses a new key combination
**Then** the new shortcut should be saved
**And** the old shortcut should be replaced
**And** the new shortcut should work immediately

## Scenario 5: Prevent Duplicate Shortcuts
**Given** the settings modal is open
**When** the user tries to assign a shortcut that's already in use
**Then** the system should warn the user about the conflict
**And** the shortcut should not be saved until resolved

## Scenario 6: Reset Shortcuts to Defaults
**Given** the user has customized keyboard shortcuts
**When** the user clicks "Reset to Defaults"
**Then** all shortcuts should revert to their default values
**And** a confirmation should be shown

## Scenario 7: Toggle Auto-save Setting
**Given** the settings modal is open
**When** the user toggles the auto-save option
**Then** the setting should be saved immediately
**And** the editor behavior should update accordingly

## Scenario 8: Toggle Vim Mode
**Given** the settings modal is open
**When** the user enables vim mode
**Then** the editor should switch to vim keybindings
**And** the setting should persist

## Scenario 9: Close Settings Modal
**Given** the settings modal is open
**When** the user presses Escape or clicks outside the modal
**Then** the modal should close
**And** all changes should be saved
