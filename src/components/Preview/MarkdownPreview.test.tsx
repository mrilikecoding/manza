import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MarkdownPreview } from './MarkdownPreview';

/**
 * BDD Scenarios for Markdown Preview
 *
 * Feature: Markdown Preview
 *   As a user
 *   I want to see a live preview of my markdown content
 *   So that I can see how it will be rendered with GitHub-style formatting
 *
 * Scenario 1: Display empty state when no content
 *   Given the preview pane is visible
 *   And no markdown content is provided
 *   When the MarkdownPreview component renders
 *   Then I should see a placeholder message
 *
 * Scenario 2: Render basic markdown elements
 *   Given the preview pane is visible
 *   And markdown content is provided
 *   When the content contains headings, paragraphs, and lists
 *   Then the content should be rendered as HTML
 *   And headings should be properly styled
 *
 * Scenario 3: Render GitHub Flavored Markdown (GFM)
 *   Given the preview pane is visible
 *   And content contains GFM features
 *   When the content has tables, strikethrough, or task lists
 *   Then these features should be rendered correctly
 *
 * Scenario 4: Apply GitHub-style CSS
 *   Given the preview pane is visible
 *   And markdown is being rendered
 *   When the preview displays
 *   Then it should use GitHub's styling for readability
 *
 * Scenario 5: Update preview when content changes
 *   Given the preview is displaying content
 *   When the markdown content changes
 *   Then the preview should update immediately
 *
 * Scenario 6: Sanitize HTML to prevent XSS
 *   Given the preview pane is visible
 *   And content contains potentially dangerous HTML
 *   When the preview renders
 *   Then script tags and dangerous attributes should be removed
 */

