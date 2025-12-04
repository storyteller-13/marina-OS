.PHONY: start server test test-watch test-ui test-coverage test-install

PORT ?= 8088
PYTHON := python3

server:
	@echo "Starting development server on http://localhost:$(PORT)"
	@echo "Press Ctrl+C to stop"
	@$(PYTHON) -m http.server $(PORT)

test-install:
	@if [ ! -d "node_modules" ]; then \
		echo "Installing test dependencies..."; \
		npm install; \
	else \
		echo "Dependencies already installed."; \
	fi

test: test-install
	@echo "Running tests..."
	@npm test
