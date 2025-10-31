# Manza - Markdown Editor/Viewer Requirements Specification

**Version:** 1.0  
**Date:** October 28, 2025  
**Project Type:** Open Source, Installable Desktop Application

---

## 1. Project Overview

### 1.1 Name & Inspiration
- **Name:** Manza (shortened from Manzanita)
- **Inspiration:** Pacific Manzanita (*Arctostaphylos*), a resilient, drought-tolerant shrub native to the Pacific Northwest/Oregon with beautiful mahogany bark and the ability to regenerate after fire
- **Metaphor:** Like the manzanita's ability to persist and regenerate, Manza helps preserve and manage markdown content with resilience

### 1.2 Vision Statement
A dead simple, lightweight, open-source markdown editor and viewer that combines beautiful GitHub-style rendering with powerful editing capabilities, installable via Homebrew and designed for developers who value simplicity and performance.

### 1.3 Target Audience
- Developers and technical writers
- Note-takers who prefer markdown
- Documentation authors
- Anyone who needs a fast, local-first markdown tool

---

## 2. Core Requirements

### 2.1 Critical Features (Must Have)

#### 2.1.1 File Explorer
- **Tree-based file browser** with hierarchical folder structure
  - Expandable/collapsible folders (clicking folders expands/collapses them)
  - Navigate into subdirectories (make subdirectory the current root)
  - Navigate up to parent directory (cd .. functionality)
  - Breadcrumb or path display showing current directory
- **Show dotfiles** (files/folders starting with `.`)
- **File operations:**
  - Open files
  - Create new files
  - Delete files (with confirmation)
  - Rename files
  - Create new folders
- **File filtering:**
  - Filter by filename
  - Show only markdown files option
- **File watching:** Auto-refresh when files change on disk
- **Keyboard navigation:** Full keyboard support for file tree

#### 2.1.2 Markdown Editing
- **Resizable split-pane interface:**
  - Editor on left, live preview on right
  - Draggable divider to resize panes
  - Ability to collapse/expand editor pane (preview-only mode)
  - Ability to collapse/expand preview pane (editor-only mode)
  - Persist pane sizes in user preferences
- **Syntax highlighting** in editor for markdown
- **Line numbers** in editor
- **Basic editor features:**
  - Find/Replace
  - Undo/Redo
  - Multi-line editing
  - Auto-save option
- **Markdown-specific helpers:**
  - Auto-paired brackets/quotes
  - Markdown shortcuts (Cmd/Ctrl+B for bold, etc.)

#### 2.1.3 GitHub-Style Rendering
- **Full GitHub Flavored Markdown (GFM) support:**
  - Tables
  - Task lists
  - Strikethrough
  - Autolinks
  - Emoji
- **Syntax highlighting** for code blocks (100+ languages)
- **LaTeX/Math rendering:**
  - Inline math: `$...$`
  - Block math: `$$...$$`
  - Use KaTeX for fast rendering
- **Mermaid diagram rendering:**
  - Flowcharts
  - Sequence diagrams
  - Gantt charts
  - Class diagrams
  - State diagrams
  - Other Mermaid diagram types
- **GitHub CSS styling:**
  - Clean, readable typography
  - Proper spacing and margins
  - Code block styling matching GitHub

#### 2.1.4 Performance
- **Fast startup:** < 2 seconds on modern hardware
- **Low memory footprint:** < 150MB RAM for typical usage
- **Instant preview updates:** < 50ms lag between typing and preview
- **Large file support:** Handle files up to 10MB smoothly

#### 2.1.5 Cross-Platform
- **macOS support** (primary target for Homebrew)
- **Linux support**
- **Windows support**

---

## 3. Technical Architecture

### 3.1 Framework & Technology Stack

#### 3.1.1 Application Framework
- **Tauri** (Rust backend + web frontend)
  - Rationale: Lightweight (vs Electron), native performance, excellent security
  - Smaller bundle size (~3-5MB vs 150MB+ for Electron)
  - Lower memory usage
  - Built-in security features

