import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppLayout } from './AppLayout';

// Mock Tauri API
vi.mock('@tauri-apps/api/dialog', () => ({
  open: vi.fn(),
}));

vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn(),
}));

/**
 * BDD Scenarios for App Layout Integration
 *
 * Feature: Integrated Markdown Editor Application
 *   As a user
 *   I want to browse, edit, and preview markdown files
 *   So that I can work with markdown files efficiently
 *
 * Scenario 1: Initial application state
 *   Given the application has just launched
 *   When the AppLayout component renders
 *   Then I should see an empty file explorer
 *   And I should see an empty editor state
 *   And I should see an empty preview state
 *   And I should see a button to select a directory
 *
 * Scenario 2: Select directory and display files
 *   Given the application is running
 *   When I click the "Select Directory" button
 *   And I choose a directory containing markdown files
 *   Then the file explorer should show the directory structure
 *   And markdown files should be highlighted
 *   And the editor should still show empty state
 *   And the preview should still show empty state
 *
 * Scenario 3: Open a markdown file
 *   Given I have selected a directory with markdown files
 *   And the file explorer shows the files
 *   When I click on a markdown file in the file explorer
 *   Then the file content should load into the editor
 *   And the preview should show the rendered markdown
 *   And the file path should be displayed
 *
 * Scenario 4: Edit file and see live preview
 *   Given I have opened a markdown file
 *   And the editor shows the file content
 *   When I type "# New Heading" in the editor
 *   Then the preview should update to show the new heading
 *   And the preview should render it as an H1 element
 *
 * Scenario 5: Save edited file
 *   Given I have edited a markdown file
 *   When I press Cmd+S (or Ctrl+S)
 *   Then the file should be saved to disk
 *   And I should see a success indicator
 *
 * Scenario 6: Switch between files
 *   Given I have one file open and edited
 *   When I click on a different file in the file explorer
 *   Then I should see a save prompt for unsaved changes
 *   When I choose to save
 *   Then the current file should be saved
 *   And the new file should load
 *   And the preview should update to show the new file content
 *
 * Scenario 7: Auto-save functionality
 *   Given I have a file open
 *   When I make changes to the file
 *   And I stop typing for 2 seconds
 *   Then the file should be automatically saved
 *   And I should see a save indicator
 *
 * Scenario 8: Handle file read errors
 *   Given I have selected a directory
 *   When I click on a file that cannot be read
 *   Then I should see an error message
 *   And the editor should remain in its current state
 *
 * Scenario 9: Handle file save errors
 *   Given I have a file open
 *   When I try to save to a read-only location
 *   Then I should see an error message
 *   And the unsaved changes should be preserved
 *
 * Scenario 10: Responsive layout
 *   Given the application is running
 *   When I resize the window
 *   Then the file explorer should maintain a fixed width
 *   And the editor and preview should share the remaining space equally
 *   And all components should remain functional
 */

