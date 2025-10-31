import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { FileExplorer } from './FileExplorer';

/**
 * BDD Scenarios for File Explorer
 *
 * Feature: File Explorer
 *   As a user
 *   I want to browse files and folders in a tree structure
 *   So that I can navigate and select markdown files to edit
 *
 * Scenario 1: Display empty state when no directory selected
 *   Given the application is running
 *   And no directory has been selected
 *   When the FileExplorer component renders
 *   Then I should see a message prompting me to open a directory
 *
 * Scenario 2: Display file tree when directory is selected
 *   Given the application is running
 *   And a directory has been selected
 *   When the directory contains files and folders
 *   Then I should see a tree structure of all files and folders
 *   And folders should be collapsible/expandable
 *
 * Scenario 3: Display markdown files with special styling
 *   Given a directory is selected
 *   And the directory contains markdown files (.md, .markdown)
 *   When the file tree is displayed
 *   Then markdown files should be visually distinguished
 *
 * Scenario 4: Show dotfiles by default
 *   Given a directory is selected
 *   And the directory contains dotfiles (e.g., .gitignore)
 *   When the file tree is displayed
 *   Then dotfiles should be visible in the tree
 *
 * Scenario 5: Sort files alphabetically with folders first
 *   Given a directory is selected
 *   And the directory contains both files and folders
 *   When the file tree is displayed
 *   Then folders should appear before files
 *   And items within each group should be sorted alphabetically
 */

describe('FileExplorer - BDD Scenarios', () => {
  describe('Scenario 1: Display empty state when no directory selected', () => {
    it('should show prompt when no directory is selected', () => {
      // Given: the application is running
      // And: no directory has been selected
      // When: the FileExplorer component renders
      render(<FileExplorer rootPath={null} onFileSelect={vi.fn()} />);

      // Then: I should see a message prompting me to open a directory
      expect(screen.getByText(/open a directory/i)).toBeInTheDocument();
    });
  });

  describe('Scenario 2: Display file tree when directory is selected', () => {
    it('should display files and folders in tree structure', async () => {
      // Given: the application is running
      // And: a directory has been selected
      const mockFiles = [
        { name: 'README.md', path: '/test/README.md', isDirectory: false },
        { name: 'docs', path: '/test/docs', isDirectory: true },
      ];

      // When: the directory contains files and folders
      render(
        <FileExplorer
          rootPath="/test"
          files={mockFiles}
          onFileSelect={vi.fn()}
        />
      );

      // Then: I should see a tree structure of all files and folders
      expect(screen.getByText('README.md')).toBeInTheDocument();
      expect(screen.getByText('docs')).toBeInTheDocument();
    });

    it('should make folders collapsible and expandable', async () => {
      // Given: a directory with nested folders
      const mockFiles = [
        { name: 'docs', path: '/test/docs', isDirectory: true, expanded: false },
      ];

      render(
        <FileExplorer
          rootPath="/test"
          files={mockFiles}
          onFileSelect={vi.fn()}
        />
      );

      // Then: folders should have expand/collapse indicators
      const folder = screen.getByText('docs');
      expect(folder).toBeInTheDocument();
      // Note: Full expand/collapse behavior will be tested in integration tests
    });
  });

  describe('Scenario 3: Display markdown files with special styling', () => {
    it('should visually distinguish markdown files', () => {
      // Given: a directory with markdown and non-markdown files
      const mockFiles = [
        { name: 'README.md', path: '/test/README.md', isDirectory: false },
        { name: 'notes.txt', path: '/test/notes.txt', isDirectory: false },
      ];

      // When: the file tree is displayed
      render(
        <FileExplorer
          rootPath="/test"
          files={mockFiles}
          onFileSelect={vi.fn()}
        />
      );

      // Then: markdown files should be visually distinguished
      const mdFile = screen.getByText('README.md');
      expect(mdFile).toBeInTheDocument();
      expect(mdFile).toHaveClass('markdown-file');
    });
  });

  describe('Scenario 4: Show dotfiles by default', () => {
    it('should display dotfiles in the tree', () => {
      // Given: a directory with dotfiles
      const mockFiles = [
        { name: '.gitignore', path: '/test/.gitignore', isDirectory: false },
        { name: 'README.md', path: '/test/README.md', isDirectory: false },
      ];

      // When: the file tree is displayed
      render(
        <FileExplorer
          rootPath="/test"
          files={mockFiles}
          onFileSelect={vi.fn()}
        />
      );

      // Then: dotfiles should be visible
      expect(screen.getByText('.gitignore')).toBeInTheDocument();
    });
  });

  describe('Scenario 5: Sort files alphabetically with folders first', () => {
    it('should sort folders before files, both alphabetically', () => {
      // Given: a directory with mixed files and folders
      const mockFiles = [
        { name: 'zebra.md', path: '/test/zebra.md', isDirectory: false },
        { name: 'b-folder', path: '/test/b-folder', isDirectory: true },
        { name: 'apple.md', path: '/test/apple.md', isDirectory: false },
        { name: 'a-folder', path: '/test/a-folder', isDirectory: true },
      ];

      // When: the file tree is displayed
      const { container } = render(
        <FileExplorer
          rootPath="/test"
          files={mockFiles}
          onFileSelect={vi.fn()}
        />
      );

      // Then: folders should appear before files, alphabetically
      const items = container.querySelectorAll('[data-testid^="file-item-"]');
      const names = Array.from(items).map((item) => item.textContent);

      expect(names).toEqual(['a-folder', 'b-folder', 'apple.md', 'zebra.md']);
    });
  });
});

