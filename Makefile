.PHONY: start server test test-watch test-ui test-coverage test-install

PORT ?= 8088
PYTHON := python3

server:
	@echo "Starting development server on http://localhost:$(PORT)"
	@echo "Press Ctrl+C to stop"
	@$(PYTHON) -m http.server $(PORT)

test:
	@echo "Installing dependencies..."
	@npm install
	@echo "Running tests..."
	@npm test
