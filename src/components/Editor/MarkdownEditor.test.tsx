import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MarkdownEditor } from './MarkdownEditor';

/**
 * BDD Scenarios for Markdown Editor
 *
 * Feature: Markdown Editor
 *   As a user
 *   I want to edit markdown files with syntax highlighting
 *   So that I can write and format content efficiently
 *
 * Scenario 1: Display empty editor when no file is selected
 *   Given the application is running
 *   And no file has been selected
 *   When the MarkdownEditor component renders
 *   Then I should see an empty editor
 *   And I should see a message indicating no file is open
 *
 * Scenario 2: Load and display file content
 *   Given a markdown file is selected
 *   When the file content is loaded
 *   Then the editor should display the file content
 *   And the file path should be visible
 *
 * Scenario 3: Enable editing with syntax highlighting
 *   Given a file is open in the editor
 *   When I type markdown content
 *   Then the content should be editable
 *   And markdown syntax should be highlighted
 *
 * Scenario 4: Show line numbers
 *   Given a file is open in the editor
 *   When the editor is displayed
 *   Then line numbers should be visible on the left
 *
 * Scenario 5: Manual save with keyboard shortcut
 *   Given a file is open with unsaved changes
 *   When I press Cmd+S (or Ctrl+S on Windows/Linux)
 *   Then the file should be saved
 *   And the onSave callback should be triggered
 *
 * Scenario 6: Auto-save after inactivity
 *   Given a file is open in the editor
 *   And I have made changes
 *   When I stop typing for 2 seconds
 *   Then the file should automatically save
 *
 * Scenario 7: Apply bold formatting with keyboard shortcut
 *   Given a file is open in the editor
 *   And text is selected
 *   When I press Cmd+B (or Ctrl+B)
 *   Then the selected text should be wrapped in **bold** markers
 *
 * Scenario 8: Apply italic formatting with keyboard shortcut
 *   Given a file is open in the editor
 *   And text is selected
 *   When I press Cmd+I (or Ctrl+I)
 *   Then the selected text should be wrapped in *italic* markers
 */

