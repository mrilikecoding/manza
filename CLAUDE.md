# Manza - Project Context for Claude

## Project Overview

Manza is an open-source, lightweight markdown editor and viewer designed for developers, technical writers, and note-takers. The name is inspired by the Pacific Manzanita plant, symbolizing resilience and regeneration.

### Mission Statement
Provide a "dead simple" markdown editing experience with beautiful GitHub-style rendering, combining powerful editing capabilities with exceptional performance and simplicity.

## Technology Stack

### Backend
- **Framework:** Tauri (Rust-based desktop application framework)
- **Language:** Rust (stable channel)
- **Purpose:** Native file system operations, low-level performance, small bundle size

### Frontend
- **Framework:** React 18+
- **Language:** TypeScript (strict mode enabled)
- **Build Tool:** Vite (fast, modern, Tauri-compatible)
- **Package Manager:** Yarn
- **State Management:** Zustand or React Context API
- **Styling:** Tailwind CSS + GitHub Primer CSS
- **UI Components:** Radix UI or Headless UI

### Key Libraries
- **Markdown Parsing:** markdown-it or marked + remark ecosystem
- **Code Highlighting:** Shiki (preferred for quality) or PrismJS
- **Math Rendering:** KaTeX (fast LaTeX rendering)
- **Diagram Support:** Mermaid
- **Editor Component:** CodeMirror 6 or Monaco Editor
- **File Watching:** chokidar + Tauri's native FS API

### Testing
- **Unit Testing:** Vitest (fast, Vite-native, ESM support)
- **Component Testing:** React Testing Library
- **User Interactions:** @testing-library/user-event
- **Rust Testing:** cargo test
- **Coverage Target:** >70% test coverage
- **Strategy:** BDD + TDD driven development

## Architecture Overview

### Application Structure
```
Frontend (React/TS) <-> Tauri Bridge <-> Backend (Rust)
     |                                        |
     v                                        v
Split-Pane UI                         File System API
- File Explorer (left)                - Read/Write Files
- Editor (center)                     - Watch for Changes
- Live Preview (right)                - Directory Operations
```

### Core Components

1. **File Explorer**
   - Tree-based file browser
   - CRUD operations (create, rename, delete files/folders)
   - Keyboard navigation (arrow keys, Enter, Delete)
   - File filtering and search
   - Dotfile handling

2. **Editor**
   - Markdown-optimized code editor
   - Syntax highlighting for markdown
   - Keyboard shortcuts (Ctrl+B for bold, etc.)
   - Auto-save functionality
   - Undo/redo support

3. **Preview Pane**
   - Live rendering of markdown
   - GitHub Flavored Markdown (GFM) support
   - LaTeX math rendering (inline and block)
   - Mermaid diagram rendering
   - Code syntax highlighting (100+ languages)
   - GitHub-style CSS

## Performance Requirements

### Critical Metrics
- **Startup Time:** < 2 seconds (cold start)
- **Memory Usage:** < 150MB (base), < 200MB (with 5MB file loaded)
- **Preview Latency:** < 50ms from typing to preview update
- **File Size Support:** Smooth handling up to 10MB files
- **UI Responsiveness:** < 100ms for all user interactions

### Quality Targets
- Zero critical bugs in production releases
- >70% unit test coverage
- Cross-platform compatibility (macOS primary, Linux/Windows supported)

## Development Principles

### 1. Simplicity First
- Clean, intuitive UI following GitHub's design language
- Minimal feature bloat - focus on core markdown editing
- Easy installation via Homebrew (macOS)

### 2. Performance Matters
- Tauri for native performance vs Electron alternatives
- Lazy loading for preview components
- Efficient file watching and caching
- Optimized rendering pipelines

### 3. Local First
- No cloud dependencies or analytics
- All files stored locally
- Privacy-focused design
- Offline-capable by design

### 4. Keyboard Friendly
- Comprehensive keyboard shortcuts
- Vim-style navigation support
- Quick file switching (Ctrl+P)
- Accessible UI components

## Key Features

### Markdown Support
- **GitHub Flavored Markdown (GFM)**
  - Tables
  - Task lists (checkboxes)
  - Strikethrough
  - Autolinks
  - Emoji shortcodes
