# Manza Release Strategy

## Overview

This document outlines the release strategy for Manza, including versioning, build processes, distribution channels, and quality gates.

## Semantic Versioning

Manza follows [Semantic Versioning 2.0.0](https://semver.org/) (MAJOR.MINOR.PATCH):

### Version Format: `X.Y.Z`

- **MAJOR (X):** Incompatible API changes or breaking changes
  - Examples: Complete UI redesign, file format changes, removed features
  - User action may be required to upgrade

- **MINOR (Y):** New features in a backward-compatible manner
  - Examples: New markdown extensions, new keyboard shortcuts, new themes
  - No user action required, opt-in features

- **PATCH (Z):** Backward-compatible bug fixes and performance improvements
  - Examples: Fix preview lag, fix file save issues, security patches
  - Safe to auto-update, no behavior changes

### Pre-release Versions

For testing and early access:
- **Alpha:** `X.Y.Z-alpha.N` - Early development, unstable, internal testing
- **Beta:** `X.Y.Z-beta.N` - Feature complete, external testing, may have bugs
- **Release Candidate:** `X.Y.Z-rc.N` - Final testing before stable release

Example progression: `1.2.0-alpha.1` → `1.2.0-beta.1` → `1.2.0-rc.1` → `1.2.0`

## Release Triggers

### When to Release PATCH (Z)

Trigger a patch release for:
- Critical bug fixes (crashes, data loss, security vulnerabilities)
- Performance regressions
- Minor UI bugs affecting usability
- Documentation fixes
- Dependency security updates

**Frequency:** As needed, typically 1-2 weeks for minor bugs, immediately for critical issues

**Example:** `1.2.3` → `1.2.4` (fixes file save bug)

### When to Release MINOR (Y)

Trigger a minor release for:
- New features (new markdown syntax support, new UI components)
- New keyboard shortcuts or commands
- New themes or customization options
- Significant performance improvements
- New platform support

**Frequency:** Monthly or when feature set is ready

**Example:** `1.2.4` → `1.3.0` (adds Mermaid diagram support)

### When to Release MAJOR (X)

Trigger a major release for:
- Breaking changes to user workflows
- Removed or changed features
- New architecture requiring migration
- File format changes
- Major UI/UX overhauls

**Frequency:** Annually or as strategic roadmap dictates

**Example:** `1.9.3` → `2.0.0` (new plugin system, breaking API changes)

## Release Process

### 1. Pre-Release Checklist

Before starting a release, ensure:

- [ ] All tests pass (`make test`)
- [ ] Test coverage is ≥70% (`make test-coverage`)
- [ ] No linting errors (`make lint`)
- [ ] TypeScript type checks pass (`make typecheck`)
- [ ] Rust clippy checks pass (`make clippy`)
- [ ] Documentation is up to date
- [ ] CHANGELOG.md is updated with all changes since last release
- [ ] All open bugs for this milestone are resolved or moved
- [ ] Performance benchmarks meet targets (startup <2s, memory <150MB)
- [ ] Manual testing completed on all target platforms:
  - [ ] macOS (primary platform)
  - [ ] Linux (secondary)
  - [ ] Windows (secondary)

### 2. Version Bumping

Use the Makefile to bump versions:

```bash
# Patch release (1.2.3 → 1.2.4)
make release-patch

# Minor release (1.2.4 → 1.3.0)
make release-minor

# Major release (1.9.5 → 2.0.0)
make release-major

# Custom version bump
make version-bump
```

This will:
1. Update version in `package.json`
2. Update version in `src-tauri/Cargo.toml`
3. Update version in `src-tauri/tauri.conf.json`
4. Prompt for CHANGELOG.md update
5. Create a git commit: `chore: bump version to X.Y.Z`
6. Create a git tag: `vX.Y.Z`

### 3. Changelog Update

Update `CHANGELOG.md` following [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features and capabilities

### Changed
- Changes to existing functionality

### Deprecated
- Features that will be removed in future releases

### Removed
- Features that have been removed

### Fixed
- Bug fixes

### Security
- Security fixes and patches
```

Use the command:
```bash
make changelog
```

### 4. Build Process

Build packages for all platforms:

```bash
# Build all platforms
make package-all

# Or build individually
make package-macos      # Creates .dmg for macOS
make package-linux      # Creates .AppImage for Linux
make package-windows    # Creates .msi for Windows
```

**Build Artifacts:**
- `manza-X.Y.Z-macos.dmg` (~15-25MB)
- `manza-X.Y.Z-linux.AppImage` (~20-30MB)
- `manza-X.Y.Z-windows.msi` (~18-28MB)

### 5. Automated Checks (CI/CD)

GitHub Actions will automatically:
1. Run all tests on push to `main`
2. Run tests on all platforms (macOS, Linux, Windows)
3. Check code coverage (must be ≥70%)
4. Run linting and type checking
5. Build packages for all platforms
6. Run security audits
7. Create draft release on GitHub when tag is pushed

### 6. GitHub Release Creation

When ready to publish:

```bash
# Push tag to trigger release build
git push origin vX.Y.Z

# Or use Make task for full automation
make publish
```

This will:
1. Push the tag to GitHub
2. Trigger GitHub Actions workflow
3. Build packages for all platforms in CI
4. Create a GitHub Release with:
   - Release notes from CHANGELOG.md
   - Attached build artifacts (.dmg, .AppImage, .msi)
   - SHA256 checksums for verification

**Manual Steps:**
1. Review the draft release on GitHub
2. Edit release notes if needed
3. Mark as pre-release if beta/rc
4. Publish the release

### 7. Distribution

#### Homebrew (macOS - Primary)

After GitHub release is published:

```bash
# Update Homebrew cask
cd homebrew-manza
./update-cask.sh X.Y.Z

# This will:
# 1. Update the cask file with new version and SHA256
# 2. Test installation locally
# 3. Submit PR to homebrew/cask (if public cask)
```

Users can install/update with:
```bash
brew install manza          # First time
brew upgrade manza          # Updates
```

#### GitHub Releases (All Platforms)

All releases are available at:
```
https://github.com/mrilikecoding/manza/releases
```

Users can:
1. Download appropriate file (.dmg, .AppImage, .msi)
2. Verify SHA256 checksum
3. Install manually

#### Linux (Additional)

Consider future distribution via:
- Snap Store
- Flatpak/Flathub
- AUR (Arch User Repository)

#### Windows (Additional)

Consider future distribution via:
- Chocolatey
- Winget (Windows Package Manager)

## Release Cadence

### Regular Schedule

- **Patch Releases:** As needed (1-2 weeks for non-critical, immediate for critical)
- **Minor Releases:** Monthly, or when feature set is complete
- **Major Releases:** Annually, or when breaking changes are necessary

### Emergency Releases

For critical issues:
1. **Security Vulnerabilities:** Immediate patch release within 24-48 hours
2. **Data Loss Bugs:** Immediate patch release within 24-48 hours
3. **Critical Crashes:** Patch release within 1 week
4. **Usability Blockers:** Patch release within 1-2 weeks

## Quality Gates

### Automated Gates (Blocking)

Releases cannot proceed if:
- Test coverage drops below 70%
- Any unit tests fail
- Linting errors exist
- TypeScript type errors exist
- Rust clippy errors exist
- Build fails on any platform
- Security vulnerabilities in dependencies (high/critical severity)

### Manual Gates (Checklist)

Before release, manually verify:
- Performance benchmarks met (startup <2s, memory <150MB, preview <50ms)
- No known critical bugs in the release
- UI works correctly on all target platforms
- File operations work correctly (save, load, delete, rename)
- Markdown rendering matches GitHub's output
- Keyboard shortcuts work as expected
- Documentation is accurate

## Versioning Commands Reference

### Quick Reference

```bash
# Check current version
grep version package.json

# Bump version and update changelog
make release-patch      # Bug fixes (1.2.3 → 1.2.4)
make release-minor      # New features (1.2.4 → 1.3.0)
make release-major      # Breaking changes (1.9.5 → 2.0.0)

# Build for distribution
make package-all        # All platforms
make package-macos      # macOS only
make package-linux      # Linux only
make package-windows    # Windows only

# Publish release
git push origin vX.Y.Z  # Push tag to trigger CI/CD
make publish            # Full automated publish

# Rollback if needed
git tag -d vX.Y.Z              # Delete local tag
git push origin :refs/tags/vX.Y.Z  # Delete remote tag
```

## Rollback Strategy

If a release has critical issues:

### Option 1: Quick Patch
1. Fix the issue in a new branch
2. Fast-track patch release (X.Y.Z+1)
3. Update Homebrew cask
4. Announce the fix

### Option 2: Rollback (Rare)
1. Mark the release as deprecated on GitHub
2. Revert Homebrew cask to previous version
3. Communicate issue to users
4. Fix and re-release with new version number

**Never delete or overwrite releases** - Always move forward with new version numbers.

## Communication

### Release Announcements

For each release, announce on:
1. **GitHub Releases:** Detailed changelog with all changes
2. **README.md:** Update "Latest Release" badge
3. **Twitter/Social Media:** For major/minor releases
4. **Dev Blog:** For significant features or major versions

### Changelog Template

Use this template for GitHub releases:

```markdown
# Manza vX.Y.Z

## 🎉 Highlights

[Brief summary of the most important changes]

## ✨ What's New

- Feature 1: Description
- Feature 2: Description

## 🐛 Bug Fixes

- Fix for issue #123: Description
- Fix for issue #456: Description

## 🚀 Performance

- Improvement 1: X% faster
- Improvement 2: X% less memory

## 📚 Documentation

- Updated docs for feature X
- New tutorial for Y

## 🙏 Contributors

Thanks to all contributors who helped with this release!

---

**Full Changelog:** https://github.com/mrilikecoding/manza/compare/vX.Y.Z-1...vX.Y.Z

**Download:**
- macOS: `brew install manza` or download [manza-X.Y.Z-macos.dmg]
- Linux: Download [manza-X.Y.Z-linux.AppImage]
- Windows: Download [manza-X.Y.Z-windows.msi]
```

## Version History Tracking

Maintain `CHANGELOG.md` in the repository root with all version history. This file should:
- Follow [Keep a Changelog](https://keepachangelog.com/) format
- List all versions in reverse chronological order (newest first)
- Include dates for each release
- Group changes by type (Added, Changed, Fixed, etc.)
- Link to GitHub comparison for each version

## Future Considerations

### Auto-Update Mechanism

For future versions, consider implementing:
- In-app update notifications
- Auto-download and install updates (with user consent)
- Background update checks
- Update channels (stable, beta, nightly)

### Metrics Collection (Opt-in)

To inform release decisions:
- Anonymous usage statistics (opt-in only)
- Crash reporting
- Performance metrics
- Feature usage analytics

This would help prioritize fixes and features, but must be:
- Completely optional (opt-in)
- Privacy-preserving (anonymous)
- Transparent (open source implementation)

## Support Policy

### Version Support

- **Latest stable:** Full support (bug fixes, security patches, features)
- **Previous minor:** Security patches only for 6 months
- **Older versions:** Community support only

### Security Updates

Security vulnerabilities will be patched for:
- Current major version: All minor versions
- Previous major version: Latest minor only (for 1 year after new major)

---

**Last Updated:** 2025-10-28
**Document Version:** 1.0.0
