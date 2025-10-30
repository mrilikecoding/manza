import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileExplorer } from './FileExplorer';

/**
 * BDD Scenario: Directory Navigation (Up/Down and Breadcrumb)
 *
 * Feature: Navigate Directory Hierarchy
 *   As a user
 *   I want to navigate up to parent directories and down into subdirectories
 *   So that I can browse my entire project structure
 *
 * Scenario 1: Display breadcrumb showing current path
 *   Given I am viewing a directory
 *   When the FileExplorer renders
 *   Then I should see a breadcrumb showing the current path
 *   And each segment of the path should be clickable
 *
 * Scenario 2: Navigate up to parent directory
 *   Given I am viewing a subdirectory (not the root)
 *   When I click the "up" or parent navigation button
 *   Then the view should navigate to the parent directory
 *   And the file list should show the parent's contents
 *   And the breadcrumb should update to show the new path
 *
 * Scenario 3: Navigate into subdirectory
 *   Given I see a folder in the file list
 *   When I double-click the folder
 *   Then the view should navigate into that folder
 *   And the file list should show only that folder's contents
 *   And the breadcrumb should update to include the folder
 *
 * Scenario 4: Breadcrumb click navigation
 *   Given I am in a nested directory (e.g., /project/src/components)
 *   When I click on "src" in the breadcrumb
 *   Then the view should navigate to /project/src
 *   And the file list should show src's contents
 *
 * Scenario 5: Disable up button at root
 *   Given I am viewing the root directory
 *   When the FileExplorer renders
 *   Then the "up" button should be disabled
 *   And I should not be able to navigate higher
 *
 * Scenario 6: Show relative path in breadcrumb
 *   Given I have selected a root directory /Users/me/projects/manza
 *   And I navigate to /Users/me/projects/manza/src/components
 *   When I view the breadcrumb
 *   Then it should show: manza / src / components
 *   And not the full absolute path
 */