- **Extended Syntax**
  - LaTeX math (inline: `$...$`, block: `$$...$$`)
  - Mermaid diagrams (flowcharts, sequence diagrams, etc.)
  - Code blocks with syntax highlighting (100+ languages)
  - Footnotes
  - Definition lists

### User Experience
- Split-pane interface with resizable panels
- Light and dark themes (GitHub-styled)
- Real-time preview updates
- File tree with search/filter
- Command palette for quick actions
- Drag-and-drop file support

### Cross-Platform
- **macOS** (primary target, Homebrew distribution)
- **Linux** (AppImage distribution)
- **Windows** (MSI/exe installer)

## Competitive Positioning

### Advantages Over Alternatives
- **vs Typora:** Free and open source (Typora is paid)
- **vs Mark Text:** Lighter weight (Tauri vs Electron)
- **vs Obsidian:** Simpler, focused on editing not knowledge management
- **vs VSCode:** Specialized for markdown, faster startup
- **vs GitHub.com preview:** Offline, local-first, full-featured editor

### Target Bundle Size
- macOS: ~15-25MB (vs 100MB+ for Electron apps)
- Memory footprint: <150MB (vs 300-500MB for Electron apps)

## Code Quality Standards

### TypeScript
- Strict mode enabled (`strict: true`)
- No implicit any
- Null safety enforced
- Proper type definitions for all components

### Linting
- ESLint with TypeScript and React plugins
- Prettier for consistent formatting
- Blocking pre-commit hooks (must pass to commit)

### Rust
- cargo clippy for linting
- rustfmt for formatting
- Standard Rust idioms and patterns

### Testing Requirements
- Unit tests for all business logic
- Component tests for React components
- Integration tests for Tauri commands
- E2E tests for critical user flows
- Minimum 70% code coverage
- BDD scenarios for feature acceptance criteria

## File Structure

```
manza/
├── .claude/
│   └── settings.json           # Claude Code configuration with hooks
├── .github/
│   ├── workflows/              # CI/CD pipelines
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/
│   ├── CONTRIBUTING.md
│   ├── ARCHITECTURE.md
│   └── USER_GUIDE.md
├── src-tauri/                  # Rust backend
│   ├── src/
│   │   ├── main.rs            # Application entry point
│   │   ├── fs.rs              # File system operations
│   │   └── commands.rs        # Tauri commands exposed to frontend
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/                        # React frontend
│   ├── components/
│   │   ├── FileExplorer/      # Tree-based file browser
│   │   ├── Editor/            # CodeMirror/Monaco wrapper
│   │   ├── Preview/           # Markdown rendering
│   │   └── Layout/            # Split-pane layout
│   ├── hooks/                 # React custom hooks
│   ├── utils/                 # Helper functions
│   ├── styles/                # Tailwind + custom CSS
│   ├── __tests__/             # Test files
│   ├── App.tsx
│   └── main.tsx
├── tests/
│   ├── e2e/                   # End-to-end tests
│   └── integration/           # Integration tests
├── public/                     # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vitest.config.ts
├── .eslintrc.js
├── .prettierrc
├── .gitignore
├── Makefile                    # Development tasks
├── CLAUDE.md                   # This file
├── RELEASE.md                  # Release strategy
├── LICENSE                     # MIT License
├── README.md                   # Public documentation
└── CHANGELOG.md                # Version history
```

## Development Workflow

### Git Flow Strategy

**Branch Strategy:**
- `main` - Stable, production-ready code
- `feature/*` - Feature development branches
- `bugfix/*` - Bug fix branches
- `release/*` - Release preparation branches

**Workflow:**
1. Work directly on `main` for initial setup and configuration
2. Once code development begins, create feature branches
3. Use PR workflow for merging features back to `main`
4. Tag releases on `main` branch

**Branch Naming:**
```bash
feature/file-explorer      # New feature
feature/markdown-preview   # New feature
bugfix/save-crash         # Bug fix
release/v1.0.0            # Release prep
```

**When to Branch:**
- Initial project setup (configs, tooling) → work on `main`
- Starting code implementation → create `feature/*` branch
- Bug fixes after initial release → create `bugfix/*` branch

### BDD → TDD Development Workflow

**Important:** This is the required workflow for all feature development.

**Exception:** Initial project setup (Tauri initialization, basic scaffolding) may proceed without full BDD/TDD coverage as it's primarily configuration. Once we have the foundation, all features MUST follow this workflow.

