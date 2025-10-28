.PHONY: help install setup clean dev build build-debug test test-unit test-coverage test-watch test-bdd test-e2e lint lint-fix fmt typecheck clippy pre-commit-checks coverage-check version-bump changelog release-patch release-minor release-major package-all package-macos package-linux package-windows publish docs docs-serve deps-update security-audit

# Default target - show help
.DEFAULT_GOAL := help

# Colors for output
COLOR_RESET   = \033[0m
COLOR_INFO    = \033[36m
COLOR_SUCCESS = \033[32m
COLOR_WARNING = \033[33m

##@ Setup Commands

install: ## Install all dependencies (Node.js via Yarn and Rust via Cargo)
	@echo "$(COLOR_INFO)Installing Node.js dependencies...$(COLOR_RESET)"
	@yarn install
	@echo "$(COLOR_INFO)Installing Rust dependencies...$(COLOR_RESET)"
	@cd src-tauri && cargo fetch
	@echo "$(COLOR_SUCCESS)✓ All dependencies installed$(COLOR_RESET)"

setup: install ## Initial project setup (install deps + verify environment)
	@echo "$(COLOR_INFO)Verifying environment...$(COLOR_RESET)"
	@node --version
	@yarn --version
	@rustc --version
	@cargo --version
	@echo "$(COLOR_SUCCESS)✓ Environment setup complete$(COLOR_RESET)"
	@echo "$(COLOR_INFO)Run 'make dev' to start development$(COLOR_RESET)"

clean: ## Clean all build artifacts and caches
	@echo "$(COLOR_INFO)Cleaning build artifacts...$(COLOR_RESET)"
	@rm -rf node_modules
	@rm -rf dist
	@rm -rf src-tauri/target
	@rm -rf coverage
	@rm -rf .turbo
	@yarn cache clean
	@cd src-tauri && cargo clean
	@echo "$(COLOR_SUCCESS)✓ Cleaned all build artifacts$(COLOR_RESET)"

##@ Development Commands

dev: ## Start development server with hot reload
	@echo "$(COLOR_INFO)Starting development server...$(COLOR_RESET)"
	@yarn tauri dev

build: ## Build production version of the application
	@echo "$(COLOR_INFO)Building production application...$(COLOR_RESET)"
	@yarn tauri build
	@echo "$(COLOR_SUCCESS)✓ Production build complete$(COLOR_RESET)"

build-debug: ## Build debug version with symbols for troubleshooting
	@echo "$(COLOR_INFO)Building debug application...$(COLOR_RESET)"
	@yarn tauri build --debug
	@echo "$(COLOR_SUCCESS)✓ Debug build complete$(COLOR_RESET)"

##@ Testing Commands (BDD + TDD)

test: ## Run all tests (unit + integration + e2e)
	@echo "$(COLOR_INFO)Running all tests...$(COLOR_RESET)"
	@yarn test
	@cd src-tauri && cargo test
	@echo "$(COLOR_SUCCESS)✓ All tests passed$(COLOR_RESET)"

test-unit: ## Run unit tests only (frontend + backend)
	@echo "$(COLOR_INFO)Running unit tests...$(COLOR_RESET)"
	@yarn test:unit
	@cd src-tauri && cargo test --lib
	@echo "$(COLOR_SUCCESS)✓ Unit tests passed$(COLOR_RESET)"

test-coverage: ## Generate test coverage report (enforces 70% threshold)
	@echo "$(COLOR_INFO)Generating coverage report...$(COLOR_RESET)"
	@yarn test:coverage
	@echo "$(COLOR_INFO)Opening coverage report...$(COLOR_RESET)"
	@open coverage/index.html || xdg-open coverage/index.html

test-watch: ## Run tests in watch mode (TDD workflow)
	@echo "$(COLOR_INFO)Starting test watch mode (TDD)...$(COLOR_RESET)"
	@yarn test:watch

test-bdd: ## Run BDD scenarios (Gherkin-style acceptance tests)
	@echo "$(COLOR_INFO)Running BDD scenarios...$(COLOR_RESET)"
	@yarn test:bdd
	@echo "$(COLOR_SUCCESS)✓ BDD scenarios passed$(COLOR_RESET)"

test-e2e: ## Run end-to-end tests (full application flow)
	@echo "$(COLOR_INFO)Running E2E tests...$(COLOR_RESET)"
	@yarn test:e2e
	@echo "$(COLOR_SUCCESS)✓ E2E tests passed$(COLOR_RESET)"

coverage-check: ## Verify test coverage meets 70% threshold (used by hooks)
	@echo "$(COLOR_INFO)Checking coverage threshold...$(COLOR_RESET)"
	@yarn test:coverage --reporter=json --reporter=text-summary | grep -q "70" && echo "$(COLOR_SUCCESS)✓ Coverage threshold met$(COLOR_RESET)" || (echo "$(COLOR_WARNING)⚠ Coverage below 70%$(COLOR_RESET)" && exit 1)

##@ Code Quality Commands

lint: ## Run ESLint and Rust Clippy checks
	@echo "$(COLOR_INFO)Running linters...$(COLOR_RESET)"
	@yarn lint
	@cd src-tauri && cargo clippy -- -D warnings
	@echo "$(COLOR_SUCCESS)✓ No linting errors$(COLOR_RESET)"

lint-fix: ## Auto-fix linting issues where possible
	@echo "$(COLOR_INFO)Auto-fixing linting issues...$(COLOR_RESET)"
	@yarn lint:fix
	@cd src-tauri && cargo clippy --fix --allow-dirty --allow-staged
	@echo "$(COLOR_SUCCESS)✓ Linting issues fixed$(COLOR_RESET)"

fmt: ## Format all code (Prettier + rustfmt)
	@echo "$(COLOR_INFO)Formatting code...$(COLOR_RESET)"
	@yarn format
	@cd src-tauri && cargo fmt
	@echo "$(COLOR_SUCCESS)✓ Code formatted$(COLOR_RESET)"

typecheck: ## Run TypeScript type checking (strict mode)
	@echo "$(COLOR_INFO)Running TypeScript type checks...$(COLOR_RESET)"
	@yarn typecheck
	@echo "$(COLOR_SUCCESS)✓ No type errors$(COLOR_RESET)"

clippy: ## Run Rust Clippy linter with strict settings
	@echo "$(COLOR_INFO)Running Rust Clippy...$(COLOR_RESET)"
	@cd src-tauri && cargo clippy --all-targets --all-features -- -D warnings
	@echo "$(COLOR_SUCCESS)✓ Clippy checks passed$(COLOR_RESET)"

pre-commit-checks: lint fmt typecheck ## Run all pre-commit quality checks (used by git hooks)
	@echo "$(COLOR_SUCCESS)✓ All pre-commit checks passed$(COLOR_RESET)"

##@ Release Commands

version-bump: ## Interactive version bump (prompts for major/minor/patch)
	@echo "$(COLOR_INFO)Current version: $$(grep '"version"' package.json | head -1 | sed 's/.*: "\(.*\)".*/\1/')$(COLOR_RESET)"
	@echo "Select version bump type:"
	@echo "  1) Patch (bug fixes)        X.Y.Z → X.Y.Z+1"
	@echo "  2) Minor (new features)     X.Y.Z → X.Y+1.0"
	@echo "  3) Major (breaking changes) X.Y.Z → X+1.0.0"
	@read -p "Enter choice [1-3]: " choice; \
	case $$choice in \
		1) $(MAKE) release-patch ;; \
		2) $(MAKE) release-minor ;; \
		3) $(MAKE) release-major ;; \
		*) echo "$(COLOR_WARNING)Invalid choice$(COLOR_RESET)" && exit 1 ;; \
	esac

