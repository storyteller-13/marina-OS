.PHONY: help server install test test-watch test-ui test-coverage

PORT ?= 8088
PYTHON := python3

help:
	@echo "vonsteinkirch.com — make targets:"
	@echo "  make install     — npm install (also sets up git pre-commit hook to run tests)"
	@echo "  make server     — dev server at http://localhost:$(PORT)"
	@echo "  make test       — run tests once"
	@echo "  make test-watch — vitest in watch mode"
	@echo "  make test-ui    — vitest with UI"
	@echo "  make test-coverage — vitest with coverage"

server:
	@echo "⭐️ starting development server on http://localhost:$(PORT)"
	@$(PYTHON) -m http.server $(PORT)

# Install deps (login shell so nvm/fnm are on PATH). test* targets depend on this.
node_modules/.bin/vitest: package.json package-lock.json
	bash -lc 'cd "$(CURDIR)" && npm install'

install: node_modules/.bin/vitest

# Use login shell so nvm/fnm (and node) are on PATH
test: node_modules/.bin/vitest
	bash -lc 'cd "$(CURDIR)" && ./node_modules/.bin/vitest run'

test-watch: node_modules/.bin/vitest
	bash -lc 'cd "$(CURDIR)" && ./node_modules/.bin/vitest'

test-ui: node_modules/.bin/vitest
	bash -lc 'cd "$(CURDIR)" && ./node_modules/.bin/vitest --ui'

test-coverage: node_modules/.bin/vitest
	bash -lc 'cd "$(CURDIR)" && ./node_modules/.bin/vitest run --coverage'