describe('MarkdownPreview - BDD Scenarios', () => {
  describe('Scenario 1: Display empty state when no content', () => {
    it('should show placeholder when content is empty', () => {
      // Given: the preview pane is visible
      // And: no markdown content is provided
      // When: the MarkdownPreview component renders
      render(<MarkdownPreview content="" />);

      // Then: I should see a placeholder message
      expect(screen.getByText(/preview will appear here/i)).toBeInTheDocument();
    });
  });

  describe('Scenario 2: Render basic markdown elements', () => {
    it('should render headings', () => {
      // Given: markdown content with headings
      const content = '# Heading 1\n## Heading 2\n### Heading 3';

      // When: the preview renders
      const { container } = render(<MarkdownPreview content={content} />);

      // Then: headings should be rendered
      expect(container.querySelector('h1')).toHaveTextContent('Heading 1');
      expect(container.querySelector('h2')).toHaveTextContent('Heading 2');
      expect(container.querySelector('h3')).toHaveTextContent('Heading 3');
    });

    it('should render paragraphs', () => {
      // Given: markdown content with paragraphs
      const content = 'This is a paragraph.\n\nThis is another paragraph.';

      // When: the preview renders
      const { container } = render(<MarkdownPreview content={content} />);

      // Then: paragraphs should be rendered
      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs).toHaveLength(2);
    });

    it('should render lists', () => {
      // Given: markdown content with lists
      const content = '- Item 1\n- Item 2\n- Item 3';

      // When: the preview renders
      const { container } = render(<MarkdownPreview content={content} />);

      // Then: list should be rendered
      expect(container.querySelector('ul')).toBeInTheDocument();
      const items = container.querySelectorAll('li');
      expect(items).toHaveLength(3);
    });

    it('should render bold and italic', () => {
      // Given: markdown content with formatting
      const content = '**bold text** and *italic text*';

      // When: the preview renders
      const { container } = render(<MarkdownPreview content={content} />);

      // Then: formatting should be rendered
      expect(container.querySelector('strong')).toHaveTextContent('bold text');
      expect(container.querySelector('em')).toHaveTextContent('italic text');
    });
  });

  describe('Scenario 3: Render GitHub Flavored Markdown', () => {
    it('should render tables', () => {
      // Given: markdown content with a table
      const content = `
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
      `;

      // When: the preview renders
      const { container } = render(<MarkdownPreview content={content} />);

      // Then: table should be rendered
      expect(container.querySelector('table')).toBeInTheDocument();
      expect(container.querySelector('thead')).toBeInTheDocument();
      expect(container.querySelector('tbody')).toBeInTheDocument();
    });

    it('should render strikethrough', () => {
      // Given: markdown content with strikethrough
      const content = '~~strikethrough text~~';

      // When: the preview renders
      const { container } = render(<MarkdownPreview content={content} />);

      // Then: strikethrough should be rendered
      expect(container.querySelector('del')).toHaveTextContent('strikethrough text');
    });

    it('should render task lists', () => {
      // Given: markdown content with task lists
      const content = '- [ ] Incomplete task\n- [x] Complete task';

      // When: the preview renders
      const { container } = render(<MarkdownPreview content={content} />);

      // Then: checkboxes should be rendered
      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes).toHaveLength(2);
      expect(checkboxes[0]).not.toBeChecked();
      expect(checkboxes[1]).toBeChecked();
    });
  });

  describe('Scenario 4: Apply GitHub-style CSS', () => {
    it('should have markdown-body class for GitHub styling', () => {
      // Given: markdown content
      const content = '# Test';

      // When: the preview renders
      render(<MarkdownPreview content={content} />);

      // Then: should have GitHub-style class
      const preview = screen.getByTestId('markdown-preview');
      expect(preview).toHaveClass('markdown-body');
    });
  });

  describe('Scenario 5: Update preview when content changes', () => {
    it('should update when content prop changes', () => {
      // Given: initial content
      const { container, rerender } = render(<MarkdownPreview content="# Initial" />);

      // Then: initial content should be rendered
      expect(container.querySelector('h1')).toHaveTextContent('Initial');

      // When: content changes
      rerender(<MarkdownPreview content="# Updated" />);

      // Then: updated content should be rendered
      expect(container.querySelector('h1')).toHaveTextContent('Updated');
    });
  });

  describe('Scenario 6: Sanitize HTML to prevent XSS', () => {
    it('should remove script tags', () => {
      // Given: content with script tag
      const content = '<script>alert("XSS")</script>\n# Safe Content';

      // When: the preview renders
      const { container } = render(<MarkdownPreview content={content} />);

      // Then: script should be removed
      expect(container.querySelector('script')).not.toBeInTheDocument();
      expect(container.querySelector('h1')).toHaveTextContent('Safe Content');
    });

    it('should remove dangerous event handlers', () => {
      // Given: content with onclick handler
      const content = '<img src="x" onerror="alert(\'XSS\')" />';

      // When: the preview renders
      const { container } = render(<MarkdownPreview content={content} />);

      // Then: onerror should be removed
      const img = container.querySelector('img');
      if (img) {
        expect(img.getAttribute('onerror')).toBeNull();
      }
    });
  });
});

describe('MarkdownPreview - Unit Tests (TDD)', () => {
  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      render(<MarkdownPreview content="" />);
      expect(screen.getByTestId('markdown-preview')).toBeInTheDocument();
    });

    it('should render with content', () => {
      const { container } = render(<MarkdownPreview content="# Test" />);
      expect(container.querySelector('h1')).toBeInTheDocument();
    });
  });

  describe('Code Blocks', () => {
    it('should render code blocks', async () => {
      const content = '```javascript\nconst x = 1;\n```';
      render(<MarkdownPreview content={content} />);

      // Code should be rendered (either with syntax highlighting or fallback)
      await waitFor(() => {
        expect(screen.getByText('const x = 1;')).toBeInTheDocument();
      });
    });

    it('should render inline code', () => {
      const content = 'Some `inline code` here';
      const { container } = render(<MarkdownPreview content={content} />);

      expect(container.querySelector('code')).toHaveTextContent('inline code');
    });
  });

  describe('Links', () => {
    it('should render links', () => {
      const content = '[Link Text](https://example.com)';
      const { container } = render(<MarkdownPreview content={content} />);

      const link = container.querySelector('a');
      expect(link).toHaveTextContent('Link Text');
      expect(link).toHaveAttribute('href', 'https://example.com');
    });
  });
});