changelog: ## Update CHANGELOG.md for the current version
	@echo "$(COLOR_INFO)Updating CHANGELOG.md...$(COLOR_RESET)"
	@VERSION=$$(grep '"version"' package.json | head -1 | sed 's/.*: "\(.*\)".*/\1/'); \
	DATE=$$(date +%Y-%m-%d); \
	echo "## [$$VERSION] - $$DATE" >> CHANGELOG.md.tmp; \
	echo "" >> CHANGELOG.md.tmp; \
	echo "### Added" >> CHANGELOG.md.tmp; \
	echo "- " >> CHANGELOG.md.tmp; \
	echo "" >> CHANGELOG.md.tmp; \
	echo "### Fixed" >> CHANGELOG.md.tmp; \
	echo "- " >> CHANGELOG.md.tmp; \
	echo "" >> CHANGELOG.md.tmp; \
	cat CHANGELOG.md >> CHANGELOG.md.tmp || touch CHANGELOG.md; \
	mv CHANGELOG.md.tmp CHANGELOG.md
	@echo "$(COLOR_SUCCESS)✓ CHANGELOG.md updated - please edit and fill in changes$(COLOR_RESET)"
	@echo "$(COLOR_INFO)Opening CHANGELOG.md for editing...$(COLOR_RESET)"

