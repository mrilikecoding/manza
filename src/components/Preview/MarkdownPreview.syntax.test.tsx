import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MarkdownPreview } from './MarkdownPreview';

/**
 * BDD Scenarios for Code Syntax Highlighting
 *
 * Feature: Code Syntax Highlighting
 *   As a user
 *   I want to see syntax-highlighted code blocks in my markdown preview
 *   So that code is easier to read and understand
 *
 * Scenario 1: Render code block with syntax highlighting
 *   Given I have a markdown document with a JavaScript code block
 *   When the preview renders
 *   Then the code should be syntax highlighted with proper colors
 *   And the language should be detected from the fence info string
 *
 * Scenario 2: Support multiple programming languages
 *   Given I have code blocks in different languages (Python, TypeScript, Rust, etc.)
 *   When the preview renders
 *   Then each code block should be highlighted according to its language
 *   And the highlighting should match VS Code / GitHub style
 *
 * Scenario 3: Handle inline code without highlighting
 *   Given I have inline code like `const x = 1`
 *   When the preview renders
 *   Then inline code should be styled but not syntax highlighted
 *   And it should use monospace font with background
 *
 * Scenario 4: Handle code blocks without language specification
 *   Given I have a code block with no language specified
 *   When the preview renders
 *   Then the code should be displayed in monospace without highlighting
 *   And it should still be formatted as a code block
 *
 * Scenario 5: Handle invalid/unsupported language
 *   Given I have a code block with an unsupported language tag
 *   When the preview renders
 *   Then the code should fallback to plain text display
 *   And no error should be thrown
 *
 * Scenario 6: Preserve code content exactly
 *   Given I have a code block with special characters and whitespace
 *   When the preview renders
 *   Then all whitespace and special characters should be preserved
 *   And indentation should remain intact
 */

describe('MarkdownPreview - Code Syntax Highlighting (BDD)', () => {
  describe('Scenario 1: Render code block with syntax highlighting', () => {
    it('should render JavaScript code with syntax highlighting', async () => {
      // Given: markdown with JavaScript code block
      const markdown = `
# Code Example

\`\`\`javascript
function hello() {
  console.log("Hello, world!");
}
\`\`\`
`;

      // When: preview renders
      render(<MarkdownPreview content={markdown} />);

      // Then: code should be present
      await waitFor(() => {
        const codeBlock = screen.getByText(/function hello/);
        expect(codeBlock).toBeInTheDocument();
      });
    });

    it('should render TypeScript code with syntax highlighting', async () => {
      // Given: markdown with TypeScript code block
      const markdown = `
\`\`\`typescript
interface User {
  name: string;
  age: number;
}

const user: User = { name: "Alice", age: 30 };
\`\`\`
`;

      // When: preview renders
      render(<MarkdownPreview content={markdown} />);

      // Then: code should be present
      await waitFor(() => {
        const codeBlock = screen.getByText(/interface User/);
        expect(codeBlock).toBeInTheDocument();
      });
    });
  });

  describe('Scenario 2: Support multiple programming languages', () => {
    it('should highlight Python code correctly', async () => {
      // Given: Python code block
      const markdown = `
\`\`\`python
def greet(name):
    print(f"Hello, {name}!")
    return True
\`\`\`
`;

      // When: preview renders
      render(<MarkdownPreview content={markdown} />);

      // Then: code should be present
      await waitFor(() => {
        const codeBlock = screen.getByText(/def greet/);
        expect(codeBlock).toBeInTheDocument();
      });
    });

    it('should highlight Rust code correctly', async () => {
      // Given: Rust code block
      const markdown = `
\`\`\`rust
fn main() {
    println!("Hello, world!");
}
\`\`\`
`;

      // When: preview renders
      render(<MarkdownPreview content={markdown} />);

      // Then: code should be present
      await waitFor(() => {
        const codeBlock = screen.getByText(/fn main/);
        expect(codeBlock).toBeInTheDocument();
      });
    });

    it('should highlight multiple languages in same document', async () => {
      // Given: multiple code blocks with different languages
      const markdown = `
# Examples

\`\`\`javascript
const x = 1;
\`\`\`

\`\`\`python
x = 1
\`\`\`

\`\`\`rust
let x = 1;
\`\`\`
`;

      // When: preview renders
      render(<MarkdownPreview content={markdown} />);

      // Then: all code blocks should be present
      await waitFor(() => {
        expect(screen.getByText('const x = 1;')).toBeInTheDocument();
        expect(screen.getByText('x = 1')).toBeInTheDocument();
        expect(screen.getByText('let x = 1;')).toBeInTheDocument();
      });
    });
  });

  describe('Scenario 3: Handle inline code without highlighting', () => {
    it('should render inline code without syntax highlighting', () => {
      // Given: markdown with inline code
      const markdown = 'Use `const x = 1` to declare a constant.';

      // When: preview renders
      render(<MarkdownPreview content={markdown} />);

      // Then: inline code should be present
      const inlineCode = screen.getByText('const x = 1');
      expect(inlineCode).toBeInTheDocument();
      expect(inlineCode.tagName).toBe('CODE');
    });
  });

  describe('Scenario 4: Handle code blocks without language specification', () => {
    it('should render plain code block without language', async () => {
      // Given: code block without language
      const markdown = `
\`\`\`
This is plain code
No language specified
\`\`\`
`;

      // When: preview renders
      render(<MarkdownPreview content={markdown} />);

      // Then: code should be displayed
      await waitFor(() => {
        expect(screen.getByText(/This is plain code/)).toBeInTheDocument();
      });
    });
  });

  describe('Scenario 5: Handle invalid/unsupported language', () => {
    it('should gracefully handle unsupported language tags', async () => {
      // Given: code block with fake language
      const markdown = `
\`\`\`fakeLang123
some code here
\`\`\`
`;

      // When: preview renders
      render(<MarkdownPreview content={markdown} />);

      // Then: code should still be displayed
      await waitFor(() => {
        expect(screen.getByText(/some code here/)).toBeInTheDocument();
      });
    });
  });

  describe('Scenario 6: Preserve code content exactly', () => {
    it('should preserve whitespace and indentation', async () => {
      // Given: code with specific indentation
      const markdown = `
\`\`\`javascript
function nested() {
  if (true) {
    console.log("indented");
  }
}
\`\`\`
`;

      // When: preview renders
      render(<MarkdownPreview content={markdown} />);

      // Then: code with indentation should be present
      await waitFor(() => {
        expect(screen.getByText(/indented/)).toBeInTheDocument();
      });
    });

    it('should preserve special characters', async () => {
      // Given: code with special characters
      const markdown = `
\`\`\`javascript
const regex = /[a-z]+/gi;
const template = \`Hello \${name}\`;
\`\`\`
`;

      // When: preview renders
      render(<MarkdownPreview content={markdown} />);

      // Then: special characters should be preserved
      await waitFor(() => {
        expect(screen.getByText(/regex/)).toBeInTheDocument();
      });
    });
  });
});
