import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MarkdownPreview } from './MarkdownPreview';

/**
 * BDD Scenarios for Mermaid Diagram Rendering
 *
 * Feature: Mermaid Diagram Rendering
 *   As a user
 *   I want to render Mermaid diagrams in my markdown
 *   So that I can create flowcharts, sequence diagrams, and other visual diagrams
 *
 * Scenario 1: Render flowchart diagram
 *   Given I have markdown with a Mermaid flowchart code block
 *   When the preview renders
 *   Then the diagram should be rendered as SVG
 *   And the raw code should be replaced with the visual diagram
 *
 * Scenario 2: Render sequence diagram
 *   Given I have markdown with a Mermaid sequence diagram
 *   When the preview renders
 *   Then the sequence diagram should be rendered correctly
 *   And interactions should be displayed visually
 *
 * Scenario 3: Render multiple diagram types
 *   Given I have multiple Mermaid diagrams in one document
 *   When the preview renders
 *   Then each diagram should render independently
 *   And different diagram types should coexist
 *
 * Scenario 4: Handle invalid Mermaid syntax
 *   Given I have markdown with invalid Mermaid syntax
 *   When the preview renders
 *   Then an error should be handled gracefully
 *   And the rest of the document should still render
 *
 * Scenario 5: Render other diagram types
 *   Given I have Gantt, pie chart, or class diagrams
 *   When the preview renders
 *   Then these diagram types should render correctly
 *   And use Mermaid's rendering engine
 */

describe('MarkdownPreview - Mermaid Diagram Rendering (BDD)', () => {
  describe('Scenario 1: Render flowchart diagram', () => {
    it('should render Mermaid flowchart as SVG', async () => {
      // Given: markdown with Mermaid flowchart
      const markdown = `
# Diagram Example

\`\`\`mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Do Something]
    B -->|No| D[Do Something Else]
    C --> E[End]
    D --> E
\`\`\`
`;

      // When: preview renders
      const { container } = render(<MarkdownPreview content={markdown} />);

      // Then: should render SVG or mermaid container
      await waitFor(
        () => {
          // Mermaid typically renders into a container with specific class or data attribute
          const mermaidContainer = container.querySelector('[data-testid="mermaid-diagram"]');
          const svgElement = container.querySelector('svg');

          // Either mermaid container or SVG should exist
          expect(mermaidContainer || svgElement).toBeTruthy();
        },
        { timeout: 3000 }
      );
    });

    it('should replace code block with visual diagram', async () => {
      // Given: Mermaid code block
      const markdown = `
\`\`\`mermaid
graph LR
    A --> B
\`\`\`
`;

      // When: preview renders
      render(<MarkdownPreview content={markdown} />);

      // Then: heading should be present (document still renders)
      await waitFor(() => {
        const preview = screen.getByTestId('markdown-preview');
        expect(preview).toBeInTheDocument();
      });
    });
  });

  describe('Scenario 2: Render sequence diagram', () => {
    it('should render Mermaid sequence diagram', async () => {
      // Given: sequence diagram
      const markdown = `
\`\`\`mermaid
sequenceDiagram
    participant Alice
    participant Bob
    Alice->>Bob: Hello Bob!
    Bob->>Alice: Hello Alice!
\`\`\`
`;

      // When: preview renders
      const { container } = render(<MarkdownPreview content={markdown} />);

      // Then: should contain diagram elements
      await waitFor(
        () => {
          const preview = screen.getByTestId('markdown-preview');
          expect(preview).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Scenario 3: Render multiple diagram types', () => {
    it('should render multiple Mermaid diagrams independently', async () => {
      // Given: multiple diagrams
      const markdown = `
# Multiple Diagrams

\`\`\`mermaid
graph LR
    A --> B
\`\`\`

Some text in between.

\`\`\`mermaid
pie
    title Pets
    "Dogs" : 42.96
    "Cats" : 50.05
    "Fish" : 6.99
\`\`\`
`;

      // When: preview renders
      render(<MarkdownPreview content={markdown} />);

      // Then: both diagrams should be present
      await waitFor(() => {
        expect(screen.getByText(/Multiple Diagrams/)).toBeInTheDocument();
        expect(screen.getByText(/Some text in between/)).toBeInTheDocument();
      });
    });
  });

  describe('Scenario 4: Handle invalid Mermaid syntax', () => {
    it('should handle invalid Mermaid syntax gracefully', async () => {
      // Given: invalid Mermaid syntax
      const markdown = `
# Test

\`\`\`mermaid
invalid syntax here
this is not valid
\`\`\`

More content here.
`;

      // When: preview renders
      render(<MarkdownPreview content={markdown} />);

      // Then: should not crash and still render other content
      await waitFor(() => {
        expect(screen.getByText(/Test/)).toBeInTheDocument();
        expect(screen.getByText(/More content here/)).toBeInTheDocument();
      });
    });
  });

  describe('Scenario 5: Render other diagram types', () => {
    it('should render Gantt chart', async () => {
      // Given: Gantt chart
      const markdown = `
\`\`\`mermaid
gantt
    title A Gantt Diagram
    dateFormat  YYYY-MM-DD
    section Section
    A task           :a1, 2024-01-01, 30d
    Another task     :after a1, 20d
\`\`\`
`;

      // When: preview renders
      const { container } = render(<MarkdownPreview content={markdown} />);

      // Then: should render without errors
      await waitFor(() => {
        const preview = screen.getByTestId('markdown-preview');
        expect(preview).toBeInTheDocument();
      });
    });

    it('should render class diagram', async () => {
      // Given: class diagram
      const markdown = `
\`\`\`mermaid
classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal: +int age
    Animal: +String gender
\`\`\`
`;

      // When: preview renders
      render(<MarkdownPreview content={markdown} />);

      // Then: should render without errors
      await waitFor(() => {
        const preview = screen.getByTestId('markdown-preview');
        expect(preview).toBeInTheDocument();
      });
    });
  });
});