release-patch: ## Create patch release (X.Y.Z → X.Y.Z+1)
	@echo "$(COLOR_INFO)Creating patch release...$(COLOR_RESET)"
	@yarn version patch --no-git-tag-version
	@$(MAKE) update-rust-version
	@$(MAKE) changelog
	@VERSION=$$(grep '"version"' package.json | head -1 | sed 's/.*: "\(.*\)".*/\1/'); \
	git add package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json CHANGELOG.md; \
	git commit -m "chore: bump version to $$VERSION"; \
	git tag -a "v$$VERSION" -m "Release v$$VERSION"
	@echo "$(COLOR_SUCCESS)✓ Patch release created$(COLOR_RESET)"
	@echo "$(COLOR_INFO)Push with: git push origin main --tags$(COLOR_RESET)"

release-minor: ## Create minor release (X.Y.Z → X.Y+1.0)
	@echo "$(COLOR_INFO)Creating minor release...$(COLOR_RESET)"
	@yarn version minor --no-git-tag-version
	@$(MAKE) update-rust-version
	@$(MAKE) changelog
	@VERSION=$$(grep '"version"' package.json | head -1 | sed 's/.*: "\(.*\)".*/\1/'); \
	git add package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json CHANGELOG.md; \
	git commit -m "chore: bump version to $$VERSION"; \
	git tag -a "v$$VERSION" -m "Release v$$VERSION"
	@echo "$(COLOR_SUCCESS)✓ Minor release created$(COLOR_RESET)"
	@echo "$(COLOR_INFO)Push with: git push origin main --tags$(COLOR_RESET)"

release-major: ## Create major release (X.Y.Z → X+1.0.0)
	@echo "$(COLOR_INFO)Creating major release...$(COLOR_RESET)"
	@yarn version major --no-git-tag-version
	@$(MAKE) update-rust-version
	@$(MAKE) changelog
	@VERSION=$$(grep '"version"' package.json | head -1 | sed 's/.*: "\(.*\)".*/\1/'); \
	git add package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json CHANGELOG.md; \
	git commit -m "chore: bump version to $$VERSION"; \
	git tag -a "v$$VERSION" -m "Release v$$VERSION"
	@echo "$(COLOR_SUCCESS)✓ Major release created$(COLOR_RESET)"
	@echo "$(COLOR_INFO)Push with: git push origin main --tags$(COLOR_RESET)"

update-rust-version: ## Sync version from package.json to Rust files (internal use)
	@VERSION=$$(grep '"version"' package.json | head -1 | sed 's/.*: "\(.*\)".*/\1/'); \
	sed -i.bak "s/^version = .*/version = \"$$VERSION\"/" src-tauri/Cargo.toml && rm src-tauri/Cargo.toml.bak; \
	sed -i.bak "s/\"version\": \".*\"/\"version\": \"$$VERSION\"/" src-tauri/tauri.conf.json && rm src-tauri/tauri.conf.json.bak
	@echo "$(COLOR_SUCCESS)✓ Rust version files updated$(COLOR_RESET)"