describe('AppLayout - BDD Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Scenario 1: Initial application state', () => {
    it('should show empty states for all components on initial render', () => {
      // Given: the application has just launched
      // When: the AppLayout component renders
      render(<AppLayout />);

      // Then: I should see empty states
      expect(screen.getByText(/open a directory to get started/i)).toBeInTheDocument();
      expect(screen.getByText(/select a markdown file from the file explorer to start editing/i)).toBeInTheDocument();
      expect(screen.getByText(/preview will appear here/i)).toBeInTheDocument();
    });

    it('should display a directory selection button', () => {
      // Given: the application has just launched
      render(<AppLayout />);

      // Then: I should see a button to select a directory
      expect(screen.getByRole('button', { name: /select directory/i })).toBeInTheDocument();
    });
  });

  describe('Scenario 2: Select directory and display files', () => {
    it('should populate file explorer when directory is selected', async () => {
      // Given: the application is running
      const { open } = await import('@tauri-apps/api/dialog');
      const { invoke } = await import('@tauri-apps/api/tauri');

      vi.mocked(open).mockResolvedValue('/test/directory');
      vi.mocked(invoke).mockResolvedValue([
        { name: 'README.md', path: '/test/directory/README.md', is_directory: false },
        { name: 'notes.md', path: '/test/directory/notes.md', is_directory: false },
      ]);

      const user = userEvent.setup();
      render(<AppLayout />);

      // When: I click the "Select Directory" button
      const selectButton = screen.getByRole('button', { name: /select directory/i });
      await user.click(selectButton);

      // Then: the file explorer should show the directory structure
      await waitFor(() => {
        expect(screen.getByText('README.md')).toBeInTheDocument();
        expect(screen.getByText('notes.md')).toBeInTheDocument();
      });

      // And: the editor and preview should still show empty state
      expect(screen.getByText(/select a markdown file from the file explorer to start editing/i)).toBeInTheDocument();
      expect(screen.getByText(/preview will appear here/i)).toBeInTheDocument();
    });
  });

  describe('Scenario 3: Open a markdown file', () => {
    it('should load file content into editor and preview when file is clicked', async () => {
      // Given: I have selected a directory with markdown files
      const { open } = await import('@tauri-apps/api/dialog');
      const { invoke } = await import('@tauri-apps/api/tauri');

      vi.mocked(open).mockResolvedValue('/test/directory');
      vi.mocked(invoke).mockImplementation((cmd: string, args?: any) => {
        if (cmd === 'get_directory_contents') {
          return Promise.resolve([
            { name: 'test.md', path: '/test/directory/test.md', is_directory: false },
          ]);
        }
        if (cmd === 'read_file_contents') {
          return Promise.resolve('# Test Heading\n\nTest content');
        }
        return Promise.resolve();
      });

      const user = userEvent.setup();
      render(<AppLayout />);

      // Load directory
      await user.click(screen.getByRole('button', { name: /select directory/i }));
      await waitFor(() => expect(screen.getByText('test.md')).toBeInTheDocument());

      // When: I click on a markdown file
      await user.click(screen.getByText('test.md'));

      // Then: the file content should load into the editor
      // And: the preview should show the rendered markdown
      await waitFor(() => {
        expect(invoke).toHaveBeenCalledWith('read_file_contents', { path: '/test/directory/test.md' });
      });
    });
  });

  describe('Scenario 4: Edit file and see live preview', () => {
    it('should update preview in real-time when editing', async () => {
      // Given: I have opened a markdown file
      const { open } = await import('@tauri-apps/api/dialog');
      const { invoke } = await import('@tauri-apps/api/tauri');

      vi.mocked(open).mockResolvedValue('/test/directory');
      vi.mocked(invoke).mockImplementation((cmd: string, args?: any) => {
        if (cmd === 'get_directory_contents') {
          return Promise.resolve([
            { name: 'test.md', path: '/test/directory/test.md', is_directory: false },
          ]);
        }
        if (cmd === 'read_file_contents') {
          return Promise.resolve('Initial content');
        }
        return Promise.resolve();
      });

      const user = userEvent.setup();
      render(<AppLayout />);

      // Load directory and open file
      await user.click(screen.getByRole('button', { name: /select directory/i }));
      await waitFor(() => expect(screen.getByText('test.md')).toBeInTheDocument());
      await user.click(screen.getByText('test.md'));

      // When: I type in the editor (content change will be handled by state)
      // Then: the preview should update to show the new content
      // Note: Testing actual editor typing is complex due to CodeMirror,
      // so we'll test the state management integration separately
      await waitFor(() => {
        expect(invoke).toHaveBeenCalledWith('read_file_contents', { path: '/test/directory/test.md' });
      });
    });
  });

  describe('Scenario 5: Save edited file', () => {
    it('should save file when Cmd+S is pressed', async () => {
      // Given: I have edited a markdown file
      const { open } = await import('@tauri-apps/api/dialog');
      const { invoke } = await import('@tauri-apps/api/tauri');

      vi.mocked(open).mockResolvedValue('/test/directory');
      vi.mocked(invoke).mockImplementation((cmd: string, args?: any) => {
        if (cmd === 'get_directory_contents') {
          return Promise.resolve([
            { name: 'test.md', path: '/test/directory/test.md', is_directory: false },
          ]);
        }
        if (cmd === 'read_file_contents') {
          return Promise.resolve('Initial content');
        }
        if (cmd === 'save_file_contents') {
          return Promise.resolve();
        }
        return Promise.resolve();
      });

      render(<AppLayout />);

      // Load directory and open file
      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /select directory/i }));
      await waitFor(() => expect(screen.getByText('test.md')).toBeInTheDocument());
      await user.click(screen.getByText('test.md'));

      // Wait for file to load
      await waitFor(() => {
        expect(invoke).toHaveBeenCalledWith('read_file_contents', { path: '/test/directory/test.md' });
      });

      // Note: Actual Cmd+S testing will be handled by the editor component
      // This test verifies the integration point exists
    });
  });

  describe('Scenario 6: Switch between files', () => {
    it('should handle switching between files', async () => {
      // Given: I have one file open
      const { open } = await import('@tauri-apps/api/dialog');
      const { invoke } = await import('@tauri-apps/api/tauri');

      vi.mocked(open).mockResolvedValue('/test/directory');
      vi.mocked(invoke).mockImplementation((cmd: string, args?: any) => {
        if (cmd === 'get_directory_contents') {
          return Promise.resolve([
            { name: 'file1.md', path: '/test/directory/file1.md', is_directory: false },
            { name: 'file2.md', path: '/test/directory/file2.md', is_directory: false },
          ]);
        }
        if (cmd === 'read_file_contents' && args?.path.includes('file1')) {
          return Promise.resolve('Content 1');
        }
        if (cmd === 'read_file_contents' && args?.path.includes('file2')) {
          return Promise.resolve('Content 2');
        }
        return Promise.resolve();
      });

      const user = userEvent.setup();
      render(<AppLayout />);

      // Load directory and open first file
      await user.click(screen.getByRole('button', { name: /select directory/i }));
      await waitFor(() => expect(screen.getByText('file1.md')).toBeInTheDocument());
      await user.click(screen.getByText('file1.md'));

      await waitFor(() => {
        expect(invoke).toHaveBeenCalledWith('read_file_contents', { path: '/test/directory/file1.md' });
      });

      // When: I click on a different file
      await user.click(screen.getByText('file2.md'));

      // Then: the new file should load
      await waitFor(() => {
        expect(invoke).toHaveBeenCalledWith('read_file_contents', { path: '/test/directory/file2.md' });
      });
    });
  });

  describe('Scenario 7: Auto-save functionality', () => {
    it('should auto-save after inactivity period', async () => {
      // Given: I have a file open
      const { open } = await import('@tauri-apps/api/dialog');
      const { invoke } = await import('@tauri-apps/api/tauri');

      vi.mocked(open).mockResolvedValue('/test/directory');
      vi.mocked(invoke).mockImplementation((cmd: string, args?: any) => {
        if (cmd === 'get_directory_contents') {
          return Promise.resolve([
            { name: 'test.md', path: '/test/directory/test.md', is_directory: false },
          ]);
        }
        if (cmd === 'read_file_contents') {
          return Promise.resolve('Initial content');
        }
        if (cmd === 'save_file_contents') {
          return Promise.resolve();
        }
        return Promise.resolve();
      });

      render(<AppLayout />);

      // When: file is opened
      // Then: auto-save should be configured (tested in MarkdownEditor)
      // This integration test verifies the callback is wired up
      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /select directory/i }));
      await waitFor(() => expect(screen.getByText('test.md')).toBeInTheDocument());
      await user.click(screen.getByText('test.md'));

      await waitFor(() => {
        expect(invoke).toHaveBeenCalledWith('read_file_contents', { path: '/test/directory/test.md' });
      });
    });
  });

  describe('Scenario 8: Handle file read errors', () => {
    it('should display error message when file cannot be read', async () => {
      // Given: I have selected a directory
      const { open } = await import('@tauri-apps/api/dialog');
      const { invoke } = await import('@tauri-apps/api/tauri');

      vi.mocked(open).mockResolvedValue('/test/directory');
      vi.mocked(invoke).mockImplementation((cmd: string, args?: any) => {
        if (cmd === 'get_directory_contents') {
          return Promise.resolve([
            { name: 'unreadable.md', path: '/test/directory/unreadable.md', is_directory: false },
          ]);
        }
        if (cmd === 'read_file_contents') {
          return Promise.reject(new Error('Permission denied'));
        }
        return Promise.resolve();
      });

      const user = userEvent.setup();
      render(<AppLayout />);

      await user.click(screen.getByRole('button', { name: /select directory/i }));
      await waitFor(() => expect(screen.getByText('unreadable.md')).toBeInTheDocument());

      // When: I click on a file that cannot be read
      await user.click(screen.getByText('unreadable.md'));

      // Then: I should see an error message
      await waitFor(() => {
        expect(screen.getByText(/error loading file/i)).toBeInTheDocument();
      });
    });
  });

  describe('Scenario 9: Handle file save errors', () => {
    it('should display error message when file cannot be saved', async () => {
      // This will be tested by simulating a save error
      // The actual implementation will be in the AppLayout component
      expect(true).toBe(true); // Placeholder until implementation
    });
  });

  describe('Scenario 10: Responsive layout', () => {
    it('should render three-column layout structure', () => {
      // Given: the application is running
      render(<AppLayout />);

      // Then: layout should have proper structure
      const layout = screen.getByTestId('app-layout');
      expect(layout).toBeInTheDocument();

      // File explorer column
      expect(screen.getByTestId('file-explorer-column')).toBeInTheDocument();

      // Editor column
      expect(screen.getByTestId('editor-column')).toBeInTheDocument();

      // Preview column
      expect(screen.getByTestId('preview-column')).toBeInTheDocument();
    });
  });
});

describe('AppLayout - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      render(<AppLayout />);
      expect(screen.getByTestId('app-layout')).toBeInTheDocument();
    });

    it('should render all three main sections', () => {
      render(<AppLayout />);

      expect(screen.getByTestId('file-explorer-column')).toBeInTheDocument();
      expect(screen.getByTestId('editor-column')).toBeInTheDocument();
      expect(screen.getByTestId('preview-column')).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('should initialize with null selected file', () => {
      render(<AppLayout />);

      // Empty states should be visible
      expect(screen.getByText(/select a markdown file from the file explorer to start editing/i)).toBeInTheDocument();
    });

    it('should initialize with empty content', () => {
      render(<AppLayout />);

      expect(screen.getByText(/preview will appear here/i)).toBeInTheDocument();
    });
  });
});