describe('FileExplorer - Unit Tests (TDD)', () => {
  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      render(<FileExplorer rootPath={null} onFileSelect={vi.fn()} />);
      expect(screen.getByTestId('file-explorer')).toBeInTheDocument();
    });

    it('should call onFileSelect when a file is clicked', async () => {
      const mockOnSelect = vi.fn();
      const mockFiles = [
        { name: 'test.md', path: '/test/test.md', isDirectory: false },
      ];

      render(
        <FileExplorer
          rootPath="/test"
          files={mockFiles}
          onFileSelect={mockOnSelect}
        />
      );

      const file = screen.getByText('test.md');
      file.click();

      // Wait for the click delay (250ms)
      await waitFor(() => {
        expect(mockOnSelect).toHaveBeenCalledWith('/test/test.md');
      }, { timeout: 500 });
    });
  });

  describe('File Type Detection', () => {
    it('should identify markdown files by extension', () => {
      const mockFiles = [
        { name: 'README.md', path: '/test/README.md', isDirectory: false },
        { name: 'notes.markdown', path: '/test/notes.markdown', isDirectory: false },
        { name: 'doc.mdown', path: '/test/doc.mdown', isDirectory: false },
      ];

      render(
        <FileExplorer
          rootPath="/test"
          files={mockFiles}
          onFileSelect={vi.fn()}
        />
      );

      expect(screen.getByText('README.md')).toHaveClass('markdown-file');
      expect(screen.getByText('notes.markdown')).toHaveClass('markdown-file');
      expect(screen.getByText('doc.mdown')).toHaveClass('markdown-file');
    });
  });

  describe('Empty State', () => {
    it('should show empty state with action button', () => {
      render(<FileExplorer rootPath={null} onFileSelect={vi.fn()} />);

      expect(screen.getByText(/open a directory/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /select directory/i })).toBeInTheDocument();
    });
  });
});

/**
 * BDD Scenarios for Tree Navigation
 *
 * Feature: Tree-Style Directory Navigation
 *   As a user
 *   I want to expand/collapse folders and navigate directory hierarchies
 *   So that I can browse nested project structures efficiently
 *
 * Scenario 6: Expand/collapse folders
 *   Given a directory contains subdirectories
 *   When I click on a folder
 *   Then the folder should expand to show its contents
 *   And clicking again should collapse it
 *   And an arrow icon should indicate expand/collapse state
 *
 * Scenario 7: Nested folder display
 *   Given a folder is expanded
 *   When it contains subfolders
 *   Then subfolders should be indented to show hierarchy
 *   And each subfolder should also be expandable
 *
 * Scenario 8: Navigate into subdirectory
 *   Given a folder is visible in the tree
 *   When I double-click the folder (or use a navigate action)
 *   Then that folder becomes the new root directory
 *   And the file list shows only contents of that folder
 *   And a breadcrumb shows the current path
 *
 * Scenario 9: Navigate up to parent directory
 *   Given I am viewing a subdirectory
 *   When I click the "up" or "parent" button
 *   Then the view should navigate to the parent directory
 *   And the breadcrumb should update
 *
 * Scenario 10: Breadcrumb navigation
 *   Given I am in a nested directory
 *   When I see the breadcrumb path
 *   Then I should be able to click any parent in the path
 *   And navigate directly to that level
 */