describe('FileExplorer - Directory Navigation (BDD)', () => {
  describe('Scenario 1: Display breadcrumb showing current path', () => {
    it('should show breadcrumb with current directory path', () => {
      // Given: I am viewing a directory
      const currentPath = '/Users/test/projects/manza';
      const mockFiles = [
        { name: 'src', path: '/Users/test/projects/manza/src', isDirectory: true },
        { name: 'README.md', path: '/Users/test/projects/manza/README.md', isDirectory: false },
      ];

      // When: the FileExplorer renders
      render(
        <FileExplorer
          rootPath={currentPath}
          files={mockFiles}
          onFileSelect={vi.fn()}
        />
      );

      // Then: I should see a breadcrumb showing the current path
      const breadcrumb = screen.getByTestId('breadcrumb');
      expect(breadcrumb).toBeInTheDocument();
      expect(breadcrumb).toHaveTextContent('manza');
    });

    it('should make breadcrumb segments clickable', () => {
      // Given: viewing a nested directory
      const currentPath = '/Users/test/projects/manza/src/components';
      const mockFiles = [
        { name: 'FileExplorer.tsx', path: '/Users/test/projects/manza/src/components/FileExplorer.tsx', isDirectory: false },
      ];

      render(
        <FileExplorer
          rootPath={currentPath}
          files={mockFiles}
          onFileSelect={vi.fn()}
        />
      );

      // Then: each segment should be clickable
      expect(screen.getByText('manza')).toBeInTheDocument();
      expect(screen.getByText('src')).toBeInTheDocument();
      expect(screen.getByText('components')).toBeInTheDocument();
    });
  });

  describe('Scenario 2: Navigate up to parent directory', () => {
    it('should show up button when not at root', () => {
      // Given: I am viewing a subdirectory
      const currentPath = '/Users/test/projects/manza/src';
      const mockFiles = [
        { name: 'components', path: '/Users/test/projects/manza/src/components', isDirectory: true },
      ];

      render(
        <FileExplorer
          rootPath={currentPath}
          files={mockFiles}
          onFileSelect={vi.fn()}
          isAtRoot={false}
        />
      );

      // Then: up button should be visible
      const upButton = screen.getByTestId('navigate-up-button');
      expect(upButton).toBeInTheDocument();
      expect(upButton).not.toBeDisabled();
    });

    it('should navigate to parent when up button clicked', async () => {
      // Given: viewing a subdirectory
      const currentPath = '/Users/test/projects/manza/src';
      const mockOnNavigateUp = vi.fn();
      const user = userEvent.setup();

      render(
        <FileExplorer
          rootPath={currentPath}
          files={[]}
          onFileSelect={vi.fn()}
          onNavigateUp={mockOnNavigateUp}
          isAtRoot={false}
        />
      );

      // When: I click the up button
      const upButton = screen.getByTestId('navigate-up-button');
      await user.click(upButton);

      // Then: should call navigate up handler
      expect(mockOnNavigateUp).toHaveBeenCalledTimes(1);
    });
  });

  describe('Scenario 3: Navigate into subdirectory', () => {
    it('should navigate into folder on double-click', async () => {
      // Given: I see a folder in the file list
      const mockFiles = [
        { name: 'src', path: '/test/src', isDirectory: true },
      ];
      const mockOnNavigateInto = vi.fn();
      const user = userEvent.setup();

      render(
        <FileExplorer
          rootPath="/test"
          files={mockFiles}
          onFileSelect={vi.fn()}
          onNavigateInto={mockOnNavigateInto}
        />
      );

      // When: I double-click the folder
      const folder = screen.getByTestId('file-item-src');
      await user.dblClick(folder);

      // Then: should navigate into that folder
      expect(mockOnNavigateInto).toHaveBeenCalledWith('/test/src');
    });

    it('should not navigate into files on double-click', async () => {
      // Given: I see a file (not a folder)
      const mockFiles = [
        { name: 'README.md', path: '/test/README.md', isDirectory: false },
      ];
      const mockOnNavigateInto = vi.fn();
      const user = userEvent.setup();

      render(
        <FileExplorer
          rootPath="/test"
          files={mockFiles}
          onFileSelect={vi.fn()}
          onNavigateInto={mockOnNavigateInto}
        />
      );

      // When: I double-click the file
      const file = screen.getByTestId('file-item-README.md');
      await user.dblClick(file);

      // Then: should NOT navigate (files don't navigate)
      expect(mockOnNavigateInto).not.toHaveBeenCalled();
    });
  });

  describe('Scenario 4: Breadcrumb click navigation', () => {
    it('should navigate when clicking breadcrumb segment', async () => {
      // Given: in a nested directory
      const currentPath = '/Users/test/projects/manza/src/components';
      const mockOnBreadcrumbClick = vi.fn();
      const user = userEvent.setup();

      render(
        <FileExplorer
          rootPath={currentPath}
          files={[]}
          onFileSelect={vi.fn()}
          onBreadcrumbClick={mockOnBreadcrumbClick}
        />
      );

      // When: I click on "src" in the breadcrumb
      const srcSegment = screen.getByText('src');
      await user.click(srcSegment);

      // Then: should navigate to that path
      expect(mockOnBreadcrumbClick).toHaveBeenCalledWith('/Users/test/projects/manza/src');
    });
  });

  describe('Scenario 5: Disable up button at root', () => {
    it('should disable up button when at root directory', () => {
      // Given: viewing the root directory (no parent available)
      const rootPath = '/Users/test/projects/manza';

      render(
        <FileExplorer
          rootPath={rootPath}
          files={[]}
          onFileSelect={vi.fn()}
          isAtRoot={true}
        />
      );

      // Then: up button should be disabled
      const upButton = screen.getByTestId('navigate-up-button');
      expect(upButton).toBeDisabled();
    });
  });

  describe('Scenario 6: Show relative path in breadcrumb', () => {
    it('should display relative path segments from root', () => {
      // Given: root is /Users/me/projects/manza
      // And: current path is /Users/me/projects/manza/src/components
      const currentPath = '/Users/me/projects/manza/src/components';

      render(
        <FileExplorer
          rootPath={currentPath}
          files={[]}
          onFileSelect={vi.fn()}
        />
      );

      // Then: breadcrumb should show relative path
      const breadcrumb = screen.getByTestId('breadcrumb');

      // Should show the directory name segments
      expect(breadcrumb).toHaveTextContent('manza');
      expect(breadcrumb).toHaveTextContent('src');
      expect(breadcrumb).toHaveTextContent('components');

      // Should NOT show /Users/me/projects in the breadcrumb
      expect(breadcrumb).not.toHaveTextContent('/Users/me/projects/manza');
    });
  });
});
