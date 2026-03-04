.PHONY: server test test-watch test-coverage

PORT ?= 8088
PYTHON := python3

server:
	@echo "⭐️ starting development server on http://localhost:$(PORT)"
	@$(PYTHON) -m http.server $(PORT)

test:
	npm run test

test-watch:
	npm run test:watch

test-coverage:
	npm run test:coverage