#### 3.1.2 Frontend Stack
- **React 18+** with TypeScript
- **State Management:** React Context API or Zustand
- **Styling:** Tailwind CSS + GitHub Primer CSS
- **Component Library:** Radix UI or Headless UI for accessible primitives

#### 3.1.3 Core Libraries
- **Markdown Parsing:**
  - `markdown-it` or `marked` for parsing
  - `remark` ecosystem for GFM support
- **Code Highlighting:**
  - `prismjs` or `shiki` (shiki preferred for better highlighting)
- **Math Rendering:**
  - `katex` (faster than MathJax, better for real-time)
- **Diagram Rendering:**
  - `mermaid` official library
- **Editor:**
  - `codemirror 6` or `monaco-editor` for code editing
  - Markdown-specific extensions
- **File System:**
  - Tauri's file system API
  - `chokidar` for file watching

### 3.2 Project Structure

```
manza/
├── src-tauri/           # Rust backend
│   ├── src/
│   │   ├── main.rs      # Entry point
│   │   ├── fs.rs        # File system operations
│   │   └── commands.rs  # Tauri commands
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/                 # Frontend
│   ├── components/
│   │   ├── FileExplorer/
│   │   │   ├── FileTree.tsx
│   │   │   ├── FileItem.tsx
│   │   │   └── FileActions.tsx
│   │   ├── Editor/
│   │   │   ├── MarkdownEditor.tsx
│   │   │   └── EditorToolbar.tsx
│   │   ├── Preview/
│   │   │   ├── MarkdownPreview.tsx
│   │   │   ├── MathRenderer.tsx
│   │   │   └── MermaidRenderer.tsx
│   │   └── Layout/
│   │       ├── SplitPane.tsx
│   │       └── AppLayout.tsx
│   ├── hooks/
│   │   ├── useFileSystem.ts
│   │   ├── useMarkdown.ts
│   │   └── useEditorState.ts
│   ├── utils/
│   │   ├── markdown.ts
│   │   └── fileUtils.ts
│   ├── styles/
│   │   └── github-markdown.css
│   ├── App.tsx
│   └── main.tsx
├── public/
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

---

## 4. Functional Requirements

### 4.1 File Management

#### FR-1: Directory Selection
- **Description:** User can select a root directory to browse
- **Acceptance Criteria:**
  - Native directory picker dialog
  - Selected directory persists across sessions
  - Recent directories list (last 10)

#### FR-2: File Tree Display
- **Description:** Display files and folders in a tree structure
- **Acceptance Criteria:**
  - Collapsible/expandable folders
  - Icons for different file types
  - Dotfiles visible by default
  - Sorted alphabetically (folders first)

#### FR-3: File Operations
- **Description:** Create, rename, delete files and folders
- **Acceptance Criteria:**
  - Right-click context menu
  - Keyboard shortcuts
  - Confirmation dialogs for destructive operations
  - Undo not required (use git/backups)

### 4.2 Editor Functionality

#### FR-4: Markdown Editing
- **Description:** Edit markdown files with syntax highlighting
- **Acceptance Criteria:**
  - Syntax highlighting for markdown
  - Line numbers
  - Auto-save after 2 seconds of inactivity
  - Manual save (Cmd/Ctrl+S)

#### FR-5: Editor Shortcuts
- **Description:** Common markdown shortcuts
- **Acceptance Criteria:**
  - Cmd/Ctrl+B: Bold
  - Cmd/Ctrl+I: Italic
  - Cmd/Ctrl+K: Link
  - Cmd/Ctrl+Shift+C: Code block
  - Tab: Indent
  - Shift+Tab: Outdent

### 4.3 Preview Functionality

#### FR-6: Live Preview
- **Description:** Real-time rendering of markdown
- **Acceptance Criteria:**
  - Updates within 50ms of typing
  - Synchronized scroll position
  - GitHub-style CSS

#### FR-7: LaTeX Rendering
- **Description:** Render mathematical expressions
- **Acceptance Criteria:**
  - Inline: `$x^2$` renders as x²
  - Block: `$$\frac{1}{2}$$` renders as centered equation
  - Error handling for invalid syntax

#### FR-8: Mermaid Rendering
- **Description:** Render Mermaid diagrams
- **Acceptance Criteria:**
  - Flowcharts render correctly
  - Sequence diagrams render correctly
  - Error messages for invalid syntax
  - Click to view full-size

#### FR-9: Code Highlighting
- **Description:** Syntax highlight code blocks
- **Acceptance Criteria:**
  - Support 100+ languages
  - Line numbers optional
  - Copy code button

### 4.4 User Interface

#### FR-10: Split Pane Layout
- **Description:** Resizable split between editor and preview
- **Acceptance Criteria:**
  - Drag divider to resize
  - Remember size across sessions
  - Minimum 20% width for each pane

#### FR-11: Theme Support
- **Description:** Light and dark themes
- **Acceptance Criteria:**
  - Light theme (GitHub light)
  - Dark theme (GitHub dark)
  - Follow system theme preference
  - Theme toggle in menu

#### FR-12: Keyboard Navigation
- **Description:** Full keyboard accessibility
- **Acceptance Criteria:**
  - Tab navigation works
  - Cmd/Ctrl+P: File finder
  - Cmd/Ctrl+O: Open directory
  - Cmd/Ctrl+F: Find in file
  - Escape: Close dialogs

---

## 5. Non-Functional Requirements

### 5.1 Performance

#### NFR-1: Startup Time
- Application starts in < 2 seconds on modern hardware

#### NFR-2: Memory Usage
- Base memory < 100MB
- With large file (5MB) open < 200MB

#### NFR-3: Preview Latency
- Preview updates in < 50ms after typing stops

#### NFR-4: File Size Support
- Files up to 10MB render smoothly
- Files 10-50MB work with warnings
- Files > 50MB: preview-only mode

### 5.2 Reliability

#### NFR-5: Data Safety
- Auto-save every 2 seconds
- No data loss on crash (save to temp file)
- Clear error messages for file system errors

#### NFR-6: File Format Support
- `.md`, `.markdown`, `.mdown` extensions
- UTF-8 encoding
- Handle other encodings gracefully

### 5.3 Usability

#### NFR-7: Learning Curve
- First-time users can open and edit file within 30 seconds
- No tutorial required for basic usage

#### NFR-8: Responsive UI
- UI responds within 100ms to all interactions
- Loading indicators for operations > 500ms

### 5.4 Maintainability

#### NFR-9: Code Quality
- TypeScript strict mode
- ESLint configured
- Unit test coverage > 70%
- Documented component APIs

#### NFR-10: Build Process
- Single command build: `npm run build`
- Development mode with hot reload
- Production builds optimized

---

## 6. Distribution & Installation

### 6.1 Homebrew Installation (macOS)

#### Primary Distribution Method
```bash
brew install manza
```

**Requirements:**
- Homebrew Cask formula
- Signed .dmg or .app bundle
- Auto-update mechanism

#### Cask Formula Structure
```ruby
cask "manza" do
  version "1.0.0"
  sha256 "..."
  
  url "https://github.com/username/manza/releases/download/v#{version}/manza-#{version}.dmg"
  name "Manza"
  desc "Dead simple markdown editor with GitHub-style rendering"
  homepage "https://github.com/username/manza"
  
  app "Manza.app"
  
  zap trash: [
    "~/Library/Application Support/com.manza.app",
    "~/Library/Preferences/com.manza.app.plist",
  ]