##@ Distribution Commands

package-all: package-macos package-linux package-windows ## Build packages for all platforms

package-macos: ## Build macOS .dmg installer
	@echo "$(COLOR_INFO)Building macOS package...$(COLOR_RESET)"
	@yarn tauri build --target universal-apple-darwin
	@echo "$(COLOR_SUCCESS)✓ macOS package created$(COLOR_RESET)"
	@ls -lh src-tauri/target/release/bundle/dmg/*.dmg

package-linux: ## Build Linux AppImage
	@echo "$(COLOR_INFO)Building Linux package...$(COLOR_RESET)"
	@yarn tauri build --target x86_64-unknown-linux-gnu
	@echo "$(COLOR_SUCCESS)✓ Linux package created$(COLOR_RESET)"
	@ls -lh src-tauri/target/release/bundle/appimage/*.AppImage

package-windows: ## Build Windows .msi installer
	@echo "$(COLOR_INFO)Building Windows package...$(COLOR_RESET)"
	@yarn tauri build --target x86_64-pc-windows-msvc
	@echo "$(COLOR_SUCCESS)✓ Windows package created$(COLOR_RESET)"
	@ls -lh src-tauri/target/release/bundle/msi/*.msi

publish: ## Publish release (push tag to trigger CI/CD)
	@echo "$(COLOR_INFO)Publishing release...$(COLOR_RESET)"
	@VERSION=$$(grep '"version"' package.json | head -1 | sed 's/.*: "\(.*\)".*/\1/'); \
	echo "$(COLOR_WARNING)About to push v$$VERSION to remote$(COLOR_RESET)"; \
	read -p "Continue? [y/N]: " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		git push origin main --tags; \
		echo "$(COLOR_SUCCESS)✓ Release published - CI will build and create GitHub release$(COLOR_RESET)"; \
	else \
		echo "$(COLOR_INFO)Publish cancelled$(COLOR_RESET)"; \
	fi

##@ Documentation Commands

docs: ## Generate documentation
	@echo "$(COLOR_INFO)Generating documentation...$(COLOR_RESET)"
	@yarn docs:generate
	@cd src-tauri && cargo doc --no-deps
	@echo "$(COLOR_SUCCESS)✓ Documentation generated$(COLOR_RESET)"

docs-serve: ## Serve documentation locally
	@echo "$(COLOR_INFO)Serving documentation at http://localhost:3001$(COLOR_RESET)"
	@yarn docs:serve

##@ Maintenance Commands

deps-update: ## Update all dependencies (Node.js + Rust)
	@echo "$(COLOR_INFO)Updating dependencies...$(COLOR_RESET)"
	@yarn upgrade-interactive
	@cd src-tauri && cargo update
	@echo "$(COLOR_SUCCESS)✓ Dependencies updated$(COLOR_RESET)"

security-audit: ## Run security audit on dependencies
	@echo "$(COLOR_INFO)Running security audit...$(COLOR_RESET)"
	@yarn audit
	@cd src-tauri && cargo audit
	@echo "$(COLOR_SUCCESS)✓ Security audit complete$(COLOR_RESET)"

##@ Helper Commands

help: ## Show this help message
	@echo "$(COLOR_INFO)Manza - Makefile Commands$(COLOR_RESET)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make $(COLOR_INFO)<target>$(COLOR_RESET)\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(COLOR_INFO)%-20s$(COLOR_RESET) %s\n", $$1, $$2 } /^##@/ { printf "\n$(COLOR_SUCCESS)%s$(COLOR_RESET)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(COLOR_INFO)Examples:$(COLOR_RESET)"
	@echo "  make setup          # First-time project setup"
	@echo "  make dev            # Start development server"
	@echo "  make test-watch     # TDD workflow (watch mode)"
	@echo "  make lint-fix       # Auto-fix code quality issues"
	@echo "  make release-minor  # Create and tag minor release"
	@echo ""
