.PHONY: server

PORT ?= 8088
PYTHON := python3

server:
	@echo "⭐️ starting development server on http://localhost:$(PORT)"
	@$(PYTHON) -m http.server $(PORT)