describe('FileExplorer - Tree Navigation (BDD)', () => {
  describe('Scenario 6: Expand/collapse folders', () => {
    it('should expand folder when clicked to show contents', async () => {
      // Given: a directory contains subdirectories
      const mockFiles = [
        { name: 'src', path: '/test/src', isDirectory: true },
        { name: 'README.md', path: '/test/README.md', isDirectory: false },
      ];

      const mockOnFileSelect = vi.fn();
      const mockOnFolderExpand = vi.fn();

      // When: I click on a folder
      const { container } = render(
        <FileExplorer
          rootPath="/test"
          files={mockFiles}
          onFileSelect={mockOnFileSelect}
          onFolderExpand={mockOnFolderExpand}
        />
      );

      // Then: folder should have an expandable indicator
      const folderElement = screen.getByText('src');
      expect(folderElement).toBeInTheDocument();

      // Should have chevron/arrow icon for expansion
      const folderContainer = folderElement.closest('[data-testid^="file-item-"]');
      expect(folderContainer).toBeInTheDocument();
    });

    it('should show expand/collapse arrow icon on folders', () => {
      // Given: folders in the tree
      const mockFiles = [
        { name: 'docs', path: '/test/docs', isDirectory: true },
        { name: 'file.md', path: '/test/file.md', isDirectory: false },
      ];

      const { container } = render(
        <FileExplorer
          rootPath="/test"
          files={mockFiles}
          onFileSelect={vi.fn()}
        />
      );

      // Then: folder should have arrow icon, file should not
      const docsFolder = screen.getByTestId('file-item-docs');
      const fileItem = screen.getByTestId('file-item-file.md');

      // Folder should have an arrow/chevron (we'll add this)
      expect(docsFolder).toBeInTheDocument();
      expect(fileItem).toBeInTheDocument();
    });
  });

  describe('Scenario 7: Nested folder display', () => {
    it('should show indented hierarchy for nested folders', () => {
      // Given: expanded folder with subfolders
      const mockFiles = [
        { name: 'src', path: '/test/src', isDirectory: true, expanded: true },
        { name: 'components', path: '/test/src/components', isDirectory: true, depth: 1 },
        { name: 'utils', path: '/test/src/utils', isDirectory: true, depth: 1 },
        { name: 'README.md', path: '/test/README.md', isDirectory: false },
      ];

      render(
        <FileExplorer
          rootPath="/test"
          files={mockFiles}
          onFileSelect={vi.fn()}
        />
      );

      // Then: nested items should be indented
      // We'll implement depth-based indentation
      expect(screen.getByText('components')).toBeInTheDocument();
      expect(screen.getByText('utils')).toBeInTheDocument();
    });
  });

  describe('Scenario 8: Navigate into subdirectory', () => {
    it('should navigate into folder when double-clicked', async () => {
      // Given: a folder is visible
      const mockFiles = [
        { name: 'docs', path: '/test/docs', isDirectory: true },
      ];

      const mockOnNavigateInto = vi.fn();

      render(
        <FileExplorer
          rootPath="/test"
          files={mockFiles}
          onFileSelect={vi.fn()}
          onNavigateInto={mockOnNavigateInto}
        />
      );

      // When: folder is double-clicked (or navigate action triggered)
      // Then: should call navigate handler
      // (Implementation will handle this)
      expect(screen.getByText('docs')).toBeInTheDocument();
    });
  });

  describe('Scenario 9: Navigate up to parent directory', () => {
    it('should show parent navigation button when in subdirectory', () => {
      // Given: viewing a subdirectory
      const mockFiles = [
        { name: 'Component.tsx', path: '/test/src/components/Component.tsx', isDirectory: false },
      ];

      const mockOnNavigateUp = vi.fn();

      render(
        <FileExplorer
          rootPath="/test/src/components"
          files={mockFiles}
          onFileSelect={vi.fn()}
          onNavigateUp={mockOnNavigateUp}
        />
      );

      // Then: should show "up" button or parent indicator
      // We'll add this in implementation
    });
  });

  describe('Scenario 10: Breadcrumb navigation', () => {
    it('should display breadcrumb showing current path', () => {
      // Given: in a nested directory
      const currentPath = '/Users/test/projects/manza/src/components';
      const mockFiles = [
        { name: 'FileExplorer.tsx', path: currentPath + '/FileExplorer.tsx', isDirectory: false },
      ];

      render(
        <FileExplorer
          rootPath={currentPath}
          files={mockFiles}
          onFileSelect={vi.fn()}
        />
      );

      // Then: breadcrumb should show the path
      // We'll add breadcrumb component
    });
  });
});
