import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileExplorer } from './FileExplorer';

/**
 * BDD Scenario: Expand/Collapse Folders
 *
 * Feature: Expand/Collapse Folders in Tree View
 *   As a user
 *   I want to click on folders to expand and see their contents
 *   So that I can navigate nested directory structures
 *
 * Scenario 1: Folder starts collapsed
 *   Given a directory with subfolders
 *   When the FileExplorer renders
 *   Then folders should be collapsed by default
 *   And should show a chevron pointing right (►)
 *
 * Scenario 2: Expand folder on click
 *   Given a collapsed folder
 *   When I click on the folder
 *   Then the folder should expand
 *   And the chevron should rotate to point down (▼)
 *   And the folder's children should become visible
 *   And children should be indented
 *
 * Scenario 3: Collapse expanded folder
 *   Given an expanded folder
 *   When I click on the folder again
 *   Then the folder should collapse
 *   And the chevron should point right (►)
 *   And the children should be hidden
 *
 * Scenario 4: Load folder contents on first expand
 *   Given a folder that has never been expanded
 *   When I click to expand it
 *   Then it should call onFolderExpand with the folder path
 *   And display the returned children
 */

describe('FileExplorer - Expand/Collapse (BDD)', () => {
  describe('Scenario 1: Folder starts collapsed', () => {
    it('should show folders collapsed by default with right chevron', () => {
      // Given: a directory with subfolders
      const mockFiles = [
        { name: 'src', path: '/test/src', isDirectory: true },
        { name: 'README.md', path: '/test/README.md', isDirectory: false },
      ];

      // When: the FileExplorer renders
      render(
        <FileExplorer
          rootPath="/test"
          files={mockFiles}
          onFileSelect={vi.fn()}
        />
      );

      // Then: folders should be collapsed by default
      const srcFolder = screen.getByTestId('file-item-src');
      expect(srcFolder).toBeInTheDocument();

      // And: should show a chevron pointing right
      const chevron = srcFolder.querySelector('[data-testid="chevron-right"]');
      expect(chevron).toBeInTheDocument();
    });

    it('should not show chevron on files', () => {
      // Given: a file (not a folder)
      const mockFiles = [
        { name: 'README.md', path: '/test/README.md', isDirectory: false },
      ];

      render(
        <FileExplorer
          rootPath="/test"
          files={mockFiles}
          onFileSelect={vi.fn()}
        />
      );

      // Then: file should not have a chevron
      const fileItem = screen.getByTestId('file-item-README.md');
      const chevron = fileItem.querySelector('[data-testid^="chevron-"]');
      expect(chevron).not.toBeInTheDocument();
    });
  });

  describe('Scenario 2: Expand folder on click', () => {
    it('should expand folder and show children when clicked', async () => {
      // Given: a collapsed folder
      const mockFiles = [
        { name: 'src', path: '/test/src', isDirectory: true },
      ];

      const mockOnFolderExpand = vi.fn().mockResolvedValue([
        { name: 'components', path: '/test/src/components', isDirectory: true },
        { name: 'utils', path: '/test/src/utils', isDirectory: true },
        { name: 'index.ts', path: '/test/src/index.ts', isDirectory: false },
      ]);

      const user = userEvent.setup();

      render(
        <FileExplorer
          rootPath="/test"
          files={mockFiles}
          onFileSelect={vi.fn()}
          onFolderExpand={mockOnFolderExpand}
        />
      );

      // When: I click on the folder
      const srcFolder = screen.getByTestId('file-item-src');
      await user.click(srcFolder);

      // Then: the folder should expand
      await waitFor(() => {
        expect(mockOnFolderExpand).toHaveBeenCalledWith('/test/src');
      });

      // And: the chevron should point down
      await waitFor(() => {
        const chevronDown = srcFolder.querySelector('[data-testid="chevron-down"]');
        expect(chevronDown).toBeInTheDocument();
      });

      // And: children should be visible
      await waitFor(() => {
        expect(screen.getByText('components')).toBeInTheDocument();
        expect(screen.getByText('utils')).toBeInTheDocument();
        expect(screen.getByText('index.ts')).toBeInTheDocument();
      });
    });

    it('should indent children to show hierarchy', async () => {
      // Given: a folder with children
      const mockFiles = [
        { name: 'src', path: '/test/src', isDirectory: true },
      ];

      const mockOnFolderExpand = vi.fn().mockResolvedValue([
        { name: 'components', path: '/test/src/components', isDirectory: true },
      ]);

      const user = userEvent.setup();

      render(
        <FileExplorer
          rootPath="/test"
          files={mockFiles}
          onFileSelect={vi.fn()}
          onFolderExpand={mockOnFolderExpand}
        />
      );

      // When: folder is expanded
      await user.click(screen.getByTestId('file-item-src'));

      // Then: children should be indented
      await waitFor(() => {
        const childItem = screen.getByTestId('file-item-components');
        const styles = window.getComputedStyle(childItem);
        // Should have padding-left or margin-left for indentation
        expect(childItem).toHaveStyle({ paddingLeft: expect.stringMatching(/\d+px/) });
      });
    });
  });

  describe('Scenario 3: Collapse expanded folder', () => {
    it('should collapse folder and hide children when clicked again', async () => {
      // Given: an expanded folder
      const mockFiles = [
        {
          name: 'src',
          path: '/test/src',
          isDirectory: true,
          expanded: true,
          children: [
            { name: 'components', path: '/test/src/components', isDirectory: true },
          ],
        },
      ];

      const user = userEvent.setup();

      render(
        <FileExplorer
          rootPath="/test"
          files={mockFiles}
          onFileSelect={vi.fn()}
        />
      );

      // Verify it's expanded initially
      expect(screen.getByText('components')).toBeInTheDocument();

      // When: I click the folder again
      const srcFolder = screen.getByTestId('file-item-src');
      await user.click(srcFolder);

      // Then: children should be hidden
      await waitFor(() => {
        expect(screen.queryByText('components')).not.toBeInTheDocument();
      });

      // And: chevron should point right
      const chevronRight = srcFolder.querySelector('[data-testid="chevron-right"]');
      expect(chevronRight).toBeInTheDocument();
    });
  });

  describe('Scenario 4: Load folder contents on first expand', () => {
    it('should only call onFolderExpand once per folder', async () => {
      // Given: a folder that has never been expanded
      const mockFiles = [
        { name: 'src', path: '/test/src', isDirectory: true },
      ];

      const mockOnFolderExpand = vi.fn().mockResolvedValue([
        { name: 'index.ts', path: '/test/src/index.ts', isDirectory: false },
      ]);

      const user = userEvent.setup();

      render(
        <FileExplorer
          rootPath="/test"
          files={mockFiles}
          onFileSelect={vi.fn()}
          onFolderExpand={mockOnFolderExpand}
        />
      );

      const srcFolder = screen.getByTestId('file-item-src');

      // When: I expand, collapse, and expand again
      await user.click(srcFolder); // Expand
      await waitFor(() => expect(mockOnFolderExpand).toHaveBeenCalledTimes(1));

      await user.click(srcFolder); // Collapse
      await user.click(srcFolder); // Expand again

      // Then: should only call onFolderExpand once (caches children)
      expect(mockOnFolderExpand).toHaveBeenCalledTimes(1);
    });
  });
});