#### Step 1: Specification (BDD)
Write behavior scenarios in Given/When/Then format:

```gherkin
Feature: File Explorer
  Scenario: User opens a directory
    Given the application is running
    When the user selects a directory
    Then the file tree displays all files and folders
    And markdown files are highlighted
```

Store scenarios in test files or comments for traceability.

#### Step 2: Write Failing Tests (TDD Red)
```typescript
describe('FileExplorer', () => {
  it('should display files when directory is selected', () => {
    // Arrange
    const mockFiles = [{ name: 'README.md', type: 'file' }];

    // Act
    render(<FileExplorer files={mockFiles} />);

    // Assert
    expect(screen.getByText('README.md')).toBeInTheDocument();
  });
});
```

Run tests: `make test-watch` → Tests should fail (Red phase)

#### Step 3: Implement Minimal Code (TDD Green)
Write just enough code to make tests pass:

```typescript
export function FileExplorer({ files }) {
  return (
    <ul>
      {files.map(file => <li key={file.name}>{file.name}</li>)}
    </ul>
  );
}
```

Run tests: `make test-watch` → Tests should pass (Green phase)

#### Step 4: Refactor (TDD Refactor)
Improve code quality while keeping tests green:
- Extract components
- Improve naming
- Add TypeScript types
- Optimize performance

Run tests continuously to ensure nothing breaks.

#### Step 5: Verify Coverage
```bash
make test-coverage  # Must maintain >70% coverage
```

### Setup
```bash
make install    # Install dependencies (Node + Rust)
make setup      # Initial project setup
```

### Daily Development
```bash
make dev        # Start dev server with hot reload
make test-watch # Run tests in watch mode (TDD)
make lint       # Check code quality
```

### Before Committing
Pre-commit hooks will automatically run:
- ESLint (blocking)
- TypeScript type check (blocking)
- Prettier formatting (blocking)
- Rust clippy + rustfmt (blocking)

### Release Process
See RELEASE.md for complete release strategy.

## Success Metrics

### Technical Metrics
- Startup time consistently under 2 seconds
- Memory usage under 150MB baseline
- Test coverage maintained above 70%
- Zero critical bugs per release
- Build success rate > 95% in CI

### User Experience Metrics
- Fast preview updates (< 50ms perceived lag)
- Responsive UI (no blocking operations)
- Smooth scrolling and editing for large files
- Cross-platform feature parity

## Common Commands for Claude

When working on this project, Claude should use:

```bash
# Setup and dependencies
make install          # First-time setup
make clean            # Clean build artifacts

# Development
make dev             # Start development server
make build           # Production build
make test            # Run all tests
make test-watch      # TDD watch mode
make lint            # Check code quality
make lint-fix        # Auto-fix linting issues
make fmt             # Format all code
make typecheck       # TypeScript type checking

# Testing
make test-unit       # Unit tests only
make test-coverage   # Generate coverage report
make test-bdd        # Run BDD scenarios

# Release
make version-bump    # Interactive version bumping
make changelog       # Update CHANGELOG.md
make package-all     # Build all platform packages
make release-minor   # Full minor release flow
```

## Important Notes for Claude

1. **Always run tests before committing** - Pre-commit hooks will block anyway
2. **Follow BDD+TDD workflow** - Write tests first, then implementation
3. **Respect performance budgets** - Profile before optimizing, but keep metrics in mind
4. **Maintain test coverage** - 70% minimum threshold is enforced
5. **Use Make tasks** - Don't run commands directly, use the Makefile
6. **Update CHANGELOG.md** - Document all notable changes
7. **GitHub-style markdown** - The preview should match GitHub's rendering exactly
8. **Keyboard accessibility** - Every feature should have keyboard shortcuts
9. **Cross-platform considerations** - Test on all platforms when possible
10. **Local-first philosophy** - Never add cloud dependencies without explicit approval
11. **No AI attribution** - Do not add AI attribution to commits, releases, or code

## Resources

- **Requirements Spec:** `manza-requirements-spec.md` (comprehensive feature list)
- **Release Strategy:** `RELEASE.md` (versioning and distribution)
- **Tauri Docs:** https://tauri.app/
- **React Docs:** https://react.dev/
- **Vitest Docs:** https://vitest.dev/
- **GitHub Primer CSS:** https://primer.style/css/
