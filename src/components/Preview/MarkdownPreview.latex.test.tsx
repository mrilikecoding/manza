import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MarkdownPreview } from './MarkdownPreview';

/**
 * BDD Scenarios for LaTeX Math Rendering
 *
 * Feature: LaTeX Math Rendering
 *   As a user
 *   I want to render mathematical expressions in my markdown
 *   So that I can write technical documentation with formulas
 *
 * Scenario 1: Render inline math expressions
 *   Given I have markdown with inline math like $x^2$
 *   When the preview renders
 *   Then the math should be rendered with KaTeX
 *   And it should appear inline with the text
 *
 * Scenario 2: Render block math expressions
 *   Given I have markdown with block math like $$\frac{1}{2}$$
 *   When the preview renders
 *   Then the math should be rendered as a centered block
 *   And it should use KaTeX for rendering
 *
 * Scenario 3: Support complex mathematical notation
 *   Given I have complex math expressions (integrals, summations, matrices)
 *   When the preview renders
 *   Then all mathematical notation should render correctly
 *   And special symbols should display properly
 *
 * Scenario 4: Handle invalid LaTeX syntax
 *   Given I have markdown with invalid LaTeX syntax
 *   When the preview renders
 *   Then an error should be displayed instead of breaking the page
 *   And the rest of the markdown should still render
 *
 * Scenario 5: Mix inline and block math in same document
 *   Given I have both inline math and block math in one document
 *   When the preview renders
 *   Then both types should render correctly
 *   And they should not interfere with each other
 */

describe('MarkdownPreview - LaTeX Math Rendering (BDD)', () => {
  describe('Scenario 1: Render inline math expressions', () => {
    it('should render inline math with KaTeX', async () => {
      // Given: markdown with inline math
      const markdown = 'The equation is $x^2 + y^2 = z^2$ which is famous.';

      // When: preview renders
      render(<MarkdownPreview content={markdown} />);

      // Then: should contain math elements (KaTeX adds specific classes)
      await waitFor(() => {
        const preview = screen.getByTestId('markdown-preview');
        // KaTeX renders math with .katex or .katex-html classes
        const mathElements = preview.querySelectorAll('.katex, .katex-html');
        expect(mathElements.length).toBeGreaterThan(0);
      });
    });

    it('should render inline math inline with text', async () => {
      // Given: text with inline math
      const markdown = 'Let $f(x) = x^2$ be a function.';

      // When: preview renders
      render(<MarkdownPreview content={markdown} />);

      // Then: text should be present
      await waitFor(() => {
        expect(screen.getByText(/Let/)).toBeInTheDocument();
        expect(screen.getByText(/be a function/)).toBeInTheDocument();
      });
    });
  });

  describe('Scenario 2: Render block math expressions', () => {
    it('should render block math with KaTeX', async () => {
      // Given: markdown with block math
      const markdown = `
Here is a block equation:

$$
\\frac{1}{2}
$$

End of equation.
`;

      // When: preview renders
      render(<MarkdownPreview content={markdown} />);

      // Then: should contain math block elements
      await waitFor(() => {
        const preview = screen.getByTestId('markdown-preview');
        const mathElements = preview.querySelectorAll('.katex-display, .katex');
        expect(mathElements.length).toBeGreaterThan(0);
      });
    });

    it('should render block math as centered block', async () => {
      // Given: block math
      const markdown = `
$$
E = mc^2
$$
`;

      // When: preview renders
      const { container } = render(<MarkdownPreview content={markdown} />);

      // Then: should have display math class
      await waitFor(() => {
        const displayMath = container.querySelector('.katex-display');
        expect(displayMath).toBeInTheDocument();
      });
    });
  });

  describe('Scenario 3: Support complex mathematical notation', () => {
    it('should render integrals and summations', async () => {
      // Given: complex math with integrals
      const markdown = `
$$
\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}
$$
`;

      // When: preview renders
      render(<MarkdownPreview content={markdown} />);

      // Then: should render without errors
      await waitFor(() => {
        const preview = screen.getByTestId('markdown-preview');
        const mathElements = preview.querySelectorAll('.katex');
        expect(mathElements.length).toBeGreaterThan(0);
      });
    });

    it('should render fractions and superscripts', async () => {
      // Given: math with fractions
      const markdown = 'The formula $\\frac{a}{b} + c^{d}$ is correct.';

      // When: preview renders
      render(<MarkdownPreview content={markdown} />);

      // Then: should render math
      await waitFor(() => {
        const preview = screen.getByTestId('markdown-preview');
        const mathElements = preview.querySelectorAll('.katex');
        expect(mathElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Scenario 4: Handle invalid LaTeX syntax', () => {
    it('should handle invalid LaTeX gracefully', async () => {
      // Given: invalid LaTeX syntax
      const markdown = 'Bad math: $\\invalid{syntax}$ here.';

      // When: preview renders
      render(<MarkdownPreview content={markdown} />);

      // Then: should not crash and still render text
      await waitFor(() => {
        expect(screen.getByText(/Bad math/)).toBeInTheDocument();
      });
    });
  });

  describe('Scenario 5: Mix inline and block math in same document', () => {
    it('should render both inline and block math correctly', async () => {
      // Given: markdown with both inline and block math
      const markdown = `
# Math Example

Inline math: $a^2 + b^2 = c^2$

Block math:

$$
\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}
$$

More text with $x = 5$ inline.
`;

      // When: preview renders
      const { container } = render(<MarkdownPreview content={markdown} />);

      // Then: should have both inline and display math
      await waitFor(() => {
        const inlineMath = container.querySelectorAll('.katex:not(.katex-display)');
        const displayMath = container.querySelectorAll('.katex-display');

        // Should have at least some math elements
        expect(inlineMath.length + displayMath.length).toBeGreaterThan(0);
      });
    });
  });
});