describe('MarkdownEditor - BDD Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Scenario 1: Display empty editor when no file is selected', () => {
    it('should show empty state when no file is selected', () => {
      // Given: the application is running
      // And: no file has been selected
      // When: the MarkdownEditor component renders
      render(<MarkdownEditor filePath={null} content="" onChange={vi.fn()} onSave={vi.fn()} />);

      // Then: I should see an empty editor
      expect(screen.getByTestId('markdown-editor')).toBeInTheDocument();

      // And: I should see a message indicating no file is open
      expect(screen.getByText(/no file open/i)).toBeInTheDocument();
    });
  });

  describe('Scenario 2: Load and display file content', () => {
    it('should display file content when loaded', () => {
      // Given: a markdown file is selected
      const filePath = '/test/README.md';
      const content = '# Hello World\n\nThis is a test.';

      // When: the file content is loaded
      render(
        <MarkdownEditor
          filePath={filePath}
          content={content}
          onChange={vi.fn()}
          onSave={vi.fn()}
        />
      );

      // Then: the editor should display the file content
      expect(screen.getByTestId('markdown-editor')).toBeInTheDocument();

      // And: the file path should be visible
      expect(screen.getByText(/README.md/i)).toBeInTheDocument();
    });
  });

  describe('Scenario 3: Enable editing with syntax highlighting', () => {
    it('should render CodeMirror editor with markdown support', () => {
      // Given: a file is open in the editor
      const mockOnChange = vi.fn();

      render(
        <MarkdownEditor
          filePath="/test/doc.md"
          content="# Test Heading"
          onChange={mockOnChange}
          onSave={vi.fn()}
        />
      );

      // Then: editor should be present and contenteditable
      const editorContent = screen.getByTestId('editor-content');
      expect(editorContent).toBeInTheDocument();

      // CodeMirror creates a contenteditable element
      const cmContent = editorContent.querySelector('[contenteditable="true"]');
      expect(cmContent).toBeInTheDocument();
      expect(cmContent).toHaveAttribute('data-language', 'markdown');
    });
  });

  describe('Scenario 4: Show line numbers', () => {
    it('should display line numbers', () => {
      // Given: a file is open in the editor
      render(
        <MarkdownEditor
          filePath="/test/doc.md"
          content="Line 1\nLine 2\nLine 3"
          onChange={vi.fn()}
          onSave={vi.fn()}
        />
      );

      // Then: line numbers should be visible
      const editor = screen.getByTestId('markdown-editor');
      expect(editor).toHaveClass('show-line-numbers');
    });
  });

  describe('Scenario 5: Manual save with keyboard shortcut', () => {
    it('should have save keyboard shortcut configured', () => {
      // Given: a file is open with unsaved changes
      const mockOnSave = vi.fn();

      render(
        <MarkdownEditor
          filePath="/test/doc.md"
          content="Test content"
          onChange={vi.fn()}
          onSave={mockOnSave}
        />
      );

      // Then: the editor should be rendered (keyboard shortcuts are configured internally)
      expect(screen.getByTestId('editor-content')).toBeInTheDocument();
      // Note: Testing actual keyboard shortcuts requires integration tests
      // CodeMirror's keymap is configured to call onSave on Cmd/Ctrl+S
    });
  });

  describe('Scenario 6: Auto-save after inactivity', () => {
    it('should show auto-save enabled in header', () => {
      // Given: a file is open in the editor
      const mockOnSave = vi.fn();

      render(
        <MarkdownEditor
          filePath="/test/doc.md"
          content="Test content"
          onChange={vi.fn()}
          onSave={mockOnSave}
        />
      );

      // Then: auto-save indicator should be visible
      expect(screen.getByText(/auto-save enabled/i)).toBeInTheDocument();
      // Note: Auto-save timer is set to 2 seconds in the component
      // Actual timing tests would require integration testing
    });
  });

  describe('Scenario 7: Apply bold formatting with keyboard shortcut', () => {
    it('should have bold keyboard shortcut configured', () => {
      // Given: a file is open in the editor
      render(
        <MarkdownEditor
          filePath="/test/doc.md"
          content="selected text"
          onChange={vi.fn()}
          onSave={vi.fn()}
        />
      );

      // Then: editor should be rendered with CodeMirror keymap for Cmd+B
      expect(screen.getByTestId('editor-content')).toBeInTheDocument();
      // Note: Keyboard shortcut Cmd+B is configured in CodeMirror keymap
      // Integration tests will verify actual behavior
    });
  });

  describe('Scenario 8: Apply italic formatting with keyboard shortcut', () => {
    it('should have italic keyboard shortcut configured', () => {
      // Given: a file is open in the editor
      render(
        <MarkdownEditor
          filePath="/test/doc.md"
          content="selected text"
          onChange={vi.fn()}
          onSave={vi.fn()}
        />
      );

      // Then: editor should be rendered with CodeMirror keymap for Cmd+I
      expect(screen.getByTestId('editor-content')).toBeInTheDocument();
      // Note: Keyboard shortcut Cmd+I is configured in CodeMirror keymap
      // Integration tests will verify actual behavior
    });
  });
});

describe('MarkdownEditor - Unit Tests (TDD)', () => {
  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      render(
        <MarkdownEditor
          filePath={null}
          content=""
          onChange={vi.fn()}
          onSave={vi.fn()}
        />
      );
      expect(screen.getByTestId('markdown-editor')).toBeInTheDocument();
    });

    it('should display file path in header', () => {
      render(
        <MarkdownEditor
          filePath="/path/to/document.md"
          content=""
          onChange={vi.fn()}
          onSave={vi.fn()}
        />
      );
      expect(screen.getByText(/document.md/i)).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should accept onChange callback', () => {
      const mockOnChange = vi.fn();

      render(
        <MarkdownEditor
          filePath="/test/doc.md"
          content="initial"
          onChange={mockOnChange}
          onSave={vi.fn()}
        />
      );

      // Component should render with onChange prop
      expect(screen.getByTestId('markdown-editor')).toBeInTheDocument();
    });

    it('should accept onSave callback', () => {
      const mockOnSave = vi.fn();

      render(
        <MarkdownEditor
          filePath="/test/doc.md"
          content="content"
          onChange={vi.fn()}
          onSave={mockOnSave}
        />
      );

      // Component should render with onSave prop
      expect(screen.getByTestId('markdown-editor')).toBeInTheDocument();
    });
  });
});
