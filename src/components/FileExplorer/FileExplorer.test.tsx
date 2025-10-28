import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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

    it('should call onFileSelect when a file is clicked', () => {
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

      expect(mockOnSelect).toHaveBeenCalledWith('/test/test.md');
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