end
```

### 6.2 Alternative Installation Methods

#### Linux
- **AppImage:** Single-file executable
- **Debian package:** `.deb` for Ubuntu/Debian
- **Arch AUR:** Community package

#### Windows
- **Installer:** `.msi` or `.exe` installer
- **Portable:** `.zip` with executable

### 6.3 Updates
- GitHub Releases for distribution
- In-app update checker (optional)
- Semantic versioning (semver)

---

## 7. Open Source Requirements

### 7.1 License
- **MIT License** (permissive, allows commercial use)
- Clear LICENSE file in repository
- Copyright notice in source files

### 7.2 Repository Structure
```
manza/
├── .github/
│   ├── workflows/        # CI/CD
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/
│   ├── CONTRIBUTING.md
│   ├── ARCHITECTURE.md
│   └── USER_GUIDE.md
├── src/
├── tests/
├── .gitignore
├── LICENSE
├── README.md
└── CHANGELOG.md
```

### 7.3 Documentation
- **README.md:**
  - Project description
  - Installation instructions
  - Quick start guide
  - Screenshots
  - Contributing link
- **CONTRIBUTING.md:**
  - Development setup
  - Code style guide
  - PR process
  - Testing requirements
- **CHANGELOG.md:**
  - Version history
  - Breaking changes
  - New features

### 7.4 Community
- GitHub Issues for bug tracking
- GitHub Discussions for Q&A
- Contributing guidelines
- Code of Conduct

---

## 8. Future Enhancements (Post-MVP)

### 8.1 Phase 2 Features
- [ ] Export to PDF/HTML
- [ ] Find in files (search across directory)
- [ ] Git integration indicators
- [ ] Custom CSS themes
- [ ] Plugin system
- [ ] Vim keybindings mode
- [ ] Table editor
- [ ] Image paste from clipboard
- [ ] Spell checker

### 8.2 Phase 3 Features
- [ ] Collaborative editing
- [ ] Cloud sync integration
- [ ] Mobile companion app
- [ ] Presentation mode
- [ ] Outline/TOC sidebar
- [ ] Backlinks (Obsidian-style)

---

## 9. Success Metrics

### 9.1 Technical Metrics
- Bundle size < 10MB
- Startup time < 2s
- Memory usage < 150MB
- Preview lag < 50ms
- Test coverage > 70%

### 9.2 User Metrics
- GitHub stars (target: 1000 in first year)
- Homebrew installs (track via analytics)
- Issue response time < 48 hours
- Active contributors > 5

### 9.3 Quality Metrics
- Zero critical bugs in production
- 95% of issues have responses
- Regular releases (monthly)

---

## 10. Technical Constraints

### 10.1 Browser Engine
- Uses system WebView (via Tauri)
- Must support ES2020+
- Modern CSS features

### 10.2 File System
- Local files only (no cloud services in MVP)
- Respect system file permissions
- Handle symlinks gracefully

### 10.3 Security
- No network requests (except updates)
- Sandboxed file system access
- No arbitrary code execution

---

## 11. Out of Scope (MVP)

The following features are explicitly **not** included in the MVP:

- ❌ WYSIWYG editing mode
- ❌ Cloud storage integration
- ❌ Real-time collaboration
- ❌ Mobile apps
- ❌ Web version
- ❌ Document encryption
- ❌ Version history/snapshots (use git)
- ❌ Template system
- ❌ Macro/scripting language
- ❌ Database backend
- ❌ User accounts/authentication

---

## 12. Development Timeline & Progress Tracking

### Phase 1: Foundation (Weeks 1-2) ✅ COMPLETE
- [x] Project setup (Configuration files, tooling)
- [x] Tauri initialization and configuration
- [x] Basic React + TypeScript app structure
- [x] Basic file explorer component
- [x] Simple markdown editor (CodeMirror 6)
- [x] Basic preview pane
- [x] **App integration (FileExplorer + Editor + Preview wired together)**
- [x] **State management for file selection and content flow**
- [x] **Directory selection and file browsing**
- [x] **File loading into editor with live preview**
- [x] **Auto-save (2 seconds) and manual save (Cmd+S)**
- [x] **Error handling for file operations**

### Phase 2: Core Features (Weeks 3-4) ✅ COMPLETE
- [x] GitHub Flavored Markdown support (tables, task lists, strikethrough)
- [x] **Resizable panes with draggable dividers**
- [x] **Collapsible editor/preview panes**
- [x] **Tree-style folder navigation (expand/collapse folders)**
- [x] **Navigate up/down directory hierarchy (cd .. and into subdirs)**
- [x] **Current directory breadcrumb/path display**
- [x] Code syntax highlighting (Shiki integration)
- [x] LaTeX rendering (KaTeX)
- [x] Mermaid diagram rendering
- [x] File operations (create, delete, rename)
- [x] File watching and auto-refresh

### Phase 3: Polish (Weeks 5-6)
- [ ] Light theme (GitHub light)
- [ ] Dark theme (GitHub dark)
- [ ] System theme detection
- [ ] Keyboard shortcuts implementation
- [ ] Performance optimization (lazy loading, virtualization)
- [ ] Error handling and user feedback
- [ ] Auto-save functionality

### Phase 4: Distribution (Week 7)
- [ ] Build scripts for all platforms
- [ ] macOS .dmg creation
- [ ] Linux AppImage
- [ ] Windows installer
- [ ] Homebrew cask formula
- [ ] GitHub releases automation
- [ ] README.md with screenshots
- [ ] User documentation

### Phase 5: Launch (Week 8)
- [ ] MIT License file
- [ ] CONTRIBUTING.md
- [ ] CODE_OF_CONDUCT.md
- [ ] GitHub Issues templates
- [ ] Open source release announcement
- [ ] Community setup (Discussions, etc.)
- [ ] Marketing (Show HN, Reddit, Twitter)

---

## 13. Design Principles

1. **Simplicity First:** If a feature adds complexity, it needs strong justification
2. **Performance Matters:** Every interaction should feel instant
3. **Local First:** Files stay on user's machine, no cloud lock-in
4. **Keyboard Friendly:** Power users should never need the mouse
5. **Beautiful Defaults:** Works great out of the box, zero configuration
6. **Open & Transparent:** Open source, community-driven development
7. **Respect Standards:** Follow GFM, CommonMark, and web standards

---

## 14. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Tauri learning curve | Medium | Medium | Allocate extra time for R&D, use examples |
| Performance with large files | High | Medium | Implement virtual scrolling, lazy loading |
| Cross-platform bugs | Medium | High | Test on all platforms early, CI/CD |
| Feature creep | High | Medium | Strict MVP scope, defer features to v2 |
| Low adoption | Medium | Medium | Good marketing, solve real problem |
| Maintenance burden | Medium | Low | Keep codebase simple, good documentation |

---

## 15. Appendix

### 15.1 Glossary
- **GFM:** GitHub Flavored Markdown
- **LaTeX:** Document preparation system for math/science
- **KaTeX:** Fast LaTeX rendering library
- **Mermaid:** Diagram and flowchart rendering
- **Tauri:** Framework for building desktop apps with web tech
- **MVP:** Minimum Viable Product

### 15.2 References
- [CommonMark Spec](https://commonmark.org/)
- [GitHub Flavored Markdown Spec](https://github.github.com/gfm/)
- [Tauri Documentation](https://tauri.app/)
- [KaTeX Documentation](https://katex.org/)
- [Mermaid Documentation](https://mermaid-js.github.io/)

### 15.3 Competitive Analysis
- **Typora:** Paid, WYSIWYG, heavy, closed source
- **Mark Text:** Open source, but heavy (Electron)
- **iA Writer:** Minimal but paid, no advanced rendering
- **Obsidian:** Heavy, complex, not simple
- **VSCode:** Full IDE, overkill for markdown

**Manza's Differentiator:** Dead simple, lightweight, free, open source, GitHub-style rendering with LaTeX/Mermaid, Homebrew installable.

---

**Document Status:** Draft v1.0  
**Last Updated:** October 28, 2025  
**Next Review:** After MVP implementation
